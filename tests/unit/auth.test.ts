import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  fieldErrors,
  profileSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";
import { classifyPath, safeNextPath } from "@/lib/auth/redirects";
import { normalisePakistaniPhone } from "@/lib/validation/phone";

describe("Pakistani phone numbers", () => {
  it.each([
    ["0300 1234567", "+923001234567"],
    ["03001234567", "+923001234567"],
    ["+92 300 1234567", "+923001234567"],
    ["0092-300-1234567", "+923001234567"],
    ["923001234567", "+923001234567"],
    ["042 35761234", "+924235761234"],
    ["+92 21 3456789", "+92213456789"],
  ])("normalises %s", (input, expected) => {
    expect(normalisePakistaniPhone(input)).toBe(expected);
  });

  it.each(["12345", "0300 12345", "+1 415 555 0100", "abc", "0300123456789", "+92 0300 1234567"])(
    "rejects %s",
    (input) => {
      expect(normalisePakistaniPhone(input)).toBeNull();
    },
  );
});

describe("safeNextPath", () => {
  const fallback = "/en/account";
  it("keeps same-site locale paths with their query", () => {
    expect(safeNextPath("/ur/account/queries/1?x=1", fallback)).toBe("/ur/account/queries/1?x=1");
  });
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/fr/account",
    "account",
    "javascript:alert(1)",
    "",
    null,
  ])("rejects %s", (input) => {
    expect(safeNextPath(input, fallback)).toBe(fallback);
  });
});

describe("classifyPath", () => {
  it("protects account and admin, sends signed-in users away from sign-in and sign-up", () => {
    expect(classifyPath("/en/account")).toBe("protected");
    expect(classifyPath("/ur/account/profile")).toBe("protected");
    expect(classifyPath("/en/admin/queries")).toBe("protected");
    expect(classifyPath("/en/sign-in")).toBe("guest-only");
    expect(classifyPath("/ur/sign-up")).toBe("guest-only");
    expect(classifyPath("/en/reset-password")).toBe("public");
    expect(classifyPath("/en/pricing")).toBe("public");
    expect(classifyPath("/account")).toBe("public");
  });
});

describe("auth schemas", () => {
  const validSignUp = {
    fullName: "Ayesha Khan",
    email: "  Ayesha@Example.COM ",
    phone: "0300 1234567",
    password: "correct horse",
    confirmPassword: "correct horse",
    preferredLocale: "ur",
    consent: true,
  };

  it("normalises email and phone on sign-up", () => {
    const parsed = signUpSchema.parse(validSignUp);
    expect(parsed.email).toBe("ayesha@example.com");
    expect(parsed.phone).toBe("+923001234567");
  });

  it("treats an empty phone as not given", () => {
    expect(signUpSchema.parse({ ...validSignUp, phone: "" }).phone).toBeNull();
  });

  it("reports field errors as translatable codes", () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      email: "nope",
      phone: "123",
      password: "short",
      confirmPassword: "other",
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toMatchObject({
        email: "email",
        phone: "phone",
        password: "passwordMin",
        consent: "consent",
      });
    }
  });

  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: "different!" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).confirmPassword).toBe("passwordMismatch");
  });

  it("rejects unsupported locales and over-long passwords", () => {
    expect(
      profileSchema.safeParse({ fullName: "Ali", phone: "", preferredLocale: "fr" }).success,
    ).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x".repeat(73) }).success).toBe(
      false,
    );
  });

  it("needs the current password to change it", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      password: "new password 1",
      confirmPassword: "new password 1",
    });
    expect(result.success).toBe(false);
  });
});
