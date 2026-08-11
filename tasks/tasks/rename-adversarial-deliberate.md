# 将 adversarial-deliberate 重命名为 deliberate

Status: Completed (2026-08-07 11:43)

## Target

- [x] T1: 技能以 `deliberate` 作为唯一当前名称、目录与发现命令，现有审议行为保持不变。
- [x] T2: 当前文档、清单、接口、评估与共享引用均使用新名称；旧名称只保留在历史任务、审查记录或重命名记录中。
- [x] T3: 技能路由评估与 Yao 校验通过；资源边界检查除允许的初始加载 token 预算超限外无失败。

## Plan

1. 重命名技能包并同步所有当前发现与调用引用。
2. 更新当前文档、评估配置和跨技能调度说明，保留历史记录不动。
3. 运行定向搜索、评估和技能包校验，并向用户说明职责与工作流。

## Result

- T1: `skills/deliberate/SKILL.md`、Claude 清单与 README 均暴露 `deliberate`；旧目录不存在，技能工作流正文未改变。
- T2: 当前引用搜索通过，旧名称仅剩 CHANGELOG 重命名/历史条目和历史任务、审查记录；CLI dry-run JSON 有效。`test:cli` 26 项与 `test:tasks` 14 项通过。完整测试曾通过一次，后续复跑的 Triggerify 套件在不同用例上触发 2 秒执行预算；三个失败用例分别单独复跑均通过，且本任务未修改 Triggerify 实现。
- T3: trigger eval 31/31 通过，precision/recall 均为 1.0；Yao 的 syntax、lint 与 governance 检查通过。`resource_boundary_check.py` 唯一失败为允许的初始加载预算 `1641 > 1000`。
- Residual risk: Triggerify 的 2 秒预算用例在当前高延迟环境下存在既有波动，不属于本次技能重命名范围。
- Review gate: Skipped — no explicit user request.
