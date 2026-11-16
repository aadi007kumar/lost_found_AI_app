import "server-only";
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export type ItemType = "lost" | "found";

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  image_caption: string | null;
  state: string;
  city: string;
  place: string | null;
  event_date: string; // YYYY-MM-DD
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  created_at: string;
};

/** Columns to select for an Item (embedding left out; date as plain text to avoid timezone shifts). */
export const ITEM_COLUMNS = `id, type, title, category, description, image_url, image_caption,
  state, city, place, event_date::text as event_date, contact_name, contact_phone, contact_email,
  created_at::text as created_at`;

export async function getItem(id: string): Promise<Item | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await sql.query(`select ${ITEM_COLUMNS} from items where id = $1`, [id]);
  return (rows[0] as Item) ?? null;
}
