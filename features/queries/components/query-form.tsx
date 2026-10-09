"use client";

import { CheckIcon, FileIcon, PaperclipIcon, XIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { get, useForm, useWatch, type FieldPath } from "react-hook-form";

import { readUtm } from "@/components/analytics/utm";
import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

import { getQueryFormContext, submitQuery, type SubmitQueryError } from "../actions";
import {
  attachmentRules,
  isTopic,
  messageLimits,
  questions,
  topicIcons,
  topicKeys,
  topicQuestions,
  type QuerySource,
  type QuestionKey,
  type Topic,
} from "../definitions";
import { OptionGroup } from "./option-group";
import { QuerySuccess } from "./query-success";
import { Turnstile } from "./turnstile";

// The validation schemas (and Zod) load when the visitor first interacts with the
// form, not with the page; every check awaits them, so nothing can skip validation.
const loadSchemas = (() => {
  let schemas: ReturnType<typeof importSchemas> | null = null;
  return () => (schemas ??= importSchemas());
})();
function importSchemas() {
  return import("../schemas");
}

type StepId = "topic" | "details" | "message" | "review";
type AnswerValue = string | string[];

export type QueryFormValues = {
  topic: Topic | "";
  answers: Record<Topic, Record<string, AnswerValue>>;
  subject: string;
  message: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  website: string;
};

function emptyAnswers(): QueryFormValues["answers"] {
  return Object.fromEntries(
    topicKeys.map((topic) => [
      topic,
      Object.fromEntries(
        (topicQuestions[topic] as readonly QuestionKey[]).map((key) => [
          key,
          questions[key].kind === "multi" ? [] : "",
        ]),
      ),
    ]),
  ) as QueryFormValues["answers"];
}

const contactFields = ["subject", "message", "name", "email", "phone", "consent"] as const;
type LockedField = "name" | "email" | "phone";

type QueryFormProps = {
  locale: Locale;
  source: QuerySource;
  turnstileSiteKey?: string | null;
  initialTopic?: Topic;
  /** Read ?topic= from the URL on mount (contact page). */
  topicFromUrl?: boolean;
};

export function QueryForm({
  locale,
  source,
  turnstileSiteKey,
  initialTopic,
  topicFromUrl,
}: QueryFormProps) {
  const t = useTranslations("queryForm");
  const tv = useTranslations("validation");
  const tk = t as unknown as (key: string, values?: Record<string, string | number>) => string;

  const form = useForm<QueryFormValues>({
    defaultValues: {
      topic: initialTopic ?? "",
      answers: emptyAnswers(),
      subject: "",
      message: "",
      name: "",
      email: "",
      phone: "",
      consent: false,
      website: "",
    },
    shouldUnregister: false,
  });
  const { register, formState, getValues, setError, clearErrors, setValue, reset, control } = form;
  const topic = useWatch({ control, name: "topic" });
  const messageLength = useWatch({ control, name: "message" }).length;

  const steps: StepId[] = useMemo(
    () =>
      topic === "other"
        ? ["topic", "message", "review"]
        : ["topic", "details", "message", "review"],
    [topic],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? "topic";

  const [token, setToken] = useState<string | null>(null);
  const [locked, setLocked] = useState<Set<LockedField>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<"attachmentType" | "attachmentSize" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<
    Exclude<SubmitQueryError, "invalid"> | "summary" | null
  >(null);
  const [result, setResult] = useState<{
    reference: string | null;
    email: string;
    signedIn: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadContext = useCallback(() => {
    getQueryFormContext()
      .then((context) => {
        setToken(context.token);
        if (context.account) {
          const nextLocked = new Set<LockedField>();
          (["name", "email", "phone"] as const).forEach((field) => {
            const value = context.account?.[field]?.trim();
            if (value) {
              setValue(field, value);
              nextLocked.add(field);
            }
          });
          setLocked(nextLocked);
        }
      })
      .catch(() => setToken(null));
  }, [setValue]);

  useEffect(() => {
    loadContext();
    if (topicFromUrl) {
      const fromUrl = new URLSearchParams(window.location.search).get("topic");
      if (isTopic(fromUrl) && !getValues("topic")) setValue("topic", fromUrl);
    }
  }, [loadContext, topicFromUrl, getValues, setValue]);

  // After the user changes step, focus the new heading once it has animated in
  // (with mode="wait" the new step mounts only after the old one has left).
  const focusOnEnter = useRef(false);

  const message = (code: string | undefined) => {
    if (!code) return undefined;
    const own = [
      "chooseTopic",
      "chooseOption",
      "chooseAtLeastOne",
      "subjectLength",
      "messageShort",
      "messageLong",
    ];
    return own.includes(code) ? tk(`errors.${code}`) : tv(code as Parameters<typeof tv>[0]);
  };

  /** Validates one step with its Zod schema and shows field errors. */
  const validateStep = async (id: StepId): Promise<boolean> => {
    const { answersSchema, contactStepSchema, topicStepSchema } = await loadSchemas();
    const values = getValues();
    if (id === "topic") {
      clearErrors("topic");
      const parsed = topicStepSchema.safeParse({ topic: values.topic });
      if (!parsed.success) setError("topic", { message: "chooseTopic" }, { shouldFocus: true });
      return parsed.success;
    }
    if (id === "details" && isTopic(values.topic)) {
      const current = values.topic;
      clearErrors("answers");
      const parsed = answersSchema(current).safeParse(values.answers[current]);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue, index) => {
          const key = String(issue.path[0]);
          setError(
            `answers.${current}.${key}` as FieldPath<QueryFormValues>,
            { message: issue.message },
            { shouldFocus: index === 0 },
          );
        });
      }
      return parsed.success;
    }
    if (id === "message") {
      contactFields.forEach((field) => clearErrors(field));
      const parsed = contactStepSchema.safeParse({
        subject: values.subject,
        message: values.message,
        name: values.name,
        email: values.email,
        phone: values.phone,
        consent: values.consent,
      });
      if (!parsed.success) {
        const seen = new Set<string>();
        parsed.error.issues.forEach((issue) => {
          const key = String(issue.path[0]);
          if (seen.has(key)) return;
          seen.add(key);
          setError(
            key as FieldPath<QueryFormValues>,
            { message: issue.message },
            { shouldFocus: seen.size === 1 },
          );
        });
      }
      return parsed.success && !fileError;
    }
    return true;
  };

  const goTo = (target: StepId) => {
    const index = steps.indexOf(target);
    if (index < 0) return;
    focusOnEnter.current = true;
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
    setFormError(null);
  };

  const next = async () => {
    if (!(await validateStep(step))) return;
    focusOnEnter.current = true;
    setFormError(null);
    setDirection(1);
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const back = () => {
    focusOnEnter.current = true;
    setFormError(null);
    setDirection(-1);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const pickFile = (picked: File | null) => {
    setFileError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (!(attachmentRules.types as readonly string[]).includes(picked.type)) {
      setFileError("attachmentType");
      setFile(null);
      return;
    }
    if (picked.size > attachmentRules.maxBytes) {
      setFileError("attachmentSize");
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const submit = async () => {
    const values = getValues();
    if (!isTopic(values.topic)) return goTo("topic");
    // Re-check every step before sending; jump to the first one with a problem.
    for (const id of steps) {
      if (id !== "review" && !(await validateStep(id))) {
        goTo(id);
        setFormError("summary");
        return;
      }
    }
    const current = values.topic;
    const payload = {
      topic: current,
      answers: current === "other" ? {} : values.answers[current],
      subject: values.subject,
      message: values.message,
      name: values.name,
      email: values.email,
      phone: values.phone,
      consent: values.consent,
      website: values.website,
      source,
      locale,
      utm: readUtm(),
      token: token ?? "",
      turnstileToken: turnstileToken ?? undefined,
    };
    const data = new FormData();
    data.set("payload", JSON.stringify(payload));
    if (file) data.set("attachment", file);

    setFormError(null);
    startTransition(async () => {
      const response = await submitQuery(data);
      if (response.ok) {
        setResult({
          reference: response.reference,
          email: response.email,
          signedIn: response.signedIn,
        });
        return;
      }
      if (response.fieldErrors) {
        let firstStep: StepId | null = null;
        for (const [path, code] of Object.entries(response.fieldErrors)) {
          const [head, key] = path.split(".");
          if (head === "answers" && key) {
            setError(`answers.${current}.${key}` as FieldPath<QueryFormValues>, { message: code });
            firstStep ??= "details";
          } else if (head === "topic") {
            setError("topic", { message: "chooseTopic" });
            firstStep = "topic";
          } else if (head && (contactFields as readonly string[]).includes(head)) {
            setError(head as FieldPath<QueryFormValues>, { message: code });
            firstStep ??= "message";
          }
        }
        if (firstStep) goTo(firstStep);
        setFormError("summary");
        return;
      }
      setFormError(response.error === "invalid" ? "generic" : response.error);
      if (response.error === "expired" || response.error === "invalid") loadContext();
      if (response.error === "attachmentType" || response.error === "attachmentSize") {
        setFileError(response.error);
        goTo("message");
      }
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step === "review") void submit();
    else void next();
  };

  const startOver = () => {
    reset();
    setFile(null);
    setFileError(null);
    setTurnstileToken(null);
    setResult(null);
    setStepIndex(0);
    setDirection(-1);
    loadContext();
  };

  if (result) {
    return <QuerySuccess result={result} onAnother={startOver} />;
  }

  const errorOf = (path: string): string | undefined =>
    (get(formState.errors, path) as { message?: string } | undefined)?.message;

  const total = steps.length;
  const stepNumber = stepIndex + 1;
  const offset = locale === "ur" ? -1 : 1;

  return (
    <form
      onSubmit={onSubmit}
      // Start loading the validation code as soon as the visitor engages.
      onPointerDownCapture={() => void loadSchemas()}
      onFocusCapture={() => void loadSchemas()}
      noValidate
      className="flex flex-col gap-6"
      aria-busy={pending}
    >
      {/* Progress */}
      <nav aria-label={t("progressLabel")} className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {t("stepOf", { current: stepNumber, total })}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="mock-grow h-full rounded-full bg-brand transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${stepNumber / total})` }}
          />
        </div>
        <ol className="hidden gap-2 text-sm sm:flex">
          {steps.map((id, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;
            return (
              <li
                key={id}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5",
                  current ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[11px]",
                    done && "border-brand bg-brand text-white",
                    current && "border-brand text-primary",
                  )}
                  aria-hidden="true"
                >
                  {done ? <CheckIcon className="size-3" /> : index + 1}
                </span>
                {t(`steps.${id}`)}
                {index < steps.length - 1 ? (
                  <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {formError ? <FormAlert tone="error">{t(`errors.${formError}`)}</FormAlert> : null}

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div
        aria-hidden="true"
        className="absolute -start-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label>
          {t("fields.website")}
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <m.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: 24 * direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * direction * offset }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={(definition) => {
              const entered =
                typeof definition === "object" &&
                definition !== null &&
                "x" in definition &&
                definition.x === 0;
              if (entered && focusOnEnter.current) {
                focusOnEnter.current = false;
                headingRef.current?.focus();
              }
            }}
            className="flex flex-col gap-5"
          >
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
              {t(`headings.${step}`)}
            </h2>

            {step === "topic" ? (
              <OptionGroup
                legend={t("headings.topic")}
                legendHidden
                kind="single"
                size="lg"
                columns={2}
                error={message(errorOf("topic"))}
                registration={register("topic")}
                options={topicKeys.map((key) => {
                  const Icon = topicIcons[key];
                  return {
                    value: key,
                    label: t(`topics.${key}.title`),
                    description: t(`topics.${key}.description`),
                    icon: <Icon className="size-5" aria-hidden="true" />,
                  };
                })}
              />
            ) : null}

            {step === "details" && isTopic(topic) ? (
              <div className="flex flex-col gap-7">
                <p className="text-sm text-muted-foreground">{t("hints.details")}</p>
                {(topicQuestions[topic] as readonly QuestionKey[]).map((key) => {
                  const def = questions[key];
                  return (
                    <OptionGroup
                      key={`${topic}-${key}`}
                      legend={tk(`questions.${key}.label`)}
                      hint={def.kind === "multi" ? t("hints.modules") : undefined}
                      kind={def.kind}
                      columns={def.options.length > 4 ? 3 : 2}
                      error={message(errorOf(`answers.${topic}.${key}`))}
                      registration={register(
                        `answers.${topic}.${key}` as FieldPath<QueryFormValues>,
                      )}
                      options={(def.options as readonly string[]).map((option) => ({
                        value: option,
                        label: tk(`questions.${key}.options.${option}`),
                      }))}
                    />
                  );
                })}
              </div>
            ) : null}

            {step === "message" ? (
              <div className="flex flex-col gap-5">
                <Field label={t("fields.subject")} error={message(errorOf("subject"))} required>
                  {(control) => <Input {...control} maxLength={200} {...register("subject")} />}
                </Field>

                <Field
                  label={t("fields.message")}
                  hint={t("fields.messageHint", { min: messageLimits.min })}
                  error={message(errorOf("message"))}
                  required
                >
                  {(control) => (
                    <div className="flex flex-col gap-1">
                      <textarea
                        {...control}
                        rows={6}
                        maxLength={messageLimits.max}
                        className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/20"
                        {...register("message")}
                      />
                      <span className="self-end text-xs text-muted-foreground" aria-hidden="true">
                        {t("fields.messageCount", { count: messageLength, max: messageLimits.max })}
                      </span>
                    </div>
                  )}
                </Field>

                <div className="flex flex-col gap-1.5">
                  <span id="attachment-label" className="text-sm font-medium">
                    {t("fields.attachment")}
                  </span>
                  <input
                    ref={fileInputRef}
                    id="attachment-input"
                    type="file"
                    accept={attachmentRules.accept}
                    className="sr-only"
                    aria-labelledby="attachment-label"
                    aria-describedby="attachment-hint"
                    onChange={(event) => {
                      pickFile(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                  {file ? (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
                      <FileIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => pickFile(null)}
                        aria-label={t("fields.removeFile", { name: file.name })}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <XIcon className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit"
                      onClick={() => fileInputRef.current?.click()}
                      aria-describedby="attachment-hint"
                    >
                      <PaperclipIcon className="size-4" aria-hidden="true" />
                      {t("fields.chooseFile")}
                    </Button>
                  )}
                  <p id="attachment-hint" className="text-sm text-muted-foreground">
                    {t("fields.attachmentHint")}
                  </p>
                  {fileError ? (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {t(`errors.${fileError}`)}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t("fields.name")}
                    hint={locked.has("name") ? t("fields.lockedHint") : undefined}
                    error={message(errorOf("name"))}
                    required
                  >
                    {(control) => (
                      <Input
                        {...control}
                        autoComplete="name"
                        readOnly={locked.has("name")}
                        {...register("name")}
                      />
                    )}
                  </Field>
                  <Field
                    label={t("fields.email")}
                    hint={locked.has("email") ? t("fields.lockedHint") : undefined}
                    error={message(errorOf("email"))}
                    required
                  >
                    {(control) => (
                      <Input
                        {...control}
                        type="email"
                        autoComplete="email"
                        dir="ltr"
                        readOnly={locked.has("email")}
                        {...register("email")}
                      />
                    )}
                  </Field>
                </div>
                <Field
                  label={t("fields.phone")}
                  hint={locked.has("phone") ? t("fields.lockedHint") : t("fields.phoneHint")}
                  error={message(errorOf("phone"))}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      dir="ltr"
                      readOnly={locked.has("phone")}
                      {...register("phone")}
                    />
                  )}
                </Field>

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0 accent-[var(--color-primary)]"
                      aria-invalid={Boolean(errorOf("consent"))}
                      aria-describedby={errorOf("consent") ? "consent-error" : undefined}
                      {...register("consent")}
                    />
                    <span>
                      {t.rich("fields.consent", {
                        privacy: (chunks) => (
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="font-medium text-primary underline underline-offset-4"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                  {errorOf("consent") ? (
                    <p id="consent-error" className="text-sm font-medium text-destructive">
                      {message(errorOf("consent"))}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === "review" ? (
              <ReviewSummary values={getValues()} file={file} steps={steps} onEdit={goTo} />
            ) : null}

            {step === "review" && turnstileSiteKey ? (
              <Turnstile
                siteKey={turnstileSiteKey}
                locale={locale}
                label={t("turnstile")}
                onToken={setTurnstileToken}
              />
            ) : null}
          </m.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
        {stepIndex > 0 ? (
          <Button type="button" variant="ghost" onClick={back} disabled={pending}>
            {t("actions.back")}
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="lg"
          disabled={pending || (step === "review" && Boolean(turnstileSiteKey) && !turnstileToken)}
        >
          {step === "review"
            ? pending
              ? t("actions.submitting")
              : t("actions.submit")
            : t("actions.next")}
        </Button>
      </div>
    </form>
  );
}

function ReviewSummary({
  values,
  file,
  steps,
  onEdit,
}: {
  values: QueryFormValues;
  file: File | null;
  steps: StepId[];
  onEdit: (step: StepId) => void;
}) {
  const t = useTranslations("queryForm");
  const tk = t as unknown as (key: string) => string;
  if (!isTopic(values.topic)) return null;
  const topic = values.topic;
  const answers = values.answers[topic];

  const editButton = (target: StepId) =>
    steps.includes(target) ? (
      <button
        type="button"
        onClick={() => onEdit(target)}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        aria-label={t("review.editStep", { step: t(`steps.${target}`) })}
      >
        {t("review.edit")}
      </button>
    ) : null;

  return (
    <dl className="divide-y rounded-xl border">
      <div className="flex items-start justify-between gap-4 p-4">
        <div>
          <dt className="text-sm text-muted-foreground">{t("review.topic")}</dt>
          <dd className="mt-1 font-medium">{t(`topics.${topic}.title`)}</dd>
        </div>
        {editButton("topic")}
      </div>

      {topic !== "other" ? (
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">{t("review.details")}</dt>
            <dd className="mt-2 flex flex-col gap-2">
              {(topicQuestions[topic] as readonly QuestionKey[]).map((key) => {
                const raw = answers[key];
                const chosen = Array.isArray(raw) ? raw : raw ? [raw] : [];
                return (
                  <div key={key}>
                    <p className="text-sm">{tk(`questions.${key}.label`)}</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {chosen.map((value) => (
                        <li
                          key={value}
                          className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                        >
                          {tk(`questions.${key}.options.${value}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </dd>
          </div>
          {editButton("details")}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <dt className="text-sm text-muted-foreground">{t("review.subject")}</dt>
          <dd className="mt-1 font-medium break-words" dir="auto">
            {values.subject}
          </dd>
          <dt className="mt-3 text-sm text-muted-foreground">{t("review.message")}</dt>
          <dd className="mt-1 line-clamp-4 text-sm break-words whitespace-pre-line" dir="auto">
            {values.message}
          </dd>
          <dt className="mt-3 text-sm text-muted-foreground">{t("review.attachment")}</dt>
          <dd className="mt-1 text-sm" dir="auto">
            {file ? file.name : t("review.none")}
          </dd>
        </div>
        {editButton("message")}
      </div>

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <dt className="text-sm text-muted-foreground">{t("review.contact")}</dt>
          <dd className="mt-1 text-sm" dir="auto">
            {values.name}
          </dd>
          <dd className="text-sm" dir="ltr">
            {values.email}
          </dd>
          <dd className="text-sm" dir="ltr">
            {values.phone}
          </dd>
        </div>
        {editButton("message")}
      </div>
    </dl>
  );
}
