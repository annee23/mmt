// End-to-end verification of the apply → admin flow against a running site + Supabase.
//
//   node --env-file=.env.local scripts/verify-e2e.mjs [baseUrl]
//
// Requires admin accounts created with scripts/create-admin.mjs:
//   OWNER_EMAIL/OWNER_PASSWORD (owner, can_view_sensitive), VIEWER_EMAIL/VIEWER_PASSWORD (viewer),
//   MANAGER_EMAIL/MANAGER_PASSWORD (manager without sensitive access).
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const creds = {
  owner: [process.env.OWNER_EMAIL ?? "owner@example.com", process.env.OWNER_PASSWORD ?? "Local-Admin-Pass-1"],
  viewer: [process.env.VIEWER_EMAIL ?? "viewer@example.com", process.env.VIEWER_PASSWORD ?? "Viewer-Pass-12345"],
  manager: [process.env.MANAGER_EMAIL ?? "plain@example.com", process.env.MANAGER_PASSWORD ?? "Plain-User-Pass-1"],
};

let passed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
};

class Client {
  jar = new Map();
  async req(path, { method = "GET", json, headers = {}, body } = {}) {
    const res = await fetch(base + path, {
      method,
      redirect: "manual",
      headers: {
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(this.jar.size ? { Cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
        ...headers,
      },
      body: json ? JSON.stringify(json) : body,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const [k, v] = [pair.slice(0, i), pair.slice(i + 1)];
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || v === "") this.jar.delete(k);
      else this.jar.set(k, v);
    }
    return res;
  }
  async login([email, password]) {
    const res = await this.req("/api/admin/login", { method: "POST", json: { email, password } });
    return res;
  }
}

const rest = (path, key, init = {}) =>
  fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

const stamp = Date.now();
const contact = `010-${String(stamp).slice(-8, -4)}-${String(stamp).slice(-4)}`;
const HEALTH = "천식이 있어 먼지에 민감합니다 (e2e-health-marker)";
const anon = new Client();
const owner = new Client();
const manager = new Client();
const viewer = new Client();

console.log(`E2E against ${base}`);

let programId;
let sessionId;
let appNo;
let appId;

await step("1. Public program detail page renders", async () => {
  const res = await anon.req("/ko/program/embodied-listening");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Didgeridoo Embodied Listening/);
  const programs = await (await rest("programs?select=id,slug&slug=eq.embodied-listening", ANON)).json();
  programId = programs[0].id;
});

await step("Admin login works for owner / manager / viewer", async () => {
  for (const [c, who] of [[owner, "owner"], [manager, "manager"], [viewer, "viewer"]]) {
    const res = await c.login(creds[who]);
    assert.equal(res.status, 200, `${who} login -> ${res.status}`);
  }
});

await step("Wrong password is rejected", async () => {
  const res = await new Client().login([creds.owner[0], "definitely-wrong-password"]);
  assert.equal(res.status, 401);
});

await step("Owner adds a session (schedule + capacity)", async () => {
  const starts = new Date(Date.now() + 14 * 864e5).toISOString();
  const res = await owner.req(`/api/admin/programs/${programId}/sessions`, {
    method: "POST",
    json: { title_ko: "e2e 회차", title_en: "e2e session", starts_at: starts, ends_at: null, time_note_ko: "14:00–16:00", time_note_en: "2–4 pm", location_ko: "서울", location_en: "Seoul", fee_amount: 30000, fee_note_ko: "", fee_note_en: "", capacity: 2, apply_deadline: null, status: "open", is_published: true },
  });
  assert.equal(res.status, 201);
  sessionId = (await res.json()).session.id;
});

await step("2-3. Detail page lists the session, fee and apply link", async () => {
  const html = await (await anon.req("/ko/program/embodied-listening")).text();
  assert.match(html, /30,000원|30,000/);
  assert.match(html, /잔여 2석/);
  assert.ok(html.includes(`session=${sessionId}`));
});

await step("4-5. Applicant submits all 8 answers + consents", async () => {
  const res = await anon.req("/api/apply", {
    method: "POST",
    json: {
      program_id: programId, session_id: sessionId, name: "E2E 테스터", age_group: "30s", gender: "female", contact,
      heard_didgeridoo: "media", reason: "소리를 직접 경험하고 싶어서", expectations: "호흡과 진동", health_note: HEALTH,
      consent_privacy: true, consent_sensitive: true, lang: "ko",
    },
  });
  const data = await res.json();
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.match(data.application_no, /^MMT-\d{4}-\d{5}$/);
  assert.equal(data.status, "new");
  appNo = data.application_no;
});

await step("6. Application is really stored in the database (service role check)", async () => {
  const rows = await (await rest(`applications?select=*&application_no=eq.${appNo}`, SERVICE)).json();
  assert.equal(rows.length, 1);
  const a = rows[0];
  appId = a.id;
  assert.equal(a.name, "E2E 테스터");
  assert.equal(a.age_group, "30s");
  assert.equal(a.gender, "female");
  assert.equal(a.contact, contact);
  assert.equal(a.heard_didgeridoo, "media");
  assert.equal(a.reason, "소리를 직접 경험하고 싶어서");
  assert.equal(a.expectations, "호흡과 진동");
  assert.equal(a.consent_privacy, true);
  assert.equal(a.session_id, sessionId);
  assert.ok(!JSON.stringify(a).includes("e2e-health-marker"), "health text must not be in applications");
  const notes = await (await rest(`application_sensitive_notes?select=*&application_id=eq.${appId}`, SERVICE)).json();
  assert.equal(notes.length, 1);
  assert.equal(notes[0].health_note, HEALTH);
});

await step("Duplicate submission within 24h is refused", async () => {
  const res = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, session_id: sessionId, age_group: "30s", gender: "female", contact, consent_privacy: true } });
  assert.equal(res.status, 409);
});

