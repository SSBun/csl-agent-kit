# 发布 CSL Agent Kit 3.2.0

Status: In Progress (2026-07-31 18:05)

## Scope

- 包含 `@ssbun/csl-agent-kit` 的 minor 版本准备、npm 发布、Git tag，以及 `origin/main` 和 tag 推送。
- 不创建额外的 GitHub Release；当前匹配的发布流程是 npm CLI 包发布。

## Target

- [x] T1：版本 source of truth、lockfile 与 changelog 一致更新为 `3.2.0`，发布说明覆盖自 `v3.1.0` 起的用户可见变更。
- [x] T2：项目全量检查、npm 包内容检查与 npm 发布演练通过，目标版本尚未占用且登录态有效。
- [x] T3：发布提交与注释 tag `v3.2.0` 创建完成，`main` 和 tag 推送到 `origin`。
- [x] T4：`@ssbun/csl-agent-kit@3.2.0` 发布成功，npm `latest` 与 registry 查询均指向目标版本。
- [ ] T5：`package-lock.json` 与 manifest 依赖完全同步，`npm ci` 在支持的 Node.js 版本和主验证 job 中通过，修复后的 GitHub Actions run 成功。

## Plan

1. 准备 `3.2.0` 版本元数据与发布说明。
2. 验证项目、npm 包内容、registry 状态与登录态。
3. 列出远端动作并取得最终确认。
4. 提交、打 tag、推送、发布并验证远端状态。
5. 修复 release 后暴露的 lockfile/manifest 不一致，并验证 GitHub Actions。

## Result

- T1：`package.json` 作为版本 source of truth 已更新到 `3.2.0`，`package-lock.json` 由 npm 同步；`CHANGELOG.md` 已新增 `3.2.0` 发布说明和 compare/tag 链接。项目没有 App build number，README 无写死的旧包版本；各 plugin manifest 的 `2.0.0` 是既有独立插件元数据，本次不改。
- T2：`npm run check` 通过全部 75 项测试及 CLI 安装 dry-run；CLI `--help`、31 个 skills 的发现检查、`git diff --check` 均通过。`npm pack --dry-run --json` 和 `npm publish --dry-run --access public --json` 均确认 `@ssbun/csl-agent-kit@3.2.0` 含 156 个文件（186049 bytes packed / 527293 bytes unpacked），且不包含 `tasks/`、`reports/` 或项目本地 `.agents/skills/`。npm 用户为 `ssbun`，registry 返回目标版本不存在。
- T3：发布提交 `813ebfb` 与注释 tag `v3.2.0` 均指向同一 commit；GitHub `refs/heads/main` 和 peeled tag 均返回完整 commit `813ebfb39bccd7495b69deb342cb857341226f86`。SSH 端口 22 被网络关闭后，将 `origin` 切换为已认证的 HTTPS URL 并成功推送。
- T4：`npm publish --access public` 返回 `+ @ssbun/csl-agent-kit@3.2.0`；发布后 `npm view` 确认 registry version 和 `latest` 均为 `3.2.0`。
- T5（进行中）：GitHub Actions run `30622260170` 在 `npm ci` 阶段稳定复现 `Missing: yaml@2.9.0 from lock file`；根因是 manifest 已声明 `yaml`，lockfile 根包依赖和顶层解析记录缺失。`npm install --package-lock-only` 已同步 lockfile，随后本地 `npm ci` 和 `npm run check`（75 项测试）通过；等待修复 commit 的远端 CI。
- Review gate: Skipped — no explicit user request.
