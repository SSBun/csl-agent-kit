# 更新内置规则的本地链接目标格式

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 16:33) |
| Artifacts | [Artifacts](../artifacts/builtin-local-link-target/) |
| Kind | Task |

## Target
- [x] T1: 内置规则要求本地链接使用完整绝对 file URL 且目标不加尖括号，标签不限

## Execution Log

### 001 — 更新内置规则并验证注入

使用 agent-rules 技能，只修改内置规则首项，保留英文写作规则。规则要求本地文件及目录链接使用完整绝对 file URL，禁止目标尖括号及普通路径目标，明确标签不限及 URL 编码。Hook show 返回 active/valid；Python 直接调用真实注入器，确认输出按内置、用户、项目顺序与源文件拼接一致，列表结构断言及 git diff --check 通过。用户级规则仍含旧的完整路径标签要求，不在本次内置规则修改范围内；宿主更高优先级限制仍有效。不宣称所有作用域的实际链接行为已统一。未运行测试。

## Task Summary

**内置 Agent Rules**：更新本地文件和目录的 Markdown 链接规则，限定目标格式并取消标签限制。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 仅替换现有路径规则，保留其余规则。 | 无已知实质缺口。 |
| 稳定性 | A | 列表结构、真实注入结果及作用域合并顺序已核对；Hook 有效。 | 后续作用域存在旧标签要求，宿主更高优先级格式限制仍适用；本次不改这些来源。 |
| 完整性 | S | 内置规则明确绝对 file URL、无目标尖括号、标签不限及字符编码。 | 仅完成内置源规则修改；未运行测试或验证界面点击行为。 |

## Result

- T1: 内置规则已明确完整绝对file URL、目标无尖括号且标签不限；真实注入器确认加载该内容
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 局部非Skill规则文本更新
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/builtin-local-link-target/evidence/6a2ac10936740b2e08dd9279c662d8f4636f6f829b81208e9987564f670cfefe.json#6a2ac10936740b2e08dd9279c662d8f4636f6f829b81208e9987564f670cfefe
- Evidence: Hook active/valid；Python验证实际注入及三作用域合并；git diff --check通过
- Result clarity: 按用户修正取消标签限制，仅约束目标格式
- Bounded impact: 仅内置规则首项，其余规则及加载器未修改
- Low risk: 可恢复的文本约定更新；已披露用户级旧规则及宿主限制
- Sufficient verification: 列表结构和实际注入输出检查通过；未运行测试或点击验证
- Task fingerprint: e37e9026560139d3cde8062a747e3796458ed03df77fed6026d8b27fbac34b37

## Verification

- Passed: 快照绑定当前内置规则，实际注入包含新规则且合并顺序正确；其他作用域冲突已披露
