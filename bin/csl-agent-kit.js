#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const agentHooks = require("../skills/meta/agent-hooks/scripts/agent-hooks.js");

const repoRoot = path.resolve(__dirname, "..");

const targets = {
  cursor: {
    title: "Cursor local plugin",
    description: "Link this package to ~/.cursor/plugins/local/csl.",
    default: false,
    external: false,
    run: installCursor,
  },
  "codex-plugin": {
    title: "Codex plugin",
    description: "Install shared skills and hooks as csl-agent-kit@csl-agent-market.",
    default: true,
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

  if (command === "agent-hooks") {
    process.exit(agentHooks.runCli(args));
  }

  if (command === "install") {
    const options = parseInstallArgs(args);
    const selected = await resolveInstallTargets(options);
    if (options.verbose && !options.json) {
      printInstallHeading(options, options.dryRun ? "install preview" : "installing");
    }
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
    force: false,
    json: false,
    verbose: true,
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
    } else if (arg === "--force") {
      options.force = true;
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
    return Object.entries(targets)
      .filter(([, spec]) => spec.default)
      .map(([name]) => name);
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

  const savedSelection = loadInstallSelection();

  const response = await prompts([
    {
      type: "multiselect",
      name: "selected",
      message: "Select CSL Agent Kit integrations to install",
      hint: "Space to select. Enter to continue.",
      instructions: false,
      choices: buildInstallChoices(savedSelection),
      min: 1,
    },
  ], {
    onCancel: () => {
      die("Install cancelled.");
    },
  });

  const selected = response.selected || [];
  try {
    saveInstallSelection(selected);
  } catch (error) {
    console.error(`Warning: Could not remember install selections: ${error.message}`);
  }
  return selected;
}

function buildInstallChoices(savedSelection) {
  const selected = new Set(savedSelection || Object.entries(targets)
    .filter(([, spec]) => spec.default)
    .map(([name]) => name));
  return Object.entries(targets).map(([name, spec]) => ({
    title: spec.title,
    description: spec.description,
    value: name,
    selected: selected.has(name),
  }));
}

function loadInstallSelection(file = installSelectionFile()) {
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    if (value?.version !== 1 || !Array.isArray(value.selectedTargets)) return null;
    const selected = Object.keys(targets).filter((name) => value.selectedTargets.includes(name));
    return selected.length > 0 ? selected : null;
  } catch {
    return null;
  }
}

function saveInstallSelection(selectedTargets, file = installSelectionFile()) {
  const selected = Object.keys(targets).filter((name) => selectedTargets.includes(name));
  if (selected.length === 0) throw new Error("No valid install targets were selected.");

  const directory = path.dirname(file);
  const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, selectedTargets: selected }, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function installSelectionFile() {
  const dataDir = process.env.CSL_AGENT_KIT_HOME || path.join(home(), ".csl-agent-kit");
  return path.join(dataDir, "install-selection.json");
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
  const colors = options.verbose && !options.json ? createColors(options.colorMode) : null;
  for (const name of selected) {
    const spec = targets[name];
    if (colors) console.log(`${colors.cyan("→")} ${colors.bold(spec.title)}`);
    try {
      const changes = spec.run(options);
      if (colors) printChangeDetails(flatten(changes).filter((change) => change.action !== "command"), colors);
      results.push({ target: name, ok: true, changes });
    } catch (error) {
      if (colors) console.log(colors.red(`    ✗ ${error.message}`));
      results.push({ target: name, ok: false, error: error.message });
    }
  }
  return results;
}

function installCursor(options) {
  return [ensureSymlink(path.join(home(), ".cursor/plugins/local/csl"), repoRoot, options)];
}

function installCodexPlugin(options) {
  if (!options.dryRun && !hasCommand("codex")) {
    return [{ action: "skip", reason: "Codex CLI not found", command: "codex" }];
  }
  const changes = runCommands([
    ["codex", ["plugin", "remove", "csl-agent-kit@csl-agent-market", "--json"], true],
    ["codex", ["plugin", "remove", "csl@CSL", "--json"], true],
    ["codex", ["plugin", "remove", "csl@csl", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "csl-agent-market", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "CSL", "--json"], true],
    ["codex", ["plugin", "marketplace", "remove", "csl", "--json"], true],
    ["codex", ["plugin", "marketplace", "add", repoRoot, "--json"], false],
    ["codex", ["plugin", "add", "csl-agent-kit@csl-agent-market", "--json"], false],
  ], options);
  return [...changes, ...removeLegacyCodexSkillLinks(options)];
}

const PI_AGENTS_SOURCE_DIR = path.join(repoRoot, "references", "agents");
const PI_AGENTS_TARGET_DIR = path.join(home(), ".pi", "agent", "agents");

function installPi(options) {
  if (!options.dryRun && !hasCommand("pi")) {
    return [{ action: "skip", reason: "Pi CLI not found", command: "pi" }];
  }
  const changes = runCommands([["pi", ["install", repoRoot], false]], options);

  // Symlink carrier agents (references/agents/*.md) into Pi's user agent dir so
  // the `subagent` tool can spawn them by name. Role definitions are passed
  // inline via the task prompt, so only minimal carrier agents are needed.
  let agentFiles = [];
  try {
    agentFiles = fs.readdirSync(PI_AGENTS_SOURCE_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    // no references/agents directory — nothing to link
  }
  for (const file of agentFiles) {
    const source = path.join(PI_AGENTS_SOURCE_DIR, file);
    const target = path.join(PI_AGENTS_TARGET_DIR, file);
    changes.push(linkAgentInstruction(target, source, options));
  }
  return changes;
}

function linkAgentInstruction(target, source, options) {
  const sourceReal = fs.realpathSync(source);
  const parent = path.dirname(target);
  const change = { action: "symlink", target, source: sourceReal };

  if (options.dryRun) {
    if (isSymlink(target)) {
      const linked = fs.readlinkSync(target);
      const linkedPath = path.isAbsolute(linked) ? linked : path.resolve(parent, linked);
      const linkedReal = fs.existsSync(linkedPath) ? fs.realpathSync(linkedPath) : linkedPath;
      if (linkedReal === sourceReal) return { action: "unchanged", target, source: sourceReal, dryRun: true };
      if (options.force) return { ...change, dryRun: true, relinked: true, forced: true };
      return { action: "skip", reason: "Existing symlink points elsewhere (use --force to override)", target, dryRun: true };
    }
    if (fs.existsSync(target)) {
      if (options.force) return { ...change, dryRun: true, backup: `${target}.backup-<ts>` };
      return { action: "skip", reason: "Existing file (use --force to back up and replace)", target, dryRun: true };
    }
    return { ...change, dryRun: true };
  }

  fs.mkdirSync(parent, { recursive: true });

  if (isSymlink(target)) {
    const linked = fs.readlinkSync(target);
    const linkedPath = path.isAbsolute(linked) ? linked : path.resolve(parent, linked);
    const linkedReal = fs.existsSync(linkedPath) ? fs.realpathSync(linkedPath) : linkedPath;
    if (linkedReal === sourceReal) return { action: "unchanged", target, source: sourceReal };
    if (options.force) {
      fs.unlinkSync(target);
      fs.symlinkSync(sourceReal, target);
      return { ...change, relinked: true, forced: true };
    }
    return { action: "skip", reason: "Existing symlink points elsewhere (use --force to override)", target };
  }

  if (fs.existsSync(target)) {
    if (!options.force) {
      return { action: "skip", reason: "Existing file (use --force to back up and replace)", target };
    }
    const backup = `${target}.backup-${timestamp()}`;
    fs.renameSync(target, backup);
    fs.symlinkSync(sourceReal, target);
    return { ...change, backup };
  }

  fs.symlinkSync(sourceReal, target);
  return change;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function removeLegacyCodexSkillLinks(options) {
  const skillsRoot = fs.realpathSync(path.join(repoRoot, "skills"));
  const legacySkillsDir = path.join(home(), ".agents/skills");
  let legacySkillsStat;
  try {
    legacySkillsStat = fs.lstatSync(legacySkillsDir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  if (legacySkillsStat.isSymbolicLink() || !legacySkillsStat.isDirectory()) return [];

  let entries;
  try {
    entries = fs.readdirSync(legacySkillsDir).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  return entries.flatMap((name) => {
    const target = path.join(legacySkillsDir, name);
    let targetStat;
    try {
      targetStat = fs.lstatSync(target);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    if (!targetStat.isSymbolicLink()) return [];

    const linkedSource = fs.readlinkSync(target);
    const source = path.isAbsolute(linkedSource)
      ? path.normalize(linkedSource)
      : path.resolve(path.dirname(target), linkedSource);
    let resolvedSource;
    try {
      resolvedSource = fs.realpathSync(target);
    } catch {
      resolvedSource = null;
    }
    if (!isWithin(skillsRoot, source) && !isWithin(skillsRoot, resolvedSource)) return [];

    const change = { action: "remove", target, source };
    if (options.dryRun) return [{ ...change, dryRun: true }];
    fs.unlinkSync(target);
    return [change];
  });
}

function isWithin(root, candidate) {
  if (!candidate) return false;
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
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
  const colors = options.verbose && !options.json ? createColors(options.colorMode) : null;
  for (const [cmd, args, allowFailure] of commands) {
    const rendered = [cmd, ...args].join(" ");
    const change = { action: "command", command: rendered, ...(options.dryRun ? { dryRun: true } : {}) };
    if (colors) printChangeDetails([change], colors);
    if (options.dryRun) {
      changes.push(change);
      continue;
    }
    const result = spawnSync(cmd, args, { cwd: repoRoot, encoding: "utf8" });
    if (result.status !== 0 && !allowFailure) {
      throw new Error(`${rendered} failed: ${result.stderr || result.stdout || `exit ${result.status}`}`.trim());
    }
    changes.push({ ...change, status: result.status });
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
  if (!options.verbose) {
    printInstallHeading(options, options.dryRun ? "install preview" : "install complete");
  }

  for (const result of results) {
    const title = targets[result.target].title.padEnd(titleWidth);
    if (!result.ok) {
      console.log(`${colors.red("✗")} ${colors.bold(title)}  ${colors.red(result.error)}`);
      continue;
    }

    const changes = flatten(result.changes);
    console.log(`${colors.green("✓")} ${colors.bold(title)}  ${colors.green(summarizeChanges(changes, options.dryRun))}`);
  }

  const succeeded = results.filter((result) => result.ok).length;
  const failed = results.length - succeeded;
  const completion = `${failed === 0 ? "Done" : "Finished with errors"} · ${succeeded}/${results.length} integrations ready${failed ? ` · ${failed} failed` : ""}`;
  console.log(`\n${failed === 0 ? colors.green(completion) : colors.red(completion)}\n`);
}

function printInstallHeading(options, phase) {
  const colors = createColors(options.colorMode);
  console.log(`\n${colors.bold(colors.cyan("CSL Agent Kit"))} ${colors.dim("·")} ${colors.cyan(phase)}\n`);
}

function summarizeChanges(changes, dryRun) {
  const counts = changes.reduce((summary, change) => {
    summary[change.action] = (summary[change.action] || 0) + 1;
    return summary;
  }, {});
  const parts = [];

  if (counts.symlink) {
    const relinked = changes.filter((c) => c.action === "symlink" && c.relinked).length;
    const backed = changes.filter((c) => c.action === "symlink" && c.backup).length;
    const notes = [];
    if (relinked) notes.push(`${relinked} ${plural(relinked, "link")} ${dryRun ? "would be " : ""}relinked`);
    if (backed) notes.push(`${backed} ${plural(backed, "file")} backed up`);
    parts.push(`${counts.symlink} ${plural(counts.symlink, "link")} ${dryRun ? "planned" : "updated"}${notes.length ? ` (${notes.join(", ")})` : ""}`);
  }
  if (counts.unchanged) parts.push(`${counts.unchanged} up to date`);
  if (counts.command) parts.push(`${counts.command} ${plural(counts.command, "command")} ${dryRun ? "planned" : "completed"}`);
  if (counts.remove) parts.push(`${counts.remove} legacy ${plural(counts.remove, "link")} ${dryRun ? "planned for removal" : "removed"}`);
  if (counts.skip) parts.push(`${counts.skip} skipped`);

  return parts.join(" · ") || "no changes";
}

function printChangeDetails(changes, colors) {
  for (const change of changes) {
    if (change.action === "symlink") console.log(colors.dim(`    ↳ ${change.target} → ${change.source}${change.forced ? " (force-relinked)" : change.relinked ? " (relinked)" : ""}${change.backup ? ` (backed up to ${change.backup})` : ""}`));
    if (change.action === "unchanged") console.log(colors.dim(`    ↳ ${change.target} (up to date)`));
    if (change.action === "command") console.log(colors.dim(`    ↳ ${change.command}${change.dryRun ? " (dry run)" : ""}`));
    if (change.action === "remove") console.log(colors.dim(`    ↳ remove ${change.target} → ${change.source}${change.dryRun ? " (dry run)" : ""}`));
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
  console.log(`CSL Agent Kit CLI\n\nUsage:\n  csl-agent-kit install [options]\n  csl-agent-kit agent-hooks <command> [options]\n\nRun \"csl-agent-kit install --help\" or \"csl-agent-kit agent-hooks help\" for details.`);
}

function printInstallHelp() {
  console.log(`Usage:\n  csl-agent-kit install\n  csl-agent-kit install --target cursor,codex-plugin\n  csl-agent-kit install --all --dry-run\n\nTargets:\n${Object.entries(targets).map(([name, spec]) => `  ${name.padEnd(14)} ${spec.description}`).join("\n")}\n\nOptions:\n  --target <list>     Comma-separated target list.\n  --all               Select every target.\n  --yes, -y           Select default targets without prompting.\n  --force             Allow supported links to replace existing files or symlinks.\n  --dry-run           Print planned actions without changing files.\n  --verbose, -v       Show detailed progress (already the default).\n  --color             Force ANSI colors.\n  --no-color          Disable ANSI colors.\n  --json              Print machine-readable result JSON.\n`);
}

function die(message) {
  console.error(`Error: ${message}`);
  process.exit(2);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildInstallChoices,
  loadInstallSelection,
  saveInstallSelection,
};
