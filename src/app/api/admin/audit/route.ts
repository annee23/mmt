import { fail, json } from "@/lib/api";
import { withAdmin } from "@/lib/admin";

export const GET = withAdmin({ owner: true }, async (req, ctx) => {
  const size = Math.min(200, Number(new URL(req.url).searchParams.get("size")) || 100);
  const { data, error } = await ctx.db
    .from("audit_logs")
    .select("id, actor_email, action, entity, entity_id, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(size);
  if (error) return fail(500, "query_failed");
  return json({ ok: true, rows: data });
});
