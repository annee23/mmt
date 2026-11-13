import { json } from "@/lib/api";
import { withAdmin } from "@/lib/admin";

export const GET = withAdmin({}, async (_req, ctx) =>
  json({
    ok: true,
    email: ctx.profile.email,
    display_name: ctx.profile.display_name,
    role: ctx.profile.role,
    can_view_sensitive: ctx.profile.can_view_sensitive,
  }),
);
