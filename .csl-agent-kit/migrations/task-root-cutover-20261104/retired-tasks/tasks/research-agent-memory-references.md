# 调研其他 Agent 记忆系统作为 Markdown Memory 设计参考

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-02 17:34) |
| Kind | Task |

## Target
- [x] T1: 基于可核验的一手资料比较代表性Agent记忆系统的存储、读取、维护及一致性机制
- [x] T2: 提炼适用于现有Markdown记忆方向的参考，区分来源事实、建议与未验证性能，不修改现有设计或实现

## Scope

用户已明确保留Markdown存储，本轮仅外部资料调研和会话内参考建议，不以调研为由改用数据库、不修改Topic、实现、真实记忆或用户设置，不安装或运行第三方Agent。建议不自动成为已采用设计。

## Plan

1. 查询并读取官方文档与官方仓库，比较文件存储、上下文加载、自动维护和写入保护。
2. 区分五个文件型产品/方法与一个通用记忆框架，按本项目Markdown和后台维护约束提炼参考。
3. 核对关键断言的原文与源码，披露版本、运行和性能验证边界后在会话交付。

## Execution Log

### 001 — 明确Markdown边界并检索一手来源

遵循用户撤回数据库建议的明确要求，优先检索Claude Code、Letta MemFS、OpenClaw、Hermes、Cline，另以LangGraph作为维护时机和作用域的概念对照。通过web_search发现入口后读取官方正文，不将搜索摘要当作主要证据。没有加载或执行远程脚本。

### 002 — 核对关键机制与不能直接迁移的边界

Claude Code文档明确MEMORY.md索引启动加载前200行或25KB，主题文件通过普通文件工具按需读取。Letta当前MemFS文档明确Markdown+frontmatter、真实Git checkout、普通文件工具及默认无向量索引；dreaming使用后台subagent，文档描述worktree并发，但本轮没有验证冲突收敛。

OpenClaw以Markdown保存长期内容，搜索索引和后台状态可用数据库；预压缩flush与后台dreaming是不同维护路径，不能说所有状态都是Markdown。Hermes文档说明会话启动冻结快照、可选写入审批、后台整理及禁止多Agent共用同一home；源码确认patch只替换指定片段、待审批操作固定原条目、锁内重读及原子写入调用。保护机制不等于支持任意多Agent共享或经过安全审计。

Cline Memory Bank是Markdown文档方法，不是独立内建后台记忆引擎；官方模板要求每任务读全部文件，并含当前工作/进度，因此不能照搬到本项目的渐进读取与Task/Memory分工。LangGraph区分线程状态与长期namespace，以及hot-path/background的延迟与新鲜度权衡，其JSON Store不作为替换Markdown的建议。

Hermes文档仍有已完成工作日志的示例，而当前memory工具提示词明确跳过任务进度和completed-work logs；本次不据旧示例改变本项目知识准入。厂商性能叙述及通用Markdown效率不作为已验证结论。

## Sources

