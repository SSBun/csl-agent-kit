# Analyze Project v2 Output Eval — Trial 001

## Verdict

- Status: `INVALID-INFRASTRUCTURE`
- Score: 不评分
- Reason: 输出父目录权限只开放到最终 `bin/`，与 Generator 的安全预检不兼容；Develop renderer 使用 CommonJS 加载 ESM-only global package，导致错误的不可用判断。
- Consequence: 候选生成已经开始，因此不得在本 trial 重试；按 PRD 创建全新 Trial 002 和新 sealed fixture。

## Freeze

- Trial ID: `analyze-project-v2-001`
- Frozen source: `05a6c689e2344dc925b7dc111f02aa03750114f6`
- Frozen scope: `bin/csl-agent-kit.js`
- Skill fingerprint: `ae9b34e368999d0ff661dff472d71d2e4e9e9b2548476279bd0f14b685458af3`
- Runtime: 同一 Codex GPT-5 session 的同配置独立 Agent；默认采样参数
- Tool policy: 只读源码；只开放各 arm 的预期报告父目录写入；不运行项目、构建或测试；不安装依赖

## Isolated arms

| Arm | Workspace | Skill access | Expected report |
| --- | --- | --- | --- |
| Baseline Develop | `/tmp/analyze-project-eval.BOalGR/baseline-develop` | 禁止 | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| With-skill Develop | `/tmp/analyze-project-eval.BOalGR/skill-develop` | 冻结 skill | `docs/analysis/components/file/bin/csl-agent-kit.js.md` |
| Baseline Learn | `/tmp/analyze-project-eval.BOalGR/baseline-learn` | 禁止 | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |
| With-skill Learn | `/tmp/analyze-project-eval.BOalGR/skill-learn` | 冻结 skill | `docs/analysis/learning/file/bin/csl-agent-kit.js.md` |

四个 workspace 均从同一提交创建，候选生成前 `git status --porcelain` 为空。空的预期父目录不进入 Git 状态。

## Fixed requests

- Develop：`使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。`
- Learn：`使用 learn 模式帮助我学会这个 CLI 安装组件；不要修改源代码。`

## Sealed fixture

- Author: 独立 Sealed Author；不参与 skill 编辑或候选生成
- Creation point: skill fingerprint 冻结后、候选生成前
- Fixture ID: `learn-heldout-05a6c689-t01`
- Combined prompt/rubric SHA-256: `1f1127a457aea7b3fbe1644454fb5bba3ae5030c2d0e0814d1f0a9d17fd24c07`
- Frozen at: `2026-07-19T14:11:32.301Z`
- Disclosure: 候选与 downstream 回答固定前不写共享文件、不向 Generator 公开

## Artifact lifecycle

1. Generator 只接触自己的 arm。
2. Collector 将候选或 `NO_OUTPUT` 复制到本目录，再随机匿名化。
3. Verifier 先核验全部项目事实、锚点和可见 rubric。
4. Learn 通过 Verifier 后，由只读报告的全新 downstream Agent 回答 sealed task。
5. 回答固定后解封 rubric，由独立 Scorer 逐项记 `0/1`。
6. 保存匿名映射、原始候选、验证、回答、评分及 replay verdict。
