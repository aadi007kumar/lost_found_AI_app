"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatDate, formatPhone } from "@/lib/format";

export type MatchView = {
  id: string;
  title: string;
  image_url: string | null;
  place: string | null;
  city: string;
  state: string;
  event_date: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  score: number;
  reasons: string[];
};

export function MatchCard({ m, index }: { m: MatchView; index: number }) {
  const pct = Math.round(m.score * 100);
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-line bg-card transition-colors duration-150 hover:border-muted/50"
    >
      <div className="flex">
        <Link href={`/items/${m.id}`} className="relative block w-24 shrink-0 self-stretch bg-soft sm:w-44">
          {m.image_url ? (
            <Image src={m.image_url} alt={m.title} fill sizes="(max-width: 640px) 96px, 176px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-2 text-center text-xs text-muted">No photo</span>
          )}
        </Link>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/items/${m.id}`} className="font-serif text-lg leading-snug tracking-tight hover:underline sm:text-xl">
              {m.title}
            </Link>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              pct >= 70 ? "bg-accent text-accent-fg" : "bg-accent/10 text-accent"}`}>
              {pct}% match
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {[m.place, m.city, m.state].filter(Boolean).join(", ")} · {formatDate(m.event_date)}
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {m.reasons.map((r) => (
              <li key={r} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">{r}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-sm">
            <span>{m.contact_name}</span>
            <a href={`tel:+91${m.contact_phone}`} className="text-accent hover:underline">{formatPhone(m.contact_phone)}</a>
            {m.contact_email && (
              <a href={`mailto:${m.contact_email}`} className="break-all text-accent hover:underline">{m.contact_email}</a>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
