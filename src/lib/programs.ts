import "server-only";
import type { Lang } from "@/lib/i18n";
import { getUI } from "@/lib/i18n";
import { supabaseConfigured } from "@/lib/env";
import { anonClient } from "@/lib/supabase/clients";

export type ProgramRow = {
  id: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  recruit_status: "open" | "closed" | "upcoming";
  apply_deadline: string | null;
  cover_image: string | null;
  default_capacity: number | null;
  fee_amount: number | null;
  name_ko: string; name_en: string;
  format_ko: string; format_en: string;
  summary_ko: string; summary_en: string;
  description_ko: string; description_en: string;
  composition_ko: string; composition_en: string;
  target_ko: string; target_en: string;
  duration_ko: string; duration_en: string;
  location_ko: string; location_en: string;
  fee_note_ko: string; fee_note_en: string;
};

export type SessionRow = {
  id: string;
  program_id: string;
  title_ko: string; title_en: string;
  starts_at: string;
  ends_at: string | null;
  time_note_ko: string; time_note_en: string;
  location_ko: string; location_en: string;
  fee_amount: number | null;
  fee_note_ko: string; fee_note_en: string;
  capacity: number | null;
  apply_deadline: string | null;
  status: "open" | "closed";
  is_published: boolean;
};

export type SessionState = "open" | "full" | "closed";
export type RecruitState = "open" | "closed" | "upcoming";

export type SessionView = {
  id: string;
  title: string;
  dateText: string;
  timeText: string;
  location: string;
  fee: string;
  capacity: number | null;
  confirmed: number;
  remaining: number | null;
  deadlineText: string;
  state: SessionState;
};

export type ProgramView = {
  id: string;
  slug: string;
  name: string;
  format: string;
  summary: string;
  description: string;
  composition: string;
  target: string;
  duration: string;
  location: string;
  fee: string;
  image: string;
  state: RecruitState;
  deadlineText: string;
  sessions: SessionView[];
};

export const FALLBACK_COVERS: Record<string, string> = {
  "embodied-listening": "/images/performances/perf-19.jpg",
  "ten-week-program": "/images/performances/perf-21.jpg",
  "music-therapy": "/images/research/03.jpg",
  "sound-meditation": "/images/performances/perf-26.jpg",
  "workshops-collaborations": "/images/workshops/svaram-04.jpg",
};
export const DEFAULT_COVER = "/images/performances/perf-13.jpg";

const row = (slug: string, sort_order: number, ko: [string, string, string], en: [string, string, string], extra: Partial<ProgramRow> = {}): ProgramRow => ({
  id: slug, slug, sort_order, is_published: true, recruit_status: "open", apply_deadline: null, cover_image: null, default_capacity: null, fee_amount: null,
  name_ko: ko[0], name_en: en[0], format_ko: ko[1], format_en: en[1], summary_ko: ko[2], summary_en: en[2],
  description_ko: "", description_en: "", composition_ko: "", composition_en: "", target_ko: "", target_en: "",
  duration_ko: "", duration_en: "", location_ko: "", location_en: "", fee_note_ko: "", fee_note_en: "", ...extra,
});

