# Design the Triggerify event automation RFC

Status: Completed (2026-07-22 17:07)

## Target

- [x] T1: 固定 Triggerify 的目标、非目标、宿主优先级和十个标准事件。
- [x] T2: 固定全局/项目目录、local/shared 生命周期、workspace trust 和规则身份语义。
- [x] T3: 固定动作、标准 payload、条件 AST、三值逻辑、脚本执行和错误协议。
- [x] T4: 固定 Skill/CLI 管理操作、安全恢复路径、实施阶段和验收标准。
- [x] T5: 通过 Synthesizer-Challenger 对抗讨论消除阻塞性设计矛盾。

## Plan

1. 汇总对话中已经确认的 Triggerify 决策。
2. 由 Synthesizer 形成完整 RFC 草案。
3. 由 Challenger 审查宿主语义、trust、条件、脚本和管理风险。
4. 吸收修正并将最终 RFC 写入仓库。

## Scope

- 本任务只生成设计 RFC 和任务记录。
- 不实现 Triggerify Skill、共享核心、CLI 或宿主适配器。
- 不修改现有 Agent 规则、Skill、SOP 或 Hook。

## Result

- T1: `docs/rfcs/triggerify.md` 第 1 至 6 节记录产品边界、目标和标准事件，并以 capability matrix 取代事件同名即等价的假设。
- T2: RFC 第 7 至 8 节记录目录、qualified ID、local/shared 冲突和 fail-closed workspace trust gate。
- T3: RFC 第 9 至 18 节记录一文件一动作、Prompt 一次性语义、direct executable、payload、严格 YAML、V1 条件 AST 和三值逻辑。
- T4: RFC 第 19 至 24 节记录七个管理操作、独立恢复 CLI、错误状态、实施阶段和可测试验收标准。
- T5: Challenger 首轮结论为 `NEEDS REVISION`；修订吸收 trust、capability、`changed_files`、路径逃逸、自锁和删除安全问题后，Synthesizer 最终裁决为 `SUFFICIENT`。
- Verification: 本任务为设计文档交付，不涉及运行时代码或行为测试；验收证据是逐 Target 映射的 RFC 章节和实际完成的对抗讨论。
