# Review round 01

- Schema: task-review-report/v1
- Task: memory-commit-only-history
- Round: 01
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/0e1d11b61ae4405a5719c6f32e98dd6e0a0732fcb27eb18d925fabe7d9ea7159.json#0e1d11b61ae4405a5719c6f32e98dd6e0a0732fcb27eb18d925fabe7d9ea7159
- Task fingerprint: 0b4d730988af154a857e6aa7ba1746a5d8e3de7e4af757216900eeb3df761a1e
- Outcome: findings
- Mode: independent subagent
- Run: 79a4350a-6419-42cc-b89a-7535e07998b8

## Reviewer feedback

## Review

### 实际模式与范围

只读、独立单轮 task-review；未修改文件、执行命令或测试、调用模型、改变任务状态。

仅以任务提供的 `changes.patch` 为差异依据，并检查指定源码及未修改消费者。快照标识：`0e1d11b61ae4405a5719c6f32e98dd6e0a0732fcb27eb18d925fabe7d9ea7159`。未计算文件哈希，不能独立证明当前文件与清单逐字节一致；未观察到已读源码与补丁的实质不一致。

### Correct

- 提交列表直接读取 committed 审计，不依赖批次最终状态或 effects，因此保留部分成功提交。
- 完成释放按“完成标记→去重凭据→周期游标→删除 job→删除 event”排序；残留 event 可通过 receipt 识别为完成，不直接重新入队。
- 工作区登记独立保留；未解决输入、显式重试、跨项目入链检查和原审计恢复入口仍在。
- Dashboard 主列表已改用提交，删除原过滤器，待处理队列独立展示。

### Findings

#### TR-1 · P1：去重分片可以写到永久无法读取，进而阻断恢复

**位置**：
- ["/Users/caishilin/Desktop/personal/skills/bin/memory/queue.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/queue.js)：24–25、136–141
- ["/Users/caishilin/Desktop/personal/skills/bin/memory/runtime-files.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/runtime-files.js)：14–20
- ["/Users/caishilin/Desktop/personal/skills/bin/memory/store.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/store.js)：81–85

**问题与证据**：新 receipt 固定使用事件 ID 前两位分片，持续向同一 JSON 对象追加。`runtime.write` 没有大小限制，但 `runtime.read` 固定拒绝超过 2 MiB 的文件。按当前格式，每项约 138 字节；单片约 15,197 项便超过读取上限。追加操作可以成功写出超限文件，之后该片所有读取均抛出 `TOO_LARGE`。

**影响**：对应事件的去重读取、入队及完成释放失败。若留下已完成事件，启动时 `reconcile → compactCompleted → retire` 再次读取超限分片并抛错，可使整个 daemon 启动失败。这不是已披露的“小幅磁盘增长”，而是新增持久格式的确定性容量故障。

**下一步**：在达到读取上限前拆分分片，保留旧凭据的兼容读取与原子迁移；不能通过删除旧 hash 绕过。补充接近上限、跨上限写入、重发及重启恢复的隔离验证。

#### TR-2 · P2：提交分页反复全量读取审计，放大同步磁盘开销

**位置**：
- ["/Users/caishilin/Desktop/personal/skills/bin/memory/commits.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/commits.js)：29–37
- ["/Users/caishilin/Desktop/personal/skills/bin/memory/store.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/store.js)：538–544

**问题与证据**：新增聚合器逐页调用 `store.history(...limit:100)`，但原 `history` 每次都读取、解析、排序该根的全部审计，包括 before/after，最后才切页。因此一个含 N 笔审计的根，每次列表请求读取约 `N × ceil(N/100)` 个审计文件，而不是 N 个。

**影响**：即使只显示第一页 20 条，也执行上述同步全量循环；历史持续增长时会阻塞共享 daemon 的 HTTP、调度和模型回调。作者三条记录的浏览器走查未覆盖该路径。

**下一步**：让每个根只扫描一次，再过滤、跨根排序和分页；避免逐页重复调用全量扫描函数。验证超过 100 条时的文件读取次数和返回顺序。

### 未验证风险

| 项目 | 是否阻断 Target |
|---|---|
| TR-1 的容量边界及恢复路径未覆盖 | **是**，涉及 T3 持久可靠性 |
| 快照哈希未由本轮重新计算 | 最终结论绑定前需主会话复核 |
| 真实后台激活、旧完成数据清理、Pi 完整重启 | 不作为当前实现缺陷；仍是最终交付前的待验证事项 |
| 实际模型调用、恢复写入、进程崩溃注入 | 本轮未验证；现有证据仅覆盖直接 API 和人工构造的残留状态 |

### 已执行检查

- 阅读原始需求、任务 Target、任务限定补丁和快照清单。
- 追踪完成释放、重发冲突、残留事件恢复、失败重试、周期游标与工作区登记。
- 检查未修改的 store、runtime-files、service 和 Pi bridge 消费路径。
- 检查 Dashboard 列表、详情、分页、恢复入口与待处理队列。
- 未运行测试、CLI、质量检查或性能测量。

### 作者证据审阅

源码检查后阅读：
- ["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/verification.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/verification.md)
- ["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/walkthrough.cjs"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/walkthrough.cjs)
- ["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/isolated-detail.png"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/isolated-detail.png)

脚本支持所述基本路径覆盖，但没有容量边界或多页审计覆盖；截图支持详情弹窗和变更摘要展示。未把作者自评分作为证据，也未将作者执行记录视为本轮独立复现。

### 覆盖限制与结论

未审查无关脏文件或提交范围；未独立执行作者走查，也未验证生产清理结果。

**Merge verdict：BLOCK**。依据为 TR-1；这是审查反馈，不授予任务完成或部署授权。