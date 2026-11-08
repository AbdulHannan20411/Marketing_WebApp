import { describe, expect, it, vi } from "vitest";

import {
  isAppInquiriesConfigured,
  sendQueryToApp,
  type AppInquiryPayload,
} from "@/lib/app-inquiries";
import type { ServerEnv } from "@/lib/env/server";

const env: ServerEnv = {
  NEXTREACH_API_URL: "https://api.example.com",
  NEXTREACH_SITE_KEY: "shared-secret",
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  RESEND_API_KEY: undefined,
  EMAIL_FROM: undefined,
  TURNSTILE_SECRET_KEY: undefined,
  REVALIDATE_SECRET: undefined,
};

const payload: AppInquiryPayload = {
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "+923001234567",
  topic: "pricing",
  subject: "Pricing for my shop",
  message: "We are a clothing shop in Lahore with about 3,000 customers.",
  answers: { teamSize: "2-5" },
  locale: "en",
  source: "contact_page",
  utm: {},
  visitorKey: "hash",
};

function reply(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("sending website queries to the app", () => {
  it("is configured only with both the API address and the site key", () => {
    expect(isAppInquiriesConfigured(env)).toBe(true);
    expect(isAppInquiriesConfigured({ ...env, NEXTREACH_SITE_KEY: undefined })).toBe(false);
    expect(isAppInquiriesConfigured({ ...env, NEXTREACH_API_URL: undefined })).toBe(false);
  });

  it("posts the query with the site key and returns the app's reference", async () => {
    const fetchImpl = reply(200, { data: { id: "inq_42", reference: "Q-2026-00042" } });

    const result = await sendQueryToApp(payload, null, { env, fetchImpl });

    expect(result).toEqual({ ok: true, reference: "Q-2026-00042" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/v1/public/inquiries");
    expect((init.headers as Record<string, string>)["X-Site-Key"]).toBe("shared-secret");
    expect((init.headers as Record<string, string>)["ngrok-skip-browser-warning"]).toBe("1");
    const form = init.body as FormData;
    expect(JSON.parse(String(form.get("payload")))).toMatchObject({ email: "ayesha@example.com" });
  });

  it("passes a sender limit through as rate limited", async () => {
    const result = await sendQueryToApp(payload, null, { env, fetchImpl: reply(429, {}) });
    expect(result).toEqual({ ok: false, reason: "rateLimited" });
  });

  it("treats a refused field as invalid, not as a reason to try elsewhere", async () => {
    const result = await sendQueryToApp(payload, null, {
      env,
      fetchImpl: reply(422, { detail: "Enter a valid email address." }),
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("reports a wrong site key or an outage as unavailable, so the site can fall back", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await sendQueryToApp(payload, null, { env, fetchImpl: reply(401, {}) })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    const offline = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await sendQueryToApp(payload, null, { env, fetchImpl: offline })).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});