/** The original five programs. Used when no database is configured (static preview / first local run). */
export const FALLBACK_PROGRAMS: ProgramRow[] = [
  row("embodied-listening", 1,
    ["Didgeridoo Embodied Listening", "원데이 체험", "디저리두의 소리와 진동을 듣고 느끼며 자신의 몸과 감각을 알아차리는 경험"],
    ["Didgeridoo Embodied Listening", "One-Day Experience", "An experience of listening to and feeling the sound and vibration of the didgeridoo, while noticing your body and senses"],
    { composition_ko: "호흡 → 소리 → 진동 → 알아차림 → 체화된 경청", composition_en: "Breath → Sound → Vibration → Awareness → Embodied Listening" }),
  row("ten-week-program", 2,
    ["10-Week Didgeridoo Program", "10주 과정 (개인의 특성에 따라 유연하게 조정 가능)", "호흡과 신체 인식에서 시작해 소리, 진동, 즉흥연주로 확장하는 단계적 프로그램"],
    ["10-Week Didgeridoo Program", "10 Weeks (flexibly adjusted to individual needs)", "A step-by-step program that begins with breath and body awareness and expands into sound, vibration, and improvisation"],
    { composition_ko: "호흡·신체 인식 → 소리 → 진동 → 즉흥연주", composition_en: "Breath & body awareness → Sound → Vibration → Improvisation" }),
  row("music-therapy", 3,
    ["Music Therapy", "임상 / 케어 환경", "병원, 요양시설 등에서 개인의 상태와 필요에 맞추어 음악치료적 접근으로 진행"],
    ["Music Therapy", "Clinical / Care Settings", "Conducted as a music therapy approach tailored to each person's condition and needs in hospitals, care facilities, and similar settings"],
    { location_ko: "병원, 요양시설 등", location_en: "Hospitals, care facilities, and similar settings" }),
  row("sound-meditation", 4,
    ["Sound Meditation with Didgeridoo", "세션 / 리트릿", "디저리두의 지속적인 소리와 진동을 통해 경청과 호흡, 신체 감각에 주의를 기울이는 시간"],
    ["Sound Meditation with Didgeridoo", "Session / Retreat", "Time spent attending to listening, breath, and bodily sensation through the didgeridoo's continuous sound and vibration"]),
  row("workshops-collaborations", 5,
    ["Workshops & Collaborations", "워크숍 / 협업", "기관, 기업, 커뮤니티 등과 협력하여 대상과 목적에 맞는 체험형 프로그램 구성"],
    ["Workshops & Collaborations", "Workshop / Collaboration", "Experiential programs designed in collaboration with organizations, companies, and communities to fit the audience and purpose"],
    { target_ko: "기관, 기업, 커뮤니티 등", target_en: "Organizations, companies, and communities" }),
];

const TZ = "Asia/Seoul";

export function formatDate(lang: Lang, iso: string, withTime = false): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: TZ,
    year: "numeric",
    month: lang === "ko" ? "long" : "short",
    day: "numeric",
    weekday: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  };
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-GB", opts).format(d);
}

function formatTimeRange(lang: Lang, start: string, end: string | null): string {
  const f = (iso: string) =>
    new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(
      new Date(iso),
    );
  return end ? `${f(start)} – ${f(end)}` : f(start);
}

const pick = (row: Record<string, unknown>, base: string, lang: Lang): string => {
  const primary = String(row[`${base}_${lang}`] ?? "").trim();
  if (primary) return primary;
  return String(row[`${base}_${lang === "ko" ? "en" : "ko"}`] ?? "").trim();
};

export function sessionState(s: SessionRow, confirmed: number, capacity: number | null, now = new Date()): SessionState {
  const over = new Date(s.ends_at ?? s.starts_at) < now;
  const deadline = s.apply_deadline ? new Date(s.apply_deadline) < now : false;
  if (s.status === "closed" || over || deadline) return "closed";
  if (capacity !== null && confirmed >= capacity) return "full";
  return "open";
}

/** Recruitment state shown on the public site, including automatic closing. */
export function programState(p: ProgramRow, sessions: { state: SessionState }[], now = new Date()): RecruitState {
  if (p.recruit_status !== "open") return p.recruit_status;
  if (p.apply_deadline && new Date(p.apply_deadline) < now) return "closed";
  if (sessions.length > 0 && sessions.every((s) => s.state === "closed")) return "closed";
  return "open";
}

function feeText(lang: Lang, amount: number | null, note: string): string {
  const ui = getUI(lang).program;
  const parts: string[] = [];
  if (amount === 0) parts.push(ui.free);
  else if (amount !== null) parts.push(ui.won(amount));
  if (note) parts.push(note);
  return parts.join(" · ");
}

