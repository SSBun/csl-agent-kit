# Reorganize skills into dev/meta/domain subfolders

Status: Completed (2026-08-19 17:51)
Kind: Task

## Target
- [x] T1: all self-built skills moved into skills/{dev,meta,domain}, standing-orders removed, references intact

## Result

- T1: 144 files git-mv renamed with 0 content deltas; live refs in bin/hooks/commands/tests/AGENTS.md/README.md/plugin.json rewritten to skills/{dev,meta,domain}; standing-orders removed; triggerify/sop-summaries/csl-tasks scripts verified working from new paths
- Review gate: Skipped — Pure git-mv rename (0 content deltas) plus mechanical path rewrites; verified via grep + script smoke tests

## Verification

- Passed: find: all 33 SKILL.md under skills/{dev,domain,meta,mattpocock}; grep: zero stale old-path refs in live code; triggerify show + sop-summaries + csl-tasks list run from new paths; local quality gate token-budget failure pre-existing (SKILL.md byte-identical to HEAD)
