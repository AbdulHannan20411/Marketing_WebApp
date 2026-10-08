import type { ComponentProps } from "react";

import { publicEnv } from "@/lib/env/public";

import { QueryDialogTrigger } from "./query-dialog";
import { QueryMessagesProvider } from "./query-messages-provider";

/** Server wrapper: provides the form's messages and the Turnstile site key. */
export function QueryDialogButton(
  props: Omit<ComponentProps<typeof QueryDialogTrigger>, "turnstileSiteKey">,
) {
  return (
    <QueryMessagesProvider>
      <QueryDialogTrigger {...props} turnstileSiteKey={publicEnv.TURNSTILE_SITE_KEY ?? null} />
    </QueryMessagesProvider>
  );
}
