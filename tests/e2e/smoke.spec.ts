import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  confirmTestUser,
  createTestUser,
  deleteQueriesByEmail,
  deleteTestUser,
  queriesByEmail,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/*
 * The end-to-end journey from the brief, through the real UI:
 *   1. a visitor sends a query while signed out;
 *   2. they sign up with the same email and see the query linked to their account;
 *   3. a Super Admin replies from the admin area;
 *   4. the customer sees the reply;
 *   5. Urdu renders right-to-left.
 * The account is created through the admin API and then confirmed, which is exactly
 * what the sign-up form plus the confirmation link do, without sending a real email.
 */
test.skip(!supabaseConfigured, "Supabase is not configured");
test.skip(({ isMobile }) => isMobile, "the journey runs once, on desktop");
test.describe.configure({ mode: "serial" });

const NAV = { timeout: 15_000 };
const RUN = randomUUID().slice(0, 8);
const email = `e2e-smoke-${RUN}@example.com`;
const subject = `Smoke test plan question ${RUN}`;
let reference = "";
let queryId = "";
let customer: TestUser | undefined;
let admin: TestUser | undefined;

test.beforeAll(async () => {
  admin = await createTestUser({ fullName: `Smoke Admin ${RUN}`, superadmin: true });
});

test.afterAll(async () => {
  await deleteQueriesByEmail(email);
  await deleteTestUser(customer);
  await deleteTestUser(admin);
});

test.beforeEach(async ({ page }) => {
  // Its own forwarded IP, so the per-IP query limit never trips on repeated local runs.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${(Date.now() % 250) + 1}` });
});

function pick(option: Locator) {
  return option.locator("xpath=ancestor::label[1]").click();
}

async function signIn(page: Page, user: TestUser, next: string) {
  await page.goto(`/en/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/]/g, "\\/")}$`), NAV);
}

test("1. a visitor sends a query while signed out", async ({ page }) => {
  await page.goto("/en/contact");
  await pick(page.getByRole("radio", { name: /Book a demo/ }));
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "A few quick questions" })).toBeVisible();
  await pick(page.getByRole("radio", { name: "Retail" }));
  await pick(page.getByRole("radio", { name: /Afternoon/ }));
  await pick(page.getByRole("radio", { name: "Google Meet" }));
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Subject").fill(subject);
  await page
    .getByLabel("Message")
    .fill("We run three shops in Karachi and want to see campaigns and the shared inbox.");
  await page.getByLabel("Your name").filter({ visible: true }).fill("Bilal Ahmed");
  await page.getByLabel("Email", { exact: true }).filter({ visible: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).filter({ visible: true }).fill("0321 7654321");
  await page
    .getByRole("checkbox", { name: /I agree that NextReach may use these details/ })
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  // The anti-spam check needs a few seconds between opening the form and sending.
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send question" }).click();
  const confirmation = page.getByText(/NR-\d{4}-\d{5}/);
  await expect(confirmation).toBeVisible(NAV);
  reference = (await confirmation.textContent())?.match(/NR-\d{4}-\d{5}/)?.[0] ?? "";
  expect(reference).not.toBe("");

  const [stored] = await queriesByEmail(email);
  expect(stored?.reference).toBe(reference);
  expect(stored?.customer_id).toBeNull();
  queryId = stored!.id;
});

test("2. after signing up with that email, the query is in their account", async ({ page }) => {
  // Sign up (unconfirmed), then confirm the email, as the link in the email does.
  customer = await createTestUser({ fullName: "Bilal Ahmed", email, confirmed: false });
  expect((await queriesByEmail(email))[0]?.customer_id).toBeNull();
  await confirmTestUser(customer);
  await expect.poll(async () => (await queriesByEmail(email))[0]?.customer_id).toBe(customer.id);

  await signIn(page, customer, "/en/account");
  const item = page.getByRole("link", { name: `Open query ${reference}` });
  await expect(item).toBeVisible();
  await expect(item).toContainText(subject);
});

test("3. a Super Admin replies from the admin area", async ({ page }) => {
  await signIn(page, admin!, "/en/admin/queries");
  await page.getByLabel("Search").fill(reference);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: `Open query ${reference}` }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(subject, NAV);

  await page.getByLabel("Your reply").fill(`Hi Bilal, Tuesday afternoon works for a demo. ${RUN}`);
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Reply sent. The customer has been emailed.")).toBeVisible(NAV);
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("awaiting_customer", NAV);
});

test("4. the customer sees the reply", async ({ page }) => {
  await signIn(page, customer!, "/en/account");
  const item = page.getByRole("link", { name: `Open query ${reference}` });
  await expect(item).toContainText("New reply");
  await item.click();
  await expect(page.getByText(`Hi Bilal, Tuesday afternoon works for a demo. ${RUN}`)).toBeVisible(
    NAV,
  );
  expect(page.url()).toContain(queryId);
});

test("5. Urdu renders right-to-left", async ({ page }) => {
  await page.goto("/ur");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ur");
  await page.goto("/ur/contact");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
