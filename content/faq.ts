/**
 * FAQ structure. Questions and answers live in messages under `faq.items.<id>`.
 * Group order and item order here are the display order.
 */
export const faqGroups = [
  { id: "gettingStarted", items: ["whatIs", "whoFor", "needs", "trial"] },
  { id: "whatsapp", items: ["official", "templates", "window", "quality", "numbers"] },
  { id: "plans", items: ["plans", "buildOwn", "payment", "approval"] },
  { id: "data", items: ["workspace", "importing", "team"] },
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
