"use strict";

const store = require("./store.js");
const modelConfig = require("./model-config.js");
const service = require("./service.js");
const queue = require("./queue.js");
const migration = require("./migration.js");

const HELP = `CSL Memory（只保存当前知识）
用法：csl-agent-kit memory <命令> [参数]
  --scope project|user     默认project；只操作指定作用域
  --workspace <目录>       默认当前目录
  paths | index-status | list [--query <词>] [--offset N] [--limit N] [--full-text]
  read <id>               返回当前正文和临时计算的hash
  put|delete --input <JSON文件>
  reindex                 从当前文件重建单一索引
  upgrade [--dry-run] [--input <JSON文件>]
                          显式转换指定库，永久清理历史/来源/墓碑/备份，无恢复
                          input为人工核对的旧文件put数组；不与dry-run组合
                          dry-run只读；旧库默认只读，不自动转换其他作用域
  model show|set <provider/model>|reset
  service start|status|stop|restart
  agents | dashboard [--open]
  enqueue --input <事件JSON文件>
  jobs [--workspace <目录>] [--session <ID>] [--task <ID>] [--offset N] [--limit N]
  job <ID> | retry <ID>

修改JSON：
  {"id":"wide-topic","operation":"put","expected":{"hash":null},
   "content":{"title":"宽主题","summary":"收录范围","body":"- [2026-11-09] 知识及条件。"}}
已有文件expected.hash必须等于当前完整文件SHA256，新文件使用null；delete不含content。
文件仅保存title、summary和带日期case；不保存type、sources、revision、关系或删除标记。
每项目最多20片；项目与用户级普通正文超过5000词时先保存完整更新并返回compaction.required，再压缩合并；Memory Agent自动继续处理，直接CLI调用者须继续压缩或报告待处理。项目temp不设词数预算，按最近7个UTC自然日保留；底层单次读写安全限制仍适用。合并先保存并回读，再删除旧文件。
不提供history/change/commits/proposal/restore/recover。写入无历史、来源审计或恢复副本。
索引过期时读取当前entries并reindex；错误不代表文件写入已回滚。
后台队列仅服务待处理工作，完成后释放输入；不是记忆历史。
`;

