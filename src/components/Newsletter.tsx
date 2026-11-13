"use client";

import { useState } from "react";

type Copy = {
  title: string;
  description: string;
  placeholder: string;
  submit: string;
  sending: string;
  success: string;
  already: string;
  invalid: string;
  error: string;
  privacy: string;
};

export function Newsletter({ copy, lang }: { copy: Copy; lang: "ko" | "en" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "already" | "invalid" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang, website: form.get("website") }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "already") setState("already");
      else if (res.ok) {
        setState("ok");
        setEmail("");
      } else setState(res.status === 400 ? "invalid" : "error");
    } catch {
      setState("error");
    }
  }

  const message = { ok: copy.success, already: copy.already, invalid: copy.invalid, error: copy.error, idle: "", sending: "" }[state];

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl">
      <label htmlFor="newsletter-email" className="font-title text-2xl md:text-2xl">
        {copy.title}
      </label>
      <p className="mt-3 text-[0.98rem] text-brown/80">{copy.description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          aria-describedby="newsletter-status"
          className="input flex-1"
        />
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <button type="submit" className="btn btn-solid" disabled={state === "sending"}>
          {state === "sending" ? copy.sending : copy.submit}
        </button>
      </div>
      <p id="newsletter-status" role="status" aria-live="polite" className={`mt-3 min-h-6 text-sm ${state === "ok" ? "text-olive" : "text-burgundy"}`}>
        {message}
      </p>
      <p className="text-xs text-brown/60">{copy.privacy}</p>
    </form>
  );
}
