# Analyze Project v2 Output Eval — Trial 003

## Freeze

- Status: `FAIL`
- Trial ID: `analyze-project-v2-003`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `4b54ea55a2bc43a268f7de20d0399dc04e9b2f16246c6100eb56981897f1f0dd`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的 `docs/analysis/` 输出树写入；不运行项目、构建或测试；不安装依赖

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式帮助我学会这个 CLI 安装组件；不要修改源代码。`

## Mermaid validator

- Existing package: global `beautiful-mermaid@1.1.3`
- Entry: `file:///Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`
- Preflight: ESM `renderMermaidSVG` 已真实渲染最小图；无安装、无网络

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval3.Ilv3jp/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval3.Ilv3jp/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval3.Ilv3jp/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval3.Ilv3jp/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: Trial 003 fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t03`
- Combined prompt/rubric SHA-256: `fb8c2b9b6d8a9868662779cc27b1fd79c93a4b04f7a372d9e115386955882dfc`
- Frozen at: `2026-07-19T14:34:49.418Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Protocol

Collector 保存候选或 `NO_OUTPUT` 后随机匿名化；Verifier 先核验全部事实与可见五项。Learn 通过后由全新 downstream Agent 只读匿名报告和 sealed prompt 回答；回答固定后才解封 rubric。二元评分、mapping、原始回答、replay 与 verdict 全部持久化。

## Collected anonymous artifacts

| Artifact | SHA-256 | Workspace result |
| --- | --- | --- |
| `anonymous/A-develop.md` | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT`；clean |
| `anonymous/B-develop.md` | `900918192f955d6a033d8a8f81f0e9c01c8197b5e24bea70d299016b457dd96f` | 唯一预期报告 |
| `anonymous/A-learn.md` | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT`；clean |
| `anonymous/B-learn.md` | `43fc6f77cf2ce8f2d577da0eeff30a0a5630098f856fa466ca5ecafd2522fe4f` | 唯一预期报告 |

Develop B 的最终 Mermaid 写前、写后均由现有 ESM renderer 成功渲染，并返回同一 `14890` bytes SVG。Learn B 未生成 Mermaid。评分前不披露身份映射。

## Final result

- Anonymous mapping after Stage 1: `A = baseline`，`B = with-skill`（随机字节 `70`，偶数规则）
- Develop: A `0/5`，B `5/5`
- Learn visible: A `0/5`，B `2/5`
- Held-out: 未启动，fixture 未解封
- Verdict: `FAIL`
- Failed visible dimensions: 默认选择预测、consent 拒绝分支、非默认职责迁移与聚焦检查链。
- Consequence: skill 根据可泛化覆盖缺口更新；新候选使用 Trial 004、新 fingerprint 与新 sealed fixture。
