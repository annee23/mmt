import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/session";
import { serviceClient } from "@/lib/supabase/clients";
import { crossSite, fail } from "@/lib/api";
import { cookies } from "next/headers";
import { readAdminCookie } from "@/lib/admin-cookie";

export type AdminProfile = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "manager" | "viewer";
  can_view_sensitive: boolean;
};

export type AdminCtx = {
  user: User;
  profile: AdminProfile;
  /** Acts as the signed-in admin: Postgres RLS is enforced. */
  db: SupabaseClient;
  /** Service role: use only for audit trails and operations RLS intentionally does not allow. */
  svc: SupabaseClient;
};

/**
 * Resolves the current admin from the auth cookie. The user is verified with the Auth server
 * (getUser) and must have a row in admin_profiles – a valid login alone is not enough.
 */
export async function getAdmin(): Promise<AdminCtx | null> {
  if (!supabaseConfigured()) return null;
  const signedCookie = readAdminCookie(await cookies());
  if (signedCookie) {
    const svc = serviceClient();
    const { data: profile } = await svc
      .from("admin_profiles")
      .select("*")
      .eq("user_id", signedCookie.userId)
      .maybeSingle();
    if (profile) {
      return {
        user: { id: signedCookie.userId, email: signedCookie.profileEmail } as User,
        profile: profile as AdminProfile,
        db: svc,
        svc,
      };
    }
  }
  const db = await sessionClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await db.from("admin_profiles").select("*").eq("user_id", data.user.id).maybeSingle();
  if (!profile) return null;
  return { user: data.user, profile: profile as AdminProfile, db, svc: serviceClient() };
}

/** For admin pages: signed-in admins only, everyone else is sent to the login screen. */
export async function requireAdminPage(): Promise<AdminCtx> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

type Need = { write?: boolean; sensitive?: boolean; owner?: boolean };
type Params = { params: Promise<Record<string, string>> };

export function withAdmin(
  need: Need,
  handler: (req: Request, ctx: AdminCtx, params: Record<string, string>) => Promise<Response>,
) {
  return async (req: Request, routeCtx: Params): Promise<Response> => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD" && crossSite(req)) return fail(403, "forbidden_origin");
      const ctx = await getAdmin();
      if (!ctx) return fail(401, "unauthorized");
      const { role, can_view_sensitive } = ctx.profile;
      if (need.owner && role !== "owner") return fail(403, "forbidden");
      if (need.write && role === "viewer") return fail(403, "forbidden");
      if (need.sensitive && !can_view_sensitive) return fail(403, "sensitive_forbidden");
      return await handler(req, ctx, routeCtx?.params ? await routeCtx.params : {});
    } catch (err) {
      console.error("admin route error", err);
      return fail(500, "server_error");
    }
  };
}

export async function audit(
  ctx: AdminCtx,
  action: string,
  entity: string | null,
  entityId: string | null,
  meta: Record<string, unknown> = {},
) {
  await ctx.svc.from("audit_logs").insert({
    actor_id: ctx.user.id,
    actor_email: ctx.profile.email,
    action,
    entity,
    entity_id: entityId,
    meta,
  });
}
