// Usage: node --env-file=.env.local scripts/migrate.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const s of statements) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0]);
}
const cols = await sql.query("select count(*)::int as n from information_schema.columns where table_name = 'items'");
console.log("items columns:", cols[0].n);
