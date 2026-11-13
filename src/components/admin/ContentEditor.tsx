"use client";

import { useEffect, useState } from "react";
import { api, errorText } from "@/components/admin/api";
import { ImageField } from "@/components/admin/ImageField";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

const SECTIONS: [string, string][] = [
  ["hero", "홈 · 소개(이야기)"],
  ["thesis", "홈 · 논문"],
  ["recommendation", "홈 · 추천사"],
  ["advisoryBoard", "홈 · 자문위원"],
  ["videos", "홈 · 영상"],
  ["culturalRespect", "홈 · 감사 문구"],
  ["contact", "연락처"],
  ["program", "프로그램 페이지 (접근 방식 · 후기)"],
  ["research", "연구/출판"],
  ["workshops", "워크숍"],
  ["performances", "공연"],
  ["nav", "공통 · 메뉴 이름"],
  ["footer", "공통 · 푸터"],
];

const LABELS: Record<string, string> = {
  eyebrow: "작은 라벨", heading: "제목", title: "제목", description: "설명", summary: "요약", name: "이름", role: "직함",
  bio: "소개글 (문단별)", philosophy: "철학 문구", photo: "사진", image: "사진", images: "사진", items: "항목", intro: "소개글",
  link: "링크", label: "문구", href: "링크 주소", alt: "사진 설명 (화면에 보이지 않음)", cta: "버튼 문구",
  paragraphs: "본문 (영문)", paragraphsKo: "본문 (한국어 번역)", nameKo: "이름 (한국어)", titleKo: "직함 (한국어)",
  affiliationKo: "소속 (한국어)", affiliation: "소속", title_: "직함", letters: "추천사 목록", members: "자문위원 목록",
  linesEn: "영문 정보 (첫 줄은 이름)", linesKo: "한국어 정보 (첫 줄은 이름)", email: "이메일", instagramHandle: "인스타그램 아이디",
  instagramUrl: "인스타그램 링크", copyright: "저작권 문구", approach: "프로그램 접근 방식", musicTherapyTitle: "음악치료 소제목",
  musicTherapyBody: "음악치료 본문", humanisticTitle: "인본주의 소제목", humanisticBody: "인본주의 본문", highlight: "대표 프로그램 다이어그램",
  applyLabel: "신청 버튼 문구", testimonials: "참가자 경험", quotes: "후기 문장", en: "영어", ko: "한국어", location: "지역", number: "번호",
  reversed: "한국어를 먼저 보여주기", writing: "Medium 글 영역", titleEn: "제목 (영문)", bodyEn: "본문 (영문)", bodyKo: "본문 (한국어)",
  home: "소개 메뉴", program: "프로그램 메뉴", research: "연구/출판 메뉴", workshops: "워크숍 메뉴", performances: "공연 메뉴",
  courseButton: "첫 화면 버튼 (참고용)", subscribeButton: "구독 영역 문구", placeholder: "입력칸 안내", submit: "버튼 문구",
  sending: "처리 중 문구", success: "완료 문구", already: "이미 구독 문구", invalid: "형식 오류 문구", error: "오류 문구", privacy: "개인정보 안내",
  meta: "상단 표기", dim: "흐리게 표시", toggleLabel: "언어 전환 글자", captionBelow: "설명을 사진 아래에 배치", videos: "영상 목록",
  lang: "언어 코드 (수정 금지)", thesisNote: "논문", linesEn_: "", bodyKo_: "",
};
const IMAGE_KEYS = new Set(["photo", "image"]);
const HINT_BOLD = new Set(["bio", "musicTherapyBody", "humanisticBody"]);

const label = (k: string) => LABELS[k] ?? k;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const blankLike = (v: Json): Json =>
  Array.isArray(v) ? [] : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)])) : typeof v === "number" ? 0 : typeof v === "boolean" ? false : "";

