"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const markdownRoot = path.dirname(require.resolve("markdown-it/package.json"));
const jsonRoot = path.dirname(require.resolve("json-formatter-js"));
const files = new Map([
  ["/", path.join(__dirname, "web/dashboard.html")],
  ["/dashboard.js", path.join(__dirname, "web/dashboard.js")],
  ["/dashboard.css", path.join(__dirname, "web/dashboard.css")],
  ["/detail-renderer.js", path.join(__dirname, "web/detail-renderer.js")],
  ["/vendor/markdown-it.js", path.join(markdownRoot, "dist/markdown-it.min.js")],
  ["/vendor/json-formatter.js", path.join(jsonRoot, "json-formatter.umd.js")],
]);
// The pinned JSON formatter injects exactly this shipped stylesheet. Permit
// that hash, not arbitrary inline styles or user-authored HTML/styles.
const styleHash = `sha256-${crypto.createHash("sha256").update(fs.readFileSync(path.join(jsonRoot, "json-formatter.css"))).digest("base64")}`;

module.exports = { files, styleHash };
