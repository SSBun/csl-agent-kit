# Analyze Project v2 Output Eval — Trial 006

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-006`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `64015d5a1f1626aa461280ecd1a9be3bccda92107d521b31698f247749297ec1`
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
| Baseline Develop | `/tmp/analyze-project-eval6.wqg29e/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval6.wqg29e/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval6.wqg29e/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval6.wqg29e/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 006 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t06`
- Combined prompt/rubric SHA-256: `5bac38474edb27a0a278e1ad1eefb5f32137213994ea28ff77be9e7c2adf2350`
- Frozen at: `2026-07-19T15:29:48.564Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。保存二元评分、mapping、原始回答、replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `A-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-develop.md`: `5c1f7abcfc1e69bdb3d72c83638ecb68be7e1f19d99923a6859a9237816cade5`
- `B-learn.md`: `7d22d23c8545d5480fd09d41b7aacadbf5262ecae2220763939cc459dd1c64f6`
- Identity mapping: sealed until scoring completes

## Result

- Random byte: `60`（even，预注册规则为 A=baseline、B=with-skill）
- Identity mapping: A=baseline，B=with-skill
- A: Develop `0/5`，Learn visible `0/5`，Learn held-out `0/5`
- B: Develop `5/5`，Learn visible `5/5`，Learn held-out `1/5`
- Replay: 一致
- Failure: B 未满足 registry 精确声明顺序/策略投影、CI/non-TTY admission 与 selection I/O 早退链、对应真实 CLI 验证
- Scoring: `scoring.md`
