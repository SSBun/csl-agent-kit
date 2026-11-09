# Review round 01

- Schema: task-review-report/v1
- Task: task-evidence-tools
- Round: 01
- Snapshot: snapshot:tasks/artifacts/task-evidence-tools/evidence/f5ecbf4a6ff263bcaf8e4d8713cbf344d2d0c703da45bd990d8c06ad9d71c9fa.json#f5ecbf4a6ff263bcaf8e4d8713cbf344d2d0c703da45bd990d8c06ad9d71c9fa
- Task fingerprint: 76487117de3c9536d2fd8b282d19242bc234ea8959f9e358f38eb21e50c5fd96
- Outcome: findings
- Mode: independent subagent
- Run: /root/review_evidence_1

## Reviewer feedback

Review mode: independent subagent

Reviewed scope / snapshot: 子任务 `task-evidence-tools` 的 T1/T2、14 文件 manifest、实际差异及相关调用路径。快照 `snapshot:tasks/artifacts/task-evidence-tools/evidence/f5ecbf4a6ff263bcaf8e4d8713cbf344d2d0c703da45bd990d8c06ad9d71c9fa.json#f5ecbf4a6ff263bcaf8e4d8713cbf344d2d0c703da45bd990d8c06ad9d71c9fa` 在审查开始和结束均校验通过，未发现范围内漂移。

Findings:

- **TR-1**
  - **Severity:** Concern，需要修复。
  - **Location:** `skills/meta/csl-tasks/shared/lib/task-reports.js:117`；同类问题也存在于恢复路径第 78–81 行。
  - **Issue:** 报告摘要计算前先以 UTF-8 解码，非法字节会被替换字符归一化，因此当前校验不能保证报告原始字节未变。
  - **Evidence:** 在临时工作区登记包含 `U+FFFD` 的合法报告，将其 `EF BF BD` 三字节替换为单字节 `FF`。确认文件字节不同后，`checkEvidence` 仍返回 `managed: true, checked: 1`，随后 `setReviewGate(..., "passed", ...)` 也成功。现有 60 项核心与快照测试全部通过，但没有覆盖该情况。
  - **Impact:** 已登记报告发生字节损坏后仍可通过完整性和终态检查，违背 T2 的不可变历史及文档所承诺的报告字节校验。
  - **Suggested next step:** 对读取到的原始 Buffer 计算摘要，再单独解码并解析头部；恢复路径采用相同处理，并加入上述非法 UTF-8 变更回归用例。

Unverified risks: 无额外阻碍 T1/T2 核验的证据缺口；TR-1 是已复现问题，需要 remediation。

Checks performed: 独立运行 `node --test tests/task-evidence.test.mjs tests/csl-tasks-core.test.mjs`，60/60 通过；执行上述临时报告字节损坏复现；前后运行 `check-evidence task-evidence-tools`；结束时任务 `check` 和范围内 `git diff --check` 均通过。临时夹具已删除，未修改交付物或任务记录。

Author evidence examined: 已阅读所属任务的 Result、R2 Assessment 和 `regression-focused.log`，其中记录 82 通过、2 个文档断言失败。关于这两项失败在 HEAD 已存在，以及语法、skill-quality 检查通过的结论，属于作者提供的证据，本 Reviewer 未重新验证基线或重跑质量门禁。

Coverage limits: 实际采用 fresh-context 子代理；宿主工具没有强制只读隔离，本次依据用户已接受的例外，以只读执行约束和前后内容核对开展审查。该方式不证明工具级隔离。

未审查 Queue 其余四项优化或独立的 Task Context 改动，也未运行全仓测试；报告原始字节完整性仍有上述已复现风险。

