#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const FRONTMATTER_KEYS = new Set(["name", "description", "license", "allowed-tools", "metadata"]);
const RESOURCE_DIRS = ["references", "scripts", "evals", "assets", "templates"];
const TEXT_EXTENSIONS = new Set([".json", ".md", ".txt", ".yaml", ".yml"]);
const INITIAL_TOKEN_LIMIT = 1000;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addIssue(list, code, message, file) {
  list.push({ code, message, ...(file ? { file } : {}) });
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const child = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function parseStructuredFiles(root, failures) {
  const parsed = new Map();
  for (const file of walkFiles(root)) {
    const extension = path.extname(file).toLowerCase();
    if (extension !== ".json" && extension !== ".yaml" && extension !== ".yml") continue;
    const rel = relative(root, file);
    try {
      const text = fs.readFileSync(file, "utf8");
      parsed.set(rel, extension === ".json" ? JSON.parse(text) : YAML.parse(text));
    } catch (error) {
      addIssue(failures, "invalid-structured-file", `Cannot parse ${rel}: ${error.message.split("\n")[0]}`, rel);
      parsed.set(rel, undefined);
    }
  }
  return parsed;
}

function parseFrontmatter(root, skillText, failures) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skillText);
  if (!match) {
    addIssue(failures, "missing-frontmatter", "SKILL.md must start with YAML frontmatter.", "SKILL.md");
    return {};
  }

  let frontmatter;
  try {
    frontmatter = YAML.parse(match[1]);
  } catch (error) {
    addIssue(failures, "invalid-frontmatter", `Cannot parse SKILL.md frontmatter: ${error.message.split("\n")[0]}`, "SKILL.md");
    return {};
  }
  if (!isRecord(frontmatter)) {
    addIssue(failures, "invalid-frontmatter", "SKILL.md frontmatter must be a YAML mapping.", "SKILL.md");
    return {};
  }

  const unexpected = Object.keys(frontmatter).filter((key) => !FRONTMATTER_KEYS.has(key));
  if (unexpected.length > 0) {
    addIssue(failures, "unexpected-frontmatter-key", `Unexpected frontmatter key(s): ${unexpected.sort().join(", ")}.`, "SKILL.md");
  }

  const name = frontmatter.name;
  if (typeof name !== "string" || !name.trim()) {
    addIssue(failures, "invalid-name", "Frontmatter name must be a non-empty string.", "SKILL.md");
  } else {
    const trimmed = name.trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
      addIssue(failures, "invalid-name", "Frontmatter name must use lowercase hyphen-case.", "SKILL.md");
    }
    if (trimmed.length > 64) {
      addIssue(failures, "invalid-name", `Frontmatter name is ${trimmed.length} characters; maximum is 64.`, "SKILL.md");
    }
    if (trimmed !== path.basename(root)) {
      addIssue(failures, "name-directory-mismatch", `Frontmatter name "${trimmed}" does not match directory "${path.basename(root)}".`, "SKILL.md");
    }
  }

  const description = frontmatter.description;
  if (typeof description !== "string" || !description.trim()) {
    addIssue(failures, "invalid-description", "Frontmatter description must be a non-empty string.", "SKILL.md");
  } else {
    if (description.includes("<") || description.includes(">")) {
      addIssue(failures, "invalid-description", "Frontmatter description cannot contain angle brackets.", "SKILL.md");
    }
    if (description.trim().length > 1024) {
      addIssue(failures, "invalid-description", `Frontmatter description is ${description.trim().length} characters; maximum is 1024.`, "SKILL.md");
    }
  }
  return frontmatter;
}

function requireString(value, field, failures, file) {
  if (typeof value !== "string" || !value.trim()) {
    addIssue(failures, "invalid-interface", `Missing or invalid ${field}.`, file);
    return false;
  }
  return true;
}

function validateOpenAiInterface(parsed, failures) {
  const file = "agents/openai.yaml";
  if (!parsed.has(file) || parsed.get(file) === undefined) return;
  const data = parsed.get(file);
  const metadata = isRecord(data) && isRecord(data.interface) ? data.interface : {};
  for (const field of ["display_name", "short_description", "default_prompt"]) {
    requireString(metadata[field], `interface.${field}`, failures, file);
  }
}

