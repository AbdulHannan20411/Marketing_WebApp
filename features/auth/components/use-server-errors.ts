"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ActionResult } from "../actions";

/** Copies server-side field error codes onto the form; returns the form-level error. */
export function applyServerErrors<T extends FieldValues>(
  result: ActionResult,
  setError: UseFormSetError<T>,
): string | null {
  if (result.ok) return null;
  for (const [field, code] of Object.entries(result.fieldErrors ?? {})) {
    setError(field as Path<T>, { type: "server", message: code }, { shouldFocus: true });
  }
  return result.error ?? null;
}
