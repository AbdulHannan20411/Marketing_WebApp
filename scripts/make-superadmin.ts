/**
 * Promotes an existing account to Super Admin.
 *
 *   npm run make-superadmin -- you@example.com
 *
 * The person must have signed up on the site first (and ideally confirmed their
 * email). Uses the service-role key from .env.local; the role can never be set from
 * the browser. Equivalent SQL: select public.promote_to_superadmin('you@example.com');
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as-is.
}

const email = z.email().safeParse(process.argv[2]?.trim());
if (!email.success) {
  console.error("Usage: npm run make-superadmin -- <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

async function main(url: string, serviceRoleKey: string, address: string) {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("promote_to_superadmin", { p_email: address });

  if (error) {
    console.error(`Could not promote ${address}: ${error.message}`);
    process.exit(1);
  }

  console.log(`${address} is now a Super Admin (user id ${String(data)}).`);
  console.log("They may need to sign out and back in to see the admin area.");
}

void main(url, serviceRoleKey, email.data);