function Node({ k, value, onChange, parentKey }: { k: string; value: Json; onChange: (v: Json) => void; parentKey?: string }) {
  const id = `c-${parentKey ?? ""}-${k}`.replace(/\W+/g, "-");

  if (typeof value === "string") {
    if (IMAGE_KEYS.has(k) || (parentKey === "images" && /^\/|^https?:/.test(value))) {
      return (<div><span className="field-label">{label(k)}</span><ImageField value={value || null} onChange={(u) => onChange(u ?? "")} /></div>);
    }
    const long = value.length > 60 || value.includes("\n");
    return (
      <div>
        <label htmlFor={id} className="field-label">{label(k)}</label>
        {long ? <textarea id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} rows={Math.min(14, Math.max(3, Math.ceil(value.length / 70)))} /> : <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />}
        {HINT_BOLD.has(k) && <p className="field-hint mt-1">굵게 표시하려면 **이렇게** 별표 두 개로 감싸세요.</p>}
      </div>
    );
  }
  if (typeof value === "number") {
    return (<div><label htmlFor={id} className="field-label">{label(k)}</label><input id={id} type="number" className="input" value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>);
  }
  if (typeof value === "boolean") {
    return (<label className="choice"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><span>{label(k)}</span></label>);
  }
  if (value === null) {
    return (<div><label htmlFor={id} className="field-label">{label(k)}</label><input id={id} className="input" value="" placeholder="(없음)" onChange={(e) => onChange(e.target.value)} /></div>);
  }
  if (Array.isArray(value)) {
    const isImages = k === "images";
    const sample = value[value.length - 1];
    const strings = value.every((x) => typeof x === "string");
    const move = (i: number, d: number) => {
      const next = [...value]; const j = i + d;
      if (j < 0 || j >= next.length) return;
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    return (
      <fieldset className="space-y-3 border-l-2 border-[var(--rule)] pl-4">
        <legend className="field-label -ml-4 pl-4">{label(k)} <span className="font-normal text-brown/50">({value.length})</span></legend>
        {value.map((item, i) => (
          <div key={i} className="space-y-3 border border-[var(--rule)] bg-paper p-3">
            <div className="flex items-center justify-between text-xs text-brown/60">
              <span>{i + 1}</span>
              <span className="flex gap-3">
                <button type="button" className="link-u" onClick={() => move(i, -1)} aria-label="위로">↑</button>
                <button type="button" className="link-u" onClick={() => move(i, 1)} aria-label="아래로">↓</button>
                <button type="button" className="link-u text-burgundy" onClick={() => onChange(value.filter((_, j) => j !== i))}>삭제</button>
              </span>
            </div>
            <Node k={isImages ? "image" : `${k}[${i + 1}]`} parentKey={isImages ? "images" : k} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={() => onChange([...value, sample === undefined ? "" : strings ? "" : blankLike(clone(sample))])}>+ 추가</button>
      </fieldset>
    );
  }
  return (
    <fieldset className="space-y-4">
      {k !== "root" && <legend className="field-label">{label(k)}</legend>}
      {Object.entries(value).map(([ck, cv]) => (
        <Node key={ck} k={ck} parentKey={k} value={cv} onChange={(v) => onChange({ ...value, [ck]: v })} />
      ))}
    </fieldset>
  );
}

export function ContentEditor({ canWrite }: { canWrite: boolean }) {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [section, setSection] = useState(SECTIONS[0][0]);
  const [content, setContent] = useState<Obj | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setContent(null); setDirty(false);
    api<{ content: Obj }>(`/api/admin/content?lang=${lang}`).then((r) => (r.ok ? setContent(r.data.content) : setMsg({ tone: "err", text: errorText(r.data.error) })));
  }, [lang]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function save() {
    if (!content) return;
    setBusy(true); setMsg(null);
    const r = await api("/api/admin/content", { method: "PUT", json: { lang, content } });
    setBusy(false);
    if (!r.ok) return setMsg({ tone: "err", text: errorText(r.data.error) });
    setDirty(false);
    setMsg({ tone: "ok", text: "저장되었습니다. 사이트에 바로 반영됩니다." });
  }

  const switchTo = (fn: () => void) => { if (!dirty || confirm("저장하지 않은 변경 사항이 있습니다. 이동할까요?")) { setMsg(null); fn(); } };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3" role="tablist" aria-label="언어">
        {(["ko", "en"] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => switchTo(() => setLang(l))} className={`btn btn-sm ${lang === l ? "btn-solid" : ""}`}>{l === "ko" ? "한국어" : "English"}</button>
        ))}
        <span className="flex-1" />
        {canWrite && <button type="button" className="btn btn-solid" disabled={busy || !dirty} onClick={save}>{busy ? "저장 중…" : dirty ? "저장하기" : "변경 없음"}</button>}
      </div>
      {msg && <p role="status" className={`mt-4 text-sm ${msg.tone === "ok" ? "text-olive" : "text-burgundy"}`}>{msg.text}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="섹션">
          <ul className="space-y-1">
            {SECTIONS.map(([key, name]) => (
              <li key={key}><button type="button" aria-current={section === key} onClick={() => setSection(key)} className={`block w-full px-3 py-2 text-left text-[0.93rem] ${section === key ? "bg-brown text-paper" : "bg-paper hover:bg-bronze/15"}`}>{name}</button></li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 max-w-3xl">
          {!content ? <p className="text-brown/60">불러오는 중…</p> : (
            <fieldset disabled={!canWrite}>
              <Node k="root" value={content[section]} onChange={(v) => { setContent({ ...content, [section]: v }); setDirty(true); }} />
            </fieldset>
          )}
        </div>
      </div>
    </div>
  );
}
