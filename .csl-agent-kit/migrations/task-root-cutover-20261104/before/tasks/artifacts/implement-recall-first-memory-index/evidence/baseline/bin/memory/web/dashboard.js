"use strict";

const $ = (id) => document.getElementById(id);
const token = location.hash.slice(1) || sessionStorage.getItem("memory-token");
if (token) sessionStorage.setItem("memory-token", token);
history.replaceState(null, "", "/");
const pages = { jobs: { offset: 0 }, history: { offset: 0 }, proposals: { offset: 0 } };
let generation = 0;

function display(value) { return typeof value === "string" ? value : JSON.stringify(value, null, 2); }
function error(message) { $("error").textContent = message || ""; }
function scope() { return { workspace: $("workspace").value.trim(), scope: $("scope").value }; }
function query(value) { return new URLSearchParams(Object.entries(value).filter(([, entry]) => entry !== "" && entry !== undefined && entry !== null)).toString(); }
async function api(route, data) {
  if (!token) throw new Error("缺少授权。请通过 memory dashboard 获取本机 URL，不要分享授权片段。");
  const response = await fetch(route, { method: data ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(data ? { "Content-Type": "application/json" } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${value.error?.code || response.status}: ${value.error?.message || "请求失败"}`);
  return value;
}
function button(label, action, className = "") {
  const node = document.createElement("button");
  node.textContent = label;
  node.className = className;
  node.addEventListener("click", async () => {
    node.disabled = true;
    error("");
    try { await action(); } catch (cause) { error(cause.message); } finally { if (node.isConnected) node.disabled = false; }
  });
  return node;
}
function detail(before, after, meta, reason) {
  $("before").textContent = display(before);
  $("after").textContent = display(after);
  $("detail-meta").textContent = display(meta);
  $("detail-reason").textContent = reason;
  $("actions").replaceChildren();
  $("detail-section").scrollIntoView({ block: "start" });
}
function clearDetail() {
  $("before").textContent = "";
  $("after").textContent = "";
  $("detail-meta").textContent = "";
  $("detail-reason").textContent = "选择一项查看具体内容与来源。";
  $("actions").replaceChildren();
}

async function showProposal(id, selected = scope()) {
  const requestGeneration = generation;
  const proposal = await api(`/api/proposal?${query({ ...selected, id })}`);
  if (requestGeneration !== generation) return;
  detail(proposal.current, proposal.mutation.operation === "delete" ? "删除此条目；原内容保留在审计历史中。" : proposal.mutation.content, { ...selected, id: proposal.id, status: proposal.status, expected: proposal.mutation.expected, source: proposal.mutation.source, digest: proposal.digest }, proposal.mutation.reason);
  if (proposal.status !== "pending") return;
  for (const decision of ["approve", "reject"]) {
    $("actions").append(button(decision === "approve" ? "批准以上具体修改" : "拒绝提案", async () => {
      if (!confirm(`${decision === "approve" ? "批准并执行" : "拒绝"}刚刚展示的提案 ${id}？\n${proposal.mutation.reason}`)) return;
      await api("/api/decision", { ...selected, id, digest: proposal.digest, decision });
      clearDetail();
      await refresh();
    }, decision === "approve" ? "primary" : "danger"));
  }
}

async function showChange(id, selected = scope()) {
  const requestGeneration = generation;
  const change = await api(`/api/change?${query({ ...selected, id })}`);
  if (requestGeneration !== generation) return;
  const { before, after, ...meta } = change;
  detail(before || "原先不存在", after, { ...selected, ...meta }, change.reason);
  if (change.status !== "committed") return;
  $("actions").append(button("核对恢复到变更前", async () => {
    const current = await api(`/api/read?${query({ ...selected, id: change.entryId })}`);
    if (requestGeneration !== generation) return;
    detail(current, change.before || "删除当前条目；原内容仍保留在审计中。", { ...selected, transaction: id, expected: { revision: current.revision, hash: current.hash } }, "核对当前内容与恢复目标。确认后生成新的版本，不倒退历史。旧数据即使超出新预算也完整保留。");
    $("actions").append(button("确认恢复以上内容", async () => {
      const reason = prompt("请填写本次恢复原因：");
      if (!reason?.trim()) return;
      const result = await api("/api/restore", { ...selected, id, reason: reason.trim(), expected: { revision: current.revision, hash: current.hash } });
      await refresh();
      await showChange(result.transaction, selected);
    }, "primary"));
  }));
}

async function showJob(id) {
  const requestGeneration = generation;
  const { event, state } = await api(`/api/job?${query({ id })}`);
  if (requestGeneration !== generation) return;
  detail(event.messages, state.summary || "暂无成功总结", { ...state, workspace: event.workspace, session: event.session, task: event.task }, "会话增量与维护结果；失败时也可能已经产生部分变更，请核对 effects。");
  for (const effect of state.effects || []) {
    const selected = { workspace: event.workspace, scope: effect.scope };
    $("actions").append(button(effect.transaction ? `查看变更 ${effect.transaction}` : `查看提案 ${effect.proposal}`, () => effect.transaction ? showChange(effect.transaction, selected) : showProposal(effect.proposal, selected)));
  }
  if (["failed", "interrupted"].includes(state.status)) $("actions").append(button("检查后重试", async () => {
    if (!confirm("重试会发起新的模型请求，可能产生费用。已核对当前部分变更和失败原因？")) return;
    await api("/api/retry", { id });
    clearDetail();
    await refresh();
  }));
}

function renderRows(kind, page, selected) {
  pages[kind] = { offset: page.offset, nextOffset: page.nextOffset };
  const container = $(kind);
  container.replaceChildren();
  if (!page.items.length) container.textContent = "暂无记录。";
  for (const item of page.items) {
    const row = document.createElement("div"); row.className = "row";
    const description = document.createElement("div"); description.className = "description";
    description.textContent = kind === "jobs" ? `${item.status} · ${item.workspace}` : `${item.status} · ${item.entryId}`;
    const subtitle = document.createElement("small");
    subtitle.textContent = kind === "jobs" ? `${item.session} · ${item.task || "无任务关联"} · ${item.error || item.created}` : `${item.reason} · ${item.created || item.at}`;
    description.append(subtitle); row.append(description);
    row.append(button("查看", () => kind === "jobs" ? showJob(item.id) : kind === "history" ? showChange(item.id, selected) : showProposal(item.id, selected)));
    container.append(row);
  }
  $(`${kind}-page`).textContent = `${page.offset + (page.items.length ? 1 : 0)}—${page.offset + page.items.length} / ${page.total}`;
  document.querySelector(`[data-page="${kind}"][data-step="prev"]`).disabled = page.offset === 0;
  document.querySelector(`[data-page="${kind}"][data-step="next"]`).disabled = page.nextOffset === null;
}

async function refresh() {
  const requestGeneration = ++generation;
  const selected = scope();
  error("");
  const status = await api("/api/status");
  if (requestGeneration !== generation) return;
  const { agents, ...serviceStatus } = status;
  $("status").textContent = display(serviceStatus);
  $("agents").replaceChildren();
  for (const agent of agents || []) {
    if (selected.workspace && agent.workspace !== selected.workspace) continue;
    const row = document.createElement("div"); row.className = "row";
    const description = document.createElement("div"); description.className = "description";
    description.textContent = `${agent.state} · ${agent.workspace}`;
    const info = document.createElement("small");
    info.textContent = `会话 ${agent.sessionId || "尚未创建"} · 已处理 ${agent.batches || 0} 批 · ${agent.model?.provider || ""}/${agent.model?.model || ""} · ${agent.error || agent.updated}`;
    description.append(info); row.append(description); $("agents").append(row);
  }
  if (!$("agents").children.length) $("agents").textContent = "暂无 Memory Agent；有待处理事件时按需创建。";
  const jobs = await api(`/api/jobs?${query({ workspace: selected.workspace, session: $("session").value.trim(), task: $("task").value.trim(), offset: pages.jobs.offset, limit: 20 })}`);
  if (requestGeneration !== generation) return;
  renderRows("jobs", jobs, selected);
  for (const kind of ["history", "proposals"]) {
    if (selected.scope === "project" && !selected.workspace) {
      $(kind).textContent = "请先填写项目路径。";
      $(`${kind}-page`).textContent = "";
      document.querySelectorAll(`[data-page="${kind}"]`).forEach((node) => { node.disabled = true; });
      continue;
    }
    const value = await api(`/api/${kind}?${query({ ...selected, offset: pages[kind].offset, limit: 20 })}`);
    if (requestGeneration !== generation) return;
    renderRows(kind, value, selected);
  }
}
$("refresh").addEventListener("click", () => { clearDetail(); void refresh().catch((cause) => error(cause.message)); });
$("filters").addEventListener("submit", (event) => {
  event.preventDefault(); clearDetail();
  Object.values(pages).forEach((page) => { page.offset = 0; });
  void refresh().catch((cause) => error(cause.message));
});
document.querySelectorAll("[data-page]").forEach((node) => node.addEventListener("click", () => {
  const page = pages[node.dataset.page];
  page.offset = node.dataset.step === "prev" ? Math.max(0, page.offset - 20) : page.nextOffset ?? page.offset;
  clearDetail(); void refresh().catch((cause) => error(cause.message));
}));
void refresh().catch((cause) => error(cause.message));
