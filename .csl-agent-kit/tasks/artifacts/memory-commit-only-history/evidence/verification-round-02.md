# 第二轮自查：审查问题修复

## TR-1：去重分片容量与中断恢复

原固定两位分片持续增长可能超过runtime.read的2 MiB上限，确认成立。新增按哈希前缀逐层拆分：叶子目标上限1 MiB；先完整写入子节点，再原子替换父叶子为分支标记；读者仍兼容未拆分的旧平面叶子。保持顶层分片写锁，已有hash不删除。此次变更尚未部署，真实库未出现该新格式的超限分片。

执行[capacity-observation.cjs](capacity-observation.cjs)，使用新的隔离CSL_AGENT_KIT_HOME和临时项目，不调用模型或测试框架：

- 原平面分片：2,097,051字节，15196项；直接追加会达到2,097,189字节，跨越2,097,152读取上限。
- 实际追加后拆分为分支；15197项，原有项丢失0，最大文件139245字节。
- 新事件重发duplicate=true；旧凭据仍可读取。
- 人工在第三个子片写入时注入异常：批次仍为completed，原event保留。
- 恢复原写入函数并reconcile：成功释放event，重复输入不重放，15197项保留，原有项丢失0。

隔离目录：`/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/memory-history-boundary-DhpHh5`。

## TR-2：聚合分页重复读取

原聚合器循环调用分页history，而history每次全量读取，确认成立。提取store.historyRecords作为单根一次性元数据扫描，原history使用该函数保持分页契约；commits每根仅调用一次，之后统一筛选、排序和分页。

隔离构造205笔审计（其中5笔prepared），计数真实fs.readFileSync的.history读取：第一页205次，第二页205次；成功列表总200条，第一页首项audit-204，第二页首项audit-183，跨页重复0，非committed项0。首次计数脚本未解析macOS /var→/private/var实路径，出现0计数，已纠正计数路径后重新执行；不以该0值作证据。

原history API仍返回total205、limit2，首项audit-204，不返回before/after正文。真实库只读观察：493笔committed审计，请求20条时读取493个审计文件。该数量是当时快照，不是固定验收值。

## 验证边界

修改的queue/store/commits均通过node --check。界面未因本轮修复修改，第一轮隔离Chrome观察仍适用。未运行单元/项目测试套件或新模型调用。真实后台尚未激活，旧处理日志尚未清理。待新的独立只读审查核对两项修复及回归边界。
