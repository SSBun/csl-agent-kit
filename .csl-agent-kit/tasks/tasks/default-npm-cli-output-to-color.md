# Default NPM CLI Output To Color

## Plan

- [x] Add a regression test proving default non-JSON output contains ANSI colors.
- [x] Change automatic color mode to default-on while preserving explicit opt-out.
- [x] Keep JSON output color-free and update documentation.
- [x] Run CLI tests, package checks, and diff verification.

## Review

Changed human-readable CLI output to use ANSI colors by default, including non-TTY output.

Behavior:

- Default: colors enabled.
- `--color`: colors explicitly enabled, overriding `NO_COLOR`.
- `--no-color`: colors disabled.
- `NO_COLOR=1`: default colors disabled.
- `--json`: always valid color-free JSON.

TDD verification:

- RED: the new default-color test failed because non-TTY output was previously plain text.
- GREEN: all six CLI output tests pass after changing color auto-mode to default-on.

Verification performed:

- `npm run test:cli`
- `node bin/csl-agent-kit.js install --yes --dry-run`
- `NO_COLOR=1 node bin/csl-agent-kit.js install --yes --dry-run`
- `npm run check:cli`
- `npm pack --dry-run --json`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js README.md tasks/lessons.md tasks/todo.md`
