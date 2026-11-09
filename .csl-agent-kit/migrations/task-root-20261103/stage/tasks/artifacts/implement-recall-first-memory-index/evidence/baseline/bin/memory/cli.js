"use strict";

const readline = require("node:readline/promises");
const store = require("./store.js");
const modelConfig = require("./model-config.js");
const service = require("./service.js");
const queue = require("./queue.js");
const migration = require("./migration.js");

const HELP = `CSL Memory（Markdown 读写与后台维护）

用法：csl-agent-kit memory <命令> [参数]
  --scope project|user     默认 project
  --workspace <目录>       默认当前目录

模型（服务级配置，不修改 Pi 设置）：
  model show              查看有效 provider/model 与来源
  model set <provider/model>
                          设置 Memory 独立模型
  model reset             移除独立配置，恢复使用 Pi 保存的默认模型

后台服务：
  service start|status|stop|restart
  agents                  查看各 workspace 的独立 Memory 会话
  enqueue --input <事件JSON文件>  持久入队后按需启动服务
  jobs [--workspace <目录>] [--session <ID>] [--task <ID>]
       [--offset N] [--limit N]
  job <事件ID>            查看增量、处理状态与实际变更
  retry <事件ID>          检查失败后显式重试，不自动重试模型调用
  dashboard [--open]      获取本机审计面板 URL，可打开浏览器

只读（普通文件工具可直接读取，无需专用检索接口）：
  paths                   返回两级记忆根、索引位置和写作预算
  list [--query <词>] [--offset N] [--limit N] [--full-text]
  read <id> [--outline | --section <完整标题>]
  history [--offset N] [--limit N]
  change <事务ID>          返回变更前后全文、来源及原因
  proposal <提案ID>        返回具体变更、当前内容与提案摘要 hash

版本迁移（首次使用自动检查，保留原始资料与备份）：
  upgrade [--dry-run]      转换选定scope的旧Context/Lessons；可重复执行
                          --dry-run仅输出清单，不写入、不调用模型

写入：
  put --input <JSON文件>   用户级与项目级均可条件写入
  delete --input <JSON文件>
  propose --input <JSON文件>  可选手工提案；不是自动维护的前置条件
  approve <提案ID>         仅交互终端，展示全文后人工确认
  reject <提案ID>          仅交互终端
  restore <事务ID> --input <JSON文件>
                          输入 expected/reason，直接提交新的恢复版本
  reindex                 根据已生效条目重建派生索引
  recover                 检查已退出的本机写入者，恢复中断事务

修改 JSON：
  {"id":"entry-id","operation":"put","expected":{"revision":0,"hash":null},
   "reason":"修改理由","source":"可核对的证据位置",
   "content":{"title":"标题","summary":"内容与适用情境","type":"fact",
              "sources":["来源"],"body":"Markdown 正文"}}

已有条目必须使用当前索引或可选 read 返回的 revision/hash；delete 不含 content。
标题最多60字符，摘要200字符，正文目标4000/上限8000字符；旧导入不丢弃内容。
类型：fact / preference / experience / reference（仅作检索元数据）。
输出为 JSON；失败退出码为 1，不把“可能已提交”报告成回滚成功。
后台 Agent 使用 Pi SDK >=1.4.0、Node >=22.19；读取存储不依赖后台。
enqueue/service start/dashboard 按需启动后台；Pi首次进入workspace自动升级数据。
旧原文只作迁移备份，不再并行维护。未处理旧提案不会自动批准。
`;

function parse(argv) {
  const positional = [];
  const options = {};
  const flags = new Set(["--full-text", "--outline", "--open", "--dry-run"]);
  const valued = new Set(["--scope", "--workspace", "--query", "--offset", "--limit", "--input", "--section", "--session", "--task"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flags.has(arg)) {
      if (options[arg] !== undefined) store.fail("INVALID_ARGUMENT", `Duplicate option ${arg}`);
      options[arg] = true;
    } else if (valued.has(arg)) {
      if (options[arg] !== undefined || !argv[i + 1] || argv[i + 1].startsWith("--")) store.fail("INVALID_ARGUMENT", `Missing or duplicate option ${arg}`);
      options[arg] = argv[++i];
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

function page(options) {
  return { offset: options["--offset"] === undefined ? 0 : Number(options["--offset"]), limit: options["--limit"] === undefined ? 20 : Number(options["--limit"]) };
}

function headings(body) {
  const lines = body.split("\n");
  const result = [];
  let fence = null;
  lines.forEach((line, index) => {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) result.push({ title: match[2], level: match[1].length, line: index + 1 });
  });
  return result;
}

function read(options, id, args) {
  const entry = store.get(store.rootFor(options), id);
  if (!entry.exists) return entry;
  if (!args["--outline"] && !args["--section"]) return entry;
  const outline = headings(entry.body);
  const { body, ...metadata } = entry;
  if (args["--outline"]) return { ...metadata, outline };
  const matches = outline.filter((heading) => heading.title === args["--section"]);
  if (matches.length !== 1) store.fail("AMBIGUOUS_SECTION", "Section must match exactly one heading; use outline first");
  const selected = matches[0];
  const end = outline.find((heading) => heading.line > selected.line && heading.level <= selected.level);
  return { ...metadata, section: selected, body: body.split("\n").slice(selected.line - 1, end ? end.line - 1 : undefined).join("\n") };
}

async function decide(options, id, action, io) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) store.fail("HUMAN_CONFIRMATION_REQUIRED", "Approval/rejection requires an interactive human terminal; no --yes or piped approval");
  const proposal = store.proposalDetail(options, id);
  io.log(JSON.stringify(proposal, null, 2));
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const expected = `${action} ${id}`;
    const answer = await prompt.question(`请核对以上修改、理由及当前内容。确认请完整输入 ${expected}：`);
    if (answer !== expected) store.fail("CANCELLED", "No decision recorded");
    return store.decide(options, id, proposal.digest, action);
  } finally { prompt.close(); }
}

