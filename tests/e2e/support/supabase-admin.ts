import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role helper for end-to-end tests: creates confirmed test users (no email is
 * sent) and deletes them afterwards. Never used by the app.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // CI provides the variables directly.
}

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let client: SupabaseClient | null = null;
function admin(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  return client;
}

export type TestUser = { id: string; email: string; password: string };

export async function createTestUser(
  options: { fullName?: string; superadmin?: boolean } = {},
): Promise<TestUser> {
  const email = `e2e-${randomUUID().slice(0, 8)}@example.com`;
  const password = `E2e-${randomUUID()}`;
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: options.fullName ?? "E2E Tester", locale: "en" },
  });
  if (error || !data.user) throw new Error(`Could not create test user: ${error?.message}`);
  if (options.superadmin) {
    const { error: promoteError } = await admin().rpc("promote_to_superadmin", { p_email: email });
    if (promoteError) throw new Error(`Could not promote test user: ${promoteError.message}`);
  }
  return { id: data.user.id, email, password };
}

export async function deleteTestUser(user: TestUser | undefined) {
  if (user) await admin().auth.admin.deleteUser(user.id);
}

export async function profileOf(user: TestUser) {
  const { data } = await admin()
    .from("profiles")
    .select("full_name, phone, locale, role")
    .eq("id", user.id)
    .single();
  return data;
}

export type StoredQuery = {
  id: string;
  reference: string;
  customer_id: string | null;
  topic: string;
  answers: Record<string, unknown>;
  source: string;
  locale: string;
  phone: string | null;
  ip_hash: string | null;
  utm: Record<string, unknown>;
  query_attachments: {
    storage_path: string;
    content_type: string;
    file_name: string;
    size_bytes: number;
  }[];
};

/** Queries sent with an email address, newest first (with attachments). */
export async function queriesByEmail(email: string): Promise<StoredQuery[]> {
  const { data, error } = await admin()
    .from("queries")
    .select(
      "id, reference, customer_id, topic, answers, source, locale, phone, ip_hash, utm, query_attachments(storage_path, content_type, file_name, size_bytes)",
    )
    .eq("email", email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StoredQuery[];
}

/** Deletes test queries and their stored files. */
export async function deleteQueriesByEmail(email: string) {
  const queries = await queriesByEmail(email);
  const paths = queries.flatMap((query) => query.query_attachments.map((a) => a.storage_path));
  if (paths.length) await admin().storage.from("query-attachments").remove(paths);
  if (queries.length) {
    await admin()
      .from("queries")
      .delete()
      .in(
        "id",
        queries.map((query) => query.id),
      );
  }
}

export async function storageObjectExists(path: string): Promise<boolean> {
  const { data } = await admin().storage.from("query-attachments").download(path);
  return Boolean(data);
}
