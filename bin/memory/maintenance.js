"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const queue = require("./queue.js");

const INTERVAL = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 8;

// Pending events prevent duplicate sweeps; the latest successful cursor survives
// retirement without retaining every completed maintenance event.
function schedule(items, now = Date.now()) {
  const workspaces = queue.knownWorkspaces();
  const errors = [];
  for (const workspace of workspaces) {
    try {
      if (!fs.statSync(workspace).isDirectory()) continue;
      if (items.some(({ event, state }) => event.workspace === workspace && ["queued", "running", "failed", "interrupted", "untracked"].includes(state.status) && !event.maintenance)) continue;
      if (items.some(({ event, state }) => event.workspace === workspace && event.maintenance && ["queued", "running", "untracked"].includes(state.status))) continue;
      for (const scope of ["user", "project"]) {
        if (items.some(({ event, state }) => event.maintenance?.scope === scope && !["completed", "exhausted"].includes(state.status) && (scope === "user" || event.workspace === workspace))) continue;
        let prior = queue.checkpoint(scope, workspace);
        // Exhausted sweeps advance scheduling, not successful-commit history.
        // Keep the cooldown so the same candidates cannot be retried each tick.
        for (const { event, state } of items) {
          if (event.maintenance?.scope !== scope || state.status !== "exhausted" || scope === "project" && event.workspace !== workspace) continue;
          if (!prior || state.updated > prior.completed) prior = { id: event.id, completed: state.updated, cursor: event.maintenance.ids.at(-1) };
        }
        if (prior && now - Date.parse(prior.completed) < INTERVAL) continue;
        const root = store.rootFor({ scope, workspace });
        if (store.readOptional(store.safePath(root, ".pending.json")) !== null) continue;
        let names;
        try { names = fs.readdirSync(store.safePath(root, "entries")).filter(name => /^[a-z0-9][a-z0-9-]{0,99}\.md$/.test(name)).sort(); }
        catch (error) { if (error.code === "ENOENT") continue; throw error; }
        if (!names.length) continue;
        const cursor = prior?.cursor;
        const remaining = cursor ? names.filter(name => name.slice(0, -3) > cursor) : names;
        const ids = (remaining.length ? remaining : names).slice(0, BATCH_SIZE).map(name => name.slice(0, -3));
        const receipt = queue.enqueue({
          schema: "csl-memory-event/v1", workspace, session: "memory-maintenance", task: null,
          eventKey: `maintenance:${scope}:${prior?.id || "initial"}`,
          maintenance: { scope, ids }, messages: [],
        });
        // Make the new user-scope reservation visible to other workspaces now.
        items.push(queue.get(receipt.id));
        break;
      }
    } catch (error) { errors.push({ workspace, error: `${error.code || "MEMORY_ERROR"}: ${error.message}` }); }
  }
  return errors;
}

function assertUnreferenced(workspace, scope, id) {
  const workspaces = scope === "user" ? [...new Set([workspace, ...queue.knownWorkspaces()])] : [workspace];
  const roots = [{ scope: "user", root: store.rootFor({ scope: "user", workspace }) }, ...workspaces.map(project => ({ scope: "project", root: store.rootFor({ scope: "project", workspace: project }) }))];
  for (const source of roots) {
    if (store.readOptional(store.safePath(source.root, ".pending.json")) !== null) store.fail("MEMORY_REFERENCES_PENDING", "Resolve pending memory writes before retiring a chip");
    for (const entry of store.entries(source.root)) {
      if (entry.deleted || source.scope === scope && entry.id === id) continue;
      if ((entry.retrieval?.links || []).some(link => link.scope === scope && link.id === id)) store.fail("MEMORY_REFERENCED", `Reconcile incoming references before deleting ${scope}/${id}: ${source.scope}/${entry.id}`);
    }
  }
}

module.exports = { schedule, assertUnreferenced, INTERVAL, BATCH_SIZE };
