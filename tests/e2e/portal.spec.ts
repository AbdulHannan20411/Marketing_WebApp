import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  createTestUser,
  deleteQueriesByEmail,
  deleteTestUser,
  insertQuery,
  insertTeamMessage,
  queriesByEmail,
  queryStatus,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/*
 * Customer portal against the real Supabase project. Team replies are inserted
 * directly (the admin UI arrives in Phase 7). Everything is deleted afterwards.
 */
test.skip(!supabaseConfigured, "Supabase is not configured");
test.skip(({ isMobile }) => isMobile, "portal flows run once, on desktop");
test.describe.configure({ mode: "serial" });

const NAV = { timeout: 15_000 };
let customer: TestUser | undefined;
let stranger: TestUser | undefined;
let team: TestUser | undefined;
let customerEmail = "";
let earlier: { id: string; reference: string; attachmentId: string | null };

test.beforeAll(async () => {
  team = await createTestUser({ fullName: "Sana (team)", superadmin: true });
  stranger = await createTestUser({ fullName: "Someone Else" });
});

test.afterAll(async () => {
  if (customerEmail) await deleteQueriesByEmail(customerEmail);
  await deleteTestUser(customer);
  await deleteTestUser(stranger);
  await deleteTestUser(team);
});

async function signIn(page: Page, user: TestUser, next = "/en/account") {
  await page.goto(`/en/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/]/g, "\\/")}$`), NAV);
}

test("a query sent while signed out appears once the account is confirmed", async ({ page }) => {
  // The account doesn't exist yet when the query is sent.
  customerEmail = `e2e-portal-${randomUUID().slice(0, 8)}@example.com`;
  earlier = await insertQuery({ email: customerEmail, withAttachment: true });

  // Sign-up with that email, confirmed (as clicking the email link would do).
  customer = await createTestUser({ fullName: "Portal Customer", email: customerEmail });
  const [linked] = await queriesByEmail(customerEmail);
  expect(linked?.customer_id).toBe(customer.id);

  await signIn(page, customer);
  const item = page.getByRole("link", { name: `Open query ${earlier.reference}` });
  await expect(item).toBeVisible();
  await expect(item).toContainText("Plan for my shop");
  await expect(item).toContainText("Received");
});

test("team replies show as unread, open as a conversation and clear the dot", async ({ page }) => {
  await insertTeamMessage(earlier.id, team!.id, "Hello! The Growth plan fits a shop your size.");
  await insertTeamMessage(earlier.id, team!.id, "INTERNAL: check their payment first", true);

  await signIn(page, customer!);
  const item = page.getByRole("link", { name: `Open query ${earlier.reference}` });
  await expect(item).toContainText("New reply");
  await expect(item).toContainText("Awaiting your reply");
  await expect(page.getByRole("navigation", { name: "Account" })).toContainText("1 new reply");

  await item.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plan for my shop", NAV);
  await expect(page.getByText("Hello! The Growth plan fits a shop your size.")).toBeVisible();
  await expect(page.getByText("NextReach team").first()).toBeVisible();
  // Structured answers from the form are shown with labels.
  await expect(page.getByText("How big is your team?")).toBeVisible();
  // Internal notes never reach the customer.
  await expect(page.getByText("INTERNAL: check their payment first")).toHaveCount(0);

  // Opening the thread marks it read.
  await page.getByRole("link", { name: "All queries" }).click();
  await expect(
    page.getByRole("link", { name: `Open query ${earlier.reference}` }),
  ).not.toContainText("New reply", NAV);
});

test("new team replies appear live, and the customer can reply", async ({ page }) => {
  await signIn(page, customer!, `/en/account/queries/${earlier.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plan for my shop");

  // Live: a reply inserted elsewhere shows up without reloading.
  await page.waitForTimeout(1500); // let the realtime subscription connect
  await insertTeamMessage(earlier.id, team!.id, "Live update: we can also set up a demo.");
  await expect(page.getByText("Live update: we can also set up a demo.")).toBeVisible({
    timeout: 15_000,
  });

  // Empty replies are refused on the client.
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Please write a reply.")).toBeVisible();

  await page.getByLabel("Your reply").fill("Thanks! A demo on Friday would be great.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Your reply has been sent.")).toBeVisible(NAV);
  await expect(page.getByText("Thanks! A demo on Friday would be great.")).toBeVisible();
  expect(await queryStatus(earlier.id)).toBe("open");
});

test("attachments download through a short-lived signed URL, only for the owner", async ({
  page,
  browser,
}) => {
  await signIn(page, customer!, `/en/account/queries/${earlier.id}`);
  const link = page.getByRole("link", { name: /receipt\.png/ });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBe(`/en/account/attachments/${earlier.attachmentId}`);

  const response = await page.request.get(href!, { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  const location = response.headers()["location"] ?? "";
  expect(location).toContain("/storage/v1/object/sign/query-attachments/");
  expect(location).toContain("token=");
  const file = await page.request.get(location);
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0, 4).toString("hex")).toBe("89504e47");

  // Another signed-in customer gets nothing.
  const other = await browser.newPage();
  await signIn(other, stranger!);
  const denied = await other.request.get(href!, { maxRedirects: 0 });
  expect(denied.status()).toBe(404);
  // Someone else's thread shows "not found" and none of its content. (The account
  // area streams, so the status is sent before the ownership check: 200, noindex.)
  await other.goto(`/en/account/queries/${earlier.id}`);
  await expect(other.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  await expect(other.getByText("Plan for my shop")).toHaveCount(0);
  await other.close();
});

test("mark as resolved, and replying again reopens", async ({ page }) => {
  await signIn(page, customer!, `/en/account/queries/${earlier.id}`);
  await page.getByRole("button", { name: "Mark as resolved" }).click();
  await expect(page.getByText("You marked this query as resolved.")).toBeVisible(NAV);
  expect(await queryStatus(earlier.id)).toBe("resolved");

  await page.getByLabel("Your reply").fill("One more question about invoices, please.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Your reply has been sent.")).toBeVisible(NAV);
  expect(await queryStatus(earlier.id)).toBe("open");
});

test("closed queries can be read but not replied to", async ({ page }) => {
  const closed = await insertQuery({
    email: customerEmail,
    customerId: customer!.id,
    status: "closed",
  });
  await signIn(page, customer!, `/en/account/queries/${closed.id}`);
  await expect(page.getByText("This query is closed.")).toBeVisible();
  await expect(page.getByLabel("Your reply")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Send a new question" })).toBeVisible();
});

test("the portal renders right-to-left in Urdu", async ({ page }) => {
  await signIn(page, customer!);
  await page.goto("/ur/account");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("آپ کے سوالات");
});
