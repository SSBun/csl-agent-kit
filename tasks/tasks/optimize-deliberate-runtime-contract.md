# 优化 deliberate 的模型披露、fallback 语义与量化证据

Status: Completed (2026-08-07 12:42)

## Target

- [x] T1: 分发元数据使用 `pi-agent` 的 effective model；无法解析时显示 `unknown`，不再仅凭 `PI_MODEL` 推断。
- [x] T2: `deliberate` 明确区分“无 Challenger 不能运行”和“INLINE-FALLBACK 可在模拟隔离 caveat 下达到 `SUFFICIENT`”。
- [x] T3: Synthesizer 的量化结论必须附可复现的命令、工具结果或测量方法。
- [x] T4: 相关工作流用例、技能校验和项目测试证明上述契约保持一致。

## Plan

1. 更新共享分发说明与 deliberate 主契约、角色契约。
2. 补充最小工作流回归用例和当前文档说明。
3. 运行定向搜索、JSON/项目测试、Yao 与资源边界校验。

## Result

- T1: 共享 dispatch reference 在角色映射、Pi 执行与 Disclosure 三处统一要求先通过 `subagent get pi-agent` 查询 effective model，解析失败显示 `unknown`；实测当前 carrier 返回 `glm/glm-5.2`。
- T2: `deliberate/SKILL.md` 明确无 Challenger 时停止，INLINE-FALLBACK 仅能在披露 `ISOLATION: simulated` 时返回 `SUFFICIENT`；新增 inline-fallback、no-Challenger 两个工作流用例。
- T3: Synthesizer 角色契约要求所有量化结论附可复现命令、工具结果或测量方法，并新增对应工作流用例。
- T4: workflow JSON、定向契约断言、`git diff --check`、任务索引检查和 trigger eval 31/31（precision/recall 1.0）通过；`test:tasks` 14/14 通过。`deliberate` 与 `adversarial-review` 的 Yao syntax、lint、governance 均通过；资源边界仅保留允许的初始加载预算超限（1677/1000、1337/1000）。为满足 adversarial-review 的 Yao 结构校验，补充了最小 `agents/interface.yaml`。
- Residual risk: `test:cli` 25/26 通过；唯一失败由并发中的 `deep-explore` 任务已创建叶子 skill、尚未同步 Claude plugin manifest 导致，不属于本任务改动。
- Review gate: Skipped — no explicit user request.
