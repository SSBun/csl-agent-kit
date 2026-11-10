"use strict";
// 只核对当前文件与身份清单；不修复、不建库、不写知识或历史副本。
const fs = require("node:fs");
const path = require("node:path");
const kit = "/Users/caishilin/Desktop/personal/skills";
const s = require(kit + "/bin/memory/store.js");
const m = require(kit + "/bin/memory/migration.js");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "current-identities.json"), "utf8"));
let files = 0;
for (const scope of manifest.scopes) {
  const o = { scope: scope.scope, workspace: scope.workspace };
  if (s.rootFor(o) !== scope.root) throw new Error("作用域根变化");
  const entries = s.entries(scope.root).filter(e => e.exists);
  if (entries.length !== scope.entries.length) throw new Error("文件集合变化：" + scope.root);
  for (const expected of scope.entries) {
    const actual = entries.find(e => e.id === expected.id);
    if (!actual || actual.hash !== expected.hash || actual.legacy) throw new Error("文件身份变化：" + expected.id);
    s.validateContent({ title: actual.title, summary: actual.summary, body: actual.body }, scope.scope, true, actual.id);
    files++;
  }
  const index = s.inspectIndex(o);
  if (index.state !== "published" || s.hash(s.readOptional(s.safePath(scope.root, "index.md"))) !== scope.indexHash) throw new Error("索引变化：" + scope.root);
  if (index.budget?.overCapacity || index.budget?.oversized?.length || m.preview(o).remove.length) throw new Error("预算或旧内部资料未清理");
}
console.log(JSON.stringify({ scopes: manifest.scopes.length, files, identity: "matched", check: "当前真实文件、字段、日期、预算、索引与旧路径；不是测试套件" }));
