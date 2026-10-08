import { randomUUID } from "node:crypto";

import pg from "pg";

/**
 * Database test helpers. Every test runs inside a transaction that is rolled back,
 * so nothing is left in the database. Requests are impersonated exactly as Supabase
 * does it: `set local role` plus the JWT claims GUC that auth.uid() reads.
 */

export type Db = pg.Client;

export async function connect(): Promise<Db> {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // CI provides the variable directly.
  }
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("SUPABASE_DB_URL is not set (see .env.example).");
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

/** Runs `fn` in a transaction and always rolls back. */
export async function rollback(db: Db, fn: () => Promise<void>) {
  await db.query("begin");
  try {
    await fn();
  } finally {
    await db.query("rollback");
  }
}

/** Creates an auth user (as the database owner); the signup trigger creates the profile. */
export async function createUser(
  db: Db,
  options: { email?: string; confirmed?: boolean; meta?: Record<string, unknown> } = {},
): Promise<{ id: string; email: string }> {
  const email = options.email ?? `test-${randomUUID()}@example.com`;
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
     values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
             $1, $2::jsonb, case when $3 then now() end, now(), now())
     returning id`,
    [email, JSON.stringify(options.meta ?? {}), options.confirmed ?? true],
  );
  return { id: rows[0]!.id, email };
}

export async function makeSuperadmin(db: Db, email: string) {
  await db.query("select public.promote_to_superadmin($1)", [email]);
}

/** Runs `fn` as an anonymous visitor or a signed-in user, then returns to the owner role. */
export async function as<T>(db: Db, userId: string | null, fn: () => Promise<T>): Promise<T> {
  if (userId) {
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await db.query("set local role authenticated");
  } else {
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ role: "anon" }),
    ]);
    await db.query("set local role anon");
  }
  try {
    return await fn();
  } finally {
    await db.query("reset role");
    await db.query("select set_config('request.jwt.claims', '', true)");
  }
}

/** Expects `fn` to fail (inside a savepoint so the transaction can continue). Returns the error code. */
export async function expectDenied(db: Db, fn: () => Promise<unknown>): Promise<string> {
  await db.query("savepoint expect_denied");
  try {
    await fn();
  } catch (error) {
    await db.query("rollback to savepoint expect_denied");
    return (error as { code?: string }).code ?? "error";
  }
  await db.query("release savepoint expect_denied");
  throw new Error("Expected the statement to be denied, but it succeeded");
}

/** Inserts a query as the service (owner), like the visitor server action will. */
export async function createQuery(
  db: Db,
  overrides: Partial<{ email: string; customer_id: string | null; status: string }> = {},
): Promise<{ id: string; reference: string }> {
  const { rows } = await db.query<{ id: string; reference: string }>(
    `insert into public.queries (name, email, topic, subject, message, customer_id, status)
     values ('Test Visitor', $1, 'pricing', 'Pricing question', 'I would like to know more about your plans please.', $2, $3)
     returning id, reference`,
    [
      overrides.email ?? `visitor-${randomUUID()}@example.com`,
      overrides.customer_id ?? null,
      overrides.status ?? "new",
    ],
  );
  return rows[0]!;
}
