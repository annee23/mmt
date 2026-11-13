import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { sessionSchema } from "@/lib/admin-schemas";

const id = z.uuid();

export const PATCH = withAdmin({ write: true }, async (req, ctx, params) => {
  if (!id.safeParse(params.id).success) return fail(404, "not_found");
  const parsed = sessionSchema.partial().safeParse(await readJson(req));
  if (!parsed.success || Object.keys(parsed.data).length === 0) return fail(400, "validation");
  const { data, error } = await ctx.db.from("program_sessions").update(parsed.data).eq("id", params.id).select("*").maybeSingle();
  if (error) return fail(500, "update_failed");
  if (!data) return fail(404, "not_found");
  await audit(ctx, "session_update", "program_sessions", params.id, { fields: Object.keys(parsed.data) });
  return json({ ok: true, session: data });
});

// Applications keep existing rows: their session_id is set to null by the FK rule.
export const DELETE = withAdmin({ write: true }, async (_req, ctx, params) => {
  if (!id.safeParse(params.id).success) return fail(404, "not_found");
  const { error, data } = await ctx.db.from("program_sessions").delete().eq("id", params.id).select("id");
  if (error) return fail(500, "delete_failed");
  if (!data?.length) return fail(404, "not_found");
  await audit(ctx, "session_delete", "program_sessions", params.id);
  return json({ ok: true });
});
