"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const runtime = require("./runtime-files.js");
const store = require("./store.js");

const DEFAULT_PORT = 47831;

function valid(value, schema) {
  return value?.schema === schema && Number.isInteger(value.port) && value.port >= 1 && value.port <= 65535 &&
    typeof value.token === "string" && /^[a-f0-9]{64}$/.test(value.token);
}

function readRecord(file) {
  try { return runtime.read(file); }
  catch (error) {
    if (error instanceof SyntaxError) store.fail("INVALID_ENDPOINT", `${file} is not valid JSON; inspect locally without sharing its credential`);
    throw error;
  }
}

// Separate durable endpoint identity from the ephemeral running-process descriptor.
// Existing installations retain their current port and credential on first restart.
function resolve() {
  const release = runtime.acquire("endpoint.lock");
  try {
    const saved = readRecord("endpoint.json");
    if (saved !== null || fs.existsSync(runtime.file("endpoint.json"))) {
      if (!valid(saved, "csl-memory-endpoint/v1")) store.fail("INVALID_ENDPOINT", "Invalid saved Memory endpoint; inspect endpoint.json without sharing its credential");
      return saved;
    }
    const previous = readRecord("daemon.json");
    if ((previous !== null || fs.existsSync(runtime.file("daemon.json"))) && !valid(previous, "csl-memory-daemon/v1")) store.fail("INVALID_ENDPOINT", "Invalid previous Memory descriptor; cannot safely preserve endpoint identity");
    const endpoint = {
      schema: "csl-memory-endpoint/v1",
      port: previous?.port ?? DEFAULT_PORT,
      token: previous?.token ?? crypto.randomBytes(32).toString("hex"),
    };
    runtime.write("endpoint.json", endpoint);
    return endpoint;
  } finally { release(); }
}

module.exports = { resolve };
