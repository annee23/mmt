"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, fmtDate, fmtDateTime } from "@/components/admin/api";
import { APPLICATION_STATUSES, STATUS_LABEL_KO, STATUS_TONE, type ApplicationStatus } from "@/lib/application";

type Row = {
  id: string; application_no: string; created_at: string; name: string; contact: string; status: ApplicationStatus;
  programs: { name_ko: string } | null; program_sessions: { starts_at: string; title_ko: string } | null;
};
type Program = { id: string; name_ko: string };

export function ApplicationsView({ canExportHealth }: { canExportHealth: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [q, setQ] = useState(sp.get("q") ?? "");

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const size = 30;
  const query = sp.toString();

  const setParam = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in patch)) next.delete("page");
      router.replace(`/admin/applications?${next.toString()}`);
    },
    [router, sp],
  );

  useEffect(() => {
    api<{ programs: Program[] }>("/api/admin/programs").then((r) => r.ok && setPrograms(r.data.programs));
  }, []);

  useEffect(() => {
    let live = true;
    const params = new URLSearchParams(query);
    params.set("size", String(size));
    api<{ rows: Row[]; total: number }>(`/api/admin/applications?${params}`).then((r) => {
      if (!live) return;
      if (r.ok) { setRows(r.data.rows); setTotal(r.data.total); setError(""); } else setError(errorText(r.data.error));
    });
    return () => { live = false; };
  }, [query]);

  const exportParams = new URLSearchParams(query);
  exportParams.delete("page");
  const pages = Math.max(1, Math.ceil(total / size));
  const sort = sp.get("sort") === "asc" ? "asc" : "desc";

  return (
    <div>
      <form
        className="grid gap-3 border border-[var(--rule)] bg-paper p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => { e.preventDefault(); setParam({ q: q.trim() }); }}
        role="search"
        aria-label="신청자 검색"
      >
        <div className="lg:col-span-2">
          <label htmlFor="q" className="field-label">이름 검색</label>
          <input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 신청번호 · 연락처" />
        </div>
        <div>
          <label htmlFor="program" className="field-label">프로그램</label>
          <select id="program" className="input" value={sp.get("program") ?? ""} onChange={(e) => setParam({ program: e.target.value, session: "" })}>
            <option value="">전체</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name_ko}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="field-label">상태</label>
          <select id="status" className="input" value={sp.get("status") ?? ""} onChange={(e) => setParam({ status: e.target.value })}>
            <option value="">전체</option>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL_KO[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="field-label">신청일 (시작)</label>
          <input id="from" type="date" className="input" value={sp.get("from") ?? ""} onChange={(e) => setParam({ from: e.target.value })} />
        </div>
        <div>
          <label htmlFor="to" className="field-label">신청일 (끝)</label>
          <input id="to" type="date" className="input" value={sp.get("to") ?? ""} onChange={(e) => setParam({ to: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn btn-sm btn-solid">검색</button>
          <button type="button" className="btn btn-sm" onClick={() => { setQ(""); router.replace("/admin/applications"); }}>초기화</button>
          {sp.get("session") && <span className="badge text-bronze-deep">특정 회차만 보는 중</span>}
          <span className="flex-1" />
          <a className="btn btn-sm" href={`/api/admin/applications/export?${exportParams}`}>CSV 다운로드</a>
          {canExportHealth && (
            <a className="btn btn-sm" href={`/api/admin/applications/export?${exportParams}&include_health=1`} onClick={(e) => { if (!confirm("건강 관련 민감정보가 포함된 CSV를 내려받습니다. 이 작업은 감사 로그에 기록됩니다.")) e.preventDefault(); }}>
              CSV (민감정보 포함)
            </a>
          )}
        </div>
      </form>

      {error && <p role="alert" className="error-text mt-4">{error}</p>}
      <p className="mt-6 text-sm text-brown/65" aria-live="polite">{rows ? `총 ${total}건` : "불러오는 중…"}</p>

      <div className="mt-2 overflow-x-auto">
        <table className="adm-table">
          <thead>
            <tr>
              <th>신청번호</th>
              <th aria-sort={sort === "asc" ? "ascending" : "descending"}>
                <button type="button" className="font-semibold" onClick={() => setParam({ sort: sort === "asc" ? "desc" : "asc" })}>
                  신청일 {sort === "asc" ? "▲" : "▼"}
                </button>
              </th>
              <th>이름</th><th>연락처</th><th>신청 프로그램</th><th>신청 회차</th><th>신청 상태</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-brown/60">조건에 맞는 신청이 없습니다.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.id}>
                <td><Link className="link-u font-semibold" href={`/admin/applications/${r.id}`}>{r.application_no}</Link></td>
                <td className="whitespace-nowrap" title={fmtDateTime(r.created_at)}>{fmtDate(r.created_at)}</td>
                <td>{r.name || <span className="text-brown/45">(미입력)</span>}</td>
                <td>{r.contact}</td>
                <td>{r.programs?.name_ko}</td>
                <td>{r.program_sessions ? `${fmtDate(r.program_sessions.starts_at)} ${r.program_sessions.title_ko}` : <span className="text-brown/45">일정 미정</span>}</td>
                <td><span className={`badge ${STATUS_TONE[r.status]}`}>{STATUS_LABEL_KO[r.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="페이지" className="mt-6 flex items-center gap-3">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) })}>이전</button>
          <span className="text-sm">{page} / {pages}</span>
          <button className="btn btn-sm" disabled={page >= pages} onClick={() => setParam({ page: String(page + 1) })}>다음</button>
        </nav>
      )}
    </div>
  );
}
