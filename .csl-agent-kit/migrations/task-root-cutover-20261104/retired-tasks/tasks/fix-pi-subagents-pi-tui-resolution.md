# 修复 Pi 子 Agent 启动时 pi-tui 依赖解析失败

Status: Blocked (2026-09-11 16:02)
Kind: Task

## Scope

- 诊断并修复本机 pi-subagents 原生后台 runner 的依赖解析错误；不通过切换前台、外部 CLI 或禁用扩展绕过故障。
- 不运行单元测试或项目测试套件；使用只读模块加载探针与原生子 Agent 调用。
- 不改用户 AGENTS、CSL Contract 或其他会话工作区改动。

## Target

- [ ] T1: Pi 子 Agent 不再因无法解析 @earendil-works/pi-tui 而启动失败，并能通过原生 subagent 协议返回结果。
- [x] T2: 修复仅影响此启动故障所需的本机依赖或配置，不修改无关项目代码或既有用户规则。

## Plan

1. 复现报错并区分依赖缺失、宿主 peer 映射缺失、缓存或启动环境问题。
2. 确定最小修复位置；优先复用已有宿主依赖映射，不引入重复 Pi 安装或修改第三方源码。
3. 通过原生 subagent 后台调用验证实际启动与返回；若有配置/依赖文件变更，先记录主 Agent 自检，再做 fresh 只读 task-review。
4. 核对变更边界与当前证据，完成任务并报告仍未验证的部分。

## Evidence

- 原始失败 run：`d5bb2826-e5bb-44e0-a00a-046d9294075c`，runner 在导入 watchdog 的 `Text` 时抛出 `MODULE_NOT_FOUND`，尚未创建 child session。
- Pi 安装为 0.85.1，pi-subagents 为 0.66.0；从插件目录普通 require.resolve 无法找到 pi-tui，但从宿主 Pi 包可以解析到其已安装副本。
- 插件自带 `resolveHostPeerAliases()` 能生成 13 个宿主别名，missing/supplemental 均为空。
- 相同 jiti CLI 导入 `register-main.ts`：无 JITI_ALIAS 时退出 1 并复现同一错误；使用宿主生成的 JITI_ALIAS 时退出 0。
- 带宿主别名导入完整 `subagent-runner.ts`（不作为 entrypoint、不启动 Agent）退出 0，输出 `alias-count 13` 和 `RUNNER_IMPORT_OK`。这证明安装文件可正常加载，尚不证明实际派发环境正确。
- 原生后台探针 `330c37e9-3f28-4a48-9115-63821f4080d5` 同样在 runner 启动时失败，未创建 child session；没有切换运行模式。进程退出后无法采样其环境，因此不把 ps 的空结果当作未设置环境变量的证据。

## Decisions

- 采用上游 0.67.0 发布包中的修复：发布说明明确包含 “Resolve Pi TUI aliases correctly in unusual package layouts” (#2020)。新 `runner-peer-preload.mjs` 用 Node registerHooks 将 pi-tui 原生模块解析重定向到已有宿主副本；新 spawnRunner 在有宿主别名时启用该 preload，而不是仅给 jiti 传别名。
- 只升级本机 managed npm root 中的 pi-subagents，保持其他依赖声明不变，不直接修改插件源码、不额外安装一套 Pi。
- 遵循 Pi package-manager 对 npm managed install 使用 `--legacy-peer-deps` 的现有语义，并加 `--ignore-scripts`。普通 npm dry-run 会额外安装 Pi 并降级共享依赖，已放弃；符合宿主管理语义的 dry-run 只有 pi-subagents 一项版本变更，另列出其他平台 optional 包。
- 当前会话仍持有 0.66.0 已加载的启动函数；升级文件后需要用户 `/reload` 或重新启动 Pi，随后才做原生后台探针和 mandatory review。不能在已加载旧启动器与新 runner 混用时宣称端到端验证成功。
- 修改前 `package.json`、`package-lock.json` 与上游发布说明/peer preload 已保存在 [证据目录](../artifacts/fix-pi-subagents-pi-tui-resolution/evidence/)。

## Preliminary Verification

- 已执行 `npm install --prefix /Users/caishilin/.pi/agent/npm pi-subagents@0.67.0 --legacy-peer-deps --ignore-scripts --no-audit --no-fund`，输出 `changed 1 package in 4s`。
- [checks.json](../artifacts/fix-pi-subagents-pi-tui-resolution/evidence/checks.json) 记录当前内容身份和非测试检查：只有 managed root 的 pi-subagents 声明与对应锁条目改变，其他依赖声明与锁条目逐对象一致；未安装另一套 Pi；两个 AGENTS 文件哈希未变。
- 在故障插件目录执行真实原生 `import('@earendil-works/pi-tui')` 并检查 Text 导出：仅 JITI_ALIAS 退出 1，增加上游 peer preload 后退出 0，输出 `NATIVE_PEER_IMPORT_OK`。新 preload 与官方 tarball 文件逐字一致。
- 完整新 runner 的模块加载退出 0，输出 `RUNNER_IMPORT_OK`，stderr 为空；此探针不创建 AgentSession，不能替代 T1 的实际后台派发。
- 探针修正说明：`require.resolve()` 并不验证 Node registerHooks 的实际模块加载；仓库 cwd 的 eval 又可能借用项目依赖，所以最终对照使用插件 cwd 的实际 import，不采用前两种探针作为通过证据。
- 最可能的失败模式已覆盖：不必要的 peer 依赖安装/降级（锁条目比较）、重复 Pi SDK 副本（目录缺席）、只对 jiti 生效而原生加载仍失败（原生 import 对照）、当前内存仍持有旧启动器（必须 reload）、无关用户规则漂移（前后 SHA256）。
- 未运行单元测试或项目测试；未完成升级后的原生子 Agent 派发和 fresh 只读审查，不标记修复完成。

## Block

- Reason: 修复版文件已安装并通过模块加载检查，但当前会话仍持有旧版插件的启动逻辑；需重新加载扩展后才能有效验证原生后台子 Agent 并进行 mandatory task-review。不能将模块探针当作端到端成功，也不再用旧版启动器启动新版 runner。
- Unblock when: 用户在 Pi 执行 `/reload` 或重启并恢复会话，使 pi-subagents 0.67.0 加载。随后 resume 本任务并核对安装快照，执行一次原生后台探针；成功后记录 T1，执行 fresh 只读 task-review，再完成最终验证。基础设施恢复后，原 `deduplicate-user-agents-contract` 任务仍需补做其独立审查。

## Result

- T2: npm实际只更新pi-subagents到0.67.0；managed root package.json除该声明外逐对象一致，package-lock仅根与该包条目变化；未安装重复Pi依赖；用户和仓库AGENTS前后SHA256一致。详见Preliminary Verification及checks.json；测试未运行。
