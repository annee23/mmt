// Builds the landing-page-only static site (no server, no database) for GitHub Pages.
//
//   node scripts/build-static.mjs            # output: static-out/
//   BASE_PATH=/mmt SITE_URL=https://annee23.github.io/mmt node scripts/build-static.mjs
//
// The full app (apply flow, admin, APIs) needs a server and is NOT part of this build: it is built from a
// temporary copy that leaves those routes out, so the working tree is never modified.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const work = path.join(root, ".static-build");
const basePath = process.env.BASE_PATH ?? "/mmt";
const siteUrl = process.env.SITE_URL ?? `https://annee23.github.io${basePath}`;

const skip = new Set([
  "src/app/api",
  "src/app/admin",
  "src/app/[lang]/apply",
  "src/app/[lang]/unsubscribe",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/components/admin",
  "src/proxy.ts",
]);

fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });

function copy(rel) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, path.join(work, rel), {
    recursive: true,
    filter: (src) => !skip.has(path.relative(root, src).split(path.sep).join("/")),
  });
}
["src", "public", "package.json", "tsconfig.json", "next.config.ts", "image-loader.ts"].forEach(copy);
fs.symlinkSync(path.join(root, "node_modules"), path.join(work, "node_modules"), "dir");

// Pages are rendered once at build time here, so drop the per-request flag from the layout.
const layout = path.join(work, "src/app/[lang]/layout.tsx");
fs.writeFileSync(layout, fs.readFileSync(layout, "utf8").replace('export const dynamic = "force-dynamic";\n', ""));

// "/" → language landing. Relative URLs keep it working under the base path.
fs.writeFileSync(
  path.join(work, "public/index.html"),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>진사랑 | Jin Sarang</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=ko/">
<script>var l=(navigator.language||"ko").toLowerCase().indexOf("ko")===0?"ko":"en";location.replace(l+"/")</script></head>
<body><a href="ko/">한국어</a> · <a href="en/">English</a></body></html>\n`,
);
fs.writeFileSync(path.join(work, "public/.nojekyll"), "");

const env = { ...process.env };
for (const k of Object.keys(env)) if (k.startsWith("NEXT_PUBLIC_SUPABASE") || k === "SUPABASE_SERVICE_ROLE_KEY") delete env[k];
Object.assign(env, {
  STATIC_EXPORT: "1",
  STATIC_BASE_PATH: basePath,
  NEXT_PUBLIC_BASE_PATH: basePath,
  NEXT_PUBLIC_STATIC_SITE: "1",
  NEXT_PUBLIC_SITE_URL: siteUrl,
});
const res = spawnSync("npx", ["next", "build"], { cwd: work, env, stdio: "inherit" });
if (res.status !== 0) process.exit(res.status ?? 1);

const out = path.join(root, "static-out");
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(work, "out"), out, { recursive: true });
fs.rmSync(work, { recursive: true, force: true });
console.log(`\nStatic site ready: ${out}  (base path "${basePath}")`);
