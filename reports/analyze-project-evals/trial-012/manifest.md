# Analyze Project v2 Output Eval — Trial 012

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-012`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `d9c37535229f96efeab82527875d6b9b08eddc020624c5399108506f160ec42e`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖
- Frozen at: `2026-07-20T01:36:20+0800`

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式分析这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing global `beautiful-mermaid@1.1.3` ESM entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- Preflight: PASS；无安装、无网络

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval12.QDWuaP/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval12.QDWuaP/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval12.QDWuaP/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval12.QDWuaP/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 012 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-8ac09f934c18-t12`
- Combined prompt/rubric SHA-256: `8ac09f934c18f296a8247b00480265ce318e6dfd58bcf6a078e2fd63661cd2ba`
- Frozen at: `2026-07-19T17:38:32.390Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开
- Exclusions: 不复用或近似 Trial 001–011 的 output、dispatcher、discovery、process timeout、alias、operation context、command admission 或 symlink atomic replacement 场景

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验事实与可见五项。Learn 满分后由全新 downstream Agent 只读匿名报告和 sealed prompt，固定回答后才解封 rubric；保存二元评分、mapping、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `A-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-develop.md`: `c392fab68b393de0d3fb4049f6e771fc4d4828e2fc46a139ff2c546ee3b7a07a`
- `B-learn.md`: `b76bb82d21bf40a1fcbf39d3a653bf08febee8544b45e026710df3eb6f19476d`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `234`（even；预注册规则为 even A=baseline/B=with-skill，odd A=with-skill/B=baseline）
- Identity mapping: A=baseline，B=with-skill
- A: Develop `0/5`，Learn visible `0/5`，Learn held-out 未运行
- B: Develop `5/5`，Learn visible `5/5`，Learn held-out `2/5`
- Replay: 一致
- Failure: B 缺 authorization policy 的全 selector/precedence 矩阵、interactive atomic persistence 明示，以及 live/dry-run 与 parser-error 双向回归
- Scoring SHA-256: `f313d5ee837c251fbaa957466649ab927518801e2b5dce592a04f52ff8be1711`
- Verdict: `FAIL`
