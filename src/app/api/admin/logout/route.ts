import { crossSite, fail, json } from "@/lib/api";
import { supabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/session";

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured()) return json({ ok: true });
  const db = await sessionClient();
  await db.auth.signOut();
  return json({ ok: true });
}
