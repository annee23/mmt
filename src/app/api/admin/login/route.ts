import { z } from "zod";
import { crossSite, fail, json, readJson } from "@/lib/api";
import { supabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/session";
import { serviceClient } from "@/lib/supabase/clients";
import { ADMIN_COOKIE, signAdminCookie } from "@/lib/admin-cookie";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured()) return fail(503, "not_configured");
  const parsed = schema.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail(400, "invalid");

  const password = parsed.data.password;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (configuredPassword && password !== configuredPassword) return fail(401, "invalid_credentials");

  const email = process.env.ADMIN_AUTH_EMAIL ?? "admin@mmt.local";
  const db = await sessionClient();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail(401, "invalid_credentials");

  // A valid Auth account is not enough – it must also be registered as an admin.
  const svc = serviceClient();
  const { data: profile } = await svc.from("admin_profiles").select("role, email").eq("user_id", data.user.id).maybeSingle();
  if (!profile) {
    await db.auth.signOut();
    return fail(403, "not_an_admin");
  }
  await svc.from("audit_logs").insert({ actor_id: data.user.id, actor_email: data.user.email, action: "login" });
  const response = json({ ok: true });
  response.cookies.set(
    ADMIN_COOKIE,
    signAdminCookie({
      userId: data.user.id,
      profileEmail: profile.email,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    },
  );
  return response;
}
