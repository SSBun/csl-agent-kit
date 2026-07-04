---
name: tips
description: 仅在用户明确要求把一条短提示、短命令或偏好保存、记录、添加到 tips 文件时使用；不要因普通偏好陈述、纠正、长期回答风格、SOP、handoff、任务记录或 lessons 请求而触发。
---

# Tips

管理用户本地 tips。tips 是短句偏好或短命令，不是 SOP、Claude Code rule、项目规范或长流程文档。

## 触发边界

只有用户明确要求“保存到 tips / 记录 tip / add to tips / save this preference”时才处理写入。用户只是表达偏好、纠正你、说明以后怎么回答、或给出当前任务要求时，不要写 tips，也不要主动提议写 tips。

触发边界由 `evals/trigger_cases.json` 和 `evals/semantic_config.json` 覆盖。

## 存储位置

用户数据固定写入：

```text
~/.ssbun-skills/tips/tips.md
```

不要把用户 tips 写入 skill 目录。skill 目录只放工具实现。

## 命令

### 添加 tip

运行：

```bash
skills/tips/scripts/tips-add.sh --confirmed "Always use Typora to open generated Markdown files."
```

使用方式：

- 永远不要自动添加 tips。
- 普通偏好陈述或用户纠正不等于写入请求。
- 写入前必须先向用户展示将保存的完整 tip，并等待用户明确确认。
- 只有用户确认后，才能运行带 `--confirmed` 的写入命令。
- 只保存一句短 tip。
- 单条 tip 最多 240 个字符；更长的内容不要写入 tips。
- 保留用户原文，不扩写成规范文档。
- 如果内容是多步骤流程、发布步骤或容易复用的操作流程，改用 `sop-manager`。
- 如果内容是当前仓库临时任务记录，写入 `tasks/todo.md` 或 `tasks/lessons.md`，不要写 tips。

### 查看 tips

读取：

```bash
skills/tips/scripts/tips-inject.sh
```

这个脚本也是 hook 使用的注入入口。

### 手动整理

打开：

```bash
${EDITOR:-vi} ~/.ssbun-skills/tips/tips.md
```
