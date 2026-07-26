const { spawnSync } = require("node:child_process");

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
  console.log(`Skipping Pi tests on Node ${process.versions.node}; Node 22.19+ is required.`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  "--experimental-strip-types",
  "--test",
  "tests/pi-context-hooks.test.mjs",
  "tests/pi-skill-commands.test.mjs",
  "tests/pi-task-overlay.test.mjs",
], { stdio: "inherit" });

process.exit(result.status ?? 1);
