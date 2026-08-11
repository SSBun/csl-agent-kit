# 审计本地更改

## 计划

- [x] 梳理本地 diff 的业务目标、改动边界与相关运行时契约。
- [x] 检查正确性、安全性、兼容性、边界条件和测试覆盖。
- [x] 运行聚焦验证，并按严重级别记录可复现的问题与剩余风险。

## 复核

- 发现 5 个需处理的问题：tips 并发写入可突破硬限制，畸形用户 SOP 可中断 Pi 的整块上下文注入，Pi 的原始 prompt 缓存可能串轮，失败的设计工具结果仍会宣称已取得设计数据，以及 npm 安装环境中的 doctor 不会检查 lifecycle。
- `npm run check` 全部通过；Bash/JSON/Node 语法、hook parity 与 `git diff --check` 通过。
- 并发复现中 30 个写入最终保存了 26–30 条，稳定突破 20 条上限；隔离的非 git 包目录复现了 doctor 完全省略 hook/Pi lifecycle 输出。
- 独立 TypeScript no-emit 命令因仓库默认 CommonJS 推断拒绝 `import.meta`，这不是当前 npm/CI 测试采用的加载模式，未作为代码 finding。
