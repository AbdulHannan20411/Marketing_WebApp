"use client";

import { MenuIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { MobileNavProps } from "./mobile-nav-sheet";

// The sheet (Radix dialog) loads on first use; touching or focusing the button
// starts the download early.
const loadSheet = () => import("./mobile-nav-sheet").then((mod) => mod.MobileNavSheet);
const MobileNavSheet = dynamic(loadSheet, { ssr: false });

/** Menu button for small screens; opens the navigation sheet. */
export function MobileNav(props: MobileNavProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 lg:hidden"
        aria-label={t("openMenu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={() => void loadSheet()}
        onFocus={() => void loadSheet()}
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
      >
        <MenuIcon className="size-6" aria-hidden="true" />
      </Button>
      {used ? <MobileNavSheet {...props} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
