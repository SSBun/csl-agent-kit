# 建立第三方技能集成流程

## 计划

- [x] 确认第三方技能以每个叶子技能目录为来源元数据边界，并定义最小 `.repository.json` 结构。
- [x] 为现有 `skills/mattpocock/*/` 技能补充来源元数据。
- [x] 创建 `integrate-third-skills` 技能，固化选择、导入、许可证、冲突、测试与审计流程。
- [x] 添加回归覆盖、更新技能目录文档与数量，并完成验证和规则审计。

## 复核

- 13 个 `skills/mattpocock/<技能>/` 叶子目录各有 `.repository.json`；记录上游 URL、原始相对路径、`main`、导入 commit `66898f60e8c744e269f8ce06c2b2b99ce7660d5f`、MIT 与上游状态。`ubiquitous-language` 明确标记为 `deprecated`。
- 新增 `skills/integrate-third-skills/`：接收第三方技能仓库链接后先列候选、等待选择，再按来源分组导入；它要求逐技能元数据、保留许可证、显式处理重名与本地修改，并禁止把源码导入误当作 `~/.agents/skills` 安装。
- README 已说明第三方目录与元数据约定，技能总数更新为 28；CLI/Pi 回归测试验证新技能被发现，CLI 测试还验证现有第三方叶子和来源数据一一对应。
- `env -u NO_COLOR npm run check` 通过 40 项测试；`npx skills add . --list --full-depth` 发现 28 项；`npm pack --dry-run --json` 包含新流程和全部来源文件；`git diff --check` 通过。未运行真实安装、发布或推送，`~/.agents/skills` 保持为空。
- `skill-quality` 的 lint、资源边界和治理审计通过；资源边界为 361/1,000 初始 token，路由 eval 10/10 通过。治理仅警告全项目采用的无 `manifest.json` 约定；聚合 `validate_skill.py` 仅要求未采用的 `agents/interface.yaml`，按既有“避免一次性 agents 元数据目录”约定不新增该目录。
