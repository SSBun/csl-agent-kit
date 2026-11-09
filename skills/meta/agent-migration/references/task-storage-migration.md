# Task 根目录迁移

此流程只搬整个旧 Task 树至工作区的统一数据根，不同时重新分类，也不升级或改写现有 Memory 库。Task 内旧 Context/Lessons 随原树保留为历史来源；不重新导入。目录迁移仍须遵守主 Skill 的授权、并发协调、清单和兼容性检查。

## 已提供的组件能力

- `csl-tasks/shared/lib/task-storage.js` 是 Task 核心、Topic、证据、归档与 Pi 面板的共同路径解析器。
- 未切换的工作区继续使用旧 Task 根，不擅自迁移其他项目。新目标已存在但没有有效切换标记时失败，不自动挑选新旧副本。
- `.csl-agent-kit/task-storage.json` 记录明确的 `migrating` 或 `unified` 状态及相对迁移清单位置、摘要；迁移中拒绝常规 Task 访问。切换后只读写新根，旧索引再出现时停止，不回退或双写。
- 历史 `tasks/...` 引用作为逻辑身份通过新根解析，不靠保留旧路径或符号链接。新快照引用写入实际统一根相对位置。

## 命令与步骤

下述脚本相对于本参考文件的位置是 `../../csl-tasks/shared/scripts/migrate-task-storage.js`。先解析为真实绝对路径并核对版本。命令形式：

```text
node <script> prepare <workspace> <migration-id>
node <script> apply <workspace> <migration-id>
node <script> rollback <workspace> <migration-id>
```

1. 先核对全部写入方已协调暂停、无活动Task写锁，Pi已加载新面板与路径模块。新面板的 `task_focus` 返回 `storageSchema: csl-task-storage/v1` 和 `storageRoot`；旧工具没有这些字段时，先由用户重载或重启Pi，不能先搬数据再假定旧工具会跟随。
2. `prepare` 是备份写操作，不是只读预览。它在统一根下的 `migrations/<migration-id>/` 创建逐文件清单、独立原文备份和暂存树；ID必须未使用。先生成备份，再逐字节和权限核对来源没有漂移。不要把失败的旧准备目录覆盖掉，重新盘点后使用新ID。
3. 清单记录源/目标相对路径、类型对应集合、大小、权限、转换前后hash，以及可变Task记录的迁移前后fingerprint。只修复Task/Topic可变正文中因根目录下移而改变的Markdown链接；历史产物、审查报告和快照原文不改写。清单是迁移证明，不能手改来跳过证据校验。若链接重定位会改变Topic的Scope、Spec Context、Decisions或Dependencies规范段，prepare拒绝生成可发布清单；apply也复查已准备树并在移动源之前拒绝此类变化。该情形需要另行设计显式规范身份迁移，不改写Revision或历史规范快照来绕过校验。
4. 在展示精确范围及恢复位置、满足安全边界后执行 `apply`。它先复核来源及准备材料，设置冻结标记，通过内核原子no-replace rename保留原树并发布暂存树，核对完整文件集合、权限、hash后才提交unified标记。不宣称这几个步骤构成跨文件事务。
5. 若中断，先检查标记和实际树状态；相同清单的 `apply` 可续做。仅未完成且与清单完全相符的迁移可 `rollback`：保留备份，恢复旧原树，不用备份覆盖新增内容。已完成迁移后的回滚不由该命令自动处理，必须先盘点后续写入。
6. 验证CLI可读取/继续当前任务、索引与Task/Topic关联正常、面板标题/进度/链接和focus指向新位置，归档写入新根；核对所有历史证据文件字节。原审查结论只对原内容成立，迁移证明不是新审查许可。

## 链接与证据边界

Task树内部结构保持不变，内部相对链接通常无需变化。跨树链接重新计算相对于新文档的位置。可变记录的纯链接变换通过清单保留原fingerprint；任何其他内容变更仍使原评估失效。历史快照只有迁移前已登记的清单及精确匹配的转换hash可使用迁移映射，不能凭“文件移动过”豁免内容漂移。

不可变产物保留原文及原路径身份；历史文字中的旧位置通过迁移清单定位，不承诺任意外部Markdown查看器自动修复历史正文内的链接。迁移清单和备份长期保留，不自动删除旧的恢复材料。
