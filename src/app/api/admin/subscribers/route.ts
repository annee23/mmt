import { fail, json } from "@/lib/api";
import { withAdmin } from "@/lib/admin";

export const GET = withAdmin({}, async (req, ctx) => {
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  let query = ctx.db
    .from("newsletter_subscribers")
    .select("id, email, status, lang, subscribed_at, unsubscribed_at")
    .order("subscribed_at", { ascending: false })
    .limit(5000);
  if (status === "active" || status === "unsubscribed") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return fail(500, "query_failed");
  return json({ ok: true, rows: data });
});
