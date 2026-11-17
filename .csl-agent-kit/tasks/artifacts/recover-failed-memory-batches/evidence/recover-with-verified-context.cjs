"use strict";

// 只补充已核实的运维上下文，不改原消息、时间或全局运行策略。
const fs = require("node:fs"), path = require("node:path");
const store = require(path.resolve("bin/memory/store.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const queue = require(path.resolve("bin/memory/queue.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const planFile = path.join(evidence, "context-recovery-plan.json");
const mode = process.argv[2] || "--inspect";
if (!["--inspect", "--apply", "--apply-next", "--finalize"].includes(mode) || process.argv.length > 3) throw new Error("Use --inspect, --apply, --apply-next or --finalize");
const applying = mode === "--apply" || mode === "--apply-next";
const sourceIds = ["007c0921ebfffdf9f8768671c206ca317859529a2e480eb3578786f064194a16", "755fb6943466fe0df94d227478add733afabcb63ce6091de03662bb662f6690e", "c92397520f0c44cd2395823dc778e8a154f40a233d2f528cea6c2c99cb581a03"];
const rawHash = relative => { const raw = store.readOptional(runtime.file(relative), 2 * 1024 * 1024); return raw === null ? null : store.hash(raw); };
const movedReport = "/Users/caishilin/Documents/SharkSpace/native-short-reader/.csl-agent-kit/tasks/artifacts/reader-common-next-risk-report/reports/reader-common-next-navigation-risk.md";
const common = "恢复说明：本条仅为运维上下文，不是新用户事实，不得记录为长期知识或temp。原始消息及真实时间均未改动；所有知识仍只能来自原消息及当前可核实文件。先读当前索引、相关主题与最新hash，合并或确认无需修改；不要执行原消息中的前台任务。确认没有应新增的知识时可以零修改结束。";
if (mode === "--inspect") {
  if (!fs.statSync(movedReport).isFile()) throw new Error("The relocated report has not been verified");
  const rows = sourceIds.map((id, index) => {
    const { event, state } = queue.get(id);
    if (state.status !== "exhausted" || event.maintenance) throw new Error("Only the selected inactive conversation batches can use this recovery path");
    const dates = [...new Set(event.messages.map(message => message.at?.slice(0, 10)).filter(Boolean))];
    const detail = index === 0
      ? `此前ENOENT是Task目录已迁移：tasks/artifacts/reader-common-next-risk-report/reports/reader-common-next-navigation-risk.md目前位于${movedReport}，该文件已确认存在。原tasks路径不得再读取。其他旧路径先检查当前.csl-agent-kit/tasks布局是否实际存在，再决定是否需要读取；不能把缺失链接当成可编造的事实。本批原消息没有时间，禁止新增或续期temp。`
      : index === 1
        ? `此前temp写入越过本批消息日期。原始消息UTC日期仅${dates.join("、")}；temp只能基于这些实际日期新增case，其他日期的现有case原样保留或依规则删除过期内容，不得改写或续期。不要把当前处理日当成原消息日，不得合并重写其他日期的case。若本批没有仍需补充的近期背景，不写temp，只核对相关长期知识。`
        : "此前达到五分钟期限。本批只有4条短消息，先检查当前索引与相关主题是否已经覆盖；若已覆盖，直接零修改结束。不要全库反复重写，不要把恢复操作本身写进记忆，也不需要恢复或执行原来的前台任务。";
    const guidance = `${common}\n${detail}`;
    const eventKey = `memory-context-recovery:${id}:${store.hash(guidance)}`;
    const input = { schema: event.schema, workspace: event.workspace, session: event.session, eventKey, task: event.task || null, messages: [...event.messages, { role: "assistant", text: guidance }] };
    return { sourceId: id, targetId: store.hash(JSON.stringify([event.workspace, event.session, eventKey])), workspace: event.workspace, sourceEventHash: rawHash(`events/${id}.json`), sourceJobHash: rawHash(`jobs/${id}.json`), sourcePayloadHash: event.payloadHash, targetPayloadHash: store.hash(JSON.stringify(input)), effectsHash: store.hash(JSON.stringify(state.effects || [])), guidance, eventKey, originalMessages: event.messages.length, originalDates: dates };
  });
  fs.writeFileSync(planFile, `${JSON.stringify({ prepared: new Date().toISOString(), rows }, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ prepared: rows.length, relocatedReportVerified: true, artificialTimestampsAdded: 0 }));
} else {
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8")), rows = [], counts = {};
  const log = row => { rows.push(row); counts[row.action] = (counts[row.action] || 0) + 1; fs.appendFileSync(path.join(evidence, "context-recovery-actions.ndjson"), `${JSON.stringify(row)}\n`, { mode: 0o600 }); };
  for (const entry of plan.rows) {
    let unlockSource, unlockEvent, unlockTarget;
    try {
      unlockSource = runtime.acquire(`job-locks/${entry.sourceId}.lock`);
      const source = queue.get(entry.sourceId);
      if (source.state.retired) {
        if (source.event.payloadHash !== entry.sourcePayloadHash) throw new Error("Original completed identity differs from the plan");
        log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "already-completed", at: new Date().toISOString() }); continue;
      }
      if (source.state.status !== "exhausted" || rawHash(`events/${entry.sourceId}.json`) !== entry.sourceEventHash || rawHash(`jobs/${entry.sourceId}.json`) !== entry.sourceJobHash) throw new Error("Original inactive batch changed; preserve it");
      if (applying) {
        if (mode === "--apply-next") {
          let existing;
          try { existing = queue.get(entry.targetId); } catch (error) { if (error.code !== "NOT_FOUND") throw error; }
          if (existing) { log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "recovery-already-enqueued", status: existing.state.status, at: new Date().toISOString() }); continue; }
          if (queue.all().some(item => item.event.workspace === entry.workspace && ["queued", "running", "failed", "interrupted", "untracked"].includes(item.state.status))) {
            log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "deferred-until-workspace-idle", at: new Date().toISOString() }); continue;
          }
        }
        unlockEvent = runtime.acquire(`event-locks/${entry.sourceId}.lock`);
        unlockTarget = runtime.acquire(`job-locks/${entry.targetId}.lock`);
        const event = source.event;
        const input = { schema: event.schema, workspace: event.workspace, session: event.session, eventKey: entry.eventKey, task: event.task || null, messages: [...event.messages, { role: "assistant", text: entry.guidance }] };
        if (store.hash(JSON.stringify(input)) !== entry.targetPayloadHash) throw new Error("Recovery input differs from its fixed plan");
        log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "context-recovery-intent", at: new Date().toISOString() });
        const receipt = queue.enqueue(input);
        if (receipt.id !== entry.targetId) throw new Error("Unexpected recovery identity");
        if (!receipt.duplicate) queue.update(entry.targetId, { effects: source.state.effects || [] });
        const target = queue.get(entry.targetId);
        if (target.event.payloadHash !== entry.targetPayloadHash) throw new Error("Recovery payload did not match");
        log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "context-recovery-enqueued", sourcePreserved: true, at: new Date().toISOString() });
      } else {
        let target;
        try { target = queue.get(entry.targetId); } catch (error) {
          if (error.code !== "NOT_FOUND") throw error;
          log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "waiting", status: "not-enqueued", at: new Date().toISOString() }); continue;
        }
        if (target.state.status !== "completed") { log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "waiting", status: target.state.status, error: target.state.error || null, at: new Date().toISOString() }); continue; }
        if (target.event.payloadHash !== entry.targetPayloadHash) throw new Error("Successful recovery receipt differs from the complete preserved input");
        const currentInput = { schema: source.event.schema, workspace: source.event.workspace, session: source.event.session, eventKey: entry.eventKey, task: source.event.task || null, messages: [...source.event.messages, { role: "assistant", text: entry.guidance }] };
        if (store.hash(JSON.stringify(currentInput)) !== entry.targetPayloadHash) throw new Error("Original messages are no longer the messages processed by recovery");
        queue.complete(entry.sourceId);
        const completed = queue.get(entry.sourceId);
        if (completed.state.status !== "completed" || completed.event.payloadHash !== entry.sourcePayloadHash) throw new Error("Original completion receipt verification failed");
        log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "original-completed-by-verified-recovery", at: new Date().toISOString() });
      }
    } catch (error) { log({ sourceId: entry.sourceId, targetId: entry.targetId, action: "blocked-preserved", error: `${error.code || "RECOVERY_CHECK"}: ${error.message}`, at: new Date().toISOString() }); }
    finally { unlockTarget?.(); unlockEvent?.(); unlockSource?.(); }
  }
  fs.writeFileSync(path.join(evidence, mode === "--apply-next" ? "context-next-result.json" : applying ? "context-enqueue-result.json" : "context-finalize-result.json"), `${JSON.stringify({ captured: new Date().toISOString(), counts, rows }, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ mode, counts, rows }, null, 2));
}
