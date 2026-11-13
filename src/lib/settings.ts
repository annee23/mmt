import "server-only";
import { supabaseConfigured } from "@/lib/env";
import { anonClient } from "@/lib/supabase/clients";
import type { ApplicationFormSettings, PrivacySettings } from "@/lib/application";

export const DEFAULT_PRIVACY: PrivacySettings = {
  reviewed: false,
  controller: "",
  contact_email: "",
  purpose_ko: "",
  purpose_en: "",
  items_ko: "",
  items_en: "",
  retention_ko: "",
  retention_en: "",
  sensitive_purpose_ko: "",
  sensitive_purpose_en: "",
  sensitive_retention_ko: "",
  sensitive_retention_en: "",
  refusal_ko: "",
  refusal_en: "",
};

export async function getSettings(): Promise<{ form: ApplicationFormSettings; privacy: PrivacySettings }> {
  const fallback = { form: { name_required: false }, privacy: DEFAULT_PRIVACY };
  if (!supabaseConfigured()) return fallback;
  try {
    const { data } = await anonClient().from("site_settings").select("key, value");
    const byKey = new Map((data ?? []).map((r) => [r.key as string, r.value as Record<string, unknown>]));
    return {
      form: { ...fallback.form, ...(byKey.get("application_form") as Partial<ApplicationFormSettings>) },
      privacy: { ...DEFAULT_PRIVACY, ...(byKey.get("privacy") as Partial<PrivacySettings>) },
    };
  } catch {
    return fallback;
  }
}
