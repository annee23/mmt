import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { sessionSchema } from "@/lib/admin-schemas";

export const POST = withAdmin({ write: true }, async (req, ctx, params) => {
  if (!z.uuid().safeParse(params.id).success) return fail(404, "not_found");
  const parsed = sessionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "validation", { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  const { data, error } = await ctx.db
    .from("program_sessions")
    .insert({ ...parsed.data, program_id: params.id })
    .select("*")
    .single();
  if (error) return fail(500, "insert_failed");
  await audit(ctx, "session_create", "program_sessions", data.id, { program_id: params.id });
  return json({ ok: true, session: data }, 201);
});
