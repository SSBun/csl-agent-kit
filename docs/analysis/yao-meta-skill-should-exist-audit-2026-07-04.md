# Yao Meta Skill Should-Exist Audit

生成时间：2026-07-04
审计范围：`/Users/caishilin/Desktop/personal/skills/skills/*/SKILL.md`，共 17 个 skill。
输出文件：`/Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-should-exist-audit-2026-07-04.md`

## 结论

按 Yao 的 non-skill decision tree 检查后，当前没有发现应该立刻删除的 skill。

理由：

- Yao Atlas：route collision 0，shared resource 0，no-route opportunity 0。
- 17 个 skill 都有明确触发面，且多数承担“重复工作流、边界容易混淆、可发现性或可复用检查”之一。
- `release`、`tips`、`inject-may-agents` 这类看起来很小的 skill 仍有路由/安全边界价值，不建议直接删除。

## 判定标准

来自 Yao `non-skill-decision-tree.md`：

- 解释、总结、翻译、一次性问答：不应该成为 skill。
- 纯 wiki/知识库内容、没有 agent execution 的文档：更适合文档。
- 纯确定性工具且路由不难：更适合脚本。
- 只有在工作流会重复、可发现性重要、需要边界、或复用指令/检查能降低成本时，才保留为 skill。

## 候选项

### Keep, but watch: `release`

位置：`/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md`

它本身只是 release SOP 的路由器，理论上可以被 `sop-manager` 覆盖。但发布是高风险动作，单独 skill 能把“发布入口”显式化，并强制走 `release-orchestrator`，避免 agent 编造 npm/PyPI/Cargo/Xcode 发布流程。

建议：保留。只有当 SOP 自动路由足够稳定，并且 release skill 的触发 eval 证明没有额外收益时，再考虑删除。

### Keep, but consider merging later: `grill-me`

位置：`/Users/caishilin/Desktop/personal/skills/skills/grill-me/SKILL.md`

它和 `brainstorming` 都发生在实现前，但边界不同：`brainstorming` 用于需求不清，`grill-me` 用于已有方案的压力测试。这个差异是真实路由边界，不是纯文档。

建议：保留。下一步可给 `brainstorming` / `grill-me` 加 near-neighbor trigger eval，验证不会互相误触发。若长期使用中混淆严重，再合并。

### Keep, but justify by usage: `create-app-icon`

位置：`/Users/caishilin/Desktop/personal/skills/skills/create-app-icon/SKILL.md`

它目前没有脚本、reference 或 eval，形式上像一段可复用提示词。但它包含重复的项目分析、平台 safe-zone、概念选择和确认流程，适合路由成轻量 scaffold skill。

建议：保留为 scaffold。若后续很少使用，可降级为 wiki/template；若继续使用，补 3-5 个 trigger cases 即可。

### Keep, but could become script docs: `beautiful-mermaid`

位置：`/Users/caishilin/Desktop/personal/skills/skills/beautiful-mermaid/SKILL.md`

这是一个薄封装，核心是调用已安装 npm 包。若用户只需要确定性 CLI，它可以退化成脚本文档。但它还承担依赖预检、安装确认、渲染输出和主题选择的路由说明。

建议：保留。只有当仓库改为统一 diagram CLI/script，并且无需 agent 选择图表类型或输出形态时，再改成纯脚本文档。

### Keep: `tips`

位置：`/Users/caishilin/Desktop/personal/skills/skills/tips/SKILL.md`

它有真实写入副作用和误触发风险。刚刚已收紧触发边界，并加入 eval。因为需要保护 `~/.ssbun-skills/tips/tips.md` 的写入确认，这个 skill 应继续存在，而不是变成普通脚本。

## 明确不建议删除的技能组

| Skill | 保留原因 |
| --- | --- |
| `analyze-project` | 多报告项目分析，重复 workflow 明确 |
| `repo-map` | 代码库定位边界明确，避免无序探索 |
| `code-reviewer` | 审查输出结构和风险优先级明确 |
| `test-triage` | bug/CI 诊断流程可复用且高风险 |
| `handoff-save` / `handoff-restore` | 会读写跨会话状态，需要明确边界 |
| `sop-manager` | 管理 SOP 的核心入口，有脚本和用户数据边界 |
| `figma-describe` | Figma MCP 解析流程可复用，且避免直接跳到实现 |
| `same-page` | 用户要求重新对齐时，需要证据/置信度/图示输出契约 |
| `inject-may-agents` | 显式调用、写入前展示内容，是安全边界 skill |
| `venom-cli` | 项目/公司特定 CLI，包含确认和安全规则 |

## 最小后续动作

不建议现在删除任何 skill。更小的下一步是：

1. 给 `brainstorming` / `grill-me` 做 near-neighbor trigger eval。
2. 给 `create-app-icon` 做 3-5 条 trigger eval，验证它不是普通 prompt 文档。
3. 如果要减少数量，先观察使用频率，再考虑把 `beautiful-mermaid` 降级成脚本文档。

## 验证

已运行：

```bash
python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py skill-atlas --workspace-root /Users/caishilin/Desktop/personal/skills --output-dir /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit --report-json /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.json --report-html /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.html --today 2026-07-04
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/resource_boundary_check.py "$d"; done
```
