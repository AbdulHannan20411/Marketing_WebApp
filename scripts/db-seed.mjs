#!/usr/bin/env node
/** Runs supabase/seed.sql against SUPABASE_DB_URL. Idempotent. Usage: npm run db:seed */
import { readFileSync } from "node:fs";

import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as-is (CI).
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(readFileSync("supabase/seed.sql", "utf8"));
  const { rows } = await client.query("select count(*)::int as n from public.saved_replies");
  console.log(`Seed applied. Saved replies in the database: ${rows[0].n}.`);
} catch (error) {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
