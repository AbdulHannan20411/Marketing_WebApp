import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";

/**
 * Supplies the query form's copy to the browser only where the form (or its dialog)
 * is used, so other pages don't carry it.
 */
export async function QueryMessagesProvider({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [...BASE_CLIENT_NAMESPACES, "queryForm", "validation"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}
