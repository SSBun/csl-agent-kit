# Analyze Project v2 Output Eval — Trial 002

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-002`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `ae9b34e368999d0ff661dff472d71d2e4e9e9b2548476279bd0f14b685458af3`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式帮助我学会这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing package: global `beautiful-mermaid@1.1.3`
- Entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- Preflight: 使用 ESM dynamic import 调用 `renderMermaidSVG`；最小图已真实渲染成功
- Install/network: 无

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval2.N3c7rB/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval2.N3c7rB/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval2.N3c7rB/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval2.N3c7rB/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: skill fingerprint 冻结后、Trial 002 候选生成前
- Fixture ID: `learn-heldout-05a6c689-t02`
- Combined prompt/rubric SHA-256: `ce7e4b7cf7ed8169d6dda4fb6253ab268d607e69cd5ef94f529d3d16c91b2ea0`
- Frozen at: `2026-07-19T14:16:50.522Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Scoring and replay

1. Collector 保存候选或 `NO_OUTPUT`，再随机标为 `A`、`B`。
2. Verifier 先逐项核验全部项目事实、锚点和可见 rubric；不补全候选缺失内容。
3. Develop 五项逐项 `0/1`；with-skill 必须 `5/5` 且领先 baseline。
4. Learn with-skill 先通过可见五项；再由新 downstream Agent 只读匿名报告和 sealed prompt 作答。
5. 回答固定后解封 rubric，五项逐项 `0/1`；with-skill 必须 `5/5` 且领先 baseline。
6. 保存匿名映射、原始候选、验证、回答、解封 prompt/rubric、评分及 replay verdict。

## Collected anonymous artifacts

| Artifact | SHA-256 | Workspace result |
| --- | --- | --- |
| `anonymous/A-develop.md` | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT`；clean |
| `anonymous/B-develop.md` | `65de62175026b44747f25ac63fb20924478ee58d2c1e654cec83e3b2f759b582` | 唯一预期报告 |
| `anonymous/A-learn.md` | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT`；clean |
| `anonymous/B-learn.md` | `59c2301b03a0727e477991fb3534d1163ab96c358a37c8c07a14e931125b3cc3` | 唯一预期报告 |

Develop B 的最终 Mermaid 经现有 ESM renderer 写前、写后各渲染一次，均成功并返回同一 `13045` bytes SVG。Learn B 未生成 Mermaid。评分完成前不在本文件记录身份映射。

## Final result

- Anonymous mapping after scoring: `A = baseline`，`B = with-skill`（随机字节 `156`，偶数规则）
- Develop: A `0/5`，B `5/5`
- Learn visible: A `0/5`，B `5/5`
- Learn held-out: A `0/5`，B `4/5`
- Verdict: `FAIL`
- Failed dimension: 最小验证未同时明确隔离持久状态、成对比较与相关拒绝分支。
- Replay: `scoring.md` 从保存 artifacts 重算为同一 `FAIL`。
- Consequence: skill 根据可泛化缺口更新；任何新候选使用 Trial 003、新 fingerprint 与新 sealed fixture。
