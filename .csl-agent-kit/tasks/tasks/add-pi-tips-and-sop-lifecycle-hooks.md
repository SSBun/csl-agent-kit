# Add Pi Tips And SOP Lifecycle Hooks

## Plan

- [x] Add test fixtures for Pi session context injection, SOP candidate routing, tool reminders, and Figma result reminders.
- [x] Refactor SOP candidate routing into a reusable module without changing the Codex hook behavior.
- [x] Add a Pi extension using `session_start`, `session_compact`, `input`, `before_agent_start`, `tool_call`, and `tool_result`.
- [x] Inject tips and SOP summaries from `~/.csl-agent-kit/` into Pi's per-turn system prompt.
- [x] Update package scripts, README, and changelog.
- [x] Run Node tests, Pi extension loading tests, skill validation, package checks, and local quality gate audit.

## Review

Added `pi/extensions/csl-context-hooks.ts` with Pi-native lifecycle integration:

- `session_start` and `session_compact` refresh tips and SOP metadata.
- `input` captures the raw interactive prompt for SOP candidate routing.
- `before_agent_start` injects persistent tips, available SOP summaries, and prompt-specific SOP candidates into Pi's system prompt each run.
- `tool_call` shows one mutation-time SOP reminder when the current prompt has matching candidates.
- `tool_result` appends `figma-describe` guidance after matching Figma/MasterGo design-fetch tools.
- Missing or unreadable tips/SOP files degrade to empty context without blocking Pi.

Supporting changes:

- Refactored `skills/sop-manager/scripts/sop-candidates.js` to export reusable `loadSops`, `findCandidates`, and formatting functions while preserving its CLI hook behavior.
- Added `tests/pi-context-hooks.test.mjs` covering context formatting, all event registrations, candidate injection, mutation reminder, and Figma reminder.
- Added `npm run test:pi`, aggregate `npm test`, and `npm run check`; CI now runs the aggregate check.
- Updated README and the `2.0.0` changelog entry.

Verification performed:

- `npm run check`: 6 CLI tests and 3 Pi context-hook tests passed.
- `node --experimental-strip-types --test tests/pi-context-hooks.test.mjs`
- TypeScript no-emit check for `pi/extensions/csl-context-hooks.ts`.
- All three Pi extensions loaded successfully with Node type stripping.
- Codex SOP candidate CLI compatibility test passed.
- `quick_validate.py skills/sop-manager` passed.
- `check.js skills/sop-manager` ran; the only failure remains the intentionally non-blocking `Missing agents/interface.yaml`, with lint/governance/resource checks passing apart from the existing heavy-SKILL warning.
- `npm pack --dry-run --json` includes `pi/extensions/csl-context-hooks.ts` (83 package files).
- `npm publish --dry-run --access public` passed.
- `git diff --check` passed.

Unresolved risk:

- User-authored tips and SOP summaries are injected into every Pi agent run; very large local datasets may need a future context-size cap.
- The live npm `2.0.0` publish is still pending an OTP and these new changes are not committed or pushed yet.
