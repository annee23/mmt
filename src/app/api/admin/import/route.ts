import { z } from "zod";
import { fail, json, readJson } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";
import { APPLICATION_STATUSES } from "@/lib/application";
import { parseGoogleFormCsv } from "@/lib/import";

const schema = z.object({
  csv: z.string().min(1).max(5_000_000),
  program_id: z.uuid(),
  session_id: z.uuid().nullable().optional(),
  status: z.enum(APPLICATION_STATUSES).default("new"),
  include_health: z.boolean().default(false),
  dry_run: z.boolean().default(true),
});

/**
 * Imports a CSV exported from the old Google Form. Re-importing the same file is safe:
 * each row gets a deterministic import_key and duplicates are skipped.
 * Health answers are only stored when the admin holds the sensitive-data permission and opts in.
 */
export const POST = withAdmin({ write: true }, async (req, ctx) => {
  const parsedBody = schema.safeParse(await readJson(req, 6_000_000));
  if (!parsedBody.success) return fail(400, "validation");
  const input = parsedBody.data;
  if (input.include_health && !ctx.profile.can_view_sensitive) return fail(403, "sensitive_forbidden");

  const { rows, problems, missing } = parseGoogleFormCsv(input.csv);
  if (missing.length) return fail(422, "missing_columns", { missing });
  if (rows.length > 5000) return fail(413, "too_many_rows");

  const keys = rows.map((r) => r.import_key);
  const existing = new Set<string>();
  for (let i = 0; i < keys.length; i += 200) {
    const { data } = await ctx.svc.from("applications").select("import_key").in("import_key", keys.slice(i, i + 200));
    for (const r of data ?? []) existing.add(r.import_key);
  }
  const fresh = rows.filter((r, idx) => !existing.has(r.import_key) && keys.indexOf(r.import_key) === idx);
  const summary = {
    total: rows.length + problems.length,
    importable: fresh.length,
    duplicates: rows.length - fresh.length,
    invalid: problems,
    health_columns_ignored: !input.include_health && rows.some((r) => r.health_note),
  };
  if (input.dry_run) return json({ ok: true, dry_run: true, ...summary, preview: fresh.slice(0, 5).map((r) => ({ ...r, health_note: r.health_note ? "(있음)" : "" })) });

  let imported = 0;
  for (const r of fresh) {
    const hasHealth = input.include_health && r.health_note.trim() !== "";
    const { data: app, error } = await ctx.svc
      .from("applications")
      .insert({
        program_id: input.program_id,
        session_id: input.session_id ?? null,
        name: r.name,
        age_group: r.age_group,
        gender: r.gender,
        contact: r.contact,
        heard_didgeridoo: r.heard_didgeridoo,
        reason: r.reason,
        expectations: r.expectations,
        status: input.status,
        consent_privacy: true,
        consent_version: "google-form-import",
        consent_sensitive: hasHealth,
        source: "import",
        import_key: r.import_key,
        ...(r.created_at ? { created_at: r.created_at, consent_privacy_at: r.created_at } : {}),
      })
      .select("id")
      .single();
    if (error || !app) continue;
    imported++;
    await ctx.svc.from("application_status_history").insert({
      application_id: app.id,
      from_status: null,
      to_status: input.status,
      changed_by: ctx.user.id,
      changed_by_email: ctx.profile.email,
    });
    if (hasHealth) {
      await ctx.svc.from("application_sensitive_notes").insert({ application_id: app.id, health_note: r.health_note.trim() });
    }
  }
  await audit(ctx, "import_applications", "applications", null, { imported, skipped: summary.duplicates, invalid: problems.length, health: input.include_health });
  return json({ ok: true, dry_run: false, ...summary, imported });
});
