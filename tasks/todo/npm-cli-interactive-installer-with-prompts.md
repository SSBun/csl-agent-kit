# NPM CLI Interactive Installer With Prompts

## Plan

- [x] Inspect current package shape and TypeScript CLI SOP constraints.
- [x] Add an npm `bin` CLI entry for `csl-agent-kit`.
- [x] Implement `csl-agent-kit install` with a `prompts` multiselect panel and non-interactive flags for tests/automation.
- [x] Reimplement install operations in Node instead of wrapping `scripts/install.sh`.
- [x] Update package metadata and README install docs.
- [x] Run syntax, JSON, dry-run, package, and diff verification; record review evidence.

## Review

Implemented a Node-based npm CLI installer:

- Added `bin/csl-agent-kit.js` with shebang and `csl-agent-kit install` command.
- Added `package.json` `bin` entry and `check:cli` script.
- Added `prompts` as a runtime dependency and generated `package-lock.json`.
- Added `node_modules/` to `.gitignore`.
- Replaced `scripts/install.sh` with a thin compatibility wrapper around the Node CLI.
- Updated README to make `csl-agent-kit install` the recommended installer.

CLI behavior:

- `csl-agent-kit install` opens a `prompts` multiselect panel for:
  - Cursor local plugin
  - Codex skills symlinks
  - Repo-local `.agents/skills` link
  - Codex plugin hooks
  - Pi package
- Non-interactive modes are available for tests/automation:
  - `csl-agent-kit install --yes`
  - `csl-agent-kit install --target cursor,codex-skills,repo-link`
  - `csl-agent-kit install --all --dry-run`
  - `csl-agent-kit install --all --json`
- Install operations are implemented in Node:
  - symlink creation for Cursor, Codex skills, and repo-local `.agents/skills`;
  - external command execution for `codex plugin ...` and `pi install ...` when selected;
  - `--dry-run` prevents filesystem and external command changes.

Verification performed:

- `npm install --package-lock-only`
- `npm install`
- `node --check bin/csl-agent-kit.js`
- `bash -n scripts/install.sh`
- `node -e "console.log(typeof require('prompts'))"`
- `node bin/csl-agent-kit.js install --yes --dry-run --json`
- `node bin/csl-agent-kit.js install --target cursor,codex-skills,repo-link --dry-run`
- `node bin/csl-agent-kit.js install --target codex-plugin,pi --dry-run --json`
- `node bin/csl-agent-kit.js install --help`
- `npm run check:cli`
- `./scripts/install.sh --yes --dry-run --json`
- `jq . package.json package-lock.json`
- `npm pack --dry-run --json`
- `rg` checks for stale `./scripts/install.sh <target>` install docs.
- `git diff --check -- bin/csl-agent-kit.js package.json package-lock.json README.md scripts/install.sh .gitignore tasks/todo.md`

Unresolved risks:

- Interactive UI itself was not manually exercised in this non-interactive harness, but `prompts` is installed and the non-interactive code paths are verified.
- External integrations still depend on installed and authenticated `codex` / `pi` CLIs when selected outside `--dry-run`.
