# Analyze Project v2 Output Eval — Trial 011

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-011`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `979739ca2243aad8b4cf80e93033fa8a16ceae47950fe259417e3f2ad7795640`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖
- Frozen at: `2026-07-20T01:11:08+0800`

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式分析这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing global package: `beautiful-mermaid@1.1.3`
- ESM entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- `renderMermaidSVG` preflight: PASS（复用本轮同环境的已验证入口）；无安装、无网络

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval11.cOPvue/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval11.cOPvue/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval11.cOPvue/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval11.cOPvue/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 011 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-ef1ec36e9776-t11`
- Combined prompt/rubric SHA-256: `ef1ec36e97766d936329a7415f8cf4c3290d0c5c92609c0e92dd315dbfb6bafd`
- Frozen at: `2026-07-19T17:14:49.111Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开
- Exclusions: 不复用或近似 `json-compact`、`fail-fast`、`list-targets`、`command-timeout`、`target-alias`、`operation-cwd` 或顶层 command-admission 场景

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。保存二元评分、mapping、原始回答、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `A-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-develop.md`: `1bf109f75bbc2cca781f7b2404fb84fb5da4949ed1d9783c29bd3d1633258bd9`
- `B-learn.md`: `bbccf4f8b74baeeb957700e83dc075bf90010f5d6769fab13fe727ea8eaae4b5`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `88`（even；预注册规则为 even A=baseline/B=with-skill，odd A=with-skill/B=baseline）
- Identity mapping: A=baseline，B=with-skill
- A: Develop `0/5`，Learn visible `0/5`，Learn held-out 未运行
- B: Develop `5/5`，Learn visible `5/5`，Learn held-out `0/5`
- Replay: 一致
- Failure: B 缺有状态 filesystem effect 的精确类型/primitive/破坏窗口契约，以及 staged publication 的分阶段 fault injection 与双 renderer 回归
- Scoring SHA-256: `abc7dec5096b99ab7ed66fcc38583b3f6c201750d5f0ec8bef2f66bd6ff2a18d`
- Verdict: `FAIL`
