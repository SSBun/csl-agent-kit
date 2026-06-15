# Common Antipatterns

Flag these when they create real risk in the reviewed diff.

## Correctness

- **Partial contract update**: changing a type, model, route, or state shape without updating all serializers, validators, consumers, tests, and documentation that depend on it.
- **Happy-path-only logic**: code assumes data exists, network calls succeed, arrays are non-empty, or parsing always works.
- **Hidden race**: async work updates shared state after cancellation, route changes, unmount, retry, or a newer request.
- **Time and locale assumptions**: code relies on local time, implicit timezone parsing, locale-specific formatting, or unstable ordering.

## Security and Privacy

- **Client-only authorization**: hiding controls in the UI without enforcing permission checks on the server or trusted boundary.
- **Unsafe dynamic execution or queries**: interpolating untrusted input into shell commands, SQL, selectors, templates, file paths, URLs, or HTML.
- **Secret exposure**: logging tokens, embedding credentials, committing private keys, or returning sensitive fields to clients.
- **Overbroad access**: new admin, file, network, or database permissions that exceed the feature's need.

## Maintainability

- **Speculative abstraction**: new framework, helper layer, config surface, or generic API used by only one caller without clear payoff.
- **Local pattern drift**: introducing a different style for errors, data fetching, state management, or formatting in a codebase with established patterns.
- **Boolean soup**: multiple flags controlling behavior in ways that are hard to read or test.
- **Comment-code mismatch**: comments describe intent that the implementation no longer follows.

## Testing

- **Assertion without behavior**: tests only check rendering, snapshots, mocks called, or implementation details while missing the observable outcome.
- **Mock hides the bug**: mocked dependencies return ideal data and skip failure modes introduced by the change.
- **Coverage gap at the risky branch**: tests cover setup or happy paths but not the new condition, migration, permission rule, or fallback.

## Release and Operations

- **Unsafe default**: new config defaults to enabled, public, destructive, or expensive behavior without rollout control.
- **No migration path**: schema or data changes lack backfill, compatibility window, rollback, or idempotency.
- **Silent failure**: failures are swallowed without user feedback, metrics, logs, or retry strategy.
