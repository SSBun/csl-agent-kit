---
name: tips
description: 仅在用户明确要求把一条短提示、短命令或偏好保存、记录、添加到 tips 文件时使用；不要因普通偏好陈述、纠正、长期回答风格、SOP、handoff、任务记录或 lessons 请求而触发。
---

# Tips

管理用户本地 tips。每条 tip 都是用户明确确认的、跨会话持续有效的短指令；保存后在适用时必须遵守，而不是可选建议。

## 触发边界

只有用户明确要求“保存到 tips / 记录 tip / add to tips / save this preference”时才处理写入。用户只是表达偏好、纠正你、说明以后怎么回答、或给出当前任务要求时，不要写 tips，也不要主动提议写 tips。

触发边界由 `evals/trigger_cases.json` 和 `evals/semantic_config.json` 覆盖。

## 什么内容适合保存

一条 tip 必须同时满足：

- 未来多个会话仍然有效；
- 不局限于当前任务或当前仓库；
- 只要求一个行为；
- 是单行、单句、明确且可执行的命令；
- agent 能判断何时适用，用户能判断是否遵守；
- 不包含密码、token、密钥或其他敏感信息。

推荐句式：`<动作> + <对象> + [适用条件]`。

以下内容不要写入 tips：

- 多步骤或可复用流程：使用 `sop-manager`；
- 当前仓库工程规范：写入 `AGENTS.md` 或对应项目规则；
- 当前任务进度：写入 `tasks/todo.md`；
- 对某次错误的经验总结：写入 `tasks/lessons.md`；
- 会话恢复信息：使用 handoff；
- 临时要求：只作为当前用户指令执行；
- 原因、背景、长篇说明或敏感信息：不要写入 tip。

## 存储位置

用户数据固定写入：

```text
~/.csl-agent-kit/tips/tips.md
```

不要把用户 tips 写入 skill 目录。skill 目录只放工具实现。

## 添加 tip

1. 判断内容是否符合 tip 边界。
2. 检查已有 tips，避免重复或互相冲突的持续指令。
3. 用户原文已经明确时尽量保留；含糊、冗长或包含多个要求时，可以整理为单一命令句。
4. 向用户展示将保存的完整最终文本，并等待明确确认。
5. 只有确认后才能运行：

```bash
skills/tips/scripts/tips-add.sh --confirmed "Show the absolute path of every generated file."
```

写入约束：

- 永远不要自动添加 tips；
- 只保存用户确认后的最终文本，不能在确认后再次改写；
- 每条最多 120 个字符；
- 最多保存 20 条 tips；
- 所有 tip 正文合计最多 2,000 个字符；
- 禁止多行和完全重复的 tip；
- 达到任何上限时拒绝写入，要求用户删除或合并旧 tip；
- 不要自动删除、覆盖、截断或忽略已有 tip。

脚本负责机械校验；skill 必须在确认前完成持久性、单一行为、清晰度、敏感信息和路由边界的语义校验。

## 执行语义

注入后的 tips 是用户已确认的持续指令：

- 回复或使用工具前检查每条适用的 tip；
- 每条适用的 tip 都必须遵守；
- 不得因为它被称为 tip 或措辞像偏好而忽略；
- system、developer 和当前轮用户明确指令发生冲突时具有更高优先级；
- 每次 agent turn、session start、resume 和 compact 后都应重新注入完整 tips，不能依赖长对话中的模型记忆。

## 查看 tips

运行：

```bash
skills/tips/scripts/tips-inject.sh
```

这个脚本也是 hook 使用的注入入口，输出会把 tips 标记为已确认且适用时必须遵守的持续用户指令。

## 诊断 tips

运行：

```bash
skills/tips/scripts/tips-doctor.sh
```

它检查文件、单条/数量/总量限制、重复或异常内容、注入脚本、hook 生命周期覆盖和当前注入预览。诊断只报告问题，不静默修改用户数据。

## 手动整理

打开：

```bash
${EDITOR:-vi} ~/.csl-agent-kit/tips/tips.md
```
