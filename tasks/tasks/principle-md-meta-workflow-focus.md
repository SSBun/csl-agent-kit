# PRINCIPLE.md 聚焦 meta 的 agent-* 与 task-* 工作流

Status: Completed (2026-08-28 17:20)
Kind: Task

## Target
- [x] T1: PRINCIPLE.md 重构为聚焦 skills/meta 两族工作流:agent-*(hooks/rules/sops 的载体选择、三级来源优先级、持久化边界、宿主中立执行)与 task-*(单结果任务、Target 对齐门、结果契约、理解先于编辑、家族分工、Context/Lessons 分离、fail-closed 完成与独立评审边界);删除定位与宿主无关章节
- [x] T2: 每条原则有主张与理由,内容忠于 Context Packs、契约与任务协议,无占位符
- [x] T3: PRINCIPLE.md 完整介绍 CSL Agent Kit 的整体工作流和设计思想,覆盖从指令注入、会话定向、任务对齐、准备、执行、验证到持续改进的端到端链路,并交代辅助 meta 能力的位置;agent-* 与 task-* 作为核心展开而非唯一内容
- [x] T4: agent-hooks 章节明确说明其核心能力是聚合并统一不同 Agent 的 Hook 能力,提供统一事件/条件/动作模型与更丰富的规则有效状态;说明用户可通过 Skill 用自然语言表达 Hook 意图,并给出多个可执行示例及宿主能力差异
- [x] T5: 对 PRINCIPLE.md 做定点去 AI 写作优化,减少重复否定转折、元叙述、正文粗体和重复总结,同时保留技术事实、表格、代码块、引文与章节结构;复查并报告可复现指标及 AI-ism 风险分

## Scope

- 包含:完整介绍 CSL Agent Kit 的端到端工作流与设计思想;重点展开 agent-* 持久指令层和 task-* 结果工作流,同时说明 Context、Lessons、skill-quality、archive 与共享 core/protocol 的支撑位置。
- 排除:不把多宿主定位或 Skill 宿主无关单列为核心章节;不改其它文件。

## Plan

1. 先给出为什么设计与端到端工作流全景。
2. 重点展开 agent-* 与 task-* 两族的职责、分工和原则,强化 agent-hooks 的统一模型、状态与自然语言示例。
3. 交代辅助 meta 能力与贯穿全局的设计思想。
4. 对 PRINCIPLE.md 做定点去 AI 写作优化,保持技术内容与结构不变。
5. 用同一组机械指标复查,刷新全部证据并完成。

## Result

- T1: 定点优化未改变 agent-* / task-* 核心范围与所有工作流技术内容
- T2: 全文重新通读;技术事实、表格、代码块、引文及 41 个标题保持;占位符 0
- T3: 完整的 9 个主章节与端到端链路保持不变
- T4: agent-hooks 统一模型、丰富状态、6 个自然语言示例和四宿主能力差异均保留
- T5: 两轮定点编辑后:不是X而是Y 0;元叙述框架 0;非表格/代码/列表标签/引文粗体 0;破折号拼接 0;占位符与 chatbot artifacts 0;人工 AI-ism 风险分从 6/10 降至 2/10
- Review gate: Skipped — 用户要求写作优化与复查,未要求对抗式评审或独立 Reviewer 批准

## Verification

- Passed: 全文 re-read + Python 机械复查:429 行/41 标题;not_x_but_y=0;meta_frames=0;em_dash_uses=0;bold_nonreference_prose=0;placeholders=0;chatbot_artifacts=0
