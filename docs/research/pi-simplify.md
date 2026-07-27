# 1. Summary

`pi-simplify` 0.2.3 是一个很薄的 Pi 命令扩展：它只注册 `/simplify`，用 `git diff` 找出文件及当前版本中的变更行，把这些信息拼入一段审查/修改指令，再通过 `pi.sendUserMessage(..., { deliverAs: "followUp" })` 交给当前 agent 执行；扩展自身既不读写代码，也不运行测试，更不监听事件。[源码：入口](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.ts) [源码：命令](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts) [Pi 页面](https://pi.dev/packages/pi-simplify)

它的核心价值不是确定性的重构算法，而是**缩小 LLM 操作范围的 Git 证据 + 强约束 prompt**。0.2.3 集中修复了三个已有问题：越界修改未变更代码、误删有价值注释、旧 peer 范围阻塞当前 Pi；但“只改 changed lines”最终仍是 prompt 约束而非工具级写入门禁，因此不能视为强制安全边界。[CHANGELOG](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/CHANGELOG.md) [PR #148](https://github.com/MattDevy/pi-extensions/pull/148) [PR #153](https://github.com/MattDevy/pi-extensions/pull/153) [PR #152](https://github.com/MattDevy/pi-extensions/pull/152)

# 2. Key facts

- **确认事实｜版本与发布面。** 当前上游 `package.json`、CHANGELOG 与 pi.dev 页面均标为 **0.2.3**；包为 ESM、MIT、Node `>=18`，入口/类型为 `dist/index.js` / `dist/index.d.ts`，Pi manifest 仅声明 `dist/index.js`。pi.dev 页面同时显示安装命令 `pi install npm:pi-simplify`、0 个普通依赖、4 个 peer、27.7 KB，以及截至本次查阅时的发布日 2026-07-17、25.4K/月与 7,413/周下载量；下载量是页面快照，不是稳定常量。[package.json](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/package.json) [CHANGELOG](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/CHANGELOG.md) [pi.dev](https://pi.dev/packages/pi-simplify)
- **确认事实｜npm 发布物。** npm registry 的 0.2.3 元数据记录 27 个文件、28,376 字节解包体积、GitHub Actions trusted publisher、npm publish attestation 与 SLSA provenance；tarball 同时携带编译后的 `dist/` 和无测试的 `src/`。这证明发布链有可核验来源记录，但**不等于**代码本身已通过独立安全审计。[registry 元数据](https://registry.npmjs.org/pi-simplify/0.2.3) [attestations](https://registry.npmjs.org/-/npm/v1/attestations/pi-simplify@0.2.3)
- **确认事实｜命令形态。** `/simplify` 默认 `{ files: [], ref: "HEAD", staged: false }`；`--staged` 打开 staged 模式，`--ref=<ref>` 替换基准，其余空白分隔 token 全部当作显式文件路径。README 展示了 `/simplify`、`/simplify --staged`、`/simplify src/foo.ts src/bar.ts`、`/simplify --ref=main` 四种调用。[命令源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts) [README](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/README.md) [参数测试](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.test.ts)
- **确认事实｜默认 Git 选择。** 无显式文件时，普通模式先执行 `git diff --name-status HEAD`；staged 模式执行 `git diff --name-status --cached`；`--ref=main` 等普通模式执行 `git diff --name-status <ref>`。若命令失败或解析后没有文件，两种模式都会再尝试 `git diff --name-status HEAD~1`。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [git-diff 测试](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.test.ts)
- **确认事实｜状态选择。** 只接受 Git `M/A/R/C`，映射为 modified/added/renamed/copied；删除项 `D` 被过滤；rename/copy 采用新路径。新增文件不再取 hunk，整个文件进入 scope；其余文件逐个执行零上下文 diff。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [types.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/types.ts)
- **确认事实｜显式文件。** 一旦有显式文件参数，就跳过 name-status 文件发现，把每个参数先标作 `modified`，再并行执行逐文件 diff。普通模式为 `git diff --unified=0 --no-ext-diff <ref> -- <path>`；`--staged` 且未进入 fallback 时为 `git diff --unified=0 --no-ext-diff --cached -- <path>`。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [显式文件测试](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.test.ts)
- **确认事实｜changed-line hunk 解析。** 正则只读取 unified hunk header 的新侧 `+start[,count]`；省略 count 时视为 1，`count=0`（纯删除）忽略，区间终点为 `start + count - 1`；与前一区间重叠或相邻时合并。行号明确指向当前文件内容。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [PR #148 文件变更](https://api.github.com/repos/MattDevy/pi-extensions/pulls/148/files)
- **确认事实｜prompt 注入路径。** 文件路径、状态与 changed-line ranges 被直接插入 prompt 的 `Scope` 列表；prompt 要求保留功能、遵守 `CLAUDE.md`/`AGENTS.md`、提升清晰度且不过度简化，只读上下文、不改未列行，逐文件修改、运行现有测试并总结。0.2.3 特别要求保留设计理由、业务规则、非显然行为与意图注释，只允许删除真正冗余噪声。[prompt-builder.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts) [PR #153 文件变更](https://api.github.com/repos/MattDevy/pi-extensions/pulls/153/files)
- **确认事实｜投递语义。** 找到文件后调用 `pi.sendUserMessage(prompt, { deliverAs: "followUp" })`；没有文件则仅以 `info` 通知，不投递消息。Pi 官方示例说明 `sendUserMessage` 产生真实 user message；流式期间 `followUp` 会排队等待当前处理完成。[命令源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts) [Pi 官方示例](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/examples/extensions/send-user-message.ts)
- **确认事实｜无事件 handler。** 入口只调用一次 `registerCommand("simplify", ...)`，没有 `pi.on(...)`；测试明确断言 `pi.on` 未调用。因此它不是自动审查器，只在用户调用命令时工作。[index.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.ts) [index.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.test.ts)
- **确认事实｜测试与发布元数据。** 测试不是独立 `tests/` 目录，而是 4 个与源码并置的 `src/*.test.ts`（共 37 个 `it`）：覆盖注册/无事件、参数、Git 状态与 fallback、staged/ref/显式文件、hunk 行范围、prompt scope/注释和 `followUp`。脚本为 Vitest、ESLint、TypeScript；`check = vitest run && eslint src/ && tsc --noEmit`，`prepublishOnly` 先 build 再 check，`prepack` 要求已有 `dist/`；发布文件包含 `dist`、`src`、README、LICENSE，但排除 `src/**/*.test.ts`。[package.json](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/package.json) [src 目录清单](https://api.github.com/repos/MattDevy/pi-extensions/contents/packages/pi-simplify/src) [四组测试之一](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.test.ts)
- **确认事实｜Pi compatibility。** 0.2.1 从旧 `@mariozechner/*` 迁至 `@earendil-works/*`；0.2.2 把 0.74-only 范围放宽到 0.75.x；0.2.3 又因 0.80.x 安装冲突去掉上界，当前三个 Pi peer 均为 `>=0.74.0`，另有 `@sinclair/typebox ^0.34.0`。[CHANGELOG](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/CHANGELOG.md) [Issue #124](https://github.com/MattDevy/pi-extensions/issues/124) [PR #127](https://github.com/MattDevy/pi-extensions/pull/127) [Issues #146](https://github.com/MattDevy/pi-extensions/issues/146) [#147](https://github.com/MattDevy/pi-extensions/issues/147) [PR #152 文件变更](https://api.github.com/repos/MattDevy/pi-extensions/pulls/152/files)
- **冲突并列｜兼容范围规范。** 当前包声明 `@earendil-works/pi-{coding-agent,ai,tui} >=0.74.0` 和 `@sinclair/typebox ^0.34.0`；当前 Pi 官方 package 文档则要求导入核心包时以 `"*"` peer 声明，并列出 `typebox` 而非 `@sinclair/typebox`。这是**元数据与当前官方指导不一致**，不等同于已证实运行故障；PR #152 仅报告已用 Pi 0.80.6 严格 type-check，并未证明所有未来版本兼容。[package.json](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/package.json) [Pi packages 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/packages.md) [PR #152](https://github.com/MattDevy/pi-extensions/pull/152)

# 3. How it works / Structure

```text
/simplify [--staged] [--ref=<ref>] [files...]
                  │
                  ▼
          parseArgs（空白分词）
                  │
      ┌───────────┴────────────┐
      │显式 files              │无显式 files
      │均先标 modified         │git diff --name-status
      │                        │HEAD / --cached / <ref>
      └───────────┬────────────┘
                  │ 无结果/失败 → HEAD~1 fallback
                  ▼
  M/A/R/C 过滤；D 丢弃；R/C 取新路径
                  │
       A：整文件 │ 其余：逐文件 --unified=0
                  ▼
       解析 +start,count → 合并行区间
                  │
                  ▼
  buildSimplifyPrompt（路径/状态/范围直接插入）
                  │
       无文件 → ui.notify；有文件 → sendUserMessage
                  ▼
              deliverAs: followUp
                  │
                  ▼
       agent 按 prompt 读/改代码、跑测试、总结
```

- `src/index.ts`：最小 Pi 入口，只注册命令。[源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.ts)
- `src/simplify-command.ts`：参数解析、流程编排、无文件通知、prompt 投递。[源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts)
- `src/git-diff.ts`：文件发现、状态解析、HEAD~1 fallback、逐文件 hunk 提取与区间合并。[源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts)
- `src/prompt-builder.ts`：把结构化 changed-file 数据转换为 agent 指令；`undefined` ranges 表示获取失败并要求先查看 diff，空数组表示仅删除、无当前行可简化，added 表示整文件。[源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts)
- `src/types.ts`：`LineRange`、`ChangedFile`、`SimplifyOptions` 三个只读接口。[源码](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/types.ts)
- `src/*.test.ts`：与模块并置的单元/回归测试；仓库中不存在 `packages/pi-simplify/tests`（GitHub Contents API 返回 404），实际测试均位于 `src`。[src 清单](https://api.github.com/repos/MattDevy/pi-extensions/contents/packages/pi-simplify/src)

# 4. Context

- **来源与定位。** 初始 PR #94 明确称其为 Claude Code `/simplify` 的 Pi 移植：注册命令、检测 Git 变更，再让 agent 以“清晰、一致、可维护且保留功能”为目标审查；这解释了它为何主要是 prompt orchestration，而不是 AST 重写器。[PR #94](https://github.com/MattDevy/pi-extensions/pull/94) [初始提交](https://github.com/MattDevy/pi-extensions/commit/aded3cd6ea928e93b50e787b4c6443bc2d3f8684)
- **changed-lines 演进。** 0.2.2 用户报告：只改 Java 100–120 行，却修改了整文件多处方法。PR #148 随后加入零上下文 diff/hunk 解析、行范围 prompt 和回归测试；这是“changed lines”约束的直接来源，而非最初版本即具备的能力。[Issue #130](https://github.com/MattDevy/pi-extensions/issues/130) [PR #148](https://github.com/MattDevy/pi-extensions/pull/148) [PR #148 文件变更](https://api.github.com/repos/MattDevy/pi-extensions/pulls/148/files)
- **valuable-comments 演进。** 0.2.2 prompt 原先要求删除“描述明显代码的不必要注释”；Issue #135 指出 LLM 会把设计理由、业务逻辑、边界警告与意图一并激进删除。PR #153 反转默认立场：保留有价值注释，只删如 `// increment i` + `i++` 的噪声，并补回归断言。[Issue #135](https://github.com/MattDevy/pi-extensions/issues/135) [PR #153](https://github.com/MattDevy/pi-extensions/pull/153) [PR #153 文件变更](https://api.github.com/repos/MattDevy/pi-extensions/pulls/153/files)
- **Pi compatibility 演进。** 名称空间迁移后，旧 peer 造成冲突警告；随后 `<0.76.0` 上界又与 0.80.x 扩展树产生 `ERESOLVE`，并被报告会把树压在旧 Pi 版本。0.2.3 保留下限 0.74.0、移除上界，并声明以 0.80.6 做严格 type-check。[Issue #124](https://github.com/MattDevy/pi-extensions/issues/124) [PR #127](https://github.com/MattDevy/pi-extensions/pull/127) [Issue #146](https://github.com/MattDevy/pi-extensions/issues/146) [Issue #147](https://github.com/MattDevy/pi-extensions/issues/147) [PR #152](https://github.com/MattDevy/pi-extensions/pull/152)
- **Pi 模型。** 官方文档确认扩展可注册命令、监听生命周期、调用 UI；package manifest 可将 `dist/index.js` 声明为 extension，且第三方包具有完整系统权限。`pi-simplify` 只采用“注册命令 + exec Git + 发送 user message”这条最小路径。[Pi extensions 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) [Pi packages 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/packages.md) [pi.dev 安全提示](https://pi.dev/packages/pi-simplify)
- **同仓库替代：`pi-code-review`。** 它面向正确性、安全和语言规则，既监听 edit/turn/before-agent 事件做自动检查，也提供 `/review`，并可调用 Haiku 输出分级 finding；`pi-simplify` 则是纯手动、当前 agent 驱动、聚焦 changed-line 可读性与维护性的轻量流程。二者目标相邻但不互为等价替代。[pi-code-review README](https://github.com/MattDevy/pi-extensions/blob/main/packages/pi-code-review/README.md) [pi-code-review 入口](https://github.com/MattDevy/pi-extensions/blob/main/packages/pi-code-review/src/index.ts)
- **同名包边界。** 本报告对象是 MattDevy 发布的**未加 scope** npm 包 `pi-simplify`。`@geminixiang/pi-simplify`、`@nielpattin/pi-simplify` 等是不同发布物，功能、命令和实现不能混用；安装或审计时应以完整 npm identity 与 repository 字段消歧。[本包 registry 元数据](https://registry.npmjs.org/pi-simplify/0.2.3) [@geminixiang/pi-simplify](https://github.com/geminixiang/pi-simplify) [@nielpattin/pi-simplify](https://github.com/nielpattin/pi-packages/tree/main/packages/pi-simplify)
- **文档冲突。** README 的 Pi 链接仍指向 `github.com/nicholasgasior/pi-coding-agent`，而当前源码类型与 peer 已使用 `@earendil-works/pi-coding-agent`，官方文档也位于当前 Pi monorepo；这是链接陈旧，不影响已确认的运行导入。[README](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/README.md) [package.json](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/package.json)

# 5. Open questions / Limitations

以下均由当前源码行为直接推出；“推断”明确标注，未把尚未复现的可能性写成事实。

- **高｜prompt 约束不是强制边界（确认 + 推断）。** 确认：扩展没有 `tool_call`/写文件事件 handler，只向 agent 发送“不得越界”的自然语言指令。推断：若模型不遵从，扩展本身没有阻止越界编辑或自动核对最终 diff 的机制；PR #148 修复的是上下文与指令，不是写入拦截。[index.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.ts) [index.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.test.ts) [prompt-builder.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts)
- **高｜空 staged 会退回最近提交（确认）。** `/simplify --staged` 若 `--cached` 无文件或失败，会无条件 fallback 到 `HEAD~1`，随后 changed-lines diff 也使用 `HEAD~1` 而非 `--cached`。因此“只审 staged”在 staged 集为空时会转而审查上一提交；README 的“Review only staged changes”没有披露这一例外。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [README](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/README.md)
- **中｜默认模式不发现未跟踪文件（确认）。** 文件发现依赖 `git diff --name-status HEAD`，源码没有 `git ls-files --others`；因此未 `git add` 的新文件不在默认结果中。若没有其他 diff，fallback 还可能改为审上一提交。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts)
- **中｜显式新增/未跟踪文件被误表为 deletion-only（确认）。** 显式参数一律先标 `modified`，不会查询真实状态；未跟踪文件对 `git diff <ref> -- path` 通常给出成功但空 stdout，源码遂生成 `changedLines: []`，prompt 把它解释为“deletions only”，而不是新增整文件 scope。测试只覆盖显式已跟踪文件的 hunk，没有覆盖显式未跟踪文件。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [prompt-builder.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts) [git-diff.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.test.ts)
- **中｜参数不支持 shell 式 quoting（确认）。** `parseArgs` 仅按 `/\s+/` 分词；含空格的路径无法作为单个显式参数表达，未知 `--foo` 被当文件，`--ref=` 可产生空 ref；没有 `--` 终止选项语义或参数校验。[simplify-command.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts) [simplify-command.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.test.ts)
- **中｜路径文本直接进入 prompt（确认 + 推断）。** `formatFile` 不转义路径，显式参数也不验证；推断：包含换行/Markdown/指令样式文本的显式“路径”可能改变 prompt 的视觉结构或产生 prompt-injection 面。Git 调用自身用 `--` 隔离 path，降低把路径当 Git option 的风险，但这不等同于 prompt 转义。[prompt-builder.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts) [git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts)
- **中｜Git 文件名解析不是无歧义协议（确认）。** name-status 输出按换行、再按 tab 分割，未使用 `-z`；对 Git 引号化、制表符/换行等特殊文件名没有专门解码。现有测试仅覆盖普通路径、空白输出、rename/copy。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [git-diff.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.test.ts)
- **低｜`--staged` 与 `--ref` 同时使用时 ref 被忽略（确认）。** 文件发现只放 `--cached`，逐文件 diff 在 staged 且非 fallback 时同样只放 `--cached`；`options.ref` 不参与实际比较。CLI 没有告警或互斥规则。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [simplify-command.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts)
- **低｜失败原因不可见（确认）。** 首次 diff 失败与“成功但无文件”走同一 fallback；逐文件 diff 失败只留下 `changedLines === undefined` 并在 prompt 要求 agent 自行检查；若两次文件发现都失败，UI 仍显示“No changed files”，stderr 未展示。[git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) [simplify-command.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts)
- **低｜测试是 mock 单元测试，未见真实 Git/Pi 集成测试（确认）。** 四个测试文件用 `vi.fn()` 模拟 `exec`、`sendUserMessage`、`registerCommand`；上游没有独立 `tests/` 目录。PR #152 声称做过 Pi 0.80.6 strict type-check，但仓库当前测试集未留下跨版本运行矩阵。[src 测试清单](https://api.github.com/repos/MattDevy/pi-extensions/contents/packages/pi-simplify/src) [PR #152](https://github.com/MattDevy/pi-extensions/pull/152)
- **开放问题｜未来 Pi 兼容性。** `>=0.74.0` 无上界解决了已报告的 0.80.x npm 冲突，但不能仅凭一次 0.80.6 type-check 确认任意未来 breaking release 可用；同时当前 peer 声明与官方建议的核心 peer `"*"` 有差异。需要上游明确兼容策略或 CI 矩阵才能关闭此问题。[PR #152](https://github.com/MattDevy/pi-extensions/pull/152) [Pi packages 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/packages.md)

# 6. Sources

仅列本次实际查阅并在正文使用的 URL；优先上游源码、测试、issue/PR 与 Pi 官方文档。

- [pi.dev/package/pi-simplify](https://pi.dev/packages/pi-simplify) — 首先读取；核对页面展示的版本、manifest、安装方式、包统计、README 与安全提示。
- [上游 package.json](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/package.json) — 版本、入口、Pi manifest、files、scripts、Node、peer/dev dependency、发布钩子。
- [上游 README](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/README.md) — 用户命令与宣称行为。
- [上游 CHANGELOG](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/CHANGELOG.md) — 0.2.0–0.2.3 变更与 issue/PR 对应关系。
- [src 目录 Contents API](https://api.github.com/repos/MattDevy/pi-extensions/contents/packages/pi-simplify/src) — 当前源码/测试完整文件清单；也用于确认测试位于 `src`。
- [src/index.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.ts) — 命令注册与无其他入口行为。
- [src/index.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/index.test.ts) — 注册命令、无事件 handler 的断言。
- [src/simplify-command.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.ts) — 参数解析、通知、prompt 投递与 `followUp`。
- [src/simplify-command.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/simplify-command.test.ts) — 参数与命令编排测试。
- [src/git-diff.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.ts) — Git 选择、fallback、状态/hunk 解析的核心证据。
- [src/git-diff.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/git-diff.test.ts) — Git mock 覆盖范围及缺口。
- [src/prompt-builder.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.ts) — 完整 prompt、scope 表达和路径直接插入。
- [src/prompt-builder.test.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/prompt-builder.test.ts) — changed lines、valuable comments 与 scope 回归断言。
- [src/types.ts](https://raw.githubusercontent.com/MattDevy/pi-extensions/main/packages/pi-simplify/src/types.ts) — 数据模型。
- [PR #94](https://github.com/MattDevy/pi-extensions/pull/94) 与 [初始提交](https://github.com/MattDevy/pi-extensions/commit/aded3cd6ea928e93b50e787b4c6443bc2d3f8684) — 移植来源和最初设计。
- [Issue #130](https://github.com/MattDevy/pi-extensions/issues/130)、[PR #148](https://github.com/MattDevy/pi-extensions/pull/148)、[PR #148 Files API](https://api.github.com/repos/MattDevy/pi-extensions/pulls/148/files) — changed-lines 缺陷、修复摘要、实际 patch 与测试。
- [Issue #135](https://github.com/MattDevy/pi-extensions/issues/135)、[PR #153](https://github.com/MattDevy/pi-extensions/pull/153)、[PR #153 Files API](https://api.github.com/repos/MattDevy/pi-extensions/pulls/153/files) — valuable-comments 问题、修复与回归测试。
- [Issue #124](https://github.com/MattDevy/pi-extensions/issues/124)、[PR #127](https://github.com/MattDevy/pi-extensions/pull/127) — Pi npm scope 迁移和 0.75.x peer 放宽背景。
- [Issue #146](https://github.com/MattDevy/pi-extensions/issues/146)、[Issue #147](https://github.com/MattDevy/pi-extensions/issues/147)、[PR #152](https://github.com/MattDevy/pi-extensions/pull/152)、[PR #152 Files API](https://api.github.com/repos/MattDevy/pi-extensions/pulls/152/files) — 0.80.x 冲突、兼容验证声明与移除 peer 上界的 patch。
- [npm registry 0.2.3 元数据](https://registry.npmjs.org/pi-simplify/0.2.3) 与 [npm attestations](https://registry.npmjs.org/-/npm/v1/attestations/pi-simplify@0.2.3) — 发布物文件数、体积、完整性、trusted publisher 与 provenance。
- [Pi 官方 extensions 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — 命令、事件、UI、ExtensionAPI 的官方上下文。
- [Pi 官方 packages 文档](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/packages.md) — 安装、manifest、安全、依赖/peer 指导。
- [Pi 官方 sendUserMessage 示例](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/examples/extensions/send-user-message.ts) — `sendUserMessage` 与 `deliverAs: followUp` 的官方语义示例。
- [同仓库 pi-code-review README](https://github.com/MattDevy/pi-extensions/blob/main/packages/pi-code-review/README.md) 与 [入口源码](https://github.com/MattDevy/pi-extensions/blob/main/packages/pi-code-review/src/index.ts) — 对比自动事件驱动、语言检查和 `/review` 路径。
- [@geminixiang/pi-simplify](https://github.com/geminixiang/pi-simplify) 与 [@nielpattin/pi-simplify](https://github.com/nielpattin/pi-packages/tree/main/packages/pi-simplify) — 用于确认相似名称指向不同 scoped 包，避免身份混淆。
