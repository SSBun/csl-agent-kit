# Bulk MR Approval Workflow

Use this workflow only for recent Yunxiao MR approval requests addressed to the current authenticated user.

## Procedure

1. Obtain an explicit inclusive notification date range. Do not invent a default.
2. Run the GET-only plan:

   ```text
   node <skill-dir>/scripts/yunxiao.mjs plan-approvals --from <YYYY-MM-DD> --to <YYYY-MM-DD>
   ```

3. Show `currentUser`, `range`, `approvalRequests`, `excluded`, and `planId`. State that every planned item is open, still needs approval, includes the current user as an eligible approver, and is not yet approved by that user.
4. Ask for explicit confirmation of the displayed plan. State that execution sends one remote approval per listed MR and never merges an MR.
5. Only after that confirmation, execute the exact plan:

   ```text
   node <skill-dir>/scripts/yunxiao.mjs approve-all --from <YYYY-MM-DD> --to <YYYY-MM-DD> --plan-id <planId> --yes
   ```

6. Report top-level `status`, the full `summary`, and every `results` item. Never describe `partial` as success.

If `approve-all` reports that the plan changed, rerun `plan-approvals`, show the replacement plan, and obtain a new confirmation. Never reuse confirmation for an older `planId`.

## Safety Boundaries

- `plan-approvals` reads category-15 One notifications and MR state through GET requests only.
- `approve-all` requires both `--yes` and the exact confirmed `planId`; it rechecks the candidate set, MR SHA, open state, eligibility, outstanding approval need, and prior approval state.
- Approval POST requests are sequential and never retried. The command rereads MR state after each write, including ambiguous write failures.
- A changed SHA, lost eligibility, completed approval requirement, failed write, or changed-after-approval result remains visible in the output.
- This workflow does not inspect code quality, merge an MR, change MR metadata, or dismiss an approval.
