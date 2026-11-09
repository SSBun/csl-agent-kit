---
schema: csl-memory/v2
id: legacy-context-97c02696d8c555646b77
revision: 14
type: reference
title: Memory 运行、恢复与 Pi 状态栏
summary: 跨workspace并行，同workspace串行；每事件两次尝试。Pi模块升级需完整重启；🗂️直接链接Dashboard，浏览器与标签行为交给系统设置，本机默认Safari。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-memory-runtime — Memory 存储与后台维护边界:1
  - docs/memory.md
  - session:01a1a0b5-02e3-73c2-b781-4b36e28e9dde/task:null/event:476eb49730bf705bcf52b1f5e1aba2a7777fadfecd921e3b8933a1e272b367e4
  - docs/memory.md:143-149;
    session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:cbf76d340ed092b08c51adb7cb4b497d8f45c61255f37bed1acab547f953b802
  - pi/lib/memory-bridge.ts:21-40;
    session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:null/event:9eb9e3645ff26b2eaded39ce0b8786244b2136812edbbd6da28f5c84604cc0d4
  - pi/lib/memory-bridge.ts:44-64
  - .csl-agent-kit/tasks/tasks/clickable-memory-dashboard-label.md#Result
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:clickable-memory-dashboard-label/event:b77bf965f1312792babedf74941d0b2ee285242270f1524ef40038913c1088be
  - pi/lib/memory-bridge.ts:31-65
  - .csl-agent-kit/tasks/tasks/compact-memory-status.md#Result
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:compact-memory-status/event:2ad52f070b4552247104eafe6e960c42724a6011207c98844e43b957b427171b
  - .csl-agent-kit/tasks/tasks/fix-memory-footer-colors-layout.md#Target
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:fix-memory-footer-colors-layout/event:b4bc0e52e71838897703a68c958c7a542caf84e4226ec8d39c9667cd45c9958b
  - pi/extensions/openai-codex-fast.ts:130-227
  - .csl-agent-kit/tasks/tasks/fix-memory-footer-colors-layout.md#Execution Log
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:fix-memory-footer-colors-layout/event:3637f4fd0859e45f7fc200d364c44e34aff6be32c2551c492171e4b7ce930319
  - .csl-agent-kit/tasks/tasks/memory-workspace-concurrency.md#Result
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-workspace-concurrency/event:f8ca6e61b4756d31842221060be029ea088499a966be656e9702492060382523#user-and-assistant
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:fix-memory-failed-batches/event:ac474ce3f470378e989c585fc4ef9a82a46be1413d44748b9d47412fb35e60d8;
    自动恢复目标
  - docs/memory.md#后台与宿主接入
  - .csl-agent-kit/tasks/tasks/memory-workspace-concurrency.md#Scope
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-discard-invalid-backlog/event:8ef96be9c8f281a485fd5fc039231215932bfb19f602c3517016066c6b74a936#user-and-assistant
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-batch-conversation-view/event:3f783afcefa652f68372e1acbecb1cc66df68cbb6f9149076e494c15bd86a1b6#窗口与配置隔离选项
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-batch-conversation-view/event:b01beee0930dd9e87a5e61a50af74a4c86f1807e5f59aa76c86a93ddcec9f8fa#user
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-status-window-icon/event:17cf8edf58bed3eb7372a01509f329badcbca46134d4aa0ac72be3ef1b57216a
  - bin/memory/browser-window.js:8-30
  - bin/memory/web/open-window.js:8-38
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-safari-direct-link/event:b302143da730d7e7e6ff045aba87ccde0fbb88ffdc3b674ca9e2014731c3dc3c#user-and-assistant
  - ".csl-agent-kit/tasks/tasks/memory-safari-direct-link.md#Scope; #Result;
    pi/lib/memory-bridge.ts:53-56"
