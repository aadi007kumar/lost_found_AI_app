import "server-only";

// Groq's only vision model on our keys (checked via /openai/v1/models).
const MODEL = "qwen/qwen3.8-27b";
const MAX_ATTEMPTS = 4; // 1 try + up to 3 retries
const TIMEOUT_MS = 12_000;

const PROMPT =
  "Describe this object in one line for a lost-and-found search: what it is, colour, brand if " +
  "visible, and distinctive marks (scratches, stickers, cover, contents). No preamble.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function keys(): string[] {
  return (process.env.GROQ_API_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
}

/**
 * Photo → one-line caption. Rotates keys: starts on a random key, and on 429/5xx/timeout
 * waits (Retry-After, else 1s → 2s → 4s) and tries the next key. Returns null if all fail.
 */
export async function captionImage(imageUrl: string): Promise<string | null> {
  const all = keys();
  if (all.length === 0) return null;
  const start = Math.floor(Math.random() * all.length);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const key = all[(start + attempt) % all.length];
    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          max_completion_tokens: 120,
          reasoning_effort: "none",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
      });
    } catch {
      res = new Response(null, { status: 504 }); // timeout / network → retry
    }

    if (res.ok) {
      const json = await res.json();
      const text: string = json.choices?.[0]?.message?.content ?? "";
      const caption = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      return caption || null;
    }
    if (res.status !== 429 && res.status < 500) {
      console.error("Groq caption failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 1000 * 2 ** attempt;
      await sleep(wait);
    }
  }
  console.error("Groq caption: all attempts busy");
  return null;
}
