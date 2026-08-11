- Scope: bin/csl-agent-kit.js
- Need: Before changing non-interactive external-integration authorization, explain the current selection/consent path, failure exits, and existing verification entry. Do not provide an implementation plan.
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: includes uncommitted changes read by this analysis
- Generated at: 2026-08-09T23:53:14+0800

## Direct Answer

当前实现把非交互选择参数本身视为授权：`--all`、显式 `--target`/位置目标、`--yes` 都在 `resolveInstallTargets` 的交互分支之前直接返回目标列表，因此不会检查目标的 `external` 标记，也不会显示或验证 `confirmExternal`。其中 `--yes` 选择所有 `default: true` 的目标；当前唯一默认目标是同时标记为 `external: true` 的 `codex-plugin`。最早能改变结果的条件是 `resolveInstallTargets` 命中的选择分支：只有三个非交互选择分支都未命中时，流程才检查 TTY/CI 并可能进入交互同意。证据：`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`。

## Need-bounded Working Model

**选择与授权边界。** `targets` 把 `cursor` 标为非外部，把 `codex-plugin` 与 `pi` 标为外部；只有 `codex-plugin` 同时是默认目标。`--all` 返回全部键，显式目标先经 `validateTargets` 校验并去重，`--yes` 按 `default` 过滤；这三条路径都不读取或写入保存的交互选择。无选择参数时，非 TTY 或存在 `CI` 会直接失败；其余情况才加载上次选择、构建 checklist，并仅在所选列表含外部目标时展示默认值为 `false` 的确认项。确认通过后才保存选择。证据：`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#saveInstallSelection`。

**执行边界。** `main` 收到目标列表后立即交给 `installTargets`；每个目标调用自身的 `run`。因此选择/同意决定“哪些目标可进入执行”，而实际外部命令是否成功由后续安装函数与 `runCommands` 决定。证据：`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#runCommands`。

**失败出口。** 参数缺值、未知安装选项、未知目标、非交互环境缺少选择参数、交互依赖缺失、用户取消，以及外部目标未确认，都会经 `die` 输出错误并以状态码 `2` 退出。目标执行抛错会被 `installTargets` 转为该目标的 `ok: false`，最终由 `main` 以状态码 `1` 退出；但缺少 `codex` 或 `pi` 可执行文件会记录成功结果中的 `skip`，并不算失败。证据：`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#validateTargets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`。

## Critical Evidence Path

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 解析 `install` 参数并调用 `resolveInstallTargets` | 所有安装执行都经过同一个选择入口 | `bin/csl-agent-kit.js#main` |
| 2 | `resolveInstallTargets` 依次优先处理 `all`、显式目标、`yes` 并立即返回 | 非交互外部目标没有独立同意检查 | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 3 | 三者均未命中时检查 `!process.stdin.isTTY || process.env.CI` | 裸非交互调用在进入提示前以状态码 `2` 失败 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 4 | 仅交互路径按所选目标的 `external` 标记启用确认，并拒绝未确认的外部选择 | `external` 当前只约束交互流程 | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 5 | 已选目标逐个执行；抛错被收集，任一失败使安装命令以状态码 `1` 结束 | 授权成功不保证外部命令成功 | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main` |

## Verification Anchors

现有 CLI 验证入口是 `package.json#scripts.check:cli`：它先做语法检查，再运行 `test:cli`，最后执行一次 `install --yes --dry-run --json`。`tests/cli-install-output.test.js:44` 以子进程验证 `--yes --dry-run` 可成功选择唯一默认的 `codex-plugin`；`tests/cli-install-output.test.js:59` 验证显式 `--target codex-plugin --dry-run --json` 可直接到达外部命令清单；`tests/cli-install-output.test.js:450` 验证显式目标不会改写保存的交互选择。现有测试没有直接断言裸非 TTY/CI 调用、交互取消或外部确认拒绝的失败出口，这些结论由上述源代码分支直接证明。
