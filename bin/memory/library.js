"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const recent = require("./recent.js");
const queue = require("./queue.js");

function scan({ workspace, scope = "all" } = {}) {
  if (!["all", "user", "project"].includes(scope)) store.fail("INVALID_SCOPE", "Use all, user or project");
  const workspaces = scope === "user" ? [] : workspace ? [fs.realpathSync(workspace)] : queue.knownWorkspaces();
  const roots = [
    ...(scope !== "project" ? [{ scope: "user", workspace: null }] : []),
    ...(scope !== "user" ? workspaces.map(project => ({ scope: "project", workspace: project })) : []),
  ];
  const records = [], groups = [], unavailable = [];
  for (const selected of roots) {
    let root;
    try { root = store.rootFor(selected); }
    catch (error) {
      if (workspace || error.code !== "ENOENT") throw error;
      const problem = { workspace: selected.workspace, error: "工作区已不存在，未读取其当前记忆。" };
      unavailable.push(problem);
      groups.push({ ...selected, total: null, items: [], error: problem.error });
      continue;
    }
    const items = [];
    for (const entry of store.entries(root)) {
      if (!entry.exists) continue;
      const { id, title, summary, hash, updated } = entry;
      items.push({ id, title, summary, hash, updated, ...selected, special: recent.kind(entry, selected.scope) });
    }
    items.sort((a, b) => b.updated.localeCompare(a.updated) || a.id.localeCompare(b.id));
    groups.push({ ...selected, total: items.length, items });
    records.push(...items);
  }
  // Keep workspace groups contiguous across pages; user memory is its own group.
  records.sort((a, b) => (a.scope === "user" ? 0 : 1) - (b.scope === "user" ? 0 : 1) || (a.workspace || "").localeCompare(b.workspace || "") || b.updated.localeCompare(a.updated) || a.id.localeCompare(b.id));
  return { records, groups, unavailable };
}

function list({ offset = 0, limit = 20, ...options } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) store.fail("INVALID_PAGE", "Invalid memory page");
  const { records, unavailable } = scan(options);
  return { total: records.length, offset, limit, nextOffset: offset + limit < records.length ? offset + limit : null, items: records.slice(offset, offset + limit), unavailable };
}

function groups(options = {}) {
  const result = scan(options);
  return { items: result.groups, unavailable: result.unavailable };
}

module.exports = { list, groups };
