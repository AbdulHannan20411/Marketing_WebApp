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
