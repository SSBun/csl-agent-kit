# SOP English Frontmatter

## Plan

- [x] Add SOP manager rule that all SOP frontmatter values must be written in English.
- [x] Convert built-in SOP frontmatter values to English.
- [x] Convert user-scoped SOP frontmatter values to English.
- [x] Validate frontmatter language, summary output, hooks, and skill metadata.
- [x] Audit changed SOP rules with `yao-meta-skill`.

## Review

- Updated `skills/sop-manager/SKILL.md` to require English values in all SOP frontmatter.
- Converted frontmatter values to English in built-in SOP files and examples:
  - `skills/sop-manager/sops/swift-api-design.md`
  - `skills/sop-manager/references/process-sop-example.md`
  - `skills/sop-manager/references/rule-sop-example.md`
- Converted frontmatter values to English in all user-scoped SOPs under `/Users/caishilin/.ssbun-skills/sops/*.md`.
- Added an extra `swift-api-design` exclusion so Swift file organization prompts route to `swift-code-style` instead of API design.

Verification performed:

- Parsed 11 SOP/example files and asserted no Chinese characters in YAML frontmatter.
- Asserted required frontmatter fields: `name`, `description`, and `when_to_use`.
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- Tested candidate matching for Swift API and Swift code organization prompts after English conversion.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `git diff --check -- hooks/hooks.json .codex-plugin/hooks/hooks.json skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint and governance passed. Resource boundary passed with a warning that `SKILL.md` is getting heavy at 908 estimated tokens.
