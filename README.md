# CSL Skills

Agent skill collection for [Claude Code](https://docs.claude.com/en/docs/claude-code), published as a plugin. Skills double as slash commands.

## Skills

| Skill | Slash command | Description |
|-------|---------------|-------------|
| create-app-icon | `/CSL:create-app-icon [project-path]` | Generate an AI-image-generator prompt for an app icon. Covers iOS, macOS, web, and CLI. |
| release | `/CSL:release [version] [--skip-push]` | Bump version across all locations, commit, tag, optionally push, then walk through publishing. |
| analyze-project | `/CSL:analyze-project [project-path] [depth]` | Deep multi-report project analysis via parallel subagents. Reports land in `docs/analysis/`. |
| venom-cli | `/CSL:venom-cli [project-path]` | Manage Zhihu iOS component dependencies, switch pod sources, check environment, and build projects. |
| grill-me | `/CSL:grill-me` | Stress-test a plan or design by relentless questioning until shared understanding is reached. |
| beautiful-mermaid | `/CSL:beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG or ASCII art with 15 built-in themes. |
| passing | `/CSL:passing` | Save conversation context to `tasks/handoff.md` for next session. |
| receiving | `/CSL:receiving` | Restore context from `tasks/handoff.md` after `/clear`. |

## Install

```bash
/plugin marketplace add SSBun/skills
/plugin install CSL@SSBun-skills
```

## Develop

```bash
/plugin marketplace add /path/to/skills
/plugin install CSL@SSBun-skills
```

## License

[MIT](LICENSE) — © 2026 CSL
