"use strict";

const $ = id => document.getElementById(id);
const token = location.hash.slice(1) || sessionStorage.getItem("memory-token");
if (token) sessionStorage.setItem("memory-token", token);
const routeInfo = {
  overview: ["全局概览", "OVERVIEW", "查看记忆系统的运行状态与工作区活动。"],
  storage: ["记忆存储", "STORAGE", "浏览当前有效知识。"],
  processing: ["记忆处理", "PROCESSING", "查看工作区 Agent 的实时过程、队列与异常。"],
};
const pageFromURL = () => { const page = new URLSearchParams(location.search).get("page"); return Object.hasOwn(routeInfo, page) ? page : "overview"; };
let currentPage = pageFromURL(), generation = 0, detailOpener = null, liveWorkspace = null, liveGeneration = 0, liveBusy = false, activityBusy = false;
let jobs = { offset: 0, nextOffset: null };
history.replaceState(null, "", `?page=${currentPage}`);
const query = value => new URLSearchParams(Object.entries(value).filter(([, v]) => v !== "" && v != null)).toString();
const node = (tag, text, className = "") => { const item = document.createElement(tag); item.textContent = text; item.className = className; return item; };
function render(target, value) {
  if (window.MemoryDetailRenderer) window.MemoryDetailRenderer.render(target, value);
  else target.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
function error(message = "") { $("error").textContent = message; $("detail-error").textContent = message; }
async function api(route, data) {
  if (!token) throw new Error("缺少授权。请通过 memory dashboard 获取本机 URL，不要分享授权片段。");
  const response = await fetch(route, { signal: AbortSignal.timeout(5000), method: data ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(data ? { "Content-Type": "application/json" } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${value.error?.code || response.status}: ${value.error?.message || "请求失败"}`);
  return value;
}
function button(label, action, className = "") {
  const item = node("button", label, className); item.type = "button";
  item.addEventListener("click", async () => {
    if (!$("detail-section").open) detailOpener = item;
    item.disabled = true; error();
    try { await action(); } catch (cause) { error(cause.message); } finally { if (item.isConnected) item.disabled = false; }
  });
  return item;
}
function badge(state) {
  const states = { completed: ["success", "完成"], running: ["info", "运行中"], idle: ["success", "空闲"], queued: ["warning", "排队中"], exhausted: ["danger", "两次未完成，已跳过"], failed: ["danger", "失败"], interrupted: ["danger", "已中断"], stopped: ["warning", "已停止"] };
  const [tone, label] = states[state] || ["warning", state || "未知"];
  const item = node("span", `[${label}]`, "state-badge"); item.dataset.tone = tone; return item;
}
function memoryBadge(kind) {
  const labels = { context: "项目基础 · context", lessons: "通用经验 · lessons", temp: "临时记忆 · 7 天" };
  if (!Object.hasOwn(labels, kind)) return null;
  const item = node("span", labels[kind], "memory-special-badge");
  item.dataset.memoryKind = kind;
  return item;
}
function detail(title, text, meta, reason) {
  liveWorkspace = null; liveGeneration++;
  $("detail-title").textContent = title; $("detail-reason").textContent = reason; $("detail-error").textContent = "";
  $("agent-live").hidden = true; $("actions").replaceChildren(); $("detail-metadata").open = false;
  render($("memory-content"), text); render($("detail-meta"), meta);
  if (!$("detail-section").open) $("detail-section").showModal();
}
async function showMemory(item) {
  const request = generation;
  const entry = await api(`/api/read?${query({ id: item.id, scope: item.scope, workspace: item.workspace })}`);
  if (request !== generation) return;
  if (!entry.exists) throw new Error("当前文件不存在，请刷新记忆库。");
  const { body, ...meta } = entry;
  detail(entry.title, body || (item.special === "temp" ? "最近 7 天暂无临时上下文。" : ""), { ...meta, scope: item.scope, workspace: item.workspace }, entry.summary);
  const special = memoryBadge(item.special);
  if (special) $("detail-title").append(document.createTextNode(" "), special);
}
async function showJob(id) {
  const request = generation, result = await api(`/api/job?${query({ id })}`);
  if (request !== generation) return;
  const { event, state } = result;
  const messages = (event.messages || []).map(m => `${m.role === "user" ? "用户" : "Agent"}\n\n${m.text}`).join("\n\n---\n\n");
  const { messages: _messages, ...meta } = event;
  detail("当前处理批次", messages || "此批次无可读取的会话输入。", { ...meta, state }, state.error || (state.retired ? "已完成，输入已释放。" : "队列信息仅用于处理；实际知识请查看当前文件。"));
  if (["failed", "interrupted"].includes(state.status) && state.attempts < 2) $("actions").append(button("重试本批", async () => { await api("/api/retry", { id }); await showJob(id); await refresh(); }));
}
async function showAgent(workspace) {
  detail("Memory Agent · 实时处理", "", { workspace }, "公开过程只在内存暂存，结束后两分钟释放。");
  liveWorkspace = workspace; $("agent-live").hidden = false; $("agent-live-events").textContent = "";
  await refreshLive();
}
async function refreshLive() {
  if (!liveWorkspace || liveBusy || document.hidden || !$("detail-section").open) return;
  liveBusy = true;
  const request = liveGeneration, workspace = liveWorkspace;
  try {
    const trace = await api(`/api/agent-live?${query({ workspace })}`);
    if (request !== liveGeneration) return;
    $("agent-live-state").textContent = trace.available ? `${trace.status} · 尝试 ${trace.attempt}/2${trace.dropped ? " · 早期缓存已释放" : ""}` : "实时缓存不可用或已释放。";
    $("agent-live-events").textContent = trace.available ? (trace.events || []).map(e => `${e.at} ${e.kind}\n${e.text}`).join("\n\n") : "";
  } catch (cause) { if (request === liveGeneration) $("detail-error").textContent = cause.message; }
  finally { liveBusy = false; }
}
function scope() { return { scope: $("scope").value, workspace: $("scope").value === "project" ? $("workspace").value.trim() : "" }; }
function updateScope() {
  $("workspace").disabled = $("scope").value !== "project";
  $("scope-description").textContent = $("scope").value === "user" ? "浏览用户级当前知识。" : $("scope").value === "project" ? "浏览项目当前知识；留空查看全部项目。" : "浏览全部用户与项目的当前知识。";
}
function workspaceOptions(values) {
  const known = new Set([...$("workspace-options").options].map(o => o.value));
  for (const value of values) if (value) known.add(value);
  $("workspace-options").replaceChildren(...[...known].sort().map(value => { const o = node("option", ""); o.value = value; return o; }));
}
function renderGroups(page) {
  $("memories").replaceChildren();
  $("memory-groups-count").textContent = `${page.items.length} 个分组 · ${page.items.reduce((n, g) => n + (g.total || 0), 0)} 条记忆`;
  for (const item of page.items) {
    const group = node("details", "", "memory-group"), heading = node("summary", ""), description = node("div", "", "memory-group-heading");
    description.append(node("h3", item.scope === "user" ? "用户记忆" : item.workspace.split(/[\\/]/).filter(Boolean).at(-1)), node("p", item.workspace || "USER / GLOBAL", "memory-group-path"));
    heading.append(description, node("span", item.error ? "不可用" : `${item.total} 条`, "memory-group-count"));
    const grid = node("div", "", "memory-card-grid");
    group.addEventListener("toggle", () => {
      if (!group.open || grid.dataset.loaded) return;
      grid.dataset.loaded = "true";
      if (item.error || !item.items.length) grid.textContent = item.error || "暂无记忆。";
      const specialOrder = { context: 0, lessons: 1, temp: 2 };
      const entries = [...item.items].sort((a, b) => (specialOrder[a.special] ?? 3) - (specialOrder[b.special] ?? 3));
      for (const entry of entries) {
        const card = button("", () => showMemory(entry), "memory-card"); card.setAttribute("aria-label", `查看记忆：${entry.title}`);
        const special = memoryBadge(entry.special);
        if (special) card.append(special);
        card.append(node("span", entry.title, "memory-card-title"), node("span", entry.summary, "memory-card-summary"), node("span", "查看当前正文 ↗", "memory-card-footer")); grid.append(card);
      }
    });
    group.append(heading, grid); $("memories").append(group);
  }
  if (!page.items.length) $("memories").textContent = "暂无记忆分组。";
}
function renderJobs(page) {
  jobs = { offset: page.offset, nextOffset: page.nextOffset }; $("jobs").replaceChildren();
  for (const item of page.items) {
    const row = node("div", "", "row"), description = node("div", "", "description");
    const title = node("div", "", "row-title"); title.append(badge(item.status), node("span", item.task || "记忆维护", "row-name"));
    description.append(title, node("span", item.workspace, "row-path"), node("small", item.error || new Date(item.updated).toLocaleString("zh-CN")));
    row.append(description, button("查看", () => showJob(item.id))); $("jobs").append(row);
  }
  if (!page.items.length) $("jobs").textContent = "暂无待处理或异常批次。";
  $("jobs-page").textContent = `${page.offset + (page.items.length ? 1 : 0)}—${page.offset + page.items.length} / ${page.total}`;
  document.querySelector('[data-step="prev"]').disabled = !page.offset;
  document.querySelector('[data-step="next"]').disabled = page.nextOffset === null;
}
function renderStatus(status) {
  const agents = status.agents || [], active = new Set(status.active || []), workspaces = new Set([...agents.map(a => a.workspace), ...active]);
  const attention = (status.counts?.failed || 0) + (status.counts?.interrupted || 0) + (status.counts?.exhausted || 0);
  const problems = [status.schedulerError, status.model?.error, ...(status.maintenanceErrors || []).map(e => e.error)].filter(Boolean);
  const tone = attention || problems.length ? "warning" : "success";
  $("connection").textContent = tone === "warning" ? "[!] 服务需关注" : "[0] 服务已连接"; $("connection").dataset.tone = tone;
  $("health-panel").dataset.tone = tone; $("system-health").textContent = tone === "warning" ? "服务在线，有记录需要关注" : active.size ? "记忆系统正在运行" : "记忆系统已就绪";
  $("system-description").textContent = problems.join("；") || `${active.size} 个工作区正在处理 · ${status.counts?.queued || 0} 批等待`;
  $("metric-pid").textContent = status.pid; $("metric-active").textContent = active.size; $("metric-queued").textContent = status.counts?.queued || 0; $("metric-failed").textContent = attention;
  $("overview-workspaces").textContent = workspaces.size;
  $("overview-provider").textContent = status.model?.error ? "不可用" : status.model?.provider || "未配置";
  $("overview-model").textContent = status.model?.error || status.model?.model || "未配置";
  $("overview-started").textContent = new Date(status.started).toLocaleString("zh-CN"); $("status").textContent = JSON.stringify(status, null, 2); workspaceOptions(workspaces);
  const grid = $("overview-agents"); grid.replaceChildren();
  for (const workspace of [...workspaces].sort()) {
    const card = node("article", "", "workspace-card"); card.append(node("h3", workspace.split("/").filter(Boolean).at(-1)), badge(active.has(workspace) ? "running" : agents.find(a => a.workspace === workspace)?.state || "idle"), node("p", workspace)); grid.append(card);
  }
  const container = $("processing-agents"), signature = JSON.stringify([...active].sort());
  if (container.dataset.workspaces !== signature) {
    container.dataset.workspaces = signature; container.replaceChildren();
    if (!active.size) container.textContent = "当前没有正在处理的 Agent。";
    for (const workspace of active) { const row = node("p", `${workspace} · `); row.append(button("查看实时处理", () => showAgent(workspace))); container.append(row); }
  }
}
async function refreshActivity() {
  if (activityBusy || document.hidden) return;
  activityBusy = true;
  try { renderStatus(await api("/api/status")); $("agents-error").textContent = ""; }
  catch (cause) {
    $("agents-error").textContent = cause.message; $("connection").textContent = "[!] 状态不可用"; $("connection").dataset.tone = "danger";
    $("system-health").textContent = "暂时无法连接后台"; $("system-description").textContent = "保留上次工作区快照，当前状态未知。";
    for (const id of ["metric-pid", "metric-active", "metric-queued", "metric-failed"]) $(id).textContent = "—";
    $("overview-provider").textContent = "状态未知"; $("overview-model").textContent = "状态未知";
  } finally { activityBusy = false; }
}
async function refresh() {
  const request = ++generation; error();
  try {
    await refreshActivity();
    if (request !== generation || currentPage === "overview") return;
    if (currentPage === "storage") {
      $("memories").textContent = "正在读取当前记忆…"; updateScope();
      const records = await api(`/api/memory-groups?${query(scope())}`);
      if (request !== generation) return;
      renderGroups(records); workspaceOptions(records.items.map(i => i.workspace));
      if (records.unavailable?.length) error(records.unavailable.map(i => `${i.workspace}: ${i.error}`).join("\n"));
    } else {
      const records = await api(`/api/jobs?${query({ workspace: $("processing-workspace").value.trim(), newestFirst: true, offset: jobs.offset, limit: 20 })}`);
      if (request === generation) renderJobs(records);
    }
  } catch (cause) { if (request === generation) { error(cause.message); if (currentPage === "storage") $("memories").textContent = "无法读取当前记忆，请重试。"; } }
}
function selectPage(page, push = false) {
  currentPage = Object.hasOwn(routeInfo, page) ? page : "overview"; $("detail-section").close(); liveWorkspace = null; liveGeneration++;
  if (push) history.pushState(null, "", `?page=${currentPage}`);
  document.querySelectorAll("[data-page-panel]").forEach(n => { n.hidden = n.dataset.pagePanel !== currentPage; });
  document.querySelectorAll("[data-route]").forEach(n => { if (n.dataset.route === currentPage) n.setAttribute("aria-current", "page"); else n.removeAttribute("aria-current"); });
  const [title, eyebrow, description] = routeInfo[currentPage]; $("page-title").textContent = title; $("page-eyebrow").textContent = eyebrow; $("page-description").textContent = description; document.title = `${title} · Memory Console`;
  if (push) $("page-title").focus(); void refresh();
}
document.querySelectorAll("[data-route]").forEach(n => n.addEventListener("click", e => { if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); selectPage(n.dataset.route, n.dataset.route !== currentPage); }));
window.addEventListener("popstate", () => selectPage(pageFromURL()));
$("detail-close").addEventListener("click", () => $("detail-section").close());
$("detail-section").addEventListener("close", () => { liveWorkspace = null; liveGeneration++; if (detailOpener?.isConnected) detailOpener.focus(); });
$("refresh").addEventListener("click", () => { $("detail-section").close(); void refresh(); });
$("filters").addEventListener("submit", e => { e.preventDefault(); $("detail-section").close(); void refresh(); });
$("filters").addEventListener("reset", () => queueMicrotask(() => $("filters").requestSubmit()));
$("scope").addEventListener("change", () => $("filters").requestSubmit());
$("workspace").addEventListener("change", () => $("filters").requestSubmit());
$("processing-filters").addEventListener("submit", e => { e.preventDefault(); jobs.offset = 0; void refresh(); });
document.querySelectorAll("[data-page]").forEach(n => n.addEventListener("click", () => { jobs.offset = n.dataset.step === "prev" ? Math.max(0, jobs.offset - 20) : jobs.nextOffset ?? jobs.offset; void refresh(); }));
setInterval(() => { void refreshLive(); }, 1000);
setInterval(() => { void refreshActivity(); }, 3000);
selectPage(currentPage);
