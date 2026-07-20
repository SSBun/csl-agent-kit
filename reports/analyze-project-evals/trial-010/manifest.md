# Analyze Project v2 Output Eval — Trial 010

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-010`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `6c369b0f595019024513427c95210fc941fad1a835dc586a2d441a79e9f3508f`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖
- Frozen at: `2026-07-20T00:54:57+0800`

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式分析这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing global package: `beautiful-mermaid@1.1.3`
- ESM entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- `renderMermaidSVG` preflight: PASS（SVG 2101 bytes）；无安装、无网络

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval10.lbEQl8/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval10.lbEQl8/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval10.lbEQl8/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval10.lbEQl8/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 010 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t10`
- Combined prompt/rubric SHA-256: `5bed0a62ea8c710c292bca81d355bd5dcde353a7346fb0eb98eccb239264315f`
- Frozen at: `2026-07-19T16:57:32.434Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开
- Exclusions: 不复用 `json-compact`、`fail-fast`、`list-targets`、`command-timeout`、`target-alias` 或 `operation-cwd` 场景

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。保存二元评分、mapping、原始回答、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `444a5c289e39e83be5c36af84f34efc11e05ca9948701fe9e2fd3d66404be99c`
- `A-learn.md`: `249b884e24ea7fe58a6784003443f88dc0c8f30c6e3309a98c70a97d0e3ee202`
- `B-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `33`（odd；预注册规则为 even A=baseline/B=with-skill，odd A=with-skill/B=baseline）
- Identity mapping: A=with-skill，B=baseline
- A: Develop `5/5`，Learn visible `5/5`，Learn held-out `2/5`
- B: Develop `0/5`，Learn visible `0/5`，Learn held-out 未运行
- Replay: 一致
- Failure: A 缺顶层 command admission 的精确默认/分支事实，以及覆盖通道、consent/persistence 与全部 sentinel 的最小迁移验证
- Scoring SHA-256: `922ae3bf475103acf90b6123722a00bdf189cf69913fa06a446d02e97a8ede39`
- Verdict: `FAIL`
