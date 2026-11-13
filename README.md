# Jin Sarang — Music Therapy & Didgeridoo

Antique-editorial site (Next.js 16 · TypeScript · Tailwind 4 · Supabase) with in-site program applications and an admin console.

- Public site: `/ko`, `/en` (home, program + program detail, research, workshops, performances, apply)
- Admin: `/admin` (server-side auth: Supabase Auth + `admin_profiles`, Postgres RLS)
- Original content lives in `src/content/{ko,en}.json`; admins edit it in `/admin/content` (stored as overrides in `site_content`).
  Fields that were placeholders on the old site (thesis summary, performances intro, one workshop description) are left empty for the admin.

## Static landing preview (GitHub Pages)

`node scripts/build-static.mjs` builds a server-less copy of the public pages into `static-out/` (apply buttons point to the original Google Form; newsletter/admin are omitted).
`.github/workflows/pages.yml` publishes it on every push to `main` — enable it once under **Settings → Pages → Source: GitHub Actions**.
The full site (apply flow, admin) needs a server: use the Vercel deployment below.

## Deploy (Supabase + Vercel)

1. **Supabase project** → SQL editor (or `supabase db push`): run the files in `supabase/migrations/` in order
   (`init` → `seed` → `submit_application`). Seed contains the 5 original programs; no schedule/fee is invented.
2. **Vercel** → import the repo, set env vars (see `.env.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server only), `NEXT_PUBLIC_SITE_URL`.
3. **Create the first admin** (locally, with the same env vars in `.env.local`):
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com 'a-long-password' owner --sensitive
   ```
   Roles: `owner` (everything, audit log, delete health data), `manager` (edit/manage), `viewer` (read only).
   `--sensitive` allows reading health answers; grant it sparingly.
4. Sign in at `/admin/login`, then:
   - **신청서·개인정보**: review the privacy/consent text (initial template — confirm operator name, retention periods) and set whether *name* is required.
   - **프로그램·일정**: add sessions, capacity, fees, deadlines, recruiting status, cover images.
   - **CSV 가져오기**: import the Google Form export (dry-run first; re-import is idempotent).
5. Supabase Auth → disable public sign-ups (only the script creates admins).

## Security model

- The browser never sees the service-role key. Anonymous users can only read published programs/sessions/content; applications, health notes, subscribers and audit logs have **no** anon policies.
- Applications are written through `submit_application()` (service role only, atomic seat/waitlist logic).
- Health answers live in `application_sensitive_notes`: excluded from lists, e-mails and default CSV; readable only with `can_view_sensitive`; every read/export is audit-logged; owners can delete.
- All `/api/admin/*` handlers verify the session with Supabase Auth **and** an `admin_profiles` row; state-changing requests are same-origin only.

## Develop

```bash
pnpm install
pnpm dev                       # needs .env.local
node --env-file=.env.local scripts/verify-e2e.mjs http://localhost:3000   # apply → admin → CSV + security checks
```
Without Docker, `scripts/local-stack/start.sh` runs a local Postgres + GoTrue + PostgREST stack (see the script header).
