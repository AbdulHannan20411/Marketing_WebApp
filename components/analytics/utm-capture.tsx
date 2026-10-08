"use client";

import { useEffect } from "react";

import { captureUtm } from "./utm";

/** Stores campaign (utm_*) parameters from the landing URL for the query form. */
export function UtmCapture() {
  useEffect(() => {
    captureUtm();
  }, []);
  return null;
}
