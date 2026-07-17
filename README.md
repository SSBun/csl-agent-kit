# CSL Agent Kit

Personal agent toolkit for [Claude Code](https://docs.claude.com/en/docs/claude-code), [Cursor](https://cursor.com/docs/plugins), [Codex](https://developers.openai.com/codex/skills), and [Pi](https://pi.dev). It packages reusable skills, plugins, commands, hooks, and Pi extensions. Skills follow the open [Agent Skills](https://agentskills.io) standard; CSL recursively discovers leaf `SKILL.md` files below `skills/`.

## Skills

| Skill | Claude | Cursor / Codex / Pi extension | Description |
|-------|--------|------------------------------|-------------|
| create-app-icon | `/csl:create-app-icon` | `/create-app-icon` | Generate an AI-image-generator prompt for an app icon. |
| release | `/csl:release` | `/release` | Route release work to the matching SOP and gather confirmation items. |
| analyze-project | `/csl:analyze-project` | `/analyze-project` | Deep multi-report project analysis. |
| venom-cli | `/csl:venom-cli` | `/venom-cli` | Manage Zhihu iOS component dependencies and builds. |
| grill-me | `/csl:grill-me` | `/grill-me` | Stress-test a plan or design through relentless questioning. |
| code-review | `/csl:code-review` | `/code-review` | 按代码规范与原始需求审查改动。 |
| domain-modeling | `/csl:domain-modeling` | `/domain-modeling` | 建立领域术语、统一语言与架构决策。 |
| grill-with-docs | `/csl:grill-with-docs` | `/grill-with-docs` | 深入澄清方案，并同步产出 ADR 与术语文档。 |
| improve-codebase-architecture | `/csl:improve-codebase-architecture` | `/improve-codebase-architecture` | 扫描架构改进机会并生成可视化报告。 |
| research | `/csl:research` | `/research` | 基于高可信来源调研并产出带引用的 Markdown。 |
| resolving-merge-conflicts | `/csl:resolving-merge-conflicts` | `/resolving-merge-conflicts` | 按双方意图解决进行中的 merge 或 rebase 冲突。 |
| tdd | `/csl:tdd` | `/tdd` | 以 red-green-refactor 流程进行测试驱动开发。 |
| grilling | `/csl:grilling` | `/grilling` | 对计划、决策或想法进行逐项压力测试。 |
| handoff | `/csl:handoff` | `/handoff` | 将当前对话压缩为可继续工作的交接文档。 |
| teach | `/csl:teach` | `/teach` | 在当前工作区中分多轮教授概念或技能。 |
| writing-great-skills | `/csl:writing-great-skills` | `/writing-great-skills` | 编写和维护高质量 Agent Skill 的参考。 |
| ubiquitous-language | `/csl:ubiquitous-language` | `/ubiquitous-language` | 提取 DDD 风格术语表；该技能在上游已废弃，但按用户选择保留。 |
| beautiful-mermaid | `/csl:beautiful-mermaid` | `/beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG with built-in themes. |
| code-reviewer | `/csl:code-reviewer` | `/code-reviewer` | Structured PR/MR code review with reference checklists. |
| test-triage | `/csl:test-triage` | `/test-triage` | Diagnose failing tests, bugs, CI failures, and regressions. |
| repo-map | `/csl:repo-map` | `/repo-map` | Build a lightweight map of an unfamiliar repo or module before coding. |
| super-agent | `/csl:super-agent` | `/super-agent` | Symlink the bundled default AGENTS.md into another agent config. |
| sop-manager | `/csl:sop-manager` | `/sop-manager` | List, create, inspect, and apply SOP documents. |
| tips | `/csl:tips` | `/tips` | Save and inject short user commands and preferences. |
| brainstorming | `/csl:brainstorming` | `/brainstorming` | Explore design and requirements before implementation. |
| figma-describe | `/csl:figma-describe` | `/figma-describe` | Parse Figma URL into structured UI tree description. |
| same-page | `/csl:same-page` | `/same-page` | Re-explain prior messages with evidence and confidence levels. |

Claude-only slash commands: `/csl:sop-activate`, `/csl:doc-sync`.

用户创建的 SOP 存放在 `~/.csl-agent-kit/sops/`；用户 tips 以带关键词的 JSON 形式存放在 `~/.csl-agent-kit/tips/tips.json`。

## Canonical source and duplicates

This repository is the **canonical source** for CSL Agent Kit. Install via the [`csl-agent-kit` CLI](#csl-agent-kit-cli), [`npx skills`](#npx-skills-cursor-codex-and-other-agents), `pi install`, or each platform's plugin marketplace.

If you also have same-named skills from other marketplaces or personal folders (e.g. `grill-me`, `create-app-icon`, `code-reviewer`), remove or rename those copies to avoid the agent loading the wrong version. After installing CSL Agent Kit, prefer invoking skills from this plugin only.

第三方导入技能位于 `skills/<来源分组>/<技能名>/`。每个含 `SKILL.md` 的第三方叶子目录都必须有 `.repository.json`，记录上游仓库 URL、上游相对路径、导入 ref 与 commit、许可证及上游状态。该文件描述上游基线；更新时必须先比较本地改写，不能直接覆盖。

### 检查第三方技能更新

本仓库的 `.agents/skills/integrate-third-skills/` 附带只读 Git 子命令；它是项目本地流程，不会随 CSL 的共享技能、Codex plugin 或 Pi 命令分发，并以 `metadata.internal: true` 从 `npx skills` 的普通可安装清单中排除：

```bash
# 汇总所有导入技能源路径的上游变化状态
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js status

# 比较某项技能：上游自导入后的变化，以及当前上游与本地副本的差异
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff code-review

# 需要完整 unified diff 时才输出补丁
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff code-review --patch
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

The default output is a concise, colored integration summary. Add `--verbose` (`-v`) to show every symlink path and external command. Use `--no-color` or `NO_COLOR=1` to disable colors; `--color` explicitly enables them. JSON output always stays color-free. The legacy `./scripts/install.sh` entry is a thin wrapper around this npm CLI.

### npx skills (Cursor, Codex, and other agents)

Use the [Agent Skills CLI](https://skills.sh/) to install individual skills or the full collection into `~/.agents/skills/` (Cursor and other agents discover this path automatically).

**为 Cursor 全量安装 27 个技能：**

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
npx skills add SSBun/csl-agent-kit --skill grill-me --skill release -a cursor -g -y
```

**Other useful commands:**

```bash
npx skills list -g -a cursor          # list installed global skills
npx skills update -g -y               # update installed skills
npx skills remove grill-me -g -a cursor -y
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
- `pi/extensions/csl-skill-commands.ts`，动态发现 `skills/` 下的叶子 `SKILL.md`，并添加 `/repo-map`、`/code-reviewer`、`/brainstorming` 等 Cursor/Codex 风格别名。
- `pi/extensions/csl-context-hooks.ts`：向 Pi 注入与当前 prompt 匹配的持续 tips 和 SOP 摘要，在变更前显示一次 SOP 提醒，并在 Figma/MasterGo 设计数据获取后追加 `figma-describe` 指引。
- `pi/extensions/openai-codex-fast.ts`, adding persistent OpenAI Codex Fast Mode controls and a footer status indicator.

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

context hooks 从 `~/.csl-agent-kit/tips/tips.json` 和 `~/.csl-agent-kit/sops/*.md` 读取用户数据；每次 agent 运行前刷新，并且只注入确认关键词匹配当前 prompt 的 tips。修改后的本地开发环境请重启 Pi 或运行 `/reload`。

The CSL Agent Kit CLI also supports:

```bash
csl-agent-kit install --target pi
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

`integrate-third-skills` 仅位于本仓库的 `.agents/skills/`，不会进入 Codex plugin。`UserPromptSubmit` hook 只注入关键词匹配的 tips 和 SOP candidates；hook scripts 从安装后的 plugin root 解析。重新运行安装器仍会清理旧的 `csl@CSL` 与 `csl@csl` 注册。

### All platforms

```bash
csl-agent-kit install --all
```

## Repository layout

```
skills/                  # Shared skill source (all platforms)
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
