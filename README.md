# CSL Agent Kit

Personal agent toolkit for [Claude Code](https://docs.claude.com/en/docs/claude-code), [Cursor](https://cursor.com/docs/plugins), [Codex](https://developers.openai.com/codex/skills), and [Pi](https://pi.dev). It packages reusable skills, plugins, commands, hooks, and Pi extensions. Skills follow the open [Agent Skills](https://agentskills.io) standard; CSL recursively discovers leaf `SKILL.md` files below `skills/`.

## Skills

| Skill | Claude | Cursor / Codex / Pi extension | Description |
|-------|--------|------------------------------|-------------|
| create-app-icon | `/csl:create-app-icon` | `/create-app-icon` | Choose from 10 built-in styles, generate and approve an app icon, then create a transparent master and optional platform materials. |
| archive | `/csl:archive` | `/archive` | 将当前 Pi Session 中指定范围的 User 与 Agent 可见文本逐字保存到 `tasks/conversations/`。 |
| venom-cli | `/csl:venom-cli` | `/venom-cli` | Manage Zhihu iOS component dependencies and builds. |
| task-grill | `/csl:task-grill` | `/task-grill` | 以逐题拷问压测计划或决策；既有任务不写入拷问过程，独立话题新建任务记录结论。 |
| task-review | `/csl:task-review` | `/task-review` | 对 canonical task、PR、diff、文件或无文件结果执行一次只反馈审查，并作为文件改动 Task 的强制完成前审查。 |
| skill-quality | `/csl:skill-quality` | `/skill-quality` | Validate Skill packages with the repository-owned deterministic quality gate. |
| git-conflict | `/csl:git-conflict` | `/git-conflict` | 按双方意图谨慎解决进行中的 Git merge 或 rebase 冲突。 |
| beautiful-mermaid | `/csl:beautiful-mermaid` | `/beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG with built-in themes. |
| adversarial-review | `/csl:adversarial-review` | `/adversarial-review` | 以不限轮次、状态驱动的 Reviewer–Editor 闭环审查代码、PRD、RFC、设计文档等交付物。 |
| deliberate | `/csl:deliberate` | `/deliberate` | 由 Synthesizer 与独立 Challenger 先内部批量审议，仅在关键用户选择上暂停询问。 |
| bug-fix | `/csl:bug-fix` | `/bug-fix` | Diagnose and fix bugs, failing tests, CI failures, and regressions. |
| repo-map | `/csl:repo-map` | `/repo-map` | Build a lightweight map of an unfamiliar repo or module before coding. |
| task-context | `/csl:task-context` | `/task-context` | Ensure a standard Project Core, query task-relevant Context Packs, then maintain durable context. |
| topic | `/csl:topic` | `/topic` | 管理长期维护主题的共享规格、版本及任务引用；支持实现、Bug 修复和审查，不限于多平台。 |
| task | `/csl:task` | `/task` | Manage one canonical task through evidence and completion. |
| task-plan | `/csl:task-plan` | `/task-plan` | Prepare a read-only, decisions-only implementation handoff. |
| task-queue | `/csl:task-queue` | `/task-queue` | Run ordered parent and child tasks with a final integration gate. |
| task-lessons | `/csl:task-lessons` | `/task-lessons` | Query, apply, and maintain reusable workspace lessons. |
| task-maintenance | `/csl:task-maintenance` | `/task-maintenance` | 整理 Context/Lessons 数据，并按当前权威架构安全清理或迁移 Task 系统拥有的历史文件与目录。 |
| agent-rules | `/csl:agent-rules` | `/agent-rules` | 管理 Built-in、User 与 Project 三层持久 Agent Rules。 |
| agent-hooks | `/csl:agent-hooks` | `/agent-hooks` | 管理跨会话持久指令，以及按生命周期事件注入 Prompt 或执行脚本的 Hook。 |
| agent-sops | `/csl:agent-sops` | `/agent-sops` | List, create, inspect, and apply SOP documents. |
| brainstorming | `/csl:brainstorming` | `/brainstorming` | Explore design and requirements before implementation. |
| figma-describe | `/csl:figma-describe` | `/figma-describe` | Parse Figma URL into structured UI tree description. |
| align | `/csl:align` | `/align` | Re-explain prior messages with evidence and confidence levels. |
| tldr | `/csl:tldr` | `/tldr` | 按请求中的明确标准生成简略概览或带来源的深入会话报告。 |

Claude-only slash commands: `/csl:sop-activate`, `/csl:doc-sync`.

内置、用户级与项目级 Agent Rules 分别存放在 `skills/meta/agent-rules/agent-rules.md`、`<data-root>/agent-rules.md` 与 `<workspace>/.agents/agent-rules.md`，由 `inner:agent-rules` 按 Built-in → User → Project 合并注入；workspace 的 `AGENTS.md` / `CLAUDE.md` 仍由宿主读取，但不属于 Agent Rules 系统。项目级 SOP 存放在 `<workspace>/.agents/sops/`，用户级 SOP 存放在 `<data-root>/sops/`，同名时项目级优先；跨会话持久指令保存为 `<data-root>/hooks/` 下的全局 `session-start` Prompt 规则。`data-root` 优先取 `CSL_AGENT_KIT_HOME`，否则为 `~/.csl-agent-kit`。Codex 与 Claude Code 在 `SessionStart` 注入，Pi 在每次 agent turn 重建 system context；这些规则不按用户 prompt 关键词匹配。内置 `inner:csl-agent-kit-contract` 默认启用并注入自包含的 CSL Agent Kit 行为契约，覆盖 task-family 路由、目标对齐、Context、Lessons、最小与手术式修改及验证边界；用户可通过 Agent Hooks 禁用。Cursor V1 不支持 Prompt 注入，不能把该宿主上的规则报告为 active。

## 长期 Topic 与独立任务

Topic 保存一个长期主题的当前有效规格，不是另一个任务类型或执行队列。可直接说“创建一个 Topic：账号注销，先讨论需求”“在账号注销 Topic 下排查 Bug”或“继续这个 Topic，查看相关任务”。建立 Topic 不会自动实施全部任务；所有任务完成也不会关闭 Topic。

- Topic 权威记录位于工作区的 `tasks/topics/<topic-id>.md`，可重建导航位于 `tasks/topics.md`；长期共享资料位于该 Topic 的 `resources` 目录，不可变规格快照位于 `revisions` 目录。
- 主文档的 Resources 表记录资料链接、用途及 `normative`（有效约定）/`reference`（参考材料）分类。通过 `topic update-resources --resources-json` 更新完整索引；有效约定固定文件摘要并纳入规格核对，参考资料不使任务证据失效。已有权威文件仅链接，不自动复制；单次任务的报告和日志仍保存在任务产物中。旧 Topic 不批量迁移，保留原版本可读。
- Task 可选关联一个 Topic，保留自己的 Target、Result、审查、验证与 Task Summary；未关联的任务照常运行。Topic 的任务列表只存引用和职责，状态现场读取。
- Topic 使用 Draft、Active、Archived；归档和恢复均需明确意图。Queue 仍管理本地串行依赖，与 Topic 归属分开。
- 通过共享 CLI 的 `topic` 子命令读写；`--help` 列出创建、更新规格、关联、采用新版本、校验和修复命令。版本变化会在评估及终态关卡被检查，不能只改 hash 消除过期。
- 跨仓引用复用已确认的 project-index 映射，校验 Git root 和 origin 身份；跨仓写入需明确授权及 `--allow-cross-workspace`。不支持自动扫描仓库、自动注册或远程克隆。规范性外部接口需有显式固定摘要的本地文件，不自动抓取浮动 URL。
- 内容版本、Active 状态和 maintenance 模式都不代表执行授权。半完成关联必须显式修复；写锁不会自动抢占，多仓写入不宣称崩溃原子性。

详见 [Topic Skill](skills/meta/topic/SKILL.md) 与 [存储和命令契约](skills/meta/topic/references/topic-contract.md)。

## Canonical source and duplicates

This repository is the **canonical source** for CSL Agent Kit. Install via the [`csl-agent-kit` CLI](#csl-agent-kit-cli), [`npx skills`](#npx-skills-cursor-codex-and-other-agents), `pi install`, or each platform's plugin marketplace.

If you also have same-named skills from other marketplaces or personal folders (e.g. `create-app-icon`), remove or rename those copies to avoid the agent loading the wrong version. After installing CSL Agent Kit, prefer invoking skills from this plugin only.

第三方导入技能位于 `skills/<来源分组>/<技能名>/`。每个含 `SKILL.md` 的第三方叶子目录都必须有 `.repository.json`，记录上游仓库 URL、上游相对路径、导入 ref 与 commit、许可证及上游状态。该文件描述上游基线；更新时必须先比较本地改写，不能直接覆盖。

### 检查第三方技能更新

本仓库的 `.agents/skills/integrate-third-skills/` 附带只读 Git 子命令；它是项目本地流程，不会随 CSL 的共享技能、Codex plugin 或 Pi 命令分发，并以 `metadata.internal: true` 从 `npx skills` 的普通可安装清单中排除：

```bash
# 汇总所有导入技能源路径的上游变化状态
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js status

# 比较某项技能：上游自导入后的变化，以及当前上游与本地副本的差异
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff SKILL_NAME

# 需要完整 unified diff 时才输出补丁
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff SKILL_NAME --patch
```

它们从 `.repository.json` 获取上游地址、ref 与导入 commit；不会更新本地技能或 `~/.agents/skills`。每个来源/ref 只在系统临时目录中检出一次上游，并在结束后删除。

Removed skills (no longer shipped): `passing`, `receiving`.

## Install

### CSL Agent Kit CLI

Run directly from npm:

```bash
npx @ssbun/csl-agent-kit install
```

Or install the CLI globally:

```bash
npm install -g @ssbun/csl-agent-kit
csl-agent-kit install
```

Local development:

```bash
npm install
npm link
csl-agent-kit install
```

`csl-agent-kit install` opens an interactive checklist powered by `prompts` so you can choose integrations:

- Cursor local plugin
- Codex plugin (shared skills and lifecycle hooks)
- Pi package

交互式确认后会把勾选项保存到 `~/.csl-agent-kit/install-selection.json`，下次运行会自动预选这些项。显式的 `--target`、`--all` 与 `--yes` 保持一次性命令语义，不会改写这份记录。

Non-interactive examples:

```bash
csl-agent-kit install --yes
csl-agent-kit install --target cursor,codex-plugin
csl-agent-kit install --all --dry-run
csl-agent-kit install --all --verbose
csl-agent-kit install --all --json
```

The default human-readable output streams colored details for every integration, symlink, and external command. `--verbose` (`-v`) remains accepted with the same behavior. Use `--no-color` or `NO_COLOR=1` to disable colors; `--color` explicitly enables them. JSON output always stays color-free. Codex、Claude Code 与 Pi 的自包含 CSL Agent Kit Contract 由内置 Agent Hooks 注入，不依赖替换用户的 Agent 指令文件；Cursor 暂不支持 injected context，也不提供文件替换回退。 The legacy `./scripts/install.sh` entry is a thin wrapper around this npm CLI and forwards the same options.

### npx skills (Cursor, Codex, and other agents)

Use the [Agent Skills CLI](https://skills.sh/) to install individual skills or the full collection into `~/.agents/skills/` (Cursor and other agents discover this path automatically).

**为 Cursor 全量安装所有技能：**

```bash
npx skills add SSBun/csl-agent-kit --all -a cursor -g -y
```

**Install from a local clone (development):**

```bash
git clone https://github.com/SSBun/csl-agent-kit
cd agent-kit
npx skills add . --all -a cursor -g -y
```

**Install specific skills:**

```bash
# List available skills in this repo
npx skills add SSBun/csl-agent-kit --list

# Install by name
npx skills add SSBun/csl-agent-kit --skill task-grill -a cursor -g -y
```

**Other useful commands:**

```bash
npx skills list -g -a cursor          # list installed global skills
npx skills update -g -y               # update installed skills
npx skills remove task-grill -g -a cursor -y
```

Reload Cursor (`Developer: Reload Window`) after installing. Skills also appear under **Settings → Rules → Agent Decides**.

For Codex or other agents, replace `-a cursor` with the target agent (e.g. `-a codex`) or omit `-a` to install for all supported agents.

Browse skills at [skills.sh](https://skills.sh/).

### Claude Code

```bash
/plugin marketplace add SSBun/csl-agent-kit
/plugin install csl@SSBun-csl-agent-kit
```

Local development:

```bash
/plugin marketplace add /path/to/agent-kit
/plugin install csl@SSBun-csl-agent-kit
```

### Cursor

**Marketplace / team:** Import this repo as a [Team Marketplace](https://cursor.com/docs/plugins#add-a-team-marketplace).

**Local development:**

```bash
git clone https://github.com/SSBun/csl-agent-kit ~/.cursor/plugins/local/csl
# or: csl-agent-kit install --target cursor
```

Reload Cursor (`Developer: Reload Window`).

### Pi

Install as a Pi package from this local clone:

```bash
pi install /path/to/agent-kit
# or from inside the repo:
pi install .
```

The Pi package manifest in `package.json` exposes:

- `skills/` as Pi skills, available as `/skill:<name>`.
- `pi/extensions/` as Pi-specific extensions.
- `pi/extensions/csl-skill-commands.ts`，动态发现 `skills/` 下的叶子 `SKILL.md`，并添加 `/repo-map`、`/task-review`、`/brainstorming` 等 Cursor/Codex 风格别名。
- `pi/extensions/csl-context-hooks.ts`：桥接 Agent Hooks 到 Pi 的事件总线——`session-start`/`prompt-submit` 注入 systemPrompt，`after-tool` 注入 tool_result，`before-tool`/`before-compact`/`after-compact`/`stop` 执行脚本副作用；同时加载匹配的 SOP context、在变更前显示一次 SOP 提醒，并在 Figma/MasterGo 设计数据获取后追加 `figma-describe` 指引。Pi 不支持 block 与 permission/subagent 事件。
- `pi/extensions/openai-codex-fast.ts`, adding persistent OpenAI Codex Fast Mode controls and a footer status indicator.
- `pi/extensions/csl-model-presets.ts`：通过 `/preset` 同时切换模型与 thinking level；`/quick <prompt>` 临时使用名为 `quick` 的预设执行一次 prompt，结束后恢复原模型。预设来自 `~/.pi/agent/presets.json`，每次执行命令时重新读取。
- `pi/extensions/csl-settings.ts`：通过 `/csl-settings` 配置审查模型、思考强度与三层 Task 确认模式；`/task-mode` 快捷管理确认偏好，`csl_review_config` 只解析审查启动参数，不启动子 Agent。
- `pi/extensions/csl-task-overlay.ts`：只读浮层，从 `<cwd>/tasks/tasks.md` 渲染最近 6 个任务的实时进度与可点击标题；通过 `task_focus` 或 `/task-focus` 保存当前 session 的任务关注，并用 `/tasks` 按状态打印最近 20 个带可点击标题的任务。

- `pi/extensions/csl-ansi.ts`：注册 `render_ansi` 工具，直接在会话中渲染 ANSI 彩色字符与等宽图，不添加工具标题或成功状态背景。

#### ANSI 字符渲染

Agent 调用 `render_ansi`，传入含真实 ESC 字符的 `text` 字符串；在 JSON 中用 `\u001b` 表示 ESC，不要传入字面量 `\\x1b`：

```json
{"text":"\u001b[1;31m红色粗体\u001b[0m  普通文字\n下一行"}
```

支持重置、粗体、暗淡、斜体、下划线、反色、删除线，以及标准色、亮色、256 色和 RGB 前景／背景色（分号格式）。拒绝光标移动、清屏、OSC（包括超链接与剪贴板）、闪烁、隐藏文字、Tab 和 CR。使用空格对齐、LF 换行；输入连同转义序列最多 32 KiB、200 行。跨行样式会延续，窄窗口裁切并提示加宽，不自动折行破坏字符图。非 TUI 客户端收到纯文本内容，颜色和字体样式的实际效果由终端决定。

若之前单独安装过提供 `render_ansi` 的全局扩展，切换到内置版本前，先通过 `pi config` 禁用该独立副本并启用包内 `csl-ansi.ts`，再执行 `/reload`。两个副本不要同时启用；本包不会自动删除独立扩展文件。内置扩展随现有 Pi 包目录发现机制加载，无需另外注册工具。

**启用/禁用扩展或技能：** 装完整包后，用 pi 原生命令精细控制：

```bash
pi config          # 全局：启用/禁用包资源（skills + extensions）
pi config -l       # 项目级：覆盖全局设置（写入 .pi/settings.json）
```

TUI 里 Tab 切换 global / project-local scope，空格切换启用状态。无需手动编辑 `settings.json`。

#### CSL Agent Kit 通用设置

在 Pi TUI 中执行 `/csl-settings` 打开英文设置面板。每次选定值后自动保存并应用，无需 Save 或 Cancel 按钮；退出主面板保留已应用的修改，退出子菜单而未选定值则不修改该项。该入口用于 CSL Agent Kit 的通用设置，目前包括审查配置与 Task 确认模式。

审查模型和思考强度可独立选择 `Inherit from parent`（继承父 Agent）。默认两项均未配置，因此在每次新审查启动前继承父会话**当时实际使用的**模型与思考强度，而不是 Pi 新会话默认值或 reviewer 自带的 `high`。`off` 表示明确关闭思考，不表示继承。

设置保存在 `~/.csl-agent-kit/settings.json`；设置了 `CSL_AGENT_KIT_HOME` 时使用该目录。最小示例：

```json
{
  "review": {
    "model": "provider/model-id",
    "thinking": "medium"
  }
}
```

删除字段、空字符串或 `null` 均表示该项继承；文件不存在或内容为 `{}` 表示全部继承。不要给 `review.model` 添加思考强度后缀。自动保存只更新审查配置，保留其他设置；无效选择或写入失败会报错，不会显示为已应用，格式损坏不会被静默覆盖。选择 `Inherit from parent` 可逐项清空覆盖，即使当前模型暂不可用也能恢复继承；实际启动审查前仍会验证最终模型与思考强度组合。

Pi 中的 CSL `task-review` 和 `adversarial-review` Reviewer 启动前，主 Agent 按 `csl_review_config` 的工具指引读取配置，将返回的 `launch.model` 原样传入现有 `subagent` 调用；脚本工作流应在每个 Reviewer 子调用中传入，而不是覆盖整个工作流。该值包含 `provider/model:thinking`，因此优先于 carrier 的默认模型和思考强度。配置解析失败时应停止，不自动换模型或降级；原有 subagent 模型范围、思考上限、隔离和授权限制仍然有效。

这是 CSL 审查流程的显式启动参数接入，不是对全部 subagent 调用的拦截。手动 `/run reviewer`、其他流程及 Editor 等非审查角色不受影响。工具指引要求在父会话或设置改变后重新解析；已启动或恢复的子 Agent 保留原启动契约，需要新配置时启动新的审查子 Agent。配置保存后后续解析立即生效，无需重载；初次加载新扩展仍需 `/reload`。非 TUI 模式不能打开设置面板，但仍可调用只读解析工具。没有加载此扩展的宿主不使用此 Pi 配置。

#### Task SOLO 模式

`task-mode` 是共享 Skill，不限于 Pi。Codex 加载包含该 Skill 的插件后，可直接调用：

```text
$task-mode show
$task-mode project solo
$task-mode global confirm
$task-mode project inherit
```

也可自然语言要求“使用 task-mode，将当前项目设为 SOLO”。Skill 复用下述同一 CLI 和存储，修改后重新查询并报告有效值及来源；会话覆盖必须有宿主提供的真实身份。身份不可用时，只能报告项目／全局解析结果，不能冒称当前会话已生效。仓库新增 Skill 不等于已安装 Codex 插件自动更新；若检索不到，需先更新或重新加载实际安装的插件。

Pi 保留直接 `/task-mode` 命令及 `/csl-settings` 面板；需要走 Agent Skill 时使用 `/skill:task-mode`。自动 Skill 别名不重复注册 `/task-mode`，避免遮蔽直接配置命令。

`/csl-settings` 的 `Task · Confirmation mode` 可选择作用域和值；选定后立即保存。也可以直接操作：

```text
/task-mode                                  # 查看有效模式、来源及三层值
/task-mode session solo                     # 仅当前会话使用 SOLO
/task-mode project solo                     # 当前项目默认使用 SOLO
/task-mode global solo                      # 所有项目默认使用 SOLO
/task-mode session confirm                  # 当前会话明确恢复确认，覆盖下层自主配置
/task-mode session inherit                  # 删除会话覆盖，恢复继承（不等于关闭自主）
```

优先级为 **会话 > 项目 > 全局 > 默认 confirm**。**SOLO** 的配置值为 `solo`：在进入 L0–L4 之前直接走 SOLO 执行路径，完全跳过原 Task 二次确认分级。Agent 展示完整 Task Target 后直接推进最终结果，对目标范围内的操作选择自行查证、采用合理且有边界的默认值，不反复询问下一步。

用户命令已经涵盖的外部发布、部署、X 发帖／回复和批次操作，跳过框架或 SOP 额外要求的确认，说明动作、对象及后果后继续。SOP 写着“安全确认”或“必须询问”本身不是暂停理由，但不意味着跳过整个 SOP：仍保留账号／对象核对、防重复发送、平台限制、宿主强制审批及更高优先级安全约束。你明确要求的暂停依然有效；没有授权的发布、不可确定的必要身份或凭据等是真实阻塞，Agent 应完成不受影响的部分并报告，不能编造权限或结果。查询／切换模式本身不会恢复旧 X 批次。任务记录、自检、R0／R1／R2 自动质量审查和最终验证不变。

已有配置中的 `autonomous` 会在读取时归一为 `solo`，不自动改写文件；新配置仅使用 `solo`／`confirm`／`inherit`。旧命令参数 `autonomous` 不再接受，请改用 `solo`。

配置全部保存在用户数据目录（`CSL_AGENT_KIT_HOME`，默认 `~/.csl-agent-kit`）：全局复用 `settings.json` 中的 `task.mode`；项目位于 `projects/<规范化工作区路径摘要>/settings.json`；会话位于 `sessions/<宿主、工作区和会话ID摘要>/settings.json`。项目设置不从仓库读取，避免仓库改动自行开启自主权限；同一路径重开仍有效，移动项目后视为另一项目。恢复同一会话保留覆盖，新会话或不同宿主不继承旧会话覆盖。`inherit` 删除当前层 `task.mode`，保留其他配置。未配置时默认确认；损坏或无效配置降回确认并报告错误，不复用旧自主状态。

Pi 在每次 Agent 开始处理新一轮请求时重新解析配置，包括恢复与压缩后的会话；正在执行的一轮不承诺即时切换。初次安装或更新此功能需 `/reload`；设置模块重载时会定向清除共享模式模块的原生缓存，避免磁盘已更新为 SOLO 而命令仍使用旧枚举。如果重载后仍显示只接受 autonomous，检查实际加载的插件副本是否已更新；`/reload` 不会下载新版本。必须启用 `csl-context-hooks` 和 `inner:csl-agent-kit-contract` 才会注入模式。设置面板或命令的保存成功本身不证明 Hook 已启用。原生 Codex/Claude Code 在 SessionStart（含 resume/compact）读取配置；中途修改后需恢复会话，或由 Agent 使用真实宿主/会话 ID 显式重新查询后才应用。没有模式注入的宿主不能仅凭已保存配置声称功能生效。

跨宿主配置入口（从已安装包根目录调用；会话 ID 必须来自宿主，不可猜测）：

```bash
node skills/meta/csl-tasks/shared/scripts/task-mode.js show --workspace /path/to/project
node skills/meta/csl-tasks/shared/scripts/task-mode.js set project solo --workspace /path/to/project
node skills/meta/csl-tasks/shared/scripts/task-mode.js set session confirm --workspace /path/to/project --host codex --session ACTUAL_SESSION_ID
```

CLI 成功输出 JSON，错误写入 stderr 并返回 1；`show` 不写文件，省略会话身份时只解析项目和全局。`set` 输出保存位置，`show` 显示最终有效模式与各层来源；它不修改宿主权限。Agent 只能在用户明确要求某个作用域和值时更改配置，不能为了继续工作自行启用自主模式。

#### 模型预设

模型与 thinking level 预设写在 `~/.pi/agent/presets.json`：

```json
{
  "quick": {
    "provider": "deepseek",
    "model": "deepseek-v4-flash-vision-exp",
    "thinkingLevel": "off"
  },
  "flash-max": {
    "provider": "deepseek",
    "model": "deepseek-v4-flash",
    "thinkingLevel": "max"
  },
  "sol-xhigh": {
    "provider": "openai-codex",
    "model": "gpt-5.6-sol",
    "thinkingLevel": "xhigh"
  }
}
```

在 Pi 中执行 `/preset list` 查看当前预设，执行 `/preset` 交互选择，或直接执行 `/preset flash-max`、`/preset sol-xhigh`。执行 `/quick <prompt>` 会临时切换到 `quick` 预设，完成后恢复原模型与 thinking level。配置文件每次执行时重新读取，修改后无需 `/reload`。

Fast Mode usage:

```bash
pi --fast
```

Inside Pi:

```text
/fast on
/fast off
/fast toggle
/fast status
```

The Fast Mode setting is persisted in `~/.pi/agent/csl/openai-codex-fast.json`, so new Pi sessions reuse the configured value. When enabled, the footer status area shows `fast` next to Pi's other status indicators. The extension injects `service_tier: "priority"` only for eligible `openai-codex` models such as `gpt-5.4` and `gpt-5.5`. Actual availability depends on Codex/ChatGPT authentication and account entitlement; regular OpenAI API keys may not receive Fast Mode credits.

context hooks 从 `<data-root>/hooks/*.md` 和 `<data-root>/sops/*.md` 读取用户数据；Pi 在每次 agent turn 前重建 context。修改后的本地开发环境请重启 Pi 或运行 `/reload`。

The CSL Agent Kit CLI also supports:

```bash
csl-agent-kit install --target pi
csl-agent-kit agent-hooks list
csl-agent-kit agent-hooks disable project:broken-rule
csl-agent-kit agent-hooks disable inner:refresh-tab-title
csl-agent-kit agent-hooks enable inner:refresh-tab-title
```

所有 `inner:*` hooks 随 skill 内置并默认启用。用户禁用项持久化在 `<data-root>/hooks/config.json` 的 `disabledHooks` 数组中；`enable` 会从数组移除对应 ID。Inner hook 源文件仍不可通过 CLI 创建、更新或删除。可选的 `hookSettings` 按 qualified ID 保存；Agent Hooks 只把当前 Hook 的配置通过 `AGENT_HOOKS_HOOK_CONFIG` 传给对应脚本：

```json
{
  "schema": "agent-hooks.config/v1",
  "disabledHooks": [],
  "hookSettings": {
    "inner:refresh-tab-title": {
      "model": "deepseek/deepseek-v4-flash"
    }
  }
}
```

### Codex

Enable skills in `~/.codex/config.toml`:

```toml
[features]
skills = true
```

```bash
csl-agent-kit install --target codex-plugin
```

`csl-agent-kit@csl-agent-market` 是 Codex 的唯一默认安装目标；repository-root plugin 同时包含共享 `skills/` 与 `hooks/hooks.json`，不再创建 `~/.agents/skills` 链接。安装成功后，安装器会删除仍指向本包 `skills/` 树的旧 CSL symlink（包括已经失效的旧 skill 链接），但保留普通文件、目录与外部 symlink。dry-run 只报告这些迁移，不修改文件。

`integrate-third-skills` 仅位于本仓库的 `.agents/skills/`，不会进入 Codex plugin。`UserPromptSubmit` hook 只注入 SOP candidates；跨会话指令通过全局 Agent Hooks `session-start` 规则注入，不参与按 prompt 匹配。hook scripts 从安装后的 plugin root 解析。重新运行安装器仍会清理旧的 `csl@CSL` 与 `csl@csl` 注册。

### All platforms

```bash
csl-agent-kit install --all
```

## Repository layout

```
skills/                  # Shared skill source (all platforms)
skills/meta/{task,task-plan,task-queue}/ # Cross-host task workflow skills
skills/meta/csl-tasks/shared/           # Shared task-state core
skills/meta/{task-context,task-lessons,task-maintenance}/ # Context and lessons workflow skills
.agents/skills/integrate-third-skills/ # 仅当前仓库发现的第三方技能集成流程
.claude-plugin/          # Claude Code plugin manifest
.cursor-plugin/          # Cursor plugin manifest
.codex-plugin/           # Codex repository-root plugin manifest
.agents/plugins/         # Codex repo marketplace pointing at the repository root
.agents/skills/          # 仅当前仓库发现的项目本地技能
commands/                # Claude Code slash commands only
hooks/                   # Codex lifecycle hooks bundled with the plugin
pi/extensions/           # Pi-specific extensions and commands
package.json             # Pi package manifest (skills + Pi extensions)
bin/csl-agent-kit.js     # npm CLI installer and maintenance entry
scripts/install.sh       # Thin compatibility wrapper around the npm CLI
```

## License

[MIT](LICENSE) — © 2026 CSL
