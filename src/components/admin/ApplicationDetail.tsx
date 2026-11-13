"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, fmtDateTime } from "@/components/admin/api";
import {
  AGE_LABEL_KO, APPLICATION_STATUSES, GENDER_LABEL_KO, HEARD_LABEL_KO, STATUS_LABEL_KO, STATUS_TONE, type ApplicationStatus,
} from "@/lib/application";

type App = {
  id: string; application_no: string; created_at: string; name: string; age_group: string; gender: string; contact: string;
  heard_didgeridoo: string | null; reason: string; expectations: string; status: ApplicationStatus; internal_memo: string;
  consent_privacy_at: string; consent_version: string; consent_sensitive: boolean; source: string; lang: string;
  programs: { name_ko: string; slug: string } | null;
  program_sessions: { starts_at: string; title_ko: string; time_note_ko: string } | null;
};
type History = { id: number; from_status: string | null; to_status: string; changed_by_email: string | null; created_at: string };

export function ApplicationDetail({ id, canWrite, canViewSensitive, isOwner }: { id: string; canWrite: boolean; canViewSensitive: boolean; isOwner: boolean }) {
  const [app, setApp] = useState<App | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [status, setStatus] = useState<ApplicationStatus>("new");
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await api<{ application: App; history: History[] }>(`/api/admin/applications/${id}`);
    if (!r.ok) return setError(errorText(r.data.error));
    setApp(r.data.application);
    setHistory(r.data.history);
    setStatus(r.data.application.status);
    setMemo(r.data.application.internal_memo ?? "");
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function save(patch: Record<string, unknown>, label: string) {
    setBusy(true);
    setMsg(null);
    const r = await api<{ warning?: string | null }>(`/api/admin/applications/${id}`, { method: "PATCH", json: patch });
    setBusy(false);
    if (!r.ok) return setMsg({ tone: "err", text: errorText(r.data.error) });
    setMsg({ tone: "ok", text: r.data.warning === "over_capacity" ? `${label} 저장됨 — 주의: 확정 인원이 정원을 초과했습니다.` : `${label} 저장되었습니다.` });
    await load();
  }

  async function revealHealth() {
    const r = await api<{ note: { health_note: string } | null }>(`/api/admin/applications/${id}/sensitive`);
    if (!r.ok) return setMsg({ tone: "err", text: errorText(r.data.error) });
    setHealth(r.data.note?.health_note ?? "");
  }
  async function deleteHealth() {
    if (!confirm("건강 관련 응답을 영구 삭제합니다. 되돌릴 수 없습니다.")) return;
    const r = await api(`/api/admin/applications/${id}/sensitive`, { method: "DELETE" });
    if (!r.ok) return setMsg({ tone: "err", text: errorText(r.data.error) });
    setHealth(null);
    setMsg({ tone: "ok", text: "건강 관련 응답을 삭제했습니다." });
    await load();
  }

  if (error) return <p role="alert" className="error-text">{error}</p>;
  if (!app) return <p className="text-brown/60">불러오는 중…</p>;

  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className="grid gap-1 border-b border-[var(--rule)] py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="text-sm text-bronze-deep">{k}</dt>
      <dd className="whitespace-pre-line">{children || <span className="text-brown/45">(미입력)</span>}</dd>
    </div>
  );

  return (
    <div className="grid gap-12 xl:grid-cols-[1fr_22rem]">
      <section aria-label="신청 내용">
        <Link href="/admin/applications" className="link-u text-sm">← 목록</Link>
        <h1 className="font-title mt-3 text-4xl">{app.application_no}</h1>
        <p className="mt-1 text-brown/65">{fmtDateTime(app.created_at)} 접수 · {app.source === "import" ? "CSV 가져오기" : "웹 신청"}</p>

        <dl className="mt-6 border-t border-[var(--rule-strong)]">
          <Row k="신청 프로그램">{app.programs?.name_ko}</Row>
          <Row k="신청 회차">{app.program_sessions ? `${fmtDateTime(app.program_sessions.starts_at)} ${app.program_sessions.title_ko}` : "일정 미정"}</Row>
          <Row k="이름">{app.name}</Row>
          <Row k="연령대">{AGE_LABEL_KO[app.age_group]}</Row>
          <Row k="성별">{GENDER_LABEL_KO[app.gender]}</Row>
          <Row k="연락처">{app.contact}</Row>
          <Row k="디저리두 청취 경험">{app.heard_didgeridoo ? HEARD_LABEL_KO[app.heard_didgeridoo] : ""}</Row>
          <Row k="참여하고 싶은 이유">{app.reason}</Row>
          <Row k="경험해보고 싶은 것">{app.expectations}</Row>
          <Row k="건강 관련 사항">
            {!app.consent_sensitive ? (
              <span className="text-brown/45">(입력 없음)</span>
            ) : !canViewSensitive ? (
              <span className="text-brown/65">입력됨 · 열람 권한이 없습니다 (민감정보 열람 권한 필요)</span>
            ) : health === null ? (
              <button type="button" className="btn btn-sm" onClick={revealHealth}>민감정보 열람 (감사 로그 기록)</button>
            ) : (
              <span className="block border border-burgundy/50 bg-paper p-3">
                {health || "(내용 없음)"}
                {isOwner && <button type="button" className="btn btn-sm mt-3 block" onClick={deleteHealth}>건강 응답 영구 삭제</button>}
              </span>
            )}
          </Row>
          <Row k="동의 내역">
            개인정보 수집·이용 동의 {fmtDateTime(app.consent_privacy_at)} ({app.consent_version || "-"}){app.consent_sensitive ? " · 민감정보 동의" : ""}
          </Row>
        </dl>
      </section>

      <aside className="space-y-10" aria-label="관리">
        <div className="border border-[var(--rule)] bg-paper p-5">
          <h2 className="font-title text-2xl">신청 상태</h2>
          <p className="mt-2"><span className={`badge ${STATUS_TONE[app.status]}`}>{STATUS_LABEL_KO[app.status]}</span></p>
          <label htmlFor="status" className="field-label mt-4">상태 변경</label>
          <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)} disabled={!canWrite}>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL_KO[s]}</option>)}
          </select>
          <button type="button" className="btn btn-sm btn-solid mt-3" disabled={!canWrite || busy || status === app.status} onClick={() => save({ status }, "상태가")}>상태 저장</button>

          <label htmlFor="memo" className="field-label mt-8">내부 메모</label>
          <textarea id="memo" className="input" value={memo} onChange={(e) => setMemo(e.target.value)} disabled={!canWrite} maxLength={5000} />
          <button type="button" className="btn btn-sm mt-3" disabled={!canWrite || busy || memo === app.internal_memo} onClick={() => save({ internal_memo: memo }, "메모가")}>메모 저장</button>

          {msg && <p role="status" className={`mt-4 text-sm ${msg.tone === "ok" ? "text-olive" : "text-burgundy"}`}>{msg.text}</p>}
          {!canWrite && <p className="mt-4 text-sm text-brown/60">조회 전용 계정은 수정할 수 없습니다.</p>}
        </div>

        <div>
          <h2 className="font-title text-2xl">변경 이력</h2>
          <ol className="mt-3 space-y-3 border-l border-[var(--rule)] pl-4 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                <p className="font-semibold">{h.from_status ? `${STATUS_LABEL_KO[h.from_status as ApplicationStatus]} → ` : ""}{STATUS_LABEL_KO[h.to_status as ApplicationStatus]}</p>
                <p className="text-brown/60">{fmtDateTime(h.created_at)}{h.changed_by_email ? ` · ${h.changed_by_email}` : h.from_status ? "" : " · 접수"}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
