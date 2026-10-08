import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  createTestUser,
  deleteQueriesByEmail,
  deleteTestUser,
  queriesByEmail,
  storageObjectExists,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/*
 * The guided query form against the real Supabase project. Each test uses its own
 * email (and forwarded IP, so the per-IP limit doesn't trip on repeated local runs);
 * everything created is deleted afterwards.
 */
test.skip(!supabaseConfigured, "Supabase is not configured");
test.skip(({ isMobile }) => isMobile, "submissions run once, on desktop");

const emails: string[] = [];
let customer: TestUser | undefined;
// A Super Admin, so the "new query" team email is produced too.
let teamMember: TestUser | undefined;

test.beforeAll(async () => {
  teamMember = await createTestUser({ fullName: "Team Member", superadmin: true });
});

function newEmail() {
  const email = `e2e-q-${randomUUID().slice(0, 8)}@example.com`;
  emails.push(email);
  return email;
}

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
  });
});

test.afterAll(async () => {
  for (const email of emails) await deleteQueriesByEmail(email);
  if (customer) {
    await deleteQueriesByEmail(customer.email);
    await deleteTestUser(customer);
  }
  await deleteTestUser(teamMember);
});

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
  "hex",
);

/** Option cards hide the native input; people click the card (its label). */
function pick(option: Locator) {
  return option.locator("xpath=ancestor::label[1]").click();
}

async function fillMessageStep(page: Page, options: { email?: string; name?: string } = {}) {
  await page.getByLabel("Subject").fill("Which plan suits a clothing shop?");
  await page
    .getByLabel("Message")
    .fill("We sell clothes in Lahore and have about 3,000 customers on WhatsApp.");
  if (options.name) await page.getByLabel("Your name").filter({ visible: true }).fill(options.name);
  if (options.email)
    await page.getByLabel("Email", { exact: true }).filter({ visible: true }).fill(options.email);
  if (options.email)
    await page.getByLabel("Phone", { exact: true }).filter({ visible: true }).fill("0300 1234567");
  await page
    .getByRole("checkbox", { name: /I agree that NextReach may use these details/ })
    .check();
}

test("visitor sends a pricing query with options and an attachment", async ({ page }) => {
  const email = newEmail();
  await page.goto("/en/contact?utm_source=e2e&utm_campaign=launch");
  await expect(page.getByText("Step 1 of 4")).toBeVisible();

  // Topic is required.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please choose a topic.")).toBeVisible();
  await pick(page.getByRole("radio", { name: /Pricing & plans/ }));
  await page.getByRole("button", { name: "Continue" }).click();

  // Details: every question needs an answer.
  await expect(page.getByRole("heading", { name: "A few quick questions" })).toBeFocused();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please choose an option.").first()).toBeVisible();
  await expect(page.getByText("Please choose at least one.")).toBeVisible();

  await pick(page.getByRole("radio", { name: "2–5 people" }));
  await pick(page.getByRole("radio", { name: "1,000–10,000" }));
  await pick(page.getByRole("checkbox", { name: "WhatsApp Marketing" }));
  await pick(page.getByRole("checkbox", { name: "CRM" }));
  await pick(page.getByRole("radio", { name: "Yearly" }));

  // Going back keeps the answers.
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("radio", { name: "2–5 people" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "CRM" })).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();

  // Message and contact details.
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please write at least 20 characters.")).toBeVisible();
  await fillMessageStep(page, { email, name: "Ayesha Khan" });
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("receipt.png")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Review shows the answers as chips.
  await expect(page.getByRole("heading", { name: "Check and send" })).toBeVisible();
  await expect(page.getByText("2–5 people", { exact: true })).toBeVisible();
  await expect(page.getByText("WhatsApp Marketing", { exact: true })).toBeVisible();
  await page.waitForTimeout(3000); // the server refuses forms sent in under 3 seconds
  await page.getByRole("button", { name: "Send question" }).click();

  await expect(page.getByRole("heading", { name: "Thanks, we've got your question" })).toBeFocused({
    timeout: 15_000,
  });
  const reference = (await page.locator("code").textContent())?.trim() ?? "";
  expect(reference).toMatch(/^NR-\d{4}-\d{5,}$/);
  await expect(
    page.getByRole("link", { name: "Create an account to track replies" }),
  ).toHaveAttribute("href", `/en/sign-up?email=${encodeURIComponent(email)}`);

  // Stored as structured data, with the attachment in the private bucket.
  const [stored] = await queriesByEmail(email);
  expect(stored).toMatchObject({
    reference,
    topic: "pricing",
    source: "contact_page",
    locale: "en",
    phone: "+923001234567",
    customer_id: null,
    answers: {
      teamSize: "2-5",
      contacts: "1k-10k",
      modules: ["whatsapp", "crm"],
      billingPreference: "yearly",
    },
    utm: { utm_source: "e2e", utm_campaign: "launch" },
  });
  expect(stored?.ip_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(stored?.query_attachments).toHaveLength(1);
  expect(stored?.query_attachments[0]).toMatchObject({
    content_type: "image/png",
    file_name: "receipt.png",
  });
  expect(await storageObjectExists(stored!.query_attachments[0]!.storage_path)).toBe(true);
});

