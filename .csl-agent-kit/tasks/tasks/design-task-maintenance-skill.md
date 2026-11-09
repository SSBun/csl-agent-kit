# 实现 Task Context/Lessons 维护 Skill

Status: Completed (2026-08-31 20:26)
Kind: Plan

## Scope

- 包含：新增共享 Meta Skill `task-maintenance`，由用户显式调用，清理 Context 与 Lessons 中有证据表明已经失效的历史内容，并合并语义上可以安全合并的项。
- 包含：补齐相邻 Skill 的职责边界、共享发现与文档入口、routing fixtures，以及一项普通 Context Pack 中的稳定跨 Skill 关系。
- 排除：自动调度、周期提醒、维护时间戳、审计台账、持久报告、任务记录归档、批量格式迁移、一般性重写、内容重路由、新解析脚本、新依赖、Task Core、默认 Agent Rules 与 Hooks。
- 本次执行在用户明确授权后沿用已接受 Target，实施与验证均归本记录。

## Target
- [x] T1: 受支持宿主可发现并显式调用 `task-maintenance`，其主要结果是从 Context 与 Lessons 删除已证实失效的历史内容，并合并不会丢失有效约束的重复项。
- [x] T2: Skill 只依据 Authority、当前对象或机制、取代关系及机械控制覆盖形成 Delete/Merge 候选；日期久、legacy 格式、长期未命中或措辞相似本身不能触发清理。
- [x] T3: 所有删除和合并都先以精确 change set 统一展示并获得明确确认；未确认内容保持不变，获批内容按文件独立回滚和校验。
- [x] T4: 合并结果保留适用范围、Authority、Recheck、Trigger、Rule、Check 与仍被引用的稳定身份；未触及 legacy 项不迁移，跨 Context/Lessons 不合并。
- [x] T5: 普通 Context 更新、纠正驱动的 Lesson 维护与显式历史清理保持清晰分工；维护运行不引入 scheduler、长期 owner、额外任务记录或新的持久状态。

## Decisions

- Skill 名称为 `task-maintenance`，位于共享 Meta Skills；它只在用户明确要求清理失效历史内容或合并 Context/Lessons 项时触发。
- 采用编排型 Skill：复用 `task-context` 与 `task-lessons` 的现有只读 CLI、Authority 和 schema，不新增解析器、脚本、依赖或缓存。显式维护运行可以完整读取两个 canonical 文件；这不改变普通任务按需读取 Context Packs 的边界。
- 内容产生方仍负责在事实或规则变化时即时维护；`task-maintenance` 只是显式兜底清理，不负责调度、提醒或持续拥有 Context/Lessons。
- 删除候选必须满足至少一项可验证依据：Authority 明确否定或取代内容；对应对象、路径或机制已不存在；有效内容已由更准确的 canonical 项完全覆盖；Lesson 的失败机制已被更强机械控制完全消除且没有剩余 Agent 判断。
- 合并候选必须属于同一载体、表达同一决策边界或失败机制、适用范围兼容且合并后不丢失任何有效约束。Context 与 Lessons 之间不得互相合并。
- `Keep` 与 `Defer` 只用于内部判定；证据不足、Authority 冲突或无法安全处理现有引用时不产生写入候选。Skill 不扩展成健康报告、润色、迁移或重路由流程。
- 清理最小独立失效单元；仅当整个 Context Pack 或 Lesson 都失效时才删除整项。删除或合并稳定 ID 前搜索当前非历史消费者；无法保留引用有效性时延后处理。
- Context 合并保留最符合最终 Scope 与 Authority 的现有稳定 ID，并保留全部有效 Authority 与 Recheck 信息。Lessons 合并优先保留适用 Trigger 最准确的现有 v1 ID，合并并去重 Trigger、Rule、Check；只涉及 legacy 项时产出一个新的稳定 v1 记录。
- 文件结构无效或 ID 冲突时停止清理并报告阻塞，不借维护流程执行格式修复。未被合并触及的 legacy Lessons 保持原样。
- 所有 Context 与 Lessons Delete/Merge 都使用比原 Context 普通写入更严格的统一确认：按文件展示目标 ID、操作、证据、原内容与最终内容，一次确认可批准全部或用户点名的子集。
- 每个文件独立执行：保留原文、一次性应用该文件全部获批操作、运行现有 validator 并重新读取目标；失败则恢复该文件。一个载体失败不回滚已独立验证成功的另一个载体。
- 例行维护运行不创建 canonical task、不写报告、不保存时间或历史。若发现必须修改其他载体，报告边界并由独立任务处理。
- Package 使用英文编写 `SKILL.md`、runtime metadata 与 eval-facing prose；用户回复保持用户语言。
- 新 package 包含 `SKILL.md`、`agents/openai.yaml`、`evals/trigger_cases.json` 与 `evals/semantic_config.json`。同步更新 Claude 显式 Skill 清单、README 技能表与布局、相邻 `task-context`／`task-lessons` 契约及 routing 邻接用例，并新增或更新一个普通 Context Pack，记录跨 Skill 关系。
- Codex、Cursor 与 Pi 继续依赖现有递归发现；不增加宿主专用命令。默认 Agent Rules、Hooks、Task Core 与任务 schema 保持不变。
- 实施验证使用三个受影响 package 的 `skill-quality`、JSON/YAML 解析、Context/Lessons validator、Claude manifest 完整性比较和 `git diff --check`。除非用户在实施请求中明确授权，否则不运行项目单元测试或测试套件；不自动运行 adversarial review。

