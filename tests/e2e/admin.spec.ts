import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  createTestUser,
  deleteQueriesByEmail,
  deleteSavedRepliesTitled,
  deleteTestUser,
  getSettings,
  insertQuery,
  messagesOf,
  queryRow,
  restoreSettings,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/*
 * Super Admin area against the real Supabase project. Test users, queries and saved
 * replies are deleted afterwards, and the global settings are restored.
 */
test.skip(!supabaseConfigured, "Supabase is not configured");
test.skip(({ isMobile }) => isMobile, "admin flows run once, on desktop");
test.describe.configure({ mode: "serial" });

const NAV = { timeout: 15_000 };
const RUN = randomUUID().slice(0, 8);
const SAVED_PREFIX = `E2E ${RUN}`;
let admin: TestUser | undefined;
let customer: TestUser | undefined;
let customerEmail = "";
let query: { id: string; reference: string };
let originalSettings: Awaited<ReturnType<typeof getSettings>> | undefined;

test.beforeAll(async () => {
  admin = await createTestUser({ fullName: `Sana ${RUN}`, superadmin: true });
  customerEmail = `e2e-admin-${RUN}@example.com`;
  customer = await createTestUser({ fullName: `Ayesha ${RUN}`, email: customerEmail });
  query = await insertQuery({
    email: customerEmail,
    customerId: customer.id,
    withAttachment: true,
    subject: `Shop plan ${RUN}`,
    name: `Ayesha ${RUN}`,
  });
  originalSettings = await getSettings();
});

test.afterAll(async () => {
  if (originalSettings) await restoreSettings(originalSettings);
  await deleteSavedRepliesTitled(SAVED_PREFIX);
  if (customerEmail) await deleteQueriesByEmail(customerEmail);
  await deleteTestUser(customer);
  await deleteTestUser(admin);
});

async function signIn(page: Page, user: TestUser, next: string) {
  await page.goto(`/en/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?]/g, "\\$&")}$`), NAV);
}

test("customers can't see the admin area", async ({ page }) => {
  await signIn(page, customer!, "/en/account");
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  const denied = await page.request.get("/en/admin/attachments/" + randomUUID(), {
    maxRedirects: 0,
  });
  expect(denied.status()).toBe(404);
});

test("dashboard shows the counts and the queries waiting longest", async ({ page }) => {
  await signIn(page, admin!, "/en/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("All queries", { exact: true })).toBeVisible();
  await expect(page.getByText("Average first response")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Queries by topic" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Waiting longest for a reply" })).toBeVisible();
});

