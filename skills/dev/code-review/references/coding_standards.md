# Coding Standards

Use these standards when reviewing changes across languages and frameworks. Local project conventions override this file.

## General Standards

- Match the existing architecture, naming, formatting, and dependency style in the touched area.
- Keep changes scoped to the stated goal. Do not mix cleanup, refactors, and behavior changes unless the PR explicitly does so.
- Prefer clear control flow over clever compactness.
- Use structured parsing and typed APIs when available; avoid fragile string manipulation for structured data.
- Remove unused code introduced by the change. Do not ask authors to remove unrelated pre-existing dead code unless it increases current risk.

## Error Handling

- Handle expected failures at the boundary where recovery or context is available.
- Preserve useful error context without leaking secrets or private user data.
- Avoid swallowing errors unless the fallback behavior is intentional and observable.
- Check async code for unhandled promises, cancellation, race conditions, and double-callback or double-resolution paths.

## Data and State

- Validate external input at trust boundaries: HTTP, CLI, files, IPC, database rows, and third-party responses.
- Keep derived state minimal; recompute when cheap and safer.
- Ensure caches, memoization, and local persistence have invalidation behavior.
- Check serialization, migrations, and schema changes together.

## API and UI Contracts

- Public interfaces should remain backwards compatible unless the breaking change is explicit.
- Avoid ambiguous boolean parameters in new APIs when a named option or enum would clarify intent.
- UI behavior should preserve accessibility basics: labels, focus order, keyboard access, semantic roles, contrast, and resilient text wrapping.

## Testing Standards

- Tests should fail for the bug or regression they are meant to prevent.
- Prefer focused tests near the changed behavior over broad snapshot churn.
- Cover one representative edge case when logic branches or data shape changes.
- Do not require tests for mechanical wiring if existing coverage already exercises the behavior and the risk is low.

## Review Tone

- Lead with bugs, regressions, and safety issues.
- Explain why a change matters; avoid preference-only comments.
- Separate blocking issues from optional polish.
