import { crossSite, fail, json } from "@/lib/api";
import { supabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/session";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured()) return json({ ok: true });
  const db = await sessionClient();
  await db.auth.signOut();
  const response = json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
