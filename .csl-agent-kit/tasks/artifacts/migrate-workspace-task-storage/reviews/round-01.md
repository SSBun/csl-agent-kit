# Review round 01

- Schema: task-review-report/v1
- Task: migrate-workspace-task-storage
- Round: 01
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/migrate-workspace-task-storage/evidence/dba5ddaafe7585a79960f14761b3fb2073bcc8a5f7b5c164dc699321b00b0a06.json#dba5ddaafe7585a79960f14761b3fb2073bcc8a5f7b5c164dc699321b00b0a06
- Task fingerprint: e196a7f8d3d585ede11add60fa85f01246bc8aac98b5c8d17a10b21b603bed49
- Outcome: findings
- Mode: independent subagent
- Run: 4b3fe9d8-dca5-4011-bb8f-602ab0123128

## Reviewer feedback

Review mode: independent subagent

Reviewed scope / snapshot:
- 审查了迁移脚本、共享路径解析、Task/Topic/历史证据消费者、Pi面板、归档入口、相关规范及测试源码。
- 快照标识：`dba5ddaafe7585a79960f14761b3fb2073bcc8a5f7b5c164dc699321b00b0a06`。未执行摘要计算，不能声称当前17个文件与快照逐字节匹配。

Findings:

**TR-1**
- **Severity**：P1 / Concern。
- **Location**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/scripts/migrate-task-storage.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/scripts/migrate-task-storage.js):78–88；["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js):273–276、346–348、365–369。
- **Issue**：迁移会重写Topic规范正文中的跨树链接，却没有保留其规范摘要兼容性。
- **Evidence**：迁移脚本对整个Topic正文执行`rebaseLinks`；例如规范正文里的`[源码](../../README.md)`会增加一层父目录。`normative()`直接纳入规范正文，而`parseTopic()`仍要求其摘要等于原Revision，`readTopic()`还要求与不可变规范快照一致。因此合法的此类Topic迁移后必然读取失败。现有测试只覆盖Resources链接，没有覆盖规范正文链接；这是源码推导，未运行复现。
- **Impact**：兼容迁移代码可能发布字节清单完全匹配、但Topic无法读取的目标树，影响T2/T3。未发现当前读取的真实Topic触发该问题，不主张本次实际Topic已经损坏。
- **Suggested next step**：至少在发布前验证转换后的Topic规范身份，不兼容时停止切换；若继续支持该转换，应提供显式身份映射，不重写历史规范快照。补充正文链接回归用例，运行仍需用户授权。

Unverified risks:
- **TR-2，阻断T3证据闭合**：实际迁移专项用例位于["/Users/caishilin/Desktop/personal/skills/tests/task-storage-migration.test.mjs"](file:///Users/caishilin/Desktop/personal/skills/tests/task-storage-migration.test.mjs)，当前为未跟踪文件，却未纳入所给17文件快照。已阅读其内容，但该关键验证产物没有绑定审查身份。建议补入快照并刷新受影响证据。
- **快照及全树校验覆盖限制**：只读工具不能执行hash或`check-evidence`，未独立复算3322文件、2865历史产物及Git身份；也未建立审查前后全范围字节一致性。此限制不证明数据漂移，但最终T1/T3验证仍须由主Agent完成当前快照及迁移清单核验。

Checks performed:
- 静态检查了冻结拒绝访问、目标冲突、独占发布、中断续做、回滚漂移保护及历史证据映射路径。
- 实际观察到旧根不存在，新根分类目录存在，独立备份及retired恢复目录保留；标记为`unified`、状态为`completed`，结束前重读标记未见变化。
- 未编辑、运行测试、执行命令或改变任务状态。

Author evidence examined:
- 已阅读Result T1–T3与Log009–011，区分作者记录的完整性检查、CLI/Topic检查与用户面板确认。
- 未将历史139项测试视为本轮重跑，未以作者自评分支撑结论。

Coverage limits:
- 未逐项点击GUI、验证所有历史链接或复算全树权限和摘要；未归因无关工作区修改。
- TR-1需要整改；TR-2需要补齐证据绑定。本反馈不授予完成批准。