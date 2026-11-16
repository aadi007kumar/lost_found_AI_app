import "server-only";

const MODEL = "@cf/qwen/qwen3-embedding-0.6b"; // 1024 dims

/** Text → vector via Cloudflare Workers AI REST API. Returns null on failure (one retry). */
export async function embed(text: string): Promise<number[] | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${MODEL}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({ text: [text] }),
      });
      if (res.ok) {
        const json = await res.json();
        const vec: number[] | undefined = json.result?.data?.[0];
        if (vec?.length === 1024) return vec;
      }
      console.error("Cloudflare embed failed", res.status);
    } catch (e) {
      console.error("Cloudflare embed error", e);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

/** What goes into the vector: object, description, photo caption and landmark. */
export function embeddingText(i: {
  category: string;
  title: string;
  description: string;
  image_caption?: string | null;
  place?: string | null;
  city: string;
}) {
  return [
    `${i.category}: ${i.title}.`,
    i.description,
    i.image_caption ? `Photo: ${i.image_caption}` : "",
    `Place: ${[i.place, i.city].filter(Boolean).join(", ")}`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** pgvector literal, e.g. "[0.1,0.2,…]". */
export const toVector = (v: number[]) => `[${v.join(",")}]`;