function validateResources(root, skillText, failures, warnings) {
  const lowered = skillText.toLowerCase();
  for (const directory of RESOURCE_DIRS) {
    const resourcePath = path.join(root, directory);
    if (!fs.existsSync(resourcePath)) continue;
    if (!fs.statSync(resourcePath).isDirectory()) {
      addIssue(failures, "invalid-resource-directory", `${directory} must be a directory.`, directory);
      continue;
    }
    const files = walkFiles(resourcePath);
    if (files.length === 0) {
      addIssue(warnings, "empty-resource-directory", `${directory}/ exists but is empty.`, `${directory}/`);
      continue;
    }
    const referenced = lowered.includes(`${directory}/`)
      || lowered.includes(directory)
      || files.some((file) => lowered.includes(path.basename(file).toLowerCase()));
    if (!referenced) {
      addIssue(warnings, "unreferenced-resource-directory", `${directory}/ contains files but is not referenced by SKILL.md.`, `${directory}/`);
    }
  }
}

function estimateTokens(text) {
  return Math.max(1, Math.floor(text.length / 4));
}

function contextStats(root, skillText, warnings) {
  let initialLoadTokens = estimateTokens(skillText);
  const agents = path.join(root, "agents");
  for (const file of walkFiles(agents)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    initialLoadTokens += estimateTokens(fs.readFileSync(file, "utf8"));
  }
  if (initialLoadTokens > INITIAL_TOKEN_LIMIT) {
    addIssue(warnings, "context-budget", `Estimated initial-load tokens exceed the ${INITIAL_TOKEN_LIMIT}-token budget: ${initialLoadTokens}.`);
  }
  const lines = skillText.split(/\r?\n/).length;
  if (lines > 300) addIssue(warnings, "long-skill", `SKILL.md has ${lines} lines; consider moving deferred detail into referenced resources.`, "SKILL.md");
  return { estimatedInitialLoadTokens: initialLoadTokens, initialTokenLimit: INITIAL_TOKEN_LIMIT, skillLines: lines };
}

function normalize(text) {
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}_]+/gu, " ").replace(/\s+/g, " ").trim();
}

