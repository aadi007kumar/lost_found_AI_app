# Lost & Found AI: MVP Plan (v2, the smallest version that works)

> **Problem statement:** Build a pan-India lost and found portal where people submit details of belongings they lost or found. AI similarity search finds records that may be related, using the object, description, images, location and time.

---

## 1. How it works

The site is a shared notice board with a smart search.

1. **Riya loses** her phone in Pune. She fills in a form: what it is, a description, a photo if she has one, where she lost it and when. The report is saved.
2. The app then **searches every "found" report** and shows her the closest ones, ranked by how alike they look, how near they are, and how close the dates are.
3. **Nothing matches yet?** Her report stays on the board.
4. **Two days later, Aman finds** a phone and reports it. The app searches every "lost" report, and Riya's appears at the top. Aman sees her contact details and calls her.
5. Riya can also reopen **her report's page** at any time. Matches are worked out fresh each time the page opens, so new "found" reports show up there.

So the app does two things: **save reports** and **search the opposite kind**. Lost reports search found ones, and found reports search lost ones.

### How "similar" is decided
- **Photo → words:** a Groq vision model looks at the photo and describes it, for example "black Samsung phone, cracked top-left corner, blue cover".
- **Words → numbers:** that caption, plus the title, category and description, goes through an embedding model, which turns the text into a vector, a list of numbers that captures its meaning. Similar items get similar vectors, so "black Samsung mobile" and "dark Samsung phone" end up close together.
- **Final score** for each candidate:
  ```
  score = 0.6 × meaning similarity   (from the vectors)
        + 0.2 × place               (1 = same city, 0.5 = same state, 0 = elsewhere)
        + 0.2 × time                (1 = same day, falling to 0 at 30 days apart)
  ```
  We show the top 5 with a score of 40% or more, with reasons such as *"Same city · 2 days apart"*.

---

## 2. Requirement coverage

| What the problem statement asks for | How we cover it |
|---|---|
| Submit **lost** items | Report form with "I lost" selected |
| Submit **found** items | The same form with "I found" selected |
| Pan-India | State dropdown (all 36 states/UTs), plus city and place |
| Similarity on **object** | Category, included in the text that gets embedded |
| Similarity on **description** | Embedding similarity |
| Similarity on **images** | Photo → AI caption → embedded with the text |
| Similarity on **location** | Place score |
| Similarity on **time** | Time score, plus a filter that only searches within ±30 days |
| Show **related records** | Matches list on the results page |

All nine are covered, and nothing else is built.

---

## 3. Scope

### ✅ Build (MVP)
**Three pages:**
1. **Home (`/`):** headline, two big buttons ("I lost something" / "I found something"), and a three-step "how it works".
2. **Report (`/report?type=lost|found`):** one form with title, category, description, one optional photo, state, city, place, date, and contact name and phone.
3. **Report page (`/items/[id]`):** shows the report and, below it, **Possible matches**. Each match card has the photo, title, place, date, match %, reason chips, and the contact details.

**Backend:** one server action (`createReport`) and one function (`findMatches`).

### ✂️ Cut (until the MVP is done)
| Cut | Why it's safe to cut |
|---|---|
| Login / accounts | Contact details sit on the report, so no login is needed |
| "Mark as resolved" | Not in the requirements |
| Browse/search-all page | Requirements only need matches, not browsing |
| Email/SMS notifications | The user can revisit their report page |
| Chat between users | Contact details are shown directly (phone, optional email) |
| Edit/delete report | Not needed for a demo |
| Multiple photos | One photo is enough to show image matching |
| Admin panel, maps, multilingual UI, LLM re-ranking, rate limiting | Extras |

### Decisions made (no friction)
- **Contact:** shown directly on match cards. Name and phone are required, email is optional. The form carries a note: "Don't enter Aadhaar/PAN/card numbers."
- **Categories (fixed):** Phone · Wallet/Purse · Bag · Documents/ID · Keys · Jewellery/Watch · Electronics · Other.

---

## 4. Tech stack (all free tier)

| Part | Choice |
|---|---|
| App (UI and backend) | **Next.js (App Router) + TypeScript**, deployed on **Vercel** |
| Styling | Tailwind CSS, plus Motion (Framer Motion) for subtle animations |
| Database | **Neon Postgres + pgvector**, added from the Vercel Marketplace with one click. Its connection string is injected into the Vercel env automatically. |
| Photos | **Vercel Blob** |
| Photo → caption | **Groq** vision model, with **key rotation** (see §5) |
| Text → vector | **Cloudflare Workers AI** `@cf/qwen/qwen3-embedding-0.6b` (1024-dim) over its REST API |
| Secrets | **Vercel Environment Variables**, marked *Sensitive* |

