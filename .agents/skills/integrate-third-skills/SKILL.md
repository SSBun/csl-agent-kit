---
name: integrate-third-skills
description: 在当前 CSL Agent Kit 仓库中整合选定的第三方 skills，并为每个导入的叶子技能保留可更新的来源元数据。用户提供 skills 仓库链接、要求导入或 vendor 外部技能、检查第三方技能上游更新、或比较本地副本与上游时使用；这是本项目 `.agents/skills` 的本地流程，不用于全局安装。
metadata:
  internal: true
---

# 集成第三方技能

将需要维护的上游技能作为 CSL Agent Kit 的源码导入，而不是安装到全局目录。此流程仅位于当前仓库的 `.agents/skills/integrate-third-skills/`，不会随共享 `skills/` 分发、全局 Codex symlink 安装或 Pi 命令发现。每个导入技能保留可复现的上游基线，因此后续可以安全比较更新并保留本地修改。

触发边界由 `evals/trigger_cases.json` 和 `evals/semantic_config.json` 覆盖。

## 流程

1. 检查用户给出的仓库链接：确认许可证、默认分支或 tag、可用叶子技能（含 `SKILL.md`）及上游目录路径。未明确选择技能时，先列出候选并等待用户选择；不要默认导入整个仓库。
2. 规划目标：放在 `skills/<来源分组>/<技能名>/`。来源分组优先使用用户指定名称；未指定时，使用 GitHub owner（若与现有来源冲突则改为 `owner-repo`）。同一来源的许可证放在 `skills/<来源分组>/LICENSE`。
3. 导入所选叶子目录的全部必要文件，并在每个含 `SKILL.md` 的第三方叶子目录写入 `.repository.json`：

   ```json
   {
     "repository": "https://github.com/owner/repository",
     "sourcePath": "上游仓库内的相对路径",
     "ref": "导入时的分支或 tag",
     "commit": "导入时解析到的完整 Git commit",
     "license": "上游许可证标识或 Unknown",
     "upstreamStatus": "active | deprecated | unknown"
   }
   ```

4. 先检查本仓库递归发现的所有技能名。若名称冲突，展示来源与差异，并要求用户明确选择替换、重命名或跳过；不得静默覆盖。已有导入技能更新时，先比较上游与本地修改，确认后才覆盖或合并。
5. 仅在现有发现机制无法识别新布局时修改 CLI/Pi 发现逻辑。同步更新 README 技能表、技能数量和第三方来源说明。
6. 添加或更新回归测试，至少验证每个第三方叶子都有可解析的 `.repository.json`，且 CLI 与 Pi 能发现新技能。
7. 验证：运行 `npm run check`、`npx skills add . --list --full-depth`、`npm pack --dry-run --json` 与 `git diff --check`；随后按项目规则运行 `yao-meta-skill` 审计。除非用户明确要求，不运行实际安装器、不修改 `~/.agents/skills`，也不发布或推送。

## 检查已有来源

运行附带的只读 Git 子命令；它们只读取本地 vendor 目录，并使用临时目录获取上游，不会更新任何技能：

```bash
# 检查每项技能源路径导入后是否发生上游变化
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js status

# 显示某项技能的上游变化和本地副本差异摘要
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff research

# 需要逐行补丁时才追加 --patch
node .agents/skills/integrate-third-skills/scripts/third-party-skills.js diff research --patch
```

`status` 使用 `.repository.json` 的 `repository`、`ref` 与 `commit`；`diff` 还会从该 ref 检出上游并分别展示“导入后上游变化”和“当前上游对本地副本的差异”。对其他工作区可追加 `--skills-root <path>`。无法访问远端、缺少 Git、名称不唯一或元数据损坏时停止并报告，不猜测或覆盖文件。

## 完成时报告

列出导入的技能、各自目标路径、上游 commit、许可证、任何本地改写和未处理的冲突或审计风险。不要把“已复制到源码”误报为“已安装到用户全局 skills 目录”。
