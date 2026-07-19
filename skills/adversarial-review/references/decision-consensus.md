# Decision Consensus Gate

Use this gate when the Reviewer or Editor identifies two or more materially different viable decisions, fixes, or implementation plans.

1. Keep the task `BLOCKED`. Do not implement an option before the user chooses.
2. Have the Editor assemble the decision context:
   - the exact decision and why it is needed now
   - relevant artifact, source evidence, constraints, assumptions, and non-goals
   - 2–4 mutually exclusive options
   - each option's behavior, benefit, risk, cost, and verification impact
3. If the active budget allows another round, have the Reviewer challenge missing options, hidden risks, scope growth, and unsupported assumptions. Require the round label and `VERDICT: BLOCKED`; this consumes the next round.
4. Do not loop between the agents. Have the Coordinator incorporate the single Reviewer challenge and record each position:

```text
EDITOR POSITION: Suggest option <N>
REVIEWER POSITION: Suggest option <N or no recommendation>
```

Do not fabricate agreement. If evidence is missing or no review round remains, identify it as unresolved instead of starting another agent exchange. Frame any disagreement neutrally and identify user-owned preferences.

After the challenge, or immediately when no review round remains, have the Coordinator ask the user:

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

Wait for an explicit choice. Record it as an acceptance criterion and treat implementation as follow-up work. Never reset or change the budget automatically. If a bounded final round exposed the decision, include it among the final report's unresolved questions and stop.
