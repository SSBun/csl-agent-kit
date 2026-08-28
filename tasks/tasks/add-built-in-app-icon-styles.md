# 为图标生成 Skill 添加内置风格

Status: Completed (2026-08-28 17:32)
Kind: Task

## Scope

- 包含 10 种已确认的市场主流风格、Custom 入口、风格选择与 prompt 注入规则，以及一张使用同一主题横向比较 10 种风格的带标签示例图。
- 带标签示例图作为 `create-app-icon` 的内置视觉目录；10 张单项 PNG 保留在任务输出中而不扩大分发包，不引入图库 UI、外部风格依赖或额外图像生成框架。
- Glass / Liquid Glass 在固定绿幕流程中使用绿幕安全的玻璃质感近似，并明确真正透射背景的材质不适合 Sharp chroma key。

## Target
- [x] T1: create-app-icon 在生成前提供 Minimal Flat、Bold Glyph、Geometric Abstract、Gradient / Duotone、Soft 3D、Clay / Inflated、Isometric、Illustrated / Mascot、Glass / Liquid Glass、Pixel / Retro 共 10 种内置风格及 Custom 入口。
- [x] T2: 每种内置风格都有可直接注入生成 prompt 的视觉约束，并保留既有的用户原图验收、Sharp 透明 PNG、1024×1024 验证和可选平台素材流程；Glass 风格不会伪装成可安全抠图的真实透明材质。
- [x] T3: Skill package 与 README 的相关说明保持一致，并通过适用的语法、Skill Quality、资源引用、陈旧引用和 diff 检查。
- [x] T4: 使用已获用户批准的 10 风格绿幕预览图作为内置风格示例页，保留准确英文标签和各风格单项源 PNG，不再额外抠图或重组示例。

## Plan

1. 建立精简的英文风格目录，为 10 种风格定义名称、适用特征、prompt 片段和绿幕边界，并保留 Custom。
2. 将风格目录接入现有第一阶段，使用户可以按名称或序号选择，且所选约束会进入绿幕生成 prompt；同步 README。
3. 用同一主题分别生成 10 张绿幕示例原图，组成无抠图预览供用户验收。
4. 将用户批准的预览图原样保存为 Skill 内置风格示例页，不再抠图或重组；单项源 PNG 留在任务输出目录。
5. 执行语法、自检、Skill Quality、资源引用、生成资产 metadata 与 diff 检查；不运行未获授权的单元测试或项目测试套件。

## Result

- T1: references/icon-styles.md 包含用户确认的 10 个命名预设及 Custom，SKILL.md 在生成前要求展示并选择。
- T2: 每个预设均有 prompt fragment；Glass 明确使用绿幕安全的 opaque approximation，既有 approval、Sharp、1024 PNG 与平台流程保持不变。
- T3: README 已同步；Node syntax/self-test、英文扫描、资源链接、skill-quality（991/1000）、npm pack dry-run 与 diff check 全部通过。
- T4: 用户批准 output/create-app-icon-styles/source-preview.png 并要求原样使用；其字节级副本已保存为 assets/icon-style-catalog.png，实测为 1800×850 RGBA PNG。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 适用的非测试验证全部通过；按用户规则未运行单元测试或项目测试套件。
