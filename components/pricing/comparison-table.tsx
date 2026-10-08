import { CheckIcon, MinusIcon } from "lucide-react";

import type { ComparisonTable as ComparisonData } from "@/lib/pricing/view-model";
import { cn } from "@/lib/utils";

type ComparisonTableProps = {
  data: ComparisonData;
  labels: {
    caption: string;
    feature: string;
    included: string;
    notIncluded: string;
    scrollHint: string;
    groups: Record<ComparisonData["groups"][number]["key"], string>;
  };
};

/**
 * Accessible comparison table: a real <table> with a caption, column and row headers,
 * and text alternatives for ticks and dashes. The first column stays visible while
 * the plans scroll sideways on small screens.
 */
export function ComparisonTable({ data, labels }: ComparisonTableProps) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground md:hidden">{labels.scrollHint}</p>
      <div
        tabIndex={0}
        role="region"
        aria-label={labels.caption}
        className="relative overflow-x-auto rounded-2xl border bg-card focus-visible:outline-offset-4"
      >
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">{labels.caption}</caption>
          <thead>
            <tr className="border-b">
              <th
                scope="col"
                className="sticky start-0 z-10 bg-card px-4 py-4 text-start font-semibold"
              >
                {labels.feature}
              </th>
              {data.columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  lang="en"
                  className="px-4 py-4 text-center font-semibold"
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          {data.groups.map((group) => (
            <tbody key={group.key}>
              <tr className="bg-surface-subtle">
                <th
                  scope="colgroup"
                  colSpan={data.columns.length + 1}
                  className="sticky start-0 px-4 py-2.5 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {labels.groups[group.key]}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.key} className="border-t transition-colors hover:bg-muted/50">
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-card px-4 py-3 text-start font-medium"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td key={data.columns[index]?.id ?? index} className="px-4 py-3 text-center">
                      {cell.kind === "check" ? (
                        cell.included ? (
                          <>
                            <CheckIcon className="mx-auto size-5 text-brand" aria-hidden="true" />
                            <span className="sr-only">{labels.included}</span>
                          </>
                        ) : (
                          <>
                            <MinusIcon
                              className="mx-auto size-5 text-muted-foreground/60"
                              aria-hidden="true"
                            />
                            <span className="sr-only">{labels.notIncluded}</span>
                          </>
                        )
                      ) : (
                        <span
                          className={cn(
                            cell.value === labels.notIncluded && "text-muted-foreground",
                          )}
                        >
                          {cell.value}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
