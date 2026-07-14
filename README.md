# CSL Agent Kit

Personal agent toolkit for [Claude Code](https://docs.claude.com/en/docs/claude-code), [Cursor](https://cursor.com/docs/plugins), [Codex](https://developers.openai.com/codex/skills), and [Pi](https://pi.dev). It packages reusable skills, plugins, commands, hooks, and Pi extensions. Skills follow the open [Agent Skills](https://agentskills.io) standard (`skills/<name>/SKILL.md`).

## Skills

| Skill | Claude | Cursor / Codex / Pi extension | Description |
|-------|--------|------------------------------|-------------|
| create-app-icon | `/csl:create-app-icon` | `/create-app-icon` | Generate an AI-image-generator prompt for an app icon. |
| release | `/csl:release` | `/release` | Route release work to the matching SOP and gather confirmation items. |
| analyze-project | `/csl:analyze-project` | `/analyze-project` | Deep multi-report project analysis. |
| venom-cli | `/csl:venom-cli` | `/venom-cli` | Manage Zhihu iOS component dependencies and builds. |
| grill-me | `/csl:grill-me` | `/grill-me` | Stress-test a plan or design through relentless questioning. |
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

User-created SOPs are stored under `~/.csl-agent-kit/sops/`. User tips are stored under `~/.csl-agent-kit/tips/tips.md`.

## Canonical source and duplicates

This repository is the **canonical source** for CSL Agent Kit. Install via the [`csl-agent-kit` CLI](#csl-agent-kit-cli), [`npx skills`](#npx-skills-cursor-codex-and-other-agents), `pi install`, or each platform's plugin marketplace.

If you also have same-named skills from other marketplaces or personal folders (e.g. `grill-me`, `create-app-icon`, `code-reviewer`), remove or rename those copies to avoid the agent loading the wrong version. After installing CSL Agent Kit, prefer invoking skills from this plugin only.

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
- Codex skills symlinks
- Repo-local `.agents/skills` link
- Codex plugin hooks
- Pi package

Non-interactive examples:

```bash
csl-agent-kit install --yes
csl-agent-kit install --target cursor,codex-skills,repo-link
csl-agent-kit install --all --dry-run
csl-agent-kit install --all --verbose
csl-agent-kit install --all --json
```

The default output is a concise, colored integration summary. Add `--verbose` (`-v`) to show every symlink path and external command. Use `--no-color` or `NO_COLOR=1` to disable colors; `--color` explicitly enables them. JSON output always stays color-free. The legacy `./scripts/install.sh` entry is a thin wrapper around this npm CLI.

### npx skills (Cursor, Codex, and other agents)

Use the [Agent Skills CLI](https://skills.sh/) to install individual skills or the full collection into `~/.agents/skills/` (Cursor and other agents discover this path automatically).

**Install all 17 skills globally for Cursor:**

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
- `pi/extensions/csl-skill-commands.ts`, dynamically discovering `skills/*/SKILL.md` and adding Cursor/Codex-style slash aliases such as `/repo-map`, `/code-reviewer`, and `/brainstorming`.
- `pi/extensions/csl-context-hooks.ts`, injecting persistent tips and SOP summaries into Pi, matching prompt-time SOP candidates, showing one pre-mutation SOP reminder, and appending `figma-describe` guidance after Figma/MasterGo design fetches.
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

The context hooks read user data from `~/.csl-agent-kit/tips/tips.md` and `~/.csl-agent-kit/sops/*.md`. They refresh on session start, compaction, and before each agent run, so the guidance survives context compaction. For local development after changes, restart Pi or run `/reload`.

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
csl-agent-kit install --target codex-skills,codex-plugin,repo-link
```

For Codex, skills are linked into `~/.agents/skills/`. The `csl-agent-kit@csl-agent-market` plugin is installed only for lifecycle hooks, so the same skill is not loaded twice. Re-running the installer removes the legacy `csl@CSL` and `csl@csl` registrations.

### All platforms

```bash
csl-agent-kit install --all
```

## Repository layout

```
skills/                  # Shared skill source (all platforms)
.claude-plugin/          # Claude Code plugin manifest
.cursor-plugin/          # Cursor plugin manifest
.codex-plugin/           # Codex plugin manifest
.agents/plugins/         # Codex repo marketplace
.agents/skills           # Generated local symlink to skills/ (ignored)
commands/                # Claude Code slash commands only
hooks/                   # Codex lifecycle hooks bundled with the plugin
pi/extensions/           # Pi-specific extensions and commands
package.json             # Pi package manifest (skills + Pi extensions)
bin/csl-agent-kit.js     # npm CLI installer and maintenance entry
scripts/install.sh       # Thin compatibility wrapper around the npm CLI
```

## License

[MIT](LICENSE) — © 2026 CSL
