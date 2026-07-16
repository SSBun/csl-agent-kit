#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "../../../..");
const defaultSkillsRoot = path.join(repoRoot, "skills");

function main(args) {
  const options = parseArgs(args);
  if (options.help) {
    printHelp();
    return 0;
  }

  ensureGit();
  const skills = discoverThirdPartySkills(options.skillsRoot);
  if (options.command === "status") return printStatus(skills);
  return printDiff(findSkill(skills, options.skillName), options.patch);
}

function parseArgs(args) {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "-h") return { help: true };
  if (!["status", "diff"].includes(command)) throw new Error(`Unknown subcommand: ${command}`);

  const options = { command, help: false, patch: false, skillName: null, skillsRoot: defaultSkillsRoot };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--patch") {
      if (command !== "diff") throw new Error("--patch is only valid for diff.");
      options.patch = true;
    } else if (arg === "--skills-root") {
      index += 1;
      if (!rest[index]) throw new Error("--skills-root requires a path.");
      options.skillsRoot = path.resolve(rest[index]);
    } else if (!arg.startsWith("-") && command === "diff" && !options.skillName) {
      options.skillName = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (command === "diff" && !options.skillName) throw new Error("diff requires a skill name.");
  return options;
}

function discoverThirdPartySkills(skillsRoot) {
  if (!fs.existsSync(skillsRoot)) throw new Error(`Skills root does not exist: ${skillsRoot}`);
  const skills = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(directory, entry.name);
      const metadataPath = path.join(skillPath, ".repository.json");
      if (fs.existsSync(metadataPath)) {
        if (!fs.existsSync(path.join(skillPath, "SKILL.md"))) {
          throw new Error(`Metadata without SKILL.md: ${metadataPath}`);
        }
        skills.push({
          metadata: readMetadata(metadataPath),
          name: entry.name,
          path: skillPath,
          relativePath: path.relative(skillsRoot, skillPath),
        });
      } else {
        visit(skillPath);
      }
    }
  }

  visit(skillsRoot);
  return skills.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function readMetadata(metadataPath) {
  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${metadataPath}: ${error.message}`);
  }

  for (const field of ["repository", "sourcePath", "ref", "commit", "license", "upstreamStatus"]) {
    if (typeof metadata[field] !== "string" || !metadata[field].trim()) {
      throw new Error(`Missing ${field} in ${metadataPath}`);
    }
  }
  if (!/^[0-9a-f]{40}$/i.test(metadata.commit)) {
    throw new Error(`commit must be a full Git SHA in ${metadataPath}`);
  }
  const sourcePath = path.posix.normalize(metadata.sourcePath.replaceAll("\\", "/"));
  if (sourcePath === "." || sourcePath === ".." || sourcePath.startsWith("../") || path.posix.isAbsolute(sourcePath)) {
    throw new Error(`sourcePath must stay inside its repository in ${metadataPath}`);
  }
  metadata.sourcePath = sourcePath;
  return metadata;
}

function printStatus(skills) {
  const groups = new Map();
  const statuses = new Map();
  let failures = 0;

  for (const skill of skills) {
    const key = `${skill.metadata.repository}\0${skill.metadata.ref}`;
    const group = groups.get(key) || [];
    group.push(skill);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    try {
      for (const [skillPath, status] of inspectStatusGroup(group)) statuses.set(skillPath, status);
    } catch (error) {
      for (const skill of group) statuses.set(skill.path, { error: error.message });
    }
  }

  console.log(`Third-party skills: ${skills.length}`);
  for (const skill of skills) {
    const status = statuses.get(skill.path);
    if (status.error) {
      failures += 1;
      console.log(`${skill.relativePath}  error: ${status.error}`);
      continue;
    }
    console.log(`${skill.relativePath}  ${status.state}  ${shortSha(skill.metadata.commit)} -> ${shortSha(status.commit)}`);
  }
  return failures === 0 ? 0 : 1;
}

function inspectStatusGroup(skills) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "csl-third-party-skills-"));
  try {
    const checkout = path.join(temporary, "upstream");
    const { repository, ref } = skills[0].metadata;
    // ponytail: clone once per repository/ref so imported commits are available; add a cache if large sources make status slow.
    runGit(["clone", "--quiet", "--no-checkout", repository, checkout]);
    runGit(["-C", checkout, "checkout", "--quiet", ref]);
    const upstreamCommit = runGit(["-C", checkout, "rev-parse", "HEAD"]).stdout.trim();
    const statuses = new Map();

    for (const skill of skills) {
      let state = "up to date";
      if (upstreamCommit !== skill.metadata.commit) {
        if (!hasCommit(checkout, skill.metadata.commit)) {
          state = "revision changed; imported commit unavailable";
        } else {
          const result = runGit([
            "-C", checkout, "diff", "--quiet", "--no-ext-diff",
            skill.metadata.commit, upstreamCommit, "--", skill.metadata.sourcePath,
          ], true);
          if (result.status === 1) state = "upstream changed";
          else if (result.status !== 0) throw new Error(formatGitFailure(["diff", skill.metadata.sourcePath], result));
          else state = "skill unchanged";
        }
      }
      statuses.set(skill.path, { commit: upstreamCommit, state });
    }
    return statuses;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function printDiff(skill, patch) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "csl-third-party-skills-"));
  try {
    const checkout = path.join(temporary, "upstream");
    const localCopy = path.join(temporary, "local");
    runGit(["clone", "--quiet", "--no-checkout", skill.metadata.repository, checkout]);
    runGit(["-C", checkout, "checkout", "--quiet", skill.metadata.ref]);

    const upstreamCommit = runGit(["-C", checkout, "rev-parse", "HEAD"]).stdout.trim();
    const upstreamPath = resolveWithin(checkout, skill.metadata.sourcePath, "sourcePath");
    if (!fs.existsSync(upstreamPath)) {
      throw new Error(`Upstream path does not exist at ${skill.metadata.ref}: ${skill.metadata.sourcePath}`);
    }

    console.log(`${skill.relativePath}`);
    console.log(`  imported: ${skill.metadata.commit}`);
    console.log(`  upstream: ${upstreamCommit} (${skill.metadata.ref})`);

    if (hasCommit(checkout, skill.metadata.commit)) {
      printGitDiff("Upstream changes since import", [
        "-C", checkout, "diff", "--no-ext-diff", ...(patch ? [] : ["--stat"]),
        skill.metadata.commit, upstreamCommit, "--", skill.metadata.sourcePath,
      ]);
    } else {
      console.log("\nUpstream changes since import:\n  (imported commit is unavailable from this ref)");
    }

    fs.cpSync(skill.path, localCopy, { recursive: true });
    fs.rmSync(path.join(localCopy, ".repository.json"), { force: true });
    printGitDiff("Local difference from upstream", [
      "diff", "--no-index", "--no-ext-diff", "--src-prefix=upstream/", "--dst-prefix=local/",
      ...(patch ? [] : ["--stat"]), upstreamPath, localCopy,
    ]);
    return 0;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function findSkill(skills, name) {
  const matches = skills.filter((skill) => skill.name === name);
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw new Error(`Unknown third-party skill: ${name}`);
  throw new Error(`Ambiguous third-party skill ${name}: ${matches.map((skill) => skill.relativePath).join(", ")}`);
}

function hasCommit(checkout, commit) {
  return runGit(["-C", checkout, "cat-file", "-e", `${commit}^{commit}`], true).status === 0;
}

function printGitDiff(title, args) {
  const result = runGit(args, true);
  if (result.status > 1) throw new Error(formatGitFailure(args, result));
  console.log(`\n${title}:`);
  process.stdout.write(result.stdout.trimEnd() ? `${result.stdout.trimEnd()}\n` : "  (none)\n");
}

function resolveWithin(root, relativePath, label) {
  if (path.isAbsolute(relativePath)) throw new Error(`${label} must be relative: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`${label} escapes its repository: ${relativePath}`);
  return resolved;
}

function ensureGit() {
  const result = runGit(["--version"], true);
  if (result.status !== 0) throw new Error("git is required to inspect third-party skills.");
}

function runGit(args, allowFailure = false) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (result.error) throw new Error(`Could not run git: ${result.error.message}`);
  if (!allowFailure && result.status !== 0) throw new Error(formatGitFailure(args, result));
  return { status: result.status ?? 1, stderr: result.stderr || "", stdout: result.stdout || "" };
}

function formatGitFailure(args, result) {
  return `git ${args.join(" ")} failed: ${(result.stderr || result.stdout || `exit ${result.status}`).trim()}`;
}

function shortSha(commit) {
  return commit.slice(0, 12);
}

function printHelp() {
  console.log(`Usage:\n  node .agents/skills/integrate-third-skills/scripts/third-party-skills.js status [--skills-root <path>]\n  node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff <skill-name> [--patch] [--skills-root <path>]`);
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