await step("Health text without sensitive consent is refused", async () => {
  const res = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, session_id: sessionId, age_group: "20s", gender: "male", contact: contact + "9", health_note: "x", consent_privacy: true, consent_sensitive: false } });
  assert.equal(res.status, 400);
});

await step("Missing privacy consent / required fields are refused", async () => {
  const a = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, age_group: "20s", gender: "male", contact: "010", consent_privacy: false } });
  assert.equal(a.status, 400);
  const b = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, gender: "male", contact: "01012345678", consent_privacy: true } });
  assert.equal(b.status, 400);
});

await step("7-8. Admin sees the new applicant in the list (status 신규)", async () => {
  const res = await owner.req(`/api/admin/applications?q=${encodeURIComponent("E2E")}&status=new`);
  assert.equal(res.status, 200);
  const data = await res.json();
  const row = data.rows.find((r) => r.application_no === appNo);
  assert.ok(row, "new application listed");
  assert.equal(row.status, "new");
  assert.ok(!JSON.stringify(data).includes("e2e-health-marker"), "list must not contain health text");
});

await step("9. Admin detail shows every answer, health text excluded", async () => {
  const res = await owner.req(`/api/admin/applications/${appId}`);
  const data = await res.json();
  assert.equal(data.application.reason, "소리를 직접 경험하고 싶어서");
  assert.equal(data.application.heard_didgeridoo, "media");
  assert.equal(data.has_health_note, true);
  assert.ok(!JSON.stringify(data).includes("e2e-health-marker"));
});

await step("Health note: owner (sensitive) can read, manager/viewer cannot", async () => {
  const ok = await owner.req(`/api/admin/applications/${appId}/sensitive`);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).note.health_note, HEALTH);
  assert.equal((await manager.req(`/api/admin/applications/${appId}/sensitive`)).status, 403);
  assert.equal((await viewer.req(`/api/admin/applications/${appId}/sensitive`)).status, 403);
  const audit = await (await rest(`audit_logs?select=action&action=eq.view_sensitive&entity_id=eq.${appId}`, SERVICE)).json();
  assert.ok(audit.length >= 1, "view recorded in audit log");
});

await step("10-11. Status change persists (DB + history + memo)", async () => {
  const res = await owner.req(`/api/admin/applications/${appId}`, { method: "PATCH", json: { status: "confirmed", internal_memo: "e2e 메모" } });
  assert.equal(res.status, 200);
  const row = (await (await rest(`applications?select=status,internal_memo&id=eq.${appId}`, SERVICE)).json())[0];
  assert.equal(row.status, "confirmed");
  assert.equal(row.internal_memo, "e2e 메모");
  const hist = await (await rest(`application_status_history?select=from_status,to_status&application_id=eq.${appId}&order=id`, SERVICE)).json();
  assert.deepEqual(hist.map((h) => h.to_status), ["new", "confirmed"]);
  const re = await (await owner.req(`/api/admin/applications/${appId}`)).json();
  assert.equal(re.application.status, "confirmed");
});

await step("Seat count reflects confirmed applicants (잔여 1석)", async () => {
  const html = await (await anon.req("/ko/program/embodied-listening")).text();
  assert.match(html, /잔여 1석/);
  const dash = await (await owner.req("/api/admin/dashboard")).json();
  const s = dash.sessions.find((x) => x.id === sessionId);
  assert.equal(s.confirmed, 1);
  assert.equal(s.remaining, 1);
  assert.ok(dash.byStatus.confirmed >= 1);
});

