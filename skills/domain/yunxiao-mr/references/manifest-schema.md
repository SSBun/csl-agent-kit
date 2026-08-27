# Yunxiao MR Manifest

The manifest is the only file input for one creation plan and must not contain a token. The script rejects unknown fields, relative repository paths, dirty working trees, branch mismatches, and non-Zhihu Git remotes.

## Example

```json
{
  "title": "收藏面板修复",
  "workItem": "https://one.in.zhihu.com/task/detail/854385",
  "description": "可选的主 MR 描述",
  "changeDescription": "修复收藏面板不可选择的问题",
  "testDescription": "收藏、取消收藏与回归测试通过",
  "platform": "ios",
  "shellBranch": "dev",
  "shellRepo": "zhihu/osee2unified",
  "squash": true,
  "removeSourceBranch": true,
  "qa": "qa-email-prefix",
  "mainModule": "ShortContainerFeature",
  "modules": [
    {
      "name": "ShortContainerFeature",
      "repoPath": "/absolute/path/ShortContainerFeature",
      "sourceBranch": "feat/collection-panel",
      "targetBranch": "dev",
      "targetRepo": "Team-iOS-Module/ShortContainerFeature",
      "remote": "user"
    },
    {
      "name": "LinkCardShareUI",
      "repoPath": "/absolute/path/LinkCardShareUI",
      "sourceBranch": "feat/collection-panel",
      "targetBranch": "dev",
      "targetRepo": "Team-iOS-Module/LinkCardShareUI"
    }
  ]
}
```

## Top-Level Fields

| Field | Required | Meaning |
|---|---:|---|
| `title` | Yes | Title for every single-repository MR and the union MR. |
| `workItem` | Yes | A Yunxiao task/epic URL or a numeric task ID. Only `one.in.zhihu.com` is accepted. |
| `description` | No | Written only to the main MR; sub-MR descriptions are empty. |
| `changeDescription` | Yes | Change description for the main MR; sub-MRs use “see main MR.” |
| `testDescription` | Yes | Test description for the main MR; sub-MRs use “see main MR.” |
| `platform` | Yes | `ios` or `android`; selects the union MR type. |
| `shellBranch` | Yes | Shell-project branch, also used as `parentBranch`. |
| `shellRepo` | No | Shell repository as `namespace/repository`. Defaults to `zhihu/osee2unified` for iOS and `AIS/AIS_Android` for Android. When lookup fails, the plan warns and omits `parentApps`. |
| `squash` | No | Defaults to `true`; set explicitly to `false` to disable. |
| `removeSourceBranch` | No | Defaults to `false`. |
| `qa` | No | QA name or email prefix. The plan resolves it through One employee search and shows the selected user. No QA check is submitted when omitted. |
| `mainModule` | No | Main MR module name; defaults to `modules[0]`. |
| `modules` | Yes | One or more modules. Two or more successful MRs trigger a union MR attempt. |

## Module Fields

| Field | Required | Meaning |
|---|---:|---|
| `name` | Yes | Module name, unique within this plan. |
| `repoPath` | Yes | Absolute path to an independent Git root. |
| `sourceBranch` | Yes | Currently checked-out source branch. |
| `targetBranch` | Yes | MR target branch; must differ from the source branch. |
| `targetRepo` | Yes | One target repository as `namespace/repository`. |
| `remote` | No | Explicit push remote. When omitted, candidates are tried in this order: the target-repository remote, a same-name `user` fork, then another same-repository-name remote. The plan shows the candidate order. |

## Authentication

Authentication sources are checked in this order:

1. `YUNXIAO_TOKEN` in the current Agent process environment:

   ```bash
   export YUNXIAO_TOKEN='Bearer …'
   ```

2. When the environment variable is absent, use `classic-level` to open a temporary read-only copy of Local Storage LevelDB from local Chrome/Chromium `Default` and `Profile N` profiles. Read the exact `one.in.zhihu.com/token` record and select a valid candidate through a One GET request.

The environment variable may omit the `Bearer ` prefix. Never place a real token in chat, a manifest, shell arguments, task records, or persistent logs. The script does not print or persist tokens, modify Chrome data, or pass a token to Git subprocesses. It deletes the temporary database copy immediately after reading it. If the dependency is missing, run `npm install` in the Skill repository or set the environment variable explicitly.

## Remote Behavior

The create phase runs in this order:

1. Validate the manifest, repository roots, current branches, and clean working trees.
2. When needed, read and validate a Chrome token, then perform One repository, review-rule, employee, and application preflight requests.
3. Read the work item's associated MRs. If source repository, source branch, target repository, and target branch all match, fail before any push.
4. Push each unmatched module's source branch to the first successful candidate remote without setting local branch upstream.
5. Call `POST /api/rd/repositories/{sourceRepoId}/mergeRequests` for each module, main module first.
6. Mark self-test on each new MR and, when QA is provided, submit the QA check.
7. When at least two single-repository MRs succeed and no existing-MR race occurs, call `POST /api/v1/app_releases` to create the union MR.

If a race after preflight still makes the server return business code `11107`, the script reads the existing MR, returns `partial`, and does not sync its checks or create a union MR. No other failed write request is retried automatically.

## Output and Exit Codes

The script writes only the final JSON to stdout:

- `status: "planned"`: read-only planning completed.
- `status: "completed"`: every required creation step completed; warnings still need to be reported.
- `status: "partial"`: some remote writes occurred, but one or more module or union MR steps did not complete; exit code `2`.
- `status: "failed"`: planning or execution failed. Execution may already have pushed branches, so inspect `pushed`; exit code `1` or `2`.

After an error, inspect Yunxiao and Git remote state before deciding whether to run again. Never replay the workflow blindly.
