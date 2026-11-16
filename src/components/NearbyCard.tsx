import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/lib/db";
import { formatDate } from "@/lib/format";

export function NearbyCard({ item }: { item: Item }) {
  return (
    <li className="min-w-0">
      <Link
        href={`/items/${item.id}`}
        className="group flex h-full gap-3 rounded-xl border border-line bg-card p-3 transition-[border-color,transform] duration-150 hover:border-muted/50 active:scale-[0.99]"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-soft">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.title} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[10px] text-muted">No photo</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium group-hover:underline">{item.title}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {[item.place, item.city].filter(Boolean).join(", ")}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {item.category} · {formatDate(item.event_date)}
          </p>
        </div>
      </Link>
    </li>
  );
}
