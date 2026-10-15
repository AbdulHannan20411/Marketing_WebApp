/**
 * FAQ structure. Questions and answers live in messages under `faq.items.<id>`.
 * Group order and item order here are the display order.
 */
export const faqGroups = [
  { id: "gettingStarted", items: ["whatIs", "whoFor", "needs", "trial"] },
  { id: "whatsapp", items: ["official", "templates", "window", "quality", "numbers"] },
  { id: "stores", items: ["codHow", "shopifyApp", "woocommerce", "autoCancel"] },
  {
    id: "email",
    items: ["emailCampaigns", "ownDomain", "spam", "spamChecker", "sendTime", "translateLanguages"],
  },
  { id: "plans", items: ["plans", "buildOwn", "payment", "approval", "renewal"] },
  { id: "data", items: ["workspace", "importing", "mapsImport", "segmentsUpdate", "team"] },
  { id: "support", items: ["help", "demo", "agencies"] },
] as const;

export type FaqGroupId = (typeof faqGroups)[number]["id"];
export type FaqItemId = (typeof faqGroups)[number]["items"][number];

/** Questions shown in the Home page teaser. */
export const homeFaqIds = [
  "official",
  "trial",
  "payment",
  "window",
] as const satisfies readonly FaqItemId[];