await step("Full session accepts waitlist applications", async () => {
  for (const n of [1, 2]) {
    const r = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, session_id: sessionId, age_group: "40s", gender: "other", contact: `${contact}-w${n}`, consent_privacy: true } });
    const d = await r.json();
    assert.equal(r.status, 200);
    const id = (await (await rest(`applications?select=id&application_no=eq.${d.application_no}`, SERVICE)).json())[0].id;
    await owner.req(`/api/admin/applications/${id}`, { method: "PATCH", json: { status: "confirmed" } });
  }
  const r = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, session_id: sessionId, age_group: "50s", gender: "male", contact: `${contact}-late`, consent_privacy: true } });
  assert.equal((await r.json()).status, "waitlist");
});

await step("12. CSV export: all answers, no health data by default", async () => {
  const res = await owner.req("/api/admin/applications/export?q=E2E");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/csv/);
  const raw = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 BOM for Excel");
  const csv = raw.toString("utf8");
  assert.ok(csv.includes("신청번호"));
  assert.ok(csv.includes(appNo) && csv.includes("E2E 테스터") && csv.includes("참가 확정") && csv.includes("30대"));
  assert.ok(!csv.includes("e2e-health-marker"), "default CSV must not contain health data");
  assert.ok(!csv.includes("건강 관련 사항"));
});

await step("Sensitive CSV only for sensitive-permitted admins", async () => {
  const ok = await (await owner.req("/api/admin/applications/export?q=E2E&include_health=1")).text();
  assert.ok(ok.includes("e2e-health-marker"));
  assert.equal((await manager.req("/api/admin/applications/export?include_health=1")).status, 403);
});

await step("Viewer cannot change data", async () => {
  assert.equal((await viewer.req(`/api/admin/applications/${appId}`, { method: "PATCH", json: { status: "cancelled" } })).status, 403);
  assert.equal((await viewer.req("/api/admin/programs", { method: "POST", json: {} })).status, 403);
});

await step("SECURITY: anonymous users cannot reach admin APIs", async () => {
  for (const p of ["/api/admin/applications", `/api/admin/applications/${appId}`, `/api/admin/applications/${appId}/sensitive`, "/api/admin/applications/export", "/api/admin/dashboard", "/api/admin/subscribers", "/api/admin/audit"]) {
    const res = await new Client().req(p);
    assert.equal(res.status, 401, `${p} -> ${res.status}`);
  }
  const patch = await new Client().req(`/api/admin/applications/${appId}`, { method: "PATCH", json: { status: "cancelled" } });
  assert.equal(patch.status, 401);
  const page = await new Client().req("/admin/applications");
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location"), /\/admin\/login/);
});

await step("SECURITY: forged auth header / anon key cannot read applicants via the Data API", async () => {
  for (const t of ["applications", "application_sensitive_notes", "application_status_history", "newsletter_subscribers", "audit_logs", "admin_profiles"]) {
    const res = await rest(`${t}?select=*`, ANON);
    const body = await res.text();
    assert.ok(res.status >= 400 || body === "[]", `${t}: ${res.status} ${body.slice(0, 80)}`);
    assert.ok(!body.includes(contact) && !body.includes("e2e-health-marker"));
  }
  const fake = await new Client().req("/api/admin/applications", { headers: { Authorization: `Bearer ${ANON}` } });
  assert.equal(fake.status, 401);
  const insert = await rest("applications", ANON, { method: "POST", body: JSON.stringify({ program_id: programId, age_group: "20s", gender: "male", contact: "x", consent_privacy: true }) });
  assert.ok(insert.status >= 400, "anon cannot insert directly");
  const rpc = await rest("rpc/submit_application", ANON, { method: "POST", body: JSON.stringify({ p: {} }) });
  assert.ok(rpc.status >= 400, "anon cannot call submit_application");
});

