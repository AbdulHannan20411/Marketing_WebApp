import { serializeJsonLd } from "@/lib/structured-data";

/** Inline JSON-LD. `application/ld+json` is data, not executed script. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
