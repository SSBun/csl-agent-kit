---
schema: csl-memory/v2
id: legacy-context-4a9856c5741870ed4527
revision: 5
type: reference
title: Task 工作流、证据与展示边界
summary: 任务执行族、证据失效和完成门禁；评分留记录，重要局限仍报告，取消限制不等于取消流程。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-task-workflows — Canonical task workflows:1
  - legacy:tasks/context.md;
    sha256:4342ff6b26b3f64b977205e94729ace7acf9ccec5441fbf312ea915e916098ad;
    unit:tasks/context.md#CTX-task-workflows — Canonical task workflows:1
  - "skills/meta/task/SKILL.md#Storage and Core; #Owner Self-Check and Review
    Handoff; #Record Contract; #Completion"
  - skills/meta/agent-hooks/references/csl-agent-kit-contract.md#Task and Memory
  - session:01a19f74-985b-71ed-b277-8ea38b727416/task:task-score-record-only/event:4f3ec2ed35adeedf9b62ed41dcee15da6c4c89fe6d6c7390e26c5556911764b7
  - session:01a19f74-985b-71ed-b277-8ea38b727416/task:task-score-record-only/event:e8c951a87562a78fbf6633adcc2443480a22747db0476cfa3d93d95c8985ac58
  - skills/meta/task/SKILL.md#self-assessment
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-19 区分取消流程与取消流程限制:1
updated: 2026-11-06T08:05:28.032Z
deleted: false
retrieval:
  aliases:
    - Canonical Task 工作流与证据边界
    - canonical task
    - Task Target
    - Execution Log
    - Review ledger
    - 任务评分留在记录，回复默认不展示
    - 取消限制不等于取消流程
  situations:
    - 选择任务执行族或恢复任务
    - 判断审查证据失效与完成门禁
    - 调整任务自评等级的用户展示
  topics:
    - Task/工作流
    - Task/审查证据
    - Task/展示
  links: []
---

- 执行族：`task` 单一可验收结果；`task-plan` 调查并交接后续实现，计划 Target 接受不授权执行；`task-queue` 串行子任务及父级集成验收。`topic` 是可选共享规格，不是第四执行族。独立分析本身可验收时走 Task。
- 权威入口：`skills/meta/task/SKILL.md`、同级 `task-plan/`、`task-queue/`、`task-review/`；Target 对齐与 confirm/solo、探索/实现、主会话/委派差异查 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`，风险判级查同目录 `task-review-grading.md`。共享协议不参与 Skill 发现；常驻 Contract 只持稳定触发和边界。
- 新结果建立新任务；明确执行已有 implementation-ready plan 复用原记录。同组件或文件重叠不建立 ownership。Queue 父子及兄弟标题互异，完成 child 重开需先激活 parent，并失效父级集成证据。
- 记录正文权威，索引只导航；路径由活动 Task 根解析，不从旧 `tasks/` 示例推断当前根。core 入口 `skills/meta/csl-tasks/shared/lib/task-core.js`，CLI 为同组件 `scripts/csl-tasks.js`。core 不保存会话对齐/确认、不启动验证或嵌套宿主。旧元数据及 Kind Auto 仅兼容读取，新队列用 Queue；历史记录不批量迁移。
- Target 是唯一 checkbox，稳定 Tn；Plan 写当前步骤，Result 写逐 Target 证据。Execution Log 记重要发现/决策/结果和修正，属于指纹正文；恢复须与实际产物核对，缺日志不证明动作未发生，JSON recovery 仅兼容旧字段。Task Summary、Self Assessment 的格式与时机查 Task；评分不能代替审查。
- R0/R1 免独立审查须当前 assessment 且无显式或既有义务；R2 必须 fresh 只读 task-review。mandatory review 失败须 Block，不能降级或自审冒充。adversarial-review 仅显式请求，R2 仍保留 ordinary pass。
- 修改规格、Result、日志、相关产物或 Queue 关系可使 assessment/review/Verification 失效；审查期间冻结范围。快照只证明明确登记范围的检查时身份，core 不证明语义风险、实际隔离、检查执行或范围完整。Self Assessment 不由 CLI 强制存在。
- 逐 finding 无实质进展连续到 2 则 Block；不设总 pass 上限。ledger 清理由 `review passed --resolve-ledger --snapshot` 原子完成；Review Reports 保存每轮反馈，不能手删 ledger 绕过。报告登记与指纹排除、快照/报告校验、R0/R1 finalize、回滚限制均查 Task 正式契约及 `task-evidence.js`、`task-reports.js`。
- 相关回归入口：`tests/csl-tasks-core.test.mjs`、`tests/task-files.test.mjs`；测试源码不证明当前执行通过。任务相关知识读取当前 Memory；后台 Memory 维护独立，不恢复旧 Context/Lessons 工作流。
- 本项目任务展示：三维自评等级、证据和局限留任务记录；回复含完成交付默认不展示等级或评分表，用户明确要求时除外。重要验证结果、风险、局限和未完成事项仍报告；不取消自评或质量门禁，不推广为全局偏好。正式细则见 `skills/meta/task/SKILL.md#self-assessment`。
- 用户取消流程的轮次、次数、预算或上限时，仅移除被点名限制；保留流程本身。只有明确停止或取消整个流程才终止，不能把限制变更解释成终止任务。
