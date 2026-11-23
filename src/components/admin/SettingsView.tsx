"use client";

import { useEffect, useState } from "react";
import { api, errorText, fmtDateTime } from "@/components/admin/api";

type Privacy = Record<string, string | boolean>;
type Audit = { id: number; actor_email: string | null; action: string; entity: string | null; entity_id: string | null; created_at: string };

const PAIRS: [string, string][] = [
  ["purpose", "수집·이용 목적"],
  ["items", "수집 항목"],
  ["retention", "보유·이용 기간"],
  ["sensitive_purpose", "민감정보(건강) 수집·이용 목적"],
  ["sensitive_retention", "민감정보 보유·이용 기간"],
  ["refusal", "동의 거부 권리 및 불이익 안내"],
];

export function SettingsView({ canWrite, isOwner }: { canWrite: boolean; isOwner: boolean }) {
  const [nameRequired, setNameRequired] = useState(false);
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<Audit[] | null>(null);

  useEffect(() => {
    api<{ form: { name_required: boolean }; privacy: Privacy }>("/api/admin/settings").then((r) => {
      if (r.ok) { setNameRequired(r.data.form.name_required); setPrivacy(r.data.privacy); }
    });
    if (isOwner) api<{ rows: Audit[] }>("/api/admin/audit?size=50").then((r) => r.ok && setLogs(r.data.rows));
  }, [isOwner]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!privacy) return;
    setBusy(true); setMsg(null);
    const { reviewed, ...rest } = privacy;
    void reviewed;
    const r = await api("/api/admin/settings", { method: "PUT", json: { name_required: nameRequired, privacy: rest } });
    setBusy(false);
    if (!r.ok) return setMsg({ tone: "err", text: errorText(r.data.error) });
    setPrivacy({ ...privacy, reviewed: true });
    setMsg({ tone: "ok", text: "저장되었습니다. 신청 페이지에 바로 반영됩니다." });
  }

  if (!privacy) return <p className="text-brown/60">불러오는 중…</p>;
  const set = (k: string, v: string) => setPrivacy({ ...privacy, [k]: v });
  const field = (k: string, label: string, area?: boolean) => (
    <div key={k}>
      <label htmlFor={`pv-${k}`} className="field-label">{label}</label>
      {area ? <textarea id={`pv-${k}`} className="input" disabled={!canWrite} value={String(privacy[k] ?? "")} onChange={(e) => set(k, e.target.value)} /> : <input id={`pv-${k}`} className="input" disabled={!canWrite} value={String(privacy[k] ?? "")} onChange={(e) => set(k, e.target.value)} />}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-14">
      <form onSubmit={save} className="space-y-8">
        {!privacy.reviewed && (
          <p role="note" className="border border-burgundy p-4 text-sm text-burgundy">
            아래 개인정보 문구는 <strong>초기 예시</strong>입니다. 실제 운영 정보(개인정보처리자, 보유 기간 등)를 확인·수정한 뒤 저장하세요. 저장하면 이 안내가 사라집니다.
          </p>
        )}
        <section className="space-y-4">
          <h2 className="font-title text-3xl">신청서 설정</h2>
          <label className="choice"><input type="checkbox" disabled={!canWrite} checked={nameRequired} onChange={(e) => setNameRequired(e.target.checked)} /><span>이름을 필수 항목으로 설정 (연령대·성별·연락처는 항상 필수)</span></label>
        </section>

        <section className="space-y-5">
          <h2 className="font-title text-3xl">개인정보 수집·이용 동의 문구</h2>
          <p className="text-sm text-brown/65">신청 단계의 동의 화면에 그대로 표시됩니다. 신청마다 동의 문구의 버전이 함께 기록됩니다.</p>
          <div className="grid gap-4 sm:grid-cols-2">{field("controller", "개인정보처리자 (운영자 이름/상호)")}{field("contact_email", "개인정보 문의 이메일")}</div>
          {PAIRS.map(([k, label]) => (
            <div key={k} className="grid gap-4 md:grid-cols-2">
              <div>{field(`${k}_ko`, `${label} (한국어)`, true)}</div>
              <div>{field(`${k}_en`, `${label} (English)`, true)}</div>
            </div>
          ))}
        </section>
        {msg && <p role="status" className={`text-sm ${msg.tone === "ok" ? "text-brown" : "text-burgundy"}`}>{msg.text}</p>}
        {canWrite && <button type="submit" className="btn btn-solid" disabled={busy}>{busy ? "저장 중…" : "저장"}</button>}
      </form>

      {isOwner && (
        <section aria-labelledby="audit-h">
          <h2 id="audit-h" className="font-title text-3xl">감사 로그 (최근 50건)</h2>
          <p className="mt-1 text-sm text-brown/65">민감정보 열람, 내보내기, 상태 변경 등 중요한 작업이 기록됩니다. 소유자만 볼 수 있습니다.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="adm-table">
              <thead><tr><th>시각</th><th>관리자</th><th>작업</th><th>대상</th></tr></thead>
              <tbody>{(logs ?? []).map((l) => <tr key={l.id}><td className="whitespace-nowrap">{fmtDateTime(l.created_at)}</td><td>{l.actor_email}</td><td>{l.action}</td><td className="break-all">{l.entity}{l.entity_id ? ` / ${l.entity_id}` : ""}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
