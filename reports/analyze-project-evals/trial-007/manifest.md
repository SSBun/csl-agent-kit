# Analyze Project v2 Output Eval — Trial 007

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-007`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `a7ba53eabed14652424c40f41d71d291a4034df11960c70fd87c7130d5f8fb84`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式分析这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing global package: `beautiful-mermaid@1.1.3`
- ESM entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- `renderMermaidSVG` preflight 已成功；无安装、无网络

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval7.ywz0sy/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval7.ywz0sy/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval7.ywz0sy/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval7.ywz0sy/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 007 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t07`
- Combined prompt/rubric SHA-256: `517a8f01a71a35d684ecbd4a2c52866bb9c7dcfeca9f2f1c6b1430a4565d31df`
- Frozen at: `2026-07-19T15:54:59.621Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。保存二元评分、mapping、原始回答、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `A-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-develop.md`: `dcaf783a834b813295fb2abbf7bac840fca8efb08bfca7980cdeacb3c050809d`
- `B-learn.md`: `adf23133d1d3dadf6212bcf89a513186e6ce4d139b580907fe429c122238737b`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `162`（even，预注册规则为 A=baseline、B=with-skill）
- Identity mapping: A=baseline，B=with-skill
- A: Develop `0/5`，Learn visible `0/5`，Learn held-out `0/5`
- B: Develop `5/5`，Learn visible `5/5`，Learn held-out `1/5`
- Replay: 一致
- Failure: B 缺外部 process contract 的精确 probe/effect primitive、当前 resource-limit 状态与具体调用序列验证
- Scoring: `scoring.md`
