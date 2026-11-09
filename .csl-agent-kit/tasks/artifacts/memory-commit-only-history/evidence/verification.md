# 仅提交历史：自查证据

## 范围

检查版本由本任务snapshot绑定。原始要求：无变更处理不留永久日志，只有认可的记忆提交成为历史，Dashboard不再过滤有变更/全部处理记录。临时排队、失败待重试数据和最小去重/调度状态保留；已提交审计和恢复不删除。

## 隔离队列走查

通过Node直接调用实际queue/store/maintenance/commits接口，在独立CSL_AGENT_KIT_HOME和两个临时项目中操作；没有调用模型，也没有运行单元或项目测试套件。走查脚本与输出复核结果如下：

| 情形 | 观察 |
| --- | --- |
| 无变更完成 | events/jobs文件均消失；get仅返回payloadHash凭据；pending=0，commits=0 |
| 同输入重发 | duplicate=true、status=completed，未重新排队 |
| 同键异文 | EVENT_CONFLICT |
| 提交后批次失败 | pending=1；真实committed事务仍在提交列表和change详情中 |
| 失败批次重试并完成 | pending=0，commits=1，原提交保留 |
| 两项目完成并清理 | knownWorkspaces仍为2 |
| 跨项目引用用户chip | 清理后assertUnreferenced仍返回MEMORY_REFERENCED |
| 跨scope分页 | 总3笔，首页dependent，下一页shared，无重复 |
| 周期完成 | 最新游标独立保留，清理事件后没有立即重复用户scope周期；项目scope仍可独立调度 |
| 旧完成批次释放 | dry-run计1批2298字节；执行后原文消失，凭据仍可读取 |
| 清理中断窗口 | 已写receipt但job消失，reconcile不重新排队，清理剩余event；重发仍去重 |

隔离目录：`/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/memory-commit-walkthrough-ub1Fgc`。

## 浏览器观察

MCP浏览器连接器报transport连接失败。使用本机独立headless Chrome、隔离配置目录及只读预览HTTP服务。服务使用实际前端资源与实际commits/queue/store接口；/api/status为隔离状态，禁用POST，不触及真实记忆。

DOM观察：主列表3条dependent/shared/sample；页码1—3 / 3；changes-only不存在；旧history重复面板不存在；待处理队列存在；页面无错误。点击首条提交后dialog打开，摘要为project/dependent.md与提交理由，before为原先不存在，after包含真实隔离chip正文，保留“核对恢复到变更前”按钮，无详情错误。已查看[截图](isolated-detail.png)；未执行恢复写入。

## 静态与实际数据预览

修改JS均通过node --check。agent-memory技能质量无failure，保留上下文预算warning（3329 tokens，建议1000）。未运行npm run check，因为包含测试套件。

真实数据只读预览：6个已知工作区，490笔committed审计；154个已完成批次的events/jobs合计454004字节可释放。未完成队列、prepared/aborted恢复凭据、entries、.history与索引代际不在清理范围。实际激活与释放尚待独立审查后执行，不将预览当成已清理。

## 限制

去重hash按事件累积，仍有小幅增长；不是零磁盘增长。失败未解决的输入暂留。原始事件释放后不再提供完成批次的对话回放。已加载旧queue模块的Pi需要完整重启后恢复会话，旧读者可能不认识清理后的凭据。真实环境既有失败批次不由本任务重试或修复。尚未用模型执行新的提炼批次，未运行单元/项目测试套件。
