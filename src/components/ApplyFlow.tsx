"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type ApplySession = {
  id: string;
  dateText: string;
  timeText: string;
  location: string;
  fee: string;
  state: "open" | "full" | "closed";
  seatsText: string;
};
export type ApplyProgram = {
  id: string;
  slug: string;
  name: string;
  format: string;
  state: "open" | "closed" | "upcoming";
  stateText: string;
  sessions: ApplySession[];
};
export type ApplyCopy = {
  lang: "ko" | "en";
  title: string;
  steps: string[];
  stepLabel: string; // "Step {a} of {b}" template with {a} {b}
  pickProgram: string;
  pickSession: string;
  noSessionsTitle: string;
  noSessionsBody: string;
  closedProgram: string;
  sessionFull: string;
  next: string;
  back: string;
  submit: string;
  submitting: string;
  required: string;
  optional: string;
  fields: Record<"name" | "age" | "gender" | "contact" | "contactHint" | "heard" | "reason" | "expectations" | "health" | "healthHint", string>;
  consent: Record<string, string>;
  errors: Record<string, string>;
  done: Record<"title" | "number" | "program" | "session" | "status" | "statusValue" | "statusWaitlist" | "notice" | "keep" | "home" | "more", string>;
  options: { age: [string, string][]; gender: [string, string][]; heard: [string, string][] };
  privacy: { controller: string; contactEmail: string; purpose: string; items: string; retention: string; sensitivePurpose: string; sensitiveRetention: string; refusal: string };
};

type Values = {
  name: string; age_group: string; gender: string; contact: string; heard_didgeridoo: string;
  reason: string; expectations: string; health_note: string;
  consent_privacy: boolean; consent_sensitive: boolean;
};
const EMPTY: Values = {
  name: "", age_group: "", gender: "", contact: "", heard_didgeridoo: "", reason: "", expectations: "", health_note: "",
  consent_privacy: false, consent_sensitive: false,
};

type Done = { application_no: string; status: string; program: string; session_starts_at: string | null };

