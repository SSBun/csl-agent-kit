# Adversarial Review: Analyze Project Learn 模式 PRD

## Summary

- Gate: APPROVED
- Review state: APPROVED
- Stop reason: approved
- Reviewer: `learn_prd_final_reviewer`
- Current round: RE-REVIEW (5)
- Task: [tasks/tasks/analyze-project-learn-prd.md](../../tasks/tasks/analyze-project-learn-prd.md) — 设计 analyze-project 的 Learn 模式 PRD
- Updated: 2026-07-19T21:04:38+0800

## Reviewed scope

- Base or revision: `14d1ba51d694e448e5bf1fd949c5aae444561247`
- Artifacts: `docs/analysis/analyze-project-v2-learn-prd.md`
- Fingerprint: SHA-256 `b441bcf52ee75c23c910791fe3a326b4ca3b59f2a97c78f49344578fbee6ac51`
- Non-goals: skill 实现、Develop PRD 修改、共享工作区中的其他并发改动

## Outcome

Reviewer 在 `RE-REVIEW (5)` 批准 SHA-256 `b441bcf52ee75c23c910791fe3a326b4ca3b59f2a97c78f49344578fbee6ac51` 的完整 PRD；R1–R10 全部解决。

## Findings

### R1 — BLOCKER: hidden eval 题目泄漏

- Location: PRD §16.3
- Evidence: hidden prompt 与黄金答案直接写入实现依据 PRD。
- Risk: skill 可针对已知题目优化，不能证明 held-out 迁移。
- Editor response: 删除具体 hidden 题、答案与触点；改为 skill 冻结后由独立评测方创建并封存 fixture，生成器不可访问，偶然重合则整次重跑。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: PRD 不再包含原具体场景或黄金评分内容。
- Status: RESOLVED

### R2 — BLOCKER: eval 两臂权限与工作区未隔离

- Location: PRD §16.1、§16.3
- Evidence: 只读权限与报告写入冲突，且两臂可能共享目标文件和 dirty 状态。
- Risk: 无法生成或第二臂受第一臂污染。
- Editor response: 两臂改为同一提交的独立 clean 工作区；只开放各自目标报告、必要父目录和同目录临时文件写入，候选复制到外部 artifact store。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: freshness 明确在任何输出写入前采样，两臂不共享文件或 Git 状态。
- Status: RESOLVED

### R3 — BLOCKER: baseline 失败分支未定义

- Location: PRD §16.2–16.3
- Evidence: baseline 无输出或 Verifier 失败时没有 downstream 分数语义。
- Risk: “领先 1 分”不可复现。
- Editor response: 穷举三分支并统一进入条件：with-skill 通过才进入 downstream；baseline 只有通过才进入，`NO_OUTPUT` 或 Verifier 失败按 §16.4 固定 `0/5`。
- Resolution: Reviewer 在 `RE-REVIEW (3)` 确认解决。
- Verification: 进入条件与三分支使用同一语义；A/B 映射仍延迟揭示。
- Status: RESOLVED

### R4 — BLOCKER: 最终目标 symlink 未受保护

- Location: PRD §5、§13
- Evidence: 只检查父目录 symlink，未检查目标本身。
- Risk: 替换时可能跟随链接写出仓库。
- Editor response: 对最终目标执行 `lstat`，拒绝 symlink 和非普通文件；普通文件只用同目录临时文件安全原子替换，无法保证时零写入。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: 失败契约与质量门增加目标类型和原子替换 fixture。
- Status: RESOLVED

### R5 — BLOCKER: 现有报告更新语义不安全

- Location: PRD §5、§6、§13
- Evidence: “更新”未规定旧事实、Key 和学习者假设的重验证。
- Risk: 新 freshness 下混入旧内容。
- Editor response: 删除增量更新，只允许用户确认后完整重分析、重建并原子替换。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: 旧“询问更新”与“基于现有内容更新”扫描无命中。
- Status: RESOLVED

### R6 — BLOCKER: dirty Develop map 无可比较身份

