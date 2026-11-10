# Memory系统转换

本流程协调显式Memory格式转换，读写契约见[agent-memory](../../agent-memory/SKILL.md)，数据边界见[统一存储规范](storage.md)。当前格式只保存有效知识，不保留历史、来源审计、墓碑、审查或恢复副本。与通用目录搬迁不同，本分支不创建备份或持久转换日志。

## 核对最新目标结构

1. 阅读当前可用的[Memory说明](../../../../docs/memory.md)与agent-memory契约，再核对实际安装CLI及 `bin/memory/store.js`、`recall-index.js`、`migration.js`、`cli.js` 的能力。文档较新不等于已安装运行时支持，不自动安装替代程序。
2. 当前目标是store/service协议5，知识文件只含title、summary与带日期case，文件名作为身份；两级均为entries加单个当前index，索引schema为 `csl-memory-index/v4`。版本标识在当前索引，不另存 `.format.json`。
3. 核对实际scope、全部当前正文、旧格式、历史目录、待决写入与锁。旧库可读但默认不可写，不因宿主启动或后台维护自动升级。project请求不授权user及其他项目。
4. 检查写入方兼容性。先在空闲边界停止共享旧服务，不中断其他工作区批次；Pi旧模块需完整重启，不支持跨版本热更新。不用旧writer继续写新格式。

## 预览与执行

使用已安装的 `csl-agent-kit memory`；未安装时，只有确认本包 `../../../../bin/csl-agent-kit.js` 存在，才使用 `node <绝对路径> memory`。

```text
<memory-cli> service status
<memory-cli> paths --scope project --workspace <工作区>
<memory-cli> upgrade --dry-run --scope project --workspace <工作区>
<memory-cli> index-status --scope project --workspace <工作区>
```

dry-run只读，报告当前条目身份、hash、动作、计数和旧路径，不复制正文。明确列出永久删除旧历史、来源元数据、墓碑、提案及恢复资料的后果，按已有用户授权与当前Task模式执行；已明确接受本分支范围时不重复确认。只读请求止于预览。

执行前对全部有效正文校验日期与预算；未知格式、未决旧pending、活跃或无法识别的旧锁、知识无法完整转换时停止受影响项。不要为了通过验证丢弃条件、编造日期或截断知识。

```text
<memory-cli> upgrade --scope project --workspace <工作区>
```

旧段落正文可通过 `upgrade --input <JSON文件>` 提交人工整理的put数组，沿用`id/operation/expected.hash/content`结构。只允许当前scope中现存有效旧条目的替代内容；全部hash、正文日期和预算在首个写入前校验，未知ID、重复ID、非put、过期hash及当前格式条目均拒绝。调用方必须先核实日期和语义；升级器不自动补日期或合并。`--input`不与`--dry-run`组合，输入不得保留为历史或恢复资料。编程调用对应`migration.upgrade({...scopeOptions, prepared: puts})`，可仅在内存中构造输入。

升级器仅清理指定Memory根的已知旧内部路径，不导入旧Context/Lessons，也不扫描Task附件或外部目录。若用户另行要求清理Memory历史副本，先列出具体Memory所属文件；不扩大删除无关Task记录、用户级或其他项目数据，不迁移被删除的副本。不得另存前后正文、来源清单、审查内容或恢复镜像。验证证据仅保留必要计数、当前内容身份和局限。

## 失败与验收

转换不是多文件事务，没有回滚或restore。失败后读取实际当前文件，确认哪些条目仍是旧格式；不根据未返回响应判断未写入，不用旧备份覆盖新知识。符合原授权时可重新检查并继续转换；未知冲突停止。当前索引过期使用reindex，从现存正文重建，无需历史恢复。

验收核对：当前有效文件数量与title/summary/case语义保持；旧字段已消失；当前索引完整覆盖并与文件hash相符；指定旧目录已删除；未授权作用域文件hash未变。不要为了比较保存旧正文副本。预算、语法或结构通过不等于语义无遗漏，实际比较与未执行检查分别报告。

运行时验证核对协议5及已移除历史/恢复接口，旧只读scope仍可检索。需要恢复后台时确认剩余队列与模型调用边界，不为验收额外调用模型。已加载旧模块的Pi由用户完整退出并重启，不替用户关闭前台；后台重启不等于前台已激活。

交付说明已转换范围、永久删除范围、保留的未授权数据、当前索引与服务状态及必要激活步骤。没有恢复材料属于目标行为，不能套用通用目录迁移的“备份可恢复”验收项。