updated: 2026-11-06T08:40:40.307Z
deleted: false
retrieval:
  aliases:
    - Memory后台维护
    - Memory自动恢复
    - 两次尝试上限
    - exhausted
    - Memory工作区并发
    - CommonJS缓存
    - Fast自定义底栏
    - OSC 8链接宽度
    - Memory图标
    - Dashboard直接链接
    - Safari新标签页
  situations:
    - 诊断Memory并发、失败重试或周期冷却
    - 区分契约与真实后台激活
    - 核对Pi模块升级重启边界
    - 排查Memory计数、颜色、链接和底栏截断
    - 调整Memory图标直接链接与系统浏览器行为
  topics:
    - Memory/运行与升级
    - Memory/自动恢复
    - Memory/并发调度
    - Pi/状态栏
  links: []
---

权威：docs/memory.md、skills/meta/agent-memory/SKILL.md；实现bin/memory/、pi/lib/memory-bridge.ts。schema、SDK、模型、调度、迁移变化时复核；契约和隔离验证不证明真实后台已激活。

两级Markdown权威，索引可重建；revision/hash条件写入、连续墓碑版本、before/after审计。pending或恢复错误可能已有提交，重试先核对。模型独立覆盖优先于Pi保存默认值，不跟随前台临时切换，不可用不静默降级。

后台独立SDK内存会话、空资源加载器，不加载主任务Hooks及环境extensions/skills；只读源码和专用Memory工具，无shell或普通文件编辑。服务独立于前台终端；每workspace复用会话，阈值、模型变化、失败、重启触发重建。持久状态在队列、知识和审计，不依赖聊天记录。

用户根.service队列以workspace/session/eventKey绑定内容hash。同workspace串行，不同workspace并行，无全局两个并发上限。每事件最多两次尝试＝首次＋一次自动重试；失败、中断、历史attempts均计入，跨重启保留，手动retry不能重置。成功不重复处理；两次仍未完成标记exhausted并继续后续记录，保留输入、错误与部分提交，续做先核对知识和审计。周期耗尽不推进成功游标，从候选末尾继续且仍等24小时，避免换批立即重试。

Pi项目根.format.json须为csl-memory-store/v1且version等于migration.VERSION；缺失为未激活，不兼容报Memory store upgrade is incomplete or unsupported，不手造标记替代迁移。agent_settled定向派发inner:memory-maintenance；持久入队、游标推进不等于处理完成。

状态栏🗂️ [运行中:待处理:失败]＝running、queued、failed+interrupted+exhausted；服务停机/读取失败为[?:?:?]，在线缺失计数按零。零值success，非零依次accent、warning、error；快照不证明全部处理完成。仅图标包装OSC 8链接：TUI支持且取得地址才启用，手势由终端决定，否则保留无链接图标。直接使用service.dashboard返回的dashboard.url；独立窗口中转及Chrome优先启动链路已移除。浏览器选择交给系统默认设置，新标签页行为由浏览器配置决定，终端超链接不强制窗口或标签。本机HTTP、HTTPS默认Safari，使用正常外部链接新标签页行为。

Fast底栏由pi/extensions/openai-codex-fast.ts的setFooter覆盖。只剥SGR会把OSC 8隐藏链接算入宽度，旧截断还丢颜色；用@earendil-works/pi-tui的visibleWidth、truncateToWidth、wrapTextWithAnsi，空间不足换行，保留颜色、链接和后续状态。验证须覆盖实际完整底栏，默认底栏或格式化单测不足。

本机面板仅127.0.0.1、bearer token、Host/Origin校验；提案批准绑定digest与CAS，不是本地文件/内部API的操作系统沙箱。仅标签/底栏展示改动可/reload；已加载旧Memory模块须完整退出并重启Pi后恢复会话，/reload不清CommonJS缓存，后台重启不刷新前台。禁止混用版本、不保证跨版本热更新，不擅自关闭用户前台。主任务不因Memory失败默认阻断。
