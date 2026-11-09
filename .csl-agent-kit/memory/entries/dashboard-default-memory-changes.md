---
schema: csl-memory/v2
id: dashboard-default-memory-changes
revision: 17
type: fact
title: Memory Dashboard 展示与访问端点
summary: 侧栏三页，默认概览；批次详情默认末条消息，历史可切换，辅助信息折叠、状态可见。记忆库按工作区及用户分组，保留空组和失效路径；实时详情结束两分钟释放。本机55815，新安装47831。
sources:
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-default-memory-changes/event:289e9262b97dc2e62a8f12ac92dc0399c032a7bed6d3e4e9b70d07a41b3f79ad
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-default-memory-changes/event:3514bffb054349c5f9f5e05d2a67aa1e0d0a04c962cb438f9682068c85f8f806
  - .csl-agent-kit/tasks/tasks/dashboard-default-memory-changes.md
  - bin/memory/queue.js; bin/memory/daemon.js; bin/memory/web/dashboard.js;
    bin/memory/web/dashboard.html
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-collapse-secondary-sections/event:817465fcbe7b314c5054cd6f98f4ac98818282f1af4099308c36e0cc722547f6
  - .csl-agent-kit/tasks/tasks/dashboard-collapse-secondary-sections.md
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-newest-memory-file-changes/event:8ea3369eead0de5caa1bcf4a29cb46e860309c4c8a20483f4ddfe60bd8435849
  - .csl-agent-kit/tasks/tasks/dashboard-newest-memory-file-changes.md
  - docs/memory.md#仅提交历史与队列释放; docs/memory.md:158,162,165; docs/memory.md#实时处理详情
  - .csl-agent-kit/tasks/tasks/dashboard-memory-scope-filter.md#Target;
    .csl-agent-kit/tasks/tasks/dashboard-memory-scope-filter.md#Result;
    .csl-agent-kit/tasks/tasks/dashboard-memory-scope-filter.md#Scope
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:2d57fc3132f38f316e0551abeeb6d11463ead4c179f0c2c7f3e241372cc7805c
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:2278d8ab672c6af59c5832b2144bed2c4653d48bc07492740dc9bf5569b27e2d
  - .csl-agent-kit/tasks/tasks/memory-dashboard-stable-port.md:83
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:ec5e28d5dfa020ff18f226deca71c78c6122c6853f0453ae18cb7a10efa8999b
  - .csl-agent-kit/tasks/tasks/dashboard-current-memory-library.md#Scope;
    .csl-agent-kit/tasks/tasks/dashboard-current-memory-library.md#Result
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:f9dda2a0e29b100e010a9425d674e5ad8330d8a8486858eb8bc6798e7e5c5f66
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:fa1306c8a8408a5ad469b6ef6e7dac0f7813b19bb0f0a6a41e4f1e766febb59b#user
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:b14992a39f3f4474f53a8d84a5b49d5fca6ec099cd11da7e7ca7db30c7e1c0ba
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:00af5b5e0bfd914d8c98e3aef24532a4e7a68b5c91a5cf6e63b91dfcd1acf100#user
  - .csl-agent-kit/tasks/tasks/dashboard-render-memory-details.md#Target
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-agent-live-details/event:794f0c7c7108b5924366854516723bde714851bd2fad6de5c4368cc2aece09bd
  - .csl-agent-kit/tasks/tasks/memory-agent-live-details.md#Scope
  - .csl-agent-kit/tasks/tasks/memory-dashboard-sidebar.md#Scope
  - session:01a1aee1-fc82-73b2-bb1e-ba8b4a52e88d/task:null/event:6c851d3177b25f0ee87d300d0f8d6c33e3d4df74d955271446775ce69dbedd88
  - session:01a1af06-3565-71fc-a593-83e802a8a99c/task:null/event:c4bbb330214761f61e09402f86b6656eae18f952a71cd6c880e5c41f5040139b
  - bin/memory/library.js#scan/groups;
    .csl-agent-kit/tasks/tasks/memory-library-group-cells.md
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-batch-conversation-view/event:4337073ecfdaab977e3065e6be70b3f044498a0ffd713de5f1bab2a290af23dc#user
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-batch-conversation-view/event:e499dc1e00bcdc609877d5d4ce7ab14bbbded75b4cae095450d572182c2fe0e1#user
  - .csl-agent-kit/tasks/tasks/memory-batch-conversation-view.md#Target;
    bin/memory/web/dashboard.js#showJob
