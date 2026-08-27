# SOP Hook Routing Hardening

## Plan

- [x] Update SOP manager criteria with `when_to_use`, `do_not_use_when`, `globs`, and completion criteria guidance.
- [x] Update SOP summary output to include `globs` without reading full SOP bodies.
- [x] Add a prompt-time SOP candidate hook only if the hook event is supported by existing plugin conventions.
- [x] Tighten PreToolUse SOP reminder to use `when_to_use` and completion criteria.
- [x] Migrate all built-in and user-scoped SOP frontmatter to the newest criteria.
- [x] Validate hook JSON, scripts, SOP frontmatter, summaries, and skill metadata.
- [x] Audit changed rules, hooks, skills, and SOPs with `skill-quality`.

## Review

- Updated `skills/sop-manager/SKILL.md` so new SOPs require routing-focused `when_to_use`, content-focused `description`, optional `do_not_use_when`, optional `globs`, and checklist completion criteria.
- Updated `skills/sop-manager/scripts/sop-summaries.sh` to print `globs` while still loading only frontmatter.
- Added `skills/sop-manager/scripts/sop-candidates.js` and wired `UserPromptSubmit` in `hooks/hooks.json` and `.codex-plugin/hooks/hooks.json`.
- Tightened `PreToolUse` so it tells agents to match by `when_to_use` or `name`, read the full SOP before tool use, and verify completion criteria before final.
- Migrated all built-in and user-scoped SOPs under `skills/sop-manager/sops/*.md` and `/Users/caishilin/.ssbun-skills/sops/*.md` to the new frontmatter criteria.
- Added missing checklist completion criteria to legacy user SOPs and removed old `Lessons` sections.

Verification performed:

- Parsed 9 SOP files and asserted `name`, `description`, `when_to_use`, `version`, `update_date`, no `owner`, no `Lessons`, and checklist completion criteria.
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- Executed `UserPromptSubmit` hook command with a YouTube-to-Markdown prompt.
- Executed `PreToolUse` hook command.
- Tested candidate matching for Swift API, Swift code organization, macOS DMG, and YouTube Markdown prompts.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- hooks/hooks.json .codex-plugin/hooks/hooks.json skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint and governance passed. Resource boundary passed with a warning that `SKILL.md` is getting heavy at 908 estimated tokens.