**Why Neon and not Cloudflare D1:** D1 is SQLite and is only reachable from Vercel through Cloudflare's HTTP API, which is slow and awkward, and it would need separate vector handling. Neon plugs straight into Vercel and does the vector search inside SQL (`ORDER BY embedding <=> $1`), so there's no extra code.

---

## 5. Secrets and Groq key rotation

### Environment variables (set in Vercel → Project → Settings → Environment Variables)
```bash
DATABASE_URL=...              # auto-added by the Neon integration
BLOB_READ_WRITE_TOKEN=...     # auto-added when a Blob store is created
GROQ_API_KEYS=key1,key2,key3,key4   # comma-separated, from different accounts
CF_ACCOUNT_ID=...
CF_API_TOKEN=...              # Cloudflare token with Workers AI permission
```
- Locally, each developer runs `vercel env pull .env.local` to get the variables. `.env.local` is git-ignored.
- `.env.example` (names only) is committed.
- Every AI and database call runs on the **server only**, so keys never reach the browser.

### Rotation logic (`lib/ai/groq.ts`)
```
keys = GROQ_API_KEYS.split(",")
start = random key (spreads load across accounts)
for attempt in 0..3:            // 1 try + up to 3 retries
    key = keys[(start + attempt) % keys.length]
    res = call Groq with key
    if res.ok → return
    if res.status == 429 (or 5xx):
        wait = Retry-After header, or 1s → 2s → 4s
        sleep(wait), then try with the NEXT key
    else → throw
throw "AI busy"  → report is still saved without a photo caption
```

**Failure rule:** if Groq or Cloudflare fails, **the report is still saved**. We embed the text without a caption, or, if embedding also fails, store `embedding = null` and retry it the next time the report page opens.

---

## 6. Database (one table)

```sql
create extension if not exists vector;

create table items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('lost','found')),
  title         text not null,
  category      text not null,
  description   text not null,
  image_url     text,
  image_caption text,            -- from Groq vision
  state         text not null,
  city          text not null,
  place         text,
  event_date    date not null,
  contact_name  text not null,
  contact_phone text not null,
  contact_email text,
  embedding     vector(1024),
  created_at    timestamptz default now()
);
create index on items using hnsw (embedding vector_cosine_ops);
```

### Match query (concept)
```sql
select *, 1 - (embedding <=> $myEmbedding) as similarity
from items
where type = $oppositeType
  and event_date between $myDate - 30 and $myDate + 30
  and embedding is not null
order by embedding <=> $myEmbedding
limit 20;
```
The place and time scores are then computed in TypeScript, and the top 5 are kept.

---

## 7. UI direction (calm and warm, not "AI slop")

- **Feel:** calm, warm, plenty of whitespace, nothing flashy. No gradients, glowing blobs or emoji soup.
- **Colours:** a warm off-white background (`#FAF9F5`-ish), near-black warm text (`#1F1E1B`), muted grey-brown secondary text, and **one** accent, a terracotta/clay orange (`#C96442`-ish), used only for primary buttons and highlights. Cards are white on cream with a 1px hairline border, plus a dark mode.
- **Type:** a **serif for headings** (e.g. *Source Serif 4* or *Newsreader*) and a clean **sans for body** (e.g. *Inter*), loaded with `next/font`.
- **Motion:** buttons press to `scale(0.98)`, hovers ease over about 150 ms, and match cards fade up one after another (Motion). The "Finding matches…" state is a calm pulsing line, not a spinner.
- **Components:** rounded-xl inputs with clear focus rings, a segmented "Lost / Found" toggle, a drag-and-drop photo box with preview, and match % shown as a small pill.

---

## 8. Folder layout

```
src/
  app/
    page.tsx                 Home
    report/page.tsx          Form
    items/[id]/page.tsx      Report + matches
    actions.ts               createReport (server action)
  components/                ReportForm, MatchCard, PhotoDrop, Button, …
  lib/
    db.ts                    Neon client
    blob.ts                  Vercel Blob upload
    ai/groq.ts               vision caption + key rotation
    ai/embed.ts              Cloudflare Workers AI embeddings
    matching.ts              findMatches + score()
    constants.ts             categories, states/UTs
.env.example
```

---

## 9. Build order

| Step | What | Done when |
|---|---|---|
| 1 | Next.js setup, Tailwind, fonts, colour tokens; Neon + Blob connected on Vercel | The home page deploys |
| 2 | Report form → save to the database with photo upload | A report is saved and its page shows it |
| 3 | Groq caption (with rotation) + Cloudflare embedding + `findMatches` | A lost "black Samsung phone, Pune" finds a found "dark Samsung mobile, Pune" |
| 4 | Match cards, animations, empty and loading states, mobile check | The demo flow looks good on a phone |
| 5 | Seed about 20 sample reports for the demo | Demo-ready |

---

## 10. Later (only after the MVP)
Browse page · mark as resolved · login · email alerts on new matches · multiple photos · map picker · Hindi UI · LLM re-ranking with explanations · rate limiting.
