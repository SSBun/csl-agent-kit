---
name: test-triage
description: Diagnose and fix failing tests, CI failures, red builds, pipeline failures, crashes, exceptions, stack traces, timeouts, flaky behavior, regressions, or bug reports. Use when the user reports a failure, asks to fix a bug, asks why tests fail, or asks to make CI pass.
---

# Test Triage

Use a tight reproduce -> diagnose -> fix -> verify loop. Prefer the smallest command that proves the failure and the smallest change that fixes it.

## Workflow

1. **Capture the failure**
   - Read the user report, logs, failing test name, branch state, and recent diff.
   - If no command is known, inspect project docs, package manifests, CI config, or existing test scripts.
   - State the concrete symptom before changing code.

2. **Reproduce narrowly**
   - Run the smallest relevant test or command first.
   - For runtime bugs, re-run the original crash, CLI command, page action, log-producing step, or CI step when possible.
   - If the full suite is the only known command, run it once, then narrow from the output.
   - Preserve the important error lines, assertion, stack trace, exit code, and failing file.
   - If the bug has no failing test and a focused regression test or reproduction script is practical, create it before changing production code.

3. **Localize the cause**
   - Compare failing behavior against nearby tests, recent changes, and existing patterns.
   - Inspect production code and tests together; do not assume the test is wrong.
   - Form one working hypothesis at a time and verify it with code or command output.

4. **Fix minimally**
   - Change only files needed for the failure.
   - Prefer existing helpers, local conventions, and simple control flow.
   - Do not rewrite unrelated code while debugging.

5. **Verify the fix**
   - Re-run the original failure path first: failing test, crash command, page action, CI step, or log-producing command.
   - Re-run the narrow failing command if it differs from the original path.
   - Run the adjacent or broader test command that could catch regressions.
   - If no automated regression test was practical, run a smoke check and record the remaining risk.

6. **Report evidence**
   - Summarize the root cause, changed files, and verification commands with pass/fail results.
   - If a command cannot run, say exactly why and what risk remains.

## Flaky Failures

- Re-run the narrow command enough times to distinguish deterministic failure from flake.
- Look for time, randomness, ordering, network, filesystem, locale, and concurrency assumptions.
- Avoid papering over flakiness with longer sleeps unless the project already uses that pattern and no better synchronization point exists.

## CI Failures

- Read the CI job name, OS, language/runtime versions, environment variables, and failing step.
- Reproduce locally only when the environment is close enough to be meaningful.
- If local and CI behavior differ, explain the environmental difference before patching.

## Stop Conditions

Stop and ask before continuing when:

- The next step requires secrets, credentials, production access, or destructive commands.
- The failure cannot be reproduced and logs are insufficient to identify a credible cause.
- Multiple unrelated failure groups require broad cleanup after you have grouped them and selected the highest-signal first failure.

## Rules

- Do not claim a fix without fresh verification output.
- Do not skip reproduction for non-trivial failures unless the user only wants analysis.
- Do not mark tests as skipped, loosen assertions, or delete coverage just to make the suite pass.
- Do not change snapshots or golden files until the behavioral change is understood.
