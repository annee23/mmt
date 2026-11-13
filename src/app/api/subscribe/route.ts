import { z } from "zod";
import { crossSite, fail, json, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase/clients";
import { supabaseConfigured } from "@/lib/env";

const schema = z.object({
  email: z.email().max(254),
  lang: z.enum(["ko", "en"]).optional().default("ko"),
  website: z.string().optional(),
});

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail(503, "not_configured");
  const body = await readJson(req, 2_000);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid");
  if (parsed.data.website) return json({ ok: true, status: "subscribed" });

  const email = parsed.data.email.trim().toLowerCase();
  const db = serviceClient();
  const { error } = await db.from("newsletter_subscribers").insert({ email, lang: parsed.data.lang });
  if (!error) return json({ ok: true, status: "subscribed" });

  if (error.code === "23505") {
    // Duplicate e-mail: re-activate a previously unsubscribed address, otherwise report "already".
    const { data: existing } = await db
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();
    if (existing?.status === "unsubscribed") {
      await db
        .from("newsletter_subscribers")
        .update({ status: "active", unsubscribed_at: null, subscribed_at: new Date().toISOString() })
        .eq("id", existing.id);
      return json({ ok: true, status: "subscribed" });
    }
    return json({ ok: true, status: "already" });
  }
  console.error("subscribe failed", error);
  return fail(500, "server_error");
}
