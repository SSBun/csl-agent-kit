# 精简 Task Target 对齐设计

Status: Completed (2026-08-29 09:17)
Kind: Plan

## Scope

- Included: 精简当前未提交的 Task Target 可见对齐改动，重新划分共享协议、三个 task-family consumer、稳定 Agent 规则、routing fixtures、行为断言与 Context 的职责。
- Excluded: 改变已确认的可见对齐行为、修改 task core 状态模型、增加生成器／include／兼容层或改动其他产品代码。

## Target
- [x] T1: 共享 Task Target Alignment Protocol 成为详细对齐语义的唯一权威，task、task-plan、task-queue 及行为断言不再复制会随协议变化的展示与确认细节。
- [x] T2: 非平凡 Target 展示一次、等价时直接继续、实质差异时等待确认、琐碎确定性文件编辑保留等价展示例外等现有行为保持不变。
- [x] T3: consumer、稳定 Agent 规则、routing fixtures、测试与 Context 各自只保留所属职责，相关结构和质量检查通过。

## Decisions

- `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md` 是唯一详细语义权威，继续独占 readiness、展示模板、非平凡展示门禁、琐碎编辑例外、双向实质等价、确认输入、修订、重新对齐和独立安全门；不新增第二个共享层。
- `task`、`task-plan`、`task-queue` 只保留协议加载失败边界、各自的激活时机、Target 含义、对齐前允许的 lifecycle writes 与对齐后下一步。三份 `SKILL.md` 删除新增的详细语义枚举和 `It presents every ready Target...` 句，改用不会随协议细节变化的通用 ownership 句；`task` frontmatter 只保留路由所需的“对齐后再工作”语义。
- `super-agent/AGENTS.md` 与 `super-agent/workspace-workflow-gates.md` 仍须自包含稳定行为：先激活和聚焦、非平凡 Target 展示一次、等价时直接继续、实质差异时等待确认、琐碎确定性编辑保留等价展示例外，以及对齐前禁止实质工作。格式、反事实判定、确认快捷输入和修订细节只留在共享协议。
- 三个 `evals/trigger_cases.json` 与 `task/evals/semantic_config.json` 只服务 skill 路由，不承载“必须展示”等运行时验收语义；撤回仅为同步行为文案而加入的 fixture／phrase 变更。
- `tests/task-files.test.mjs` 对共享协议只做一组完整行为断言；consumer 循环只断言共享协议引用、加载要求、通用 ownership 和各自 Target／lifecycle 边界。稳定规则只断言精简后的不变量。`tests/agent-hooks.test.js` 与 `tests/pi-context-hooks.test.mjs` 只证明完整稳定契约被注入，不重复验证协议细节。
- `tasks/context.md` 仅保存“协议是详细 Authority、consumer 的职责、四项可观察行为及稳定规则边界”的短摘要，删除可从协议直接读取的模板、快捷输入和逐分支算法复述。
- 执行时基于当前 worktree 做精确编辑，不回退整份文件，也不覆盖本轮已创建的 task records；Skill 与 eval-facing prose 保持英文，Context 与 task record 保持中文。

## Plan

1. 以当前四项可观察行为建立变更前后对照：非平凡 Target 展示一次；等价时同轮继续；实质差异时展示并等待；仅由琐碎确定性文件编辑触发且等价时可省略展示。
2. 保留共享协议中的全部详细语义，精简 `task`、`task-plan`、`task-queue` 的 ownership 与 gate 文案，使后续展示或确认细节变更无需再修改三个 consumer。
3. 精简两份 `super-agent` 稳定规则，只保留触发、顺序、强制可见性、等价／差异分流、琐碎例外和对齐前边界；同步把 Context Pack 改为 Authority 指针与短行为摘要。
4. 将三个 routing fixtures 和 semantic config 恢复为路由关注点；合并 `tests/task-files.test.mjs` 中的详细协议断言并删除 consumer 语义重复，在两个 hook 测试中只保留契约注入证据。
5. 运行修改后 JSON 解析、JS 语法检查、三个 Skill Quality gate、Context validate、旧重复文案搜索和 `git diff --check`。项目测试仅在后续执行请求明确授权时运行；若授权，聚焦运行 task-files 与两个 hook 测试。

## Result

- T1: 三个 consumer 现在只声明 workflow-specific ownership，并统一写明共享协议拥有全部 Task Target 对齐语义；静态检查确认 consumer 不再复制展示或确认细节。
- T2: 共享协议继续独占四项行为及详细分支；两份稳定 Agent 规则保留非平凡展示、等价直行、差异确认和琐碎编辑例外，行为矩阵检查通过。
- T3: routing fixtures 与 semantic config 已移除运行时细节，task-files 集中验证协议，hook tests 不再重复；Context 已压缩，JSON、JS 语法、三个 Skill Quality、Context validate 与 diff check 均无失败。
- Review gate: Skipped — 用户未要求 adversarial review、Reviewer–Editor 循环或独立批准。

## Verification

- Passed: alignment ownership 静态契约检查、JSON 解析、JS 语法、Context validate、git diff --check 与三个 Skill Quality gate 通过；按用户规则未运行未授权的项目测试。
