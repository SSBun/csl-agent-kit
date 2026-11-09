# 添加工作区上下文沉淀机制

## 计划

- [x] 在默认 `AGENTS.md` 模板中加入 `tasks/context.md` 的读取、自动沉淀和当前事实维护规则。
- [x] 创建默认的零字节 `tasks/context.md`。
- [x] 验证规则内容、空文件状态、`~/.agents/AGENTS.md` 软链接生效情况，并运行 local quality gate 规则审计。

## 复核

- 默认规则现在以会话启动目录为 workspace root，在 session start、resume 和 compact 后读取 `tasks/context.md`，并于当前 turn 结束前自动沉淀对话中确认的稳定事实。
- 上下文文件采用可更新的当前事实快照，限定工作区结构、组件关系、领域术语和工作区级决策；明确排除推测、秘密、任务进度、lessons 和对话历史。
- 创建了零字节 `tasks/context.md`；首次实际写入时才添加标题和所需分区。
- 增加常规 context 维护无需创建 todo 计划的例外，避免规则之间互相递归。
- 验证 `~/.agents/AGENTS.md` 仍准确解析到默认模板，九个规则章节连续，`git diff --check` 通过，npm dry-run 包含更新后的默认模板。
- 已运行 local quality gate 审计：lint、governance 和 resource boundary 通过；聚合验证仅因当前工作区已删除的 `skills/super-agent/agents/openai.yaml` 报告已知的 `Missing agents/interface.yaml`。
