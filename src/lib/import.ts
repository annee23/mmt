import "server-only";
import { createHash } from "node:crypto";
import Papa from "papaparse";
import { AGE_LABEL_KO, GENDER_LABEL_KO, HEARD_LABEL_KO } from "@/lib/application";

export type ImportedRow = {
  line: number;
  import_key: string;
  created_at: string | null;
  name: string;
  age_group: string;
  gender: string;
  contact: string;
  heard_didgeridoo: string | null;
  reason: string;
  expectations: string;
  health_note: string;
};

export type ImportProblem = { line: number; reason: string };

const COLUMN_MATCHERS: Record<string, RegExp> = {
  timestamp: /타임스탬프|timestamp|제출 시간/i,
  name: /이름|name/i,
  age: /연령|age/i,
  gender: /성별|gender/i,
  contact: /연락처|contact|phone|전화/i,
  heard: /들어본|heard/i,
  reason: /이유|reason/i,
  expectations: /경험해보고|expect|experience/i,
  health: /호흡기|건강|health/i,
};

const invert = (m: Record<string, string>) => new Map(Object.entries(m).map(([code, label]) => [label.replace(/\s/g, ""), code]));
const AGE = invert(AGE_LABEL_KO);
const GENDER = invert(GENDER_LABEL_KO);
const HEARD = invert(HEARD_LABEL_KO);

function mapColumns(headers: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, re] of Object.entries(COLUMN_MATCHERS)) {
    // order matters: 'name' must not steal e.g. "연락처 (이름…)" – pick first unused header that matches
    out[key] = headers.find((h) => re.test(h) && !Object.values(out).includes(h));
  }
  return out;
}

/** Google Forms timestamps look like "2025. 3. 4 오후 3:12:45" (Korean locale) – interpreted as KST. */
export function parseTimestamp(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const m = v.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})[.\s]*(오전|오후|AM|PM)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (m) {
    let h = Number(m[5]);
    const mer = m[4]?.toUpperCase();
    if ((mer === "오후" || mer === "PM") && h < 12) h += 12;
    if ((mer === "오전" || mer === "AM") && h === 12) h = 0;
    const pad = (n: number | string) => String(n).padStart(2, "0");
    const d = new Date(`${m[1]}-${pad(m[2])}-${pad(m[3])}T${pad(h)}:${m[6]}:${pad(m[7] ?? 0)}+09:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseGoogleFormCsv(text: string): { rows: ImportedRow[]; problems: ImportProblem[]; missing: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\ufeff/, ""), { header: true, skipEmptyLines: "greedy" });
  const headers = parsed.meta.fields ?? [];
  const cols = mapColumns(headers);
  const missing = ["age", "gender", "contact"].filter((k) => !cols[k]);
  const rows: ImportedRow[] = [];
  const problems: ImportProblem[] = [];
  if (missing.length) return { rows, problems, missing };

  parsed.data.forEach((rec, i) => {
    const line = i + 2;
    const get = (k: string) => (cols[k] ? String(rec[cols[k]!] ?? "").trim() : "");
    const norm = (s: string) => s.replace(/\s/g, "");
    const age = AGE.get(norm(get("age")));
    const gender = GENDER.get(norm(get("gender")));
    const contact = get("contact");
    if (!age) return problems.push({ line, reason: "연령대를 인식할 수 없음" });
    if (!gender) return problems.push({ line, reason: "성별을 인식할 수 없음" });
    if (!contact) return problems.push({ line, reason: "연락처 없음" });
    const heardRaw = norm(get("heard"));
    const heard = HEARD.get(heardRaw) ?? null;
    const created = parseTimestamp(get("timestamp"));
    rows.push({
      line,
      import_key: createHash("sha256").update(`${get("timestamp")}|${contact}|${get("name")}`).digest("hex").slice(0, 40),
      created_at: created,
      name: get("name"),
      age_group: age,
      gender,
      contact,
      heard_didgeridoo: heard,
      reason: get("reason"),
      expectations: get("expectations"),
      health_note: get("health"),
    });
  });
  return { rows, problems, missing };
}
