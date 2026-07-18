# Decision Consensus Gate

Use this gate when the Reviewer or Editor identifies two or more materially different viable fixes or implementation plans.

1. Keep the task `BLOCKED`. Do not implement an option before the user chooses.
2. Have the Editor assemble the decision context:
   - the exact decision and why it is needed now
   - relevant code, constraints, assumptions, and non-goals
   - 2–4 mutually exclusive options
   - each option's behavior, benefit, risk, cost, and verification impact
3. Have the Reviewer challenge missing options, hidden risks, scope growth, and unsupported assumptions.
4. Let both agents revise the packet until they explicitly agree on the question, options, suggested answer, and explanation:

```text
EDITOR CONSENSUS: YES — Suggest option <N>
REVIEWER CONSENSUS: YES — Suggest option <N>
```

Do not fabricate consensus. If evidence needed for agreement is missing, gather it first. If the disagreement is a user-owned preference, agree on a neutral framing and clearly identify that preference as the deciding factor.

After consensus, have the Coordinator ask the user:

```text
Question: <what must be chosen?>
Context: <why this decision exists and the relevant constraints>
Options:
1. <option, trade-offs, consequences>
2. <option, trade-offs, consequences>
Suggested answer: <option N>
Why: <shared Reviewer–Editor reasoning>
Gate: BLOCKED pending your choice
```

Wait for an explicit choice. Record it as an acceptance criterion, let the Editor implement that option, and have the same Reviewer verify the result. If the user chooses another option, respect it and review against that choice unless new material risk appears.
