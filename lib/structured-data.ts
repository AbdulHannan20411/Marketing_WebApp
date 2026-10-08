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

/** Serialises JSON-LD safely for an inline <script> (no `</script>` break-out). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
