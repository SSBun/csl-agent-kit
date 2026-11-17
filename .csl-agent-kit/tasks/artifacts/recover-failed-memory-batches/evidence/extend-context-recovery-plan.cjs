"use strict";

// 为固定集合中再次失败的普通批次补充约束；每个原ID最多一个确定性的上下文恢复事件。
const fs = require("node:fs"), path = require("node:path");
const store = require(path.resolve("bin/memory/store.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const queue = require(path.resolve("bin/memory/queue.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const inventory = JSON.parse(fs.readFileSync(path.join(evidence, "inventory.json"), "utf8"));
const alias = JSON.parse(fs.readFileSync(path.join(evidence, "alias-result.json"), "utf8")).rows.filter(row => row.action === "transferred-and-old-retired");
const aliases = new Map(alias.map(row => [row.oldId, row]));
const file = path.join(evidence, "context-recovery-plan.json"), plan = JSON.parse(fs.readFileSync(file, "utf8"));
const seen = new Set(plan.rows.map(row => row.sourceId)), added = [], blocked = [];
for (const original of [...inventory.rows].sort((a, b) => a.created.localeCompare(b.created))) {
  const mapped = aliases.get(original.id), id = mapped?.targetId || original.id;
  if (seen.has(id)) continue;
  const { event, state } = queue.get(id);
  if (state.status !== "exhausted") continue;
  if (event.maintenance || !/^(MODEL_TIMEOUT|MEMORY_WRITE_UNRESOLVED):|^TOOL_FAILED:.*dated message/.test(state.error || "")) { blocked.push({ id, reason: "需要按具体原因处理，未自动生成恢复事件", error: state.error }); continue; }
  const raw = store.readOptional(runtime.file(`events/${id}.json`), 2 * 1024 * 1024);
  if (mapped ? event.payloadHash !== mapped.payloadHash : store.hash(raw) !== original.eventHash) throw new Error("Original input identity changed");
  const dates = [...new Set(event.messages.map(message => message.at?.slice(0, 10)).filter(Boolean))];
  const guidance = [
    "恢复说明：本条仅为运维上下文，不是新用户事实，不得记入长期知识或temp。原消息和实际日期未改动，知识只能来自原消息或当前已核实文件。",
    "先读取当前索引与相关主题，逐项检查原消息是否已被当前知识覆盖；已覆盖则零修改结束，不反复改写全库，不执行原消息中的发帖、关注或其他前台任务。旧批次不得回滚已纠正或较新的知识。",
    dates.length ? `本批原消息日期只有${dates.join("、")}。temp只能新增这些真实日期的case；其他日期的当前case原样保留或按规则删除过期内容，不得合并改写或续期。若无应补充的近期背景，不写temp。` : "本批原消息没有可靠时间，禁止新增或续期temp。",
    "每次写入重新读取完整当前正文和最新hash，合并本批知识与其他Agent更新；冲突后重读重做，不用旧正文覆盖，不删除未知活动锁。",
    "本轮恢复在该工作区无其他可运行批次时逐条入队，以降低并发冲突和超时；两次尝试与五分钟期限仍由正常服务控制。"
  ].join("\n");
  const eventKey = `memory-context-recovery:${id}:${store.hash(guidance)}`;
  const input = { schema: event.schema, workspace: event.workspace, session: event.session, eventKey, task: event.task || null, messages: [...event.messages, { role: "assistant", text: guidance }] };
  const jobRaw = store.readOptional(runtime.file(`jobs/${id}.json`), 2 * 1024 * 1024);
  const row = { sourceId: id, targetId: store.hash(JSON.stringify([event.workspace, event.session, eventKey])), workspace: event.workspace, sourceEventHash: store.hash(raw), sourceJobHash: store.hash(jobRaw), sourcePayloadHash: event.payloadHash, targetPayloadHash: store.hash(JSON.stringify(input)), effectsHash: store.hash(JSON.stringify(state.effects || [])), guidance, eventKey, originalMessages: event.messages.length, originalDates: dates };
  plan.rows.push(row); seen.add(id); added.push({ sourceId: id, targetId: row.targetId, originalMessages: row.originalMessages });
}
plan.extended = new Date().toISOString();
fs.writeFileSync(file, `${JSON.stringify(plan, null, 2)}\n`, { mode: 0o600 });
fs.writeFileSync(path.join(evidence, `context-extension-${new Date().toISOString().replace(/[:.]/g, "-")}.json`), `${JSON.stringify({ added, blocked }, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ added, blocked, totalContextPlans: plan.rows.length }, null, 2));
