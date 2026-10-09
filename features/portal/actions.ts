"use server";

import { after } from "next/server";
import { z } from "@/lib/validation/zod";

import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { notifyCustomerReply } from "../queries/notify";
import { queryIdSchema } from "./data";

/**
 * Customer portal mutations. Each one re-checks the session; the database checks
 * ownership again (RLS for replies, SECURITY DEFINER functions for read/resolve).
 */

export type PortalActionError =
  "empty" | "tooLong" | "closed" | "rateLimited" | "notSignedIn" | "generic";
export type PortalActionResult = { ok: true } | { ok: false; error: PortalActionError };

const replySchema = z.object({
  queryId: queryIdSchema,
  body: z.string().trim().min(1, "empty").max(5000, "tooLong"),
});

const REPLY_LIMIT = { attempts: 20, windowSeconds: 60 * 60 };

export async function replyToMyQuery(input: unknown): Promise<PortalActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.is_suspended) return { ok: false, error: "notSignedIn" };

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message;
    return {
      ok: false,
      error: code === "tooLong" ? "tooLong" : code === "empty" ? "empty" : "generic",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: query } = await supabase
    .from("queries")
    .select("id, reference, status, name, email")
    .eq("id", parsed.data.queryId)
    .eq("customer_id", profile.id)
    .maybeSingle();
  if (!query) return { ok: false, error: "generic" };
  if (query.status === "closed") return { ok: false, error: "closed" };

  const admin = createSupabaseAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc("hit_rate_limit", {
    p_key: `reply:user:${profile.id}`,
    p_limit: REPLY_LIMIT.attempts,
    p_window_seconds: REPLY_LIMIT.windowSeconds,
  });
  if (limitError) {
    console.error("[portal] rate limit check failed", { error: limitError.message });
    return { ok: false, error: "generic" };
  }
  if (allowed === false) return { ok: false, error: "rateLimited" };

  // Inserted as the customer: RLS checks ownership, open status and suspension.
  const { error } = await supabase.from("query_messages").insert({
    query_id: query.id,
    author_id: profile.id,
    author_role: "customer",
    body: parsed.data.body,
  });
  if (error) {
    console.error("[portal] reply failed", { queryId: query.id, error: error.message });
    return { ok: false, error: "generic" };
  }

  after(() =>
    notifyCustomerReply({
      id: query.id,
      reference: query.reference,
      name: profile.full_name || query.name,
      reply: parsed.data.body,
      email: query.email,
    }),
  );
  return { ok: true };
}

export async function resolveMyQuery(queryId: unknown): Promise<PortalActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.is_suspended) return { ok: false, error: "notSignedIn" };
  const id = queryIdSchema.safeParse(queryId);
  if (!id.success) return { ok: false, error: "generic" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("resolve_my_query", { p_query_id: id.data });
  if (error) {
    console.error("[portal] resolve failed", { queryId: id.data, error: error.message });
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

/** Clears the unread dot when the customer opens a query. */
export async function markMyQueryRead(queryId: unknown): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const id = queryIdSchema.safeParse(queryId);
  if (!id.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_query_read", { p_query_id: id.data });
  if (error) console.error("[portal] mark read failed", { queryId: id.data, error: error.message });
}
