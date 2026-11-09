# 复审全部本地更改

## 计划

- [x] 重新梳理全部 tracked 与 untracked 改动及其业务目标。
- [x] 复查跨客户端 hook、tips/SOP 数据边界、Pi 生命周期、打包表面和规则变更。
- [x] 运行聚焦与全量验证，按严重级别记录仍可复现的问题。

## 复核

- 仍发现 4 个问题：Pi 忽略自定义 tips 文件路径、CHANGELOG 把未发布功能写入已发布版本、字符限制受 locale 影响，以及新增质量门禁无法在声明支持的 Node 18/20 上运行。
- 已复现 Pi 与 shell 注入分别读取 default/custom tips；`LC_ALL=C` 下 120 个中文字符被误算为 360；Node 18 的 tips 测试和 Node 18/20 的 Pi 测试命令均失败。
- npm registry 的 `2.0.0` 发布于 2026-07-10，已发布 tarball 不含 `csl-context-hooks.ts`，而本地 CHANGELOG 将该功能列入 `2.0.0`。
- `npm run check` 的 22 个测试通过；本地 npm pack 包含 Pi context hook，hook parity 与 `git diff --check` 通过。
