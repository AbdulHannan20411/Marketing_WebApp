import {
  BarChart3Icon,
  BotIcon,
  ContactRoundIcon,
  GaugeIcon,
  InboxIcon,
  KanbanSquareIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  UsersRoundIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

import type { FeatureSlug } from "./feature-slugs";

/**
 * The single typed source for feature content. Strings live in messages under
 * `features.areas.<id>` and `featurePages.<slug>`; this file holds structure only.
 */

export const mockupIds = [
  "campaign",
  "inbox",
  "crm",
  "catalog",
  "leadBoard",
  "aiAssistant",
  "leadScoring",
  "automation",
  "reporting",
  "employees",
] as const;
export type MockupId = (typeof mockupIds)[number];

export { featureSlugs, isFeatureSlug, type FeatureSlug } from "./feature-slugs";

type Area = {
  id: string;
  icon: LucideIcon;
  mockup: MockupId;
  /** Detail page that covers this area, if any. */
  slug?: FeatureSlug;
  points: readonly string[];
};

export const featureAreas = [
  {
    id: "whatsapp",
    icon: MegaphoneIcon,
    mockup: "campaign",
    slug: "whatsapp-campaigns",
    points: ["connect", "templates", "campaigns", "tracking", "quality"],
  },
  {
    id: "inbox",
    icon: InboxIcon,
    mockup: "inbox",
    slug: "inbox",
    points: ["oneInbox", "window", "media", "assign"],
  },
  {
    id: "crm",
    icon: ContactRoundIcon,
    mockup: "crm",
    slug: "crm-discovery",
    points: ["contacts", "import", "history", "discovery"],
  },
  {
    id: "catalog",
    icon: ShoppingBagIcon,
    mockup: "catalog",
    slug: "sales-leads",
    points: ["products", "link", "opens"],
  },
  {
    id: "leads",
    icon: KanbanSquareIcon,
    mockup: "leadBoard",
    slug: "sales-leads",
    points: ["stages", "automatic", "focus"],
  },
  {
    id: "aiAssistant",
    icon: BotIcon,
    mockup: "aiAssistant",
    slug: "ai",
    points: ["writing", "autoReply", "grounded"],
  },
  {
    id: "leadScoring",
    icon: GaugeIcon,
    mockup: "leadScoring",
    slug: "ai",
    points: ["reads", "places", "review"],
  },
  {
    id: "automations",
    icon: WorkflowIcon,
    mockup: "automation",
    slug: "automations",
    points: ["sequences", "recipes", "quiet", "cap", "stop"],
  },
  {
    id: "reporting",
    icon: BarChart3Icon,
    mockup: "reporting",
    points: ["campaigns", "team", "exports"],
  },
  {
    id: "employees",
    icon: UsersRoundIcon,
    mockup: "employees",
    points: ["invite", "permissions", "security"],
  },
] as const satisfies readonly Area[];

export type FeatureAreaId = (typeof featureAreas)[number]["id"];

type FeaturePage = {
  slug: FeatureSlug;
  icon: LucideIcon;
  mockup: MockupId;
  /** Areas from `featureAreas` this page covers (for the overview's links). */
  areas: readonly FeatureAreaId[];
  benefits: readonly string[];
  steps: readonly string[];
  capabilities: readonly string[];
  faqs: readonly string[];
  related: readonly FeatureSlug[];
};

export const featurePages = {
  "whatsapp-campaigns": {
    slug: "whatsapp-campaigns",
    icon: MegaphoneIcon,
    mockup: "campaign",
    areas: ["whatsapp"],
    benefits: ["official", "read", "schedule", "quality"],
    steps: ["connect", "template", "send"],
    capabilities: [
      "signup",
      "templateTypes",
      "audiences",
      "recurrence",
      "statuses",
      "qualityRating",
    ],
    faqs: ["approval", "bulk", "cost"],
    related: ["inbox", "automations", "crm-discovery"],
  },
  inbox: {
    slug: "inbox",
    icon: InboxIcon,
    mockup: "inbox",
    areas: ["inbox"],
    benefits: ["together", "window", "context", "nothingLost"],
    steps: ["arrive", "assign", "reply"],
    capabilities: ["allChats", "assignment", "windowTimer", "media", "templatesOutside", "history"],
    faqs: ["window", "phones", "team"],
    related: ["whatsapp-campaigns", "ai", "sales-leads"],
  },
  "crm-discovery": {
    slug: "crm-discovery",
    icon: ContactRoundIcon,
    mockup: "crm",
    areas: ["crm"],
    benefits: ["organised", "importEasy", "discover", "history"],
    steps: ["import", "organise", "reach"],
    capabilities: [
      "groupsTags",
      "csvMapping",
      "exports",
      "recordHistory",
      "mapSearch",
      "importBusinesses",
    ],
    faqs: ["csv", "discoveryData", "consent"],
    related: ["whatsapp-campaigns", "sales-leads", "automations"],
  },
  "sales-leads": {
    slug: "sales-leads",
    icon: ShoppingBagIcon,
    mockup: "catalog",
    areas: ["catalog", "leads"],
    benefits: ["showcase", "oneTap", "knowInterest", "boardMoves"],
    steps: ["addProducts", "share", "follow"],
    capabilities: ["productCards", "catalogLink", "openTracking", "stages", "autoMove", "filters"],
    faqs: ["checkout", "stages", "manual"],
    related: ["ai", "automations", "inbox"],
  },
  ai: {
    slug: "ai",
    icon: BotIcon,
    mockup: "aiAssistant",
    areas: ["aiAssistant", "leadScoring"],
    benefits: ["writeFaster", "neverMiss", "grounded", "scoring"],
    steps: ["teach", "choose", "review"],
    capabilities: [
      "templateHelp",
      "campaignHelp",
      "greetingReplies",
      "firstMessage",
      "unanswered",
      "leadScoring",
    ],
    faqs: ["prices", "control", "language"],
    related: ["inbox", "sales-leads", "automations"],
  },
  automations: {
    slug: "automations",
    icon: WorkflowIcon,
    mockup: "automation",
    areas: ["automations"],
    benefits: ["followUp", "recipes", "polite", "stops"],
    steps: ["pick", "adjust", "turnOn"],
    capabilities: ["triggers", "waits", "templates", "conditions", "alerts", "limits"],
    faqs: ["recipes", "spam", "replies"],
    related: ["sales-leads", "whatsapp-campaigns", "ai"],
  },
} as const satisfies Record<FeatureSlug, FeaturePage>;

/** Facts used for counters. Real product numbers only. */
export const productFacts = {
  modules: 9,
  automationRecipes: 8,
  paymentMethods: 3,
  languages: 2,
} as const;
