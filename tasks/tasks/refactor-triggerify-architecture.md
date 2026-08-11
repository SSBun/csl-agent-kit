# 重构 Triggerify 并增加规则校验脚本

**Status:** Completed (2026-07-24 16:55)

## Scope

- Included: 保持 Triggerify V1 现有行为与公共导出兼容的模块化重构，以及可直接验证一个或多个 trigger Markdown 文件的脚本。
- Excluded: Pi `after-tool` 支持及现有 trigger 规则迁移；它们在结构重构稳定后单独实施。

## Target

- [x] T1: Triggerify 按规则语义、存储、运行时、CLI 与原生 hook 适配职责分离，现有 CLI、dispatcher 和公共模块调用保持兼容。
- [x] T2: 校验脚本复用 Triggerify V1 规则解析逻辑，对一个或多个 `.md` 文件检查 frontmatter 与规则语义，并以清楚诊断和退出码表示结果。
- [x] T3: 现有 Triggerify 与 Pi context hook 测试无回归，新增校验脚本的有效、无效和多文件行为测试通过。

## Plan

1. 固定现有公共入口和运行行为，以业务职责边界提取内部模块。
2. 在共享规则解析边界上实现独立校验脚本及最小使用说明。
3. 运行聚焦测试、完整相关检查和 skill 审计，记录结果并更新稳定工作区上下文。

## Result

- T1: `triggerify.js` 已缩为 38 行稳定 facade，内部职责拆到 `rule.js`、`store.js`、`runtime.js`、`cli.js` 与 `native-hook.js`；原有公共导出保持不变，并新增宿主无关的 `createEvent()`。原有十类 Codex payload、dispatcher、CLI 和 Pi session prompt 契约测试全部通过。
- T2: 新增 `scripts/validate-rules.js`，支持 `--scope global|project` 和多个 `.md` 文件，直接复用 V1 parser；有效文件返回 0，规则无效返回 1，调用错误返回 2。真实 CLI 校验当前全局 trigger 文件通过。
- T3: `npm run check` 全部通过，包括 CLI 26 项、Triggerify 20 项、task contract 11 项、Pi 4 项与安装 dry-run；Skill Creator quick validation 通过。Yao 的 structure、lint、governance 和非预算 resource checks 通过，仅保留允许的 1063/1000 initial-load token 告警；`git diff --check` 通过。
- Review gate: Skipped — 虽涉及多个内部模块，但公共 facade、完整相关测试、实际 CLI 校验与安装 dry-run 为核心结果提供了确定性验证，不存在 Verification Gap，且未触及发布、安全或不可逆操作。
