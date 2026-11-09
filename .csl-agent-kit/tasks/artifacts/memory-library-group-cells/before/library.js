"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const queue = require("./queue.js");

function list({ workspace, scope = "all", offset = 0, limit = 20 } = {}) {
  if (!["all", "user", "project"].includes(scope)) store.fail("INVALID_SCOPE", "Use all, user or project");
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) store.fail("INVALID_PAGE", "Invalid memory page");
  const workspaces = scope === "user" ? [] : workspace ? [fs.realpathSync(workspace)] : queue.knownWorkspaces();
  const roots = [
    ...(scope !== "project" ? [{ scope: "user", workspace: null }] : []),
    ...(scope !== "user" ? workspaces.map(project => ({ scope: "project", workspace: project })) : []),
  ];
  const records = [], unavailable = [];
  for (const selected of roots) {
    let root;
    try { root = store.rootFor(selected); }
    catch (error) {
      if (workspace || error.code !== "ENOENT") throw error;
      unavailable.push({ workspace: selected.workspace, error: "工作区已不存在，未读取其当前记忆。" });
      continue;
    }
    for (const entry of store.entries(root)) {
      if (!entry.exists || entry.deleted) continue;
      const { id, title, summary, type, revision, updated } = entry;
      records.push({ id, title, summary, type, revision, updated, ...selected });
    }
  }
  // Keep workspace groups contiguous across pages; user memory is its own group.
  records.sort((a, b) => (a.scope === "user" ? 0 : 1) - (b.scope === "user" ? 0 : 1) || (a.workspace || "").localeCompare(b.workspace || "") || b.updated.localeCompare(a.updated) || a.id.localeCompare(b.id));
  return { total: records.length, offset, limit, nextOffset: offset + limit < records.length ? offset + limit : null, items: records.slice(offset, offset + limit), unavailable };
}

module.exports = { list };
