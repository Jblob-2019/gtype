// scripts/bootstrap.js
// =====================================================================
// Pre-flight for `npm run dev`. Checks + installs:
//   1. Python venv at backend/.venv
//   2. Python deps from backend/requirements.txt
//   3. Cornell corpus at data/cornell/movie_lines.txt (skip with --no-corpus)
//   4. Trained model at backend/data/model.pkl (runs train.py if missing)
//   5. Node deps (this script assumes already run via npm install)
//
// Idempotent — re-running on a fully-prepared machine just verifies and exits.
// Cross-platform: Windows (cmd.exe / PowerShell) and POSIX shells.
// =====================================================================

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const DATA = path.join(ROOT, "data");
const CORNELL = path.join(DATA, "cornell", "movie_lines.txt");
const DEFAULTS = path.join(DATA, "default_phrases.txt");
const MODEL = path.join(BACKEND, "data", "model.pkl");
const REQUIREMENTS = path.join(BACKEND, "requirements.txt");

const isWin = process.platform === "win32";
const venvPython = path.join(BACKEND, ".venv", isWin ? "Scripts" : "bin", "python");
const venvPip = path.join(BACKEND, ".venv", isWin ? "Scripts" : "bin", "pip");

const args = new Set(process.argv.slice(2));
const skipCorpus = args.has("--no-corpus");
const forceTrain = args.has("--retrain");

const c = (s) => `\x1b[36m${s}\x1b[0m`;
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const y = (s) => `\x1b[33m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;

function step(n, msg) { console.log(`\n${c(`[${n}]`)} ${msg}`); }
function ok(msg)   { console.log(`  ${g("✓")} ${msg}`); }
function info(msg) { console.log(`  ${msg}`); }
function warn(msg) { console.log(`  ${y("!")} ${msg}`); }
function fail(msg) { console.error(`  ${r("�")} ${msg}`); process.exit(1); }

function run(cmd, opts = {}) {
  const r = spawnSync(cmd, { stdio: "inherit", shell: true, ...opts });
  if (r.status !== 0) process.exit(r.status || 1);
}

// 1. Python availability
step(1, "Checking Python…");
let py = "python";
try { execSync(`${py} --version`, { stdio: "ignore" }); }
catch {
  try { py = "py"; execSync(`${py} -3 --version`, { stdio: "ignore" }); }
  catch { fail("Python 3.10+ not found in PATH. Install from python.org and re-run."); }
}
ok(`Python available (${py})`);

// 2. Venv
step(2, "Checking Python venv at backend/.venv…");
if (!fs.existsSync(venvPython)) {
  warn("venv missing — creating…");
  run(`cd "${BACKEND}" && ${py} -m venv .venv`);
  ok("venv created");
} else { ok("venv exists"); }

// 3. Python deps
step(3, "Checking Python deps from requirements.txt…");
run(`"${venvPython}" -m pip install --quiet --disable-pip-version-check -r "${REQUIREMENTS}"`);
ok("deps up-to-date (or freshly installed)");

// 4. Default phrases + Cornell corpus
step(4, "Checking default phrases + Cornell corpus…");
if (fs.existsSync(DEFAULTS)) {
  const size = fs.statSync(DEFAULTS).size;
  ok(`default phrases present (${(size / 1024).toFixed(1)} KB)`);
} else {
  fail(`default phrases missing at ${path.relative(ROOT, DEFAULTS)} — repo is broken`);
}
if (skipCorpus) {
  info("corpus skipped (--no-corpus)");
} else if (!fs.existsSync(CORNELL)) {
  warn(`Corpus not found at ${path.relative(ROOT, CORNELL)}`);
  info("Download from: https://www.cs.cornell.edu/~cristian/Cornell_Movie-Dialogs_Corpus.html");
  info("Extract movie_lines.txt into data/cornell/ — then re-run `npm run dev`.");
  warn("Continuing without corpus — model still ships with default phrases.");
} else {
  const size = fs.statSync(CORNELL).size;
  ok(`corpus present (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

// 5. Trained model
step(5, "Checking trained model…");
if (forceTrain && fs.existsSync(MODEL)) {
  warn("--retrain flag set, deleting old model…");
  fs.unlinkSync(MODEL);
}
if (!fs.existsSync(MODEL)) {
  warn("model.pkl missing — training (one-time, <10s)…");
  run(`cd "${BACKEND}" && "${venvPython}" train.py`);
  ok("model trained");
} else {
  const size = fs.statSync(MODEL).size;
  ok(`model present (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

console.log(`\n${g("✓ Bootstrap complete.")} Starting services…\n`);
