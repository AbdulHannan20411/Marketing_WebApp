"use client";

import { MessageCircleQuestionIcon, SearchIcon, XIcon } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

import { FaqAccordion } from "./faq-accordion";
import { filterGroups, normalise, QUERY_TOKEN, type FaqGroupData } from "./faq-search";

type FaqExplorerProps = {
  groups: FaqGroupData[];
  labels: {
    search: string;
    placeholder: string;
    clear: string;
    /** Pre-formatted result counts, indexed by count (0..total). */
    resultsByCount: string[];
    /** "No questions match “__QUERY__”." */
    noResults: string;
    noResultsHint: string;
    askUs: string;
  };
};

/** Searchable, grouped FAQ. Matching answers open automatically while searching. */
export function FaqExplorer({ groups, labels }: FaqExplorerProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [manualOpen, setManualOpen] = useState<string[]>([]);
  const inputId = useId();

  const filtered = useMemo(() => filterGroups(groups, deferredQuery), [groups, deferredQuery]);
  const searching = normalise(deferredQuery) !== "";
  const matchCount = filtered.reduce((sum, group) => sum + group.items.length, 0);
  const open = searching
    ? filtered.flatMap((group) => group.items.map((item) => item.id))
    : manualOpen;

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
            {labels.search}
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.placeholder}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-input bg-background ps-9 pe-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={labels.clear}
                className="absolute end-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </form>
        <p className="sr-only" aria-live="polite" role="status">
          {searching ? labels.resultsByCount[matchCount] : ""}
        </p>
        <nav aria-label={labels.search} className="mt-6 hidden lg:block">
          <ul className="flex flex-col gap-1 text-sm">
            {filtered.map((group) => (
              <li key={group.id}>
                <a
                  href={`#group-${group.id}`}
                  className="block rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-col gap-10">
        {searching ? (
          <p className="text-sm text-muted-foreground" aria-hidden="true">
            {labels.resultsByCount[matchCount]}
          </p>
        ) : null}

        {filtered.map((group) => (
          <section
            key={group.id}
            id={`group-${group.id}`}
            aria-labelledby={`group-${group.id}-title`}
            className="scroll-mt-24"
          >
            <h2 id={`group-${group.id}-title`} className="mb-4 text-xl font-semibold">
              {group.title}
            </h2>
            <FaqAccordion
              items={group.items}
              value={open}
              onValueChange={(value) => {
                if (!searching) setManualOpen(value);
              }}
            />
          </section>
        ))}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
            <MessageCircleQuestionIcon
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">
              {labels.noResults.replace(QUERY_TOKEN, deferredQuery.trim())}
            </p>
            <p className="text-sm text-muted-foreground">{labels.noResultsHint}</p>
            <Button asChild className="mt-2">
              <Link href="/contact">{labels.askUs}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