export function toProgramView(
  lang: Lang,
  p: ProgramRow,
  sessions: SessionRow[],
  seats: Map<string, { capacity: number | null; confirmed: number }>,
  now = new Date(),
): ProgramView {
  const ordered = [...sessions].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const views: SessionView[] = ordered
    .filter((s) => new Date(s.ends_at ?? s.starts_at) >= now)
    .map((s) => {
      const seat = seats.get(s.id) ?? { capacity: s.capacity ?? p.default_capacity, confirmed: 0 };
      const note = pick(s, "time_note", lang);
      const sessionFeeAmount = s.fee_amount ?? p.fee_amount;
      const sessionFeeNote = pick(s, "fee_note", lang) || pick(p, "fee_note", lang);
      return {
        id: s.id,
        title: pick(s, "title", lang),
        dateText: formatDate(lang, s.starts_at),
        timeText: note || formatTimeRange(lang, s.starts_at, s.ends_at),
        location: pick(s, "location", lang) || pick(p, "location", lang),
        fee: feeText(lang, sessionFeeAmount, sessionFeeNote),
        capacity: seat.capacity,
        confirmed: seat.confirmed,
        remaining: seat.capacity === null ? null : Math.max(0, seat.capacity - seat.confirmed),
        deadlineText: s.apply_deadline ? formatDate(lang, s.apply_deadline, true) : "",
        state: sessionState(s, seat.confirmed, seat.capacity, now),
      };
    });
  const allClosedBecauseLapsed = ordered.length > 0 && views.length === 0;
  const stateInput = allClosedBecauseLapsed ? [{ state: "closed" as SessionState }] : views;
  return {
    id: p.id,
    slug: p.slug,
    name: pick(p, "name", lang),
    format: pick(p, "format", lang),
    summary: pick(p, "summary", lang),
    description: pick(p, "description", lang),
    composition: pick(p, "composition", lang),
    target: pick(p, "target", lang),
    duration: pick(p, "duration", lang),
    location: pick(p, "location", lang),
    fee: feeText(lang, p.fee_amount, pick(p, "fee_note", lang)),
    image: p.cover_image || FALLBACK_COVERS[p.slug] || DEFAULT_COVER,
    state: programState(p, stateInput, now),
    deadlineText: p.apply_deadline ? formatDate(lang, p.apply_deadline, true) : "",
    sessions: views,
  };
}

/** All published programs with upcoming sessions and live seat counts. */
export async function getPrograms(lang: Lang): Promise<ProgramView[]> {
  if (!supabaseConfigured()) return FALLBACK_PROGRAMS.map((p) => toProgramView(lang, p, [], new Map()));
  try {
    const db = anonClient();
    const [programs, sessions, seatRows] = await Promise.all([
      db.from("programs").select("*").order("sort_order"),
      db.from("program_sessions").select("*").order("starts_at"),
      db.from("session_availability").select("session_id, capacity, confirmed_count"),
    ]);
    if (programs.error) throw programs.error;
    const seats = new Map<string, { capacity: number | null; confirmed: number }>();
    for (const r of seatRows.data ?? []) seats.set(r.session_id, { capacity: r.capacity, confirmed: r.confirmed_count });
    const bySession = new Map<string, SessionRow[]>();
    for (const s of (sessions.data ?? []) as SessionRow[]) {
      const list = bySession.get(s.program_id) ?? [];
      list.push(s);
      bySession.set(s.program_id, list);
    }
    return (programs.data as ProgramRow[]).map((p) => toProgramView(lang, p, bySession.get(p.id) ?? [], seats));
  } catch (err) {
    console.error("getPrograms failed", err);
    return [];
  }
}

export async function getProgram(lang: Lang, slug: string): Promise<ProgramView | null> {
  return (await getPrograms(lang)).find((p) => p.slug === slug) ?? null;
}
