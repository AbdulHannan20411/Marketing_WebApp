"use client";

import { CheckIcon, CircleCheckIcon, CopyIcon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

type QuerySuccessProps = {
  result: { reference: string | null; email: string; signedIn: boolean };
  onAnother: () => void;
};

/** Confirmation with the reference; offers an account to signed-out senders. */
export function QuerySuccess({ result, onAnother }: QuerySuccessProps) {
  const t = useTranslations("queryForm.success");
  const ta = useTranslations("queryForm.actions");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const copy = async () => {
    if (!result.reference) return;
    try {
      await navigator.clipboard.writeText(result.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the reference is still visible to copy by hand.
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-5 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-accent-foreground">
        <CircleCheckIcon className="size-7" aria-hidden="true" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold tracking-[-0.03em] outline-none"
      >
        {t("title")}
      </h2>

      <div role="status" className="flex flex-col items-center gap-5">
        {result.reference ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">{t("reference")}</p>
            <div className="flex items-center gap-2">
              <code
                dir="ltr"
                className="rounded-lg bg-muted px-4 py-2 font-mono text-xl font-semibold tracking-wide"
              >
                {result.reference}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10"
                onClick={copy}
                aria-label={copied ? t("copied") : t("copy")}
              >
                {copied ? (
                  <CheckIcon className="size-4 text-brand" aria-hidden="true" />
                ) : (
                  <CopyIcon className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
        <p className="max-w-md text-muted-foreground">
          {result.signedIn ? t("signedInBody") : t("body", { email: result.email || "" })}
        </p>
      </div>

      {result.signedIn ? (
        <Button asChild size="lg">
          <Link href="/account">{t("viewInAccount")}</Link>
        </Button>
      ) : result.email ? (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-brand/50 bg-accent/40 p-5">
          <p className="font-semibold">{t("trackTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("trackBody", { email: result.email })}</p>
          <Button asChild>
            <Link href={{ pathname: "/sign-up", query: { email: result.email } }}>
              {t("createAccount")}
            </Link>
          </Button>
        </div>
      ) : null}

      <Button type="button" variant="ghost" onClick={onAnother}>
        {ta("another")}
      </Button>
    </m.div>
  );
}
