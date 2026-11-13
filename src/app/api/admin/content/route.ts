import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { DEFAULT_CONTENT, getContentOverrides } from "@/lib/content";
import { deepDiff, deepMerge } from "@/lib/content-merge";

const lang = z.enum(["ko", "en"]);

export const GET = withAdmin({}, async (req, ctx) => {
  const l = lang.safeParse(new URL(req.url).searchParams.get("lang"));
  if (!l.success) return fail(400, "invalid");
  const { data } = await ctx.db.from("site_content").select("data").eq("lang", l.data).maybeSingle();
  const overrides = data?.data ?? (await getContentOverrides(l.data));
  return json({ ok: true, content: deepMerge(DEFAULT_CONTENT[l.data], overrides), defaults: DEFAULT_CONTENT[l.data] });
});

export const PUT = withAdmin({ write: true }, async (req, ctx) => {
  const body = await readJson<{ lang?: string; content?: Record<string, unknown> }>(req, 1_500_000);
  const l = lang.safeParse(body?.lang);
  if (!l.success || !body?.content || typeof body.content !== "object") return fail(400, "invalid");

  const defaults = DEFAULT_CONTENT[l.data] as unknown as Record<string, unknown>;
  // only known top-level sections can be stored
  const edited = Object.fromEntries(Object.entries(body.content).filter(([k]) => k in defaults));
  const overrides = deepDiff(defaults, deepMerge(defaults, edited)) ?? {};

  const { error } = await ctx.db
    .from("site_content")
    .upsert({ lang: l.data, data: overrides, updated_at: new Date().toISOString(), updated_by: ctx.user.id });
  if (error) return fail(500, "save_failed");
  await audit(ctx, "content_update", "site_content", l.data, { sections: Object.keys(edited) });
  return json({ ok: true });
});
