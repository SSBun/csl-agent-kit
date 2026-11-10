"use strict";
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const kit = "/Users/caishilin/Desktop/personal/skills";
const storage = require(kit + "/skills/meta/csl-tasks/shared/lib/task-storage.js");
const core = require(kit + "/skills/meta/csl-tasks/shared/lib/task-core.js");
const migration = require(kit + "/skills/meta/csl-tasks/shared/scripts/migrate-task-storage.js");
const workspace = "/Users/caishilin/Desktop/personal/MyTwitter";
const manifest = storage.manifest(workspace);
const observed = migration.inventory(workspace, storage.TARGET);
if (observed.files.length !== manifest.files.length) throw new Error("迁移文件集合数量变化");
for (const file of manifest.files) {
  const actual = observed.files.find(item => item.source === file.target);
  if (!actual || actual.beforeHash !== file.afterHash || actual.mode !== file.mode || actual.size !== file.afterSize) throw new Error("迁移文件变化：" + file.target);
  const retained = path.join(workspace, ".csl-agent-kit/migrations/task-storage-20261110/retired-tasks", file.source.slice(6));
  if (storage.hash(fs.readFileSync(retained)) !== file.beforeHash) throw new Error("恢复原树不匹配");
}
if (fs.existsSync(path.join(workspace, "tasks"))) throw new Error("旧根复生");
const current = core.readTask(workspace, "target-engagement-50-current");
const state = JSON.parse(cp.execFileSync(process.execPath, ["scripts/x-target-runtime.mjs", "validate"], { cwd: workspace, encoding: "utf8" }));
const legacyProblems = [];
for (const file of manifest.files.filter(f => /^tasks\/tasks\/[^/]+\.md$/.test(f.source))) {
  try { core.readTask(workspace, path.basename(file.source, ".md")); }
  catch (error) {
    const original = fs.readFileSync(path.join(workspace, ".csl-agent-kit/migrations/task-storage-20261110/retired-tasks", file.source.slice(6)), "utf8");
    try { core.parseTask(path.basename(file.source, ".md"), original); }
    catch (before) { legacyProblems.push({ file: file.source, before: before.message, after: error.message }); continue; }
    throw new Error("迁移新增解析失败：" + file.source);
  }
}
console.log(JSON.stringify({ files: observed.files.length, fullHashesAndModes: "matched", oldRoot: "absent", currentTask: current.id, currentTaskStatus: current.status.state, runtimeValidation: state.schema, ranges: state.ranges.length, legacyProblems }, null, 2));
