import type { Plan } from "@/lib/pricing/schemas";

/**
 * schema.org Product with one Offer per plan (monthly price), built from the live
 * plans or, when the API is down, the typed fallback plans.
 */
export function productJsonLd({
  plans,
  name,
  description,
  pageUrl,
  offerUrl,
}: {
  plans: Plan[];
  name: string;
  description: string;
  pageUrl: string;
  offerUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: pageUrl,
    brand: { "@type": "Brand", name: "NextReach" },
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.monthlyPrice,
      priceCurrency: plan.currency,
      url: offerUrl,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.monthlyPrice,
        priceCurrency: plan.currency,
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    })),
  };
}

/** schema.org Organization for NextReach (Home). No invented contact details or profiles. */
export function organizationJsonLd({
  siteUrl,
  description,
}: {
  siteUrl: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": new URL("/#organization", siteUrl).toString(),
    name: "NextReach",
    url: siteUrl,
    logo: new URL("/icon.svg", siteUrl).toString(),
    description,
    areaServed: { "@type": "Country", name: "Pakistan" },
    // TODO: add `sameAs` with the real social profile URLs once they exist.
  };
}

/** schema.org WebSite in the page's language, linked to the Organization. */
export function websiteJsonLd({
  siteUrl,
  pageUrl,
  name,
  language,
}: {
  siteUrl: string;
  pageUrl: string;
  name: string;
  language: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: pageUrl,
    inLanguage: language,
    publisher: { "@id": new URL("/#organization", siteUrl).toString() },
  };
}

/** schema.org FAQPage from question/answer pairs shown on the page. */
export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Serialises JSON-LD safely for an inline <script> (no `</script>` break-out). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
