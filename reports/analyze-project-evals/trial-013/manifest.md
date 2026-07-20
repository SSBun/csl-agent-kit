# Analyze Project v2 Output Eval — Trial 013

## Freeze

- Status: `RUNNING`
- Trial ID: `analyze-project-v2-013`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `1271ca79fdb070bfbbf1715ff213d1dec928bfa9af1d047524651f109f0e3f33`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖
- Frozen at: `2026-07-20T01:55:17+0800`

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式分析这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing global `beautiful-mermaid@1.1.3` entry verified; no install/network.

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval13.RlUFr5/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval13.RlUFr5/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval13.RlUFr5/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval13.RlUFr5/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 013 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-9f86d696ef34-t13`
- Combined prompt/rubric SHA-256: `9f86d696ef343493a559e21e548534f722d63de7437da4d698452a1a27568589`
- Frozen at: `2026-07-19T17:56:58.711Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开
- Exclusions: 不复用 Trial 001–012 的 output、dispatcher、discovery、process、alias、effect context、command admission、symlink publication 或 external authorization 场景

## Protocol

Collector 保存候选后随机匿名化；Verifier 先做事实与 visible 二元评分，仅满分 Learn 进入全新 downstream；回答固定后解封 rubric，保存 replay 与 verdict。

## Frozen anonymous candidates

- `A-develop.md`: `fc6d5677f61ca78e4a99508b4286ecf59f09a37d28d981ddc4ecd681c31c4d38`
- `A-learn.md`: `792c46aae5cbadf90a24f9888cdc0c4e9eb00363775a86f714eaa345b91918b5`
- `B-develop.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- `B-learn.md`: `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40`
- Identity mapping: sealed until scoring completes

## Result

- Identity mapping: sealed
- Scores: `PENDING`
- Replay: `PENDING`
- Verdict: `PENDING`
