# CSL Agent Kit Renaming Execution

## Plan

- [x] Update package and plugin metadata from `CSL Skills` / `csl-skills` / skill-only wording to `CSL Agent Kit` / `csl-agent-kit` / toolkit wording.
- [x] Update README and install examples to use the new branding and repository path while preserving skill invocation compatibility.
- [x] Update installer output/comments to match the new project name.
- [x] Run JSON, script, package, stale-name, diff, and status verification.
- [x] Record review evidence and unresolved compatibility risks.

## Review

Renaming executed for the current project surfaces:

- `package.json`: package name is now `csl-agent-kit`; description and keywords describe a multi-client agent toolkit.
- `README.md`: title is now `CSL Agent Kit`; opening positioning covers skills, plugins, commands, hooks, and Pi extensions; install examples use `SSBun/agent-kit` and `CSL@SSBun-agent-kit`.
- Plugin metadata: Claude, Cursor, Codex, and `.agents` marketplace descriptions now use `CSL Agent Kit` / toolkit wording.
- `scripts/install.sh`: installer comment and Claude Code install hint now use the new Agent Kit name.

Compatibility choices:

- Kept plugin IDs / command namespace as `CSL` / `csl`, preserving `/CSL:<skill>` invocations and `codex plugin add csl@CSL` behavior.
- Kept the standard `skills/` directory and individual skill names unchanged.
- Kept `~/.ssbun-skills/` user data paths unchanged to avoid breaking existing SOP and tips storage.

Verification performed:

- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null`
- `bash -n scripts/install.sh`
- `npm pack --dry-run --json`
- `rg -n "CSL Skills|csl-skills|SSBun/skills|SSBun-skills|Agent skill collection" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents scripts pi docs commands hooks`
- `git diff --check -- package.json README.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json scripts/install.sh tasks/todo.md`
- `git status --short --untracked-files=all`

Unresolved risks:

- GitHub repository rename to `SSBun/agent-kit` still needs to happen outside this code edit, or install examples will depend on that future path existing.
- Some repository files are already dirty from unrelated work; this task only changed the naming surfaces listed above plus this task record.
