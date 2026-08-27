# Rewrite Triggerify skill guidance

**Status:** Completed (2026-07-23 10:46)

## Goal

- Rewrite the Triggerify skill in English.
- Make it self-contained and remove the project RFC as an operational source.
- Guide agents through safe creation, inspection, update, state management, deletion, and audit flows.
- Use only currently implemented CLI capabilities.

## Plan

- [x] Define the skill's operational and source-of-truth boundaries.
- [x] Document the seven existing management operations.
- [x] Add a post-mutation inspection flow using the current CLI.
- [x] Document matcher, scope, host-support, and reporting constraints.
- [x] Run the required rule audit after user permission.

## Result

Replaced the Triggerify skill with a concise English operational guide. It now treats the CLI as authoritative, uses qualified IDs for mutations, distinguishes configured and effective state, keeps project rules metadata-only, and avoids documenting the unimplemented standalone `check` command.

## Verification

Passed `skill-quality` package validation with no failures or warnings.
