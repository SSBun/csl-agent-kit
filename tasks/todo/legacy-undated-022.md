# 为第三方技能增加上游检查子命令

## 计划

- [x] 确认子命令作为 `integrate-third-skills` 的附带脚本实现，不扩展主安装 CLI。
- [x] 设计 `status` 与 `diff <技能名>` 的只读 Git 契约、错误输出和临时目录边界。
- [x] 实现脚本并更新技能说明、README 与最小回归测试。
- [x] 运行聚焦与全量验证、打包检查和技能审计。

## 复核

- 新增 `skills/integrate-third-skills/scripts/third-party-skills.js`：`status` 按每个 `.repository.json` 的 `sourcePath` 判断上游内容是否变化；`diff <技能名>` 先展示导入后上游差异，再展示当前上游与本地副本的差异；`--patch` 才输出完整补丁。
- 所有命令只读：每个 `repository/ref` 只在系统临时目录克隆一次，结束后删除；不修改 vendor 文件、`~/.agents/skills` 或 Git 工作树。`.repository.json` 从本地内容差异中排除，并拒绝越出上游仓库的 `sourcePath`。
- 回归测试覆盖分支名称后缀误匹配、仓库有新提交但某技能路径未变、本地差异、元数据排除与路径越界拒绝；`env -u NO_COLOR npm run check` 通过 42 项测试，打包检查包含脚本，发现器仍列出 28 项技能。
- `yao-meta-skill` lint、资源边界、治理与 11 条 trigger eval 通过；初始技能体为 509/1,000 token。治理仍仅警告项目既有的无 `manifest.json` 约定；`validate_skill.py` 仍仅要求未采用的 `agents/interface.yaml`，按现有避免一次性 agents 元数据目录的约定不新增。
