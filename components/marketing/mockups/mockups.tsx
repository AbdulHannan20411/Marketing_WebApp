import {
  ArrowDownIcon,
  BellRingIcon,
  CheckCheckIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadIcon,
  WorkflowIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import type { MockupId } from "@/content/features";
import { cn } from "@/lib/utils";

import { ChatBubble, MockAvatar, MockPill, MockWindow } from "./frames";

/*
 * Static product mock-ups for the Features pages. Decorative (aria-hidden): the
 * surrounding section text carries the meaning. Bars and items animate in via the
 * .mock-grow / .mock-pop classes when their <Reveal> enters the viewport.
 */

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export async function CampaignMockup() {
  const t = await getTranslations("mockups.campaign");
  const rows = [
    { label: t("sent"), width: "100%", tone: "bg-slate-400 dark:bg-slate-500" },
    { label: t("delivered"), width: "94%", tone: "bg-sky-500" },
    { label: t("read"), width: "78%", tone: "bg-brand" },
    { label: t("failed"), width: "4%", tone: "bg-red-500" },
  ];
  return (
    <MockWindow
      title={t("title")}
      action={
        <MockPill tone="brand">
          <SendIcon className="size-3" aria-hidden="true" />
          {t("status")}
        </MockPill>
      }
    >
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <ClockIcon className="size-3.5" aria-hidden="true" />
          {t("schedule")}
        </p>
        <p className="flex items-center gap-1.5">
          <MessageSquareTextIcon className="size-3.5" aria-hidden="true" />
          {t("template")}
        </p>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row, i) => (
          <li key={row.label} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-xs">
            <span className="font-medium">{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("mock-grow block h-full rounded-full", row.tone)}
                style={{ width: row.width, ...stagger(i) }}
              />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-success">
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        {t("quality")}
      </div>
    </MockWindow>
  );
}

export async function InboxMockup() {
  const t = await getTranslations("mockups.inbox");
  const chats = [
    { name: t("c1Name"), text: t("c1Text"), active: true },
    { name: t("c2Name"), text: t("c2Text"), active: false },
    { name: t("c3Name"), text: t("c3Text"), active: false },
  ];
  return (
    <MockWindow title={t("title")}>
      <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
        <div>
          <div className="mb-2 flex gap-1">
            <MockPill tone="brand">{t("mine")}</MockPill>
            <MockPill>{t("all")}</MockPill>
          </div>
          <ul className="flex flex-col gap-1">
            {chats.map((chat, i) => (
              <li
                key={chat.name}
                style={stagger(i)}
                className={cn(
                  "mock-pop flex items-center gap-2 rounded-lg p-2",
                  chat.active && "bg-accent",
                )}
              >
                <MockAvatar name={chat.name} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{chat.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {chat.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 rounded-lg bg-wa-wallpaper p-3">
          <div className="flex flex-wrap gap-1">
            <MockPill tone="warning">
              <ClockIcon className="size-3" aria-hidden="true" />
              {t("window")}
            </MockPill>
            <MockPill tone="info">{t("assignedTo")}</MockPill>
          </div>
          <ChatBubble side="in" className="mock-pop" style={stagger(2)}>
            {t("c1Text")}
          </ChatBubble>
          <ChatBubble side="out" className="mock-pop" style={stagger(3)}>
            {t("reply")}
            <CheckCheckIcon className="ms-1 inline size-3.5 text-sky-600" aria-hidden="true" />
          </ChatBubble>
        </div>
      </div>
    </MockWindow>
  );
}

export async function CrmMockup() {
  const t = await getTranslations("mockups.crm");
  const rows = [
    { name: t("r1"), tag: t("tagVip"), tone: "brand" as const },
    { name: t("r2"), tag: t("tagWholesale"), tone: "info" as const },
    { name: t("r3"), tag: t("tagNew"), tone: "warning" as const },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
      <MockWindow title={t("title")}>
        <div className="flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] text-muted-foreground">
            <SearchIcon className="size-3.5" aria-hidden="true" />
            {t("search")}
          </span>
          <MockPill>
            <UploadIcon className="size-3" aria-hidden="true" />
            {t("import")}
          </MockPill>
        </div>
        <ul className="mt-3 divide-y">
          {rows.map((row, i) => (
            <li key={row.name} style={stagger(i)} className="mock-pop flex items-center gap-2 py-2">
              <MockAvatar name={row.name} />
              <span className="flex-1 truncate text-xs font-medium">{row.name}</span>
              <MockPill tone={row.tone}>{row.tag}</MockPill>
            </li>
          ))}
        </ul>
      </MockWindow>
      <MockWindow title={t("discovery")}>
        <div className="relative h-36 overflow-hidden rounded-lg bg-[linear-gradient(90deg,var(--color-border)_1px,transparent_1px),linear-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:20px_20px]">
          <span className="absolute inset-0 m-auto size-28 rounded-full border-2 border-dashed border-brand bg-brand/10" />
          {["top-6 start-10", "top-14 end-12", "bottom-8 start-16", "bottom-10 end-8"].map(
            (position, i) => (
              <MapPinIcon
                key={position}
                aria-hidden="true"
                style={stagger(i)}
                className={cn("mock-pop absolute size-5 fill-brand-soft text-brand", position)}
              />
            ),
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground">
            {t("found")} · {t("radius")}
          </span>
          <MockPill tone="brand">{t("add")}</MockPill>
        </div>
      </MockWindow>
    </div>
  );
}

export async function CatalogMockup() {
  const t = await getTranslations("mockups.catalog");
  const products = [
    {
      name: t("p1"),
      price: t("price1"),
      hue: "from-sky-200 to-sky-400 dark:from-sky-800 dark:to-sky-600",
    },
    {
      name: t("p2"),
      price: t("price2"),
      hue: "from-rose-200 to-rose-400 dark:from-rose-800 dark:to-rose-600",
    },
    {
      name: t("p3"),
      price: t("price3"),
      hue: "from-amber-200 to-amber-400 dark:from-amber-800 dark:to-amber-600",
    },
  ];
  return (
    <MockWindow title={t("title")}>
      <ul className="grid grid-cols-3 gap-3">
        {products.map((product, i) => (
          <li key={product.name} style={stagger(i)} className="mock-pop">
            <span className={cn("block aspect-[4/5] rounded-lg bg-gradient-to-br", product.hue)} />
            <span className="mt-2 block truncate text-[11px] font-medium">{product.name}</span>
            <span className="block text-[11px] text-muted-foreground">{product.price}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-medium text-accent-foreground">
        <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
        {t("opened")}
      </p>
    </MockWindow>
  );
}

export async function LeadBoardMockup() {
  const t = await getTranslations("mockups.leadBoard");
  const columns = [
    { title: t("cold"), dot: "bg-sky-500", leads: [t("l1")] },
    { title: t("warm"), dot: "bg-amber-500", leads: [t("l2"), t("l5")] },
    { title: t("interested"), dot: "bg-brand", leads: [t("l3")] },
    { title: t("won"), dot: "bg-violet-500", leads: [t("l4")] },
  ];
  return (
    <MockWindow>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {columns.map((column, c) => (
          <div key={column.title} className="rounded-lg bg-surface-subtle p-2">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold">
              <span className={cn("size-2 rounded-full", column.dot)} aria-hidden="true" />
              {column.title}
            </p>
            <ul className="flex flex-col gap-1.5">
              {column.leads.map((lead, i) => (
                <li
                  key={lead}
                  style={stagger(c + i)}
                  className="mock-pop flex items-center gap-2 rounded-md border bg-card p-1.5 text-[11px] font-medium shadow-sm"
                >
                  <MockAvatar name={lead} className="size-6 text-[10px]" />
                  {lead}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

export async function AiAssistantMockup() {
  const t = await getTranslations("mockups.ai");
  return (
    <div className="flex flex-col gap-4">
      <MockWindow>
        <p className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
          <SparklesIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          {t("prompt")}
        </p>
        <div
          className="mock-pop mt-3 rounded-lg bg-accent p-3 text-xs leading-relaxed text-accent-foreground"
          style={stagger(1)}
        >
          {t("suggestion")}
          <div className="mt-2 flex justify-end">
            <MockPill tone="brand">{t("use")}</MockPill>
          </div>
        </div>
      </MockWindow>
      <div className="mock-pop rounded-xl bg-wa-wallpaper p-3" style={stagger(2)}>
        <ChatBubble side="out">
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-accent-foreground">
            <SparklesIcon className="size-3" aria-hidden="true" />
            {t("autoReply")}
          </span>
          {t("autoReplyText")}
        </ChatBubble>
        <p className="mt-2 text-center text-[10px] text-slate-600 dark:text-slate-300">
          {t("grounded")}
        </p>
      </div>
    </div>
  );
}

export async function LeadScoringMockup() {
  const t = await getTranslations("mockups.scoring");
  return (
    <MockWindow>
      <div className="flex flex-col items-center gap-3 text-center">
        <MockPill>
          <SparklesIcon className="size-3 text-brand" aria-hidden="true" />
          {t("reading")}
        </MockPill>
        <p className="mock-pop rounded-lg border px-3 py-2 text-xs" style={stagger(0)}>
          {t("signal")}
        </p>
        <ArrowDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        <p
          className="mock-pop rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white"
          style={stagger(2)}
        >
          {t("result")}
        </p>
        <p className="text-[11px] text-muted-foreground">{t("moved")}</p>
      </div>
    </MockWindow>
  );
}

export async function AutomationMockup() {
  const [t, n] = await Promise.all([
    getTranslations("mockups.automation"),
    getTranslations("home.automation.nodes"),
  ]);
  const steps = [n("trigger"), n("wait"), n("send"), n("check")];
  return (
    <MockWindow title={t("title")} action={<MockPill tone="brand">{t("active")}</MockPill>}>
      <ol className="flex flex-col items-center gap-0">
        {steps.map((step, i) => (
          <li key={step} className="flex w-full flex-col items-center">
            <span
              style={stagger(i)}
              className="mock-pop flex w-full max-w-xs items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-sm"
            >
              <WorkflowIcon className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
              {step}
            </span>
            {i < steps.length - 1 ? (
              <span className="h-4 w-px bg-border" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <span
          className="mock-pop rounded-md bg-accent px-2 py-1.5 text-accent-foreground"
          style={stagger(4)}
        >
          {n("yes")}
        </span>
        <span
          className="mock-pop flex items-start gap-1 rounded-md bg-amber-100 px-2 py-1.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          style={stagger(5)}
        >
          <BellRingIcon className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          {n("no")}
        </span>
      </div>
    </MockWindow>
  );
}

export async function ReportingMockup() {
  const t = await getTranslations("mockups.reporting");
  // Illustrative bar heights for a mock chart; not real data.
  const bars = [
    [70, 52, 18],
    [82, 61, 24],
    [64, 45, 15],
    [90, 72, 30],
    [76, 58, 22],
    [96, 80, 34],
    [85, 66, 27],
  ];
  return (
    <MockWindow
      title={t("title")}
      action={
        <MockPill>
          <DownloadIcon className="size-3" aria-hidden="true" />
          {t("export")}
        </MockPill>
      }
    >
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{t("week")}</span>
        <span className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-sky-500" aria-hidden="true" />
            {t("delivered")}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-brand" aria-hidden="true" />
            {t("read")}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-violet-500" aria-hidden="true" />
            {t("replied")}
          </span>
        </span>
      </div>
      <div className="mt-3 flex h-32 items-end justify-between gap-2">
        {bars.map(([delivered, read, replied], i) => (
          <div key={i} className="flex h-full flex-1 items-end gap-0.5">
            {[
              { value: delivered, tone: "bg-sky-500" },
              { value: read, tone: "bg-brand" },
              { value: replied, tone: "bg-violet-500" },
            ].map((bar) => (
              <span
                key={bar.tone}
                style={{ height: `${bar.value}%`, ...stagger(i) }}
                className={cn("mock-pop flex-1 origin-bottom rounded-t-sm", bar.tone)}
              />
            ))}
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

export async function EmployeesMockup() {
  const t = await getTranslations("mockups.employees");
  const permissions = [
    { label: t("campaigns"), view: true, edit: true },
    { label: t("inbox"), view: true, edit: true },
    { label: t("contacts"), view: true, edit: false },
    { label: t("reports"), view: false, edit: false },
  ];
  return (
    <MockWindow>
      <div className="flex items-center gap-3 border-b pb-3">
        <MockAvatar name={t("title")} className="size-10 text-sm" />
        <div>
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="text-[11px] text-muted-foreground">{t("role")}</p>
        </div>
      </div>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="text-[11px] text-muted-foreground">
            <th className="py-1.5 text-start font-medium" />
            <th className="py-1.5 font-medium">{t("view")}</th>
            <th className="py-1.5 font-medium">{t("edit")}</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((row, i) => (
            <tr key={row.label} className="mock-pop border-t" style={stagger(i)}>
              <td className="py-2 font-medium">{row.label}</td>
              <td className="py-2 text-center">
                <Toggle on={row.view} />
              </td>
              <td className="py-2 text-center">
                <Toggle on={row.edit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </MockWindow>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
        on ? "justify-end bg-brand" : "justify-start bg-slate-300 dark:bg-slate-600",
      )}
    >
      <span className="size-3 rounded-full bg-white shadow" />
    </span>
  );
}

const mockups: Record<MockupId, () => Promise<React.JSX.Element>> = {
  campaign: CampaignMockup,
  inbox: InboxMockup,
  crm: CrmMockup,
  catalog: CatalogMockup,
  leadBoard: LeadBoardMockup,
  aiAssistant: AiAssistantMockup,
  leadScoring: LeadScoringMockup,
  automation: AutomationMockup,
  reporting: ReportingMockup,
  employees: EmployeesMockup,
};

/** Renders the mock-up for an id. Decorative: hidden from assistive technology. */
export async function Mockup({ id, className }: { id: MockupId; className?: string }) {
  const Component = mockups[id];
  return (
    <div aria-hidden="true" className={cn("select-none", className)}>
      <Component />
    </div>
  );
}
