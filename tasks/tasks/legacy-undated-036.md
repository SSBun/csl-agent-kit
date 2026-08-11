# 发布 CSL Agent Kit 新版本

## 计划

- [x] 审查全部本地改动、版本来源、git 远端与 npm 已发布版本，建议最小合适的目标版本。
- [x] 获得用户对目标版本、远端发布动作和 npm 登录后的明确确认。
- [x] 更新版本号、CHANGELOG 与必要发布元数据，并运行规则审计。
- [x] 运行完整测试、打包与 npm 发布演练，复核发布内容。
- [x] 提交全部本地改动并创建本地版本标签。
- [x] 推送 `main` 与 `v3.0.0`。
- [ ] 使用 npm 一次性验证码发布公开包。
- [ ] 验证远端提交、标签与 npm dist-tag，记录发布结果和剩余风险。

## 复核

- npm 当前最新版本为 `2.0.0`；未提交改动移除了 `tips.md` 运行时 fallback，并改为关键词 JSON，因此建议下一个版本为破坏性变更的 `3.0.0`。
- `env -u NO_COLOR npm run check` 通过 37 项测试与安装 dry-run；`git diff --check` 通过。Yao lint 与资源边界审计通过，`validate_skill.py` 仅报告两个既有 skills 缺少 `agents/interface.yaml`。
- `npm pack --dry-run` 通过并仅包含 82 个预期文件；保留用户要求提交的 `AGENTS.md.backup-*`，但从 npm `files` 白名单中排除，避免将临时备份发布。
- npm 登录用户为 `ssbun`，`npm publish --dry-run --access public` 通过；发布提交为 `c97ece7`，本地 `v3.0.0` 标签已创建。
- GitHub OAuth token 补充 `workflow` scope 后，HTTPS 已将 `main` 推送至 `c97ece7`，并创建远端 `v3.0.0` 标签。
- 实际 `npm publish --access public` 被 npm 的 `EOTP` 拦下；registry 仍仅有 `2.0.0`，因此尚未发布。需要当前的一次性验证码后重试。
