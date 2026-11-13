"use client";

import { useEffect, useState } from "react";
import { api, errorText } from "@/components/admin/api";
import { APPLICATION_STATUSES, STATUS_LABEL_KO } from "@/lib/application";

type Program = { id: string; name_ko: string };
type Session = { id: string; program_id: string; starts_at: string; title_ko: string };
type Result = {
  dry_run: boolean; total: number; importable: number; duplicates: number; imported?: number;
  invalid: { line: number; reason: string }[]; health_columns_ignored: boolean;
  preview?: { line: number; name: string; contact: string; age_group: string; gender: string; created_at: string | null }[];
};

export function ImportView({ canViewSensitive }: { canViewSensitive: boolean }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programId, setProgramId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState("new");
  const [includeHealth, setIncludeHealth] = useState(false);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ programs: Program[]; sessions: Session[] }>("/api/admin/programs").then((r) => { if (r.ok) { setPrograms(r.data.programs); setSessions(r.data.sessions); } });
  }, []);

  async function run(dry: boolean) {
    if (!programId || !csv) return setError("프로그램을 선택하고 CSV 파일을 올려 주세요.");
    if (!dry && !confirm(`${result?.importable ?? 0}건을 신청자 목록에 가져옵니다. 계속할까요?`)) return;
    setBusy(true); setError("");
    const r = await api<Result>("/api/admin/import", { method: "POST", json: { csv, program_id: programId, session_id: sessionId || null, status, include_health: includeHealth, dry_run: dry } });
    setBusy(false);
    if (!r.ok) return setError(r.data.error === "missing_columns" ? errorText("missing_columns") : errorText(r.data.error));
    setResult(r.data as Result);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <ol className="list-decimal space-y-1 pl-5 text-[0.95rem] text-brown/75">
        <li>Google Forms 응답 시트에서 <strong>파일 → 다운로드 → 쉼표로 구분된 값(.csv)</strong>으로 내보냅니다.</li>
        <li>가져올 프로그램(필요하면 회차)을 고르고 파일을 올린 뒤 &lsquo;미리 확인&rsquo;을 누릅니다.</li>
        <li>문제가 없으면 &lsquo;가져오기 실행&rsquo;을 누릅니다. 같은 파일을 다시 올려도 중복 등록되지 않습니다.</li>
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="i-program" className="field-label">가져올 프로그램 *</label>
          <select id="i-program" className="input" value={programId} onChange={(e) => { setProgramId(e.target.value); setSessionId(""); setResult(null); }}>
            <option value="">선택</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name_ko}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="i-session" className="field-label">회차 (선택)</label>
          <select id="i-session" className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">일정 미정</option>
            {sessions.filter((s) => s.program_id === programId).map((s) => <option key={s.id} value={s.id}>{new Date(s.starts_at).toLocaleDateString("ko-KR")} {s.title_ko}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="i-status" className="field-label">가져온 신청의 상태</label>
          <select id="i-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL_KO[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="i-file" className="field-label">CSV 파일 *</label>
          <input id="i-file" type="file" accept=".csv,text/csv" className="input" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setCsv(await f.text()); setFileName(f.name); setResult(null); } }} />
        </div>
      </div>

      {canViewSensitive ? (
        <label className="choice"><input type="checkbox" checked={includeHealth} onChange={(e) => setIncludeHealth(e.target.checked)} /><span>건강 관련 응답도 가져오기 (민감정보 테이블에 분리 저장됩니다. 체크하지 않으면 해당 열은 저장하지 않고 버립니다.)</span></label>
      ) : (
        <p className="text-sm text-brown/65">건강 관련 열은 민감정보 권한이 없어 저장하지 않고 제외됩니다.</p>
      )}

      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="flex gap-3">
        <button type="button" className="btn" disabled={busy || !csv} onClick={() => run(true)}>미리 확인{fileName ? ` (${fileName})` : ""}</button>
        <button type="button" className="btn btn-solid" disabled={busy || !result || !result.dry_run || result.importable === 0} onClick={() => run(false)}>가져오기 실행</button>
      </div>

      {result && (
        <section aria-live="polite" className="border border-[var(--rule)] bg-paper p-5">
          <h2 className="font-title text-2xl">{result.dry_run ? "미리 확인 결과" : "가져오기 완료"}</h2>
          <ul className="mt-3 space-y-1 text-[0.95rem]">
            <li>전체 행: {result.total}</li>
            <li>{result.dry_run ? "가져올 수 있는 행" : "가져온 신청"}: <strong>{result.dry_run ? result.importable : result.imported}</strong></li>
            <li>이미 등록되어 건너뛴 행: {result.duplicates}</li>
            <li>형식 오류: {result.invalid.length}</li>
            {result.health_columns_ignored && <li className="text-brown/65">건강 관련 응답은 가져오지 않았습니다.</li>}
          </ul>
          {result.invalid.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-burgundy">{result.invalid.slice(0, 20).map((i) => <li key={i.line}>{i.line}행: {i.reason}</li>)}</ul>}
          {result.preview && result.preview.length > 0 && (
            <div className="mt-4 overflow-x-auto"><table className="adm-table"><thead><tr><th>행</th><th>이름</th><th>연락처</th><th>접수 시각</th></tr></thead><tbody>
              {result.preview.map((p) => <tr key={p.line}><td>{p.line}</td><td>{p.name || "(미입력)"}</td><td>{p.contact}</td><td>{p.created_at ? new Date(p.created_at).toLocaleString("ko-KR") : "—"}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      )}
    </div>
  );
}
