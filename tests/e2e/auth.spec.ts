import { expect, test, type Page } from "@playwright/test";

import {
  createTestUser,
  deleteTestUser,
  profileOf,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/** Sign-in makes several round trips to Supabase; allow for a remote region under load. */
const AUTH_NAV = { timeout: 15_000 };

/*
 * Auth against the real Supabase project in .env.local. Test users are created
 * pre-confirmed through the admin API and deleted afterwards.
 */
test.skip(!supabaseConfigured, "Supabase is not configured");
test.skip(({ isMobile }) => isMobile, "auth flows run once, on desktop");
test.describe.configure({ mode: "serial" });

let customer: TestUser | undefined;
let admin: TestUser | undefined;

test.beforeAll(async () => {
  customer = await createTestUser({ fullName: "Ayesha Customer" });
  admin = await createTestUser({ fullName: "Sana Admin", superadmin: true });
});

test.afterAll(async () => {
  await deleteTestUser(customer);
  await deleteTestUser(admin);
});

async function signIn(page: Page, user: TestUser, path = "/en/sign-in") {
  await page.goto(path);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("signed-out visitors are sent to sign-in with a safe return path", async ({ page }) => {
  await page.goto("/en/account/profile");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fen%2Faccount%2Fprofile$/, AUTH_NAV);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sign in to your support account",
  );
  // Explains this is not the NextReach app account.
  await expect(page.getByRole("link", { name: "sign in to the app" })).toBeVisible();
});

test("wrong password shows a generic error", async ({ page }) => {
  await signIn(page, { ...customer!, password: "definitely-wrong-1" });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "That email and password don't match. Please try again." }),
  ).toBeVisible();
});

test("sign-up validates on the client before anything is sent", async ({ page }) => {
  await page.goto("/en/sign-up");
  await page.getByLabel("Full name").fill("A");
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await page.getByLabel("Phone (optional)").fill("12345");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your name (2 to 120 characters).")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText(/Enter a Pakistani number/)).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByText("Please agree to the Terms and Privacy Policy.")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
});

test("forgot password never reveals whether an account exists", async ({ page }) => {
  await page.goto("/en/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("nobody-e2e@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeFocused();
  await expect(page.getByRole("status")).toContainText("If nobody-e2e@example.com has an account");
});

test("customer signs in, returns to the requested page, edits the profile and signs out", async ({
  page,
}) => {
  await signIn(page, customer!, "/en/sign-in?next=%2Fen%2Faccount%2Fprofile");
  await expect(page).toHaveURL(/\/en\/account\/profile$/, AUTH_NAV);
  await expect(page.getByText(`Signed in as ${customer!.email}`)).toBeVisible();

  // Signed-in users skip the sign-in page.
  await page.goto("/en/sign-in");
  await expect(page).toHaveURL(/\/en\/account$/, AUTH_NAV);

  await page.goto("/en/account/profile");
  await page.getByLabel("Full name").fill("Ayesha Khan");
  await page.getByLabel("Phone (optional)").fill("0300 1234567");
  await page.getByLabel("Preferred language for emails").selectOption("ur");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your details have been saved.")).toBeVisible();
  expect(await profileOf(customer!)).toMatchObject({
    full_name: "Ayesha Khan",
    phone: "+923001234567",
    locale: "ur",
    role: "customer",
  });

  await page.getByLabel("Current password").fill("not-my-password");
  await page.getByLabel("New password", { exact: true }).fill("a brand new password");
  await page.getByLabel("Confirm new password").fill("a brand new password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Your current password is not correct." }),
  ).toBeVisible();

  // Customers do not see the admin link, and the admin area is a 404 for them.
  await expect(page.getByRole("link", { name: "Admin area" })).toHaveCount(0);
  const adminResponse = await page.goto("/en/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  expect(adminResponse?.status()).toBeLessThan(500);

  await page.goto("/en/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en$/, AUTH_NAV);
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in/, AUTH_NAV);
});

test("a Super Admin can open the admin area", async ({ page }) => {
  await signIn(page, admin!);
  await expect(page).toHaveURL(/\/en\/account$/, AUTH_NAV);
  await page.getByRole("link", { name: "Admin area" }).click();
  await expect(page).toHaveURL(/\/en\/admin$/, AUTH_NAV);
  await expect(page.getByText(`Signed in as a Super Admin (${admin!.email}).`)).toBeVisible();
});

test("Urdu auth pages render right-to-left", async ({ page }) => {
  await page.goto("/ur/sign-in");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "اپنے سپورٹ اکاؤنٹ میں سائن اِن کریں",
  );
});
