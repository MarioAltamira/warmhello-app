const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const root = process.cwd();
const DATE = new Date().toISOString().slice(0,10).replace(/-/g,"");
const BRANCH = "deploy-flat-" + DATE;
const NL = process.platform === "win32" ? "\r\n" : "\n";

function run(cmd, opts = {}) {
  console.log("$", cmd);
  try {
    const out = execSync(cmd, { encoding: "utf-8", stdio: ["inherit","pipe","pipe"], cwd: root, ...opts });
    process.stdout.write(out);
    return { ok: true, out };
  } catch (e) {
    process.stderr.write((e.stdout||"") + (e.stderr||""));
    console.error("EXIT", e.status ?? "?");
    return { ok: false, code: e.status ?? 1 };
  }
}

// ── 3a. safety checks (no .env/node_modules at root) ──
console.log("=== 3a. Safety: no .env / caches at root ===");
for (const p of [".env","node_modules",".next","supabase",".dbg",".repair-probe"]) {
  if (fs.existsSync(path.join(root,p))) { console.error("FATAL: exists at root:", p); process.exit(1); }
}
console.log("✅ ok");

// ── 3b. Ensure .gitignore covers everything we need ──
console.log("=== 3b. Ensure .gitignore rules ===");
const giPath = path.join(root,".gitignore");
let gi = fs.existsSync(giPath) ? fs.readFileSync(giPath,"utf8") : "";
const rules = [
  "","# Node / Next.js caches","node_modules/",".next/",".dbg/",".repair-probe/","tsconfig.tsbuildinfo",".dev-server*.log",
  "","# Secrets / local env",".env",".env.local",".env.*.local",
  "","# Supabase local dev cache","supabase/",
  "","# macOS / Windows",".DS_Store","Thumbs.db",
  "","# PM2 logs","*.log","!next-env.d.ts"
];
const existingLines = new Set(gi.split(/\r?\n/).map(s => s.trim()));
const missing = rules.filter(r => !existingLines.has(r.trim()));
if (missing.length) {
  if (!gi.endsWith("\n")) gi += "\n";
  gi += missing.join(NL) + NL;
  fs.writeFileSync(giPath, gi);
  console.log(`✅ updated .gitignore (${missing.length} new rules)`);
} else {
  console.log("✅ .gitignore ok");
}

// ── 3c. create orphan branch ──
console.log("=== 3c. Create orphan branch ===");
try { execSync(`git show-ref --verify --quiet refs/heads/${BRANCH}`, {cwd:root}); } catch(e) {}
if (run(`git branch`).out.includes(BRANCH)) {
  console.log(`Branch ${BRANCH} exists locally — deleting first`);
  const r = run(`git branch -D ${BRANCH}`);
  if (!r.ok) process.exit(2);
}
const r1 = run(`git checkout --orphan ${BRANCH}`);
if (!r1.ok) process.exit(2);
run(`git rm -rf --cached .`); // ignore errors, clear staging from old branch
console.log(`✅ on orphan branch ${BRANCH}`);

// ── 3d. stage + hard safety verify no secrets staged ──
console.log("=== 3d. Stage + safety verify staging ===");
const r2 = run("git add -A");
if (!r2.ok) process.exit(3);
const staged = execSync("git diff --cached --name-only", { encoding:"utf-8", cwd:root }).split(/\r?\n/).filter(Boolean);
const badPatterns = [/(^|[\\\/])\.env($|[\\\/])/, /(^|[\\\/])node_modules([\\\/]|$)/, /(^|[\\\/])\.next([\\\/]|$)/, /(^|[\\\/])\.dbg([\\\/]|$)/];
const bad = staged.filter(f => badPatterns.some(p => p.test(f)));
if (bad.length) { console.error("FATAL: secrets/caches staged:", bad); process.exit(4); }
console.log(`✅ Staged ${staged.length} files. No secrets/caches.`);

// ── 3e. commit ──
console.log("=== 3e. Commit ===");
const msg = "deploy(flat): restructure app at repo root — QStash retry=2 + dedupe fixes";
const r3 = run(`git commit -m "${msg.replace(/"/g,'')}"`);
if (!r3.ok) process.exit(5);
const short = execSync("git rev-parse --short HEAD", { encoding:"utf-8", cwd:root }).trim();
console.log(`✅ committed ${short}`);

// ── 3f. push (NO force — new branch) ──
console.log(`=== 3f. Push ${BRANCH} to origin ===`);
const r4 = run(`git push --set-upstream origin ${BRANCH}`);
if (!r4.ok) {
  console.error("PUSH FAILED. If GitHub Push Protection blocked due to detected secret, paste the error message above.");
  process.exit(6);
}
console.log("");
console.log(`✅✅✅ Pushed ${BRANCH} (commit ${short}) to origin.`);
console.log("Now WAIT for Step 4 on server.");
