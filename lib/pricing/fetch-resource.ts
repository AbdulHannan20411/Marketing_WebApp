import { z } from "zod";

import { envelope } from "./schemas";

export type ApiFailureReason =
  "not_configured" | "http_error" | "timeout" | "network" | "invalid_json" | "schema_mismatch";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: ApiFailureReason };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type FetchResourceOptions = {
  baseUrl: string | undefined;
  path: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  /** Defaults to NODE_ENV; development logs full validation details. */
  isDev?: boolean;
};

async function readTraceId(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.clone().json();
    if (body && typeof body === "object" && "traceId" in body) {
      const traceId = (body as { traceId?: unknown }).traceId;
      return typeof traceId === "string" ? traceId : undefined;
    }
  } catch {
    // Problem documents are JSON, but a proxy error page might not be.
  }
  return undefined;
}

function logFailure(details: Record<string, unknown>) {
  console.error("[nextreach-api] request failed", details);
}

/**
 * Fetches `${baseUrl}${path}`, unwraps `{ data, message, traceId }` and validates `data`.
 * Never throws: every failure (non-2xx, timeout, bad JSON, schema mismatch) becomes
 * `{ ok: false, reason }` and is logged once with the endpoint, status and traceId.
 */
export async function fetchResource<T extends z.ZodType>(
  schema: T,
  {
    baseUrl,
    path,
    timeoutMs = 5000,
    fetchImpl = fetch,
    isDev = process.env.NODE_ENV === "development",
  }: FetchResourceOptions,
): Promise<ApiResult<z.infer<T>>> {
  if (!baseUrl) {
    return { ok: false, reason: "not_configured" };
  }

  const endpoint = `${baseUrl}${path}`;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // Check the name, not `instanceof DOMException`: the error can come from another realm.
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    logFailure({ endpoint, reason: timedOut ? "timeout" : "network", error: String(error) });
    return { ok: false, reason: timedOut ? "timeout" : "network" };
  }

  if (!response.ok) {
    logFailure({
      endpoint,
      reason: "http_error",
      status: response.status,
      traceId: await readTraceId(response),
    });
    return { ok: false, reason: "http_error" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    logFailure({ endpoint, reason: "invalid_json", status: response.status });
    return { ok: false, reason: "invalid_json" };
  }

  const parsed = envelope(schema).safeParse(body);
  if (!parsed.success) {
    const traceId =
      body && typeof body === "object" && "traceId" in body
        ? String((body as { traceId?: unknown }).traceId)
        : undefined;
    logFailure({
      endpoint,
      reason: "schema_mismatch",
      status: response.status,
      traceId,
      // Development gets every issue so a changed API is obvious; production stays terse.
      issues: isDev
        ? z.prettifyError(parsed.error)
        : parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")),
    });
    return { ok: false, reason: "schema_mismatch" };
  }

  return { ok: true, data: (parsed.data as { data: z.infer<T> }).data };
}
