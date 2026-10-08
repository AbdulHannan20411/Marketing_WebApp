import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Runs the Supabase CLI from the `supabase` npm package via Node, without a shell, so
 * arguments such as database URLs (which contain % and @) are passed through verbatim.
 * Returns the [command, args] pair for spawnSync.
 */
export function supabaseCommand(args) {
  const launcher = join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
  if (!existsSync(launcher)) throw new Error("Supabase CLI not found. Run `npm install` first.");
  return [process.execPath, [launcher, ...args]];
}
