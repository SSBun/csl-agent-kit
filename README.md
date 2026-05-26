# SSBun Skills

Agent skill collection for [Claude Code](https://docs.claude.com/en/docs/claude-code), published as a plugin with matching slash-command wrappers.

## Skills

Each skill auto-triggers when Claude detects a matching intent. The slash command is a thin wrapper that invokes the same skill.

| Skill | Slash command | Description |
|-------|---------------|-------------|
| xcode-build | `/SSBun-skills:xcode-build [project-path]` | Build, run, and test iOS/macOS/watchOS/tvOS apps. Auto-detects project type and platform, supports simulators and real devices. |
| app-icon-prompt | `/SSBun-skills:app-icon-prompt [project-path]` | Analyze a project and generate an AI-image-generator prompt for its app icon. Covers iOS, macOS, web, and CLI. |
| release-new-version | `/SSBun-skills:release-new-version [version] [--skip-push]` | Bump version across all locations, commit, tag, optionally push, then walk through publishing to npm, PyPI, Cargo, CocoaPods, or Homebrew. |
| analyze-project | `/SSBun-skills:analyze-project [project-path] [depth]` | Deep multi-report project analysis. Scans structure, deps, architecture, business logic, APIs, data model, security, and quality via parallel subagents. Reports land in `docs/analysis/`. |
| venom-cli | `/SSBun-skills:venom-cli [project-path]` | Manage Zhihu iOS component dependencies, switch pod sources, check environment, and build projects. |
| grill-me | `/SSBun-skills:grill-me` | Stress-test a plan or design by relentless questioning until shared understanding is reached. |
| beautiful-mermaid | `/SSBun-skills:beautiful-mermaid` | Render Mermaid diagrams as beautiful SVG or ASCII art with 15 built-in themes. |

## Install

```bash
# Add the marketplace
/plugin marketplace add SSBun/skills

# Install the plugin
/plugin install SSBun-skills@SSBun-skills
```

## Develop

```bash
# Test locally with a custom marketplace path
/plugin marketplace add /path/to/skills
/plugin install SSBun-skills@SSBun-skills
```

CI runs `jq` validation on `plugin.json` / `marketplace.json` and frontmatter checks on every `SKILL.md` and `commands/*.md` (see `.github/workflows/validate.yml`).

## License

[MIT](LICENSE) — © 2026 CSL
