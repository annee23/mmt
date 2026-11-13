import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { APPLICATION_STATUSES } from "@/lib/application";

const UUID = z.uuid();

export const GET = withAdmin({}, async (_req, ctx, { id }) => {
  if (!UUID.safeParse(id).success) return fail(404, "not_found");
  const { data: app, error } = await ctx.db
    .from("applications")
    .select(
      "*, programs(id, name_ko, name_en, slug), program_sessions(id, starts_at, ends_at, title_ko, time_note_ko, capacity)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) return fail(500, "query_failed");
  if (!app) return fail(404, "not_found");

  const { data: history } = await ctx.db
    .from("application_status_history")
    .select("id, from_status, to_status, changed_by_email, created_at")
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  // Health text is intentionally NOT part of this response (see /sensitive).
  return json({ ok: true, application: app, history: history ?? [], has_health_note: app.consent_sensitive });
});

const patchSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  internal_memo: z.string().max(5000).optional(),
  session_id: z.uuid().nullable().optional(),
});

export const PATCH = withAdmin({ write: true }, async (req, ctx, { id }) => {
  if (!UUID.safeParse(id).success) return fail(404, "not_found");
  const parsed = patchSchema.safeParse(await readJson(req, 20_000));
  if (!parsed.success || Object.keys(parsed.data).length === 0) return fail(400, "invalid");
  const changes = parsed.data;

  const { data: before } = await ctx.db.from("applications").select("status, session_id").eq("id", id).maybeSingle();
  if (!before) return fail(404, "not_found");

  const { data: updated, error } = await ctx.db
    .from("applications")
    .update(changes)
    .eq("id", id)
    .select("id, status, internal_memo, session_id, updated_at")
    .maybeSingle();
  if (error) return fail(500, "update_failed");
  if (!updated) return fail(403, "forbidden"); // RLS filtered the row out

  if (changes.status && changes.status !== before.status) {
    await ctx.svc.from("application_status_history").insert({
      application_id: id,
      from_status: before.status,
      to_status: changes.status,
      changed_by: ctx.user.id,
      changed_by_email: ctx.profile.email,
    });
    await audit(ctx, "application_status_change", "applications", id, { from: before.status, to: changes.status });
  }
  if (changes.internal_memo !== undefined) await audit(ctx, "application_memo_update", "applications", id);
  if (changes.session_id !== undefined && changes.session_id !== before.session_id) {
    await audit(ctx, "application_session_change", "applications", id, { from: before.session_id, to: changes.session_id });
  }

  let warning: string | null = null;
  if (updated.status === "confirmed" && updated.session_id) {
    const { data: seat } = await ctx.svc
      .from("session_availability")
      .select("capacity, confirmed_count")
      .eq("session_id", updated.session_id)
      .maybeSingle();
    if (seat && seat.capacity !== null && seat.confirmed_count > seat.capacity) warning = "over_capacity";
  }
  return json({ ok: true, application: updated, warning });
});
