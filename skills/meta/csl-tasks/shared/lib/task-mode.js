"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");

const MODES = ["confirm", "solo", "inherit"];
const SCOPES = ["session", "project", "global"];

function dataRoot() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function modePaths({ workspace = process.cwd(), host, sessionId } = {}) {
  const root = dataRoot();
  const canonical = fs.realpathSync(workspace);
  return {
    global: path.join(root, "settings.json"),
    project: path.join(root, "projects", digest(canonical), "settings.json"),
    session: typeof host === "string" && host && typeof sessionId === "string" && sessionId
      ? path.join(root, "sessions", digest([host, canonical, sessionId]), "settings.json") : null,
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readDocument(file) {
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
  const value = JSON.parse(raw);
  if (!isRecord(value) || (value.task !== undefined && !isRecord(value.task))) {
    throw new Error(`Invalid task settings document: ${file}`);
  }
  return value;
}

function parseMode(document) {
  const mode = document.task?.mode;
  if (mode === undefined) return "inherit";
  // Read existing preferences without rewriting user files; all new writes use solo.
  if (mode === "autonomous") return "solo";
  if (!MODES.includes(mode)) throw new Error("task.mode must be confirm, solo, or inherit");
  return mode;
}

function resolveTaskMode(options = {}) {
  const paths = modePaths(options);
  const layers = {};
  // Validate every participating layer, even if an override would hide it.
  for (const scope of SCOPES) layers[scope] = paths[scope] ? parseMode(readDocument(paths[scope])) : "inherit";
  const source = SCOPES.find((scope) => layers[scope] !== "inherit") || "default";
  return { mode: source === "default" ? "confirm" : layers[source], source, layers, paths };
}

function saveTaskMode(scope, mode, options = {}) {
  if (!SCOPES.includes(scope)) throw new Error("Scope must be session, project, or global");
  if (!MODES.includes(mode)) throw new Error("Mode must be confirm, solo, or inherit");
  const file = modePaths(options)[scope];
  if (!file) throw new Error("Session scope requires the actual host and session ID; never guess an identity");
  const document = readDocument(file);
  const task = { ...document.task };
  if (mode === "inherit") delete task.mode;
  else task.mode = mode;
  if (Object.keys(task).length) document.task = task;
  else delete document.task;
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    try { fs.unlinkSync(temporary); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return file;
}

function taskModePrompt(options = {}) {
  try {
    const state = resolveTaskMode(options);
    return [
      "## CSL Task Confirmation Mode (runtime configuration)",
      `Effective mode: ${state.mode}; source: ${state.source}.`,
      "This is a confirmation preference, not goal acceptance or expanded authorization. Apply the shared Task Target protocol's Confirmation Modes section. Never change this preference yourself to avoid a hold.",
      state.mode === "solo"
        ? "SOLO: bypass the entire L0-L4 second-confirmation grading path. Display the complete Task Target and execute toward the requested final result in the same turn. Resolve in-scope operational choices yourself using evidence and reasonable bounded defaults, rather than asking what to do next. For authorized publication, deployment, X posts/replies and SOP actions, announce action/object/consequence and continue; framework or SOP safety-confirmation wording alone is not a reason to pause. Keep substantive safeguards, explicit user pauses, host/tool approvals, higher-priority safety constraints, task records, required review and verification. Do not expand the request, invent missing authorization, bypass a real blocker, or resume an old batch merely because mode was queried or changed."
        : "Use the normal Task Target and independent Safety confirmation gates. An earlier SOLO mode does not apply to this turn.",
    ].join("\n");
  } catch (error) {
    return `## CSL Task Confirmation Mode (runtime configuration)\nEffective mode: confirm; source: configuration-error.\nConfiguration could not be resolved (${error.message}). Do not use SOLO mode or stale configuration. Use normal confirmation gates and report the configuration error; do not repair settings without authorization.`;
  }
}

module.exports = { MODES, SCOPES, modePaths, resolveTaskMode, saveTaskMode, taskModePrompt };
