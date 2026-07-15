#!/usr/bin/env node
const { findCandidates, formatCandidates, loadTips, resolveTipsFile } = require("./tips-store.js");

function readStdin() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", () => resolve(input));
    setTimeout(() => resolve(input), 800).unref();
  });
}

async function main() {
  try {
    const raw = await readStdin();
    const data = raw.trim() ? JSON.parse(raw.replace(/^\uFEFF/, "")) : {};
    const prompt = String(data.prompt || "").trim();
    if (!prompt) return;
    const tipsFile = resolveTipsFile();
    const output = formatCandidates(findCandidates(prompt, loadTips(tipsFile)), tipsFile);
    if (output) console.log(output);
  } catch {
    // Hook output is advisory; malformed user data must not block the session.
  }
}

if (require.main === module) {
  main();
}
