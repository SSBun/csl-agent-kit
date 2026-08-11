# 重写 workspace-capture-lessons 工作流

Status: Completed (2026-08-09 14:38)
Kind: Plan

## Scope

- 包含：重写 `workspace-capture-lessons/SKILL.md`，新增 Yao 强制要求的 `agents/interface.yaml` 与只读 Node 查询脚本，并同步更新聚焦契约测试及 Lessons routing/query eval fixtures。
- 排除：修改 Context 系统、Session dispatcher、默认 Agent 规则、其他 skill、无关测试或历史 Lessons。

## Target
- [x] T1: `workspace-capture-lessons/SKILL.md` 完整定义 Trigger-first 检索、Entry/Change/Completion Gates、纠正后的持久写入确认、冲突优先级、失败策略及与 Context、Task、全局偏好的边界。
- [x] T2: `scripts/lessons.js` 仅用 Node 标准库实现 `index`、批量 `show`、`validate` 和 `--self-test`，确定性支持 v1 records 与渐进兼容的 legacy records，且不修改或缓存 Lessons。
- [x] T3: `agents/interface.yaml`、聚焦契约测试和 Lessons routing/query eval fixtures 与新契约一致；self-check、聚焦测试、eval、Yao、resource-boundary 和 `git diff --check` 满足计划中的门禁。
- [x] T4: canonical task 的当前 Result 与 Verification 使用中文记录结论，同时保留技术标识的原生形式。

## Decisions

- 目标仅是 Lessons session system；`workspace-maintain-context` 不属于本次设计。
- 当前 `SKILL.md` 行为不是必须保留的基线，必须先讨论需求和候选设计。
- 首要问题是 Agent 在工作前不能可靠找到并应用与当前任务相关的 Lessons；设计先优化检索与应用链路，而不是先优化纠正后的写入体验。
- 采用两阶段 Trigger-first 检索：先扫描 Lesson 标题与 `Trigger` 条件，再只加载候选项的 `Rule` 与 `Check`；不为此新增 tags 或其他 metadata。
- Trigger 匹配采用召回优先：存在合理匹配可能就纳入候选，再读取完整规则；宁可加载少量弱相关候选，也不静默漏掉可能适用的 Lesson。
- 保留并收紧 `Rule` / `Check`：Rule 每项只表达一个强制动作或边界，Check 必须是可观察、可执行或可复核的证据；全部适用 Check 通过前不得宣称任务完成。
- Lesson 采用固定 Markdown schema：`## L-<创建日期>-<slug> — <标题>`，随后按固定顺序包含 `### Trigger`、`### Rule`、`### Check`，每节至少一个扁平列表项。
- ID 使用 ASCII 且创建后保持稳定；更新或移动条目不改变 ID。文件继续只保留当前有效规则，不新增 status 字段。
- Trigger-first 检索以稳定 ID 和固定 section 边界确定性分段，不引入 YAML、额外 parser 依赖或 one-record-per-file 存储。
- Legacy records 渐进兼容：仍按标题、Trigger 和 Rule 参与检索；缺少 Check 时为当前任务推导临时可观察检查；新增或实际修改旧记录时才转换为新 schema，不批量迁移历史。
- Lessons 使用三道生命周期 Gate：形成 Task Fingerprint 后、开始非平凡工作前执行 Entry query；session resume/compaction、实质 scope 或方案变化、用户纠正时执行 Change re-query；完成前只复核已选 Lesson 的 Check，若 scope 未重查则先返回 Change Gate。
- 无具体任务的 session start、简单事实回答、可直接验证的机械操作、闲聊和 Lessons 自身例行读取跳过查询；普通 follow-up 与单次工具调用不重复查询。
- 已选 Lesson IDs 只保留在当前会话工作状态中，不写入 canonical task 或独立 session state；resume/compaction 后重新查询 canonical `tasks/lessons.md`，避免缓存失效和跨系统耦合。
- 采用 Hybrid Script + Agent：只读 Node 脚本负责新旧 record 解析、Trigger index、按 ID 读取和 schema 校验；Agent 负责 Task Fingerprint、语义召回、适用性、冲突处理和 Check 执行。
- 脚本不修改 Lessons、不做语义判定、不执行 Check、不建立持久缓存，并使用 Node 标准库。
- 脚本最小 API 为 `index`、批量 `show <id>...`、`validate` 和 `--self-test`，统一接受 `--workspace` 并读取 canonical Lessons 文件。
- `index` 输出 `csl-lessons.index/v1` JSON，只含 ID、title、format 和 Trigger；`show` 返回候选的完整 Trigger/Rule/Check；`validate` 严格检查 v1、只警告 legacy。
- Legacy records 使用当前扫描内的 `legacy-<content-hash>` 临时 ID，不写回文件；正式更新时才获得稳定 v1 ID。
- 用户纠正立即应用于当前任务；若可能形成持久 Lesson，Agent 先查询现有记录并选择 Add/Update/Merge/Replace/Delete/No-op，只有需要持久修改时才展示目标 ID、操作和精确记录或 diff，获得确认后写入。
- 所有持久新增和既有记录修改都需要确认；任务特有纠正或已有规则已覆盖时直接 No-op，不额外打断用户。
- Lessons 低于 System/Developer、项目规则、安全边界、用户当前明确请求和当前任务已确认 Decisions；不得用历史规则覆盖更高优先级或当前例外。
- 兼容 Lessons 合并 Rule 并取 Check 并集；冲突时更具体的 Trigger 优先，日期不构成优先级。仍无法消解时展示 IDs、匹配证据与影响并询问用户，再按持久写入确认流程修复冲突记录。
- 查询允许有界降级：文件缺失视为空；脚本失败回退手动 Trigger-first scan；malformed record 原文复核后按相关性处理；duplicate ID 禁止自动应用。持久写入后 validate 失败则撤销本次写入；任何适用 Check 未通过或不可观察时任务不得完成。
- Entry/Change query 有候选时向用户显示一行 `Applied Lessons: <ID...>`；零候选保持静默。匹配证据、Rule、Check 保留在会话内部，冲突、降级、失败和持久写入确认仍完整展示。
- 保留现有 skill 名称、路径和宿主发现方式。
- 用户已批准该完整设计，并允许新增缺失的 `agents/interface.yaml`、同步更新聚焦契约测试与 Lessons routing/query eval fixtures，使其匹配“所有持久写入先确认”和新的 schema/query 契约。