function phrasePresent(normalizedText, phrase) {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  if (/\p{Script=Han}/u.test(normalizedPhrase)) return normalizedText.includes(normalizedPhrase);
  return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

function conceptHits(text, concepts) {
  const normalized = normalize(text);
  return Object.fromEntries(Object.entries(concepts).filter(([, spec]) => spec.phrases.some((phrase) => phrasePresent(normalized, phrase))));
}

function scorePrompt(description, prompt, config) {
  const positives = config.positive_concepts;
  const negativeHits = Object.values(conceptHits(prompt, config.negative_concepts));
  if (negativeHits.some((spec) => spec.exclusive)) return 0;

  const descriptionHits = Object.keys(conceptHits(description, positives));
  const desired = descriptionHits.length > 0
    ? descriptionHits
    : (config.fallback_positive_concepts || Object.keys(positives));
  const promptHits = conceptHits(prompt, positives);
  const totalWeight = desired.reduce((total, name) => total + positives[name].weight, 0) || 1;
  const matchedWeight = desired
    .filter((name) => promptHits[name])
    .reduce((total, name) => total + positives[name].weight, 0);
  const penalty = negativeHits.reduce((total, spec) => total + spec.weight, 0);
  return Math.max(0, Math.min(1, matchedWeight / totalWeight - penalty));
}

function validateConcepts(config, failures, file) {
  if (!isRecord(config)) {
    addIssue(failures, "invalid-routing-config", `${file} must contain a JSON object.`, file);
    return false;
  }
  let valid = true;
  for (const field of ["positive_concepts", "negative_concepts"]) {
    if (!isRecord(config[field])) {
      addIssue(failures, "invalid-routing-config", `${field} must be an object.`, file);
      valid = false;
      continue;
    }
    for (const [name, spec] of Object.entries(config[field])) {
      if (!isRecord(spec) || !Number.isFinite(spec.weight) || spec.weight < 0 || !Array.isArray(spec.phrases) || spec.phrases.length === 0 || spec.phrases.some((phrase) => typeof phrase !== "string" || !phrase.trim())) {
        addIssue(failures, "invalid-routing-config", `${field}.${name} requires a non-negative weight and non-empty string phrases.`, file);
        valid = false;
      } else if (spec.exclusive !== undefined && typeof spec.exclusive !== "boolean") {
        addIssue(failures, "invalid-routing-config", `${field}.${name}.exclusive must be boolean.`, file);
        valid = false;
      }
    }
  }
  const fallback = config.fallback_positive_concepts;
  if (fallback !== undefined && (!Array.isArray(fallback) || fallback.some((name) => typeof name !== "string" || !config.positive_concepts?.[name]))) {
    addIssue(failures, "invalid-routing-config", "fallback_positive_concepts must reference declared positive concepts.", file);
    valid = false;
  }
  if (isRecord(config.positive_concepts) && Object.keys(config.positive_concepts).length === 0) {
    addIssue(failures, "invalid-routing-config", "positive_concepts must not be empty.", file);
    valid = false;
  }
  return valid;
}

function routingCases(data, failures, file) {
  if (!isRecord(data)) {
    addIssue(failures, "invalid-routing-cases", `${file} must contain a JSON object.`, file);
    return null;
  }
  if (data.recommended_threshold !== undefined && (!Number.isFinite(data.recommended_threshold) || data.recommended_threshold < 0 || data.recommended_threshold > 1)) {
    addIssue(failures, "invalid-routing-cases", "recommended_threshold must be between 0 and 1.", file);
    return null;
  }
  const result = [];
  for (const bucket of ["should_trigger", "should_not_trigger", "near_neighbor"]) {
    const items = data[bucket] || [];
    if (!Array.isArray(items)) {
      addIssue(failures, "invalid-routing-cases", `${bucket} must be an array.`, file);
      return null;
    }
    for (const item of items) {
      const text = typeof item === "string" ? item : isRecord(item) ? item.text : undefined;
      if (typeof text !== "string" || !text.trim()) {
        addIssue(failures, "invalid-routing-cases", `${bucket} contains a case without non-empty text.`, file);
        return null;
      }
      result.push({ bucket, text, expected: bucket === "should_trigger" });
    }
  }
  if (result.length === 0) {
    addIssue(failures, "invalid-routing-cases", "Routing fixtures contain no cases.", file);
    return null;
  }
  return { threshold: data.recommended_threshold ?? 0.48, items: result };
}

function validateRouting(parsed, description, failures) {
  const casesFile = "evals/trigger_cases.json";
  const configFile = "evals/semantic_config.json";
  const hasCases = parsed.has(casesFile);
  const hasConfig = parsed.has(configFile);
  if (!hasCases && !hasConfig) return { configured: false, cases: 0, misfires: 0 };
  if (hasConfig && !hasCases) {
    addIssue(failures, "missing-routing-cases", `${configFile} requires ${casesFile}.`, configFile);
    return { configured: true, cases: 0, misfires: 0 };
  }
  if (parsed.get(casesFile) === undefined) return { configured: hasConfig, cases: 0, misfires: 0 };
  const cases = routingCases(parsed.get(casesFile), failures, casesFile);
  if (!hasConfig || !cases) return { configured: false, cases: cases?.items.length || 0, misfires: 0 };
  if (parsed.get(configFile) === undefined || !validateConcepts(parsed.get(configFile), failures, configFile)) {
    return { configured: true, cases: cases.items.length, misfires: 0 };
  }

  const config = parsed.get(configFile);
  const misfires = cases.items.flatMap((item) => {
    const score = scorePrompt(description, item.text, config);
    const predicted = score >= cases.threshold;
    return predicted === item.expected ? [] : [{ ...item, score: Number(score.toFixed(3)) }];
  });
  if (misfires.length > 0) {
    const examples = misfires.slice(0, 3).map((item) => `${item.bucket} ${JSON.stringify(item.text)} (${item.score})`).join("; ");
    addIssue(failures, "routing-misfire", `Routing evaluation misclassified ${misfires.length} case(s): ${examples}.`, casesFile);
  }
  return { configured: true, cases: cases.items.length, misfires: misfires.length };
}

function checkSkill(skillDir) {
  const root = path.resolve(skillDir);
  const failures = [];
  const warnings = [];
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    addIssue(failures, "missing-skill-directory", "Skill directory does not exist or is not a directory.");
    return finish(root, undefined, failures, warnings, {});
  }

  const skillFile = path.join(root, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    addIssue(failures, "missing-skill-file", "SKILL.md is missing.");
    return finish(root, undefined, failures, warnings, {});
  }

  const skillText = fs.readFileSync(skillFile, "utf8");
  const parsed = parseStructuredFiles(root, failures);
  const frontmatter = parseFrontmatter(root, skillText, failures);
  validateOpenAiInterface(parsed, failures);
  validateResources(root, skillText, failures, warnings);
  const context = contextStats(root, skillText, warnings);
  const routing = validateRouting(parsed, typeof frontmatter.description === "string" ? frontmatter.description : "", failures);
  return finish(root, typeof frontmatter.name === "string" ? frontmatter.name : undefined, failures, warnings, { context, routing });
}

