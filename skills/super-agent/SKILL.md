---
name: super-agent
description: Explicitly invoked skill for installing the bundled default AGENTS.md instructions into another agent's configuration by backing up the old config file and replacing it with a symlink. Use when the user invokes super-agent, asks to install or link the default AGENTS.md, or wants to sync CSL Agent Kit instructions to Codex, Claude Code, Cursor, Pi, or another agent client.
---

# Super Agent

Install the bundled default agent instructions into another agent client's configuration by replacing that client's instruction file with a symlink to `references/AGENTS.md`.

## Source File

Use `references/AGENTS.md` as the only source of truth. Do not copy its content into targets unless symlinks are impossible and the user explicitly asks for a copy fallback.

## Core Workflow

1. Ask the user which agent configuration file they want to replace.
   - Ask even when the user only says "run super-agent".
   - Accept either an agent name plus config directory, or a full target file path.
   - Mention common examples as suggestions, not assumptions:
     - Codex-style target: `~/.codex/AGENTS.md`
     - Generic Agent Skills target: `~/.agents/AGENTS.md`
     - Claude Code-style target: `~/.claude/CLAUDE.md` because Claude Code normally reads `CLAUDE.md`, not `AGENTS.md`.
     - Project-local target: `<project-root>/AGENTS.md` or `<project-root>/CLAUDE.md`.

2. Resolve the target file path.
   - If the user provides a directory, append `AGENTS.md` by default.
   - For Claude Code, ask whether the target should be `CLAUDE.md`; do not silently use `AGENTS.md`.
   - Expand `~` and resolve the parent directory.
   - Refuse to operate if the target path is empty, `/`, a directory path with no filename after clarification, or outside the user's confirmed scope.

3. Show the exact operation plan before changing files.
   - Source symlink target: absolute path to `skills/super-agent/references/AGENTS.md`.
   - Target file to replace.
   - Backup path for the existing target, if it exists: `{target}.backup-YYYYMMDD-HHMMSS`.
   - Commands or equivalent steps that will run.
   - Ask for explicit confirmation.

4. After confirmation, replace the target with a symlink.
   - Create the parent directory if it does not exist.
   - If the target exists and is not already the desired symlink, move it to the backup path.
   - If the target is already the desired symlink, report that no change is needed.
   - If the target is a symlink to a different file, unlink or move it only after explicit confirmation in the operation plan.
   - Create the symlink with `ln -s <source> <target>`.

5. Verify the result.
   - Run `test -L <target>`.
   - Run `readlink <target>` and compare it to the source path.
   - Confirm the backup path exists when a backup was expected.
   - Report the final source, target, and backup path.

## Rules

- Never overwrite or unlink an existing agent instruction file without a backup plan shown to the user first.
- Never guess the target agent config path when the user has not specified enough information; ask one focused question.
- Prefer symlinks over copied files so future updates to the bundled `references/AGENTS.md` take effect automatically.
- Do not edit the bundled `references/AGENTS.md` during installation.
- Keep backup files in the same directory as the replaced file so rollback is obvious.
- For rollback, tell the user to remove the symlink and rename the backup file back to the original target name.
