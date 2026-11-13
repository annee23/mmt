import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

let anon: SupabaseClient | undefined;
let service: SupabaseClient | undefined;

/** Public, RLS-restricted client for rendering the public site (programs, sessions, content). */
export function anonClient(): SupabaseClient {
  anon ??= createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anon;
}

/**
 * Service-role client. Bypasses RLS: only use it from server code *after* the caller has been
 * authorised (admin routes) or for narrowly-scoped public writes (apply / subscribe).
 */
export function serviceClient(): SupabaseClient {
  service ??= createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return service;
}
