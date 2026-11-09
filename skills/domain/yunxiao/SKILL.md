---
name: yunxiao
description: 创建知乎云效 One 普通任务或首次 MR，查询未合并 MR 和 QA，批量审批，以及管理 macOS 审批守护进程和 Dashboard。用户要求创建云效任务、工作项、Yunxiao task 或 One MR 时使用。不用于已有工作项或 MR 的元数据编辑、代码评审、join/restore，以及 GitHub/GitLab PR。
---

# Yunxiao

## Prerequisites

- MR／审批脚本需要 Node.js 18+、Git、`classic-level`、`mqtt`，并使用 `YUNXIAO_TOKEN` 或已登录 `one.in.zhihu.com` 的 Chrome/Chromium。Daemon needs `terminal-notifier` on `PATH` for clickable notifications. 普通任务 API 示例仅需 Node.js 18+ 和有效凭据。
- Prefer the environment variable. Otherwise the script copies Chrome Local Storage LevelDB to a temporary directory, reads the exact `one.in.zhihu.com/token` record, and validates candidates with a One GET. Never request a token in chat, command arguments, a manifest, or logs.
- 创建普通任务时直接使用 [普通任务创建流程](references/task-creation.md)，无需 Git 仓库、MR manifest 或项目链接。现有 `yunxiao.mjs create` 仍仅创建 MR，不能用于创建任务。
- MR 创建才需读取 `references/manifest-schema.md` 并按契约收集输入。Never read or invoke `zspec`, and never use `zspec.json` as runtime input.

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

## MR Creation Workflow

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
- `plan`, `plan-approvals`, `list-unmerged`, `list-qa`, `daemon status`, and `daemon install --dry-run` perform only local reads plus Yunxiao GETs where applicable. 远端写入限于已授权的普通任务创建、`create --yes`、`approve-all --yes` 和明确安装或重启的 daemon；各自遵守对应流程。
- Chrome fallback does not modify browser data, persists no token, deletes its temporary copy, and passes no credential to Git.
- Manual existing-MR approval uses the bounded bulk workflow. Unattended approval is allowed only through the separately confirmed daemon workflow. Neither path merges MRs, edits their metadata, performs join/restore, or modifies workspace configuration.

## Self-Check

```text
node <skill-dir>/scripts/yunxiao.mjs self-test
```

Validate routing with `evals/trigger_cases.json` and `evals/semantic_config.json`.
