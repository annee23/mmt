import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplyFlow, type ApplyCopy } from "@/components/ApplyFlow";
import { getUI, isLang } from "@/lib/i18n";
import { getPrograms } from "@/lib/programs";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/[lang]/apply">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: getUI(lang).applyForm.title,
    alternates: { canonical: `/${lang}/apply`, languages: { ko: "/ko/apply", en: "/en/apply" } },
  };
}

export default async function ApplyPage({ params, searchParams }: PageProps<"/[lang]/apply">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const [programs, { form, privacy }] = await Promise.all([getPrograms(lang), getSettings()]);
  const ui = getUI(lang);
  const f = ui.applyForm;
  const pick = (ko: string, en: string) => (lang === "ko" ? ko || en : en || ko);

  const copy: ApplyCopy = {
    lang,
    title: f.title,
    steps: f.steps,
    stepLabel: lang === "ko" ? "{a} / {b} 단계" : "Step {a} of {b}",
    pickProgram: f.pickProgram,
    pickSession: f.pickSession,
    noSessionsTitle: f.noSessionsTitle,
    noSessionsBody: f.noSessionsBody,
    closedProgram: f.closedProgram,
    sessionFull: f.sessionFull,
    next: f.next,
    back: f.back,
    submit: f.submit,
    submitting: f.submitting,
    required: f.required,
    optional: f.optional,
    fields: f.fields,
    consent: f.consent,
    errors: f.errors,
    done: f.done,
    options: {
      age: ui.options.age.map(([a, b]) => [a, b]),
      gender: ui.options.gender.map(([a, b]) => [a, b]),
      heard: ui.options.heard.map(([a, b]) => [a, b]),
    },
    privacy: {
      controller: privacy.controller,
      contactEmail: privacy.contact_email,
      purpose: pick(privacy.purpose_ko, privacy.purpose_en),
      items: pick(privacy.items_ko, privacy.items_en),
      retention: pick(privacy.retention_ko, privacy.retention_en),
      sensitivePurpose: pick(privacy.sensitive_purpose_ko, privacy.sensitive_purpose_en),
      sensitiveRetention: pick(privacy.sensitive_retention_ko, privacy.sensitive_retention_en),
      refusal: pick(privacy.refusal_ko, privacy.refusal_en),
    },
  };
  const list = programs.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    format: p.format,
    state: p.state,
    stateText: p.state === "upcoming" ? ui.program.upcoming : ui.program.closed,
    sessions: p.sessions.map((s) => ({
      id: s.id,
      dateText: s.dateText,
      timeText: s.timeText,
      location: s.location,
      fee: s.fee,
      state: s.state,
      seatsText: s.remaining === null ? ui.program.open : ui.program.seatsLeft(s.remaining),
    })),
  }));

  const pParam = typeof sp.program === "string" ? sp.program : undefined;
  const sParam = typeof sp.session === "string" ? sp.session : undefined;
  return (
    <div className="wrap py-14 md:py-24">
      <ApplyFlow copy={copy} programs={list} nameRequired={form.name_required} initialProgram={pParam} initialSession={sParam} />
    </div>
  );
}
