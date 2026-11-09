"use strict";

const fs = require("node:fs");
const path = require("node:path");
const store = require("./store.js");

const SCHEMA = "csl-memory-service/v1";

function configFile(options = {}) {
  return store.safePath(store.rootFor({ ...options, scope: "user" }), ".service/settings.json");
}

function parseModel(value) {
  if (typeof value !== "string" || value.length > 300 || /\s|\0/.test(value)) store.fail("INVALID_MODEL", "Use an exact provider/model identifier");
  const separator = value.indexOf("/");
  if (separator < 1 || separator === value.length - 1) store.fail("INVALID_MODEL", "Use an exact provider/model identifier");
  return { provider: value.slice(0, separator), model: value.slice(separator + 1) };
}

function readConfig(options = {}) {
  const raw = store.readOptional(configFile(options));
  if (raw === null) return { schema: SCHEMA, model: null };
  const value = JSON.parse(raw);
  if (!value || value.schema !== SCHEMA || Object.keys(value).some((key) => !["schema", "model"].includes(key))) store.fail("INVALID_CONFIG", "Unsupported Memory service configuration");
  if (value.model !== null) parseModel(value.model);
  return value;
}

function setModel(value, options = {}) {
  if (value !== null) parseModel(value);
  const file = configFile(options);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const lock = store.safePath(store.rootFor({ ...options, scope: "user" }), ".service/settings.lock");
  let fd;
  try { fd = fs.openSync(lock, "wx", 0o600); } catch (error) {
    if (error.code === "EEXIST") store.fail("LOCKED", "Memory service settings are being updated or a stale lock needs inspection");
    throw error;
  }
  try {
    readConfig(options);
    const config = { schema: SCHEMA, model: value };
    store.atomicWrite(file, `${JSON.stringify(config, null, 2)}\n`);
    return { config, source: value === null ? "pi-default" : "memory-override" };
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

async function resolveModel(options = {}) {
  const config = readConfig(options);
  if (config.model !== null) return { ...parseModel(config.model), source: "memory-override" };
  const sdk = await import("@earendil-works/pi-coding-agent");
  // Use Pi's user-level saved default, not a foreground session's transient
  // model, nor project-specific model overrides of an unrelated task.
  const file = path.join(sdk.getAgentDir(), "settings.json");
  const raw = store.readOptional(file);
  const settings = raw === null ? {} : JSON.parse(raw);
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) store.fail("INVALID_CONFIG", "Invalid Pi settings");
  if (typeof settings.defaultProvider !== "string" || typeof settings.defaultModel !== "string") store.fail("MODEL_NOT_CONFIGURED", "Pi has no saved default provider/model; configure Pi or use memory model set");
  const selected = parseModel(`${settings.defaultProvider}/${settings.defaultModel}`);
  if (selected.provider !== settings.defaultProvider || selected.model !== settings.defaultModel) store.fail("INVALID_MODEL", "Invalid Pi provider/model settings");
  return { ...selected, source: "pi-default" };
}

async function run(args, options = {}) {
  const [action = "show", value] = args;
  if (action === "show" && args.length <= 1) return resolveModel(options);
  if (action === "set" && args.length === 2) return setModel(value, options);
  if (action === "reset" && args.length === 1) return setModel(null, options);
  store.fail("INVALID_ARGUMENT", "Use memory model show | set <provider/model> | reset");
}

module.exports = { readConfig, resolveModel, setModel, run };