await step("SECURITY: authenticated non-admin user is refused", async () => {
  const email = `nobody-${stamp}@example.com`;
  const mk = await fetch(`${SUPA}/auth/v1/admin/users`, { method: "POST", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Nobody-Pass-12345", email_confirm: true }) });
  assert.ok(mk.ok);
  const c = new Client();
  assert.equal((await c.login([email, "Nobody-Pass-12345"])).status, 403);
  assert.equal((await c.req("/api/admin/applications")).status, 401);
  const token = (await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Nobody-Pass-12345" }) })).json()).access_token;
  const rows = await (await rest("applications?select=id", token)).text();
  assert.equal(rows, "[]", "RLS hides applications from non-admin authenticated users");
});

await step("Cross-site POST to admin API is refused", async () => {
  const res = await owner.req(`/api/admin/applications/${appId}`, { method: "PATCH", json: { status: "new" }, headers: { Origin: "https://evil.example" } });
  assert.equal(res.status, 403);
});

await step("Newsletter: subscribe, reject duplicate, unsubscribe", async () => {
  const email = `e2e-${stamp}@example.com`;
  const a = await (await anon.req("/api/subscribe", { method: "POST", json: { email, lang: "ko" } })).json();
  assert.equal(a.status, "subscribed");
  const b = await (await anon.req("/api/subscribe", { method: "POST", json: { email: email.toUpperCase() } })).json();
  assert.equal(b.status, "already");
  const rows = await (await rest(`newsletter_subscribers?select=*&email=eq.${email}`, SERVICE)).json();
  assert.equal(rows.length, 1);
  const list = await (await owner.req("/api/admin/subscribers")).json();
  assert.ok(list.rows.some((r) => r.email === email));
  assert.equal((await anon.req("/api/subscribe", { method: "POST", json: { email: "not-an-email" } })).status, 400);
  const u = await anon.req("/api/unsubscribe", { method: "POST", json: { token: rows[0].unsubscribe_token } });
  assert.equal(u.status, 200);
  const after = await (await rest(`newsletter_subscribers?select=status&email=eq.${email}`, SERVICE)).json();
  assert.equal(after[0].status, "unsubscribed");
});

await step("CSV import (Google Form export): dry-run, import, idempotent re-import", async () => {
  const csv = [
    "타임스탬프,이름,연령대,성별,연락처,디저리두 소리를 이전에 들어본 적이 있나요?,이 프로그램에 참여하고 싶은 이유는 무엇인가요?,프로그램을 통해 경험해보고 싶은 것이 있다면 자유롭게 적어주세요.,호흡기 질환이나 참여 시 주의가 필요한 건강상의 사항이 있다면 알려주세요.",
    `2025. 3. 4 오후 3:12:45,가져온 사람,40대,남성,010-0000-${String(stamp).slice(-4)},실제 디저리두 연주를 들어본 적이 있습니다.,"이유, 쉼표 포함",기대 내용,천식 (import-health-marker)`,
    "2025. 3. 5 오전 9:00:00,잘못된 행,90대,남성,010-1111-1111,,,,",
  ].join("\n");
  const body = { csv, program_id: programId, session_id: null, status: "reviewing", include_health: false };
  const dry = await (await owner.req("/api/admin/import", { method: "POST", json: { ...body, dry_run: true } })).json();
  assert.equal(dry.importable, 1);
  assert.equal(dry.invalid.length, 1);
  const done = await (await owner.req("/api/admin/import", { method: "POST", json: { ...body, dry_run: false } })).json();
  assert.equal(done.imported, 1);
  const again = await (await owner.req("/api/admin/import", { method: "POST", json: { ...body, dry_run: false } })).json();
  assert.equal(again.imported, 0);
  const rows = await (await rest(`applications?select=name,age_group,gender,heard_didgeridoo,status,source,created_at,consent_sensitive&contact=eq.${encodeURIComponent(`010-0000-${String(stamp).slice(-4)}`)}`, SERVICE)).json();
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].age_group, rows[0].gender, rows[0].heard_didgeridoo, rows[0].status, rows[0].source], ["40s", "male", "live", "reviewing", "import"]);
  assert.ok(rows[0].created_at.startsWith("2025-03-04T15:12:45+09") || rows[0].created_at.startsWith("2025-03-04T06:12:45"), `timestamp parsed as KST: ${rows[0].created_at}`);
  const health = await (await rest("application_sensitive_notes?select=health_note&health_note=ilike.*import-health-marker*", SERVICE)).json();
  assert.equal(health.length, 0, "health column dropped unless explicitly included");
  const viewerTry = await viewer.req("/api/admin/import", { method: "POST", json: { ...body, dry_run: true } });
  assert.equal(viewerTry.status, 403);
});

await step("Program closes automatically after its deadline", async () => {
  const past = new Date(Date.now() - 3600_000).toISOString();
  try {
    const res = await owner.req(`/api/admin/programs/${programId}`, { method: "PATCH", json: { apply_deadline: past } });
    assert.equal(res.status, 200);
    const html = await (await anon.req("/ko/program/embodied-listening")).text();
    assert.match(html, /모집 마감/);
    const r = await anon.req("/api/apply", { method: "POST", json: { program_id: programId, session_id: sessionId, age_group: "20s", gender: "male", contact: contact + "-closed", consent_privacy: true } });
    assert.equal(r.status, 422);
  } finally {
    await owner.req(`/api/admin/programs/${programId}`, { method: "PATCH", json: { apply_deadline: null } });
  }
});

await step("Cleanup: remove the e2e session", async () => {
  // applications keep existing (session_id becomes null); only the temporary schedule goes away
  assert.equal((await owner.req(`/api/admin/sessions/${sessionId}`, { method: "DELETE" })).status, 200);
});

console.log(`\n${process.exitCode ? "FAILED" : "All checks passed"} (${passed} steps ok)`);
