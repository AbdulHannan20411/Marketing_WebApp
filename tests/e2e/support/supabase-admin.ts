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
  options: { fullName?: string; superadmin?: boolean; email?: string } = {},
): Promise<TestUser> {
  const email = options.email ?? `e2e-${randomUUID().slice(0, 8)}@example.com`;
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

/** Inserts a query as the visitor server action would (optionally with a PNG attachment). */
export async function insertQuery(options: {
  email: string;
  customerId?: string | null;
  status?: "new" | "open" | "awaiting_customer" | "resolved" | "closed";
  withAttachment?: boolean;
  subject?: string;
  name?: string;
}): Promise<{ id: string; reference: string; attachmentId: string | null }> {
  const { data, error } = await admin()
    .from("queries")
    .insert({
      name: options.name ?? "Portal Tester",
      email: options.email.toLowerCase(),
      phone: "+923001234567",
      topic: "pricing",
      answers: {
        teamSize: "2-5",
        contacts: "1k-10k",
        modules: ["whatsapp"],
        billingPreference: "monthly",
      },
      subject: options.subject ?? "Plan for my shop",
      message: "Which plan suits a shop with about 3,000 customers?",
      customer_id: options.customerId ?? null,
      status: options.status ?? "new",
    })
    .select("id, reference")
    .single();
  if (error || !data) throw new Error(`Could not insert query: ${error?.message}`);

  let attachmentId: string | null = null;
  if (options.withAttachment) {
    const path = `${data.id}/${randomUUID()}.png`;
    const png = Buffer.from(
      "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
        "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
      "hex",
    );
    const upload = await admin()
      .storage.from("query-attachments")
      .upload(path, png, { contentType: "image/png" });
    if (upload.error) throw new Error(upload.error.message);
    const { data: attachment, error: attachError } = await admin()
      .from("query_attachments")
      .insert({
        query_id: data.id,
        storage_path: path,
        file_name: "receipt.png",
        content_type: "image/png",
        size_bytes: png.length,
      })
      .select("id")
      .single();
    if (attachError) throw new Error(attachError.message);
    attachmentId = attachment.id;
  }
  return { id: data.id, reference: data.reference, attachmentId };
}

/** A Super Admin message on a query (public reply, or internal note). */
export async function insertTeamMessage(
  queryId: string,
  authorId: string,
  body: string,
  internal = false,
) {
  const { error } = await admin().from("query_messages").insert({
    query_id: queryId,
    author_id: authorId,
    author_role: "superadmin",
    body,
    is_internal: internal,
  });
  if (error) throw new Error(error.message);
}

export async function queryStatus(queryId: string): Promise<string | null> {
  const { data } = await admin().from("queries").select("status").eq("id", queryId).single();
  return data?.status ?? null;
}

export async function queryRow(queryId: string) {
  const { data } = await admin()
    .from("queries")
    .select("status, assignee_id")
    .eq("id", queryId)
    .single();
  return data as { status: string; assignee_id: string | null } | null;
}

export async function messagesOf(queryId: string) {
  const { data } = await admin()
    .from("query_messages")
    .select("body, is_internal, author_role")
    .eq("query_id", queryId)
    .order("created_at", { ascending: true });
  return (data ?? []) as { body: string; is_internal: boolean; author_role: string }[];
}

type Settings = { notification_recipients: string[]; auto_ack_en: string; auto_ack_ur: string };

export async function getSettings(): Promise<Settings> {
  const { data, error } = await admin()
    .from("admin_settings")
    .select("notification_recipients, auto_ack_en, auto_ack_ur")
    .eq("id", true)
    .single();
  if (error || !data) throw new Error(`Could not read settings: ${error?.message}`);
  return data as Settings;
}

export async function restoreSettings(settings: Settings) {
  await admin().from("admin_settings").update(settings).eq("id", true);
}

export async function deleteSavedRepliesTitled(prefix: string) {
  await admin().from("saved_replies").delete().like("title", `${prefix}%`);
}
