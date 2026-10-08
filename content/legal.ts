/**
 * Legal page structure. Text lives in messages under `legal.<page>.sections.<id>`.
 *
 * TODO: legal review. These are structured templates, not legal advice. Have a lawyer
 * review every page and fill in the company details below before launch.
 */
export const legalDetails = {
  // TODO: legal review — registered company name.
  company: "[Company legal name]",
  // TODO: legal review — registered address.
  address: "[Registered address, Pakistan]",
  // TODO: legal review — monitored contact email for privacy and legal requests.
  email: "[legal@yourdomain.com]",
  // TODO: legal review — the date these terms take effect.
  effectiveDate: "[Effective date]",
} as const;

export const legalPages = {
  privacy: {
    sections: [
      "intro",
      "collect",
      "use",
      "whatsapp",
      "sharing",
      "retention",
      "security",
      "rights",
      "cookies",
      "children",
      "changes",
      "contact",
    ],
  },
  terms: {
    sections: [
      "acceptance",
      "service",
      "accounts",
      "acceptableUse",
      "payments",
      "trials",
      "cancellation",
      "content",
      "availability",
      "liability",
      "termination",
      "law",
      "changes",
      "contact",
    ],
  },
  refund: {
    sections: ["overview", "trials", "eligible", "notEligible", "request", "processing", "contact"],
  },
} as const;

export type LegalPageId = keyof typeof legalPages;
