# 支持按任务名称暂停与恢复

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-12 17:42) |
| Artifacts | [Artifacts](../artifacts/task-name-resolution/) |
| Kind | Task |

## Plan

1. CLI 增加只读名称查找，让 show、pause、resume 支持唯一完整名称，保留精确 ID 优先。
2. 更新 task 入口与暂停恢复说明，明确同名、部分名称及候选序号的选择边界。
3. 在临时工作区验证按名称操作、重复名称无写入、部分名称只给候选、名称规范化及 ID 兼容；运行语法、技能质量与差异检查，不运行测试套件。

## Execution Log

### 001 — 名称入口与歧义边界

用户确认按任务名称暂停和恢复，无需先取得 ID；匹配多个任务时展示候选，不自动操作不确定任务。实现位于 CLI，沿用核心 ID 身份和原暂停恢复门禁，不新增记录身份或迁移历史任务。

### 002 — 查找与说明已实现，待验证

已加入 find 只读查找及 show/pause/resume 的唯一完整名称解析；同名返回带序号、名称、状态、更新时间及 ID 的候选，部分名称仅给候选不写入。保留精确 ID 快速入口，不依赖其他记录成功解析。task 技能明确内部维护 ID，用户可按名称或序号选择，未知对象不新建替代任务。

### 003 — 当前项目查找失败与最小修复

临时工作区首轮验证通过，但当前项目首次名称查询返回“canonical task is missing a standard status line”。因此让核心 listTasks 在提供名称查询时先读标题、仅完整解析匹配项；普通无查询 list 保留原行为，未修复或删除任何无关任务。匹配项本身格式错误、标题不可读或文件不可访问时仍失败，不静默丢弃候选。后续当前工作区 validate 已通过，不推断此前读取错误代表永久损坏。

### 004 — 最终行为核对

临时工作区通过实际 CLI 进程验证：中文完整名称恢复原 ID、按名称暂停与回读摘要、重复名称拒绝 show/pause/resume 且全部任务及索引字节不变、部分名称只查找不执行（含唯一部分候选）、未知及空白查询无写入、NFKC/空白/大小写规范化、精确 ID 优先与兼容、无关状态损坏不阻断名称查询、匹配项损坏报错且无写入、无标题记录保守失败及精确 ID 独立可用。临时工作区 validate 通过，目录已清除。

两个修改后的 JS 语法、skill-quality 和 git diff --check 通过；skill-quality 仍有 task 的既有上下文预算及篇幅警告。当前项目 find 已找到本任务，最终输出字段使用 statusAt，准确表示状态时间，替代第 002 条中“更新时间”的表述。未运行单元测试、项目测试套件或全新 Agent 会话回放，未提交、推送或重载宿主。

## Task Summary

**任务运行时**：[共享任务组件](../../../skills/meta/csl-tasks/shared/)增加只读名称查找，以及 show、pause、resume 的唯一完整名称入口；同名和部分名称返回候选并拒绝写入，保留内部 ID 身份与原状态门禁。查询先筛选标题，再解析匹配项，避免无关状态格式错误阻断。

**任务技能**：[task](../../../skills/meta/task/)明确用户可用名称或候选序号选择原任务，内部维护 ID；补充查找范围、匹配规则、歧义、损坏记录及当前 focus 的边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 沿用既有任务标题和 ID，不新增身份、索引或模糊选择系统；只在 CLI 和现有列表读取中加入有界查找。 | 核心与 CLI 分别使用相同名称规范化约定，已核对行为一致。 |
| 稳定性 | A | 临时 CLI 核对涵盖成功、歧义、空白、未找到、名称规范化、ID 优先、损坏记录及无写入失败；语法与质量检查通过。 | 未运行测试套件或新 Agent 会话回放；标题不可读取会保守失败，需修复记录后再查名称，精确 ID 入口仍可用。 |
| 完整性 | A | 名称查看、暂停、恢复、候选序号说明和 ID 兼容已交付；当前项目名称查找已实测。 | 序号由 Agent 对照刚展示的候选解析，不作为永久任务身份或 CLI 全局编号；未实测新会话自然语言交互。 |

## Target
- [x] T1: 用户可以用任务名称定位并暂停或恢复原任务，不必先取得任务 ID。
- [x] T2: 名称匹配多个任务时展示可区分的候选，不自动操作不确定的任务；保留 ID 入口。

## Result

- T1: 临时工作区实际 CLI 核对完整名称可暂停和恢复原任务并回读摘要；当前项目 find 按名称定位成功，task 指引明确用户不必查 ID。
- T2: 同名时拒绝 show/pause/resume 并显示带编号的候选；部分名称、未找到和空白不写入；全记录及索引字节对照通过，精确 ID 兼容与优先行为通过。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 新增确定性只读名称解析；最终状态变更复用既有核心，结果清楚、影响有界、失败保守。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/task-name-resolution/evidence/2b82df889bb2fb697cef5a1d080db587f655055cda3d50f8bb4e891809f03a7d.json#2b82df889bb2fb697cef5a1d080db587f655055cda3d50f8bb4e891809f03a7d
- Evidence: Execution Log 003–004 的实际 CLI 观察、当前项目 find 与语法/质量检查；四文件 managed snapshot。
- Result clarity: 唯一完整名称定位原任务；同名及部分名称候选不自动执行，保留原 ID 和原暂停恢复要求。
- Bounded impact: 仅 CLI show/pause/resume 与 find，以及 listTasks 的可选只读查询；无查询列表和核心写入状态门禁保持原语义。
- Low risk: 没有删除、迁移、上传或权限改动；解析失败在写入前拒绝，暂停与恢复为既有可逆状态操作；精确 ID 优先。
- Sufficient verification: 临时 CLI 验证中文/规范化、同名与部分名称、无写入失败、ID 兼容、匹配及无关损坏记录；当前项目查找、JS 语法、skill-quality 和 diff check 通过；未运行测试套件或新 Agent 回放。
- Task fingerprint: f0c9751333990e97597f1387ec60540d31951b36bc0967c5a49dd1eb39ed00ef

## Verification

- Passed: 最终两项 JS 语法、工作区 validate 和 diff check 通过；四文件 snapshot 由 finalize 复核；自评及行为证据仍适用，无后续源码变动。
