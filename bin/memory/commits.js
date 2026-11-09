"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const queue = require("./queue.js");

// The committed journal is the only history. A later failed model batch cannot
// hide a successful transaction; no duplicate event/summary archive is needed.
function list({ workspace, scope = "all", session, task, offset = 0, limit = 20 } = {}) {
  if (!["all", "user", "project"].includes(scope)) store.fail("INVALID_SCOPE", "Use all, user or project");
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) store.fail("INVALID_PAGE", "Invalid commit page");
  const workspaces = scope === "user" ? [] : workspace ? [fs.realpathSync(workspace)] : queue.knownWorkspaces();
  const roots = [
    ...(scope !== "project" ? [{ scope: "user", workspace: null }] : []),
    ...(scope !== "user" ? workspaces.map(project => ({ scope: "project", workspace: project })) : []),
  ];
  const records = [];
  const unavailable = [];
  for (const selected of roots) {
    try {
      // Validate the workspace once; a removed registered project must not
      // hide commits from the remaining accessible roots.
      store.rootFor(selected);
    } catch (error) {
      if (workspace || error.code !== "ENOENT") throw error;
      unavailable.push({ workspace: selected.workspace, error: "工作区已不存在，未读取其提交。" });
      continue;
    }
    for (const item of store.historyRecords(selected)) {
      if (item.status !== "committed" || session && item.session !== session || task && item.task !== task) continue;
      records.push({ ...item, ...selected });
    }
  }
  records.sort((a, b) => b.at.localeCompare(a.at) || a.scope.localeCompare(b.scope) || (a.workspace || "").localeCompare(b.workspace || "") || a.id.localeCompare(b.id));
  return { total: records.length, offset, limit, nextOffset: offset + limit < records.length ? offset + limit : null, items: records.slice(offset, offset + limit), unavailable };
}

module.exports = { list };
