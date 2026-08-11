# Install Super Agent via CLI & Retire Skill

Status: Completed (2026-07-21)

## Goal

Move the default user-scoped `AGENTS.md` installation from the manual
`super-agent` skill into the `csl-agent-kit install` CLI, then remove the skill.
Content file (`references/agents.md`) stays as the single source of truth.

## Decisions (user-confirmed a/a/a)

- Content file → repo-root `references/agents.md`.
- Cursor not wired into CLI (no native global `AGENTS.md`); document manual step.
- macOS/Linux only; no Windows symlink fallback.

## Design

- Default-on install step `linkAgentInstructions()`; idempotent; non-destructive:
  - missing target → create symlink.
  - already correct symlink → skip.
  - symlink pointing elsewhere → report/skip (force TBD).
  - regular file → skip by default; `--force` backs up to `.backup-YYYYMMDD-HHMMSS` then links.
  - legacy symlink into `skills/super-agent/references/` → relink to new path.
- Targets: `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`,
  `~/.agents/AGENTS.md`.
- Flags: reuse `--yes`/`--dry-run`; add `--no-super-agent`, `--force`.
- `ensureSymlink` gains backup + legacy-relink branches (or new helper).

## Plan

- [ ] Add `references/agents.md` (move content from skill).
- [ ] Extend CLI: `super-agent` target with non-destructive link logic.
- [ ] Add `--no-super-agent`, `--force` flags; update help.
- [ ] Update `package.json` `files` whitelist.
- [ ] Remove `skills/super-agent/` directory + git-tracked backup file.
- [ ] Clean references: 6 plugin manifests, README, `tasks/context.md`.
- [ ] Verify: `node --check`, `npm run test:cli`, `install --dry-run --json`.
- [ ] Yao rule audit (per AGENTS.md).

## Review

### Changes
- Moved content: `skills/super-agent/references/AGENTS.md` -> `references/agents.md`.
- CLI (`bin/csl-agent-kit.js`): new `super-agent` target + `linkAgentInstruction()` handling create / unchanged / legacy-relink / regular-file-skip / `--force` backup.
- Flags: `--no-super-agent` (exclude from defaults), `--force` (back up and replace existing files).
- Removed `skills/super-agent/` entirely (SKILL.md + git-tracked backup).
- Cleaned references: 6 plugin manifests (keyword + claude skills path), README table, `package.json` files whitelist, `tasks/context.md`.
- Updated existing tests to expect `super-agent` in default selection; added an end-to-end test covering all link branches.

### Verification
- `npm test`: 26 + 18 + 7 all pass.
- `node --check bin/csl-agent-kit.js` ok.
- Real run on this machine: 3 legacy symlinks relinked, 1 new created, content sanity-checked; second run idempotent (4 up to date).
- Source file contamination from an early buggy test version was caught and restored from git; re-verified tests no longer pollute the source.

### Unresolved risks
- Legacy detection matches any path ending in `skills/super-agent/references/AGENTS.md`; a user who happens to keep a personal file at that exact suffix would be silently relinked. Narrow but possible.
- Windows not supported (documented macOS/Linux only); symlink creation will fail there.
