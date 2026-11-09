# Swift API Design SOP Rewrite From Wiki

## Plan

- [x] Read the local Swift API Design Guidelines wiki source.
- [x] Rewrite built-in `swift-api-design` as a rule SOP using the wiki as source.
- [x] Preserve routing metadata and update lightweight metadata.
- [x] Validate SOP structure, frontmatter, summaries, and skill metadata.
- [x] Audit the SOP change with `skill-quality`.

## Review

- Rewrote `skills/sop-manager/sops/swift-api-design.md` from the local wiki source `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/Swift/Swift API Design Guidelines.md`.
- Kept the SOP as a rule SOP instead of forcing a linear execution flow.
- Preserved routing metadata for Swift files and updated lightweight metadata to `version: 1.2` and `update_date: 2026-07-09`.
- Added wiki-backed rule groups for clear usage, fluent call sites, side-effect naming, terminology, parameter labels, documentation comments, tuple/closure guidance, and `#fileID` / `#filePath` / `#file` usage.
- Converted compliance into checkbox completion criteria for agent review.

Verification performed:

- Parsed YAML frontmatter and asserted `name`, `version`, `update_date`, required sections, wiki reference path, and `#fileID` / `#filePath` / `#file` coverage.
- Asserted old body metadata and process-only sections are absent.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh | rg -n "swift-api-design|SOP manager|Read the full SOP"`
- `git diff --check -- skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