export function ApplyFlow({
  copy, programs, nameRequired, initialProgram, initialSession,
}: {
  copy: ApplyCopy; programs: ApplyProgram[]; nameRequired: boolean; initialProgram?: string; initialSession?: string;
}) {
  const startProgram = programs.find((p) => p.slug === initialProgram && p.state === "open");
  const startSession = startProgram?.sessions.find((s) => s.id === initialSession && s.state !== "closed");
  const [programId, setProgramId] = useState(startProgram?.id ?? "");
  const [sessionId, setSessionId] = useState(startSession?.id ?? "");
  const [step, setStep] = useState(startProgram ? (startSession || startProgram.sessions.length === 0 ? 2 : 1) : 0);
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const program = programs.find((p) => p.id === programId);
  const openSessions = useMemo(() => program?.sessions.filter((s) => s.state !== "closed") ?? [], [program]);
  const session = program?.sessions.find((s) => s.id === sessionId);
  const needsSession = openSessions.length > 0;

  useEffect(() => {
    heading.current?.focus({ preventScroll: false });
  }, [step, done]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  function goNext() {
    if (step === 0) {
      if (!programId) return setErrors({ program: copy.errors.required });
      return setStep(needsSession ? 1 : 2);
    }
    if (step === 1) {
      if (needsSession && !sessionId) return setErrors({ session: copy.errors.session_required });
      return setStep(2);
    }
    if (step === 2) {
      const e: Record<string, string> = {};
      if (nameRequired && !v.name.trim()) e.name = copy.errors.required;
      if (!v.age_group) e.age_group = copy.errors.required;
      if (!v.gender) e.gender = copy.errors.required;
      if (v.contact.trim().length < 3) e.contact = copy.errors.contact;
      setErrors(e);
      if (Object.keys(e).length) return focusFirstError(e);
      return setStep(3);
    }
  }

  function focusFirstError(e: Record<string, string>) {
    const key = Object.keys(e)[0];
    requestAnimationFrame(() => document.getElementById(`f-${key}`)?.focus());
  }

  function back() {
    setErrors({});
    if (step === 2 && !needsSession) return setStep(0);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    const hasHealth = v.health_note.trim() !== "";
    if (!v.consent_privacy) e.consent_privacy = copy.errors.consent;
    if (hasHealth && !v.consent_sensitive) e.consent_sensitive = copy.errors.sensitive;
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError(e);

    setBusy(true);
    setFormError("");
    try {
      const form = ev.currentTarget as HTMLFormElement;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          session_id: sessionId || null,
          name: v.name,
          age_group: v.age_group,
          gender: v.gender,
          contact: v.contact,
          heard_didgeridoo: v.heard_didgeridoo || null,
          reason: v.reason,
          expectations: v.expectations,
          health_note: v.health_note,
          consent_privacy: true,
          consent_sensitive: hasHealth && v.consent_sensitive,
          lang: copy.lang,
          website: (form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone({ application_no: data.application_no, status: data.status, program: data.program ?? program?.name ?? "", session_starts_at: data.session_starts_at });
        window.scrollTo({ top: 0 });
      } else {
        setFormError(copy.errors[data.error] ?? copy.errors.generic);
      }
    } catch {
      setFormError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  const base = `/${copy.lang}`;

  if (done) {
    return (
      <div role="status" className="mx-auto max-w-2xl text-center">
        <p className="chapter justify-center"><b>✓</b></p>
        <h1 ref={heading} tabIndex={-1} className="font-title-kr mt-6 text-[clamp(1.37rem,2.9vw,2.02rem)] outline-none">{copy.done.title}</h1>
        <dl className="mt-10 divide-y divide-[var(--rule)] border-y border-[var(--rule-strong)] text-left">
          <Row k={copy.done.number} v={<strong className="font-title text-xl tracking-wider">{done.application_no}</strong>} />
          <Row k={copy.done.program} v={done.program} />
          {session && <Row k={copy.done.session} v={`${session.dateText} ${session.timeText}`.trim()} />}
          <Row k={copy.done.status} v={<span className="badge text-burgundy">{done.status === "waitlist" ? copy.done.statusWaitlist : copy.done.statusValue}</span>} />
        </dl>
        <p className="mt-8 leading-relaxed">{copy.done.notice}</p>
        <p className="mt-2 text-sm text-brown/65">{copy.done.keep}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={base} className="btn btn-solid">{copy.done.home}</Link>
          <Link href={`${base}/program`} className="btn">{copy.done.more}</Link>
        </div>
      </div>
    );
  }

  const hasHealth = v.health_note.trim() !== "";
  const p = copy.privacy;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="chapter"><b>{String(step + 1).padStart(2, "0")}</b><span aria-hidden>/</span><span>{copy.steps[step]}</span></p>
      <ol aria-label={copy.title} className="mt-5 hidden grid-cols-4 gap-2 sm:grid">
        {copy.steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`border-t-2 pt-2 text-sm ${i <= step ? "border-burgundy text-brown" : "border-[var(--rule)] text-brown/50"}`}>
            {String(i + 1).padStart(2, "0")} · {s}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-brown/65 sm:hidden">{copy.stepLabel.replace("{a}", String(step + 1)).replace("{b}", "4")}</p>

      <form onSubmit={submit} noValidate className="mt-8">
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        {step === 0 && (
          <fieldset>
            <legend className="font-title-kr text-[clamp(1.22rem,2.4vw,1.73rem)]"><h1 ref={heading} tabIndex={-1} className="outline-none">{copy.pickProgram}</h1></legend>
            <div className="mt-6 space-y-3">
              {programs.map((pr) => {
                const disabled = pr.state !== "open";
                return (
                  <label key={pr.id} className={`choice ${disabled ? "opacity-55" : ""}`}>
                    <input type="radio" name="program" id={pr.id === programs[0].id ? "f-program" : undefined} disabled={disabled} checked={programId === pr.id}
                      onChange={() => { setProgramId(pr.id); setSessionId(""); setErrors({}); }} />
                    <span>
                      <span className="font-title block text-[1.25rem] leading-tight">{pr.name}</span>
                      <span className="block text-sm text-bronze-deep">{pr.format}</span>
                      {disabled && <span className="mt-1 block text-sm text-burgundy">{pr.stateText}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.program && <p role="alert" className="error-text">{errors.program}</p>}
          </fieldset>
        )}

        {step === 1 && program && (
          <fieldset>
            <legend className="font-title-kr text-[clamp(1.22rem,2.4vw,1.73rem)]"><h1 ref={heading} tabIndex={-1} className="outline-none">{copy.pickSession}</h1></legend>
            <p className="font-title mt-2 text-xl text-bronze-deep">{program.name}</p>
            <div className="mt-6 space-y-3">
              {program.sessions.map((s, i) => {
                const disabled = s.state === "closed";
                return (
                  <label key={s.id} className={`choice ${disabled ? "opacity-55" : ""}`}>
                    <input type="radio" name="session" id={i === 0 ? "f-session" : undefined} disabled={disabled} checked={sessionId === s.id} onChange={() => { setSessionId(s.id); setErrors({}); }} />
                    <span>
                      <span className="font-title-kr block text-lg">{s.dateText}</span>
                      <span className="block text-sm text-brown/75">{[s.timeText, s.location, s.fee].filter(Boolean).join(" · ")}</span>
                      <span className={`mt-1 block text-sm ${s.state === "full" ? "text-bronze-deep" : "text-olive"}`}>{s.state === "full" ? copy.sessionFull : s.seatsText}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.session && <p role="alert" className="error-text">{errors.session}</p>}
          </fieldset>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h1 ref={heading} tabIndex={-1} className="font-title-kr text-[clamp(1.22rem,2.4vw,1.73rem)] outline-none">{copy.title}</h1>
            {program && (
              <p className="font-title -mt-4 text-xl text-bronze-deep">
                {program.name}{session ? ` — ${session.dateText}` : ""}
              </p>
            )}
            {!needsSession && program && (
              <div className="border border-[var(--rule)] bg-paper p-4 text-[0.95rem]">
                <p className="font-semibold">{copy.noSessionsTitle}</p>
                <p className="mt-1 text-brown/75">{copy.noSessionsBody}</p>
              </div>
            )}

            <Field id="name" label={copy.fields.name} required={nameRequired} copy={copy} error={errors.name}>
              <input id="f-name" className="input" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} maxLength={100} />
            </Field>

            <Choice id="age_group" legend={copy.fields.age} required copy={copy} error={errors.age_group} options={copy.options.age} value={v.age_group} onChange={(x) => set("age_group", x)} cols />
            <Choice id="gender" legend={copy.fields.gender} required copy={copy} error={errors.gender} options={copy.options.gender} value={v.gender} onChange={(x) => set("gender", x)} cols />

            <Field id="contact" label={copy.fields.contact} required copy={copy} error={errors.contact} hint={copy.fields.contactHint}>
              <input id="f-contact" className="input" autoComplete="tel email" value={v.contact} onChange={(e) => set("contact", e.target.value)} aria-invalid={!!errors.contact} aria-describedby={`h-contact${errors.contact ? " e-contact" : ""}`} maxLength={200} />
            </Field>

            <Choice id="heard" legend={copy.fields.heard} copy={copy} options={copy.options.heard} value={v.heard_didgeridoo} onChange={(x) => set("heard_didgeridoo", x)} />

            <Field id="reason" label={copy.fields.reason} copy={copy}>
              <textarea id="f-reason" className="input" value={v.reason} onChange={(e) => set("reason", e.target.value)} maxLength={3000} />
            </Field>
            <Field id="expectations" label={copy.fields.expectations} copy={copy}>
              <textarea id="f-expectations" className="input" value={v.expectations} onChange={(e) => set("expectations", e.target.value)} maxLength={3000} />
            </Field>
            <Field id="health_note" label={copy.fields.health} copy={copy} hint={copy.fields.healthHint}>
              <textarea id="f-health_note" className="input" value={v.health_note} onChange={(e) => set("health_note", e.target.value)} maxLength={3000} aria-describedby="h-health_note" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h1 ref={heading} tabIndex={-1} className="font-title-kr text-[clamp(1.22rem,2.4vw,1.73rem)] outline-none">{copy.consent.privacyTitle}</h1>
            <div className="space-y-3 border border-[var(--rule)] bg-paper p-5 text-[0.95rem] leading-relaxed">
              {p.controller && <Line k={copy.consent.controller} v={p.controller} />}
              {p.contactEmail && <Line k={copy.consent.contact} v={p.contactEmail} />}
              {p.purpose && <Line k={copy.consent.purpose} v={p.purpose} />}
              {p.items && <Line k={copy.consent.items} v={p.items} />}
              {p.retention && <Line k={copy.consent.retention} v={p.retention} />}
              {p.refusal && <Line k={copy.consent.refusal} v={p.refusal} />}
            </div>
            <div>
              <label className="choice">
                <input id="f-consent_privacy" type="checkbox" checked={v.consent_privacy} onChange={(e) => set("consent_privacy", e.target.checked)} aria-invalid={!!errors.consent_privacy} aria-describedby={errors.consent_privacy ? "e-consent_privacy" : undefined} />
                <span className="font-semibold">{copy.consent.privacyAgree} <span className="text-burgundy">({copy.required})</span></span>
              </label>
              {errors.consent_privacy && <p id="e-consent_privacy" role="alert" className="error-text">{errors.consent_privacy}</p>}
            </div>

            {hasHealth && (
              <div className="space-y-4">
                <h2 className="font-title-kr text-xl">{copy.consent.sensitiveTitle}</h2>
                <div className="space-y-3 border border-[var(--rule)] bg-paper p-5 text-[0.95rem] leading-relaxed">
                  {p.sensitivePurpose && <Line k={copy.consent.sensitivePurpose} v={p.sensitivePurpose} />}
                  {p.sensitiveRetention && <Line k={copy.consent.sensitiveRetention} v={p.sensitiveRetention} />}
                  {p.refusal && <Line k={copy.consent.refusal} v={p.refusal} />}
                </div>
                <label className="choice">
                  <input id="f-consent_sensitive" type="checkbox" checked={v.consent_sensitive} onChange={(e) => set("consent_sensitive", e.target.checked)} aria-invalid={!!errors.consent_sensitive} aria-describedby={errors.consent_sensitive ? "e-consent_sensitive" : undefined} />
                  <span className="font-semibold">{copy.consent.sensitiveAgree} <span className="text-burgundy">({copy.required})</span></span>
                </label>
                {errors.consent_sensitive && <p id="e-consent_sensitive" role="alert" className="error-text">{errors.consent_sensitive}</p>}
              </div>
            )}
            {formError && <p role="alert" className="border border-burgundy p-4 text-burgundy">{formError}</p>}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] pt-6">
          {step > 0 ? <button type="button" className="btn" onClick={back}>{copy.back}</button> : <span />}
          {step < 3 ? (
            <button type="button" className="btn btn-solid" onClick={goNext}>{copy.next}</button>
          ) : (
            <button type="submit" className="btn btn-solid" disabled={busy}>{busy ? copy.submitting : copy.submit}</button>
          )}
        </div>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="text-bronze-deep">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
function Line({ k, v }: { k: string; v: string }) {
  return (
    <p>
      <span className="font-semibold">{k}: </span>
      <span className="whitespace-pre-line">{v}</span>
    </p>
  );
}

function Field({ id, label, required, copy, error, hint, children }: { id: string; label: string; required?: boolean; copy: ApplyCopy; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="field-label">
        {label} <span className={required ? "text-burgundy" : "font-normal text-brown/55"}>({required ? copy.required : copy.optional})</span>
      </label>
      {children}
      {hint && <p id={`h-${id}`} className="field-hint mt-1.5">{hint}</p>}
      {error && <p id={`e-${id}`} role="alert" className="error-text">{error}</p>}
    </div>
  );
}

function Choice({ id, legend, required, copy, error, options, value, onChange, cols }: { id: string; legend: string; required?: boolean; copy: ApplyCopy; error?: string; options: [string, string][]; value: string; onChange: (v: string) => void; cols?: boolean }) {
  return (
    <fieldset aria-describedby={error ? `e-${id}` : undefined}>
      <legend className="field-label">
        {legend} <span className={required ? "text-burgundy" : "font-normal text-brown/55"}>({required ? copy.required : copy.optional})</span>
      </legend>
      <div className={`grid gap-2.5 ${cols ? "sm:grid-cols-2" : ""}`}>
        {options.map(([code, label], i) => (
          <label key={code} className="choice">
            <input type="radio" name={id} id={i === 0 ? `f-${id}` : undefined} value={code} checked={value === code} onChange={() => onChange(code)} aria-invalid={!!error} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {error && <p id={`e-${id}`} role="alert" className="error-text">{error}</p>}
    </fieldset>
  );
}
