"use strict";

const $ = (id) => document.getElementById(id);
const token = location.hash.slice(1) || sessionStorage.getItem("memory-token");
if (token) sessionStorage.setItem("memory-token", token);
const routeInfo = {
  overview: ["全局概览", "OVERVIEW", "查看记忆系统的运行状态与工作区活动。"],
  storage: ["记忆存储", "STORAGE", "浏览长期记忆、提交历史与来源。"],
  processing: ["记忆处理", "PROCESSING", "查看工作区 Agent 的实时过程、队列与异常。"],
};
function pageFromURL() { const page = new URLSearchParams(location.search).get("page"); return Object.hasOwn(routeInfo, page) ? page : "overview"; }
let currentPage = pageFromURL();
history.replaceState(null, "", `?page=${currentPage}`);
const pages = { memories: { offset: 0 }, commits: { offset: 0 }, jobs: { offset: 0 } };
let currentView = "memories";
let generation = 0;
let detailOpener = null;
let liveWorkspace = null;
let liveGeneration = 0;
let liveBusy = false;
let activityBusy = false;

function display(value) { return typeof value === "string" ? value : JSON.stringify(value, null, 2); }
function renderDetailValue(id, value) {
  if (window.MemoryDetailRenderer) window.MemoryDetailRenderer.render($(id), value);
  else $(id).textContent = `渲染器未加载，显示原文：\n${display(value)}`;
}
function error(message) {
  $("error").textContent = message || "";
  $("detail-error").textContent = message || "";
  if (message) {
    for (const kind of ["memories", "commits"]) {
      if ($(kind).dataset.loading === "true") {
        $(kind).textContent = "无法加载当前筛选的记录，请检查错误提示后重试。";
        delete $(kind).dataset.loading;
      }
    }
    $("connection").textContent = "[!] 请求异常";
    $("connection").dataset.tone = "danger";
  }
}
function scope() { return { workspace: $("scope").value === "project" ? $("workspace").value.trim() : "", scope: $("scope").value }; }
function updateScopePanel() {
  const selected = scope();
  $("workspace").disabled = selected.scope !== "project";
  $("scope-description").textContent = selected.scope === "user" ? "仅查看用户级记忆，不按产生它的项目会话过滤。"
    : selected.scope === "project" ? selected.workspace ? `仅查看项目记忆：${selected.workspace}` : "查看全部项目记忆；选择或输入项目路径可进一步缩小范围。"
    : "查看全部用户与项目记忆；可切换当前记忆库与变更记录。";
}
function updateWorkspaceOptions(workspaces) {
  const options = $("workspace-options");
  const values = new Set([...options.options].map(option => option.value));
  for (const workspace of workspaces) if (typeof workspace === "string" && workspace) values.add(workspace);
  options.replaceChildren(...[...values].sort().map(workspace => {
    const option = document.createElement("option"); option.value = workspace;
    return option;
  }));
}
function query(value) { return new URLSearchParams(Object.entries(value).filter(([, entry]) => entry !== "" && entry !== undefined && entry !== null)).toString(); }
async function api(route, data, signal) {
  if (!token) throw new Error("缺少授权。请通过 memory dashboard 获取本机 URL，不要分享授权片段。");
  const response = await fetch(route, { signal, method: data ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(data ? { "Content-Type": "application/json" } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${value.error?.code || response.status}: ${value.error?.message || "请求失败"}`);
  return value;
}
function button(label, action, className = "") {
  const node = document.createElement("button");
  node.textContent = label;
  node.className = className;
  node.addEventListener("click", async () => {
    if (!$("detail-section").open) detailOpener = node;
    node.disabled = true;
    error("");
    try { await action(); } catch (cause) { error(cause.message); } finally { if (node.isConnected) node.disabled = false; }
  });
  return node;
}
function renderChangeSummary(changes) {
  const list = $("change-summary-list");
  list.replaceChildren();
  $("change-summary").hidden = changes.length === 0;
  for (const { scope: changeScope, change } of changes) {
    const item = document.createElement("li");
    const file = document.createElement("span"); file.className = "summary-file";
    file.textContent = `${changeScope} · ${change.entryId}.md`;
    const description = document.createElement("p");
    description.textContent = change.reason?.trim() || "此记录未提供变更说明，请查看下方完整对比。";
    item.append(file, description);
    list.append(item);
  }
}

function detail(before, after, meta, reason, changes = []) {
  liveWorkspace = null;
  liveGeneration++;
  $("agent-live").hidden = true;
  renderChangeSummary(changes);
  document.querySelector(".comparison").hidden = false;
  $("memory-content").hidden = true;
  $("memory-content").textContent = "";
  $("detail-title").textContent = "核对详情";
  renderDetailValue("before", before);
  renderDetailValue("after", after);
  $("detail-metadata").open = false;
  renderDetailValue("detail-meta", meta);
  $("detail-reason").textContent = reason;
  $("actions").replaceChildren();
  $("detail-error").textContent = "";
  if (!$("detail-section").open) $("detail-section").showModal();
}
function clearDetail() {
  $("detail-section").close();
  renderChangeSummary([]);
  $("memory-content").textContent = "";
  $("memory-content").hidden = true;
  $("detail-error").textContent = "";
  $("detail-metadata").open = false;
  $("detail-meta").replaceChildren();
  $("before").textContent = "";
  $("after").textContent = "";
  $("detail-meta").textContent = "";
  $("detail-reason").textContent = "选择一项查看具体内容与来源。";
  $("actions").replaceChildren();
}

async function showMemory(id, selected) {
  const requestGeneration = generation;
  const entry = await api(`/api/read?${query({ ...selected, id })}`);
  if (requestGeneration !== generation) return;
  if (!entry.exists || entry.deleted) throw new Error("此记忆已删除或不存在，请刷新记忆库。");
  const { body, ...meta } = entry;
  detail("", "", { ...selected, ...meta }, entry.summary);
  $("detail-title").textContent = entry.title;
  document.querySelector(".comparison").hidden = true;
  $("memory-content").hidden = false;
  renderDetailValue("memory-content", body);
}

async function showChange(id, selected = scope()) {
  const requestGeneration = generation;
  const change = await api(`/api/change?${query({ ...selected, id })}`);
  if (requestGeneration !== generation) return;
  const { before, after, ...meta } = change;
  detail(before || "原先不存在", after, { ...selected, ...meta }, "本次记录包含 1 项记忆文件变更。", [{ scope: selected.scope, change }]);
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
  detail(state.retired ? "输入已释放。" : event.messages, state.error || "正在等待处理或执行。", state, `每批最多处理两次，当前已尝试 ${state.attempts || 0}/2 次；耗尽后保留标记并继续后续记录。实际提交独立保留。`);
  $("detail-title").textContent = "待处理批次";
  for (const effect of state.effects || []) {
    if (effect.transaction) $("actions").append(button("查看已提交变更", () => showChange(effect.transaction, { workspace: event.workspace, scope: effect.scope })));
  }
  if (["failed", "interrupted"].includes(state.status) && state.attempts < 2) $("actions").append(button("立即重试（最多两次）", async () => {
    if (!confirm("重试会发起新的模型请求，可能产生费用。已核对当前部分变更和失败原因？")) return;
    await api("/api/retry", { id });
    clearDetail();
    await refresh();
  }));
}

function statusBadge(value) {
  const states = {
    completed: ["success", "完成"], committed: ["success", "已提交"], approved: ["success", "已批准"],
    running: ["info", "运行中"], idle: ["success", "空闲"], queued: ["warning", "排队中"], pending: ["warning", "待处理"],
    exhausted: ["danger", "两次未完成，已跳过"],
    failed: ["danger", "失败"], interrupted: ["danger", "已中断"], rejected: ["warning", "已拒绝"], stopped: ["warning", "已停止"],
  };
  const [tone, label] = states[value] || ["warning", value || "未知"];
  const node = document.createElement("span");
  node.className = "state-badge";
  node.dataset.tone = tone;
  node.textContent = `[${label}]`;
  node.title = value || "unknown";
  return node;
}

function renderMemoryCards(container, items) {
  const groups = new Map();
  for (const item of items) {
    const key = JSON.stringify([item.scope, item.workspace]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const [key, entries] of groups) {
    const { scope: entryScope, workspace } = entries[0];
    const group = document.createElement("section"); group.className = "memory-group";
    group.dataset.group = key;
    const heading = document.createElement("div"); heading.className = "memory-group-heading";
    const name = document.createElement("h3"); name.id = `memory-group-${container.children.length}`;
    name.textContent = entryScope === "user" ? "用户记忆" : workspace.split(/[\\/]/).filter(Boolean).at(-1) || workspace;
    group.setAttribute("aria-labelledby", name.id);
    const count = document.createElement("span"); count.className = "memory-group-count"; count.textContent = `本页 ${entries.length} 条`;
    heading.append(name, count);
    const location = document.createElement("p"); location.className = "memory-group-path";
    location.textContent = entryScope === "user" ? "USER / GLOBAL · 不属于任何项目" : workspace;
    const grid = document.createElement("div"); grid.className = "memory-card-grid";
    for (const item of entries) {
      const card = button("", () => showMemory(item.id, { scope: item.scope, workspace: item.workspace }), "memory-card");
      card.type = "button";
      card.dataset.memoryId = item.id;
      card.setAttribute("aria-label", `查看记忆：${item.title}`);
      const meta = document.createElement("span"); meta.className = "memory-card-meta";
      const type = document.createElement("span"); type.className = "memory-type"; type.dataset.kind = item.type;
      type.textContent = ({ fact: "事实", preference: "偏好", experience: "经验", reference: "参考" })[item.type] || item.type;
      const revision = document.createElement("span"); revision.textContent = `r${item.revision}`;
      meta.append(type, revision);
      const title = document.createElement("span"); title.className = "memory-card-title"; title.textContent = item.title;
      const summary = document.createElement("span"); summary.className = "memory-card-summary"; summary.textContent = item.summary;
      const footer = document.createElement("span"); footer.className = "memory-card-footer";
      const time = document.createElement("time");
      const date = new Date(item.updated);
      time.textContent = Number.isNaN(date.getTime()) ? "时间未知" : date.toLocaleDateString("zh-CN");
      if (!Number.isNaN(date.getTime())) { time.dateTime = date.toISOString(); time.title = date.toLocaleString("zh-CN", { hour12: false }); }
      const open = document.createElement("span"); open.textContent = "查看正文 ↗";
      footer.append(time, open);
      card.replaceChildren(meta, title, summary, footer);
      grid.append(card);
    }
    group.append(heading, location, grid);
    container.append(group);
  }
}

function renderRows(kind, page) {
  pages[kind] = { offset: page.offset, nextOffset: page.nextOffset };
  const container = $(kind);
  delete container.dataset.loading;
  container.replaceChildren();
  if (!page.items.length) container.textContent = "暂无记录。";
  if (kind === "memories") renderMemoryCards(container, page.items);
  else for (const item of page.items) {
    const row = document.createElement("div"); row.className = "row";
    const description = document.createElement("div"); description.className = "description";
    const title = document.createElement("div"); title.className = "row-title";
    const name = document.createElement("span"); name.className = "row-name";
    name.textContent = kind === "jobs" ? item.task || (item.session === "memory-maintenance" ? "周期记忆复查" : "会话记忆维护") : item.entryId;
    title.append(statusBadge(item.status), name);
    description.append(title);
    if (kind === "jobs" || kind === "commits") {
      const workspace = document.createElement("span"); workspace.className = "row-path";
      workspace.textContent = item.scope === "user" ? "User · 全局记忆" : item.workspace;
      description.append(workspace);
    }
    const subtitle = document.createElement("small");
    const time = document.createElement("time"); time.className = "row-time";
    const timestamp = item.updated || item.created || item.at;
    const date = new Date(timestamp);
    time.textContent = Number.isNaN(date.getTime()) ? timestamp || "时间未知" : date.toLocaleString("zh-CN", { hour12: false });
    if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
    subtitle.append(time, document.createTextNode(` · ${kind === "jobs" ? item.session : item.reason || "无说明"}`));
    description.append(subtitle);
    if (item.error) { const problem = document.createElement("small"); problem.textContent = item.error; problem.className = "row-error"; description.append(problem); }
    row.append(description);
    row.append(button("查看", () => kind === "jobs" ? showJob(item.id) : showChange(item.id, { scope: item.scope, workspace: item.workspace })));
    container.append(row);
  }
  $(`${kind}-page`).textContent = `${page.offset + (page.items.length ? 1 : 0)}—${page.offset + page.items.length} / ${page.total}`;
  document.querySelector(`[data-page="${kind}"][data-step="prev"]`).disabled = page.offset === 0;
  document.querySelector(`[data-page="${kind}"][data-step="next"]`).disabled = page.nextOffset === null;
}

function renderAgents(active) {
  const container = $("processing-agents");
  const workspaces = new Set(active || []);
  // Preserve unchanged buttons and their keyboard focus during polling.
  const signature = JSON.stringify([...workspaces].sort());
  if (container.dataset.workspaces === signature) return;
  container.dataset.workspaces = signature;
  container.replaceChildren();
  if (!workspaces.size) container.textContent = "当前没有正在处理的 Agent。";
  for (const workspace of workspaces) {
    const row = document.createElement("p");
    const label = document.createElement("span"); label.textContent = workspace;
    row.append(label, document.createTextNode(" · "), button("查看实时处理", () => showAgent(workspace)));
    container.append(row);
  }
}

async function showAgent(workspace) {
  detail("", "", { workspace }, "实时过程不落盘；仅展示可见回复、工具调用及结果，不包含隐藏推理。结束后最多保留两分钟，下一批会替换当前缓存。");
  $("detail-title").textContent = "Memory Agent · 实时处理";
  document.querySelector(".comparison").hidden = true;
  $("agent-live").hidden = false;
  $("agent-live-state").textContent = "正在读取…";
  $("agent-live-input").textContent = "";
  $("agent-live-events").textContent = "";
  liveWorkspace = workspace;
  await refreshLive();
}

async function refreshLive() {
  if (!liveWorkspace || liveBusy || !$("detail-section").open || document.hidden) return;
  liveBusy = true;
  const requestGeneration = liveGeneration;
  const workspace = liveWorkspace;
  try {
    const trace = await api(`/api/agent-live?${query({ workspace })}`, undefined, AbortSignal.timeout(5000));
    if (requestGeneration !== liveGeneration || workspace !== liveWorkspace) return;
    $("detail-error").textContent = "";
    if (!trace.available) {
      $("agent-live-state").textContent = "当前没有可查看的过程：缓存可能已过期、后台已重启，或该工作区尚未开始处理。";
      $("agent-live-input").textContent = "";
      $("agent-live-events").textContent = "";
      return;
    }
    $("agent-live-state").replaceChildren(statusBadge(trace.status), document.createTextNode(` · 尝试 ${trace.attempt}/2 · ${workspace}${trace.dropped ? ` · 早期 ${trace.dropped} 条已从缓存移除` : ""}`));
    const { input, events, ...meta } = trace;
    if ($("agent-live-input").textContent !== input) $("agent-live-input").textContent = input;
    const content = events.map(item => `${item.at}  ${item.kind}\n${item.text}`).join("\n\n") || "已开始，正在准备模型与输入…";
    if ($("agent-live-events").textContent !== content) $("agent-live-events").textContent = content;
    renderDetailValue("detail-meta", meta);
  } catch (cause) {
    if (requestGeneration === liveGeneration && workspace === liveWorkspace) $("detail-error").textContent = `实时详情暂时无法更新：${cause.message}`;
  } finally { liveBusy = false; }
}

function renderStatus(status) {
  const { agents = [], ...serviceStatus } = status;
  const active = new Set(status.active || []);
  const workspaces = new Set([...agents.map(agent => agent.workspace), ...active]);
  const attention = (status.counts?.failed || 0) + (status.counts?.interrupted || 0) + (status.counts?.exhausted || 0);
  const problems = [status.schedulerError, ...(status.maintenanceErrors || []).map(item => item.error), status.model?.error].filter(Boolean);
  const needsAttention = attention > 0 || problems.length > 0;
  $("status").textContent = display(serviceStatus);
  updateWorkspaceOptions([...workspaces]);
  renderAgents([...active]);
  $("connection").textContent = needsAttention ? "[!] 服务需关注" : "[0] 服务已连接";
  $("connection").dataset.tone = needsAttention ? "warning" : "success";
  $("metric-pid").textContent = status.pid ?? "—";
  $("metric-active").textContent = active.size;
  $("metric-queued").textContent = status.counts?.queued ?? 0;
  $("metric-failed").textContent = attention;
  $("health-panel").dataset.tone = needsAttention ? "warning" : "success";
  $("system-health").textContent = needsAttention ? "服务在线，有记录需要关注" : active.size ? "记忆系统正在运行" : "记忆系统已就绪";
  $("system-description").textContent = problems.length ? problems.join("；") : `${active.size} 个工作区正在处理 · ${status.counts?.queued || 0} 批等待 · ${attention} 条异常记录`;
  $("overview-workspaces").textContent = workspaces.size;
  $("overview-model").textContent = status.model?.error ? "配置需检查" : [status.model?.provider, status.model?.model].filter(Boolean).join(" / ") || "未提供";
  $("overview-started").textContent = status.started ? new Date(status.started).toLocaleString("zh-CN", { hour12: false }) : "—";
  const grid = $("overview-agents");
  grid.replaceChildren();
  if (!workspaces.size) grid.textContent = "尚无工作区活动。";
  for (const workspace of [...workspaces].sort()) {
    const agent = agents.find(item => item.workspace === workspace);
    const card = document.createElement("article"); card.className = "workspace-card";
    const title = document.createElement("h3"); title.textContent = workspace.split("/").filter(Boolean).at(-1) || workspace;
    const location = document.createElement("p"); location.textContent = workspace;
    card.append(title, statusBadge(active.has(workspace) ? "running" : "idle"), location);
    if (!active.has(workspace) && agent?.state) {
      const last = document.createElement("p"); last.textContent = `上次状态：${statusBadge(agent.state).textContent}`; card.append(last);
    }
    grid.append(card);
  }
}

function statusUnavailable() {
  $("connection").textContent = "[!] 状态不可用";
  $("connection").dataset.tone = "danger";
  $("health-panel").dataset.tone = "danger";
  $("system-health").textContent = "暂时无法连接后台";
  $("system-description").textContent = "当前状态未知，工作区卡片保留上次快照。请检查服务后刷新。";
  for (const id of ["metric-pid", "metric-active", "metric-queued", "metric-failed"]) $(id).textContent = "—";
}

async function refreshActivity() {
  if (activityBusy || document.hidden) return;
  activityBusy = true;
  try {
    const status = await api("/api/status", undefined, AbortSignal.timeout(5000));
    renderStatus(status);
    $("agents-error").textContent = "";
  } catch (cause) { statusUnavailable(); $("agents-error").textContent = `运行状态暂时无法更新：${cause.message}`; }
  finally { activityBusy = false; }
}

async function refresh() {
  const requestGeneration = ++generation;
  try { await refreshScope(requestGeneration); }
  catch (cause) { if (requestGeneration === generation) error(cause.message); }
}

async function refreshScope(requestGeneration) {
  error("");
  let status;
  try { status = await api("/api/status", undefined, AbortSignal.timeout(5000)); }
  catch (cause) { if (requestGeneration === generation) statusUnavailable(); throw cause; }
  if (requestGeneration !== generation) return;
  renderStatus(status);
  if (currentPage === "overview") return;
  if (currentPage === "processing") {
    $("jobs").textContent = "正在读取处理队列…";
    const jobs = await api(`/api/jobs?${query({ workspace: $("processing-workspace").value.trim(), newestFirst: true, offset: pages.jobs.offset, limit: 20 })}`);
    if (requestGeneration === generation) renderRows("jobs", jobs);
    return;
  }
  const selected = scope();
  updateScopePanel();
  const view = currentView;
  $(view).dataset.loading = "true";
  $(view).textContent = view === "memories" ? "正在读取所选范围的当前记忆…" : "正在读取所选范围的记忆变更…";
  $(`${view}-page`).textContent = "";
  document.querySelectorAll(`[data-page="${view}"]`).forEach(node => { node.disabled = true; });
  const records = await api(`/api/${view}?${query({ ...selected, offset: pages[view].offset, limit: 20 })}`);
  if (requestGeneration !== generation) return;
  updateWorkspaceOptions(records.items.filter(item => item.scope === "project").map(item => item.workspace));
  renderRows(view, records);
  if (records.unavailable?.length) error(records.unavailable.map(item => `${item.workspace}: ${item.error}`).join("\n"));
}

function selectPage(page, push = false, focus = false) {
  currentPage = Object.hasOwn(routeInfo, page) ? page : "overview";
  liveWorkspace = null;
  liveGeneration++;
  clearDetail();
  if (push) history.pushState(null, "", `?page=${currentPage}`);
  document.querySelectorAll("[data-page-panel]").forEach(node => { node.hidden = node.dataset.pagePanel !== currentPage; });
  document.querySelectorAll("[data-route]").forEach(node => {
    if (node.dataset.route === currentPage) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
  const [title, eyebrow, description] = routeInfo[currentPage];
  $("page-title").textContent = title;
  $("page-eyebrow").textContent = eyebrow;
  $("page-description").textContent = description;
  document.title = `${title} · Memory Console`;
  if (focus) $("page-title").focus();
  void refresh();
}
document.querySelectorAll("[data-route]").forEach(node => node.addEventListener("click", event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  selectPage(node.dataset.route, node.dataset.route !== currentPage, true);
}));
window.addEventListener("popstate", () => selectPage(pageFromURL(), false, true));
$("processing-filters").addEventListener("submit", event => {
  event.preventDefault(); pages.jobs.offset = 0; clearDetail(); void refresh();
});
$("detail-close").addEventListener("click", () => $("detail-section").close());
$("detail-section").addEventListener("close", () => {
  liveWorkspace = null;
  liveGeneration++;
  $("agent-live").hidden = true;
  if (detailOpener?.isConnected) detailOpener.focus();
  detailOpener = null;
});
document.querySelectorAll("[data-view]").forEach(node => node.addEventListener("click", () => {
  currentView = node.dataset.view;
  $("library-panel").hidden = currentView !== "memories";
  $("records").hidden = currentView !== "commits";
  document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === currentView)));
  clearDetail();
  void refresh();
}));
$("refresh").addEventListener("click", () => { clearDetail(); void refresh().catch((cause) => error(cause.message)); });
$("scope").addEventListener("change", () => {
  updateScopePanel();
  $("filters").requestSubmit();
});
$("workspace").addEventListener("change", () => $("filters").requestSubmit());
$("filters").addEventListener("reset", () => {
  // Wait for the native form values to reset before refreshing.
  queueMicrotask(() => { updateScopePanel(); $("filters").requestSubmit(); });
});
$("filters").addEventListener("submit", (event) => {
  event.preventDefault(); clearDetail();
  for (const kind of ["memories", "commits"]) pages[kind].offset = 0;
  void refresh().catch((cause) => error(cause.message));
});
document.querySelectorAll("[data-page]").forEach((node) => node.addEventListener("click", () => {
  const page = pages[node.dataset.page];
  page.offset = node.dataset.step === "prev" ? Math.max(0, page.offset - 20) : page.nextOffset ?? page.offset;
  clearDetail(); void refresh().catch((cause) => error(cause.message));
}));
setInterval(() => { void refreshLive(); }, 1000);
setInterval(() => { void refreshActivity(); }, 3000);
selectPage(currentPage);
