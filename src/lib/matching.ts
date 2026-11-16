import "server-only";
import { ITEM_COLUMNS, sql, type Item } from "./db";
import { captionImage } from "./ai/groq";
import { embed, embeddingText, toVector } from "./ai/embed";

export type Match = Item & { score: number; reasons: string[] };

// Raw cosine similarity between unrelated items is still ~0.4–0.55 with this model, and the
// same item described differently is ~0.8+. Rescale so 0.5 → 0 and 0.85 → 1 ("meaning" score).
const SIM_FLOOR = 0.5;
const SIM_CEIL = 0.85;
const MIN_RAW_SIM = 0.6; // below this, place/time alone can't make it a match
const MIN_SCORE = 0.4;
const DAY_WINDOW = 30;

const clamp = (n: number) => Math.max(0, Math.min(1, n));

function daysBetween(a: string, b: string) {
  return Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000);
}

function score(me: Item, other: Item, rawSim: number) {
  const meaning = clamp((rawSim - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR));
  const sameCity = other.city.toLowerCase() === me.city.toLowerCase();
  const sameState = other.state === me.state;
  const place = sameCity ? 1 : sameState ? 0.5 : 0;
  const days = daysBetween(me.event_date, other.event_date);
  const time = clamp(1 - days / DAY_WINDOW);

  const reasons: string[] = [];
  if (meaning >= 0.6) reasons.push("Very similar description");
  else if (meaning >= 0.3) reasons.push("Similar description");
  if (other.category === me.category) reasons.push(`Both ${other.category}`);
  reasons.push(sameCity ? "Same city" : sameState ? "Same state" : "Different state");
  reasons.push(days === 0 ? "Same day" : `${days} day${days === 1 ? "" : "s"} apart`);

  return { score: 0.6 * meaning + 0.2 * place + 0.2 * time, reasons };
}

/**
 * Makes sure an item has an embedding (and a photo caption if it has a photo).
 * Used on create, and again on page view if AI was down when the report was posted.
 */
export async function enrich(item: {
  category: string; title: string; description: string; place?: string | null; city: string;
  image_url?: string | null; image_caption?: string | null;
}) {
  let caption = item.image_caption ?? null;
  if (item.image_url && !caption) caption = await captionImage(item.image_url);
  const vec = await embed(embeddingText({ ...item, image_caption: caption }));
  return { caption, vector: vec ? toVector(vec) : null };
}

/** Top 5 opposite-type reports, scored on meaning (60%), place (20%) and time (20%). */
export async function findMatches(item: Item): Promise<Match[]> {
  const rows = await sql.query(`select embedding::text as embedding from items where id = $1`, [item.id]);
  let vector: string | null = rows[0]?.embedding ?? null;

  if (!vector) {
    // AI failed at submit time: retry now and save it.
    const e = await enrich(item);
    if (!e.vector) return [];
    vector = e.vector;
    await sql`update items set embedding = ${vector}::vector, image_caption = ${e.caption} where id = ${item.id}`;
  }

  const candidates = (await sql.query(
    `select ${ITEM_COLUMNS}, 1 - (embedding <=> $1::vector) as similarity
     from items
     where type = $2
       and event_date between $3::date - ${DAY_WINDOW} and $3::date + ${DAY_WINDOW}
       and embedding is not null
     order by embedding <=> $1::vector
     limit 20`,
    [vector, item.type === "lost" ? "found" : "lost", item.event_date],
  )) as (Item & { similarity: number })[];

  return candidates
    .filter((c) => c.similarity >= MIN_RAW_SIM)
    .map(({ similarity, ...c }) => ({ ...c, ...score(item, c, similarity) }))
    .filter((m) => m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Other opposite-type reports nearby (same city first, then same state), within ±30 days,
 * regardless of AI score. Lets people spot their item even if it was described poorly.
 */
export async function findNearby(item: Item, excludeIds: string[], limit = 6): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items
     where type = $1
       and state = $2
       and id <> all($3::uuid[])
       and event_date between $4::date - ${DAY_WINDOW} and $4::date + ${DAY_WINDOW}
     order by (city = $5) desc, abs(event_date - $4::date), created_at desc
     limit ${limit}`,
    [item.type === "lost" ? "found" : "lost", item.state, excludeIds, item.event_date, item.city],
  )) as Item[];
}
