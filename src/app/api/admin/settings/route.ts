import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { DEFAULT_PRIVACY, getSettings } from "@/lib/settings";

const s = (max = 2000) => z.string().trim().max(max);
const privacy = z.object({
  controller: s(200),
  contact_email: s(254),
  purpose_ko: s(), purpose_en: s(),
  items_ko: s(), items_en: s(),
  retention_ko: s(), retention_en: s(),
  sensitive_purpose_ko: s(), sensitive_purpose_en: s(),
  sensitive_retention_ko: s(), sensitive_retention_en: s(),
  refusal_ko: s(), refusal_en: s(),
});
const schema = z.object({ name_required: z.boolean(), privacy });

export const GET = withAdmin({}, async () => json({ ok: true, ...(await getSettings()) }));

export const PUT = withAdmin({ write: true }, async (req, ctx) => {
  const parsed = schema.safeParse(await readJson(req, 100_000));
  if (!parsed.success) return fail(400, "validation", { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  const stamp = { updated_at: new Date().toISOString(), updated_by: ctx.user.id };
  const rows = [
    { key: "application_form", value: { name_required: parsed.data.name_required }, ...stamp },
    { key: "privacy", value: { ...DEFAULT_PRIVACY, ...parsed.data.privacy, reviewed: true }, ...stamp },
  ];
  const { error } = await ctx.db.from("site_settings").upsert(rows);
  if (error) return fail(500, "save_failed");
  await audit(ctx, "settings_update", "site_settings", null);
  return json({ ok: true });
});
