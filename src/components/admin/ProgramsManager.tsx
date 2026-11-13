"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errorText, fmtDateTime, isoToLocalInput, localInputToIso } from "@/components/admin/api";
import { ImageField } from "@/components/admin/ImageField";

type Program = {
  id: string; slug: string; sort_order: number; is_published: boolean; recruit_status: "open" | "closed" | "upcoming";
  apply_deadline: string | null; cover_image: string | null; default_capacity: number | null; fee_amount: number | null;
} & Record<string, string | number | boolean | null>;
type Session = {
  id: string; program_id: string; starts_at: string; ends_at: string | null; fee_amount: number | null; capacity: number | null;
  apply_deadline: string | null; status: "open" | "closed"; is_published: boolean;
} & Record<string, string | number | boolean | null>;

const PAIRS: [string, string, boolean?][] = [
  ["name", "프로그램 이름"],
  ["format", "진행 형식"],
  ["summary", "한 줄 소개 (목록·카드에 표시)", true],
  ["description", "프로그램 소개 (상세 페이지)", true],
  ["composition", "프로그램 구성", true],
  ["target", "대상"],
  ["duration", "진행 시간"],
  ["location", "장소"],
  ["fee_note", "참가비 안내 문구 (예: 무료, 현장 결제)"],
];

const SESSION_PAIRS: [string, string][] = [
  ["title", "회차 이름 (선택)"],
  ["time_note", "시간 표기 (비우면 시작·종료 시각 자동 표시)"],
  ["location", "장소 (비우면 프로그램 장소)"],
  ["fee_note", "참가비 안내 문구"],
];

const num = (v: string): number | null => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v))));
const blankSession = (): Partial<Session> => ({
  title_ko: "", title_en: "", time_note_ko: "", time_note_en: "", location_ko: "", location_en: "", fee_note_ko: "", fee_note_en: "",
  starts_at: "", ends_at: null, fee_amount: null, capacity: null, apply_deadline: null, status: "open", is_published: true,
});