updated: 2026-11-06T06:52:04.335Z
deleted: false
retrieval:
  aliases:
    - Memory Console
    - Dashboard侧栏
    - 全局概览
    - 记忆存储
    - 记忆处理
    - 记忆库
    - 工作区分组
    - 分组折叠展开
    - 空组与失效路径
    - 变更记录
    - commits-only
    - Dashboard固定端口
    - "55815"
    - Markdown/JSON渲染
    - Memory Agent · 实时处理
    - 有界内存缓存
    - Agent处理的会话列表
    - 会话历史
    - 默认最后一条消息
  situations:
    - 调整Dashboard默认入口和三页导航
    - 按用户或指定项目浏览记忆与提交记录
    - 核对全部项目发现范围与分组完整性
    - 区分记忆库分组展开与提交或队列分页
    - 判断失败批次的提交是否显示
    - 排查范围切换或加载失败残留
    - 查找本机Dashboard端口及授权
    - 调整正文与元数据展开和渲染
    - 排查实时详情过期、批次替换及关闭后轮询
    - 调整批次末条消息默认选择、历史切换与辅助信息折叠
  topics:
    - Memory/Dashboard
  links: []
---

界面：左侧全局概览、记忆存储、记忆处理，默认概览；深色彩色状态面板，断线显示未知。?page=overview|storage|processing支持直达、刷新和前进后退；窄屏顶部导航。存储筛选、提交分页与处理筛选/分页独立，切页关闭详情。正式要求见docs/memory.md；布局不改变数据、尝试次数或缓存策略。

记忆库：存储页默认全部分组，用户全局组置前，项目按完整工作区路径区分同名项目；全部项目仅指已登记工作区。组头显示名称、路径、未删除条目数；空组保留，失效路径显示不可用。初始折叠，点击展开全部紧凑卡片，再次点击收起；最近更新优先，不受全局记忆分页截断。接口一次扫描计数及元数据，正文按需读取；旧列表分页API保留。卡片显示标题、摘要、类型，点击读取最新完整正文、来源与元数据。当前＝存在且未删除，不保证语义有效；详情已删除或不存在则报错。正文默认展开、元数据折叠；Markdown/JSON用第三方库渲染。只读。

变更记录独立于记忆库，仅.history committed事务；跨根排序分页、最新优先，保留摘要和前后差异，每根只扫描一次，User为全局作用域。部分失败批次的提交仍显示，不依赖effects回写；prepared/aborted仅供恢复，proposal不算提交。changesOnly、全部处理记录切换及完成批次回放已取消。

存储两视图共用全部/用户/项目筛选；用户和全部忽略项目路径。项目候选非完整注册库，支持手输绝对路径；切范围或项目重置相关分页，加载失败清空旧结果并禁用分页。旧高级筛选、记忆索引及手工提案区块已移除，后端与CLI能力保留，不删除记忆或审计。

处理页：运行中Agent、实时详情与独立工作区队列筛选；概览显示服务和工作区状态。批次详情以会话正文为主体，默认展开列表最后一条消息；会话历史可切换早前消息，显示角色及序号。原始JSON、来源元数据、详细错误、已提交变更默认折叠；状态与简短失败提示可见。正式展示要求见对应Task。队列暂存排队、执行中、失败或中断批次，完成后释放输入与处理日志，无变更不产生提交；历史选择器不恢复已释放输入。失败队列可查看部分提交并显式重试。恢复生成新版本，不倒退历史。

实时详情按工作区展示输入、尝试次数、模型、工具参数/文本结果、公开回复及写入效果；纯文本、本机授权，不展示隐藏推理或原始会话对象。仅有界内存，每工作区当前或最近一批，新批替换，结束两分钟释放，后台重启即消失；截断/淘汰明确提示，无永久处理日志，提交审计保留。每秒更新，关闭后停止请求；容量及接口见docs/memory.md#实时处理详情。实现存在不证明后台已加载。

本机http://127.0.0.1:55815/沿用旧安装端口；新安装默认47831。正常重启保留地址与授权，占用报DASHBOARD_PORT_IN_USE、不自动换端口；后台停止时不可用。权威入口docs/memory.md、bin/memory/web/；端点持久化及授权撤销见文档。
