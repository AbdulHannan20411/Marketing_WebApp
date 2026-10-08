import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

// TODO: legal review — template content; see content/legal.ts.
export function generateMetadata() {
  return legalMetadata("refund");
}

export default function Page() {
  return <LegalPage page="refund" />;
}
