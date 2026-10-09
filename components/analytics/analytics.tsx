"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CONSENT_REOPEN_EVENT,
  CONSENT_STORAGE_KEY,
  readConsent,
  UMAMI_SCRIPT_URL,
  type ConsentChoice,
} from "@/lib/analytics";
import { Link } from "@/lib/i18n/navigation";

type Labels = {
  region: string;
  text: string;
  privacy: string;
  accept: string;
  decline: string;
};

/**
 * Loads Umami only after the visitor accepts. The notice appears on the first visit
 * and again whenever the footer's "Cookie settings" button is used. Rendered by the
 * root layout only when NEXT_PUBLIC_ANALYTICS_ID is set.
 */
export function Analytics({ websiteId, labels }: { websiteId: string; labels: Labels }) {
  // null until mounted (storage is browser-only), then the stored choice or "ask".
  const [choice, setChoice] = useState<ConsentChoice | "ask" | null>(null);

  useEffect(() => {
    const storage = typeof window === "undefined" ? undefined : window.localStorage;
    // Reading storage must wait for the browser; this runs once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(readConsent(storage) ?? "ask");
    const reopen = () => setChoice("ask");
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  const decide = (value: ConsentChoice) => {
    const previous = readConsent(window.localStorage);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch {
      // Storage blocked: the choice lasts for this page view only.
    }
    // A loaded script can't be unloaded, so withdrawing consent reloads the page.
    if (value === "denied" && previous === "granted") {
      window.location.reload();
      return;
    }
    setChoice(value);
  };

  return (
    <>
      {choice === "granted" ? (
        <Script
          src={UMAMI_SCRIPT_URL}
          data-website-id={websiteId}
          data-do-not-track="true"
          strategy="afterInteractive"
        />
      ) : null}
      {choice === "ask" ? (
        <section
          aria-label={labels.region}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4"
        >
          <p className="flex-1 text-sm text-muted-foreground">
            {labels.text}{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {labels.privacy}
            </Link>
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => decide("denied")}>
              {labels.decline}
            </Button>
            <Button type="button" size="sm" onClick={() => decide("granted")}>
              {labels.accept}
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Footer button that reopens the notice so visitors can change their choice. */
export function ConsentSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT))}
      className="inline-flex min-h-9 items-center rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {label}
    </button>
  );
}
