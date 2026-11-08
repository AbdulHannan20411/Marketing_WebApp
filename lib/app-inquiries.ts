import "server-only";

import { serverEnv } from "@/lib/env/server";

/**
 * Sends website queries to the NextReach app, where the platform team reads and
 * answers them in the Super Admin portal (Website queries).
 *
 * Server to server only: the site key is a shared secret with the API and never
 * reaches a browser. Both NEXTREACH_API_URL and NEXTREACH_SITE_KEY must be set;
 * without them, queries keep going to this site's own database as before.
 */

export type AppInquiryPayload = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  subject: string;
  message: string;
  answers: Record<string, unknown>;
  locale: string;
  source: string;
  utm: Record<string, string>;
  /** Salted hash of the visitor's address, so the API can limit one visitor. */
  visitorKey: string;
};

export type AppInquiryAttachment = {
  bytes: Uint8Array;
  type: string;
  name: string;
};

export type AppInquiryResult =
  | { ok: true; reference: string }
  /** The API said this sender has written in too often. */
  | { ok: false; reason: "rateLimited" }
  /** The API refused the content. Not worth retrying elsewhere. */
  | { ok: false; reason: "invalid" }
  /** The API could not be reached, timed out, or refused the site key. Worth a fallback. */
  | { ok: false; reason: "unavailable" };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function isAppInquiriesConfigured(env = serverEnv): boolean {
  return Boolean(env.NEXTREACH_API_URL && env.NEXTREACH_SITE_KEY);
}

/** Posts one query. Never throws; every failure becomes a reason. */
export async function sendQueryToApp(
  payload: AppInquiryPayload,
  attachment: AppInquiryAttachment | null,
  {
    env = serverEnv,
    fetchImpl = fetch,
    timeoutMs = 10_000,
  }: { env?: typeof serverEnv; fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<AppInquiryResult> {
  if (!env.NEXTREACH_API_URL || !env.NEXTREACH_SITE_KEY)
    return { ok: false, reason: "unavailable" };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  if (attachment) {
    form.append(
      "attachment",
      new Blob([new Uint8Array(attachment.bytes)], { type: attachment.type }),
      attachment.name,
    );
  }

  const endpoint = `${env.NEXTREACH_API_URL}/api/v1/public/inquiries`;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "X-Site-Key": env.NEXTREACH_SITE_KEY, Accept: "application/json" },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    console.error("[app-inquiries] could not reach the app API", {
      endpoint,
      error: String(error),
    });
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 429) return { ok: false, reason: "rateLimited" };

  if (response.status === 400 || response.status === 422) {
    console.error("[app-inquiries] the app API refused the query", {
      status: response.status,
      detail: await problemDetail(response),
    });
    return { ok: false, reason: "invalid" };
  }

  if (!response.ok) {
    // 401 means the two site keys differ: say so plainly, it is a setup mistake.
    console.error(
      response.status === 401
        ? "[app-inquiries] the app API refused the site key: NEXTREACH_SITE_KEY must match the API's SiteInquiries:ApiKey"
        : "[app-inquiries] the app API failed",
      { status: response.status, detail: await problemDetail(response) },
    );
    return { ok: false, reason: "unavailable" };
  }

  try {
    const body: unknown = await response.json();
    const reference =
      body &&
      typeof body === "object" &&
      "data" in body &&
      body.data &&
      typeof body.data === "object"
        ? (body.data as { reference?: unknown }).reference
        : undefined;
    if (typeof reference === "string" && reference.length > 0) return { ok: true, reference };
  } catch {
    // Fall through: stored, but the answer could not be read.
  }
  console.error("[app-inquiries] the app API answered without a reference");
  // The query was stored; the visitor just will not see a reference.
  return { ok: true, reference: "" };
}

async function problemDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail?: unknown }).detail;
      return typeof detail === "string" ? detail.slice(0, 300) : undefined;
    }
  } catch {
    // Not JSON.
  }
  return undefined;
}
