import { fail, json } from "@/lib/api";
import { withAdmin } from "@/lib/admin";
import { APPLICATION_STATUSES } from "@/lib/application";

type Slim = { status: string; program_id: string; session_id: string | null };

export const GET = withAdmin({}, async (_req, ctx) => {
  const apps: Slim[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await ctx.db
      .from("applications")
      .select("status, program_id, session_id")
      .range(from, from + 999);
    if (error) return fail(500, "query_failed");
    apps.push(...(data as Slim[]));
    if (data.length < 1000) break;
  }

  const [programs, sessions] = await Promise.all([
    ctx.db.from("programs").select("id, name_ko, slug, sort_order, recruit_status, apply_deadline").order("sort_order"),
    ctx.db
      .from("program_sessions")
      .select("id, program_id, title_ko, starts_at, capacity, status, programs(default_capacity)")
      .order("starts_at"),
  ]);

  const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  const byProgram = new Map<string, number>();
  const confirmedBySession = new Map<string, number>();
  const applicantsBySession = new Map<string, number>();
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    byProgram.set(a.program_id, (byProgram.get(a.program_id) ?? 0) + 1);
    if (a.session_id) {
      applicantsBySession.set(a.session_id, (applicantsBySession.get(a.session_id) ?? 0) + 1);
      if (a.status === "confirmed") confirmedBySession.set(a.session_id, (confirmedBySession.get(a.session_id) ?? 0) + 1);
    }
  }

  const programRows = (programs.data ?? []).map((p) => ({ ...p, applicants: byProgram.get(p.id) ?? 0 }));
  const sessionRows = (sessions.data ?? []).map((s) => {
    const program = Array.isArray(s.programs) ? s.programs[0] : s.programs;
    const capacity: number | null = s.capacity ?? program?.default_capacity ?? null;
    const confirmed = confirmedBySession.get(s.id) ?? 0;
    return {
      id: s.id,
      program_id: s.program_id,
      title_ko: s.title_ko,
      starts_at: s.starts_at,
      status: s.status,
      capacity,
      confirmed,
      applicants: applicantsBySession.get(s.id) ?? 0,
      remaining: capacity === null ? null : capacity - confirmed,
    };
  });

  return json({ ok: true, total: apps.length, byStatus, programs: programRows, sessions: sessionRows });
});
