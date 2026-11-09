# 新版 Memory 实际观察

本记录只陈述实际执行的非测试套件操作。临时数据均为合成内容，没有向模型发送真实用户会话。

## 存储与自动迁移

在隔离的用户根和项目根中调用正式CLI：

- project upgrade --dry-run列出3个单元；围栏内二级标题未误分。
- project upgrade返回upgraded并记录3笔事务；重复执行返回current。
- user put首次使用时导入合成用户旧资料，随后直接写入synthetic-preference成功；没有创建审批提案。
- 重复使用同一0/null写入返回CONFLICT，当前revision=1及完整SHA256可见。
- paths返回独立user/project根，预算title=60、summary=200、bodyTarget=4000、body=8000、indexPage=4000。

## 真实模型与会话复用

使用Pi保存的默认模型openai-codex/gpt-6-astra，正式CLI enqueue两条合成消息：

| 事件 | 状态 | attempts | agentSession |
| --- | --- | --- | --- |
| 5d74a72c5e3c0689a7eaadb94ff2276ae07717209212f8f3593884ef983b8083 | completed | 1 | ca47ad17-d6e9-4f54-81e0-6aeec4b76a15 |
| c742746f6065291934d1f020f027f545cadf77f61d78310687ed605dfe682733 | completed | 1 | ca47ad17-d6e9-4f54-81e0-6aeec4b76a15 |

两次输入来自不同前台session标识，但同workspace；返回同一Memory会话ID。第一批完成后第二批才开始。Memory Agent报告已读两级索引，无值得保存的信息；队列未记录写入effects。agents返回idle、batches=2、默认模型身份及lastEvent。

后台PID=60978。投递CLI已退出后，ps显示PPID=1，后台仍可响应查询；证明该服务不依附投递CLI进程存活，不等价于所有宿主关闭路径均已逐一验证。

## 已执行静态检查

新增/修改的Memory JavaScript与bootstrap脚本通过node --check。Pi扩展及lib通过tsc --noEmit（ESNext、Bundler、ES2022、skipLibCheck、allowImportingTsExtensions、esModuleInterop）。agent-memory Skill质量检查0失败、1个上下文预算警告（1506估算tokens），保留完整读写约束，不通过删减安全条款规避警告。

## 面板实际操作与恢复

Chrome MCP 连接失败后，使用本机 Chrome 无头模式及独立临时配置访问隔离服务，通过 CDP 实际操作页面，没有访问日常浏览器会话。面板显示两个已完成任务及同一个 idle Memory 会话；切换 user 范围、打开 synthetic-preference 变更、核对恢复内容、确认恢复并填写原因，均完成。

恢复产生事务 89f3fe38-e096-4ad3-a986-14aa01d000be，actor=memory-restore，source=restore:51d87ee9-25d1-465b-b222-f1b87a18798c。新增条目的创建前状态由 revision=2、deleted=true 的墓碑表示；旧正文仍在审计记录。页面错误区域为空，浏览器 Runtime.exceptionThrown 为零。截图已实际查看；仅验证这一条恢复路径，不代表全部面板交互通过。

## 第二工作区与后续复用

第二工作区首次投递触发旧资料自动转换，并使用独立会话 e99faa5a-0f65-4e7c-8ff5-353b0e7a8cb1，完成一批。原工作区第三批继续使用 ca47ad17-d6e9-4f54-81e0-6aeec4b76a15。服务最终显示两个 idle 工作区、completed=4、active=[]、schedulerError=null。由此观察到会话隔离与后续复用；没有捕获同时运行状态，不能单凭最终状态宣称并行执行已验证。

## 后续静态检查与清理

agent-memory、agent-hooks、task、task-plan、task-queue、task-maintenance、topic 逐包质量检查均无失败，均有上下文预算警告；task 另有长文警告。本轮保留必要约束，未为降低预算删减安全要求。修改后的三个现有测试源文件通过 node --check，git diff --check 无输出；这些不是测试执行结果。

隔离服务已通过正式 CLI 停止；随后 status 返回 running=false、state=stopped。临时 Chrome 已结束。保留合成数据与截图供追溯，没有删除真实用户数据。

## 尚未由本记录证明

跨workspace同时执行、全部崩溃窗口、原生Pi分支恢复、真实项目升级及最终独立审查。未运行单元测试或项目测试套件。仍需完成消费者一致性检查和逐项 Target 验证，不能据本记录宣称系统已完成。
