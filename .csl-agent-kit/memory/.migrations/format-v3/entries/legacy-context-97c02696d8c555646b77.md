---
schema: csl-memory/v1
id: legacy-context-97c02696d8c555646b77
revision: 1
type: fact
title: Memory 存储与后台维护边界
summary: 修改 Memory 存储、模型选择、后台队列、审批或 Pi 激活时读取。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-memory-runtime — Memory 存储与后台维护边界:1
updated: 2026-11-02T03:43:09.028Z
deleted: false
---

## CTX-memory-runtime — Memory 存储与后台维护边界
- Scope: Memory 条目存储、默认模型解析、持久队列、独立 SDK 会话、本机审计服务和 Pi 激活边界。
- Paths: `bin/memory/`, `bin/csl-agent-kit.js`, `pi/lib/memory-bridge.ts`, `skills/meta/agent-hooks/hooks/memory-maintenance.md`
- Keywords: memory, revision, hash, queue, daemon, approval, agent_settled, model default
- Authority: `bin/memory/store.js`, `bin/memory/model-config.js`, `bin/memory/queue.js`, `bin/memory/agent.js`, `bin/memory/daemon.js`, `pi/lib/memory-bridge.ts`, `docs/memory.md`
- Recheck: Memory schema、Pi SDK API、模型配置优先级、后台调度、审批或旧机制切换入口变化时复核。

### Structure
- `bin/memory/store.js` 以 User/Project 各自 memory 根内的 Markdown 条目为权威，索引可重建；revision/hash 在写锁内核对，墓碑保持版本连续，审计保留 before/after。pending 恢复依赖当前文件 hash，不能把异常当成未提交。
- `bin/memory/model-config.js` 的 Memory 独立覆盖优先于 Pi 用户级保存的默认模型；不读取前台会话临时切换，配置缺失或不可用不选择其他模型。
- `bin/memory/queue.js` 在用户 Memory 根的 `.service` 保存事件与独立处理状态；同一 workspace/session/eventKey 绑定内容 hash。服务按项目串行、跨项目最多两个并发；失败或中断事件阻挡同项目后续事件，显式 retry 保留已记录的 effects。
- `bin/memory/agent.js` 使用 Pi SDK 的全新内存会话和空资源加载器，不加载环境 extensions、skills 或主任务 Hooks；允许源码只读工具及专用 Memory 工具，没有 shell、普通文件编辑或用户提案审批接口。服务独立于前台终端存活。

### Decision and Verification Boundaries
- Pi bridge 仅在项目 `.active.json` 符合 `csl-memory-activation/v1` 时接入；该标记是迁移及消费者切换门，不能用手动创建标记替代迁移确认。`agent_settled` 只定向派发 `inner:memory-maintenance`，游标推进绑定持久入队内容 hash，不等于模型处理完成。
- 本机面板绑定 127.0.0.1，以随机 bearer token 和严格 Host/Origin 校验保护 API；用户级批准绑定展示的提案 digest 与条目 CAS。审批是 Prompt/CLI/UI 工作流边界，不是针对本地文件或内部 API 修改的操作系统沙箱。
