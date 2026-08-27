# 将 Super Agent 工作区记录规则拆分为三个 Skills

- 状态：已完成（2026-07-21）

## Scope

- 对象：`super-agent` 默认规则中的 Context、Task、Lessons 工作流。
- 包含：在 `skills/workspace-workflow/` 下新增三个动作导向 skills。
- 包含：将默认 `AGENTS.md` 的详细规则替换为 skill 路由。
- 包含：更新必要的分发说明、发现验证和触发验证。
- 排除：修改 Engineering Thinking、Simplicity、Surgical Changes 或 Verification 规则。
- 排除：迁移现有 `tasks/context.md`、`tasks/todo/` 或 `tasks/lessons.md` 内容。

## Target

- `workspace-maintain-context` 独立管理 `tasks/context.md`。
- `workspace-manage-task` 独立管理任务索引、任务契约、状态和 review 交接。
- `workspace-capture-lessons` 独立管理可复用的用户纠正规则。
- `super-agent` 仅保留三个 workflow skill 的强制路由。
- 三个 skills 可被现有递归发现与安装流程识别。
- 现有无关规则和用户工作区改动保持不变。

## Plan

1. 确认 skill 发现、分发和文档基线。
2. 初始化并收敛三个 leaf skill 的触发与职责。
3. 将 `super-agent` 默认规则替换为最小路由。
4. 添加触发边界与发现回归检查。
5. 运行 skill、安装、规则和仓库验证。
6. 提交最终差异至 adversarial review。

## Checklist

- [x] 三个 skill 目录和 frontmatter 名称符合已确认命名。
- [x] 每个 skill 只包含 `SKILL.md` 和 `agents/openai.yaml`。
- [x] Context、Task、Lessons 的写入职责互不重叠。
- [x] Task skill 使用 `Scope`、`Target`、`Plan`、`Checklist` 列表契约。
- [x] `super-agent` 默认规则不再重复三个 skill 的详细正文。
- [x] 正向、负向和相邻触发用例通过。
- [x] 递归发现、安装 dry-run 和相关测试通过。
- [x] `skill-quality` 规则审计通过。

## Result

- 交付：新增 `workspace-maintain-context`、`workspace-manage-task`、`workspace-capture-lessons` 三个 leaf skills。
- 交付：`super-agent` 默认规则从 Context、Task、Lessons 详细正文收缩为三条强制路由。
- 交付：Claude 显式导出三个 leaf 路径；Codex、Cursor、Pi 保持递归发现。
- 验证：三个 `quick_validate.py` 检查通过。
- 验证：三组 trigger eval 共 37 个正向、负向和相邻用例全部通过。
- 验证：CLI 25 项、Tips 18 项、Pi 10 项和工作流定向 2 项测试通过。
- 验证：安装 dry-run、README 32 项计数、全局 AGENTS symlink 和 `git diff --check` 通过。
- 限制：完整任务图检查被既有 `simplify-adversarial-review-report.md` 报告缺少反向 Task 链接阻塞；本任务未修改该其他任务。
- 限制：当时的 package validator 额外要求 `agents/interface.yaml`，与已确认的官方 `agents/openai.yaml` 最小结构不一致；已改用 skill-creator 校验和 trigger eval。
