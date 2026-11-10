---
title: 交互与使用体验
summary: Pi与Memory界面的导航、标题、状态和展示偏好；覆盖CLI人类输出及近期上下文的产品需求，不承载后台调度规则。
---

- [2026-11-06] Memory界面有概览、记忆存储、记忆处理三页，默认概览；深色彩色状态面板，断线显示未知，窄屏顶部导航。?page=overview|storage|processing支持直达和历史导航；切页关闭详情，各视图筛选分页独立，不改变数据、尝试次数或缓存策略。
- [2026-11-09] 记忆库存储页默认全部分组，用户组在前，项目以完整路径区分同名；全部仅指已登记工作区，空组保留、失效路径显示不可用。组头含名称/路径/有效数，初始折叠，展开全部卡片、最近更新优先，不受全局分页截断；卡片含标题和摘要，详情按需读取最新正文及当前文件信息，无类型或来源。不存在报错，当前存在不保证语义有效；正文展开、信息折叠，Markdown/JSON第三方渲染，旧分页读取API保留。
- [2026-11-09] 存储页只浏览当前记忆，无历史、变更对比、提案或恢复入口。全部/用户/项目筛选中，前两者忽略项目路径；项目候选非完整注册库，可输入绝对路径。旧历史和恢复后端/CLI同步移除，不保留审计替代入口。
- [2026-11-10] 用户要求以项目entries/temp.md帮助新Agent了解近期用户意图；临时内容 MUST 仅保留UTC当天及前6个自然日，context、lessons等长期记忆不受此期限影响。Dashboard MUST 在卡片与详情中为context、lessons、temp分别显示「项目基础」「通用经验」「临时记忆·7天」文字及不同颜色的徽标；无近期条目时显示空状态。具体清理与读取契约查agent-memory及docs/memory.md；产品契约不证明当前运行实例已加载实现。
- [2026-11-09] 处理页含运行Agent、实时详情及独立工作区队列，概览显示服务/工作区状态。批次展示现存输入与必要运行信息，已完成输入释放，不提供会话回放或知识恢复。失败批次可能已有文件写入，MUST 先核对当前文件，再按剩余尝试次数显式重试。
- [2026-11-09] 实时详情仅本机授权纯文本，显示尝试、模型、工具结果、公开回复和写入，不显示隐藏推理或原始会话对象。每工作区保留当前/最近批次内存，新批替换，结束两分钟释放，重启即失；截断明示、每秒更新、关闭停止，不留永久处理或提交审计。本机沿用55815端口，新装默认47831；正常重启保留地址/授权，占用报DASHBOARD_PORT_IN_USE不换端口，停机不可用。
- [2026-11-07] Task状态独立使用csl-task-mode键：✋ CONFIRM为accent、⚡ SOLO为success，错误显示CONFIRM · config error且后缀error；省略Task前缀、括号和来源，来源由/task-mode查询。启动/恢复/重载、树导航、轮次及设置变更时重读，无timer，shutdown仅清自身，非TUI不显示；实际展示取决于footer，不证明请求应用了新模式。Git图标只分干净/有改动，不显示数量。CLI人类输出默认ANSI含非TTY，--no-color、NO_COLOR或JSON禁色。
- [2026-11-06] 终端标题与Pi session metadata独立；中文4–24码点、含汉字，可含术语数字，不带目录/模型标签，代码强制格式。带prompt的before_agent_start触发，模型仅取保存标题及活跃分支用户/Assistant文本和最新prompt，上下文最多12000字符，排除工具、thinking、图片、项目文件和主Agent上下文；确定性跳过内部Compaction completed. Continue.提示。
- [2026-11-06] 标题自动刷新非阻塞无toast；/title参数作最新请求，派发失败立即报原错且不监听，成功后报告刷新/保持/失败/超时。新标题 MUST 脱离最新消息仍能表达当前工作。原标题准确或信息不足时保持，在TTY锁及latest-token检查内重写该workspace最后成功值以恢复共享状态；无历史不写。模型失败/无效输出不覆盖，MUST NOT 冒充保持。入口为csl-context-hooks和refresh-tab-title，测试定义不证明当前运行通过。
- [2026-11-05] 任务面板只导航不写状态，入口csl-task-overlay及task-storage。focus仅存Pi session分支的csl-task-focus记录，启动/树切换恢复；task_focus供Agent关联，/task-focus可手动切换或清除，完成后关联保持。有效关联分This Session/Workspace，否则回退共享列表；/tasks取最近20条再分状态。
- [2026-11-05] 任务TUI复用组件，每5秒清缓存并原位刷新；Task和Topic都空才注销，重复启动释放旧timer，shutdown清理；RPC忽略会话分组输出字符串数组，headless不注册widget。OSC 8可用时链接活动根索引，This Session标题纯文本，canonical任务标题用pathToFileURL，非canonical或不支持则纯文本。列表只显标题/状态/Target进度，不展示恢复详情；完整日志/计划/Block查正文或CLI非JSON show，JSON recovery仅兼容旧字段。
- [2026-11-06] Memory状态🗂️[运行中:待处理:失败]对应running/queued/failed+interrupted+exhausted；停机或读取失败为[?:?:?]，在线缺失计数为零。零值success，非零accent/warning/error；快照不证明全部完成。仅图标在终端支持且取得地址时链接dashboard，浏览器/标签行为交系统默认，本机Safari；无独立窗口中转或Chrome优先。Fast footer覆盖默认底栏，MUST 用Pi TUI的visibleWidth/truncateToWidth/wrapTextWithAnsi处理SGR和OSC8，空间不足 MUST 换行并保留颜色/链接；MUST 验证实际完整底栏。
