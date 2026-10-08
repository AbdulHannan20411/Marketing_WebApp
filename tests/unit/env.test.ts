import { describe, expect, it } from "vitest";

import { isSupabaseConfigured, parsePublicEnv } from "@/lib/env/public";
import { parseServerEnv } from "@/lib/env/server";

describe("public env", () => {
  it("applies local defaults when values are empty", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "", NEXT_PUBLIC_APP_URL: "" });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:4200");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("rejects malformed URLs loudly", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it("reports Supabase as configured only when both values are present", () => {
    expect(
      isSupabaseConfigured(parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })),
    ).toBe(false);
    expect(
      isSupabaseConfigured(
        parsePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        }),
      ),
    ).toBe(true);
  });
});

describe("server env", () => {
  it("normalises the API base URL", () => {
    expect(
      parseServerEnv({ NEXTREACH_API_URL: "https://api.example.com///" }).NEXTREACH_API_URL,
    ).toBe("https://api.example.com");
  });

  it("treats blank secrets as unset", () => {
    const env = parseServerEnv({ NEXTREACH_API_URL: "", RESEND_API_KEY: "  " });
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.NEXTREACH_API_URL).toBeUndefined();
  });
});
