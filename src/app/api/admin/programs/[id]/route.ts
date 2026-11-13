import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { programSchema } from "@/lib/admin-schemas";

const id = z.uuid();

export const PATCH = withAdmin({ write: true }, async (req, ctx, params) => {
  if (!id.safeParse(params.id).success) return fail(404, "not_found");
  const parsed = programSchema.partial().safeParse(await readJson(req));
  if (!parsed.success || Object.keys(parsed.data).length === 0) return fail(400, "validation");
  const { data, error } = await ctx.db.from("programs").update(parsed.data).eq("id", params.id).select("*").maybeSingle();
  if (error) return fail(error.code === "23505" ? 409 : 500, error.code === "23505" ? "slug_taken" : "update_failed");
  if (!data) return fail(404, "not_found");
  await audit(ctx, "program_update", "programs", params.id, { fields: Object.keys(parsed.data) });
  return json({ ok: true, program: data });
});

export const DELETE = withAdmin({ write: true }, async (_req, ctx, params) => {
  if (!id.safeParse(params.id).success) return fail(404, "not_found");
  const { error, data } = await ctx.db.from("programs").delete().eq("id", params.id).select("id");
  if (error) return fail(error.code === "23503" ? 409 : 500, error.code === "23503" ? "has_applications" : "delete_failed");
  if (!data?.length) return fail(404, "not_found");
  await audit(ctx, "program_delete", "programs", params.id);
  return json({ ok: true });
});
