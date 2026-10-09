"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";

import { NativeSelect } from "@/components/ui/native-select";

import { assignQuery, setQueryStatus } from "../actions";
import { queryStatuses, type QueryStatus } from "../filters";

type TeamMember = { id: string; name: string };

/** Assignee and status pickers; each change is saved at once. */
export function QueryControls({
  queryId,
  status,
  assigneeId,
  team,
}: {
  queryId: string;
  status: QueryStatus;
  assigneeId: string | null;
  team: TeamMember[];
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<"saved" | "error" | null>(null);

  const save = (action: () => Promise<{ ok: boolean }>) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome.ok ? "saved" : "error");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-assignee`} className="text-sm font-medium">
          {t("detail.assignee")}
        </label>
        <NativeSelect
          id={`${id}-assignee`}
          key={`assignee-${assigneeId ?? "none"}`}
          defaultValue={assigneeId ?? ""}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value || null;
            save(() => assignQuery({ queryId, assigneeId: value }));
          }}
        >
          <option value="">{t("detail.unassigned")}</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-status`} className="text-sm font-medium">
          {t("detail.status")}
        </label>
        <NativeSelect
          id={`${id}-status`}
          key={`status-${status}`}
          defaultValue={status}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value as QueryStatus;
            save(() => setQueryStatus({ queryId, status: value }));
          }}
        >
          {queryStatuses.map((option) => (
            <option key={option} value={option}>
              {t(`status.${option}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {pending ? t("detail.saving") : result === "saved" ? t("detail.saved") : null}
      </p>
      {result === "error" && !pending ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t("detail.errors.generic")}
        </p>
      ) : null}
    </div>
  );
}
