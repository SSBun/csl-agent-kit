# Test Triage Skill Subagent Audit

## Plan

- [x] Spawn an independent subagent to audit `skills/test-triage/SKILL.md`.
- [x] Review the audit findings.
- [x] Apply focused fixes if the audit identifies actionable issues.
- [x] Re-run validation and document the outcome.

## Review

Subagent verdict: minor edits, no blocker.

Changes made from audit:

- Narrowed the frontmatter trigger by removing generic focused-verification language.
- Added common trigger terms: red builds, pipeline failures, crashes, exceptions, stack traces, and timeouts.
- Added runtime bug reproduction paths before patching and before final verification.
- Moved practical regression-test creation before production-code changes.
- Changed multiple-failure handling from immediate stop to grouping and selecting the highest-signal first failure before escalating broad cleanup.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n 'focused verification|red builds|pipeline failures|crashes|exceptions|stack traces|timeouts|original failure path|regression test|highest-signal' skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`
