import { fail } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { csvResponse, toCsv } from "@/lib/csv";

export const GET = withAdmin({}, async (req, ctx) => {
  const activeOnly = new URL(req.url).searchParams.get("status") === "active";
  let query = ctx.db
    .from("newsletter_subscribers")
    .select("email, status, lang, subscribed_at, unsubscribed_at")
    .order("subscribed_at", { ascending: false })
    .limit(20000);
  if (activeOnly) query = query.eq("status", "active");
  const { data, error } = await query;
  if (error) return fail(500, "query_failed");
  await audit(ctx, "export_subscribers", "newsletter_subscribers", null, { rows: data.length });
  const rows = data.map((r) => [r.email, r.status === "active" ? "구독 중" : "구독 취소", r.lang, r.subscribed_at, r.unsubscribed_at ?? ""]);
  return csvResponse(`subscribers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([["이메일", "상태", "언어", "구독일", "취소일"], ...rows]));
});
