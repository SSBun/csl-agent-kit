# CSL Agent Kit

Personal agent toolkit for [Claude Code](https://docs.claude.com/en/docs/claude-code), [Cursor](https://cursor.com/docs/plugins), [Codex](https://developers.openai.com/codex/skills), and [Pi](https://pi.dev). It packages reusable skills, plugins, commands, hooks, and Pi extensions. Skills follow the open [Agent Skills](https://agentskills.io) standard; CSL recursively discovers leaf `SKILL.md` files below `skills/`.

## Skills

| Skill | Claude | Cursor / Codex / Pi extension | Description |
|-------|--------|------------------------------|-------------|
| create-app-icon | `/csl:create-app-icon` | `/create-app-icon` | Generate an AI-image-generator prompt for an app icon. |
| archive | `/csl:archive` | `/archive` | 将当前 Pi Session 中指定范围的 User 与 Agent 可见文本逐字保存到 `tasks/conversations/`。 |
| release | `/csl:release` | `/release` | Route release work to the matching SOP and gather confirmation items. |
| venom-cli | `/csl:venom-cli` | `/venom-cli` | Manage Zhihu iOS component dependencies and builds. |
| task-grill | `/csl:task-grill` | `/task-grill` | 以逐题拷问压测计划或决策；既有任务不写入拷问过程，独立话题新建任务记录结论。 |
| task-review | `/csl:task-review` | `/task-review` | 对 canonical task、PR、diff、文件或无文件结果执行一次只反馈审查。 |
| domain-modeling | `/csl:domain-modeling` | `/domain-modeling` | 建立领域术语、统一语言与架构决策。 |
| improve-codebase-architecture | `/csl:improve-codebase-architecture` | `/improve-codebase-architecture` | 扫描架构改进机会并生成可视化报告。 |
| research | `/csl:research` | `/research` | 基于高可信来源调研并产出带引用的 Markdown。 |
| resolving-merge-conflicts | `/csl:resolving-merge-conflicts` | `/resolving-merge-conflicts` | 按双方意图解决进行中的 merge 或 rebase 冲突。 |
| tdd | `/csl:tdd` | `/tdd` | 以 red-green-refactor 流程进行测试驱动开发。 |
| grilling | `/csl:grilling` | `/grilling` | 对计划、决策或想法进行逐项压力测试。 |
| handoff | `/csl:handoff` | `/handoff` | 将当前对话压缩为可继续工作的交接文档。 |
| teach | `/csl:teach` | `/teach` | 在当前工作区中分多轮教授概念或技能。 |
| writing-great-skills | `/csl:writing-great-skills` | `/writing-great-skills` | 编写和维护高质量 Agent Skill 的参考。 |
| beautiful-mermaid | `/csl:beautiful-mermaid` | `/beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG with built-in themes. |
| adversarial-review | `/csl:adversarial-review` | `/adversarial-review` | 以不限轮次、状态驱动的 Reviewer–Editor 闭环审查代码、PRD、RFC、设计文档等交付物。 |
| deliberate | `/csl:deliberate` | `/deliberate` | 由 Synthesizer 与独立 Challenger 先内部批量审议，仅在关键用户选择上暂停询问。 |
| test-triage | `/csl:test-triage` | `/test-triage` | Diagnose failing tests, bugs, CI failures, and regressions. |
| repo-map | `/csl:repo-map` | `/repo-map` | Build a lightweight map of an unfamiliar repo or module before coding. |
| task-context | `/csl:task-context` | `/task-context` | Load or recover Project Core, query task-relevant Context Packs, then maintain durable context. |
| task | `/csl:task` | `/task` | Manage one canonical task through evidence and completion. |
| task-plan | `/csl:task-plan` | `/task-plan` | Prepare a read-only, decisions-only implementation handoff. |
| task-queue | `/csl:task-queue` | `/task-queue` | Run ordered parent and child tasks with a final integration gate. |
| task-lessons | `/csl:task-lessons` | `/task-lessons` | Query, apply, and maintain reusable workspace lessons. |
| agent-rules | `/csl:agent-rules` | `/agent-rules` | 管理每次会话启动时注入的持久 Agent 规则。 |
| agent-hooks | `/csl:agent-hooks` | `/agent-hooks` | 管理跨会话持久指令，以及按生命周期事件注入 Prompt 或执行脚本的 Hook。 |
| agent-sops | `/csl:agent-sops` | `/agent-sops` | List, create, inspect, and apply SOP documents. |
| brainstorming | `/csl:brainstorming` | `/brainstorming` | Explore design and requirements before implementation. |
| figma-describe | `/csl:figma-describe` | `/figma-describe` | Parse Figma URL into structured UI tree description. |
| align | `/csl:align` | `/align` | Re-explain prior messages with evidence and confidence levels. |
| tldr | `/csl:tldr` | `/tldr` | 按请求中的明确标准生成简略概览或带来源的深入会话报告。 |

Claude-only slash commands: `/csl:sop-activate`, `/csl:doc-sync`.

项目级 SOP 存放在 `<workspace>/.agents/sops/`，用户级 SOP 存放在 `<data-root>/sops/`，同名时项目级优先；跨会话持久指令保存为 `<data-root>/hooks/` 下的全局 `session-start` Prompt 规则。`data-root` 优先取 `CSL_AGENT_KIT_HOME`，否则为 `~/.csl-agent-kit`。Codex 与 Claude Code 在 `SessionStart` 注入，Pi 在每次 agent turn 重建 system context；这些规则不按用户 prompt 关键词匹配。内置 `inner:workspace-workflow-gates` 默认启用并注入自包含的 CSL Agent Kit 行为契约，覆盖目标对齐、Context、Lessons、最小与手术式修改及验证边界；用户可通过 Agent Hooks 禁用。Cursor V1 不支持 Prompt 注入，不能把该宿主上的规则报告为 active。

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
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff research

# 需要完整 unified diff 时才输出补丁
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff research --patch
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
- Default agent instructions（仅显式选择；会备份普通文件后创建全局 symlink）

交互式确认后会把勾选项保存到 `~/.csl-agent-kit/install-selection.json`，下次运行会自动预选这些项；`Default agent instructions` 除外，它每次运行都必须主动勾选。显式的 `--target`、`--all` 与 `--yes` 保持一次性命令语义，不会改写这份记录。

Non-interactive examples:

```bash
csl-agent-kit install --yes
csl-agent-kit install --target cursor,codex-plugin
csl-agent-kit install --target super-agent
csl-agent-kit install --all --dry-run
csl-agent-kit install --all --verbose
csl-agent-kit install --all --json
```

The default human-readable output streams colored details for every integration, symlink, and external command. `--verbose` (`-v`) remains accepted with the same behavior. Use `--no-color` or `NO_COLOR=1` to disable colors; `--color` explicitly enables them. JSON output always stays color-free. `super-agent` 仅在显式选择时运行；选中后会重置现有 Agent instruction symlink，普通文件会先备份再替换。Codex、Claude Code 与 Pi 的自包含 CSL Agent Kit 行为契约由内置 Agent Hooks 注入，不依赖替换用户的 Agent 指令文件；Cursor 暂不支持 injected context，默认安装不再用指令文件替换回退。 The legacy `./scripts/install.sh` entry is a thin wrapper around this npm CLI and forwards the same options.

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
npx skills add SSBun/csl-agent-kit --skill task-grill --skill release -a cursor -g -y
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
- `pi/extensions/csl-model-presets.ts`：通过 `/preset` 同时切换模型与 thinking level；预设来自 `~/.pi/agent/presets.json`，每次执行命令时重新读取。
- `pi/extensions/csl-task-overlay.ts`：只读浮层，从 `<cwd>/tasks/tasks.md` 渲染最近 6 个任务的实时进度与可点击标题；通过 `task_focus` 或 `/task-focus` 保存当前 session 的任务关注，并用 `/tasks` 按状态打印最近 20 个带可点击标题的任务。

**启用/禁用扩展或技能：** 装完整包后，用 pi 原生命令精细控制：

```bash
pi config          # 全局：启用/禁用包资源（skills + extensions）
pi config -l       # 项目级：覆盖全局设置（写入 .pi/settings.json）
```

TUI 里 Tab 切换 global / project-local scope，空格切换启用状态。无需手动编辑 `settings.json`。

模型与 thinking level 预设写在 `~/.pi/agent/presets.json`：

```json
{
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

在 Pi 中执行 `/preset list` 查看当前预设，执行 `/preset` 交互选择，或直接执行 `/preset flash-max`、`/preset sol-xhigh`。配置文件每次执行时重新读取，修改后无需 `/reload`。

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
skills/{task-context,task-lessons}/     # Context and lessons workflow skills
skills/meta/workspace-workflow/evals/   # Shared cross-workflow routing eval suite
skills/mattpocock/       # 用户选择的 Matt Pocock 来源技能与逐技能 .repository.json
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
