import { notFound } from "next/navigation";

/**
 * Catches every unknown path under /en or /ur so it renders the localised 404
 * (with header and footer) instead of the framework default.
 */
export default function CatchAll() {
  notFound();
}
