import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APPLICATION_STATUSES } from "@/lib/application";

export type AppFilters = {
  q?: string;
  program?: string;
  session?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
};

export const LIST_SELECT =
  "id, application_no, created_at, name, contact, status, age_group, gender, consent_sensitive, program_id, session_id, programs(name_ko, name_en, slug), program_sessions(starts_at, title_ko)";

export const EXPORT_SELECT =
  "id, application_no, created_at, name, age_group, gender, contact, heard_didgeridoo, reason, expectations, status, internal_memo, source, programs(name_ko), program_sessions(starts_at, title_ko)";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function filtersFromParams(sp: URLSearchParams): AppFilters {
  return {
    q: sp.get("q")?.trim() || undefined,
    program: sp.get("program") || undefined,
    session: sp.get("session") || undefined,
    status: sp.get("status") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    sort: sp.get("sort") === "asc" ? "asc" : "desc",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, f: AppFilters) {
  if (f.q) {
    // keep the value inert inside PostgREST's or() grammar
    const safe = f.q.replace(/[,()*%_\\"']/g, " ").trim();
    if (safe) query = query.or(`name.ilike.*${safe}*,application_no.ilike.*${safe}*,contact.ilike.*${safe}*`);
  }
  if (f.program && UUID.test(f.program)) query = query.eq("program_id", f.program);
  if (f.session && UUID.test(f.session)) query = query.eq("session_id", f.session);
  if (f.status && (APPLICATION_STATUSES as readonly string[]).includes(f.status)) query = query.eq("status", f.status);
  // Dates are interpreted in Korea Standard Time
  if (f.from && DAY.test(f.from)) query = query.gte("created_at", `${f.from}T00:00:00+09:00`);
  if (f.to && DAY.test(f.to)) {
    const next = new Date(`${f.to}T00:00:00+09:00`);
    next.setUTCDate(next.getUTCDate() + 1);
    query = query.lt("created_at", next.toISOString());
  }
  return query.order("created_at", { ascending: f.sort === "asc" });
}

export async function fetchAllApplications(db: SupabaseClient, f: AppFilters, select: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await applyFilters(db.from("applications").select(select), f).range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}
