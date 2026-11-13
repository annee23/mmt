import { z } from "zod";
import { crossSite, fail, json, readJson } from "@/lib/api";
import { supabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/session";
import { serviceClient } from "@/lib/supabase/clients";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured()) return fail(503, "not_configured");
  const parsed = schema.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail(400, "invalid");

  const db = await sessionClient();
  const { data, error } = await db.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return fail(401, "invalid_credentials");

  // A valid Auth account is not enough – it must also be registered as an admin.
  const svc = serviceClient();
  const { data: profile } = await svc.from("admin_profiles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!profile) {
    await db.auth.signOut();
    return fail(403, "not_an_admin");
  }
  await svc.from("audit_logs").insert({ actor_id: data.user.id, actor_email: data.user.email, action: "login" });
  return json({ ok: true });
}
