import {
  BarChart3Icon,
  BotIcon,
  CircleFadingPlusIcon,
  ContactRoundIcon,
  GaugeIcon,
  InboxIcon,
  KanbanSquareIcon,
  MailIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
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
  "statusAd",
  "email",
  "cod",
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
  /** Recently launched: shown with a "New" badge. */
  isNew?: boolean;
  points: readonly string[];
};

export const featureAreas = [
  {
    id: "whatsapp",
    icon: MegaphoneIcon,
    mockup: "campaign",
    slug: "whatsapp-campaigns",
    points: ["connect", "templates", "campaigns", "tracking", "quality", "translate"],
  },
  {
    id: "statusAds",
    icon: CircleFadingPlusIcon,
    mockup: "statusAd",
    slug: "status-ads",
    isNew: true,
    points: [
      "connect",
      "builder",
      "aiCopy",
      "audience",
      "budget",
      "review",
      "control",
      "results",
      "contacts",
    ],
  },
  {
    id: "email",
    icon: MailIcon,
    mockup: "email",
    slug: "email-marketing",
    points: [
      "domain",
      "trial",
      "editor",
      "campaigns",
      "abTest",
      "forms",
      "consent",
      "deliverability",
      "reports",
      "spamCheck",
      "clickMap",
      "smartTime",
      "personalised",
      "translate",
      "dragDrop",
    ],
  },
  {
    id: "ecommerce",
    icon: ShoppingCartIcon,
    mockup: "cod",
    slug: "ecommerce-cod",
    points: [
      "connect",
      "codConfirm",
      "outcomes",
      "reminder",
      "typed",
      "updates",
      "carts",
      "sync",
      "dashboard",
      "limits",
    ],
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
    points: ["contacts", "segments", "import", "history", "discovery", "groups"],
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
    points: ["sequences", "fallback", "storeTriggers", "recipes", "quiet", "cap", "stop"],
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
    points: ["invite", "permissions", "security", "history"],
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
  /** Optional "What you need" list, before the capabilities. */
  requirements?: readonly string[];
  /** Optional "Good to know" list shown beside the requirements. */
  notes?: readonly string[];
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
    related: ["status-ads", "email-marketing", "inbox"],
  },
  "status-ads": {
    slug: "status-ads",
    icon: CircleFadingPlusIcon,
    mockup: "statusAd",
    areas: ["statusAds"],
    benefits: ["newCustomers", "oneTap", "ownAccount", "spendToSales"],
    steps: ["connect", "build", "launch"],
    capabilities: [
      "oneSignIn",
      "aiCopy",
      "media",
      "prefilled",
      "greeting",
      "audience",
      "groups",
      "lookalike",
      "budget",
      "preview",
      "review",
      "control",
      "results",
      "contacts",
    ],
    requirements: ["adAccount", "page", "number", "plan"],
    notes: ["instagram", "billing", "privacy", "availability"],
    faqs: ["spend", "instagram", "review", "privacy", "stop"],
    related: ["whatsapp-campaigns", "automations", "sales-leads"],
  },
  "email-marketing": {
    slug: "email-marketing",
    icon: MailIcon,
    mockup: "email",
    areas: ["email"],
    benefits: ["ownDomain", "oneList", "protected", "consent"],
    steps: ["domain", "design", "send"],
    capabilities: [
      "dnsSetup",
      "trialAddress",
      "editor",
      "preview",
      "aiDraft",
      "abTesting",
      "signupForms",
      "unsubscribe",
      "warmup",
      "validation",
      "autoPause",
      "reports",
      "spamCheck",
      "aiWording",
      "clickMap",
      "smartTime",
      "personalised",
      "translate",
      "dragDrop",
    ],
    faqs: ["warmup", "badAddresses", "replies"],
    related: ["whatsapp-campaigns", "crm-discovery", "automations"],
  },
  "ecommerce-cod": {
    slug: "ecommerce-cod",
    icon: ShoppingCartIcon,
    mockup: "cod",
    areas: ["ecommerce"],
    benefits: ["fewerReturns", "storeUpdates", "updates", "recovered"],
    steps: ["order", "reply", "followUp"],
    capabilities: [
      "shopify",
      "woocommerce",
      "codButtons",
      "typedAnswers",
      "reminder",
      "cancelChoice",
      "orderUpdates",
      "cartRecovery",
      "productSync",
      "buyersContacts",
      "dashboard",
      "storeTriggers",
    ],
    faqs: ["requirements", "templates", "results"],
    related: ["whatsapp-campaigns", "automations", "sales-leads"],
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
      "segments",
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
    capabilities: [
      "triggers",
      "storeTriggers",
      "fallback",
      "waits",
      "templates",
      "conditions",
      "alerts",
      "limits",
    ],
    faqs: ["recipes", "spam", "replies"],
    related: ["sales-leads", "whatsapp-campaigns", "ai"],
  },
} as const satisfies Record<FeatureSlug, FeaturePage>;

/** Facts used for counters. Real product numbers only. */
export const productFacts = {
  modules: 12,
  automationRecipes: 8,
  paymentMethods: 3,
  languages: 2,
} as const;
