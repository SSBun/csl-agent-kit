# 实现 Task Target Alignment 评测 MVP

Status: Completed (2026-08-29 11:12)
Kind: Task

## Scope

- Included: 64-case decision gold corpus、离线 validator／prepare／score／compare CLI、固定自检、project-local skill／suite 文档和 Context 同步。
- Excluded: 付费模型调用、formation semantic judge、完整 session replay、dashboard、生产 guard 或共享 task skill 改动。

## Target
- [x] T1: 项目级 Task Target Alignment suite 包含版本化 oracle decision cases，覆盖等价、增加、遗漏、弱化、修订、歧义、implementation-only、琐碎编辑、plan／queue 和 safety gate；人工 adjudication 前保持 report-only。
- [x] T2: 离线 Node CLI 提供 validate、prepare、score、compare，并分别计算 guard 过松、过紧、可见性、稳定性和 baseline regression 指标。
- [x] T3: project-local eval skill 与 suite 文档能够准确指导 fresh-context subagent 运行和结果处理，缺少付费模型预测时不伪造结果。
- [x] T4: 评测 MVP 通过确定性自检、fixture／sample 验证、Skill Quality、Context 和 diff 检查，且不修改生产 guard 或执行未授权付费模型调用。

## Plan

1. 定义 64 个 versioned decision cases 与严格 oracle schema，使用 contrast pairs 覆盖十个主要 family 和 no-task/readiness 边界。
2. 用单文件 Node CLI 实现 `validate`、`prepare`、`score`、`compare` 与 `--self-test`，保持模型执行在外部 adapter。
3. 同步 project-local eval skill、suite／scripts 文档、layout validator 和 Context，使实际命令、artifact 边界及安全约束一致。
4. 运行 CLI self-test、fixture validation、prepare oracle-leak check、固定 perfect／regression samples、Skill Quality、Context validate、语法和 diff 检查；不运行项目测试或付费模型 eval。

## Result

- T1: cases.json 通过 v1 validator：32 个双变体 contrast scenarios 展开为 64 cases，覆盖 18 families、5 actions、task/plan/queue/none；oracle 为 provisional 且 gateMode 为 report-only。
- T2: 离线 CLI 已实现 validate/prepare/score/compare/self-test；perfect 3-repeat baseline 通过，loose、tight、visibility 与 critical regression 均被检测，报告含分层 rates、family、stability、dimensions 和 Wilson 上界。
- T3: project-local skill 与 suite/scripts 文档已同步 64-case、16×3 fresh subagent batching、oracle 隔离、results 边界和命令；prepare 实测生成 64 个 self-contained oracle-free packets。
- T4: layout、Node 语法、fixture validate、self-test、prepare leak check、Skill Quality、Pi project discovery、Context validate、task check 与 diff check 全部通过；未改生产 guard、未运行付费模型或项目测试。
- Review gate: Skipped — 用户未要求 adversarial review、Reviewer–Editor 循环或独立批准。

## Verification

- Passed: 确定性 MVP 验证观察到 baseline pass、loose/tight/visibility regressions fail、compare regression fail；Skill Quality 1 pass 0 warning，Context 无错误。
