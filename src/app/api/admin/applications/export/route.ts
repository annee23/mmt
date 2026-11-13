import { fail } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { EXPORT_SELECT, fetchAllApplications, filtersFromParams } from "@/lib/admin-applications";
import {
  AGE_LABEL_KO,
  GENDER_LABEL_KO,
  HEARD_LABEL_KO,
  STATUS_LABEL_KO,
  type ApplicationStatus,
} from "@/lib/application";
import { csvResponse, toCsv } from "@/lib/csv";

type Row = {
  id: string;
  application_no: string;
  created_at: string;
  name: string;
  age_group: string;
  gender: string;
  contact: string;
  heard_didgeridoo: string | null;
  reason: string;
  expectations: string;
  status: ApplicationStatus;
  internal_memo: string;
  source: string;
  programs: { name_ko: string } | null;
  program_sessions: { starts_at: string; title_ko: string } | null;
};

const kst = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));

/**
 * Default export never contains health answers. They are added only when explicitly requested
 * (include_health=1) by an admin who holds the sensitive-data permission, and the request is audited.
 */
export const GET = withAdmin({}, async (req, ctx) => {
  const sp = new URL(req.url).searchParams;
  const includeHealth = sp.get("include_health") === "1";
  if (includeHealth && !ctx.profile.can_view_sensitive) return fail(403, "sensitive_forbidden");

  const filters = filtersFromParams(sp);
  const rows = (await fetchAllApplications(ctx.db, filters, EXPORT_SELECT)) as unknown as Row[];

  const health = new Map<string, string>();
  if (includeHealth && rows.length) {
    for (let i = 0; i < rows.length; i += 200) {
      const ids = rows.slice(i, i + 200).map((r) => r.id);
      const { data } = await ctx.db.from("application_sensitive_notes").select("application_id, health_note").in("application_id", ids);
      for (const n of data ?? []) health.set(n.application_id, n.health_note);
    }
  }

  const header = [
    "신청번호", "신청일시", "이름", "연령대", "성별", "연락처", "신청 프로그램", "신청 회차",
    "디저리두 청취 경험", "참여 이유", "경험해보고 싶은 것", "신청 상태", "내부 메모", "접수 경로",
    ...(includeHealth ? ["건강 관련 사항(민감정보)"] : []),
  ];
  const body = rows.map((r) => [
    r.application_no,
    kst(r.created_at),
    r.name,
    AGE_LABEL_KO[r.age_group] ?? r.age_group,
    GENDER_LABEL_KO[r.gender] ?? r.gender,
    r.contact,
    r.programs?.name_ko ?? "",
    r.program_sessions ? `${kst(r.program_sessions.starts_at).slice(0, 16)} ${r.program_sessions.title_ko}`.trim() : "",
    r.heard_didgeridoo ? HEARD_LABEL_KO[r.heard_didgeridoo] : "",
    r.reason,
    r.expectations,
    STATUS_LABEL_KO[r.status] ?? r.status,
    r.internal_memo,
    r.source === "import" ? "CSV 가져오기" : "웹 신청",
    ...(includeHealth ? [health.get(r.id) ?? ""] : []),
  ]);

  await audit(ctx, includeHealth ? "export_applications_with_health" : "export_applications", "applications", null, {
    rows: rows.length,
    filters,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`applications-${stamp}.csv`, toCsv([header, ...body]));
});
