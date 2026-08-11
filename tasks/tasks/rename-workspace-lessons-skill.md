# 将 workspace-capture-lessons 重命名为 workspace-lessons

Status: Completed (2026-08-09 17:42)
Kind: Task

## Scope

- 包含：重命名 skill 目录与 canonical name，同步当前 Agent 规则、宿主发现、接口、文档、测试和 eval 引用。
- 排除：改变 Lessons 数据格式或工作流行为、保留旧名称 alias、修改历史任务和报告。

## Target
- [x] T1: Skill 的目录、frontmatter 名称、接口提示和当前运行时引用统一使用 workspace-lessons，现有检索、写入确认与验证行为保持不变。
- [x] T2: 当前 AGENTS.md、workflow gates、manifest、README、安装/命令发现与测试期望只把 workspace-lessons 作为 canonical 名称；旧名称仅保留在历史、迁移记录或明确的拒绝断言中。
- [x] T3: Skill 发现、命令注册、Lessons CLI、task tests、routing evaluation、OpenAI validation、Yao 和 resource-boundary 检查满足现有门禁。
- [x] T4: canonical task 的聚合测试数量与实际通过结果一致。

## Plan

1. 搜索旧名称的当前生产者、消费者、发现入口和测试，区分运行时引用与历史记录。
2. 原子重命名 skill 目录并同步当前 Agent 规则、manifest、README、接口、测试与 eval。
3. 搜索残留旧名称并运行发现、命令、CLI、task、routing 与 skill-package 验证。
4. 更新 workspace context 的 canonical component 路径并完成任务门禁。
5. 复核 canonical task 中的聚合测试数量。

## Result

- T1: Skill 已移动到 skills/workspace-workflow/workspace-lessons，frontmatter、interface/openai prompts 使用 workspace-lessons；旧目录不存在，Lessons self-test 与当前 63 条 legacy records 校验通过。
- T2: super-agent/AGENTS.md、workspace workflow gates、四个全局 Agent 规则 symlink、Claude manifest、README、Pi 命令与 task tests 均使用 workspace-lessons；旧名只剩历史、迁移记录和明确拒绝断言。
- T3: test:tasks 通过 23/23，Pi skill command 通过 1/1，test:cli 通过 26/26，routing 通过 13/13 且 precision/recall 为 1.0，quick_validate 通过，Yao 仅剩允许的 2149/1000 initial-load token 超限。
- T4: 已复核 23 项 task tests、1 项 Pi command test 与 26 项 CLI tests，共 50 项相关 Node tests。
- Review gate: Skipped — 用户未明确要求 adversarial review、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: 目录/frontmatter/manifest/AGENTS/README/发现残留检查、Lessons CLI、50 项相关 Node tests、13 项 routing cases、JSON、OpenAI quick validation、Yao 非预算门禁、resource boundary 与 git diff --check 均满足；check_codex_agents_contract.py 的既有 HEAD 基线失败与本次 rename 无关。
