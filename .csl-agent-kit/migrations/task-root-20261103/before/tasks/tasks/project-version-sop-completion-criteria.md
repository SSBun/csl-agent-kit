# Project Version SOP Completion Criteria

## Plan

- [x] Update `/Users/caishilin/.ssbun-skills/sops/project-version-update.md` to separate execution checks from completion criteria.
- [x] Remove the `Lessons` section and merge its intent into the SOP body.
- [x] Align frontmatter with lightweight SOP metadata.
- [x] Validate YAML, section structure, and SOP summary loading.
- [x] Audit the SOP change with `skill-quality`.

## Review

- Updated `/Users/caishilin/.ssbun-skills/sops/project-version-update.md`.
- Replaced `owner` with `update_date` in frontmatter.
- Split the old mixed `Checklist` into `执行检查点` for process guidance and `完成标准` for final compliance checking.
- Removed `Lessons`; its intent is now covered by `执行检查点` and `完成标准`.
- Added completion criteria that require observable evidence: source of truth, synchronized files, changelog status, build number status, lockfile status, release metadata checks, validation commands, and no unconfirmed remote release actions.

Verification performed:

- Parsed YAML frontmatter and asserted only `name`, `description`, `version`, and `update_date`.
- Asserted required sections exist: `执行检查点`, `执行流程`, `异常处理`, `完成标准`.
- Asserted `Lessons` and `owner` are absent.
- `bash skills/sop-manager/scripts/sop-summaries.sh | rg -n "project-version-update|SOP manager|Read the full SOP"`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
