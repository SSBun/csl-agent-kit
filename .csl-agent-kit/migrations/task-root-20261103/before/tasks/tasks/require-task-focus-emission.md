# 任务工作流要求真实发出 task_focus 调用

Status: Completed (2026-08-27 16:34)
Kind: Task

## Target
- [x] T1: task/task-plan/task-queue 三个 SKILL.md 与 super-agent/AGENTS.md 的 focus 指示从可选措辞升级为必须真实发出调用，且原子化到同一回复批次
- [x] T2: 行为契约文件保持不含 task_focus（测试约束），csl-tasks validate 通过

## Result

- T1: rg 确认 task/task-plan/task-queue SKILL.md 与 super-agent/AGENTS.md 四处均含 emit/actually emitted 硬化措辞，task SKILL.md 新增步骤4原子批次+失败披露，Completion 新增绑定确认门禁并已重排序号
- T2: workspace-workflow-gates.md 与 alignment protocol grep -c task_focus 均为0（测试约束安全）；csl-tasks validate/check 通过；skill-quality gate 0 failed（1条既有 context-budget 警告）；按用户规则未运行测试套件
- Review gate: Skipped — 用户未要求独立评审工作流

## Verification

- Passed: 静态检查：rg 措辞就位、contract/protocol grep -c task_focus=0、validate/check JSON valid:true、skill-quality 门禁 0 failed
