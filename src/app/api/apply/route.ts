import { z } from "zod";
import { crossSite, fail, json, readJson } from "@/lib/api";
import { AGE_GROUPS, GENDERS, HEARD, consentVersion } from "@/lib/application";
import { getSettings } from "@/lib/settings";
import { serviceClient } from "@/lib/supabase/clients";
import { supabaseConfigured } from "@/lib/env";

const text = (max: number) => z.string().trim().max(max).optional().default("");

const schema = z.object({
  program_id: z.uuid(),
  session_id: z.uuid().nullish(),
  name: text(100),
  age_group: z.enum(AGE_GROUPS),
  gender: z.enum(GENDERS),
  contact: z.string().trim().min(3).max(200),
  heard_didgeridoo: z.enum(HEARD).nullish(),
  reason: text(3000),
  expectations: text(3000),
  health_note: text(3000),
  consent_privacy: z.literal(true),
  consent_sensitive: z.boolean().optional().default(false),
  lang: z.enum(["ko", "en"]).optional().default("ko"),
  website: z.string().optional(), // honeypot: real users never fill this in
});

const KNOWN_ERRORS = ["program_closed", "session_closed", "session_required", "duplicate", "sensitive_consent_required"];

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "forbidden_origin");
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail(503, "not_configured");

  const body = await readJson(req);
  if (!body) return fail(400, "invalid_body");
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "validation", { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  }
  const input = parsed.data;
  if (input.website) return json({ ok: true, application_no: "MMT-0000-00000", status: "new" }); // silently drop bots

  const { form, privacy } = await getSettings();
  if (form.name_required && !input.name) return fail(400, "validation", { fields: ["name"] });

  const db = serviceClient();
  const { website: _honeypot, ...payload } = input;
  void _honeypot;
  const { data, error } = await db.rpc("submit_application", {
    p: { ...payload, consent_version: consentVersion(privacy) },
  });
  if (error) {
    const known = KNOWN_ERRORS.find((k) => error.message.includes(k));
    if (known === "sensitive_consent_required") return fail(400, "validation", { fields: ["consent_sensitive"] });
    if (known) return fail(known === "duplicate" ? 409 : 422, known);
    console.error("submit_application failed", error);
    return fail(500, "server_error");
  }

  const [{ data: program }, sessionRes] = await Promise.all([
    db.from("programs").select("name_ko, name_en").eq("id", input.program_id).single(),
    data.session_id
      ? db.from("program_sessions").select("starts_at").eq("id", data.session_id).single()
      : Promise.resolve({ data: null }),
  ]);
  return json({
    ok: true,
    application_no: data.application_no,
    status: data.status,
    program: input.lang === "en" ? program?.name_en || program?.name_ko : program?.name_ko,
    session_starts_at: sessionRes.data?.starts_at ?? null,
  });
}
