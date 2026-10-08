import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

// TODO: legal review — template content; see content/legal.ts.
export function generateMetadata() {
  return legalMetadata("privacy");
}

export default function Page() {
  return <LegalPage page="privacy" />;
}
