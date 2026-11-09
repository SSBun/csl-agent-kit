# Add Colors To NPM CLI Output

## Plan

- [x] Add regression tests for forced color and explicit no-color output.
- [x] Add terminal-aware ANSI colors without affecting alignment or JSON output.
- [x] Support `--color`, `--no-color`, and the `NO_COLOR` convention.
- [x] Update help and README documentation.
- [x] Run CLI tests, package checks, and diff verification.

## Review

Added dependency-free ANSI color output to `csl-agent-kit install`:

- Interactive TTY output automatically uses colors.
- Header and preview phase use cyan; success indicators and summaries use green; errors use red; skipped details use yellow; verbose details use dim text.
- Padding happens before color decoration, preserving column alignment.
- Added `--color` to force colors and `--no-color` to disable them.
- Automatic color mode respects `NO_COLOR` and disables colors for non-TTY output.
- `--json` remains valid, color-free JSON even when combined with `--color`.
- Updated CLI help and README.

TDD verification:

- RED: color tests failed because `--color` and `--no-color` were initially unknown.
- GREEN: all six CLI output tests pass.

Verification performed:

- `npm run test:cli`
- `node bin/csl-agent-kit.js install --all --dry-run --color`
- `node bin/csl-agent-kit.js install --help`
- `node --check bin/csl-agent-kit.js`
- `npm run check:cli`
- `npm pack --dry-run --json`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js package.json README.md tasks/todo.md`

Unresolved risk:

- ANSI support depends on the terminal; unsupported terminals can use `--no-color` or `NO_COLOR=1`.
