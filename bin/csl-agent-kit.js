#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");

const targets = {
  cursor: {
    title: "Cursor local plugin",
    description: "Link this package to ~/.cursor/plugins/local/csl.",
    default: true,
    external: false,
    run: installCursor,
  },
  "codex-skills": {
    title: "Codex skills symlinks",
    description: "Link each skill into ~/.agents/skills/<name>.",
    default: true,
    external: false,
    run: installCodexSkills,
  },
  "repo-link": {
    title: "Repo-local .agents/skills link",
    description: "Create .agents/skills -> ../skills for local tooling.",
    default: true,
    external: false,
    run: installRepoLink,
  },
  "codex-plugin": {
    title: "Codex plugin hooks",
    description: "Install csl-agent-kit@csl-agent-market and remove legacy Codex registrations.",
    default: false,
    external: true,
    run: installCodexPlugin,
  },
  pi: {
    title: "Pi package",
    description: "Run pi install for this package.",
    default: false,
    external: true,
    run: installPi,
  },
};

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);

  if (command === "install") {
    const options = parseInstallArgs(args);
    const selected = await resolveInstallTargets(options);
    const results = installTargets(selected, options);
    if (options.json) {
      console.log(JSON.stringify({ ok: results.every((item) => item.ok), results }, null, 2));
    } else {
      printResults(results, options);
    }
    process.exit(results.every((item) => item.ok) ? 0 : 1);
  }

  printHelp();
}

function parseInstallArgs(args) {
  const options = {
    all: false,
    colorMode: "auto",
    dryRun: false,
    json: false,
    verbose: false,
    yes: false,
    targets: [],
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--all" || arg === "all") {
      options.all = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--color") {
      options.colorMode = "always";
    } else if (arg === "--no-color") {
      options.colorMode = "never";
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--yes" || arg === "-y") {
      options.yes = true;
    } else if (arg === "--target" || arg === "--targets") {
      i += 1;
      if (!args[i]) die("--target requires a comma-separated target list.");
      options.targets.push(...splitTargets(args[i]));
    } else if (arg.startsWith("--target=")) {
      options.targets.push(...splitTargets(arg.slice("--target=".length)));
    } else if (arg === "--help" || arg === "-h") {
      printInstallHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      options.targets.push(...splitTargets(arg));
    } else {
      die(`Unknown install option: ${arg}`);
    }
  }

  return options;
}

