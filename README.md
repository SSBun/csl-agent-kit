# CSL Skills

Agent skill collection for [Claude Code](https://docs.claude.com/en/docs/claude-code), [Cursor](https://cursor.com/docs/plugins), and [Codex](https://developers.openai.com/codex/skills). Skills follow the open [Agent Skills](https://agentskills.io) standard (`skills/<name>/SKILL.md`).

## Skills

| Skill | Claude | Cursor / Codex | Description |
|-------|--------|----------------|-------------|
| create-app-icon | `/CSL:create-app-icon` | `/create-app-icon` | Generate an AI-image-generator prompt for an app icon. |
| release | `/CSL:release` | `/release` | Bump version, commit, tag, optionally push, then walk through publishing. |
| analyze-project | `/CSL:analyze-project` | `/analyze-project` | Deep multi-report project analysis. |
| venom-cli | `/CSL:venom-cli` | `/venom-cli` | Manage Zhihu iOS component dependencies and builds. |
| grill-me | `/CSL:grill-me` | `/grill-me` | Stress-test a plan or design through relentless questioning. |
| beautiful-mermaid | `/CSL:beautiful-mermaid` | `/beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG with built-in themes. |
| handoff-save | `/CSL:handoff-save` | `/handoff-save` | Save task context to `~/.agents/handoffs/` for the next session. |
| handoff-restore | `/CSL:handoff-restore` | `/handoff-restore` | Restore handoff and continue without re-exploring the project. |
| code-reviewer | `/CSL:code-reviewer` | `/code-reviewer` | Structured PR/MR code review with reference checklists. |
| sop-creator | `/CSL:sop-creator` | `/sop-creator` | Create or edit standard operating procedure documents. |
| brainstorming | `/CSL:brainstorming` | `/brainstorming` | Explore design and requirements before implementation. |
| figma-describe | `/CSL:figma-describe` | `/figma-describe` | Parse Figma URL into structured UI tree description. |
| same-page | `/CSL:same-page` | `/same-page` | Re-explain prior messages with evidence and confidence levels. |

Claude-only slash commands: `/CSL:sop-activate`, `/CSL:doc-sync`.

## Canonical source and duplicates

This repository is the **canonical source** for all CSL skills. Install via [`npx skills`](#npx-skills-cursor-codex-and-other-agents), `./scripts/install.sh` (Cursor plugin / Codex symlinks), or each platform's plugin marketplace.

If you also have same-named skills from other marketplaces or personal folders (e.g. `grill-me`, `create-app-icon`, `code-reviewer`), remove or rename those copies to avoid the agent loading the wrong version. After installing CSL, prefer invoking skills from this plugin only.

Removed skills (no longer shipped): `passing`, `receiving`.

## Install

### npx skills (Cursor, Codex, and other agents)

Use the [Agent Skills CLI](https://skills.sh/) to install individual skills or the full collection into `~/.agents/skills/` (Cursor and other agents discover this path automatically).

**Install all 13 skills globally for Cursor:**

```bash
npx skills add SSBun/skills --all -a cursor -g -y
```

**Install from a local clone (development):**

```bash
git clone https://github.com/SSBun/skills
cd skills
npx skills add . --all -a cursor -g -y
```

**Install specific skills:**

```bash
# List available skills in this repo
npx skills add SSBun/skills --list

# Install by name
npx skills add SSBun/skills --skill grill-me --skill release -a cursor -g -y
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
/plugin marketplace add SSBun/skills
/plugin install CSL@SSBun-skills
```

Local development:

```bash
/plugin marketplace add /path/to/skills
/plugin install CSL@SSBun-skills
```

### Cursor

**Marketplace / team:** Import this repo as a [Team Marketplace](https://cursor.com/docs/plugins#add-a-team-marketplace).

**Local development:**

```bash
git clone https://github.com/SSBun/skills ~/.cursor/plugins/local/CSL
# or: ./scripts/install.sh cursor
```

Reload Cursor (`Developer: Reload Window`).

### Codex

Enable skills in `~/.codex/config.toml`:

```toml
[features]
skills = true
```

```bash
./scripts/install.sh codex
```

### All platforms

```bash
./scripts/install.sh all
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
scripts/install.sh       # Local installer for Cursor plugin + Codex symlinks
```

## License

[MIT](LICENSE) — © 2026 CSL
