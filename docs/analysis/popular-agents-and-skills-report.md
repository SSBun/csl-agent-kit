# 主流 Agent 与高频 Skills 调研报告

调研日期：2026-06-25

## 结论摘要

当前最强的趋势不是“更多 persona”，而是把 agent 接入真实开发闭环：读仓库、改文件、跑 shell、跑测试、看浏览器、查文档、做 PR/issue、按 hook 或 skill 执行固定流程。最值得投入的 coding skills 也集中在这些闭环上。

对本仓库来说，最能提升 Codex 编码能力的新增方向是：

1. `test-triage`：失败复现、最小化、定位、修复、回归验证。
2. `repo-map`：快速建立仓库地图、命令索引、模块边界和风险区。
3. `dependency-docs`：在写代码前查官方文档、版本和 breaking changes。
4. `browser-ui-verify`：前端/网页变更后的 Playwright 截图、交互和响应式验证。
5. `security-review`：依赖、权限、shell、网络、secret、注入和发布前安全检查。
6. `release-gate`：把 release SOP 变成强制确认清单和验证门禁，而不是直接发布脚本。

## 口径与限制

没有可靠公开数据能说明“某个 skill 被使用了多少次”。本报告用三个弱信号估算频率：

- GitHub stars/forks/活跃时间：衡量 agent 或 skill repo 的生态可见度。
- 官方文档和 README：看工具强调哪些能力。
- 多个生态重复出现的能力类别：如果 Codex、Claude Code、Cline、OpenHands、Goose、Aider、Continue、skills repo 都在强调，说明是高频需求。

GitHub 数字来自 2026-06-25 通过 GitHub API 读取，stars 会持续变化。

## 主流 Agent 与生态信号

