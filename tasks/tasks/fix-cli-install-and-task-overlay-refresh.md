# 修复 CLI 安装启动与任务状态刷新

Status: Completed (2026-07-26 18:14)

## Scope

- Included: 移除已中止 benchmark 功能留下的失效 CLI 依赖，清理其不存在 canonical task 的索引条目；让 Pi 任务面板在任务相关工具完成后重新读取索引和 Target 进度。
- Excluded: 恢复 `csl-agent-kit benchmark` 命令；重设计任务状态格式；修改或安装全局 Pi 包。

## Target

- [x] T1 `csl-agent-kit install --yes --dry-run --json` 能启动并输出有效的成功 JSON，不再依赖缺失的 benchmark 模块。
- [x] T2 Pi 任务面板在写入、编辑或 bash 工具完成后显示最新任务索引与 Target 进度，并按当前 session cwd 清除进度缓存。
- [x] T3 受影响的 CLI 与 Pi 回归测试通过，且不改变其他任务记录。

## Plan

1. 移除主分支中指向未合入 benchmark 脚本的 CLI wiring。
2. 简化任务面板的刷新边界，并为索引与 Target 进度增加最小回归测试。
3. 运行原始失败命令、聚焦测试和完整相关测试。

## Result

- T1 ✓ `node bin/csl-agent-kit.js install --yes --dry-run --json` 输出 `ok: true` 的有效 JSON；删除了主分支对未合入 `scripts/benchmark-cli.js` 的依赖，并清理了不存在 canonical task 的已中止 benchmark 索引条目；benchmark 功能仍按已中止范围不恢复。
- T2 ✓ `tests/pi-task-overlay.test.mjs` 验证任务索引状态与 Target 进度在 bash 工具完成（包括失败结果）后刷新，并验证缓存按 `ctx.cwd` 清除。
- T3 ✓ `npm run test:cli` 26/26 通过；聚焦 Pi 回归测试 1/1 通过；`node --check bin/csl-agent-kit.js`、`node --experimental-strip-types pi/extensions/csl-task-overlay.ts --check` 与 `git diff --check` 通过。完整 `npm test` 仍被既有 `tasks/todo/csl-task-overlay-extension.md` 缺少 `Status` 字段阻塞，未修改该无关历史记录。

Review gate: Skipped — 用户未要求独立审查；受影响结果均有确定性命令和回归测试覆盖，未留下核心验证缺口。
