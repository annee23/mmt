import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { programSchema } from "@/lib/admin-schemas";

export const GET = withAdmin({}, async (_req, ctx) => {
  const [programs, sessions] = await Promise.all([
    ctx.db.from("programs").select("*").order("sort_order"),
    ctx.db.from("program_sessions").select("*").order("starts_at"),
  ]);
  if (programs.error || sessions.error) return fail(500, "query_failed");
  return json({ ok: true, programs: programs.data, sessions: sessions.data });
});

export const POST = withAdmin({ write: true }, async (req, ctx) => {
  const parsed = programSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "validation", { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  const { data, error } = await ctx.db.from("programs").insert(parsed.data).select("*").single();
  if (error) return fail(error.code === "23505" ? 409 : 500, error.code === "23505" ? "slug_taken" : "insert_failed");
  await audit(ctx, "program_create", "programs", data.id);
  return json({ ok: true, program: data }, 201);
});
