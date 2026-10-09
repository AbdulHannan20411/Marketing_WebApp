import { z } from "@/lib/validation/zod";

import { normalisePakistaniPhone } from "@/lib/validation/phone";

import {
  messageLimits,
  questions,
  querySources,
  subjectLimits,
  topicKeys,
  topicQuestions,
  type QuestionKey,
  type Topic,
} from "./definitions";

/**
 * Schemas for the guided query form, built from definitions.ts. The browser validates
 * each step with them; the server action validates the whole submission again.
 * Error messages are codes translated via `queryForm.errors.<code>` or `validation.<code>`.
 */

export type QueryValidationCode =
  | "required"
  | "email"
  | "nameLength"
  | "phone"
  | "consent"
  | "chooseTopic"
  | "chooseOption"
  | "chooseAtLeastOne"
  | "subjectLength"
  | "messageShort"
  | "messageLong";

function questionSchema(key: QuestionKey) {
  const def = questions[key];
  const options = def.options as readonly [string, ...string[]];
  if (def.kind === "single") {
    return z.enum(options, "chooseOption");
  }
  return z
    .array(z.enum(options, "chooseAtLeastOne"))
    .min(1, "chooseAtLeastOne")
    .max(options.length)
    .refine((values) => new Set(values).size === values.length, "chooseAtLeastOne");
}

/** Answers for one topic: exactly its questions, no extra keys. */
export function answersSchema(topic: Topic) {
  const shape = Object.fromEntries(
    (topicQuestions[topic] as readonly QuestionKey[]).map((key) => [key, questionSchema(key)]),
  );
  return z.object(shape).strict();
}

const requiredPhone = z
  .string()
  .trim()
  .min(1, "required")
  .max(32, "phone")
  .transform((value, ctx) => {
    const normalised = normalisePakistaniPhone(value);
    if (!normalised) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return normalised;
  });

export const topicStepSchema = z.object({
  topic: z.enum(topicKeys, "chooseTopic"),
});

export const contactStepSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(subjectLimits.min, "subjectLength")
    .max(subjectLimits.max, "subjectLength"),
  message: z
    .string()
    .trim()
    .min(messageLimits.min, "messageShort")
    .max(messageLimits.max, "messageLong"),
  name: z.string().trim().min(2, "nameLength").max(120, "nameLength"),
  email: z
    .string()
    .trim()
    .min(1, "required")
    .max(254, "email")
    .pipe(z.email("email"))
    .transform((value) => value.toLowerCase()),
  phone: requiredPhone,
  consent: z.literal(true, "consent"),
});

const utmSchema = z
  .object({
    utm_source: z.string().max(100),
    utm_medium: z.string().max(100),
    utm_campaign: z.string().max(100),
    utm_term: z.string().max(100),
    utm_content: z.string().max(100),
  })
  .partial()
  .strict();

const answersByTopic = z.discriminatedUnion(
  "topic",
  topicKeys.map((topic) =>
    z.object({ topic: z.literal(topic), answers: answersSchema(topic) }),
  ) as unknown as [z.ZodObject<{ topic: z.ZodLiteral<Topic>; answers: z.ZodObject }>],
);

/** Everything the server action accepts (besides the optional file). */
export const querySubmissionSchema = z
  .object({
    source: z.enum(querySources),
    locale: z.enum(["en", "ur"]),
    utm: utmSchema.default({}),
    /** Signed form token proving the form was opened a few seconds ago (anti-bot). */
    token: z.string().max(200),
    /** Honeypot: humans never see or fill it. */
    website: z.string().max(200).default(""),
    turnstileToken: z.string().max(4096).optional(),
  })
  .and(contactStepSchema)
  .and(answersByTopic);

export type QuerySubmission = z.output<typeof querySubmissionSchema>;

/** Error codes as a flat map keyed by dotted path (e.g. "answers.teamSize"). */
export function queryFieldErrors(error: z.ZodError): Record<string, QueryValidationCode> {
  const out: Record<string, QueryValidationCode> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= (issue.message as QueryValidationCode) || "required";
  }
  return out;
}