function parse(argv) {
  const positional = [], options = {};
  const flags = new Set(["--full-text", "--open", "--dry-run"]);
  const valued = new Set(["--scope", "--workspace", "--query", "--offset", "--limit", "--input", "--session", "--task"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flags.has(arg) || valued.has(arg)) {
      if (Object.hasOwn(options, arg)) store.fail("INVALID_ARGUMENT", `Duplicate option ${arg}`);
      if (flags.has(arg)) options[arg] = true;
      else {
        if (!argv[i + 1] || argv[i + 1].startsWith("--")) store.fail("INVALID_ARGUMENT", `Missing value for ${arg}`);
        options[arg] = argv[++i];
      }
    } else if (arg.startsWith("-")) store.fail("INVALID_ARGUMENT", `Unknown option ${arg}`);
    else positional.push(arg);
  }
  return { positional, options };
}
function input(file) {
  if (!file) store.fail("INVALID_ARGUMENT", "--input is required");
  const raw = store.readOptional(file);
  if (raw === null) store.fail("NOT_FOUND", "Input file not found");
  return JSON.parse(raw);
}
function page(args) { return { offset: Number(args["--offset"] || 0), limit: Number(args["--limit"] || 20) }; }
async function dashboard(open) {
  const result = await service.dashboard();
  if (open && result.url) {
    const command = process.platform === "darwin" ? "open" : process.platform === "linux" ? "xdg-open" : null;
    if (!command) store.fail("OPEN_UNSUPPORTED", "Open the local dashboard URL manually");
    await new Promise((resolve, reject) => {
      const child = require("node:child_process").spawn(command, [result.url], { stdio: "ignore" });
      child.once("error", reject);
      child.once("exit", code => code === 0 ? resolve() : reject(new Error(`Browser opener exited ${code}`)));
    });
  }
  return result;
}
async function run(argv, io = console) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { io.log(HELP); return 0; }
  try {
    const { positional, options: args } = parse(argv), [command, id] = positional;
    if (["model", "service"].includes(command)) {
      if (Object.keys(args).length) store.fail("INVALID_ARGUMENT", "Model/service configuration is global");
      let result;
      if (command === "model") result = await modelConfig.run(positional.slice(1));
      else {
        if (positional.length !== 2 || !["start", "status", "stop", "restart"].includes(id)) store.fail("INVALID_ARGUMENT", "Use service start|status|stop|restart");
        result = id === "start" ? await service.ensureStarted() : id === "status" ? await service.status() : id === "restart" ? await service.restart() : await service.request("/api/stop", { method: "POST", body: { ifIdle: true } });
      }
      io.log(JSON.stringify({ ok: true, ...result }, null, 2)); return 0;
    }
    const options = { scope: args["--scope"] || "project", workspace: args["--workspace"] || process.cwd() };
    const mutation = operation => { const value = input(args["--input"]); if (value.operation !== operation) store.fail("INVALID_OPERATION", "Input operation differs from command"); return store.mutate(options, value); };
    const specs = {
      paths: [1, [], () => ({ roots: Object.fromEntries(["user", "project"].map(scope => [scope, store.rootFor({ ...options, scope })])), index: "index.md", budgets: store.BUDGETS })],
      "index-status": [1, [], () => store.inspectIndex(options)],
      list: [1, ["--query", "--offset", "--limit", "--full-text"], () => store.list(store.rootFor(options), { ...page(args), query: args["--query"] || "", fullText: !!args["--full-text"] })],
      read: [2, [], () => store.get(store.rootFor(options), id)],
      put: [1, ["--input"], () => mutation("put")],
      delete: [1, ["--input"], () => mutation("delete")],
      reindex: [1, [], () => store.reindex(options)],
      upgrade: [1, ["--dry-run", "--input"], () => {
        if (args["--dry-run"] && args["--input"]) store.fail("INVALID_ARGUMENT", "Inspect the scope with --dry-run separately from prepared content");
        return args["--dry-run"] ? migration.preview(options) : migration.upgrade({ ...options, ...(args["--input"] ? { prepared: input(args["--input"]) } : {}) });
      }],
      agents: [1, [], async () => { const state = await service.status(); return { running: state.running, items: require("./agent.js").states().map(item => state.running ? item : { ...item, state: item.state === "running" ? "interrupted" : "stopped" }) }; }],
      enqueue: [1, ["--input"], () => service.enqueue(input(args["--input"]))],
      jobs: [1, ["--offset", "--limit", "--session", "--task"], () => queue.list({ ...page(args), workspace: args["--workspace"], session: args["--session"], task: args["--task"] })],
      job: [2, [], () => queue.get(id)],
      retry: [2, [], async () => ({ ...queue.retry(id), service: await service.ensureStarted() })],
      dashboard: [1, ["--open"], () => dashboard(args["--open"])],
    };
    const spec = specs[command];
    if (!spec || positional.length !== spec[0]) store.fail("INVALID_ARGUMENT", "Unknown command or wrong arguments; use memory --help");
    const shared = ["agents", "enqueue", "job", "retry", "dashboard"].includes(command) ? [] : command === "jobs" ? ["--workspace"] : ["--scope", "--workspace"];
    for (const key of Object.keys(args)) if (![...shared, ...spec[1]].includes(key)) store.fail("INVALID_ARGUMENT", `Option ${key} is not valid for ${command}`);
    io.log(JSON.stringify({ ok: true, ...await spec[2]() }, null, 2)); return 0;
  } catch (error) {
    io.error(JSON.stringify({ ok: false, error: { code: error.code || "MEMORY_ERROR", message: error.message, ...(error.details ? { details: error.details } : {}) } }, null, 2)); return 1;
  }
}
module.exports = { run };
