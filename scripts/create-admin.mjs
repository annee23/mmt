// Creates (or updates) an admin account: a Supabase Auth user + a row in admin_profiles.
//
//   node --env-file=.env.local scripts/create-admin.mjs <email> <password> [owner|manager|viewer] [--sensitive]
//
// --sensitive grants permission to read health-related answers (default: no).
import { createClient } from "@supabase/supabase-js";

const [email, password, roleArg, ...flags] = process.argv.slice(2);
const role = ["owner", "manager", "viewer"].includes(roleArg) ? roleArg : "owner";
const sensitive = [roleArg, ...flags].includes("--sensitive");

if (!email || !password || password.length < 10) {
  console.error("usage: create-admin.mjs <email> <password (min 10 chars)> [owner|manager|viewer] [--sensitive]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (use --env-file=.env.local).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) throw created.error;
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error("User exists but could not be found");
  userId = existing.id;
  await supabase.auth.admin.updateUserById(userId, { password });
  console.log("Existing Auth user found – password updated.");
} else {
  userId = created.data.user.id;
}

const { error } = await supabase
  .from("admin_profiles")
  .upsert({ user_id: userId, email, role, can_view_sensitive: sensitive }, { onConflict: "user_id" });
if (error) throw error;
console.log(`Admin ready: ${email} (role=${role}, sensitive=${sensitive})`);
