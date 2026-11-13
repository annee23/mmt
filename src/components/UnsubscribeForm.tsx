"use client";

import { useState } from "react";

type Copy = { confirmTitle: string; confirmButton: string; unsubscribed: string; unsubscribeInvalid: string; resubscribe: string };

export function UnsubscribeForm({ token, copy }: { token: string; copy: Copy }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "invalid">(/^[a-f0-9]{48}$/.test(token) ? "idle" : "invalid");

  async function run() {
    setState("busy");
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "invalid");
  }

  return (
    <div className="max-w-xl" role="status" aria-live="polite">
      {state === "done" ? (
        <>
          <h1 className="font-title-kr text-2xl">{copy.unsubscribed}</h1>
          <p className="mt-4 text-brown/75">{copy.resubscribe}</p>
        </>
      ) : state === "invalid" ? (
        <h1 className="font-title-kr text-2xl">{copy.unsubscribeInvalid}</h1>
      ) : (
        <>
          <h1 className="font-title-kr text-2xl">{copy.confirmTitle}</h1>
          <button type="button" onClick={run} disabled={state === "busy"} className="btn btn-solid mt-8">
            {copy.confirmButton}
          </button>
        </>
      )}
    </div>
  );
}
