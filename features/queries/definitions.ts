import {
  BriefcaseIcon,
  CalendarClockIcon,
  CreditCardIcon,
  HandshakeIcon,
  LifeBuoyIcon,
  MessageCircleQuestionIcon,
  type LucideIcon,
} from "lucide-react";

import { moduleKeys } from "@/content/modules";

/**
 * The single source for the guided query form: topics, their follow-up questions and
 * the allowed options. It drives the form steps, the Zod schemas (client and server)
 * and, later, the labelled chips in the admin. Labels live in messages under
 * `queryForm.topics.<topic>` and `queryForm.questions.<question>.options.<option>`.
 */

export const topicKeys = [
  "pricing",
  "demo",
  "technical",
  "billing",
  "partnership",
  "other",
] as const;
export type Topic = (typeof topicKeys)[number];

export function isTopic(value: unknown): value is Topic {
  return typeof value === "string" && (topicKeys as readonly string[]).includes(value);
}

export const topicIcons: Record<Topic, LucideIcon> = {
  pricing: CreditCardIcon,
  demo: CalendarClockIcon,
  technical: LifeBuoyIcon,
  billing: BriefcaseIcon,
  partnership: HandshakeIcon,
  other: MessageCircleQuestionIcon,
};

type QuestionDef = {
  kind: "single" | "multi";
  options: readonly string[];
};

export const questions = {
  teamSize: { kind: "single", options: ["1", "2-5", "6-20", "20+"] },
  contacts: { kind: "single", options: ["under1k", "1k-10k", "10k-50k", "50k+"] },
  modules: { kind: "multi", options: moduleKeys },
  billingPreference: { kind: "single", options: ["monthly", "yearly"] },
  industry: {
    kind: "single",
    options: [
      "retail",
      "realEstate",
      "education",
      "clinics",
      "ecommerce",
      "services",
      "agency",
      "other",
    ],
  },
  timeSlot: { kind: "single", options: ["morning", "afternoon", "evening"] },
  channel: { kind: "single", options: ["whatsappCall", "googleMeet", "phone"] },
  area: {
    kind: "single",
    options: [
      "whatsappConnection",
      "templates",
      "campaigns",
      "inbox",
      "automations",
      "ai",
      "other",
    ],
  },
  urgency: { kind: "single", options: ["low", "normal", "urgent"] },
  issue: {
    kind: "single",
    options: ["paymentNotApproved", "wrongAmount", "changePlan", "invoice", "other"],
  },
  paymentMethod: { kind: "single", options: ["jazzcash", "easypaisa", "bankTransfer"] },
  partnershipType: { kind: "single", options: ["agency", "reseller", "integration"] },
  clientCount: { kind: "single", options: ["1-5", "6-20", "21-50", "50+"] },
} as const satisfies Record<string, QuestionDef>;

export type QuestionKey = keyof typeof questions;

/** Questions asked for each topic, in order. "other" goes straight to the message. */
export const topicQuestions = {
  pricing: ["teamSize", "contacts", "modules", "billingPreference"],
  demo: ["industry", "timeSlot", "channel"],
  technical: ["area", "urgency"],
  billing: ["issue", "paymentMethod"],
  partnership: ["partnershipType", "clientCount"],
  other: [],
} as const satisfies Record<Topic, readonly QuestionKey[]>;

export const querySources = ["contact_page", "dialog", "pricing"] as const;
export type QuerySource = (typeof querySources)[number];

/** Attachment rules (checked again on the server from the file's bytes). */
export const attachmentRules = {
  maxBytes: 5 * 1024 * 1024,
  types: ["image/png", "image/jpeg", "application/pdf"] as const,
  accept: ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf",
};

export const messageLimits = { min: 20, max: 2000 } as const;
export const subjectLimits = { min: 3, max: 200 } as const;
