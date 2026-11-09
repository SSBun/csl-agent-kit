# 实现按需行内审查说明及 CSL 提交阻断

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 17:47) |
| Artifacts | [Artifacts](../artifacts/implement-code-inline-review/) |
| Kind | Task |

## Target
- [x] T1: code-inline-review 仅在用户明确调用时生成并维护按逻辑组组织的源码审查说明，支持安全清理
- [x] T2: CSL Hooks 支持 Pi 执行前阻断，提交内容含审查块时阻止并报告位置，工作区独有审查块不阻止提交
- [x] T3: 不确定提交内容的命令拒绝执行并提示拆分，保留普通注释、业务代码及暂存选择

## Scope

实现按需 Skill 与内置 CSL before-tool 检查，不安装仓库原生 Git hook，不提交或发布仓库。保护覆盖适配器可见的直接 shell Git 调用，不声称覆盖任意脚本、外部终端或 GUI。保留工作区原有未提交改动。

## Plan

1. 补齐 Pi 阻断返回链与检查失败处理。
2. 实现暂存内容检查、受限提交命令解析与说明格式/清理工作流。
3. 执行语法、Skill Quality 和隔离行为验证；完成独立审查及最终检查。

## Decisions

用户在本会话逐项确认：显式调用才生成；每组一个主块，关联块保留目标和本块说明；机械修改集中交代；整文件/模块删除无需独立说明；源码不保存问答；关闭只停止新增。提交只约束待提交内容，允许工作区保留说明。用户最后明确授权改进 agent-hooks 并实现 Skill 及其 hooks。

## Execution Log

### 001 — 实现授权与现状

用户确认复用 CSL Hooks，并授权实现。已核实 Pi 原生 tool_call 支持 block；现有 CSL capability 与返回链未启用。工作区已有大量其他任务改动，本任务只局部修改相关文件。未获单元/项目测试执行授权，使用非测试命令验证。

### 002 — 实现与自检

新增按需 Skill、格式与提交边界说明、只输出预览的清理工具及内置提交 guard；Pi 适配返回 block，native adapter 识别更多 shell 入口并在 dispatch 异常时拒绝。为 before-tool 脚本新增 on-error: block，其他普通脚本保留尽力执行语义。已补充 Claude 显式技能清单和 README 入口。

隔离 Git index 观察确认干净暂存放行、已暂存标记阻断、残缺标记阻断、子目录不漏检、隐式暂存及复合提交拒绝。实际加载扩展模块并调用 tool_call，观察到正确的放行/阻断；不是已重载当前交互会话的声明。清理预览保留 CRLF，拒绝残缺、ID 不匹配和夹带代码。语法与 scoped diff whitespace 检查通过。新 Skill Quality 通过；agent-hooks 仅有 2147 tokens 上下文预算警告，保留现有必要协议，不扩大到无关压缩。

### 003 — 修复可见 Git 入口漏检

独立审查 TR-1 指出环境变量前缀、条件语句和 here-document 后续 Git 调用未被识别。已修复执行位置识别、赋值前缀处理及 here-document 边界扫描；这些形式仍拒绝执行，不尝试解释或执行它们。repair-02.json 记录 20 种命令观察及三宿主共 24 次拒绝结果；普通引号文本和 here-document 文档不误报，干净 index 配合工作区说明仍放行。语法、两包质量与 diff whitespace 检查完成；等待新一轮独立核验 TR-1。

### 004 — 补齐执行位置边界

第二轮确认 TR-1 有实质进展，但命令替换、前置重定向与 time 包装仍遗漏。已增加带深度上限的替换内容识别、重定向目标跳过及包装器识别，并覆盖 while/until 条件、续行与显式引用的 Git 名称。repair-03.json 记录新增 18 场景和三宿主 39 次检查；boundaries-final.json 对当前 guard hash 重查此前 38 场景，结果无回退，另查 6 个边界。保留单引号/转义/静态 heredoc 文本的非误报行为。TR-1 no-progress 维持 0，待第三轮独立确认。

### 005 — 收紧 Git 子命令白名单

第三轮确认前述修复有实质进展，剩余 TR-1 为 bisect run 可执行可见 git commit。已移除 bisect 的整体白名单，不扩展执行分析。repair-04.json 绑定当前 guard hash，重查 44 个既有场景无回退，三宿主均拒绝 bisect run，干净 index/工作区说明继续放行。语法、质量与 whitespace 检查完成；等待新一轮独立确认。

### 006 — 统一静态 shell 包装识别

第四轮确认 bisect 修复，剩余 TR-1 为静态 shell 包装叠加重定向或组合语法后判定不一致。已将 sh/bash/zsh/eval 纳入共用包装器集合，并在备用扫描同样识别包装参数中的可见 Git。repair-05.json 绑定当前 guard hash：44 既有场景无回退、45 包装组合均拒绝、4 普通文本场景放行、三宿主9次检查均拒绝；干净 index/工作区说明放行。语法、质量与 whitespace 检查通过，等待独立复查。

## Task Summary

**code-inline-review**：[技能目录](../../../skills/dev/code-inline-review/)新增显式调用的源码说明工作流、组/块格式、清理预览和路由夹具。

