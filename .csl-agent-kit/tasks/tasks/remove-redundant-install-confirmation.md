# Remove redundant install confirmation

**Status:** Completed (2026-07-23 10:53)

## Goal

Remove the second confirmation shown after users explicitly select integrations in `csl-agent-kit install`.

## Plan

- [x] Remove the external-CLI confirmation prompt.
- [x] Preserve integration selection and cancellation behavior.
- [x] Remove the downstream guard for the deleted confirmation response.

## Result

The installer now proceeds directly after the integration selection step. The obsolete downstream `confirmExternal` guard was also removed after it caused selected external integrations to fail.

## Verification

Not run; the user-provided failure localized the remaining obsolete guard.
