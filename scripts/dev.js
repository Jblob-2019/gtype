// scripts/dev.js
// =====================================================================
// npm run dev entry point:
//   1. Run bootstrap (idempotent: installs deps + trains model if needed)
//   2. Boot backend (uvicorn :4000) + frontend (node :3000) in parallel
//   3. Forward Ctrl+C to both children
// =====================================================================

const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

const isWin = process.platform === "win32";
const venvPython = path.join(BACKEND, ".venv", isWin ? "Scripts" : "bin", "python");
const venvPip = path.join(BACKEND, ".venv", isWin ? "Scripts" : "bin", "pip");
const reqFile = path.join(BACKEND, "requirements.txt");

const BLUE = "\x1b[34m", GREEN = "\x1b[32m", RESET = "\x1b[0m";

function prefix(stream, color, label) {
  let buf = "";
  stream.on("data", (d) => {
    buf += d.toString();
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      process.stdout.write(`${color}[${label}]${RESET} ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buf) process.stdout.write(`${color}[${label}]${RESET} ${buf}\n`);
  });
}

// --- bootstrap (inline, no extra child process) -------------------------
console.log(`${BLUE}[bootstrap]${RESET} checking environment…`);
if (!fs.existsSync(venvPython)) {
  console.log(`${BLUE}[bootstrap]${RESET} creating Python venv…`);
  const r = require("node:child_process").spawnSync("python", ["-m", "venv", path.join(BACKEND, ".venv")], { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status || 1);
}
console.log(`${BLUE}[bootstrap]${RESET} ensuring Python deps…`);
require("node:child_process").spawnSync(`"${venvPython}" -m pip install --quiet --disable-pip-version-check -r "${reqFile}"`, { stdio: "inherit", shell: true });

const MODEL = path.join(BACKEND, "data", "model.pkl");
const CORNELL = path.join(ROOT, "data", "cornell", "movie_lines.txt");
const DEFAULTS = path.join(ROOT, "data", "default_phrases.txt");
if (!fs.existsSync(MODEL)) {
  if (!fs.existsSync(CORNELL)) {
    console.log(`${BLUE}[bootstrap]${RESET} corpus missing — training with default phrases only`);
  }
  console.log(`${BLUE}[bootstrap]${RESET} model.pkl missing — training…`);
  const t = require("node:child_process").spawnSync(`"${venvPython}" train.py`, { cwd: BACKEND, stdio: "inherit", shell: true });
  if (t.status !== 0) process.exit(t.status || 1);
}
console.log(`${BLUE}[bootstrap]${RESET} ready.\n`);

// --- spawn backend + frontend -------------------------------------------
const backend = spawn(`"${venvPython}" -m uvicorn app:app --host 127.0.0.1 --port 4000 --reload`, {
  cwd: BACKEND, shell: true,
});
const frontend = spawn("node server.js", { cwd: FRONTEND, shell: true });

prefix(backend.stdout, BLUE, "backend");
prefix(backend.stderr, BLUE, "backend");
prefix(frontend.stdout, GREEN, "frontend");
prefix(frontend.stderr, GREEN, "frontend");

function kill() {
  backend.kill();
  frontend.kill();
  setTimeout(() => process.exit(0), 300);
}
process.on("SIGINT", kill);
process.on("SIGTERM", kill);
backend.on("exit", (code) => {
  if (code !== 0) console.error(`[backend] exited with code ${code}`);
  kill();
});
frontend.on("exit", (code) => {
  if (code !== 0) console.error(`[frontend] exited with code ${code}`);
  // Frontend exiting 0 = already running on :3000 (handled in server.js), keep backend alive
  if (code === 0) return;
  kill();
});
