---
schema: csl-memory/v1
id: legacy-context-1617a7ae8f376d8041a9
revision: 1
type: fact
title: 补充组件边界与本机参考仓
summary: 查找 Agent Hooks 验证器、Pi 文件变更事件或第三方 skills 参考仓时使用；本机路径使用前复核。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Components:1
updated: 2026-11-02T03:43:09.094Z
deleted: false
---

## Components

- Agent Hooks 的分发 `SKILL.md` 使用英文，以 bundled CLI 作为 accepted-behavior authority，不把项目 RFC 当作 runtime guidance。
- `pi/extensions/csl-context-hooks.ts` 是 Agent Hooks 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- `skills/meta/agent-hooks/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 Hook Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `agent-hooks show` 为准。权威入口是该脚本与 `skills/meta/agent-hooks/SKILL.md`。

- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。
