# SOP Example Frontmatter Basic Info

## Plan

- [x] Move basic SOP metadata from Markdown body into YAML frontmatter.
- [x] Renumber the remaining body sections so the document starts with purpose.
- [x] Keep revision history visible in the body.
- [x] Validate frontmatter and required SOP sections.
- [x] Audit the SOP documentation change with `yao-meta-skill`.

## Review

- Moved SOP ID, creator, reviewer, approver, and effective date into the YAML frontmatter of `skills/sop-manager/references/good-sop-example.md`.
- Removed the body `## 1. 基本信息` section.
- Kept `## 修订记录` in the body and renumbered the main SOP sections from `## 1. 目的` through `## 10. Lessons`.

Verification performed:

- Parsed frontmatter and asserted `name`, `description`, `id`, `version`, `owner`, `created_by`, `reviewer`, `approver`, and `effective_date`.
- Asserted `## 1. 基本信息` is absent and the renumbered SOP sections are present.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^id:|^created_by:|^reviewer:|^approver:|^effective_date:|^## 1\\. 基本信息|^## 1\\. 目的|^## 修订记录" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
