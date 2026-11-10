# 将七个专用 SOP 移到用户级

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-09 18:11) |
| Kind | Task |

## Target
- [x] T1: code-style 保留内置，其余七个现有内置 SOP 移到用户级，内容及必要引用保持可用，不覆盖用户已有不同内容。

## Execution Log

### 001 — 完成用户级迁移

目标目录不存在同名冲突。迁移七个 SOP 和九份专用参考文档到 /Users/caishilin/.csl-agent-kit/sops，保留原始字节；迁移后的 references 相对于用户 SOP 目录解析。内置只保留 code-style 及其参考资料。实际摘要脚本已将七个 SOP 标为 user。按非技能 SOP 变更规则检查 YAML 头部、章节和完成清单，不运行单元测试。

## Task Summary

**SOP 存储范围**：[内置组件](../../../skills/meta/agent-sops/)移出七个专用 SOP 及九份依赖文档；[用户 SOP 目录](/Users/caishilin/.csl-agent-kit/sops/)接收完整内容，内置保留 code-style。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 直接移动原始文件，无新增加载机制或冗余副本。 | 无已知实质缺口。 |
| 稳定性 | S | 16 个文件逐字节对比 Git HEAD 一致；所有相对参考可解析，目标无覆盖冲突，摘要发现来源正确。 | 未运行单元测试；当前会话初始目录摘要不会自动重写。 |
| 完整性 | S | 内置仅剩 code-style；七个目标 SOP 均显示为 user，九份依赖随迁。 | 用户级内容位于本机，不随仓库分发，符合本次范围调整。 |

## Result

- T1: 七个 SOP 与九份参考文档已迁入用户目录；16 个文件与 Git HEAD 逐字节一致；内置仅保留 code-style；摘要脚本确认七项来源 user；引用、YAML 头部和完成清单检查通过；git diff --check 通过。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 不改变内容的确定性文件迁移，发现器已验证用户目录支持
- Snapshot: user-sops:sha256:70c1017f39932dbfc6a3bfd0f44cc8443b473d80e043761ab423a6fcad366427; 对应16个仓库原文件删除，目标内容逐字节等于Git HEAD
- Evidence: Execution Log 与 Self Assessment；摘要实际执行和16文件字节核对
- Result clarity: 保留 code-style，移动其余七项及必要依赖
- Bounded impact: 仅SOP与专用参考文档位置改变，加载器不变
- Low risk: 无同名覆盖，原文完整，属于可逆本机文件迁移
- Sufficient verification: 实际摘要来源、目标字节、引用、头部结构与差异检查通过，未运行测试
- Task fingerprint: a24955343f65ab393febcad7423c15739de7b13e7930bfaa6c5130d07c101de3

## Verification

- Passed: 迁移后重新对照 Git HEAD 检查全部16个文件一致；七项用户来源有效；内置仅有code-style。
