"use client";

import { BanIcon, RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { setCustomerSuspended } from "../actions";

/** Suspend (after confirming) or restore a customer account. */
export function SuspendButton({
  userId,
  email,
  suspended,
}: {
  userId: string;
  email: string;
  suspended: boolean;
}) {
  const t = useTranslations("admin.customers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (next: boolean) =>
    startTransition(async () => {
      const result = await setCustomerSuspended({ userId, suspended: next });
      setFailed(!result.ok);
      if (result.ok) setOpen(false);
      router.refresh();
    });

  const error = failed ? (
    <p role="alert" className="text-sm font-medium text-destructive">
      {t("error")}
    </p>
  ) : null;

  if (suspended) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(false)}
        >
          <RotateCcwIcon className="size-4" aria-hidden="true" />
          {t("unsuspend")}
        </Button>
        {error}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <BanIcon className="size-4" aria-hidden="true" />
          {t("suspend")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("suspendTitle")}</DialogTitle>
          <DialogDescription>{t("suspendText", { email })}</DialogDescription>
        </DialogHeader>
        {error}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => run(true)}>
            {t("confirmSuspend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
