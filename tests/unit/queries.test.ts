import { afterEach, describe, expect, it, vi } from "vitest";

import { readUtm } from "@/components/analytics/utm";
import {
  questions,
  topicKeys,
  topicQuestions,
  type QuestionKey,
} from "@/features/queries/definitions";
import { answersSchema, querySubmissionSchema, queryFieldErrors } from "@/features/queries/schemas";
import { renderEmail } from "@/lib/email/layout";
import { detectFileType, safeFileName } from "@/lib/security/file-type";
import { checkFormToken, issueFormToken } from "@/lib/security/form-token";
import en from "@/messages/en.json";

const base = {
  source: "contact_page",
  locale: "en",
  utm: {},
  token: "t",
  website: "",
  subject: "Pricing for my shop",
  message: "We are a clothing shop in Lahore with about 3,000 customers.",
  name: "Ayesha Khan",
  email: "Ayesha@Example.com",
  phone: "0300 1234567",
  consent: true,
};

describe("query definitions", () => {
  it("has labels for every topic, question and option in the messages", () => {
    for (const topic of topicKeys) {
      expect(en.queryForm.topics[topic].title).toBeTruthy();
      for (const key of topicQuestions[topic] as readonly QuestionKey[]) {
        const question = (
          en.queryForm.questions as Record<
            string,
            { label: string; options: Record<string, string> }
          >
        )[key];
        expect(question?.label, key).toBeTruthy();
        for (const option of questions[key].options as readonly string[]) {
          expect(question?.options[option], `${key}.${option}`).toBeTruthy();
        }
      }
    }
  });
});

describe("query submission schema", () => {
  it("accepts a valid pricing submission and normalises contact details", () => {
    const parsed = querySubmissionSchema.parse({
      ...base,
      topic: "pricing",
      answers: {
        teamSize: "2-5",
        contacts: "1k-10k",
        modules: ["whatsapp", "crm"],
        billingPreference: "yearly",
      },
    });
    expect(parsed.email).toBe("ayesha@example.com");
    expect(parsed.phone).toBe("+923001234567");
  });

  it("accepts 'other' with no answers", () => {
    expect(querySubmissionSchema.safeParse({ ...base, topic: "other", answers: {} }).success).toBe(
      true,
    );
  });

  it("rejects answers from another topic, unknown options and extra keys", () => {
    const wrongTopic = querySubmissionSchema.safeParse({
      ...base,
      topic: "demo",
      answers: { teamSize: "2-5" },
    });
    expect(wrongTopic.success).toBe(false);

    expect(answersSchema("technical").safeParse({ area: "hacking", urgency: "low" }).success).toBe(
      false,
    );
    expect(
      answersSchema("technical").safeParse({ area: "inbox", urgency: "low", extra: "x" }).success,
    ).toBe(false);
    expect(
      answersSchema("pricing").safeParse({
        teamSize: "1",
        contacts: "under1k",
        modules: [],
        billingPreference: "monthly",
      }).success,
    ).toBe(false);
  });

  it("enforces the message length, phone format and consent", () => {
    const result = querySubmissionSchema.safeParse({
      ...base,
      topic: "other",
      answers: {},
      message: "too short",
      phone: "12345",
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(queryFieldErrors(result.error)).toMatchObject({
        message: "messageShort",
        phone: "phone",
        consent: "consent",
      });
    }
  });

  it("only accepts known UTM keys", () => {
    expect(
      querySubmissionSchema.safeParse({ ...base, topic: "other", answers: {}, utm: { evil: "x" } })
        .success,
    ).toBe(false);
  });
});

describe("form token", () => {
  it("accepts a token older than the minimum and refuses fast, stale or forged ones", () => {
    const issued = issueFormToken(1_000_000_000_000);
    expect(checkFormToken(issued, { now: 1_000_000_005_000 })).toBe("ok");
    expect(checkFormToken(issued, { now: 1_000_000_001_000 })).toBe("tooFast");
    expect(checkFormToken(issued, { now: 1_000_000_000_000 + 25 * 3600 * 1000 })).toBe("expired");
    const [time] = issued.split(".");
    expect(checkFormToken(`${time}.forged`, { now: 1_000_000_005_000 })).toBe("invalid");
    expect(
      checkFormToken(`1000000000001.${issued.split(".")[1]}`, { now: 1_000_000_005_000 }),
    ).toBe("invalid");
    expect(checkFormToken("garbage")).toBe("invalid");
  });
});

describe("attachment checks", () => {
  it("detects PNG, JPEG and PDF from bytes, not names", () => {
    expect(
      detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])),
    ).toBe("image/png");
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectFileType(new TextEncoder().encode("%PDF-1.7\n"))).toBe("application/pdf");
    expect(detectFileType(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(detectFileType(new TextEncoder().encode("MZ executable"))).toBeNull();
  });

  it("makes safe file names with the right extension", () => {
    expect(safeFileName("../../etc/passwd.png", "application/pdf")).toBe("etc-passwd.pdf");
    expect(safeFileName("رسید جاز کیش.jpeg", "image/jpeg")).toBe("رسید-جاز-کیش.jpg");
    expect(safeFileName("<script>.png", "image/png")).toBe("script.png");
    expect(safeFileName("", "image/png")).toBe("attachment.png");
  });
});

describe("email layout", () => {
  it("escapes user content and keeps a plain-text version", () => {
    const { html, text } = renderEmail({
      locale: "en",
      preheader: "p",
      heading: "New query from <b>Mallory</b>",
      paragraphs: ["Hello"],
      quote: { label: "Message", body: '<img src=x onerror="alert(1)">\nline two' },
      cta: { label: "Open", url: "https://example.com/en/admin/queries/1" },
      footer: "f",
    });
    expect(html).not.toContain("<b>Mallory</b>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("line two");
    expect(text).toContain('<img src=x onerror="alert(1)">');
    expect(text).toContain("Open: https://example.com/en/admin/queries/1");
  });

  it("renders Urdu right-to-left", () => {
    const { html } = renderEmail({
      locale: "ur",
      preheader: "",
      heading: "شکریہ",
      paragraphs: [],
      footer: "",
    });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ur"');
  });
});

describe("UTM", () => {
  afterEach(() => sessionStorage.clear());

  it("prefers the current URL, then what was captured on landing", () => {
    expect(readUtm("?utm_source=facebook&utm_campaign=eid&other=1")).toEqual({
      utm_source: "facebook",
      utm_campaign: "eid",
    });
    sessionStorage.setItem("nr-utm", JSON.stringify({ utm_source: "google", junk: 1 }));
    expect(readUtm("")).toEqual({ utm_source: "google" });
  });
});

describe("turnstile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is skipped without a secret and enforced with one", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    let mod = await import("@/lib/security/turnstile");
    expect(await mod.verifyTurnstile(undefined, "1.2.3.4")).toBe(true);

    vi.resetModules();
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    mod = await import("@/lib/security/turnstile");
    expect(await mod.verifyTurnstile(undefined, "1.2.3.4")).toBe(false);
    const ok = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    expect(await mod.verifyTurnstile("token", "1.2.3.4", ok)).toBe(true);
    const bad = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await mod.verifyTurnstile("token", "1.2.3.4", bad)).toBe(false);
  });
});
