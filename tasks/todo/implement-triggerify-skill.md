# Implement the Triggerify skill

Status: Completed (2026-07-22 18:11)

## Target

- [x] T1: 提供可被 Agent 正确触发的 Triggerify 技能，支持创建、列出、查看、更新、启用、禁用和删除 trigger。
- [x] T2: 按 RFC 实现全局与项目规则发现、严格校验、作用域 ID、状态诊断及确定性条件评估。
- [x] T3: 复用现有 `csl-agent-kit` CLI 暴露恢复路径，不依赖 Triggerify 数据面自身运行。
- [x] T4: 提供最小自动检查并完成 skill 与项目规则审计。

## Plan

1. 定位现有 CLI、技能发现、测试与打包边界。
2. 实现 Triggerify 技能资源和最小运行时管理命令。
3. 增加聚焦测试并运行约定的验证与审计。
4. 更新任务结果与稳定工作区上下文。

## Result

- T1: `skills/triggerify/` 提供七个管理操作、Agent metadata、路由 eval 和 RFC 使用约束；Claude manifest、README 与包依赖已同步。
- T2: `triggerify.js` 实现严格 YAML、V1 AST/三值求值、UTF-8 排序、冲突与 trust 状态、安全脚本运行、Codex 十事件 adapter 及稳定诊断；项目运行时在无 trust verdict 时保持 unsupported。
- T3: `csl-agent-kit triggerify` 直接复用同一管理核心；invalid、同 ID 冲突和自锁规则可从外部终端禁用或用 `update --from` 修复，`delete` 保留脚本。
- T4: Node 语法检查通过；Triggerify 14/14 测试通过；Skill quick validator 和 `yao-meta-skill validate` 通过；adversarial-review 第 4 次复审决定 `APPROVED`；[报告](../../reports/adversarial-review/implement-triggerify-skill.md)
