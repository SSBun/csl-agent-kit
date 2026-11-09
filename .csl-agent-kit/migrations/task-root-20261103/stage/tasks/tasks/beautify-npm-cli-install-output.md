# Beautify NPM CLI Install Output

## Plan

- [x] Add a CLI output regression test for concise integration-level summaries.
- [x] Aggregate symlink and command results by integration instead of printing every unchanged path.
- [x] Add `--verbose` for full path and command details.
- [x] Verify normal, verbose, JSON, dry-run, and package behavior.
- [x] Record review evidence and unresolved risks.

## Review

Root cause:

- The installer printed every low-level symlink and external command as first-class output, so unchanged paths overwhelmed the integration result.

Changes:

- Default output now prints one aligned summary row per integration.
- Symlinks and commands are aggregated into counts such as `2 links updated · 15 up to date`.
- Added `--verbose` / `-v` to expose full symlink paths and commands when debugging.
- Kept `--json` output unchanged for automation.
- Added `tests/cli-install-output.test.js` using Node's built-in test runner.
- Added `npm run test:cli` and included it in `npm run check:cli`.
- Updated README with the concise-default / verbose-details behavior.

Verification performed:

- RED: `npm run test:cli` failed against the old noisy output and missing `--verbose` option.
- GREEN: `npm run test:cli` passes both concise and verbose output tests.
- `node bin/csl-agent-kit.js install --all --dry-run`
- `node bin/csl-agent-kit.js install --all --dry-run --verbose`
- `node bin/csl-agent-kit.js install --all --dry-run --json`
- `node --check bin/csl-agent-kit.js`
- `bash -n scripts/install.sh`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js package.json README.md tasks/todo.md`

Unresolved risk:

- Terminal alignment assumes normal-width Latin integration titles; future CJK or ANSI-colored titles may need display-width-aware padding.
