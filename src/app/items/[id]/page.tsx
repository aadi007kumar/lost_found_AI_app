import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getItem, type Item } from "@/lib/db";
import { findMatches, findNearby } from "@/lib/matching";
import { ButtonLink } from "@/components/Button";
import { MatchCard } from "@/components/MatchCard";
import { NearbyCard } from "@/components/NearbyCard";
import { formatDate, formatPhone } from "@/lib/format";
import { PostedNotice } from "@/components/PostedNotice";

function MatchList({ item, matches }: { item: Item; matches: Awaited<ReturnType<typeof findMatches>> }) {
  const opposite = item.type === "lost" ? "found" : "lost";

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
        <p>No matches yet.</p>
        <p className="mt-1 text-sm text-muted">
          Your report is saved and stays on the board. New {opposite} reports will show up here.
        </p>
        <ButtonLink href={`/report?type=${opposite}`} variant="secondary" className="mt-6">
          Report a {opposite} item
        </ButtonLink>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {matches.map(({ score, reasons, ...m }, i) => (
        <MatchCard
          key={m.id}
          index={i}
          m={{
            id: m.id, title: m.title, image_url: m.image_url, place: m.place, city: m.city,
            state: m.state, event_date: m.event_date, contact_name: m.contact_name,
            contact_phone: m.contact_phone, contact_email: m.contact_email, score, reasons,
          }}
        />
      ))}
    </ul>
  );
}

async function Matches({ item }: { item: Item }) {
  const matches = await findMatches(item);
  const nearby = await findNearby(item, [item.id, ...matches.map((m) => m.id)]);
  const opposite = item.type === "lost" ? "found" : "lost";
  return (
    <>
      <MatchList item={item} matches={matches} />
      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl tracking-tight">Other {opposite} reports nearby</h2>
          <p className="mt-1 mb-6 text-sm text-muted">
            In {item.state}, within 30 days. The AI isn’t sure about these, but take a look.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {nearby.map((n) => <NearbyCard key={n.id} item={n} />)}
          </ul>
        </section>
      )}
    </>
  );
}

function FindingMatches() {
  return (
    <div className="rounded-2xl border border-line bg-card px-6 py-10">
      <p className="text-sm text-muted">Finding matches…</p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-soft">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-accent/40" />
      </div>
    </div>
  );
}

async function ItemView({ params, searchParams }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const isNew = (await searchParams).new === "1";
  const item = await getItem(id);
  if (!item) notFound();

  const where = [item.place, item.city, item.state].filter(Boolean).join(", ");
  const opposite = item.type === "lost" ? "found" : "lost";

  return (
    <>
      {isNew && <PostedNotice />}
      <article className="overflow-hidden rounded-2xl border border-line bg-card">
        {item.image_url && (
          <div className="relative aspect-[16/9] bg-soft">
            <Image src={item.image_url} alt={item.title} fill sizes="(max-width: 768px) 100vw, 720px"
              className="object-contain" />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-medium ${
              item.type === "lost" ? "bg-accent/10 text-accent" : "bg-soft text-fg"}`}>
              {item.type === "lost" ? "Lost" : "Found"}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-muted">{item.category}</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl tracking-tight">{item.title}</h1>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{item.description}</p>
          {item.image_caption && (
            <p className="mt-3 text-sm text-muted">
              <span className="text-fg">AI saw:</span> {item.image_caption}
            </p>
          )}
          <dl className="mt-6 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-3">
            <div><dt className="text-muted">Where</dt><dd className="mt-1">{where}</dd></div>
            <div><dt className="text-muted">When</dt><dd className="mt-1">{formatDate(item.event_date)}</dd></div>
            <div><dt className="text-muted">Contact</dt><dd className="mt-1">{item.contact_name} · {formatPhone(item.contact_phone)}</dd></div>
          </dl>
        </div>
      </article>

      <section className="mt-12">
        <h2 className="font-serif text-2xl tracking-tight">Possible matches</h2>
        <p className="mt-1 mb-6 text-sm text-muted">
          From {opposite} reports within 30 days, ranked by description, place and date. Bookmark
          this page to check back.
        </p>
        <Suspense fallback={<FindingMatches />}>
          <Matches item={item} />
        </Suspense>
      </section>
    </>
  );
}

export default function ItemPage(props: PageProps<"/items/[id]">) {
  return (
    <div className="mx-auto max-w-3xl py-10 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-soft" />}>
        <ItemView {...props} />
      </Suspense>
    </div>
  );
}