| 项目 | 类型 | Stars | 观察 |
|---|---:|---:|---|
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | 通用 agent 平台 | 185k | 通用自主 agent 的早期代表，流量大，但不等于 coding 专项最强。 |
| [opencode](https://github.com/sst/opencode) | 终端 coding agent | 178k | 终端 agent 热度极高，说明 CLI-native 编码流仍是核心战场。 |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | 终端 coding agent | 106k | 大厂 CLI agent，强化终端和本地工作区。 |
| [browser-use](https://github.com/browser-use/browser-use) | 浏览器 agent 工具 | 101k | 浏览器自动化成为 agent 必备能力之一，尤其对 UI 验证和网页任务。 |
| [OpenAI Codex](https://github.com/openai/codex) | 终端 coding agent | 94k | 官方定位是本地运行的轻量 coding agent。 |
| [OpenHands](https://github.com/OpenHands/OpenHands) | agent control center / automation | 78k | 强调自托管、长期运行、GitHub/Slack/Linear 自动化和多后端 agent。 |
| [Cline](https://github.com/Cline/Cline) | IDE/CLI/SDK coding agent | 64k | 强调 IDE、terminal、SDK、headless/CI 等多入口。 |
| [AutoGen](https://github.com/microsoft/autogen) | agent framework | 59k | 多 agent 编排框架，适合构建 agentic app，而不只是单个 coding assistant。 |
| [CrewAI](https://github.com/crewAIInc/crewAI) | multi-agent framework | 54k | 角色化 agent 协作仍流行，但 coding 提升需要落到工具闭环。 |
| [Goose](https://github.com/block/goose) | 可扩展 coding agent | 50k | README 直接强调 install、execute、edit、test 和任意 LLM。 |
| [Aider](https://github.com/Aider-AI/aider) | 终端 pair programming | 47k | 控制面窄但稳定，适合“开发者主导、agent 辅助”的代码编辑。 |
| [Agno](https://github.com/agno-agi/agno) | agent platform | 41k | 偏构建、运行、管理 agent 平台。 |
| [LangGraph](https://github.com/langchain-ai/langgraph) | agent workflow framework | 36k | “resilient agents”代表状态机/图式 agent 编排方向。 |
| [Continue](https://github.com/continuedev/continue) | 开源 coding agent | 34k | IDE 内上下文、补全、chat、agent 工作流是主要卖点。 |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | IDE multi-agent coding | 24k | 强调“editor 里的 AI dev team”，说明模式/角色拆分有需求。 |

商业闭源或半闭源工具如 Cursor、GitHub Copilot、Claude Code、Windsurf 不适合用 GitHub stars 横向比较，但它们的能力方向与上表高度一致：IDE/CLI 入口、本地仓库上下文、工具调用、PR/issue 工作流、MCP/插件/skills、测试和 review。

## Skill 生态信号

| 来源 | 信号 |
|---|---|
| [Codex Agent Skills](https://developers.openai.com/codex/skills) | OpenAI 文档把 skill 定义为 task-specific capability，包含 instructions、resources、optional scripts，并用 progressive disclosure 只在需要时加载。 |
| [Agent Skills 标准](https://agentskills.io/home) | 标准格式是 `SKILL.md` 加可选 `scripts/`、`references/`、`assets/`。这说明好 skill 不是长 prompt，而是可复用工作流包。 |
| [Claude Code Skills](https://code.claude.com/docs/en/skills) | Claude 文档建议把反复粘贴的 checklist、多步骤流程、从 CLAUDE.md 膨胀出来的 procedure 拆成 skill。 |
| [Anthropic skills repo](https://github.com/anthropics/skills) | 覆盖文档、PDF、PPT、表格、web testing、MCP server generation、enterprise workflows。 |
| [OpenAI skills repo](https://github.com/openai/skills) | 原 skill catalog 已标记 deprecated，转向 plugin 分发；说明可安装插件是长期分发形态。 |
| [claude-skills](https://github.com/alirezarezvani/claude-skills) | 大型社区库覆盖工程、DevOps、安全、Playwright、产品、研究、项目管理、合规等，工程类占比和可见度都高。 |

## 高频 Skill 类型

| 频率判断 | Skill 类型 | 为什么高频 |
|---|---|---|
| 极高 | 仓库理解 / 代码搜索 / 架构地图 | 每次 coding agent 开工都需要建立上下文；缺失时最容易误改边界。 |
| 极高 | 文件编辑 + shell + 测试执行 | 主流 coding agent 的核心闭环，Goose/Codex/Cline/OpenHands/Aider 都围绕它工作。 |
| 极高 | 测试生成 / 失败 triage / 回归验证 | 这是防止“看起来能跑”的主要机制，也是 coding power 的最大增益点。 |
| 高 | 文档检索 / 官方 API 查询 / 版本确认 | 现代库变化快，靠记忆写代码风险高。 |
| 高 | 浏览器自动化 / UI 截图 / Playwright | 前端和产品型任务必须看真实页面，不然容易出现布局、交互、响应式问题。 |
| 高 | Code review / security review | PR 前质量门禁，尤其是权限、secret、shell、网络、依赖和注入风险。 |
| 高 | Git / GitHub / issue / PR 工作流 | OpenHands、Codex、GitHub Agent HQ 等都把 agent 接到 issue/PR。 |
| 中高 | MCP / connectors / external tool integration | Agent 越要进入真实工作流，越需要 GitHub、Slack、Linear、Docs、Figma 等工具。 |
| 中 | Release / deploy / CI/CD | 高频但高风险；适合 SOP + gate，不适合“一把梭”通用 release skill。 |
| 中 | Handoff / memory / lessons / SOP | 长会话和跨项目复用必须有，但它增强的是连续性，不直接替代测试和验证。 |

## 对本仓库的现状判断

已有能力：

- `analyze-project`：覆盖项目分析。
- `brainstorming` / `grill-me` / `same-page`：覆盖需求澄清与一致性。
- `code-reviewer`：覆盖 review。
- `figma-describe` / `beautiful-mermaid` / `create-app-icon`：覆盖设计与视觉辅助。
- `handoff-save` / `handoff-restore`：覆盖上下文交接。
- `sop-manager`：覆盖跨项目流程和 lessons。
- `release` + release SOP：已从直接发布改成路由和确认。

主要缺口：

1. 缺少专门的 test/debug skill。现在依赖通用行为或外部 skill，应该内置一个最小但强约束的 `test-triage`。
2. 缺少 dependency docs skill。遇到 Swift、npm、Python、Rust、OpenAI、Figma 等动态 API 时，应强制查官方文档或本地 lockfile。
3. 缺少 browser/UI verification skill。前端变更应默认截图、交互、移动端尺寸验证。
4. 缺少 repo-map skill。`analyze-project` 偏报告，coding 前需要更轻量的“当前任务相关仓库地图”。
5. 缺少 security/release gate 细分 SOP。release 已变薄，但 PyPI、Cargo、Xcode DMG 还没有专用 SOP。

## 建议新增或强化的 Skills

### 1. `test-triage`

用途：当用户报告测试失败、bug、CI failure、运行错误，或修改共享逻辑后需要验证。

核心步骤：

- 找到最小复现命令。
- 先跑失败，记录错误。
- 定位改动面，修最小范围。
- 跑相关测试。
- 能做回归时做 red/green 验证。

收益：这是最直接提高 coding reliability 的 skill。

### 2. `repo-map`

用途：在陌生仓库或跨模块改动前，快速产出任务相关地图。

核心步骤：

- 找入口、构建命令、测试命令、关键目录。
- 找同类实现和本地风格。
- 标注不要碰的无关区域。
- 输出 5-10 条任务相关事实，不写长报告。

收益：减少误改和过度阅读，比完整 audit 更轻。

### 3. `dependency-docs`

用途：使用新库、新版本 API、平台 SDK、CLI 参数、发布流程、法律/安全规则前。

核心步骤：

- 先查 lockfile/package manifest 确认版本。
- 优先官方文档、官方 changelog、源码 README。
- 把关键 API shape 或命令参数写到实现前注记。

收益：减少幻觉 API、过期命令和错误参数。

### 4. `browser-ui-verify`

用途：网页、UI、Figma-to-code、交互工具、canvas/Three.js、响应式布局。

核心步骤：

- 启动本地 dev server。
- 用 Playwright 打开页面。
- 截桌面和移动端。
- 检查 console error、布局重叠、空白 canvas、关键交互。

收益：把“代码看起来对”变成“用户真的能看到和操作”。

### 5. `security-review`

用途：涉及认证、权限、shell、文件系统、网络、依赖、secret、hook、插件安装、发布流程。

核心步骤：

- 检查 secret 泄漏、命令注入、路径遍历、宽权限、远程执行。
- 检查依赖安装和全局写入是否需要用户确认。
- 检查 hook 是否可能静默执行高风险命令。

收益：本仓库是 plugin/skill 仓库，hook 和 install 脚本风险比普通业务代码更高。

### 6. `release-gate` SOP 套件

用途：补齐 `release-orchestrator` 引用但尚未存在的生态 SOP。

优先级：

1. `xcode-macos-dmg-release`
2. `python-pypi-release`
3. `cargo-crates-release`

收益：保留 release skill 的薄路由设计，同时让具体生态有真实流程。

## 不建议优先做的 Skills

- 大量 persona：对编码质量的边际收益低，容易膨胀上下文。
- 通用“senior engineer”skill：太宽，触发不稳定，容易和系统指令重复。
- 一体化 release skill：风险高，已经被拆成 SOP 路由是正确方向。
- 过宽的“agent team”skill：没有明确输入/输出和验证命令时，会变成角色扮演。

## 推荐实施顺序

1. 先做 `test-triage`，因为它覆盖 bug、CI、回归验证，是编码闭环的硬底座。
2. 再做 `repo-map`，让每次改代码前更快理解局部结构。
3. 再做 `dependency-docs`，把“动态知识必须查证”固化成流程。
4. 再做 `browser-ui-verify`，专门服务前端和设计实现。
5. 最后补 `security-review` 和 release 专用 SOP。

## Sources

- OpenAI Codex Agent Skills: https://developers.openai.com/codex/skills
- Agent Skills open standard: https://agentskills.io/home
- Claude Code Skills: https://code.claude.com/docs/en/skills
- Anthropic skills repo: https://github.com/anthropics/skills
- OpenAI skills repo: https://github.com/openai/skills
- Community skills repo: https://github.com/alirezarezvani/claude-skills
- OpenAI Codex repo: https://github.com/openai/codex
- OpenHands repo: https://github.com/OpenHands/OpenHands
- Cline repo: https://github.com/Cline/Cline
- Aider repo: https://github.com/Aider-AI/aider
- Continue repo: https://github.com/continuedev/continue
- Roo Code repo: https://github.com/RooCodeInc/Roo-Code
- Goose repo: https://github.com/aaif-goose/goose
- Gemini CLI repo: https://github.com/google-gemini/gemini-cli
- opencode repo: https://github.com/sst/opencode
