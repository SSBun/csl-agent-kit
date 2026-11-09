---
schema: csl-memory/v1
id: legacy-lessons-c4d4acd64f5ea359d5f3
revision: 1
type: experience
title: 模型生成短 UI 标签的确定性约束
summary: 生成标题、标签或徽标时，由代码验证长度与格式并跳过纯操作型消息，不只依赖提示词。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-28 为模型生成的短 UI 标签设置确定性边界:1
updated: 2026-11-02T03:43:09.712Z
deleted: false
---

## 2026-07-28 为模型生成的短 UI 标签设置确定性边界

- **Trigger:**
  - 模型生成终端标题、标签、徽标或其他要求严格简短且禁止出现操作过程的 UI 文本。
- **Rule:**
  - Prompt 负责描述核心语义，代码负责强制长度、清理模型元标签，并确定性跳过已知的纯操作型跟进；不得只依赖模型遵守格式和分类要求。
  - 将用户报告的实际坏输出加入回归测试。
- **Check:**
  - 生成文本不超过产品规定的 Unicode 码点上限，且不含模型元标签。
  - commit、push、test、retry、continue 等纯操作样例不会覆盖现有标签。
