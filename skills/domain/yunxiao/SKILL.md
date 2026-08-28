---
name: yunxiao
description: Create first-time Zhihu Yunxiao One MRs; list open MRs or QA; batch-approve requests; and manage the macOS approval daemon and dashboard. Use for Yunxiao MR creation, listing, QA, approval, or daemon management. Exclude metadata edits, code review, join/restore, and GitHub or GitLab PRs.
---

# Yunxiao

## Prerequisites

- Require Node.js 18+, Git, `classic-level`, `mqtt`, and either `YUNXIAO_TOKEN` or Chrome/Chromium logged in to `one.in.zhihu.com`. Daemon needs `terminal-notifier` on `PATH` for clickable notifications.
- Prefer the environment variable. Otherwise the script copies Chrome Local Storage LevelDB to a temporary directory, reads the exact `one.in.zhihu.com/token` record, and validates candidates with a One GET. Never request a token in chat, command arguments, a manifest, or logs.
- Read `references/manifest-schema.md` and collect explicit inputs under that contract. Never read or invoke `zspec`, and never use `zspec.json` as runtime input.

## Read-Only Queries

```text
node <skill-dir>/scripts/yunxiao.mjs list-unmerged --from <YYYY-MM-DD> --to <YYYY-MM-DD>
node <skill-dir>/scripts/yunxiao.mjs list-qa --repo <namespace/repository>
```

Both are GET-only; `list-qa` returns the repository's zero or one configured `qaOwner` plus `qaRequired`.

## Bulk Approval Workflow

Follow `references/approval-workflow.md`; `approve-all` requires explicit confirmation of the exact `planId` from `plan-approvals`.

## Auto-Approval Daemon

Follow `references/daemon-workflow.md`. Confirm unattended approval of every eligible request before `daemon install --yes` or `daemon start --yes`. It is macOS-only, never merges, and exposes a read-only loopback Dashboard.

## Creation Workflow

1. Confirm each module's Git root, source and target branches, target repository, and push remote. Ask for missing targets; do not guess.
2. Build a schema-compliant manifest. For temporary files, use `mktemp`, run `chmod 600`, then delete them. Do not rewrite user-supplied manifests.
3. Run the read-only plan:

   ```text
   node <skill-dir>/scripts/yunxiao.mjs plan --input <manifest.json>
   ```

4. Show branches, remotes, repositories, work item, QA, MR form, and warnings. State that execution pushes branches and creates remote MRs.
5. After explicit confirmation for this execution, run:

   ```text
   node <skill-dir>/scripts/yunxiao.mjs create --input <manifest.json> --yes
   ```

6. Report JSON `status`, MR URLs, union MR URL, failed modules, and warnings. Never describe `partial` or `failed` as success.

## Safety Boundaries

- The script never commits and fails on a dirty repository, branch mismatch, or ambiguous remote.
- `plan` checks the same work item for a matching MR and fails before any push. Otherwise all branches are pushed first; one failed push prevents MR creation, without rolling back prior pushes.
- Write requests are not replayed. If a post-preflight race returns an existing MR, the result is `partial`; no checks or union MR are written. Inspect remote state before retrying.
- Multi-repository work may partially succeed. A union MR failure does not delete created single-repository MRs.
- `plan`, `plan-approvals`, `list-unmerged`, `list-qa`, `daemon status`, and `daemon install --dry-run` perform only local reads plus Yunxiao GETs where applicable. Only confirmed `create --yes`, `approve-all --yes`, and the explicitly installed or restarted daemon write remotely.
- Chrome fallback does not modify browser data, persists no token, deletes its temporary copy, and passes no credential to Git.
- Manual existing-MR approval uses the bounded bulk workflow. Unattended approval is allowed only through the separately confirmed daemon workflow. Neither path merges MRs, edits their metadata, performs join/restore, or modifies workspace configuration.

## Self-Check

```text
node <skill-dir>/scripts/yunxiao.mjs self-test
```

Validate routing with `evals/trigger_cases.json` and `evals/semantic_config.json`.