- S1：[Claude Code Memory](https://code.claude.com/docs/en/memory)，完整正文已获取；web结果mvz22mrmsgzi6h，urlIndex=0，重点核对Auto memory及How it works。
- S2：[Letta MemFS官方文档源码](https://github.com/letta-ai/letta-docs-md/blob/main/concepts/memfs/index.md)，正文mvz23xa0v4yzjj，urlIndex=0；[Memory与dreaming](https://github.com/letta-ai/letta-docs-md/blob/main/configuration/memory/index.md)，正文mvz22mrmsgzi6h，urlIndex=2。另读[文件系统实现](https://github.com/letta-ai/letta-code/blob/main/src/agent/memory-filesystem.ts)，结果mvz25bo3xwd78v，urlIndex=2。
- S3：[OpenClaw Memory](https://docs.openclaw.ai/concepts/memory)，正文mvz22mrmsgzi6h，urlIndex=1；核对文件层、搜索派生索引、flush、dreaming及来源/行动边界。
- S4：[Hermes Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)，官方源码正文mvz25bo3xwd78v，urlIndex=0；[工具源码](https://github.com/NousResearch/hermes-agent/blob/main/tools/memory_tool.py)，同结果urlIndex=1；[Store源码](https://github.com/NousResearch/hermes-agent/blob/main/tools/memory_tool_store.py)，结果mvz27ux2mls54w。核对_pin_matched_entries、_background_delete_gate、_patch_entry、_mutate及_file_lock，不声称完整安全审计。
- S5：[Cline Memory Bank官方文档](https://github.com/cline/cline/blob/main/docs/best-practices/memory-bank.mdx)，正文mvz23xa0v4yzjj，urlIndex=1；核对方法定位、六类核心文档、每任务全读与维护触发。
- S6：[LangGraph Memory概念](https://docs.langchain.com/oss/python/concepts/memory)，正文mvz23xa0v4yzjj，urlIndex=3；核对namespace、profile/collection、hot-path/background与JSON Store。

## Task Summary

无代码或组件改动；仅查询外部官方资料、在会话中给出参考比较，并维护所属任务记录。没有改写Memory Topic或实现。

## Self Assessment

| Dimension | Score | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 改动最小性 | 5 | 仅外部只读调研与任务记录，无交付文件、依赖或配置修改。 | 没有执行第三方系统。 |
| 稳定性 | 4 | 关键断言落到S1—S6原文，Hermes写入保护补看源码；区分普通文件读取与受控写入。 | 官方文档与main分支持续演进，未证明所有版本具有相同行为。 |
| 目标对齐 | 5 | 六个参考覆盖存储/读取/维护/一致性；全部建议保留Markdown前提，不重提数据库迁移。 | 通用框架只作机制对照，不是产品替换方案。 |
| 验证充分性 | 4 | 不只依赖搜索摘要；已读官方正文并对照相关函数，已指出Cline全读、Hermes共享限制及文档/源码差异。 | 未运行安装、并发、崩溃、效果或token基准；不声明性能领先或完整安全性。 |
| 完成信心 | 4 | 一手来源充分支持参考比较，建议与来源事实明确分开。 | 是定性调研，不是全市场综述或经过实测的技术选型。 |

## Result

- T1: 已读取Claude Code、Letta MemFS、OpenClaw、Hermes、Cline及LangGraph六组官方正文；S1-S6记录URL和抓取结果。Hermes片段patch、审批原条目绑定及锁内重读补查实际源码；比较已区分文件内容、加载方式、维护触发和一致性限制。
- T2: 参考建议保持Markdown权威、精简索引和按需直读，借鉴后台整理、精确patch与审批绑定；明确不照搬Cline全量加载、Hermes小容量全注入/多Agent共享限制，未将LangGraph JSON Store变为迁移建议。未修改Topic或实现，未运行基准或测试。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 仅外部只读研究和会话内比较，没有交付文件修改；任务记录不计入实现变更。
- Snapshot: no-file:research-agent-memory-references:S1-S6:mvz22mrmsgzi6h-mvz23xa0v4yzjj-mvz25bo3xwd78v-mvz27ux2mls54w
- Evidence: Sources S1-S6、Execution Log 002及Self Assessment；关键论断已回查一手正文，不把搜索摘要或厂商性能描述当成实测。
- Task fingerprint: d14d210cd09ef54ee36d4882ec51d116e9370da792ec66494a91f05c48f6a84b

## Verification

- Passed: 逐项复核Markdown权威/索引读取/维护/写入约束六类对照，链接均来自实际获取的官方页面或仓库；区分Letta默认无向量、OpenClaw数据库派生层、Hermes审批默认关闭与共享限制、Cline文档方法及LangGraph机制对照。自评保持5/4/5/4/4，无运行验证或性能承诺。
