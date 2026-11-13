import "server-only";
import ko from "@/content/ko.json";
import en from "@/content/en.json";
import type { Lang } from "@/lib/i18n";
import { deepMerge } from "@/lib/content-merge";
import { supabaseConfigured } from "@/lib/env";
import { anonClient } from "@/lib/supabase/clients";

export type Content = typeof ko;
export const DEFAULT_CONTENT: Record<Lang, Content> = { ko, en: en as Content };

export async function getContentOverrides(lang: Lang): Promise<unknown> {
  if (!supabaseConfigured()) return {};
  const { data } = await anonClient().from("site_content").select("data").eq("lang", lang).maybeSingle();
  return data?.data ?? {};
}

/** Original site content with any admin edits applied. Falls back to the bundled defaults. */
export async function getContent(lang: Lang): Promise<Content> {
  try {
    return deepMerge(DEFAULT_CONTENT[lang], await getContentOverrides(lang));
  } catch {
    return DEFAULT_CONTENT[lang];
  }
}
