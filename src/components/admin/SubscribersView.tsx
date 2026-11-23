"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, fmtDate } from "@/components/admin/api";

type Sub = { id: string; email: string; status: "active" | "unsubscribed"; lang: string; subscribed_at: string; unsubscribed_at: string | null };

export function SubscribersView({ canWrite }: { canWrite: boolean }) {
  const [rows, setRows] = useState<Sub[] | null>(null);
  const [filter, setFilter] = useState<"" | "active" | "unsubscribed">("");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await api<{ rows: Sub[] }>(`/api/admin/subscribers${filter ? `?status=${filter}` : ""}`);
    if (r.ok) setRows(r.data.rows); else setMsg(errorText(r.data.error));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function toggle(s: Sub) {
    const next = s.status === "active" ? "unsubscribed" : "active";
    if (!confirm(next === "unsubscribed" ? `${s.email} 구독을 취소 처리할까요?` : `${s.email} 구독을 다시 활성화할까요?`)) return;
    const r = await api(`/api/admin/subscribers/${s.id}`, { method: "PATCH", json: { status: next } });
    if (!r.ok) return setMsg(errorText(r.data.error));
    load();
  }

  const shown = (rows ?? []).filter((s) => s.email.includes(q.trim().toLowerCase()));
  const active = (rows ?? []).filter((s) => s.status === "active").length;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="sq" className="field-label">이메일 검색</label>
          <input id="sq" className="input" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sf" className="field-label">상태</label>
          <select id="sf" className="input" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="">전체</option><option value="active">구독 중</option><option value="unsubscribed">구독 취소</option>
          </select>
        </div>
        <a className="btn btn-sm" href={`/api/admin/subscribers/export${filter === "active" ? "?status=active" : ""}`}>CSV 다운로드</a>
      </div>
      {msg && <p role="alert" className="error-text mt-3">{msg}</p>}
      <p className="mt-6 text-sm text-brown/65" aria-live="polite">{rows ? `총 ${rows.length}명 · 구독 중 ${active}명` : "불러오는 중…"}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="adm-table">
          <thead><tr><th>이메일</th><th>상태</th><th>언어</th><th>구독일</th><th>취소일</th><th /></tr></thead>
          <tbody>
            {shown.length === 0 && rows && <tr><td colSpan={6} className="py-8 text-center text-brown/60">구독자가 없습니다.</td></tr>}
            {shown.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td><span className={`badge ${s.status === "active" ? "text-brown" : "text-brown/55"}`}>{s.status === "active" ? "구독 중" : "구독 취소"}</span></td>
                <td>{s.lang.toUpperCase()}</td>
                <td>{fmtDate(s.subscribed_at)}</td>
                <td>{fmtDate(s.unsubscribed_at)}</td>
                <td>{canWrite && <button type="button" className="link-u" onClick={() => toggle(s)}>{s.status === "active" ? "구독 취소 처리" : "다시 구독"}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
