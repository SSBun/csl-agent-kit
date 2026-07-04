# Yao Meta Skill 优化机会复审

生成时间：2026-07-03
审计范围：`/Users/caishilin/Desktop/personal/skills/skills/*/SKILL.md`，共 17 个 skill。
输出文件：`/Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-optimization-opportunities-2026-07-03.md`

## 结论

当前没有必须立刻修复的硬失败。

- OpenAI `quick_validate.py`：17/17 通过。
- Yao `resource_boundary_check.py`：17/17 通过。
- Yao Atlas：route collision 0，shared resource 0，no-route opportunity 0。
- `skill_atlas/policy.json` 已生效，Yao metadata 缺口继续作为 release-only gate。

剩余优化机会主要是：3 个 `SKILL.md` 接近 1000 token 预算、Yao-governed 发布 metadata 尚未补齐、少量跨平台措辞可更中性。

## 优化机会

### P1. 压缩 3 个接近预算的入口文件

这不是失败，但已经接近 Yao production 入口预算。建议在下一次触碰这些 skill 时顺手把长表格或分支说明移到 `references/`。

| Skill | 初始 tokens | 证据 | 建议 |
| --- | ---: | --- | --- |
| `sop-manager` | 974 | `skills/sop-manager/SKILL.md:19` 起包含 SOP schema、模板、learn 规则 | 把 SOP 文件格式和创建模板移到 `references/sop-format.md`，入口只保留命令骨架 |
| `venom-cli` | 949 | `skills/venom-cli/SKILL.md:48` 起包含命令清单和 build/make 决策 | 把命令目录和 build 决策表移到 `references/venom-command-guide.md` |
| `test-triage` | 925 | `skills/test-triage/SKILL.md:44` 起包含 flaky/CI 细节 | 把 flaky/CI 分支细节移到 `references/test-triage-cases.md` |

预期收益：每个入口降到约 450-700 tokens，减少后续新增规则时再次超预算的概率。

### P2. Yao-governed 发布 metadata 仍是 release-only gate

Atlas 仍记录 17/17 skills 缺 `owner`、`review_cadence`、`maturity`，且缺 `updated_at`。这符合当前策略：OpenAI/Codex 是主要运行时，Yao metadata 不阻塞日常使用。

如果未来要发布为 Yao-governed package，再补：

- `agents/interface.yaml`
- `owner`
- `maturity`
- `review_cadence`
- `updated_at`

当前不建议现在批量补，原因是会增加跨平台 metadata 维护成本，而没有新的运行时收益。

### P3. 可选：给高混淆风险技能加最小 trigger eval

Atlas 没有发现 route collision，所以这不是当前 blocker。若要提高回归保护，优先给这些近邻技能加小型 trigger eval：

| 近邻组 | 原因 |
| --- | --- |
| `brainstorming` / `grill-me` / `repo-map` | 都可能发生在“开始实现前”，但一个是需求探索、一个是计划拷问、一个是代码库定位 |
| `handoff-save` / `handoff-restore` | 触发词相近，适合用正反例固定边界 |
| `sop-manager` / `release` | release skill 依赖 SOP 路由，适合保护“发布前路由”边界 |

最小做法：每组只加 5-8 个正反例，不引入复杂评测框架。

### P4. 跨平台措辞可以更中性

`create-app-icon` 和 `grill-me` 仍提到 Claude Code 专属的 `AskUserQuestion`：

- `skills/create-app-icon/SKILL.md:30`
- `skills/grill-me/SKILL.md:32`

这不影响校验，但这个仓库同时服务 Claude、Cursor、Codex。建议下次触碰时改成“use the available user-input tool when present; otherwise ask in chat”，减少平台耦合。

### P5. 报告内容可以更少保留历史失败细节

`docs/analysis/yao-meta-skill-portfolio-audit.md` 已有“修复状态”，但下半部分仍保留修复前的失败表。作为历史审计证据可以保留；如果后续只想让报告服务当前状态，可把修复前长表移动到 appendix。

## 当前不建议做的事

- 不建议现在批量生成 Yao `agents/interface.yaml`：这是 release-only gate，不是当前运行 blocker。
- 不建议给所有 skill 都加 eval：Atlas 无 route collision，先给近邻组加最小 eval 即可。
- 不建议继续压缩已经低于 800 tokens 的入口：收益小，容易损失可读性。

## 复跑命令

```bash
python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py skill-atlas --workspace-root /Users/caishilin/Desktop/personal/skills --output-dir /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit --report-json /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.json --report-html /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.html --today 2026-07-03
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py "$d"; done
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/resource_boundary_check.py "$d"; done
```

## 原始数据摘要

| Skill | 初始 tokens | Boundary |
| --- | ---: | --- |
| `sop-manager` | 974 | pass, warning |
| `venom-cli` | 949 | pass, warning |
| `test-triage` | 925 | pass, warning |
| `inject-may-agents` | 768 | pass |
| `grill-me` | 758 | pass |
| `repo-map` | 704 | pass |
| `handoff-restore` | 689 | pass |
| `create-app-icon` | 670 | pass |
| `code-reviewer` | 593 | pass |
| `beautiful-mermaid` | 561 | pass |
| `brainstorming` | 543 | pass |
| `analyze-project` | 492 | pass |
| `figma-describe` | 486 | pass |
| `same-page` | 452 | pass |
| `handoff-save` | 405 | pass |
| `release` | 231 | pass |
| `tips` | 223 | pass |
