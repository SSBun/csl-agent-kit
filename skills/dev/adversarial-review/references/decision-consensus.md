# Decision Consensus Gate

Use this gate when the Reviewer or Editor identifies two or more materially different viable decisions, fixes, or implementation plans.

1. Keep the task `BLOCKED`. Do not implement an option before the user chooses.
2. Have the Editor assemble the decision context:
   - the exact decision and why it is needed now
   - relevant artifact, source evidence, constraints, assumptions, and non-goals
   - 2–4 mutually exclusive options
   - each option's behavior, benefit, risk, cost, and verification impact
3. In the next numbered Reviewer pass, challenge missing options, hidden risks, scope growth, and unsupported assumptions while still satisfying the full-scope and prior-ID requirements in the [Review Loop Contract](review-loop.md). If the challenge raises a finding not yet answered by the Editor, return `STATUS: CONTINUE` with every current item.
4. On `CONTINUE`, have the Editor answer the complete batch and update the decision context. Run another full-scope Reviewer pass that accounts for every finding ID. Return `STATUS: NEEDS_USER` only when no item awaits an Editor answer and only the user-owned decision remains.
5. Do not continue agent exchanges to manufacture agreement. Have the Coordinator incorporate the reviewed challenge and record each position:

```text
EDITOR POSITION: Suggest option <N or no recommendation>
REVIEWER POSITION: Suggest option <N or no recommendation>
```

Do not fabricate agreement. If evidence is missing, identify it as unresolved instead of starting another agent exchange. Frame any disagreement neutrally and identify user-owned preferences.

After the challenge, have the Coordinator ask the user:

```text
Question: <what must be chosen?>
Context: <why this decision exists and the relevant constraints>
Options:
1. <option, trade-offs, consequences>
2. <option, trade-offs, consequences>
Suggested answer: <shared option N, or each role's position>
Why: <evidence and material disagreement>
Gate: BLOCKED pending your choice
```

Wait for an explicit choice. Record it as an acceptance criterion and treat implementation as follow-up work. Preserve the round number and finding history when review resumes.
