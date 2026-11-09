---
schema: csl-memory/v2
id: legacy-context-d3613f68e48dfcd44c44
revision: 5
type: reference
title: CLI 安装选择、确认与输出
summary: --yes取默认codex-plugin，交互复用保存选择，显式目标优先；同次提交不重复确认，独立门禁保留，人类输出默认有色。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:CTX-install
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    sections:2026-07-23 Avoid Redundant Confirmation After Explicit
    Selection;2026-07-10 CLI Colors Default On
  - bin/csl-agent-kit.js#resolveInstallTargets; buildInstallChoices; createColors
  - tests/cli-install-output.test.js
updated: 2026-11-07T11:23:14.735Z
deleted: false
retrieval:
  aliases:
    - csl-agent-kit install
    - codex-plugin
    - NO_COLOR
    - CLI颜色
    - 安装重复确认
  situations:
    - 修改安装默认目标或保存选择
    - 移除安装重复确认
    - 诊断安装与宿主注入差异
    - 调整CLI人类输出
  topics:
    - CLI/安装与分发
    - CLI/输出
  links: []
---

安装入口 `bin/csl-agent-kit.js`：`--all` / `--target` 按显式选择；`--yes` 取默认 codex-plugin，不读取保存选择。交互 checklist 复用有效保存选择，无有效保存选择时默认 codex-plugin。targets 为 cursor、codex-plugin、pi；不安装或替换全局指令文件，拒绝 super-agent 及 --no-super-agent。

同次 multiselect 选择并提交即授权同一安装范围，不追加通用确认；实质风险或不可逆后果变化、Task Target 接受及独立安全门仍适用。移除 prompt 时同步移除响应读取与 guard，防止接受路径失效。选择逻辑查 resolveInstallTargets、buildInstallChoices 及 selection helpers。

Codex、Claude Code、Pi 通过默认 inner:csl-agent-kit-contract 注入自包含契约；Cursor 在支持 injected context 前 unsupported，无文件替换回退。`agent-hooks show inner:csl-agent-kit-contract --host <host>` 核对能力；安装成功不证明实际注入。选择回归及旧入口拒绝见 tests/cli-install-output.test.js。

本项目人类可读 CLI 默认 ANSI 颜色，包括非 TTY；禁用入口为 --no-color、NO_COLOR 或机器 JSON，不按终端检测默认去色。
