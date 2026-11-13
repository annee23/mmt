import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";

const schema = z.object({ status: z.enum(["active", "unsubscribed"]) });

export const PATCH = withAdmin({ write: true }, async (req, ctx, params) => {
  if (!z.uuid().safeParse(params.id).success) return fail(404, "not_found");
  const parsed = schema.safeParse(await readJson(req, 500));
  if (!parsed.success) return fail(400, "invalid");
  const { data, error } = await ctx.db
    .from("newsletter_subscribers")
    .update({
      status: parsed.data.status,
      unsubscribed_at: parsed.data.status === "unsubscribed" ? new Date().toISOString() : null,
    })
    .eq("id", params.id)
    .select("id, status")
    .maybeSingle();
  if (error) return fail(500, "update_failed");
  if (!data) return fail(404, "not_found");
  await audit(ctx, "subscriber_status", "newsletter_subscribers", params.id, { status: parsed.data.status });
  return json({ ok: true, subscriber: data });
});