function splitTargets(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

async function resolveInstallTargets(options) {
  if (options.all) return Object.keys(targets);
  if (options.targets.length > 0) {
    validateTargets(options.targets);
    return [...new Set(options.targets)];
  }
  if (options.yes) {
    return Object.entries(targets).filter(([, spec]) => spec.default).map(([name]) => name);
  }
  if (!process.stdin.isTTY || process.env.CI) {
    die("Interactive install requires a TTY. Use --target <list>, --all, or --yes.");
  }

  let prompts;
  try {
    prompts = require("prompts");
  } catch {
    die("The prompts dependency is not installed. Run npm install, or use --target/--all for non-interactive install.");
  }

  const response = await prompts([
    {
      type: "multiselect",
      name: "selected",
      message: "Select CSL Agent Kit integrations to install",
      hint: "Space to select. Enter to continue.",
      instructions: false,
      choices: Object.entries(targets).map(([name, spec]) => ({
        title: spec.title,
        description: spec.description,
        value: name,
        selected: spec.default,
      })),
      min: 1,
    },
    {
      type: (previous) => previous?.some((name) => targets[name].external) ? "confirm" : null,
      name: "confirmExternal",
      message: "Selected integrations include external CLI commands. Continue?",
      initial: false,
    },
  ], {
    onCancel: () => {
      die("Install cancelled.");
    },
  });

  const selected = response.selected || [];
  if (selected.some((name) => targets[name].external) && !response.confirmExternal) {
    die("External integrations were not confirmed.");
  }
  return selected;
}

function validateTargets(selected) {
  const valid = new Set(Object.keys(targets));
  for (const target of selected) {
    if (!valid.has(target)) {
      die(`Unknown target: ${target}. Valid targets: ${[...valid].join(", ")}`);
    }
  }
}

function installTargets(selected, options) {
  const results = [];
  for (const name of selected) {
    const spec = targets[name];
    try {
      const changes = spec.run(options);
      results.push({ target: name, ok: true, changes });
    } catch (error) {
      results.push({ target: name, ok: false, error: error.message });
    }
  }
  return results;
}

function installCursor(options) {
  return [ensureSymlink(path.join(home(), ".cursor/plugins/local/csl"), repoRoot, options)];
}

function installCodexSkills(options) {
  const changes = [];
  for (const skill of discoverSkills()) {
    changes.push(ensureSymlink(path.join(home(), ".agents/skills", skill.name), skill.path, options));
  }
  return changes;
}

function installRepoLink(options) {
  return [ensureSymlink(path.join(repoRoot, ".agents/skills"), path.join(repoRoot, "skills"), options)];
}

function installCodexPlugin(options) {
  if (!options.dryRun && !hasCommand("codex")) {
    return [{ action: "skip", reason: "Codex CLI not found", command: "codex" }];
  }
  return runCommands([
    ["codex", ["plugin", "remove", "csl-agent-kit@csl-agent-market", "--json"], true],
    ["codex", ["plugin", "remove", "csl@CSL", "--json"], true],
    ["codex", ["plugin", "remove", "csl@csl", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "csl-agent-market", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "CSL", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "csl", "--json"], true],
    ["codex", ["plugin", "marketplace", "add", repoRoot, "--json"], false],
    ["codex", ["plugin", "add", "csl-agent-kit@csl-agent-market", "--json"], false],
  ], options);
}

function installPi(options) {
  if (!options.dryRun && !hasCommand("pi")) {
    return [{ action: "skip", reason: "Pi CLI not found", command: "pi" }];
  }
  return runCommands([["pi", ["install", repoRoot], false]], options);
}

function discoverSkills() {
  const skillsDir = path.join(repoRoot, "skills");
  return fs.readdirSync(skillsDir)
    .map((name) => ({ name, path: path.join(skillsDir, name) }))
    .filter((skill) => fs.statSync(skill.path).isDirectory())
    .filter((skill) => fs.existsSync(path.join(skill.path, "SKILL.md")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function ensureSymlink(target, source, options) {
  const sourceReal = fs.realpathSync(source);
  const parent = path.dirname(target);
  const change = { action: "symlink", target, source: sourceReal };

  if (options.dryRun) return { ...change, dryRun: true };

  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(target) || isSymlink(target)) {
    if (!isSymlink(target)) {
      throw new Error(`${target} already exists and is not a symlink.`);
    }
    const current = fs.readlinkSync(target);
    const currentPath = path.isAbsolute(current) ? current : path.resolve(parent, current);
    const currentReal = fs.existsSync(currentPath) ? fs.realpathSync(currentPath) : currentPath;
    if (currentReal === sourceReal) {
      return { action: "unchanged", target, source: sourceReal };
    }
    fs.unlinkSync(target);
  }

  fs.symlinkSync(sourceReal, target);
  return change;
}

function isSymlink(target) {
  try {
    return fs.lstatSync(target).isSymbolicLink();
  } catch {
    return false;
  }
}

function runCommands(commands, options) {
  const changes = [];
  for (const [cmd, args, allowFailure] of commands) {
    const rendered = [cmd, ...args].join(" ");
    if (options.dryRun) {
      changes.push({ action: "command", command: rendered, dryRun: true });
      continue;
    }
    const result = spawnSync(cmd, args, { cwd: repoRoot, encoding: "utf8" });
    if (result.status !== 0 && !allowFailure) {
      throw new Error(`${rendered} failed: ${result.stderr || result.stdout || `exit ${result.status}`}`.trim());
    }
    changes.push({ action: "command", command: rendered, status: result.status });
  }
  return changes;
}

function hasCommand(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8", stdio: "ignore" });
  return result.status === 0;
}

function home() {
  return os.homedir();
}

function printResults(results, options) {
  const colors = createColors(options.colorMode);
  const titleWidth = Math.max(...results.map((result) => targets[result.target].title.length));
  const phase = options.dryRun ? "install preview" : "install complete";
  console.log(`\n${colors.bold(colors.cyan("CSL Agent Kit"))} ${colors.dim("·")} ${colors.cyan(phase)}\n`);

  for (const result of results) {
    const title = targets[result.target].title.padEnd(titleWidth);
    if (!result.ok) {
      console.log(`${colors.red("✗")} ${colors.bold(title)}  ${colors.red(result.error)}`);
      continue;
    }

    const changes = flatten(result.changes);
    console.log(`${colors.green("✓")} ${colors.bold(title)}  ${colors.green(summarizeChanges(changes, options.dryRun))}`);
    if (options.verbose) printChangeDetails(changes, colors);
  }

  const succeeded = results.filter((result) => result.ok).length;
  const failed = results.length - succeeded;
  const completion = `${failed === 0 ? "Done" : "Finished with errors"} · ${succeeded}/${results.length} integrations ready${failed ? ` · ${failed} failed` : ""}`;
  console.log(`\n${failed === 0 ? colors.green(completion) : colors.red(completion)}\n`);
}

function summarizeChanges(changes, dryRun) {
  const counts = changes.reduce((summary, change) => {
    summary[change.action] = (summary[change.action] || 0) + 1;
    return summary;
  }, {});
  const parts = [];

  if (counts.symlink) parts.push(`${counts.symlink} ${plural(counts.symlink, "link")} ${dryRun ? "planned" : "updated"}`);
  if (counts.unchanged) parts.push(`${counts.unchanged} up to date`);
  if (counts.command) parts.push(`${counts.command} ${plural(counts.command, "command")} ${dryRun ? "planned" : "completed"}`);
  if (counts.skip) parts.push(`${counts.skip} skipped`);

  return parts.join(" · ") || "no changes";
}

function printChangeDetails(changes, colors) {
  for (const change of changes) {
    if (change.action === "symlink") console.log(colors.dim(`    ↳ ${change.target} → ${change.source}`));
    if (change.action === "unchanged") console.log(colors.dim(`    ↳ ${change.target} (up to date)`));
    if (change.action === "command") console.log(colors.dim(`    ↳ ${change.command}${change.dryRun ? " (dry run)" : ""}`));
    if (change.action === "skip") console.log(colors.yellow(`    ↳ skipped: ${change.reason}`));
  }
}

function createColors(mode) {
  const enabled = mode === "always" || (mode === "auto" && !("NO_COLOR" in process.env));
  const paint = (code) => (text) => enabled ? `\u001b[${code}m${text}\u001b[0m` : text;
  return {
    bold: paint(1),
    cyan: paint(36),
    dim: paint(2),
    green: paint(32),
    red: paint(31),
    yellow: paint(33),
  };
}

function plural(count, word) {
  return count === 1 ? word : `${word}s`;
}

function flatten(value) {
  return Array.isArray(value) ? value.flatMap(flatten) : [value];
}

function printHelp() {
  console.log(`CSL Agent Kit CLI\n\nUsage:\n  csl-agent-kit install [options]\n\nRun \"csl-agent-kit install --help\" for install options.`);
}

function printInstallHelp() {
  console.log(`Usage:\n  csl-agent-kit install\n  csl-agent-kit install --target cursor,codex-skills\n  csl-agent-kit install --all --dry-run\n\nTargets:\n${Object.entries(targets).map(([name, spec]) => `  ${name.padEnd(14)} ${spec.description}`).join("\n")}\n\nOptions:\n  --target <list>  Comma-separated target list.\n  --all            Select every target.\n  --yes, -y        Select default local targets without prompting.\n  --dry-run        Print planned actions without changing files.\n  --verbose, -v    Show underlying paths and commands.\n  --color          Force ANSI colors.\n  --no-color       Disable ANSI colors.\n  --json           Print machine-readable result JSON.\n`);
}

function die(message) {
  console.error(`Error: ${message}`);
  process.exit(2);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
