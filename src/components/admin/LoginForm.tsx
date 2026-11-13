"use client";

import { useState } from "react";
import { api, errorText } from "@/components/admin/api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await api("/api/admin/login", { method: "POST", json: { email, password } });
    if (res.ok) {
      window.location.href = "/admin";
      return;
    }
    setError(errorText(res.data.error));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-5">
      <div>
        <label htmlFor="email" className="field-label">이메일</label>
        <input id="email" type="email" autoComplete="username" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">비밀번호</label>
        <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <button type="submit" className="btn btn-solid w-full" disabled={busy}>
        {busy ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
