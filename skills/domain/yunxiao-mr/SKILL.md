---
name: yunxiao-mr
description: Create first-time Zhihu Yunxiao One single-repository and union MRs without ZSpec, using YUNXIAO_TOKEN or local Chrome authorization. Use for requests to create, publish, or submit Yunxiao, One, or union MRs, or to bypass zspec for branch push and MR creation. Exclude existing-MR updates or reviews, join/restore, and generic GitHub or GitLab PRs.
---

# Yunxiao MR

Use the bundled script to plan read-only, obtain confirmation, then push branches and call Yunxiao One.

## Prerequisites

- Require Node.js 18+, Git, the installed `classic-level` dependency, and either `YUNXIAO_TOKEN` or a local Chrome/Chromium profile logged in to `one.in.zhihu.com`.
- Prefer the environment variable. Otherwise the script copies Chrome Local Storage LevelDB to a temporary directory, reads the exact `one.in.zhihu.com/token` record, and validates candidates with a One GET. Never request a token in chat, command arguments, a manifest, or logs.
- Read `references/manifest-schema.md` and collect explicit inputs under that contract. Never read or invoke `zspec`, and never use `zspec.json` as runtime input.

## Workflow

1. Confirm each module's independent Git root, current source branch, target branch, target repository, and push-capable remote. Ask for missing targets; do not guess.
2. Build a schema-compliant manifest. For temporary files, use `mktemp`, run `chmod 600`, then delete them. Do not rewrite user-supplied manifests.
3. Run the read-only plan:

   ```text
   node <skill-dir>/scripts/yunxiao-mr.mjs plan --input <manifest.json>
   ```

4. Show branches, remotes, source and target repositories, work item, QA, single or union MR, and warnings. State that execution pushes Git branches and creates remote MRs.
5. After explicit confirmation for this execution, run:

   ```text
   node <skill-dir>/scripts/yunxiao-mr.mjs create --input <manifest.json> --yes
   ```

6. Report JSON `status`, MR URLs, union MR URL, failed modules, and warnings. Never describe `partial` or `failed` as success.

## Safety Boundaries

- The script never commits and fails on a dirty repository, branch mismatch, or ambiguous remote.
- `plan` checks the same work item for a matching MR and fails before any push. Otherwise all branches are pushed first; one failed push prevents MR creation, without rolling back prior pushes.
- Write requests are not replayed. If a post-preflight race returns an existing MR, the result is `partial`; no checks or union MR are written. Inspect remote state before retrying.
- Multi-repository work may partially succeed. A union MR failure does not delete created single-repository MRs.
- `plan` performs only local Git and Chrome reads plus Yunxiao GETs. Only `create --yes` writes remotely.
- Chrome fallback does not modify browser data, persists no token, deletes its temporary copy, and passes no credential to Git.
- This Skill only creates first-time MRs. It does not update existing MRs, perform join/restore, or modify workspace configuration.

## Self-Check

```text
node <skill-dir>/scripts/yunxiao-mr.mjs self-test
```

Validate routing with `evals/trigger_cases.json` and `evals/semantic_config.json`.