test("a file that only pretends to be an image is rejected by the server", async ({ page }) => {
  const email = newEmail();
  await page.goto("/en/contact?topic=other");
  await expect(page.getByRole("radio", { name: /Other/ })).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();
  await fillMessageStep(page, { email, name: "Mallory" });
  await page.locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from("<script>alert(1)</script>"),
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText("Please attach a PNG, JPG or PDF file.").first()).toBeVisible({
    timeout: 15_000,
  });
  expect(await queriesByEmail(email)).toHaveLength(0);
});

test("bots that fill the hidden field get no stored query", async ({ page }) => {
  const email = newEmail();
  await page.goto("/en/contact?topic=other");
  await page.getByRole("button", { name: "Continue" }).click();
  await fillMessageStep(page, { email, name: "Robot" });
  await page.locator('input[name="website"]').fill("https://spam.example");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("heading", { name: "Thanks, we've got your question" })).toBeVisible({
    timeout: 15_000,
  });
  expect(await queriesByEmail(email)).toHaveLength(0);
});

test("the dialog works from a page's call to action and is keyboard operable", async ({ page }) => {
  const email = newEmail();
  await page.goto("/en/about");
  const trigger = page.getByRole("link", { name: "Contact us" }).last();
  await expect(trigger).toHaveAttribute("href", "/en/contact");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Talk to us" });
  await expect(dialog).toBeVisible();

  // Arrow keys move between topic options.
  await dialog.getByRole("radio", { name: /Pricing & plans/ }).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("radio", { name: /Book a demo/ })).toBeChecked();

  await pick(dialog.getByRole("radio", { name: /Other/ }));
  await dialog.getByRole("button", { name: "Continue" }).click();
  await fillMessageStep(page, { email, name: "Dialog User" });
  await dialog.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(3000);
  await dialog.getByRole("button", { name: "Send question" }).click();
  await expect(dialog.getByText(/^NR-\d{4}-\d{5,}$/)).toBeVisible({ timeout: 15_000 });
  expect((await queriesByEmail(email))[0]?.source).toBe("dialog");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("signed-in customers get their details filled in, locked and linked", async ({ page }) => {
  customer = await createTestUser({ fullName: "Bilal Customer" });
  await page.goto("/en/sign-in?next=%2Fen%2Fcontact%3Ftopic%3Dother");
  await page.getByLabel("Email", { exact: true }).filter({ visible: true }).fill(customer.email);
  await page.getByLabel("Password", { exact: true }).fill(customer.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/contact\?topic=other$/, { timeout: 15_000 });

  await page.getByRole("button", { name: "Continue" }).click();
  const email = page.getByLabel("Email", { exact: true }).filter({ visible: true });
  await expect(email).toHaveValue(customer.email);
  await expect(email).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Your name").filter({ visible: true })).toHaveValue(
    "Bilal Customer",
  );

  await fillMessageStep(page);
  await page.getByLabel("Phone", { exact: true }).filter({ visible: true }).fill("042 35761234");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("link", { name: "View in your account" })).toBeVisible({
    timeout: 15_000,
  });

  const [stored] = await queriesByEmail(customer.email);
  expect(stored?.customer_id).toBe(customer.id);
  expect(stored?.phone).toBe("+924235761234");
});

test("Urdu contact form renders right-to-left", async ({ page }) => {
  await page.goto("/ur/contact");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { level: 2, name: "آپ کس بارے میں بات کرنا چاہتے ہیں؟" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: /قیمتیں اور پلانز/ })).toBeVisible();
});