- Location: PRD §6、§10
- Evidence: 相同 HEAD 下不同未提交内容无法由 clean/dirty 描述区分。
- Risk: Learn 可能复用错误 snapshot 的 map。
- Editor response: 为消除 snapshot 身份与实现复杂度，v1 完全不读取 Develop map；两模式只共存，不互作输入或证据。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: 旧 dirty coverage 和 map 导航复用表述扫描无命中。
- Status: RESOLVED

### R7 — BLOCKER: Prediction 与 Transfer 可提前读取 Key

- Location: PRD §7.4–7.5
- Evidence: 只定义 recall 隐藏范围，后两阶段没有材料开放顺序。
- Risk: 复制答案仍可满足完成标准。
- Editor response: 改为严格串行：Recall 只看题；Prediction 隐藏 Key/源码；Transfer 可用正文/源码但隐藏 Key；三类初始答案全部固定前，整个 Key 不得打开，完成后统一核对。
- Resolution: Reviewer 在 `RE-REVIEW (3)` 确认解决。
- Verification: 提前打开 Key 会使整轮只算复习，重测需换用等价三类 prompts。
- Status: RESOLVED

### R8 — QUESTION: scope 过大判据不可执行

- Location: PRD §7.1、§8、§9、§13、§15、§17
- Evidence: “高密度”和“多个无关子系统”没有结构性 oracle。
- Risk: 相同输入产生相反行为，fixture 无法判定。
- Editor response: 删除主观阈值，以共享概念、状态/数据边界或代表行为建立覆盖图；连通性成为 project/dir 唯一判据。file 是最小 scope，不连通时正常生成一份按分量组织的完整报告；分析流程第 10 步现已使用同一分支。
- Resolution: Reviewer 在 `RE-REVIEW (4)` 确认解决。
- Verification: 主体规则、流程、失败表、验收与 fixtures 均区分 project/dir 收缩和 file 分组继续。
- Status: RESOLVED

### R9 — NOTE: 缺少语言契约

- Location: PRD 报告内容与验收标准
- Evidence: Develop 已规定默认用户语言，Learn 未规定。
- Risk: 双模式输出语言不一致。
- Editor response: 复用 Develop 最小语言契约：默认用户语言，代码、命令、符号和既有领域词保持原文。
- Resolution: Reviewer 在 `RE-REVIEW (2)` 确认解决。
- Verification: 证据规则与验收标准均包含语言契约。
- Status: RESOLVED

### R10 — QUESTION: held-out 重放与新 trial 未区分

- Location: PRD §16.3
- Evidence: 新条款要求复跑使用新 fixture，同时宣称用例可复现。
- Risk: 改变题目难度的重跑无法重复确认原结果。
- Editor response: 区分不调用模型的确定性审计重放与任何重新生成候选/Agent 回答的新 trial；新 trial 必须新 ID 与新 sealed fixture。
- Resolution: Reviewer 在 `RE-REVIEW (3)` 确认解决。
- Verification: 纯基础设施失败仅在没有模型调用且 fixture 未解封时可在原 trial 重试。
- Status: RESOLVED

## Round history

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | CONTINUE | R1–R9 | none | R1–R9 |
| RE-REVIEW (2) | CONTINUE | R10 | R1, R2, R4, R5, R6, R9 | R3, R7, R8, R10 |
| RE-REVIEW (3) | CONTINUE | none | R3, R7, R10 | R8 |
| RE-REVIEW (4) | APPROVED | none | R8 | none |
| RE-REVIEW (5) | APPROVED | none | none | none |

## Verification

- `git diff --check` — 通过。
- 未跟踪 PRD 的 `git diff --no-index --check` — 无空白错误（退出 1 仅表示存在新增内容）。
- PRD 结构 — 18 个连续编号章节，395 行。
- 固定 eval 证据 — `05a6c689e2344dc925b7dc111f02aa03750114f6` 中声明的符号与 `package.json#scripts.check:cli` 均存在。
- 占位符、旧更新/map 复用、已泄漏 hidden 场景、主观 scope 阈值及旧复跑措辞扫描 — 无命中。
- Limitations: PRD 尚未实现；运行时 fixtures 与输出 eval 属于后续完整实现质量门。

## Unresolved items

None.

## Approval boundary

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: 未授权实现或发布。
