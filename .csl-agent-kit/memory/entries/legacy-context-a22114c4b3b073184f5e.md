---
schema: csl-memory/v2
id: legacy-context-a22114c4b3b073184f5e
revision: 4
type: fact
title: Pi 任务面板、活动存储根与会话关联
summary: Task面板使用唯一活动Task根，迁移异常不回退；focus属于Pi会话，面板只导航。Task与Topic均为空才注销TUI组件；源码支持不证明运行进程已加载。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-pi-task-overlay — Pi task overlay rendering:1
  - pi/extensions/csl-task-overlay.ts#refresh
  - pi/extensions/csl-task-overlay.ts#restoreFocusedTask
  - pi/extensions/csl-task-overlay.ts#renderRows
  - skills/meta/csl-tasks/shared/lib/task-storage.js#layout
  - tests/pi-task-overlay.test.mjs
  - .csl-agent-kit/tasks/tasks/extend-agent-migration-memory-support.md
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:extend-agent-migration-memory-support/event:b8d66bbca2a53dbbb48fd4d377016acc0cfc552e294d76f46a10ffec2d7a1515
updated: 2026-11-05T08:43:05.161Z
deleted: false
retrieval:
  aliases:
    - Pi任务面板
    - csl-task-overlay
    - Task存储根切换
    - 统一任务目录
    - csl-task-focus
  situations:
    - 核对Pi任务面板是否支持新的统一任务目录
    - 修改任务widget、focus、链接或刷新行为
    - 区分Memory迁移技能交付与Task面板运行时支持
    - 排查空任务列表仍显示Topic组件
  topics:
    - Pi/任务面板
    - 存储迁移/Task消费者
  links: []
---

权威入口：pi/extensions/csl-task-overlay.ts、skills/meta/csl-tasks/shared/lib/task-storage.js；测试入口 tests/pi-task-overlay.test.mjs。面板只导航，不写Task状态。

活动根：无标记且统一目标不存在时用旧 tasks；有效 .csl-agent-kit/task-storage.json 的 unified 状态切换至 .csl-agent-kit/tasks。迁移中、无效标记、目标存在但无完成标记、切换后旧 tasks/tasks.md 重现均报错，面板显示存储警告，不回退另一副本。storage.taskPath／layout 统一解析索引、正文、链接；历史逻辑 tasks/ 引用保留身份。Task根与Memory根分开；迁移技能的交付范围不代表面板能力，源码支持也不证明工作区已迁移或Pi已加载新版。

focus只存Pi session的 csl-task-focus custom entry；session_start／session_tree恢复当前branch最新关联。task_focus供Agent关联任务，/task-focus <task-id|clear>手动切换或清除；已完成任务保持关联直到替换／清除。有效关联显示This Session与Workspace，无关联或失效时回退共享列表。/tasks取索引最近20条后分状态打印。

TUI复用组件，每5秒清除当前工作区进度缓存并原位刷新；Task与Topic均为空才注销，重复启动释放旧timer，shutdown清理。RPC忽略session分组、输出可序列化字符串数组；headless不注册widget。

OSC 8可用时，Tasks／Workspace链接活动根tasks.md，Topics链接topics.md，This Session标题保持纯文本；canonical tasks/[a-z0-9-]+.md标题用pathToFileURL生成绝对文件URL。不支持链接或非canonical路径保持纯文本。

任务条目仅标题、状态、Target进度；列表及RPC、/tasks不展示恢复详情。完整Execution Log／Plan／Block读任务正文或CLI非JSON show；JSON recovery仅兼容旧字段，面板不依赖recoveryOf。
