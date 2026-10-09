"use server";

import { after } from "next/server";
import { z } from "zod";

import { getCurrentProfile, type CurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { notifyAdminReply } from "../queries/notify";
import { idSchema } from "./data";
import { queryStatuses } from "./filters";

/**
 * Super Admin mutations. Each one checks the role on the server first, and every
 * write runs as the signed-in user, so RLS checks it again in the database.
 */

export type AdminActionError =
  "empty" | "tooLong" | "title" | "body" | "invalidEmail" | "tooMany" | "forbidden" | "generic";
export type AdminActionResult =
  { ok: true } | { ok: false; error: AdminActionError; detail?: string };

const fail = (error: AdminActionError, detail?: string): AdminActionResult => ({
  ok: false,
  error,
  ...(detail ? { detail } : {}),
});

async function requireAdminActor(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  return profile && profile.role === "superadmin" && !profile.is_suspended ? profile : null;
}

function logFailure(action: string, error: { message: string } | null, context: object = {}) {
  console.error(`[admin] ${action} failed`, { ...context, error: error?.message });
}

// ---------------------------------------------------------------------------
// Replies and notes
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  queryId: idSchema,
  body: z.string().trim().min(1, "empty").max(5000, "tooLong"),
  internal: z.boolean(),
});

export async function postAdminMessage(input: unknown): Promise<AdminActionResult> {
  const profile = await requireAdminActor();
  if (!profile) return fail("forbidden");
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message;
    return fail(code === "empty" || code === "tooLong" ? code : "generic");
  }
  const { queryId, body, internal } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: query } = await supabase
    .from("queries")
    .select("id, reference, subject, email, locale")
    .eq("id", queryId)
    .maybeSingle();
  if (!query) return fail("generic");

  const { error } = await supabase.from("query_messages").insert({
    query_id: query.id,
    author_id: profile.id,
    author_role: "superadmin",
    body,
    is_internal: internal,
  });
  if (error) {
    logFailure("message", error, { queryId });
    return fail("generic");
  }

  if (!internal) {
    after(() =>
      notifyAdminReply({
        id: query.id,
        reference: query.reference,
        subject: query.subject,
        reply: body,
        email: query.email,
        locale: query.locale,
      }).catch((cause: unknown) =>
        console.error("[admin] reply email failed", {
          reference: query.reference,
          error: String(cause),
        }),
      ),
    );
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Status and assignment
// ---------------------------------------------------------------------------

const statusSchema = z.object({ queryId: idSchema, status: z.enum(queryStatuses) });

export async function setQueryStatus(input: unknown): Promise<AdminActionResult> {
  if (!(await requireAdminActor())) return fail("forbidden");
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fail("generic");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("queries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.queryId)
    .select("id");
  if (error || !data?.length) {
    logFailure("status", error, { queryId: parsed.data.queryId });
    return fail("generic");
  }
  return { ok: true };
}

const assignSchema = z.object({ queryId: idSchema, assigneeId: idSchema.nullable() });

export async function assignQuery(input: unknown): Promise<AdminActionResult> {
  if (!(await requireAdminActor())) return fail("forbidden");
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return fail("generic");

  // RLS only accepts an assignee who is a Super Admin.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("queries")
    .update({ assignee_id: parsed.data.assigneeId })
    .eq("id", parsed.data.queryId)
    .select("id");
  if (error || !data?.length) {
    logFailure("assign", error, { queryId: parsed.data.queryId });
    return fail("generic");
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

const suspendSchema = z.object({ userId: idSchema, suspended: z.boolean() });

export async function setCustomerSuspended(input: unknown): Promise<AdminActionResult> {
  if (!(await requireAdminActor())) return fail("forbidden");
  const parsed = suspendSchema.safeParse(input);
  if (!parsed.success) return fail("generic");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("set_customer_suspended", {
    p_user_id: parsed.data.userId,
    p_suspended: parsed.data.suspended,
  });
  if (error || data !== true) {
    logFailure("suspend", error, { userId: parsed.data.userId });
    return fail("generic");
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Saved replies
// ---------------------------------------------------------------------------

const savedReplySchema = z.object({
  id: idSchema.optional(),
  title: z.string().trim().min(1, "title").max(120, "title"),
  body: z.string().trim().min(1, "body").max(5000, "body"),
  locale: z.enum(["en", "ur"]).nullable(),
});

export async function saveSavedReply(input: unknown): Promise<AdminActionResult> {
  const profile = await requireAdminActor();
  if (!profile) return fail("forbidden");
  const parsed = savedReplySchema.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message;
    return fail(code === "title" || code === "body" ? code : "generic");
  }
  const { id, ...fields } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from("saved_replies").update(fields).eq("id", id)
    : await supabase.from("saved_replies").insert({ ...fields, created_by: profile.id });
  if (error) {
    logFailure("saved reply", error, { id });
    return fail("generic");
  }
  return { ok: true };
}

export async function deleteSavedReply(id: unknown): Promise<AdminActionResult> {
  if (!(await requireAdminActor())) return fail("forbidden");
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("generic");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("saved_replies").delete().eq("id", parsed.data);
  if (error) {
    logFailure("delete saved reply", error, { id: parsed.data });
    return fail("generic");
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  recipients: z.string().max(5000),
  ackEn: z.string().trim().max(2000),
  ackUr: z.string().trim().max(2000),
});

export async function saveAdminSettings(input: unknown): Promise<AdminActionResult> {
  const profile = await requireAdminActor();
  if (!profile) return fail("forbidden");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.some((issue) => issue.code === "too_big") ? "tooLong" : "generic",
    );
  }

  const recipients = [
    ...new Set(
      parsed.data.recipients
        .split(/[\n,;]+/)
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const invalid = recipients.find((email) => !z.email().safeParse(email).success);
  if (invalid) return fail("invalidEmail", invalid.slice(0, 120));
  if (recipients.length > 20) return fail("tooMany");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .update({
      notification_recipients: recipients,
      auto_ack_en: parsed.data.ackEn,
      auto_ack_ur: parsed.data.ackUr,
      updated_by: profile.id,
    })
    .eq("id", true)
    .select("id");
  if (error || !data?.length) {
    logFailure("settings", error);
    return fail("generic");
  }
  return { ok: true };
}
