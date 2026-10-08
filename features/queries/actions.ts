"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { after } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env/public";
import { detectFileType, safeFileName } from "@/lib/security/file-type";
import { checkFormToken, issueFormToken } from "@/lib/security/form-token";
import { clientIp, hashIp } from "@/lib/security/request-info";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

import { attachmentRules } from "./definitions";
import { notifyNewQuery } from "./notify";
import { queryFieldErrors, querySubmissionSchema, type QueryValidationCode } from "./schemas";

/**
 * Visitor and customer query submission. Inserts use the service role (visitors have
 * no database access at all) after every check below has passed on the server.
 */

const RATE_LIMIT = { attempts: 5, windowSeconds: 60 * 60 };
const BUCKET = "query-attachments";

export type QueryFormContext = {
  token: string;
  account: { name: string; email: string; phone: string } | null;
};

/** Called when the form opens: a signed timing token, plus prefill for signed-in users. */
export async function getQueryFormContext(): Promise<QueryFormContext> {
  const profile = await getCurrentProfile();
  return {
    token: issueFormToken(),
    account:
      profile && !profile.is_suspended
        ? { name: profile.full_name, email: profile.email, phone: profile.phone ?? "" }
        : null,
  };
}

export type SubmitQueryError =
  | "invalid"
  | "tooFast"
  | "expired"
  | "captcha"
  | "rateLimited"
  | "attachmentType"
  | "attachmentSize"
  | "suspended"
  | "generic";

export type SubmitQueryResult =
  | { ok: true; reference: string | null; email: string; signedIn: boolean }
  | { ok: false; error: SubmitQueryError; fieldErrors?: Record<string, QueryValidationCode> };

export async function submitQuery(formData: FormData): Promise<SubmitQueryResult> {
  try {
    return await handleSubmission(formData);
  } catch (error) {
    console.error("[query] submission failed unexpectedly", { error: String(error) });
    return { ok: false, error: "generic" };
  }
}

async function handleSubmission(formData: FormData): Promise<SubmitQueryResult> {
  if (!isSupabaseConfigured()) {
    console.error("[query] Supabase is not configured; cannot store queries");
    return { ok: false, error: "generic" };
  }

  // 1. Payload (JSON) + optional file.
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string" || rawPayload.length > 20_000)
    return { ok: false, error: "invalid" };
  let json: unknown;
  try {
    json = JSON.parse(rawPayload);
  } catch {
    return { ok: false, error: "invalid" };
  }

  // 2. Honeypot: pretend it worked so bots learn nothing.
  if (
    json &&
    typeof json === "object" &&
    "website" in json &&
    String(json.website ?? "").trim() !== ""
  ) {
    console.warn("[query] honeypot triggered; dropping submission");
    return { ok: true, reference: null, email: "", signedIn: false };
  }

  // 3. Full server-side validation.
  const parsed = querySubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: queryFieldErrors(parsed.error) };
  }
  const input = parsed.data;

  // 4. Minimum time-to-submit, via the signed token.
  const tokenCheck = checkFormToken(input.token);
  if (tokenCheck === "tooFast") return { ok: false, error: "tooFast" };
  if (tokenCheck === "expired") return { ok: false, error: "expired" };
  if (tokenCheck === "invalid") return { ok: false, error: "invalid" };

  // 5. Optional Cloudflare Turnstile.
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  if (!(await verifyTurnstile(input.turnstileToken, ip))) return { ok: false, error: "captcha" };

  // 6. Attachment checks: real type from the bytes, size on the server.
  const file = formData.get("attachment");
  let attachment: {
    bytes: Uint8Array;
    type: "image/png" | "image/jpeg" | "application/pdf";
    name: string;
  } | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > attachmentRules.maxBytes) return { ok: false, error: "attachmentSize" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(bytes);
    if (!type) return { ok: false, error: "attachmentType" };
    attachment = { bytes, type, name: safeFileName(file.name || "attachment", type) };
  }

  // 7. Who is sending: signed-in details are authoritative.
  const profile = await getCurrentProfile();
  if (profile?.is_suspended) return { ok: false, error: "suspended" };
  const email = profile?.email ?? input.email;
  const name = (profile?.full_name || input.name).trim();
  const phone = profile?.phone || input.phone;

  // 8. Rate limit: 5 per hour per IP and per email.
  const admin = createSupabaseAdminClient();
  const ipHash = hashIp(ip);
  const [ipLimit, emailLimit] = await Promise.all([
    admin.rpc("hit_rate_limit", {
      p_key: `query:ip:${ipHash}`,
      p_limit: RATE_LIMIT.attempts,
      p_window_seconds: RATE_LIMIT.windowSeconds,
    }),
    admin.rpc("hit_rate_limit", {
      p_key: `query:email:${email}`,
      p_limit: RATE_LIMIT.attempts,
      p_window_seconds: RATE_LIMIT.windowSeconds,
    }),
  ]);
  if (ipLimit.error || emailLimit.error) {
    console.error("[query] rate limit check failed", {
      error: ipLimit.error?.message ?? emailLimit.error?.message,
    });
    return { ok: false, error: "generic" };
  }
  if (ipLimit.data === false || emailLimit.data === false)
    return { ok: false, error: "rateLimited" };

  // 9. Link to an account: the signed-in user, or a confirmed account with this email.
  let customerId = profile?.id ?? null;
  if (!customerId) {
    const { data } = await admin.rpc("confirmed_user_id", { p_email: email });
    customerId = data ?? null;
  }

  // 10. Upload first (the path needs the query id), then insert.
  const queryId = randomUUID();
  let storagePath: string | null = null;
  if (attachment) {
    const extension =
      attachment.type === "application/pdf"
        ? "pdf"
        : attachment.type === "image/png"
          ? "png"
          : "jpg";
    storagePath = `${queryId}/${randomUUID()}.${extension}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, attachment.bytes, { contentType: attachment.type, upsert: false });
    if (error) {
      console.error("[query] attachment upload failed", { error: error.message });
      return { ok: false, error: "generic" };
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("queries")
    .insert({
      id: queryId,
      customer_id: customerId,
      name,
      email,
      phone,
      topic: input.topic,
      answers: input.answers as NonNullable<Json>,
      subject: input.subject,
      message: input.message,
      locale: input.locale,
      source: input.source,
      utm: input.utm as NonNullable<Json>,
      ip_hash: ipHash,
    })
    .select("id, reference")
    .single();

  if (insertError || !inserted) {
    console.error("[query] insert failed", { error: insertError?.message });
    if (storagePath) await admin.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "generic" };
  }

  if (attachment && storagePath) {
    const { error } = await admin.from("query_attachments").insert({
      query_id: inserted.id,
      storage_path: storagePath,
      file_name: attachment.name,
      content_type: attachment.type,
      size_bytes: attachment.bytes.byteLength,
    });
    if (error) {
      console.error("[query] attachment record failed", {
        reference: inserted.reference,
        error: error.message,
      });
      await admin.storage.from(BUCKET).remove([storagePath]);
    }
  }

  // 11. Emails after the response, so the visitor isn't kept waiting.
  after(() =>
    notifyNewQuery({
      id: inserted.id,
      reference: inserted.reference,
      name,
      email,
      phone,
      topic: input.topic,
      answers: input.answers as Record<string, unknown>,
      subject: input.subject,
      message: input.message,
      hasAttachment: Boolean(storagePath),
      locale: input.locale,
      hasAccount: Boolean(customerId),
    }),
  );

  return { ok: true, reference: inserted.reference, email, signedIn: Boolean(profile) };
}
