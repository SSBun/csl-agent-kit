# 将 code-review-graph 项目地图保存到 Wiki

- **Status:** 已完成（2026-07-21）

## Goals

- 将已审定的 `code-review-graph` 项目地图原样保存到用户 Wiki。
- 目标文件为 `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/code-review-graph-project-map.md`。
- 源文件与 Wiki 文件的 SHA-256 必须完全一致。
- 对最终 Wiki 文件执行独立 adversarial review；只有获得 `APPROVED` 后才完成任务。

## Plan

1. 确认目标不存在且源报告可读。
2. 原样写入 Wiki 目标文件，并验证字节级 hash 一致。
3. 独立复核最终 Wiki 文件与来源、格式和保存位置。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: wiki-copy-reviewer
- Round: INITIAL (1)
- Scope: `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/code-review-graph-project-map.md`
- Summary: Wiki 文件已原样保存，路径、文件类型、Markdown 完整性和字节一致性均已确认。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/save-code-review-graph-map-to-wiki/reports/adversarial-review.md)

## Results and verification

- 已保存到 `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/code-review-graph-project-map.md`。
- 源文件与 Wiki 文件 SHA-256 均为 `e059eecb989b473d94bd4fac64500216a3e63c1076e450fa80aff11b5769eac7`。
- `cmp -s` 确认为逐字节一致；目标为 16,800-byte regular Markdown file，包含一张 Mermaid 图。