test("the inbox searches, filters and updates live", async ({ page }) => {
  await signIn(page, admin!, "/en/admin/queries");
  await page.getByLabel("Search").fill(RUN);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${RUN}`), NAV);
  const item = page.getByRole("link", { name: `Open query ${query.reference}` });
  await expect(item).toBeVisible();
  await expect(item).toContainText(`Shop plan ${RUN}`);

  // A filter that excludes it.
  await page.getByLabel("Status").selectOption("closed");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No queries match these filters.")).toBeVisible(NAV);

  // Back to everything matching the search; a new query appears without reloading.
  await page.goto(`/en/admin/queries?q=${RUN}`);
  await expect(item).toBeVisible();
  await page.waitForTimeout(1500); // let the realtime subscription connect
  const live = await insertQuery({ email: customerEmail, subject: `Live query ${RUN}` });
  await expect(page.getByRole("link", { name: `Open query ${live.reference}` })).toBeVisible({
    timeout: 15_000,
  });
});

test("query detail: answers, note, reply, assignment, status and activity", async ({ page }) => {
  await signIn(page, admin!, `/en/admin/queries/${query.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Shop plan ${RUN}`);
  // Structured answers as chips, and the sender.
  await expect(page.getByText("How big is your team?")).toBeVisible();
  await expect(page.getByText("2–5 people")).toBeVisible();
  await expect(page.getByRole("link", { name: customerEmail })).toBeVisible();
  await expect(page.getByRole("link", { name: /receipt\.png/ })).toHaveAttribute(
    "href",
    /\/en\/admin\/attachments\//,
  );

  // Internal note.
  await page.getByRole("button", { name: "Internal note" }).click();
  await page.getByLabel("Your note").fill(`Check their payment ${RUN}`);
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Note added.")).toBeVisible(NAV);
  await expect(page.getByText(`Check their payment ${RUN}`)).toBeVisible();

  // Public reply: emailed, and the status moves to "awaiting customer".
  await page.getByRole("button", { name: "Reply to customer" }).click();
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Please write something first.")).toBeVisible();
  await page.getByLabel("Your reply").fill(`Hello Ayesha, the Growth plan fits ${RUN}`);
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Reply sent. The customer has been emailed.")).toBeVisible(NAV);
  await expect.poll(async () => (await queryRow(query.id))?.status).toBe("awaiting_customer");
  const messages = await messagesOf(query.id);
  expect(messages.map((m) => [m.body, m.is_internal])).toEqual([
    [`Check their payment ${RUN}`, true],
    [`Hello Ayesha, the Growth plan fits ${RUN}`, false],
  ]);

  // Assign to me, then resolve.
  await page.getByLabel("Assigned to").selectOption({ label: `Sana ${RUN}` });
  await expect(page.getByText("Saved.", { exact: true })).toBeVisible(NAV);
  await expect.poll(async () => (await queryRow(query.id))?.assignee_id).toBe(admin!.id);
  await page.getByLabel("Status").selectOption("resolved");
  await expect.poll(async () => (await queryRow(query.id))?.status).toBe("resolved");

  // Activity log.
  const activity = page.getByRole("region", { name: "Activity" });
  await expect(activity).toContainText(`Sana ${RUN} assigned it to Sana ${RUN}`, NAV);
  await expect(activity).toContainText("changed the status from Awaiting customer to Resolved");
  await expect(activity).toContainText(`Sana ${RUN} replied`);
  await expect(activity).toContainText(`Sana ${RUN} added an internal note`);
});

test("the customer sees the reply but never the note", async ({ page }) => {
  await signIn(page, customer!, `/en/account/queries/${query.id}`);
  await expect(page.getByText(`Hello Ayesha, the Growth plan fits ${RUN}`)).toBeVisible();
  await expect(page.getByText(`Check their payment ${RUN}`)).toHaveCount(0);
});

test("saved replies: create, insert with placeholders, edit and delete", async ({ page }) => {
  await signIn(page, admin!, "/en/admin/saved-replies");
  const title = `${SAVED_PREFIX} welcome`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Text").fill("Hi [name], thanks for query [reference].");
  await page.getByRole("button", { name: "Add saved reply" }).click();
  await expect(page.getByText("Saved reply added.")).toBeVisible(NAV);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Use it in the composer.
  await page.goto(`/en/admin/queries/${query.id}`);
  await page.getByLabel("Insert a saved reply").selectOption({ label: title });
  await expect(page.getByLabel("Your reply")).toHaveValue(
    `Hi Ayesha ${RUN}, thanks for query ${query.reference}.`,
  );

  // Edit, then delete.
  await page.goto("/en/admin/saved-replies");
  await page.getByRole("button", { name: `Edit ${title}` }).click();
  await page.getByLabel("Title").nth(1).fill(`${title} v2`);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved reply updated.")).toBeVisible(NAV);
  await expect(page.getByRole("heading", { name: `${title} v2` })).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: `Delete ${title} v2` }).click();
  await expect(page.getByText("Saved reply deleted.")).toBeVisible(NAV);
  await expect(page.getByRole("heading", { name: `${title} v2` })).toHaveCount(0);
});

test("customers: list, view queries, suspend and restore", async ({ page, browser }) => {
  await signIn(page, admin!, "/en/admin/customers");
  await page.getByLabel("Search customers").fill(customerEmail);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const row = page.getByRole("listitem").filter({ hasText: customerEmail });
  await expect(row).toBeVisible(NAV);
  await expect(row).toContainText("Active");

  await row.getByRole("button", { name: "Suspend" }).click();
  const dialog = page.getByRole("dialog", { name: "Suspend this customer?" });
  await expect(dialog).toContainText(customerEmail);
  await dialog.getByRole("button", { name: "Suspend" }).click();
  await expect(row).toContainText("Suspended", NAV);

  // The customer can no longer sign in.
  const other = await browser.newPage();
  await other.goto("/en/sign-in");
  await other.getByLabel("Email", { exact: true }).fill(customer!.email);
  await other.getByLabel("Password", { exact: true }).fill(customer!.password);
  await other.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(other.getByText("This account has been suspended.", { exact: false })).toBeVisible(
    NAV,
  );
  await other.close();

  await row.getByRole("button", { name: "Restore" }).click();
  await expect(row).toContainText("Active", NAV);

  // Their queries, in the inbox.
  await row.getByRole("link", { name: /View queries/ }).click();
  await expect(page.getByText(`Showing queries from Ayesha ${RUN}.`)).toBeVisible(NAV);
  await expect(page.getByRole("link", { name: `Open query ${query.reference}` })).toBeVisible();
});

test("settings validate and save recipients and acknowledgement texts", async ({ page }) => {
  await signIn(page, admin!, "/en/admin/settings");
  const recipients = page.getByLabel("Extra notification recipients");
  await recipients.fill("team@example.com\nnot-an-email");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("“not-an-email” isn't a valid email address.")).toBeVisible(NAV);

  await recipients.fill(`sales-${RUN}@example.com\nSupport-${RUN}@Example.com`);
  await page.getByLabel("Acknowledgement text (English)").fill(`Thanks! ${RUN}`);
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible(NAV);

  const saved = await getSettings();
  expect(saved.notification_recipients).toEqual([
    `sales-${RUN}@example.com`,
    `support-${RUN}@example.com`,
  ]);
  expect(saved.auto_ack_en).toBe(`Thanks! ${RUN}`);
});

test("the admin area renders right-to-left in Urdu", async ({ page }) => {
  await signIn(page, admin!, "/en/admin");
  await page.goto("/ur/admin/queries");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("سوالات");
});
