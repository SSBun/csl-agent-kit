# 分析 code-review-graph 的 Tree-sitter 实现

- **Status:** 已完成（2026-07-21）

## Goals

- 解释 Tree-sitter 在该项目中的具体职责，而不是只给通用定义。
- 从真实入口追踪代码解析、引用/依赖提取、图构建到用户可见输出的核心流程。
- 生成一份带仓库相对源码锚点的中文项目地图，并验证其中的 Mermaid 图。
- 对最终报告执行独立 adversarial review；只有获得 `APPROVED` 后才完成任务。

## Plan

1. 获取并固定上游仓库 revision，读取规则、README、manifest、入口、核心实现和测试。
2. 按功能职责建立模块地图，追踪 Tree-sitter 驱动的核心工作流与失败出口。
3. 验证 Mermaid，写入唯一项目分析报告。
4. 执行 adversarial review，处理全部有效发现并记录验证结果。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: project-map-reviewer
- Round: RE-REVIEW (3)
- Scope: `/tmp/code-review-graph-analysis.0NhNlp/docs/analysis/project-map.md`
- Summary: 项目地图准确区分 Tree-sitter、文件级增量、图存储与两条 review tool 调用链，全部审查问题已关闭。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/analyze-code-review-graph/reports/adversarial-review.md)

## Results and verification

- 已在 `/tmp/code-review-graph-analysis.0NhNlp/docs/analysis/project-map.md` 生成中文项目地图，固定上游 revision `6a1ee1c7063cc35cfa5ff12b8198c29360f3e4ad`。
- Mermaid 关系图由本地 Mermaid 11.16.0 parser 真实解析，且报告中恰好一张 Mermaid 图。
- 关键测试锚点逐项命中；Tree-sitter old-tree/edit 调用未在当前源码中出现。
- 最终报告 SHA-256：`e059eecb989b473d94bd4fac64500216a3e63c1076e450fa80aff11b5769eac7`。
