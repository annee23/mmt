import { z } from "zod";
import { crossSite, fail, json, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase/clients";
import { supabaseConfigured } from "@/lib/env";

const schema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail(503, "not_configured");
  const parsed = schema.safeParse(await readJson(req, 500));
  if (!parsed.success) return fail(400, "invalid");
  const { data, error } = await serviceClient()
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", parsed.data.token)
    .select("id");
  if (error) return fail(500, "server_error");
  return data && data.length ? json({ ok: true }) : fail(404, "not_found");
}
