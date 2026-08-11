# 让 deliberate 保存最终结果

Status: Completed (2026-08-07 19:43)

## Target

- [x] T1: `deliberate` 每次交付时把面向用户的最终结果保存到当前工作区的 `tasks/thinking/`。
- [x] T2: 保存行为不泄露内部角色推理、讨论记录或 ledger，并避免覆盖已有结果。
- [x] T3: 工作流用例和 skill 校验覆盖新的保存契约，现有路由与 deliberation 行为保持通过。

## Plan

1. 定义最终结果的保存时机、内容边界和冲突安全命名。
2. 更新 `deliberate` 主契约与工作流用例。
3. 运行定向契约检查、trigger eval、Yao 审计和 skill 资源边界检查。

## Result

- T1: `skills/deliberate/SKILL.md` 要求在 `SUFFICIENT`、阻塞或用户停止时，先把面向用户的交付内容写入当前工作区 `tasks/thinking/YYYY-MM-DD-<topic-slug>.md`，再在会话中返回完整结果和文件路径。
- T2: 同一日期与主题冲突时使用 `-2`、`-3` 递增后缀，明确禁止覆盖旧结果，也禁止保存角色交换、私有推理、state packet 和 D-ID/T-ID ledger。
- T3: 新增 `persist_final_result` workflow case；定向契约断言、JSON 解析、`test:tasks` 14/14、trigger eval 31/31（precision/recall 1.0）通过。Yao syntax、lint、governance 通过；资源边界仅保留项目允许的初始加载预算超限（1824/1000）。
- Review gate: Skipped — no explicit user request.
