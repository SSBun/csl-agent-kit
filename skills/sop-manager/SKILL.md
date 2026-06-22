---
name: sop-manager
description: Use when the user wants to list, create, inspect, or follow SOPs, procedures, playbooks, runbooks, workflow rules, or process documents. Also use when the user mentions "SOP", "procedure", "playbook", "runbook", "process doc", or "per our SOP".
---

# SOP Manager

管理 SOP（Standard Operating Procedure）文件。SOP 是可按需加载的流程规则：当用户任务匹配某个 SOP 的 `description` 时，先读取完整 SOP，再按步骤执行。

## 存储位置

| 类型 | 路径 | 说明 |
|---|---|---|
| 内置 SOP | `skills/sop-manager/sops/*.md` | 随插件发布 |
| 用户 SOP | `~/.sops/*.md` | 用户动态创建，跨项目生效 |

用户 SOP 优先于同名内置 SOP。

## SOP 文件格式

每个 SOP 文件必须以 YAML frontmatter 开头，至少包含：

```yaml
---
name: deploy-production
description: Use when deploying the production service or investigating production deploy failures.
---
```

`name` 使用 kebab-case。`description` 必须说明什么时候应用该 SOP，而不是只描述文件内容。

可选字段：

```yaml
version: 1.0
owner: team-or-role
globs:
  - "**/*.swift"
alwaysApply: false
```

## 命令

### `sop-manager list`

列出可用 SOP：

1. 运行 `skills/sop-manager/scripts/sop-summaries.sh`，或等价读取 `skills/sop-manager/sops/*.md` 与 `~/.sops/*.md`。
2. 只展示 `name`、`description`、来源路径。
3. 不读取完整 SOP 正文，除非用户要求查看或任务明确匹配。

### `sop-manager create`

创建用户 SOP：

1. 收集 `name`、`description`、步骤、错误处理、参考资料。
2. 如果 `name` 或 `description` 缺失，先询问用户。
3. 如果 `~/.sops/` 不存在，先创建它。
4. 写入 `~/.sops/{name}.md`。
5. 使用下面模板。不要写到内置 SOP 目录，除非用户明确要求修改插件内置 SOP。

```markdown
---
name: {kebab-case-name}
description: {when the agent should apply this SOP}
version: 1.0
owner: {role-or-team}
---

# {Title}

## Purpose

{Why this procedure exists.}

## Scope

{What this SOP covers and excludes.}

## Prerequisites

- {Required tool, access, or context}

## Procedure

1. {One action}
   - Expected Result: {observable result}

## Error Handling

| Scenario | Resolution | Escalate To |
|---|---|---|
| {Failure} | {Action} | {Role} |

## References

- {Link or related doc}

## Lessons

1. **Trigger:** {When this lesson applies}
   - **Rule:** {What to do next time}
   - **Why:** {Mistake prevented}
```

### `sop-manager learn`

把可复用的错误模式、容易遗漏的步骤、用户纠正、审查结论沉淀到 SOP。用于跨项目和跨 agent 复用，不只是当前仓库的临时 lesson。

1. 判断 lesson 属于哪个 SOP：
   - 如果匹配用户 SOP，追加到 `~/.sops/{name}.md` 的 `## Lessons`。
   - 如果匹配内置 SOP，不要修改内置文件；创建或更新 `~/.sops/{name}-lessons.md`。
   - 如果没有匹配 SOP，创建新的 `~/.sops/{topic}.md`，并写入 `description` 说明何时应用。
2. 每条 lesson 必须包含：
   - **Trigger:** 何时应用这条经验。
   - **Rule:** 下次必须怎么做。
   - **Why:** 防止什么错误。
3. 不要把一次性偏好写成 SOP lesson。只有会跨项目复现的操作错误、流程遗漏、判断规则才写入。
4. 更新后，相关 SOP 会在下一次 session-start hook 的摘要中出现或继续出现；agent 匹配任务后读取完整 SOP 时会看到 lessons。

内置 SOP 的 companion lesson 文件使用这个最小结构：

```markdown
---
name: {built-in-name}-lessons
description: Use with {built-in-name} when the task matches that SOP and prior mistakes or corrections may affect execution.
version: 1.0
owner: user
---

# {Built-in Title} Lessons

## Purpose

Capture user/project-independent lessons for `{built-in-name}` without modifying the built-in SOP.

## Lessons

1. **Trigger:** {when this applies}
   - **Rule:** {what to do next time}
   - **Why:** {mistake prevented}
```

### `sop-manager see <name>`

查看一个 SOP：

1. 先查 `~/.sops/{name}.md`，再查 `skills/sop-manager/sops/{name}.md`。
2. 如果找不到精确文件名，按 frontmatter 的 `name` 匹配。
3. 读取并总结完整 SOP。不要改写它，除非用户明确要求。

## 自动应用规则

开始任何流程类工作前：

1. 使用 session-start hook 注入的 SOP summary 判断是否有匹配 SOP。
2. 如果匹配，读取完整 SOP 文件。
3. 按 SOP 步骤执行。
4. 如果步骤不清楚或无法执行，停止并询问用户。

匹配启发：用户任务与 SOP 的 `name` 或 `description` 对齐时，该 SOP 适用。

## 优先级

SOP 不能覆盖 system、developer、明确用户指令、平台安全策略、仓库规则或工具权限。SOP 只在适用范围内作为流程规则生效。