export function ProgramsManager({ canWrite }: { canWrite: boolean }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Program | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<Session> | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ programs: Program[]; sessions: Session[] }>("/api/admin/programs");
    if (r.ok) { setPrograms(r.data.programs); setSessions(r.data.sessions); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => programs.find((p) => p.id === selectedId) ?? null, [programs, selectedId]);
  useEffect(() => { setDraft(selected ? { ...selected } : null); setEditing(null); }, [selected]);

  const flash = (tone: "ok" | "err", text: string) => setMsg({ tone, text });
  const set = (k: string, v: string | number | boolean | null) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function saveProgram() {
    if (!draft) return;
    setBusy(true); setMsg(null);
    const { id, ...rest } = draft;
    void id;
    const { created_at, updated_at, ...body } = rest as Record<string, unknown>;
    void created_at; void updated_at;
    const r = await api(`/api/admin/programs/${draft.id}`, { method: "PATCH", json: body });
    setBusy(false);
    if (!r.ok) return flash("err", errorText(r.data.error));
    flash("ok", "프로그램이 저장되었습니다.");
    await load();
  }

  async function createProgram() {
    const slug = prompt("새 프로그램의 주소(slug)를 영문 소문자와 하이픈으로 입력하세요. 예: new-program");
    if (!slug) return;
    const blank = Object.fromEntries(PAIRS.flatMap(([k]) => [[`${k}_ko`, ""], [`${k}_en`, ""]]));
    const r = await api<{ program: Program }>("/api/admin/programs", {
      method: "POST",
      json: { slug, sort_order: programs.length + 1, is_published: false, recruit_status: "upcoming", apply_deadline: null, cover_image: null, default_capacity: null, fee_amount: null, ...blank, name_ko: "새 프로그램" },
    });
    if (!r.ok) return flash("err", errorText(r.data.error));
    await load();
    setSelectedId(r.data.program.id);
    flash("ok", "새 프로그램을 만들었습니다 (비공개 상태). 내용을 입력한 뒤 공개해 주세요.");
  }

  async function deleteProgram() {
    if (!draft || !confirm(`"${draft.name_ko}" 프로그램과 모든 일정을 삭제합니다. 계속할까요?`)) return;
    const r = await api(`/api/admin/programs/${draft.id}`, { method: "DELETE" });
    if (!r.ok) return flash("err", errorText(r.data.error));
    setSelectedId(null);
    await load();
    flash("ok", "삭제했습니다.");
  }

  async function saveSession() {
    if (!editing || !selected) return;
    if (!editing.starts_at) return flash("err", "시작 일시를 입력해 주세요.");
    setBusy(true); setMsg(null);
    const { id, program_id, created_at, updated_at, ...body } = editing as Record<string, unknown>;
    void program_id; void created_at; void updated_at;
    const r = id
      ? await api(`/api/admin/sessions/${id}`, { method: "PATCH", json: body })
      : await api(`/api/admin/programs/${selected.id}/sessions`, { method: "POST", json: body });
    setBusy(false);
    if (!r.ok) return flash("err", errorText(r.data.error));
    setEditing(null);
    await load();
    flash("ok", "일정이 저장되었습니다.");
  }

  async function deleteSession(s: Session) {
    if (!confirm("이 회차를 삭제할까요? 이 회차로 접수된 신청은 유지되며 '일정 미정'으로 표시됩니다.")) return;
    const r = await api(`/api/admin/sessions/${s.id}`, { method: "DELETE" });
    if (!r.ok) return flash("err", errorText(r.data.error));
    await load();
  }

  const programSessions = sessions.filter((s) => s.program_id === selectedId);
  const dis = !canWrite;

  const text = (key: string, label: string, area?: boolean) => (
    <div key={key} className="grid gap-3 md:grid-cols-2">
      {(["ko", "en"] as const).map((l) => {
        const id = `p-${key}-${l}`;
        const value = String(draft?.[`${key}_${l}`] ?? "");
        return (
          <div key={l}>
            <label htmlFor={id} className="field-label">{label} <span className="font-normal text-brown/50">({l === "ko" ? "한국어" : "English"})</span></label>
            {area ? <textarea id={id} className="input" disabled={dis} value={value} onChange={(e) => set(`${key}_${l}`, e.target.value)} /> : <input id={id} className="input" disabled={dis} value={value} onChange={(e) => set(`${key}_${l}`, e.target.value)} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="프로그램 목록">
        <ul className="space-y-1">
          {programs.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { setSelectedId(p.id); setMsg(null); }} aria-current={p.id === selectedId} className={`block w-full px-3 py-2 text-left text-[0.95rem] ${p.id === selectedId ? "bg-brown text-paper" : "bg-paper hover:bg-bronze/15"}`}>
                {p.name_ko || p.slug}
                <span className="block text-xs opacity-70">{p.is_published ? "공개" : "비공개"} · {{ open: "모집 중", closed: "마감", upcoming: "모집 예정" }[p.recruit_status]}</span>
              </button>
            </li>
          ))}
        </ul>
        {canWrite && <button type="button" className="btn btn-sm mt-4 w-full" onClick={createProgram}>+ 프로그램 추가</button>}
      </nav>

      <div className="min-w-0">
        {msg && <p role="status" className={`mb-4 text-sm ${msg.tone === "ok" ? "text-olive" : "text-burgundy"}`}>{msg.text}</p>}
        {!draft ? <p className="text-brown/60">왼쪽에서 프로그램을 선택하세요.</p> : (
          <div className="space-y-12">
            <form onSubmit={(e) => { e.preventDefault(); saveProgram(); }} className="space-y-6" aria-label="프로그램 정보">
              <h2 className="font-title text-3xl">프로그램 정보</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="p-status" className="field-label">모집 상태</label>
                  <select id="p-status" className="input" disabled={dis} value={draft.recruit_status} onChange={(e) => set("recruit_status", e.target.value)}>
                    <option value="open">모집 중</option><option value="upcoming">모집 예정</option><option value="closed">모집 마감</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="p-deadline" className="field-label">신청 마감일 (지나면 자동 마감)</label>
                  <input id="p-deadline" type="datetime-local" className="input" disabled={dis} value={isoToLocalInput(draft.apply_deadline)} onChange={(e) => set("apply_deadline", localInputToIso(e.target.value))} />
                </div>
                <div>
                  <label htmlFor="p-cap" className="field-label">기본 모집 인원</label>
                  <input id="p-cap" type="number" min={0} className="input" disabled={dis} value={draft.default_capacity ?? ""} onChange={(e) => set("default_capacity", num(e.target.value))} placeholder="제한 없음" />
                </div>
                <div>
                  <label htmlFor="p-fee" className="field-label">참가비 (원, 0 = 무료)</label>
                  <input id="p-fee" type="number" min={0} className="input" disabled={dis} value={draft.fee_amount ?? ""} onChange={(e) => set("fee_amount", num(e.target.value))} placeholder="미정" />
                </div>
                <div>
                  <label htmlFor="p-slug" className="field-label">주소 (slug)</label>
                  <input id="p-slug" className="input" disabled={dis} value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="p-sort" className="field-label">표시 순서</label>
                  <input id="p-sort" type="number" min={0} className="input" disabled={dis} value={draft.sort_order} onChange={(e) => set("sort_order", num(e.target.value) ?? 0)} />
                </div>
                <label className="choice self-end"><input type="checkbox" disabled={dis} checked={draft.is_published} onChange={(e) => set("is_published", e.target.checked)} /><span>사이트에 공개</span></label>
              </div>
              <div>
                <span className="field-label">대표 이미지</span>
                <ImageField value={draft.cover_image} onChange={(url) => set("cover_image", url)} />
                <p className="field-hint mt-1">비워 두면 기본 사진이 표시됩니다.</p>
              </div>
              {PAIRS.map(([k, label, area]) => text(k, label, area))}
              {canWrite && (
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="btn btn-solid" disabled={busy}>저장</button>
                  <button type="button" className="btn" onClick={deleteProgram}>삭제</button>
                </div>
              )}
            </form>

            <section aria-labelledby="sessions-h" className="border-t border-[var(--rule-strong)] pt-8">
              <div className="flex items-center justify-between gap-4">
                <h2 id="sessions-h" className="font-title text-3xl">일정 · 정원</h2>
                {canWrite && <button type="button" className="btn btn-sm" onClick={() => setEditing(blankSession())}>+ 일정 추가</button>}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="adm-table">
                  <thead><tr><th>일시</th><th>정원</th><th>참가비</th><th>마감일</th><th>상태</th><th /></tr></thead>
                  <tbody>
                    {programSessions.length === 0 && <tr><td colSpan={6} className="text-brown/60">등록된 일정이 없습니다. 일정이 없으면 &lsquo;일정 미정&rsquo;으로 신청을 받습니다.</td></tr>}
                    {programSessions.map((s) => (
                      <tr key={s.id}>
                        <td>{fmtDateTime(s.starts_at)}{s.ends_at ? ` – ${fmtDateTime(s.ends_at).slice(-5)}` : ""} {s.title_ko}</td>
                        <td>{s.capacity ?? draft.default_capacity ?? "제한 없음"}</td>
                        <td>{s.fee_amount === null ? "프로그램 기본" : s.fee_amount === 0 ? "무료" : `${s.fee_amount.toLocaleString()}원`}</td>
                        <td>{s.apply_deadline ? fmtDateTime(s.apply_deadline) : "—"}</td>
                        <td>{s.status === "open" ? "모집 중" : "마감"}{!s.is_published ? " · 비공개" : ""}</td>
                        <td className="whitespace-nowrap">
                          {canWrite && <><button type="button" className="link-u mr-3" onClick={() => setEditing({ ...s })}>수정</button><button type="button" className="link-u" onClick={() => deleteSession(s)}>삭제</button></>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editing && (
                <form onSubmit={(e) => { e.preventDefault(); saveSession(); }} className="mt-8 space-y-5 border border-[var(--rule)] bg-paper p-5" aria-label="일정 편집">
                  <h3 className="font-title text-2xl">{editing.id ? "일정 수정" : "새 일정"}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label htmlFor="s-start" className="field-label">시작 일시 (KST) *</label>
                      <input id="s-start" type="datetime-local" required className="input" value={isoToLocalInput(editing.starts_at as string)} onChange={(e) => setEditing({ ...editing, starts_at: localInputToIso(e.target.value) ?? "" })} />
                    </div>
                    <div>
                      <label htmlFor="s-end" className="field-label">종료 일시</label>
                      <input id="s-end" type="datetime-local" className="input" value={isoToLocalInput(editing.ends_at as string)} onChange={(e) => setEditing({ ...editing, ends_at: localInputToIso(e.target.value) })} />
                    </div>
                    <div>
                      <label htmlFor="s-deadline" className="field-label">신청 마감일</label>
                      <input id="s-deadline" type="datetime-local" className="input" value={isoToLocalInput(editing.apply_deadline as string)} onChange={(e) => setEditing({ ...editing, apply_deadline: localInputToIso(e.target.value) })} />
                    </div>
                    <div>
                      <label htmlFor="s-cap" className="field-label">모집 인원 (비우면 프로그램 기본값)</label>
                      <input id="s-cap" type="number" min={0} className="input" value={(editing.capacity as number | null) ?? ""} onChange={(e) => setEditing({ ...editing, capacity: num(e.target.value) })} />
                    </div>
                    <div>
                      <label htmlFor="s-fee" className="field-label">참가비 (원, 비우면 프로그램 기본)</label>
                      <input id="s-fee" type="number" min={0} className="input" value={(editing.fee_amount as number | null) ?? ""} onChange={(e) => setEditing({ ...editing, fee_amount: num(e.target.value) })} />
                    </div>
                    <div>
                      <label htmlFor="s-status" className="field-label">모집 상태</label>
                      <select id="s-status" className="input" value={editing.status as string} onChange={(e) => setEditing({ ...editing, status: e.target.value as "open" | "closed" })}>
                        <option value="open">모집 중</option><option value="closed">마감</option>
                      </select>
                    </div>
                  </div>
                  <label className="choice"><input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /><span>사이트에 공개</span></label>
                  {SESSION_PAIRS.map(([k, label]) => (
                    <div key={k} className="grid gap-3 md:grid-cols-2">
                      {(["ko", "en"] as const).map((l) => (
                        <div key={l}>
                          <label htmlFor={`s-${k}-${l}`} className="field-label">{label} <span className="font-normal text-brown/50">({l === "ko" ? "한국어" : "English"})</span></label>
                          <input id={`s-${k}-${l}`} className="input" value={String(editing[`${k}_${l}`] ?? "")} onChange={(e) => setEditing({ ...editing, [`${k}_${l}`]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button type="submit" className="btn btn-solid" disabled={busy}>일정 저장</button>
                    <button type="button" className="btn" onClick={() => setEditing(null)}>취소</button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
