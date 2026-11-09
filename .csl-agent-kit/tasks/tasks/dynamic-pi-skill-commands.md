# Dynamic Pi Skill Commands

## Plan

- [x] Replace the hard-coded CSL skill command list with dynamic discovery from `skills/*/SKILL.md`.
- [x] Parse each skill name from the folder name and description from `SKILL.md` frontmatter.
- [x] Keep the existing `/skill-name` alias behavior and busy-session follow-up behavior.
- [x] Verify extension loading, discovered command count, descriptions, package dry-run, and diff check.

## Review

- Rewrote `pi/extensions/csl-skill-commands.ts` to discover commands from `skills/*/SKILL.md` at extension load time.
- Source of truth follows the grilled decision: folder name is the command/skill name; frontmatter `description` is the command description.
- Added warnings for missing descriptions and mismatched frontmatter `name`, while still using the folder name.
- Preserved the previous behavior: commands send a skill-use request immediately when idle, or as `followUp` when the agent is busy.
- Updated `README.md` to document dynamic discovery.
- Verification performed:
  - Jiti-loaded `pi/extensions/csl-skill-commands.ts` and confirmed 17 commands.
  - Checked `/repo-map` description came from `skills/repo-map/SKILL.md` frontmatter.
  - Parsed `package.json`.
  - `npm pack --dry-run --json` includes Pi extension files.
  - `git diff --check` on changed Pi package files.
