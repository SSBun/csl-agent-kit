---
title: triggerify inner scope + simple-rules 内置 hook
status: Completed
created: 2026-07-26
updated: 2026-07-26
---

# triggerify inner scope + simple-rules 内置 hook

## Goal

给 triggerify 增加 `inner` scope（只读，承载随 skill 自带的内置 hook），并用它实现一个 session-start hook：读取 `~/.csl-agent-kit/simple-rules.md`，非空则注入 session 上下文。同时新建 `simple-rules` skill 帮用户维护该文件。

## Background

- 现有 scope 只有 global（`~/.csl-agent-kit/triggerify`）和 project（`<ws>/.csl-agent-kit/triggerify`）。
- `runEvent` 硬编码 `discover("global", ...)`；run-script 的 stdout 被丢弃。
- inner scope 要让 triggerify 能 discover 内置 hook；注入需要 run-script 支持 `inject-output: true` 把 stdout 作为 prompt 返回。

## Scope

- triggerify: 新增 `inner` scope（hooks 位于 `skills/triggerify/hooks/`，只读）。
- triggerify: run-script 新增 `inject-output` 字段；为 true 且脚本成功且 stdout 非空时把 stdout 作为 prompt 返回。
- triggerify: `runEvent` 在 session-start（及所有 inject-capable event）同时 discover global + inner。
- inner hook: `skills/triggerify/hooks/simple-rules.md` + `scripts/read-simple-rules.js`。
- 新 skill: `skills/simple-rules/`（SKILL.md 教 agent 维护 simple-rules.md）。

## Tasks

- [x] T1 triggerify `rule.js`：FIELDS 加 `inject-output`；校验仅 run-script 允许、必须 boolean。
- [x] T2 triggerify `store.js`：`scopeRoot` 加 inner 分支（triggerify 包内 `hooks/`）；`resolveEntry`/ID 识别 inner；inner 仅只读。
- [x] T3 triggerify `runtime.js`：`runEvent` 合并 discover global + inner；run-script `inject-output` 把 stdout 作为 prompt。
- [x] T4 triggerify `cli.js`：scope 校验和 ID 正则加 inner；inner 禁止 create/update/delete。
- [x] T5 inner hook 文件 + 脚本（read-simple-rules.js）。
- [x] T6 新 skill `skills/simple-rules/SKILL.md`。
- [x] T7 测试：inject-output + inner scope；跑现有 triggerify 测试不回归。
- [x] T8 验证：构造非空 simple-rules.md，确认 session-start 注入生效。

## Result

- T1–T5：triggerify 核心改动落地。`inject-output: true` 让 run-script stdout 作为 prompt 返回（仅 inject-capable event）；`inner` scope 从 triggerify 包内 `hooks/` discover，只读，`runEvent` 合并 global + inner。
- T6：`skills/simple-rules/` 含 SKILL.md + agents/interface.yaml；yao-meta-skill validate + resource_boundary_check 通过。
- T7：triggerify 测试 25/25 通过（新增 5 个测试覆盖 inject-output 注入/不注入、校验、inner scope 非空注入、CLI 只读保护）。
- T8：端到端验证——CSL_AGENT_KIT_HOME 指向含 simple-rules.md 的目录，runEvent 返回 inner:simple-rules prompt，内容为 `## Simple Rules` + 文件正文；空文件返回 0 prompts 无诊断。

## 预存问题（非本次引入，未修复）

- `.claude-plugin/plugin.json` 缺 `zhihu-circle`（本会话前已存在，与 simple-rules 无关）。
- triggerify resource_boundary_check 超 token 预算（1251 > 1000，本会话前已超）。
- `README.md` 有未解决合并冲突（UU），非本任务引入。
- 工作区有预存暂存项（zhihu-circle、deploy.sh、.DS_Store 等），非本任务引入。

Review gate: Skipped — triggerify 测试套件已覆盖核心逻辑；功能链路经端到端验证。

## Non-Goals

- 不改 csl-context-hooks.ts（runEvent 返回的 prompts 已被拼进 systemPrompt）。
- 不支持用户层编辑 inner hook 内容（只读 + enable/disable）。
