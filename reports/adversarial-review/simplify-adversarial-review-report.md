# Adversarial Review: 轻量化 adversarial review 最终报告

## Discussion results

### R1 — 默认模板仍强制创建审查任务状态

- Finding: 可分发 `AGENTS.md` 仍要求 adversarial review 创建 task 和 `## Review status`，与轻量 skill 契约冲突。
- Required outcome: 默认模板不规定审查专用 task、字段或同步行为；纯只读 review 不因报告本身创建 task。
- Reviewer position:

  - 审查专用 task/status 规则属于易变的 skill 行为，不应留在 prompt-cached `AGENTS.md`。
  - 通用 task 规则不应把纯只读 review 当成 deliverable-changing work。

- Editor response:

  - 接受问题，删除 adversarial-review 专用 task/status 条款。
  - 将通用 task 条款收窄为只覆盖会改变 deliverable 的非简单工作。

- Resolution: 默认模板只保留稳定的任务原则；审查报告不再自行制造 task 或中间状态同步。

### R2 — self-review 与独立审查的触发边界

- Finding: 初始 routing eval 未覆盖 self-review，后续过宽的负向短语又会误杀合法的独立 Reviewer–Editor 请求。
- Required outcome: 明确由当前 Agent 本人执行且拒绝独立角色的审查不触发；明确要求独立 Reviewer–Editor 的请求继续触发。
- Reviewer position:

  - 触发规则必须按实际执行审查的角色区分，而不是按 artifact 是否属于当前 Agent 区分。
  - `use no other agent` 单独出现时也可能只是把参与者限制为 Reviewer 与 Editor，不能直接视为 self-review。
  - 正负对照应覆盖常见 paraphrase，而不只验证一个固定句型。

- Editor response:

  - 将 self-review 负向匹配收窄为包含 `review ... yourself` 等本人执行语义的复合表达。
  - 删除孤立的 `use no other agent` exclusive phrase。
  - 增加本人自审负例、独立审查正例和冲突正例；最终 routing eval 为 28/28，无误触或漏触。

- Resolution: self-review 与独立 Reviewer–Editor 请求已按执行角色分开，routine Wiki 写入仍不触发。

## Final decision

- Decision: APPROVED
- Outcome: adversarial-review 保留原有 fail-closed 审查循环，但只在结束或暂停时写一次轻量报告；报告仅包含实质讨论结果和最终决定，双方核心观点使用列表呈现。
- Remaining: none
