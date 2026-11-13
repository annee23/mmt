import { fail, json } from "@/lib/api";
import { withAdmin } from "@/lib/admin";
import { LIST_SELECT, applyFilters, filtersFromParams } from "@/lib/admin-applications";

export const GET = withAdmin({}, async (req, ctx) => {
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const size = Math.min(100, Math.max(10, Number(sp.get("size")) || 30));
  const query = applyFilters(
    ctx.db.from("applications").select(LIST_SELECT, { count: "exact" }),
    filtersFromParams(sp),
  ).range((page - 1) * size, page * size - 1);
  const { data, count, error } = await query;
  if (error) return fail(500, "query_failed");
  return json({ ok: true, rows: data, total: count ?? 0, page, size });
});
