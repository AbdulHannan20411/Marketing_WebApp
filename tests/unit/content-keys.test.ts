import { describe, expect, it } from "vitest";

import { faqGroups, homeFaqIds } from "@/content/faq";
import { featureAreas, featurePages, featureSlugs } from "@/content/features";
import { legalPages } from "@/content/legal";
import { moduleKeys } from "@/content/modules";
import { useCases } from "@/content/use-cases";
import en from "@/messages/en.json";

/**
 * The typed content sources reference message keys dynamically. This test proves every
 * referenced key exists (the i18n test then proves Urdu has the same keys).
 */
function has(path: string): boolean {
  let node: unknown = en;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return false;
    }
  }
  return typeof node === "string";
}

function missing(paths: string[]): string[] {
  return paths.filter((path) => !has(path));
}

describe("content ↔ message keys", () => {
  it("feature areas", () => {
    const paths = featureAreas.flatMap((area) => [
      `features.areas.${area.id}.nav`,
      `features.areas.${area.id}.title`,
      `features.areas.${area.id}.headline`,
      `features.areas.${area.id}.summary`,
      ...area.points.map((point) => `features.areas.${area.id}.points.${point}`),
    ]);
    expect(missing(paths)).toEqual([]);
  });

  it("feature detail pages", () => {
    const paths = featureSlugs.flatMap((slug) => {
      const page = featurePages[slug];
      const base = `featurePages.pages.${slug}`;
      return [
        ...["metaTitle", "metaDescription", "name", "eyebrow", "title", "subtitle"].map(
          (key) => `${base}.${key}`,
        ),
        ...page.benefits.flatMap((key) => [
          `${base}.benefits.${key}.title`,
          `${base}.benefits.${key}.description`,
        ]),
        ...page.steps.flatMap((key) => [
          `${base}.steps.${key}.title`,
          `${base}.steps.${key}.description`,
        ]),
        ...page.capabilities.map((key) => `${base}.capabilities.${key}`),
        ...page.faqs.flatMap((key) => [`${base}.faqs.${key}.q`, `${base}.faqs.${key}.a`]),
      ];
    });
    expect(missing(paths)).toEqual([]);
  });

  it("use cases", () => {
    const paths = useCases.flatMap((useCase) => {
      const base = `useCases.industries.${useCase.id}`;
      return [
        `${base}.name`,
        `${base}.summary`,
        `${base}.example`,
        ...useCase.challenges.map((key) => `${base}.challenges.${key}`),
        ...useCase.solutions.map((key) => `${base}.solutions.${key}`),
      ];
    });
    expect(missing(paths)).toEqual([]);
  });

  it("FAQ", () => {
    const paths = faqGroups.flatMap((group) => [
      `faq.groups.${group.id}`,
      ...group.items.flatMap((id) => [`faq.items.${id}.q`, `faq.items.${id}.a`]),
    ]);
    expect(missing(paths)).toEqual([]);
    const allIds = faqGroups.flatMap((group) => group.items as readonly string[]);
    expect(homeFaqIds.every((id) => allIds.includes(id))).toBe(true);
  });

  it("legal pages", () => {
    const paths = Object.entries(legalPages).flatMap(([page, { sections }]) => [
      `legal.${page}.title`,
      `legal.${page}.intro`,
      ...sections.flatMap((key) => [
        `legal.${page}.sections.${key}.title`,
        `legal.${page}.sections.${key}.body`,
      ]),
    ]);
    expect(missing(paths)).toEqual([]);
  });

  it("modules", () => {
    const paths = moduleKeys.flatMap((key) => [
      `modules.labels.${key}`,
      `modules.descriptions.${key}`,
    ]);
    expect(missing(paths)).toEqual([]);
  });

  it("keeps the brief's module labels", () => {
    expect(en.modules.labels).toEqual({
      whatsapp: "WhatsApp Marketing",
      crm: "CRM",
      sales: "Products & Catalog",
      leads: "Lead board",
      automations: "Automations",
      reporting: "Reporting",
      ai: "AI Assistant & Auto-reply",
      lead_scoring: "AI Lead scoring",
      employees: "Employee Management",
    });
  });
});