function finish(root, name, failures, warnings, stats) {
  return {
    path: root,
    ...(name ? { name } : {}),
    status: failures.length > 0 ? "failure" : warnings.length > 0 ? "warning" : "pass",
    failures,
    warnings,
    stats,
  };
}

function discoverSkillDirs(root) {
  if (!fs.existsSync(root)) return [];
  if (fs.existsSync(path.join(root, "SKILL.md"))) return [root];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ".git" && entry.name !== "node_modules")
    .flatMap((entry) => discoverSkillDirs(path.join(root, entry.name)));
}

function parseArgs(args) {
  const options = { all: false, color: !Object.hasOwn(process.env, "NO_COLOR"), json: false, workspace: process.cwd(), targets: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--all") options.all = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--no-color") options.color = false;
    else if (arg === "--workspace") {
      index += 1;
      if (!args[index]) throw new Error("--workspace requires a directory.");
      options.workspace = path.resolve(args[index]);
    } else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else options.targets.push(arg);
  }
  if (options.json) options.color = false;
  return options;
}

function usage() {
  return [
    "Usage:",
    "  node check.js <skill-dir> [--json] [--no-color]",
    "  node check.js --all [--workspace <dir>] [--json] [--no-color]",
  ].join("\n");
}

function colorize(enabled, code, text) {
  return enabled ? `\u001b[${code}m${text}\u001b[0m` : text;
}

function printHuman(report, color) {
  const labels = {
    pass: colorize(color, "32;1", "PASS"),
    warning: colorize(color, "33;1", "WARNING"),
    failure: colorize(color, "31;1", "FAILURE"),
  };
  for (const item of report.packages) {
    console.log(`${labels[item.status]} ${item.name || path.basename(item.path)} — ${item.path}`);
    for (const failure of item.failures) console.log(`  ${colorize(color, "31", `failure [${failure.code}]`)} ${failure.message}`);
    for (const warning of item.warnings) console.log(`  ${colorize(color, "33", `warning [${warning.code}]`)} ${warning.message}`);
  }
  console.log(`Summary: ${report.summary.pass} passed, ${report.summary.warning} warning, ${report.summary.failure} failed.`);
}

function runCli(args) {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error(`${error.message}\n${usage()}`);
    return 1;
  }
  if (options.help) {
    console.log(usage());
    return 0;
  }
  if (options.all && options.targets.length > 0 || !options.all && options.targets.length !== 1) {
    console.error(usage());
    return 1;
  }

  const dirs = options.all
    ? [path.join(options.workspace, "skills"), path.join(options.workspace, ".agents", "skills")].flatMap(discoverSkillDirs).sort()
    : [options.targets[0]];
  if (dirs.length === 0) {
    console.error(`No skill packages found under ${options.workspace}.`);
    return 1;
  }

  const packages = dirs.map(checkSkill);
  const summary = { pass: 0, warning: 0, failure: 0 };
  for (const item of packages) summary[item.status] += 1;
  const report = { ok: summary.failure === 0, status: summary.failure > 0 ? "failure" : summary.warning > 0 ? "warning" : "pass", summary, packages };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report, options.color);
  return report.ok ? 0 : 2;
}

module.exports = { checkSkill, discoverSkillDirs, runCli, scorePrompt };

if (require.main === module) process.exitCode = runCli(process.argv.slice(2));
