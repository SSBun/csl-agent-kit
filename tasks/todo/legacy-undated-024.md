# 集成选定的 Matt Pocock Skills

## 计划

- [x] 确认 13 个选定上游技能、现有发现机制与同名 `grill-me` 冲突。
- [x] 将选定技能放入专用的 `skills/mattpocock/` 目录，并移除顶层旧版 `grill-me` 以避免重复名称。
- [x] 让 CLI 安装器和 Pi 命令发现递归识别该专用目录中的独立技能。
- [x] 添加最小回归测试，验证嵌套技能进入 symlink 安装与 Pi 命令发现。
- [x] 运行聚焦与全量检查、打包检查和 `yao-meta-skill` 审计。

## 复核

- 专用目录采用 `skills/mattpocock/<skill>/`；公开技能名保持上游原名，避免把来源前缀暴露给用户。
- 现有顶层 `skills/grill-me` 与选定上游技能同名；将由专用目录版本替代，而不是同时保留两个候选。
- 已导入 13 项用户指定的上游包，并保留 `skills/mattpocock/LICENSE`；`ubiquitous-language` 虽位于上游 `deprecated/`，仍按用户明确选择保留。
- CLI 与 Pi 均改为在没有 `SKILL.md` 的分组目录中递归寻找叶子技能；Codex 安装 dry-run 现在为 27 个唯一名称创建 symlink 计划，Pi 新增别名回归测试。
- 测试先确认 RED：新增 CLI 与 Pi 用例均找不到嵌套技能；实现后 `npm run check` 的 39 项测试通过，`npx skills add . --list --full-depth` 发现 27 项，`npm pack --dry-run` 包含 120 个文件与全部导入资源。
- `yao-meta-skill` 审计记录上游包的既有质量缺口：13 项均缺少 `agents/interface.yaml`，5 项超过 1,000-token 入口预算，所有项缺少可选 `manifest.json`。为保持上游来源可更新且不引入一次性元数据，未做本地改写。
- README 已更新为 27 个可安装技能，并说明 CSL 递归发现 `skills/` 下的叶子 `SKILL.md`；专用来源目录与上游已废弃技能的保留状态也已标注。
