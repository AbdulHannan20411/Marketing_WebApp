import "server-only";

import { getTranslations } from "next-intl/server";

import type { Locale } from "@/lib/i18n/routing";

import { questions, topicQuestions, type QuestionKey, type Topic } from "./definitions";

export type LabelledAnswer = { question: QuestionKey; label: string; values: string[] };

/**
 * Turns stored answers (option keys) into labelled values in a locale, e.g.
 * { teamSize: "2-5" } → "How big is your team?: 2–5 people". Unknown keys are skipped.
 */
export async function labelAnswers(
  topic: Topic,
  answers: Record<string, unknown>,
  locale: Locale,
): Promise<LabelledAnswer[]> {
  const t = await getTranslations({ locale, namespace: "queryForm.questions" });
  const tk = t as unknown as (key: string) => string;
  const out: LabelledAnswer[] = [];
  for (const question of topicQuestions[topic] as readonly QuestionKey[]) {
    const raw = answers[question];
    const chosen = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]).filter(
      (value): value is string =>
        typeof value === "string" &&
        (questions[question].options as readonly string[]).includes(value),
    );
    if (chosen.length === 0) continue;
    out.push({
      question,
      label: tk(`${question}.label`),
      values: chosen.map((value) => tk(`${question}.options.${value}`)),
    });
  }
  return out;
}

export async function topicLabel(topic: Topic, locale: Locale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "queryForm.topics" });
  return t(`${topic}.title`);
}
