# Analyze Project v2 Output Eval — Trial 008

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-008`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `c9d0787b07c25c3ab201a8f89e4756e9eb5146f6629f23efb8014a03c13dbcfd`
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
| Baseline Develop | `/tmp/analyze-project-eval8.uMPCij/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval8.uMPCij/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval8.uMPCij/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval8.uMPCij/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 008 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t08`
- Combined prompt/rubric SHA-256: `c19befdecb85cebd1de91c335e27e6ee309abbbf4bc52ca851e416338a20cda6`
- Frozen at: `2026-07-19T16:16:40.369Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。保存二元评分、mapping、原始回答、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `807d76bc01834b1400defa7d67838e3fd46e31936bb6771b517b991dc1763234`
- `A-learn.md`: `26415f7a0b837fa32f4ac52817f18d8a4368f8301a595b22bdf4f55c3729fcf8`
- `B-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `223`（odd，预注册规则为 A=with-skill、B=baseline）
- Identity mapping: A=with-skill，B=baseline
- A: Develop `5/5`，Learn visible `5/5`，Learn held-out `1/5`
- B: Develop `0/5`，Learn visible `0/5`，Learn held-out `0/5`
- Replay: 一致
- Failure: A 缺显式 selector 语法汇流、`splitTargets`、validation/dedupe 顺序及 alias 的具体 handler 调用验证
- Scoring: `scoring.md`