async function run(argv, io = console) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { io.log(HELP); return 0; }
  try {
    const { positional, options: args } = parse(argv);
    const [command, id] = positional;
    if (["model", "service"].includes(command)) {
      if (Object.keys(args).length) store.fail("INVALID_ARGUMENT", "Model/service configuration is global; scope/workspace options do not apply");
      let result;
      if (command === "model") result = await modelConfig.run(positional.slice(1));
      else {
        if (positional.length !== 2 || !["start", "status", "stop", "restart"].includes(id)) store.fail("INVALID_ARGUMENT", "Use memory service start|status|stop|restart");
        result = id === "start" ? await service.ensureStarted() : id === "status" ? await service.status() : id === "restart" ? await service.restart() : await service.request("/api/stop", { method: "POST", body: {} });
      }
      io.log(JSON.stringify({ ok: true, ...result }, null, 2));
      return 0;
    }
    const options = { scope: args["--scope"] || "project", workspace: args["--workspace"] || process.cwd() };
    const commands = {
      upgrade: { count: 1, flags: ["--dry-run"], run: () => args["--dry-run"] ? migration.preview(options) : migration.ensure(options) },
      paths: { count: 1, flags: [], run: () => ({ roots: Object.fromEntries(["user", "project"].map((scope) => [scope, store.rootFor({ ...options, scope })])), index: "index.md", budgets: store.BUDGETS }) },
      agents: { count: 1, flags: [], run: async () => { const state = await service.status(); return { running: state.running, items: require("./agent.js").states().map((item) => state.running ? item : { ...item, state: item.state === "running" ? "interrupted" : "stopped" }) }; } },
      enqueue: { count: 1, flags: ["--input"], run: () => service.enqueue(input(args["--input"])) },
      jobs: { count: 1, flags: ["--offset", "--limit", "--session", "--task"], run: () => queue.list({ ...page(args), workspace: args["--workspace"], session: args["--session"], task: args["--task"] }) },
      job: { count: 2, flags: [], run: () => queue.get(id) },
      retry: { count: 2, flags: [], run: async () => ({ ...queue.retry(id), service: await service.ensureStarted() }) },
      dashboard: { count: 1, flags: ["--open"], run: async () => {
        const result = await service.dashboard();
        if (args["--open"] && result.url) {
          const { spawn } = require("node:child_process");
          const command = process.platform === "darwin" ? "open" : process.platform === "linux" ? "xdg-open" : null;
          if (!command) store.fail("OPEN_UNSUPPORTED", "Open the dashboard URL manually on this platform");
          await new Promise((resolve, reject) => {
            const child = spawn(command, [result.url], { stdio: "ignore" });
            child.once("error", reject);
            child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Browser opener exited ${code}`)));
          });
        }
        return result;
      } },
      list: { count: 1, flags: ["--query", "--offset", "--limit", "--full-text"], run: () => store.list(store.rootFor(options), { ...page(args), query: args["--query"] || "", fullText: Boolean(args["--full-text"]) }) },
      read: { count: 2, flags: ["--outline", "--section"], run: () => read(options, id, args) },
      history: { count: 1, flags: ["--offset", "--limit"], run: () => store.history(options, page(args)) },
      change: { count: 2, flags: [], run: () => store.changeDetail(options, id) },
      proposal: { count: 2, flags: [], run: () => store.proposalDetail(options, id) },
      put: { count: 1, flags: ["--input"], run: () => mutation("put") },
      delete: { count: 1, flags: ["--input"], run: () => mutation("delete") },
      propose: { count: 1, flags: ["--input"], run: () => store.propose(options, input(args["--input"])) },
      approve: { count: 2, flags: [], run: () => decide(options, id, "approve", io) },
      reject: { count: 2, flags: [], run: () => decide(options, id, "reject", io) },
      restore: { count: 2, flags: ["--input"], run: () => {
        const value = input(args["--input"]);
        if (!value || Object.keys(value).some((key) => !["expected", "reason"].includes(key))) store.fail("INVALID_INPUT", "Restore accepts only expected and reason");
        return store.restore(options, id, value.expected, value.reason);
      } },
      reindex: { count: 1, flags: [], run: () => store.reindex(options) },
      recover: { count: 1, flags: [], run: () => store.recover(options) },
    };
    function mutation(operation) {
      const value = input(args["--input"]);
      if (value.operation !== operation) store.fail("INVALID_OPERATION", "Input operation differs from command");
      return store.mutate(options, value);
    }
    const spec = commands[command];
    if (!spec || positional.length !== spec.count) store.fail("INVALID_ARGUMENT", "Unknown command or wrong number of arguments; use memory --help");
    const sharedFlags = ["enqueue", "job", "retry", "dashboard", "agents"].includes(command) ? [] : command === "jobs" ? ["--workspace"] : ["--scope", "--workspace"];
    for (const key of Object.keys(args)) if (![...sharedFlags, ...spec.flags].includes(key)) store.fail("INVALID_ARGUMENT", `Option ${key} is not valid for ${command}`);
    if (args["--outline"] && args["--section"]) store.fail("INVALID_ARGUMENT", "Choose outline or section, not both");
    if (["put", "delete", "restore", "propose", "approve", "reject", "reindex"].includes(command)) migration.ensure(options);
    const result = await spec.run();
    io.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return 0;
  } catch (error) {
    io.error(JSON.stringify({ ok: false, error: { code: error.code || "MEMORY_ERROR", message: error.message, ...(error.details ? { details: error.details } : {}) } }, null, 2));
    return 1;
  }
}

module.exports = { run };
