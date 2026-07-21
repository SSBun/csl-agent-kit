---
name: conventions
description: 仅在用户明确要求把一条跨会话持续有效的约定/偏好保存、记录、添加到 conventions 时使用；不要因普通偏好陈述、纠正、长期回答风格、SOP、handoff、任务记录或 lessons 请求而触发。
---

# Conventions

管理用户本地始终在场的约定 `~/.csl-agent-kit/conventions.md`。每条约定都是用户明确确认的、跨会话持续有效的指令；该文件经 `references/agents.md` 引用并在 `SessionStart` hook 一次性注入，因此**始终在场**，不需要任何按上下文触发的注入机制。

本 skill 只负责增、删、改条目；运行时注入由 agents.md 引用与 SessionStart hook 承担，不在本 skill 职责内。

## 触发边界

只有用户明确要求"保存到 conventions / 记住这个约定 / add to conventions / save this preference"时才处理写入。用户只是表达偏好、纠正你、说明以后怎么回答、或给出当前任务要求时，不要写入，也不要主动提议写入。

触发边界由 `evals/trigger_cases.json` 与 `evals/semantic_config.json` 覆盖。

## 什么内容适合保存

一条约定必须同时满足：

- 未来多个会话仍然有效；
- 不局限于当前任务或当前仓库；
- 是用户希望始终在场、每次都要遵守的指令；
- 单一、明确且可执行；
- agent 能判断是否适用，用户能判断是否被遵守；
- 不包含密码、token、密钥或其他敏感信息。

以下内容不要写入 conventions，改走对应载体：

- 多步骤或可复用流程：使用 `sop-manager`；
- 当前仓库工程规范或跨任务稳定的通用工程原则：写入 `AGENTS.md`（`references/agents.md`）；
- 当前任务进度：写入 `tasks/todo.md`；
- 对某次错误的经验总结：写入 `tasks/lessons.md`；
- 会话恢复信息：按内容更新 `tasks/todo.md` 或 `tasks/context.md`；
- 临时要求：只作为当前用户指令执行；
- 原因、背景、长篇说明或敏感信息：不要写入。

## 存储位置

```text
~/.csl-agent-kit/conventions.md
```

文件是纯 Markdown，按主题分组，每条约定独立成行，便于 agent 用 `edit` 工具定位增删：

```markdown
# User Conventions

Always-on conventions the agent must conform to across all sessions.

## <Topic>

- <single, actionable directive>.
- <another directive>.
```

不要把约定写进 skill 目录或可分发的 `references/agents.md`；个人化内容（绝对路径、本机工具等）只属于 `~/.csl-agent-kit/conventions.md`。

## 添加约定

1. 判断内容是否符合上列边界（持续、跨会话、始终在场）。
2. 读取现有 `~/.csl-agent-kit/conventions.md`，避免重复或互相冲突的条目。
3. 用户原文已经明确时尽量保留；含糊或包含多个要求时，整理为单一可执行句。
4. 归入合适主题分组；没有合适分组就新建一个简短主题标题。
5. 向用户展示将保存的最终文本与所属分组，等待明确确认。
6. 确认后用 `edit` 工具把条目追加到对应分组；不要重写整个文件，不要自动改写其他条目。

## 删除或修改约定

- 删除：确认用户要删的具体条目后，用 `edit` 精确移除该行；不要连带删除同分组其他条目。
- 修改：先展示现有文本与拟改文本，获用户确认，再用 `edit` 替换该行。
- 不要批量重写、自动截断或覆盖其他条目。

## 不做的事

- 不实现任何关键词匹配、候选注入或 hook 脚本；始终在场由 agents.md 引用与 SessionStart hook 负责。
- 不设条目数量或字符上限（无需为按需注入省 token）；但约定应保持简短、可执行，长篇说明应进对应载体而非 conventions。
- 不创建 JSON / YAML / 数据库；纯 Markdown 便于 agent 直接阅读与编辑。
- 不在 session start、resume、compact 或每轮 prompt 上运行任何注入逻辑。

## 查看

```bash
cat ~/.csl-agent-kit/conventions.md
```
