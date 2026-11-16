"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { uploadPhoto } from "@/lib/blob";
import { CATEGORIES, STATES, normalizeCity } from "@/lib/constants";
import { istToday } from "@/lib/format";
import { enrich } from "@/lib/matching";

export type ReportState = { error?: string; fields?: Record<string, string> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createReport(_prev: ReportState, fd: FormData): Promise<ReportState> {
  const f = {
    type: str(fd, "type"),
    title: str(fd, "title"),
    category: str(fd, "category"),
    description: str(fd, "description"),
    state: str(fd, "state"),
    city: str(fd, "city"),
    place: str(fd, "place"),
    event_date: str(fd, "event_date"),
    contact_name: str(fd, "contact_name"),
    contact_phone: str(fd, "contact_phone"),
    contact_email: str(fd, "contact_email"),
  };
  const fail = (error: string): ReportState => ({ error, fields: f });

  if (f.type !== "lost" && f.type !== "found") return fail("Choose lost or found.");
  if (f.title.length < 3) return fail("Add a short title, like “Black Samsung phone”.");
  if (!(CATEGORIES as readonly string[]).includes(f.category)) return fail("Pick a category.");
  if (f.description.length < 10) return fail("Add a few more details in the description.");
  if (!(STATES as readonly string[]).includes(f.state)) return fail("Pick a state.");
  if (f.city.length < 2) return fail("Add the city.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.event_date)) return fail("Add the date.");
  if (f.event_date > istToday()) return fail("The date can’t be in the future.");
  if (f.contact_name.length < 2) return fail("Add your name.");
  const phone = f.contact_phone.replace(/[\s-]/g, "").replace(/^(\+91|0)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) return fail("Enter a valid 10-digit Indian mobile number.");
  if (f.contact_email && !/^\S+@\S+\.\S+$/.test(f.contact_email)) return fail("Check the email.");

  let imageUrl: string | null = null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await uploadPhoto(photo);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Photo upload failed. Try again or skip it.");
    }
  }

  // AI enrichment never blocks saving: on failure caption/embedding stay null and the
  // report page retries later.
  const city = normalizeCity(f.city);
  const { caption, vector } = await enrich({ ...f, city, image_url: imageUrl }).catch((e) => {
    console.error("enrich failed", e);
    return { caption: null, vector: null };
  });

  const rows = await sql`
    insert into items (type, title, category, description, image_url, image_caption, state, city,
      place, event_date, contact_name, contact_phone, contact_email, embedding)
    values (${f.type}, ${f.title}, ${f.category}, ${f.description}, ${imageUrl}, ${caption},
      ${f.state}, ${city}, ${f.place || null}, ${f.event_date}, ${f.contact_name}, ${phone},
      ${f.contact_email || null}, ${vector}::vector)
    returning id`;

  redirect(`/items/${rows[0].id}?new=1`);
}