## Plan

1. 创建共享 `task-maintenance` package：在主 `SKILL.md` 中定义显式触发、完整扫描、Delete/Merge 证据门、统一 change set 确认、ID 保留、per-file rollback、失败与完成边界；添加最小 OpenAI metadata 和 routing fixtures，明确排除普通 Context 更新、单次 Lesson 纠正、任务归档与自动周期执行。
2. 调整 `task-context`：保留内容产生方即时维护原则和普通 source-backed 写入规则，同时声明显式 `task-maintenance` 是采用统一确认的兜底清理，并允许其为维护目的完整读取 Context；更新相邻 routing case，不新增周期 owner。
3. 调整 `task-lessons`：保留纠正驱动的 Add/Update/Merge/Replace/Delete 工作流与全部写入确认，把跨记录历史清理路由给 `task-maintenance`；更新相邻 routing case，保持 untouched legacy 渐进兼容。
4. 完成共享发现和说明：将新 package 加入 Claude manifest 与 README 技能表／仓库布局；Codex、Cursor、Pi 不增加额外配置；在 `tasks/context.md` 中新增或更新一个普通 Pack，记录该显式清理 Skill 与两个现有 Skill 的稳定职责关系。
5. 执行非测试验证：逐包运行 `skill-quality`；解析所有改动的 JSON/YAML；运行 Context 与 Lessons validator；确定性比较 Claude manifest 与共享叶子 Skills；检查目标 Skill 可被递归发现、无 scheduler／state／script 资产，并运行 `git diff --check`。记录任何影响信心的 warning，并明确说明项目测试未运行。
6. 汇总 T1–T5 的当前证据，记录独立审查为 Skipped 和非测试验证结果，再通过 canonical completion gate 完成任务。

## Result

- T1: 新增 task-maintenance package；Claude manifest 完整性比较发现 28 个共享叶子 Skill，Codex/Cursor 继续导出根 skills，Pi 行为探针已注册 /task-maintenance。
- T2: SKILL.md 的 Delete/Merge gates 只接受 Authority、当前对象或机制、取代关系与机械控制证据，并明确拒绝用日期、legacy、未命中或措辞相似证明失效；14 个 routing cases 零误判。
- T3: SKILL.md 要求按载体展示精确 change set、统一明确确认，并对每个文件执行原文快照、校验和失败恢复；未获批候选不写入。
- T4: Context 合并规则保留稳定 ID、Scope、Authority、Recheck；Lessons 保留或生成合适 v1 ID及完整 Trigger/Rule/Check，禁止跨载体合并和迁移未触及 legacy。
- T5: task-context、task-lessons 与 CTX-task-maintenance 已固定即时维护/纠正维护/显式历史清理分工；新 package 仅含 SKILL、metadata 与 evals，无 scheduler、script、state 或报告资产。
- Review gate: Skipped — 用户未请求 adversarial review、双 Agent Reviewer–Editor 或独立 Reviewer 批准；本次只执行常规自审与确定性验证。

## Verification

- Passed: 三个 Skill Quality gate 均为 0 failures，task-maintenance 14 个 routing cases 零误判；Context/Lessons valid、JSON/YAML 与 Claude manifest 完整性通过、Pi 注册 /task-maintenance、git diff --check 通过。仅有已审阅的 context-budget 与现有 legacy Lesson warnings；按当前规则未运行项目测试。
