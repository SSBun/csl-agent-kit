# CSL Agent Kit Renaming Plan

## Assumptions

- 对外产品名采用 `CSL Agent Kit`。
- npm / Pi package 名采用 `csl-agent-kit`。
- 保留现有 skill 名称、`skills/` 目录和 `/CSL:<skill>` slash command 命名空间，避免无必要破坏已有用户习惯。
- 这次重命名重点是项目/包/插件描述层，不把每个具体 skill 改名，也不迁移用户数据目录，除非后续明确决定做 breaking migration。

## Plan

- [x] 盘点所有命名表面：`package.json`、README、各平台 plugin / marketplace manifest、安装脚本、Pi extension、文档和示例命令。
- [x] 更新 canonical metadata：把 `csl-skills` 改为 `csl-agent-kit`，把 `CSL Skills` 改为 `CSL Agent Kit`，并把描述从“skill collection”改为“agent toolkit”。
- [x] 更新平台 manifest：Claude Code、Cursor、Codex、Pi 的 display name、short / long description、keywords，确保覆盖 skills、plugins、commands、hooks、extensions、多客户端支持。
- [x] 更新安装文档：README 中的标题、定位语、repository clone path、`npx skills` 示例、Claude plugin install 示例、Pi install 示例，以及 `scripts/install.sh` 输出提示。
- [x] 明确兼容策略：保留 `/CSL:*` 命令名；若 GitHub repo 从 `SSBun/skills` 改名为新路径，文档中说明旧路径依赖 GitHub redirect 或保留旧 install 示例一段时间。
- [x] 处理本地状态命名：只在必要时新增 `~/.ssbun-agent-kit/` 之类路径；默认不迁移 `~/.ssbun-skills/`，避免破坏已有 SOP / tips 数据。
- [x] 运行验证：JSON manifest 校验、安装脚本语法检查、`npm pack --dry-run --json`、README stale-name grep、workspace diff check。
- [x] 做对抗性 review：确认没有误改标准 `skills/` 目录、没有破坏 plugin id、没有把历史分析文档中的旧名当作当前文档误改。

## Acceptance Criteria

- 当前对外品牌统一显示为 `CSL Agent Kit`。
- package 名统一为 `csl-agent-kit`，描述能准确覆盖 skills、plugins、commands、hooks、Pi extensions 和多 agent client 支持。
- README 首屏能让新用户理解：这是跨 Claude Code / Codex / Cursor / Pi 的个人 agent 工具包，不只是 skill 集合。
- 现有 skill 调用方式和安装后的运行路径保持兼容。
- 验证命令通过，且 `rg` 只在历史文档、兼容说明或 Agent Skills 标准语境中保留旧的 `CSL Skills` / `csl-skills` / `SSBun/skills` 引用。

## Verification Checklist

- [ ] `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- [ ] `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- [ ] `bash -n scripts/install.sh`
- [ ] `npm pack --dry-run --json`
- [ ] `rg -n "CSL Skills|csl-skills|SSBun/skills|Agent skill collection" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents scripts pi docs commands hooks`
- [ ] `git diff --check`
- [ ] `git status --short --untracked-files=all`

## Review

已由顶部任务 `CSL Agent Kit Renaming Execution` 执行。

执行结果：

- `package.json` 包名已改为 `csl-agent-kit`。
- README、plugin manifests、marketplace manifests、安装脚本提示已改为 `CSL Agent Kit` / toolkit 定位。
- 保留 `/CSL:*`、`CSL` / `csl` plugin id、`skills/` 目录和 `~/.ssbun-skills/` 用户数据路径，以降低兼容风险。

未决风险：

- GitHub 仓库是否真的从旧路径改为 `SSBun/agent-kit`，需要在代码库外单独完成；当前 README 已按目标新路径书写。
- 平台 marketplace 中已安装的旧入口可能需要用户重新安装或依赖平台 redirect。