## Plan

1. 将已批准的 schema、查询 Gates、优先级、写入确认和失败策略写入主 Skill，并补齐跨宿主 interface metadata。
2. 用 Node 标准库实现只读 Lessons CLI 及内置 self-check，覆盖 v1、legacy、重复 ID 和格式诊断。
3. 同步聚焦契约测试与 routing/query eval fixtures，验证 CLI 数据契约和新工作流语义。
4. 运行 self-check、聚焦测试、eval、Yao、resource-boundary、diff 与任务门禁，并按 Target 记录当前证据。
5. 将 canonical task 的当前 Result 与 Verification 收敛为中文交付记录。

## Result

- T1: SKILL.md 已定义固定 Trigger/Rule/Check schema、Entry/Change/Completion Gates、召回优先查询、优先级、持久写入确认、legacy 兼容、载体边界与 fail-closed 完成门禁；聚焦契约测试通过。
- T2: lessons.js 仅使用 Node 标准库；self-test 通过，当前 63 条 legacy records 以零错误通过校验，文件缺失时 index/validate 返回空且有效的规则集，CLI 契约测试通过。
- T3: interface metadata 与两类 eval fixtures 已对齐新契约；test:tasks 通过 23/23，routing 通过 13/13 且 precision/recall 均为 1.0，quick_validate 通过，Yao 仅剩已允许的 2155/1000 initial-load token 超限。
- T4: canonical task 的 T1–T4 Result 与 Verification 已改用中文记录结论，命令、schema、文件名和指标等技术标识保持原生形式。
- Review gate: Skipped — 用户未明确要求 adversarial review、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: Node 语法、self-test、当前及缺失文件检查、23 项 task tests、13 项 routing cases、JSON、OpenAI quick validation、Yao 非预算门禁与 git diff --check 均通过；仅存在明确允许的 Yao initial-load token 超限。
