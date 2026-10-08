#!/usr/bin/env node
/**
 * Applies pending migrations in supabase/migrations to the database in
 * SUPABASE_DB_URL (from the environment or .env.local).
 *
 *   npm run db:push            apply
 *   npm run db:push -- --dry-run
 */
import { spawnSync } from "node:child_process";

import { supabaseCommand } from "./supabase-bin.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as-is (CI).
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const extra = process.argv.slice(2);
const [command, args] = supabaseCommand(["db", "push", "--db-url", dbUrl, "--yes", ...extra]);
const result = spawnSync(command, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
