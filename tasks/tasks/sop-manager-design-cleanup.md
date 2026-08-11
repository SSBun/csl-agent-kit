# SOP Manager Design Cleanup

## Plan

- [x] Rename the process SOP example from `good-sop-example.md` to `process-sop-example.md`.
- [x] Update `sop-manager/SKILL.md` so it no longer assumes every SOP is step-based.
- [x] Migrate `swift-api-design.md` to the rule SOP format.
- [x] Validate frontmatter, references, and SOP structures.
- [x] Audit the SOP changes with `yao-meta-skill`.

## Review

- Renamed the process example to `skills/sop-manager/references/process-sop-example.md`.
- Updated `skills/sop-manager/SKILL.md` so SOPs are described as agent behavior rules that are either executed as a flow or applied as judgment rules.
- Updated `sop-manager create` to collect either flow data or rule/judgment data, then choose the matching example.
- Migrated `skills/sop-manager/sops/swift-api-design.md` to the rule SOP structure:
  - `使用方式`
  - `规则分组`
  - `冲突处理`
  - checkbox `完成标准`
  - `参考资料`
- Removed old body metadata from `swift-api-design` and replaced `owner/scope` frontmatter with `update_date`.

Verification performed:

- Parsed frontmatter for `process-sop-example.md`, `rule-sop-example.md`, and `swift-api-design.md`.
- Asserted `swift-api-design.md` includes rule SOP sections and checkbox completion criteria.
- Asserted `sop-manager/SKILL.md` references `process-sop-example.md` and `rule-sop-example.md`, and no longer references `good-sop-example.md`.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "good-sop-example|owner: team-or-role|owner: \\{role-or-team\\}|## Lessons|companion lesson|process-sop-example|rule-sop-example|## 3\\. 使用方式|## 4\\. 规则分组|## 5\\. 冲突处理|## 6\\. 完成标准" skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
