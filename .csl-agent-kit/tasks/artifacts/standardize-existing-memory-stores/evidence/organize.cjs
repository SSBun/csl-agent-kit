"use strict";
// 按本次人工核对的分组执行先写、回读、再删；不存正文副本。
const kit = "/Users/caishilin/Desktop/personal/skills";
const s = require(kit + "/bin/memory/store.js");
const q = require(kit + "/bin/memory/queue.js");
const recent = require(kit + "/bin/memory/recent.js");
module.exports = function organize(workspace, groups) {
  const o = { scope: "project", workspace }, root = s.rootFor(o);
  const all = s.entries(root).filter(e => e.exists), used = new Set();
  const plans = groups.map(([id, title, prefixes]) => {
    const entries = prefixes.map(prefix => {
      const matches = all.filter(e => e.id.startsWith(prefix) || e.id.startsWith("import-" + prefix));
      if (matches.length !== 1 || used.has(matches[0].id)) throw new Error("分组不唯一：" + prefix);
      used.add(matches[0].id); return matches[0];
    });
    const content = { title, summary: `${title}的适用范围、关键条件与复查入口。`, body: [...new Set(entries.flatMap(e => e.body.split("\n")))].join("\n") };
    s.validateContent(content, "project", true, id);
    return { id, entries, content };
  });
  if (used.size !== all.length || new Set(plans.map(p => p.id)).size !== plans.length || plans.length + 1 > 20) throw new Error("分组覆盖或容量不满足");
  const scopes = [{ scope: "user" }, ...q.knownWorkspaces().map(workspace => ({ scope: "project", workspace }))];
  for (const scope of scopes) for (const e of s.entries(s.rootFor(scope)).filter(e => e.exists)) {
    if (all.some(old => e.body.includes(old.id))) throw new Error("删除前需修复当前正文引用：" + e.id);
  }
  function put(id, hash, content) {
    s.mutate(o, { id, operation: "put", expected: { hash }, content });
    const after = s.get(root, id);
    for (const key of ["title", "summary", "body"]) if (after[key] !== content[key]) throw new Error("回读不一致");
  }
  for (const p of plans) {
    const sink = p.entries[0]; put(sink.id, sink.hash, p.content);
    for (const e of p.entries.slice(1)) s.mutate(o, { id: e.id, operation: "delete", expected: { hash: e.hash } });
  }
  for (const p of plans) {
    const sink = s.get(root, p.entries[0].id);
    if (sink.id === p.id) continue;
    put(p.id, null, p.content);
    s.mutate(o, { id: sink.id, operation: "delete", expected: { hash: sink.hash } });
  }
  put("temp", null, { title: recent.TITLE, summary: recent.SUMMARY, body: "" });
  console.log(JSON.stringify({ workspace, before: all.length, after: s.entries(root).length, index: s.inspectIndex(o).state }));
};
