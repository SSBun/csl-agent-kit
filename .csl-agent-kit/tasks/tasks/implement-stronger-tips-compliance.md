# Implement Stronger Tips Compliance

## Plan

- [x] Inspect the current tips implementation, hook adapters, tests, and dirty workspace without disturbing unrelated work.
- [x] Add failing coverage for confirmation, normalization boundaries, per-tip/quantity/total limits, duplicates, multiline input, and mandatory injection wording.
- [x] Implement the minimum shared validation and injection changes.
- [x] Wire complete tips injection into every supported per-turn lifecycle while preserving session and compaction coverage.
- [x] Extend doctor diagnostics for limits, malformed data, injection preview, and lifecycle coverage.
- [x] Update user-facing skill guidance and trigger evaluations without broadening automatic capture.
- [x] Run focused tests, shell/static checks, diff review, and the required `skill-quality` audit.

## Review

Implemented stronger tips capture and compliance semantics:

- Kept explicit preview and confirmation mandatory before every write; ordinary preferences still do not trigger automatic saving.
- Added semantic guidance for durable, cross-task, single-behavior, non-sensitive tips and allowed normalization before confirmation.
- Enforced 120 characters per tip, 20 tips, 2,000 total tip characters, single-line/nonblank input, and exact duplicate rejection.
- Changed injected tips into confirmed persistent user instructions that are mandatory whenever applicable.
- Added complete per-turn refresh through `UserPromptSubmit` hooks and Pi `before_agent_start`, while preserving session start, resume, and compaction refresh.
- Expanded doctor output with limits, malformed/overlong/duplicate diagnostics, lifecycle coverage, and the full injection preview.
- Added eight tips tests and strengthened Pi tests to prove that changed tips are reloaded before the next agent turn.

Verification performed:

- `npm run check`: 6 CLI tests, 8 tips tests, and 4 Pi tests passed; install dry-run passed.
- Trigger evaluation: 0 false positives, 0 false negatives, precision 1.0, recall 1.0 across 20 cases.
- Bash syntax, JSON parsing, hook parity, TypeScript no-emit check, Unicode 120/121-character boundary, doctor lifecycle smoke test, and `git diff --check` passed.
- Required `skill-quality` audit ran: lint, governance, and resource-boundary checks passed; the aggregate validator still reports the repository-wide packaging convention gap `Missing agents/interface.yaml`, which predates this change and is not added speculatively for tips alone.

Unresolved risk:

- Hook-only clients may retain repeated `UserPromptSubmit` context in conversation history because they lack Pi-style ephemeral system-prompt replacement; the agreed 20-tip/2,000-character limits bound each injection, but host-specific accumulation remains outside this repository's control.
