---
schema: csl-memory/v1
id: legacy-context-d3613f68e48dfcd44c44
revision: 1
type: fact
title: 安装目标与工作流分发
summary: 修改安装器或诊断宿主集成时使用；区分默认、保存和显式选择，安装动作不能冒充宿主注入成功。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-install — Installer target selection and workflow
    delivery:1
updated: 2026-11-02T03:43:08.896Z
deleted: false
---

## CTX-install — Installer target selection and workflow delivery
- Scope: `csl-agent-kit install` 的默认、已保存与显式 integration target 选择，以及内置 Agent Hooks 行为契约的独立注入边界。
- Paths: `bin/csl-agent-kit.js`, `README.md`, `skills/meta/agent-hooks/`, `tests/cli-install-output.test.js`
- Keywords: install, default targets, saved selection, Codex plugin, Pi package, Agent Hooks, Cursor
- Authority: `bin/csl-agent-kit.js`, `skills/meta/agent-hooks/scripts/lib/runtime.js`, `skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js`, `tests/cli-install-output.test.js`
- Recheck: 当 install target 集合、`default` 标记、selection persistence 或 Agent Hooks host capabilities 变化时复核。

### Purpose and Boundaries
- 新安装或无有效已保存选择时，默认 checklist 与 `--yes` 只选择 `codex-plugin`；已保存 checklist 选择代表用户先前确认，显式 `--target` 与 `--all` 继续按用户选择执行。
- Installer 只暴露 `cursor`、`codex-plugin` 与 `pi` integration targets；不再安装或替换全局 Agent instruction 文件，旧 `super-agent` target 与 `--no-super-agent` option 被拒绝。

### Relationships
- Codex、Claude Code 与 Pi 通过默认启用的 `inner:csl-agent-kit-contract` 获得自包含行为契约，不依赖替换用户默认指令文件；Cursor 在宿主支持 injected context 前保持 unsupported，且不提供文件替换回退。

### Decision and Verification Boundaries
- 交互 multiselect 的提交已构成安装授权，不再追加通用确认；默认和已保存选择由 `buildInstallChoices()` 与 selection helpers 约束，旧安装入口以负向拒绝断言验证，宿主注入能力以 `agent-hooks show inner:csl-agent-kit-contract --host <host>` 验证。