**agent-hooks**：[组件目录](../../../skills/meta/agent-hooks/)新增暂存内容检查 hook 和检查失败阻断选项，完善 native shell 归一化。

**Pi**：[扩展目录](../../../pi/extensions/)将 before-tool 阻断结果交给 Pi tool_call。

**发现与文档**：[插件清单](../../../.claude-plugin/plugin.json)、[README](../../../README.md)及 [Hooks RFC](../../../docs/rfcs/agent-hooks.md)增加技能入口与真实能力边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用现有 hooks 与技能发现；清理仅输出预览，不引入 Git 工作流代理。 | 受限 shell 解析有明确不支持形式，不是通用 shell 解释器。 |
| 稳定性 | A | 隔离 index 与真实扩展处理器观察覆盖放行、拒绝、失败和清理边界；repair-05.json 绑定当前 guard hash，重查 44 场景及45包装组合、普通文本和三宿主拒绝；前轮证据保留。 | 未运行单元/项目套件；外部执行、任意脚本及 index 外部并发不在保护保证内，当前会话尚未 reload。 |
| 完整性 | A | 用户确认的按需生成、逻辑关联、仅检查提交内容与 Pi 阻断均有实现和观察。 | 远端说明仅提供授权后导出流程，不自动发布。 |

## Result

- T1: 核对 SKILL.md、格式说明和 trigger_cases：仅显式启用，主块/关联块及删除例外齐全；evidence/observations-01.json 的清理预览保留 CRLF 并拒绝残缺/夹带代码。
- T2: evidence/observations-01.json：三宿主 runtime 对干净 index 放行、带标记 index 阻断；工作区与 index 分离正确。evidence/pi-adapter-01.json：实际扩展 tool_call 返回 block 与 reason。
- T3: repair-05.json 绑定当前guard hash：44既有场景无回退，45静态shell包装组合均拒绝，4普通文本放行，三宿主9次拒绝；干净index+工作区说明放行。语法/质量/whitespace通过，未跑测试套件。
- Review gate: Passed — 第五轮 fresh 独立只读 Reviewer 无发现、TR-1 resolved，无阻断Target风险；当前快照与5份报告完整性核对通过。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨宿主提交保护及共用包装器识别修复，维持独立审查。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/dab34730328d78aba25f39786373802781369b77c9100d0c937cec185ff8d7a2.json#dab34730328d78aba25f39786373802781369b77c9100d0c937cec185ff8d7a2
- Evidence: T1-T3 与绑定当前guard hash的repair-05.json，语法/质量/whitespace检查。
- Task fingerprint: b36b84884c7b9e97257cbb4cbdc7fe2a714cfa3d7534649c0da074a0e610f395
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/implement-code-inline-review/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/5163c098fe12358f6f10d29ffe8892a3d2b5549f94195d38a9ec83d02c260585.json#5163c098fe12358f6f10d29ffe8892a3d2b5549f94195d38a9ec83d02c260585 | findings | fe474adef91d6a5facc84f3b66a8a4ff56bbda3bdb70939bb7415068e578fb48 |
| 02 | [Round 02](../artifacts/implement-code-inline-review/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/41dfd6c8559204d828788983277269486c49788d9e3a2c77ed961f1edc379b34.json#41dfd6c8559204d828788983277269486c49788d9e3a2c77ed961f1edc379b34 | findings | f965f099e6cffb19b18eeb1d0f443a80c495f70471c46e7149bb0bc2ca3c2bbb |
| 03 | [Round 03](../artifacts/implement-code-inline-review/reviews/round-03.md) | snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/6f87872b72385a6d54f4139f08c145cdde0db546ba0b736690936e51458f4d99.json#6f87872b72385a6d54f4139f08c145cdde0db546ba0b736690936e51458f4d99 | findings | 887305dbd868b53955561ca5f2c67477c011234acea22be08b87b7d624655086 |
| 04 | [Round 04](../artifacts/implement-code-inline-review/reviews/round-04.md) | snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/7496f39b801075d618a07fdc971e247a5c568987b41d724c39b97b2e45333aa3.json#7496f39b801075d618a07fdc971e247a5c568987b41d724c39b97b2e45333aa3 | findings | 555c10303f904b347b91a1931618383ea8b525207c62f0f5f6bf1028c7efc128 |
| 05 | [Round 05](../artifacts/implement-code-inline-review/reviews/round-05.md) | snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/dab34730328d78aba25f39786373802781369b77c9100d0c937cec185ff8d7a2.json#dab34730328d78aba25f39786373802781369b77c9100d0c937cec185ff8d7a2 | no blocking findings | 4bc703a7f23377a41d4f10cb8b4ea1d103a230ddb64a7289e9689ddcba8f769a |

## Verification

- Passed: 最终核验：审查后23文件快照未漂移、5份报告完整性通过；5个JS语法检查与scoped diff whitespace通过；内置hook show在Pi视图valid/enabled/active；Self Assessment与最终结果一致。Skill Quality前检新包PASS、agent-hooks仅2147tokens warning。未跑单元/项目套件；当前会话未reload、未做真实提交端到端验证。
