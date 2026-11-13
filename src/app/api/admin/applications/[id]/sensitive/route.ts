import { z } from "zod";
import { fail, json } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";

/** Health answers: only admins granted `can_view_sensitive`; every read is written to the audit log. */
export const GET = withAdmin({ sensitive: true }, async (_req, ctx, { id }) => {
  if (!z.uuid().safeParse(id).success) return fail(404, "not_found");
  const { data, error } = await ctx.db
    .from("application_sensitive_notes")
    .select("health_note, consent_sensitive_at, created_at")
    .eq("application_id", id)
    .maybeSingle();
  if (error) return fail(500, "query_failed");
  await audit(ctx, "view_sensitive", "applications", id);
  return json({ ok: true, note: data });
});

/** Permanent deletion of the health answer (owner + sensitive permission). */
export const DELETE = withAdmin({ sensitive: true, owner: true }, async (_req, ctx, { id }) => {
  if (!z.uuid().safeParse(id).success) return fail(404, "not_found");
  const { data, error } = await ctx.db.from("application_sensitive_notes").delete().eq("application_id", id).select("application_id");
  if (error) return fail(500, "delete_failed");
  if (data?.length) {
    await ctx.svc.from("applications").update({ consent_sensitive: false }).eq("id", id);
    await audit(ctx, "delete_sensitive", "applications", id);
  }
  return json({ ok: true, deleted: data?.length ?? 0 });
});
