---
name: sop-manager
description: Use when the user wants to list, create, inspect, or follow SOPs, procedures, playbooks, runbooks, workflow rules, or process documents. Also use when the user mentions "SOP", "procedure", "playbook", "runbook", "process doc", or "per our SOP".
---

# SOP Manager

管理 SOP（Standard Operating Procedure）文件。SOP 是可按需加载的 agent 行为规则：当用户任务匹配某个 SOP 的 `when_to_use` 或 `name` 时，先读取完整 SOP，再按流程执行或按规则判断。

## 存储位置

| 类型 | 路径 | 说明 |
|---|---|---|
| 内置 SOP | `skills/sop-manager/sops/*.md` | 随插件发布 |
| 用户 SOP | `~/.csl-agent-kit/sops/*.md` | 用户动态创建，跨项目生效 |

用户 SOP 优先于同名内置 SOP。

## SOP 文件格式

每个 SOP 文件必须以 YAML frontmatter 开头，至少包含：

```yaml
---
name: deploy-production
description: Deploy the production service safely.
when_to_use: Use when deploying the production service or investigating production deploy failures.
---
```

`name` 使用 kebab-case。所有 frontmatter 值必须使用英文。`description` 简短说明 SOP 内容。`when_to_use` 必须说明什么时候应用该 SOP；这是 agent 路由和 summary formatter 的主字段。

可选字段：

```yaml
version: 1.0
update_date: 2026-07-08
do_not_use_when:
  - Use another SOP when uploading releases or publishing remote artifacts.
globs:
  - "**/*.swift"
alwaysApply: false
```

`do_not_use_when` 用于压低误触发；当用户任务同时匹配 `when_to_use` 和 `do_not_use_when` 时，先不要应用该 SOP，除非用户明确指定。

## SOP 类型

| 类型 | 适用场景 | 示例 |
|---|---|---|
| 流程型 SOP | 有明确执行顺序、确认点、异常处理和完成标准的任务。 | `references/process-sop-example.md` |
| 规则型 SOP | 用一组判断规则指导 agent 设计、审查、命名、取舍或判定，不需要强行线性流程。 | `references/rule-sop-example.md` |

流程型 SOP 写“怎么一步步做”。规则型 SOP 写“什么时候查、按什么顺序判断、冲突怎么裁决、最后怎么验收”。

## 命令

### `sop-manager list`

列出可用 SOP：

1. 运行 `skills/sop-manager/scripts/sop-summaries.sh`，或等价读取 `skills/sop-manager/sops/*.md` 与 `~/.csl-agent-kit/sops/*.md`。
2. 只展示 `name`、`when_to_use`、来源路径。
3. 不读取完整 SOP 正文，除非用户要求查看或任务明确匹配。

### `sop-manager create`

创建用户 SOP：

1. 收集 `name`、`description`、`when_to_use`、适用范围、规则或流程、异常处理、参考资料。
2. 如果 `name` 或 `when_to_use` 缺失，先询问用户。
3. 判断 SOP 类型：
   - 如果任务有稳定执行顺序，使用流程型 SOP。
   - 如果任务主要是设计、审查、命名、判断或取舍，使用规则型 SOP。
4. 读取对应示例作为质量样板；不要复制示例里的具体事实。
   - 流程型：`skills/sop-manager/references/process-sop-example.md`
   - 规则型：`skills/sop-manager/references/rule-sop-example.md`
5. 确认新 SOP 具备：
   - 清楚的触发型 `when_to_use`。
   - 必要时写 `do_not_use_when`，防止和相邻 SOP 误匹配。
   - 简短的内容摘要 `description`。
   - 明确的适用和不适用范围。
   - 流程型 SOP 有可执行步骤、确认点、异常处理和完成标准。
   - 规则型 SOP 有使用方式、规则分组、冲突处理和完成标准。
   - destructive、remote、publish、delete、overwrite 等动作前的确认点。
   - 具体异常处理，不只写 “ask user”。
   - 完成标准使用 checkbox checklist。
6. 如果 `~/.csl-agent-kit/sops/` 不存在，先创建它。
7. 写入 `~/.csl-agent-kit/sops/{name}.md`。不要写到内置 SOP 目录，除非用户明确要求修改插件内置 SOP。

### `sop-manager learn`

把可复用的错误模式、容易遗漏的步骤、用户纠正、审查结论直接更新到对应 SOP 正文。不要创建单独的 `Lessons` section。

1. 判断 lesson 属于哪个 SOP：
   - 如果匹配用户 SOP，直接修改 `~/.csl-agent-kit/sops/{name}.md` 的范围、规则、流程、异常处理或完成标准。
   - 如果匹配内置 SOP，不要修改内置文件；创建或更新同名用户 SOP 覆盖文件，并在正文里合并需要调整的规则。
   - 如果没有匹配 SOP，创建新的 `~/.csl-agent-kit/sops/{topic}.md`，并写入 `when_to_use` 说明何时应用。
2. 只更新会跨项目复现的操作错误、流程遗漏、判断规则；不要把一次性偏好写进 SOP。
3. 更新后，相关 SOP 会在下一次 session-start hook 的摘要中出现或继续出现；agent 匹配任务后读取完整 SOP 时会看到最新规则。

### `sop-manager see <name>`

查看一个 SOP：

1. 先查 `~/.csl-agent-kit/sops/{name}.md`，再查 `skills/sop-manager/sops/{name}.md`。
2. 如果找不到精确文件名，按 frontmatter 的 `name` 匹配。
3. 读取并总结完整 SOP。不要改写它，除非用户明确要求。

## 自动应用规则

开始任何流程类或规则判断类工作前：

1. 使用 session-start hook 注入的 SOP summary 判断是否有匹配 SOP。
2. 如果 prompt-time hook 提供候选 SOP，优先检查候选；不要只因为候选出现就跳过匹配判断。
3. 如果匹配，读取完整 SOP 文件。
4. 流程型 SOP 按步骤执行；规则型 SOP 按使用方式和规则分组判断。
5. 最终回复前用 SOP 的完成标准 checklist 自检。
6. 如果流程、规则或冲突处理不清楚，停止并询问用户。

匹配启发：用户任务与 SOP 的 `when_to_use` 或 `name` 对齐时，该 SOP 适用。

## 优先级

SOP 不能覆盖 system、developer、明确用户指令、平台安全策略、仓库规则或工具权限。SOP 只在适用范围内作为流程规则生效。
