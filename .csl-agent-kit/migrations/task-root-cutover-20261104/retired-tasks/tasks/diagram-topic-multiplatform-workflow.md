# 绘制 Topic 多平台需求完整交付流程图

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-12 14:17) |
| Artifacts | [Artifacts](../artifacts/diagram-topic-multiplatform-workflow/) |
| Kind | Task |

## Scope

绘制拟议 Topic 模型的完整多平台需求交付流程，保留现有 Task、Queue、授权及审查职责；仅创建图源和图像，不修改工作流实现。

## Plan

1. 依据已讨论的 Topic 方案组织共享规格、任务归属、执行依赖和验收关卡。
2. 使用已安装的 beautiful-mermaid 生成 SVG，并生成 PNG 预览。
3. 检查流程覆盖、返工路径和图像可读性，展示图片并保留可编辑源。

## Task Summary

未修改代码或组件；仅新增 Topic 多平台需求交付流程的 Mermaid 图源、SVG 和 PNG 预览，覆盖共享规格、任务拆分、各平台执行、集成验收、变更与阻塞处理。

## 图示产物

- [可编辑 Mermaid 图源](../artifacts/diagram-topic-multiplatform-workflow/reports/workflow.mmd)
- [SVG 流程图](../artifacts/diagram-topic-multiplatform-workflow/reports/workflow.svg)
- [PNG 预览](../artifacts/diagram-topic-multiplatform-workflow/reports/workflow.png)
- Topic 为拟议设计，非现有实现。图中“↩ 回到”表示返工或恢复回路；各平台进入同一模板，表示分别执行，不是合并为一个任务。Queue 仍用于需要串行的本地执行，不决定 Topic 归属。图中的发布步骤仅在用户授权范围包含发布时适用。

## Target
- [x] T1: 绘制以 Topic 共享规格和关联任务为核心的复杂多平台需求流程，覆盖需求确认、任务拆分与关联、平台执行、验证审查及整体交付。
- [x] T2: 图中体现依赖与并行的区别、共享规格变化及恢复检查、阻塞和修复回路，明确这是拟议设计而非现有实现。
- [x] T3: 生成可查看的流程图并在对话中展示，保留可编辑图源；不修改工作流实现。

## Result

- T1: 核对 Mermaid 节点与最终 PNG：需求确认、Spec Context、双向引用、服务端/iOS/Android/Web 独立任务、任务审查验证及平台覆盖和集成验收均有对应阶段。
- T2: 图中区分 Topic 与 Queue，独立任务与真实依赖；包含采用版本、用户确认实质变化、受影响证据刷新、Blocked/恢复和回到编号步骤的返工路径；标题明确拟议设计。
- T3: beautiful-mermaid 成功生成 SVG；静态颜色兼容处理后 rsvg-convert 生成 1800×4656 PNG，read 已内联展示并人工核对可见内容。原始 Mermaid 保留供编辑；未修改工作流实现。
- Review gate: Skipped — 静态说明图的 R1 四项条件成立，无独立审查请求。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅创建拟议设计的静态图源和图像，不改变工作流行为；对照已确认的图示目标进行内容与视觉核对。
- Snapshot: workflow.mmd sha256:c14f8e55e55fee1ad7ce267df6f030e8ae63f4fb5351b6c8aee497b56e6812e4; workflow.svg sha256:c5245baa14ae750ebd6f1e26b5ef055c55cedf861890bf2b60ad5481758487e4; workflow.png sha256:57808e7f2400c011120a23c08617080be50e5068b8fac63da025e02bbc0a0419
- Evidence: T1-T3；渲染成功，最终 PNG 已打开核对；diff --check 通过。
- Result clarity: 完整展示已讨论 Topic 模型，不作为实施授权或现有系统能力声明。
- Bounded impact: 仅本任务 reports 下的三份图示产物，不改 Skill/代码/规则。
- Low risk: 可编辑说明图，可逆、无运行时或外部副作用。
- Sufficient verification: 核对节点与返工文本、最终 PNG 视觉检查、渲染和文件身份；未运行测试。
- Task fingerprint: f172f6225314b1610cac0344e727a70edba61f1d6f21b1089cc9a2323cd38cc0

## Verification

- Passed: 最终 SVG/PNG/图源内容与记录快照一致；PNG 显示正常，Topic 拟议标注、四阶段、返回路径均可见。保留 SVG 便于放大查看；未运行测试。
