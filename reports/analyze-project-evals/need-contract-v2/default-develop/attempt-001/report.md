- Scope: bin/csl-agent-kit.js
- Need: 在更改非交互式外部集成授权之前，说明当前选择/同意路径、失败出口和现有验证入口；不提供实现计划。
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: 本分析读取的源文件和验证文件与 HEAD 一致；未将仓库中无关的未跟踪运行时文件用作证据
- Generated at: 2026-08-09T23:45:50+08:00

## Direct Answer

当前非交互式安装没有独立的外部集成确认步骤：`--all`、显式 `--target`/位置目标或 `--yes` 本身即被视为选择并授权，`resolveInstallTargets` 直接返回目标列表，随后 `main` 立即交给 `installTargets` 执行。`--yes` 只选择 `default: true` 的 `codex-plugin`，而该目标同时标记为 `external: true`；显式目标和 `--all` 则可直接选中任意外部目标。最早改变这一结果的条件是解析后的选择优先级：`all`、非空 `targets`、`yes` 任一命中都会绕过交互确认；三者都未命中时，非 TTY 或 `CI` 环境退出，只有 TTY 才进入带条件确认的交互流程。证据：`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`。

## Need-bounded Working Model

- **目标分类。** `cursor` 是非外部目标；`codex-plugin` 与 `pi` 是外部目标；只有 `codex-plugin` 是默认目标。`external` 仅用于交互确认是否出现，`default` 仅用于默认勾选和 `--yes` 选择。证据：`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#buildInstallChoices`。
- **非交互选择。** 参数解析把 `--all`/`all`、`--yes`/`-y`、`--target`/`--targets`、`--target=...` 和非选项位置参数归入 `options`。解析后，`resolveInstallTargets` 按 `all` → 显式目标 → `yes` 的顺序返回；显式目标会先校验并去重，另外两条路径直接按当前目标表生成列表。它们都不读取或写入保存的交互选择，也不检查 `external`。证据：`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#splitTargets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets`。
- **交互选择与同意。** 没有显式选择时，非 TTY 或设置了 `CI` 会在加载 `prompts` 前退出；TTY 路径才加载 `prompts`、读取历史选择并构造多选项。第二个提示仅在本次多选包含 `external` 目标时显示；确认初值为 `false`。取消提示或未确认所选外部目标都会退出。只有通过这些检查的交互选择才尝试保存；保存失败只打印警告，仍返回已确认列表。证据：`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#saveInstallSelection`。
- **退出语义。** 缺少 `--target` 值、未知选项、未知目标、无显式选择的非交互环境、缺少 `prompts`、取消交互及拒绝外部确认均经 `die` 以状态 2 结束，目标执行尚未开始。选择完成后，单个集成抛错会被 `installTargets` 转成 `ok: false`，最终状态为 1；意外拒绝由 `main().catch` 以状态 1 结束。外部 CLI 不存在时，`codex-plugin`/`pi` 当前返回 `skip` 变更而非失败，因此该目标仍记为 `ok: true`。证据：`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets`、`bin/csl-agent-kit.js#die`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#main`。

## Critical Evidence Path

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 仅在命令为 `install` 时解析参数，并在执行任何目标前等待 `resolveInstallTargets` | 选择/同意失败不会进入集成执行 | `bin/csl-agent-kit.js#main` |
| 2 | `targets` 同时声明 `default` 与 `external`；默认且外部的目标是 `codex-plugin` | `--yes` 当前可非交互地选中外部集成 | `bin/csl-agent-kit.js#targets` |
| 3 | `resolveInstallTargets` 的前三个分支直接返回 `--all`、显式目标或 `--yes` 结果 | 非交互显式选择没有二次同意；这是最早的授权分支 | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 4 | 未命中前三个分支时，非 TTY/`CI` 经 `die` 退出；TTY 才执行多选和按需外部确认 | 当前唯一单独的外部同意发生在交互路径 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 5 | 已选目标逐个运行；结果汇总决定正常输出后的状态 0 或 1 | 授权成功与后续集成执行失败是两个不同出口 | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main` |

## Verification Anchors

现有聚合验证入口是 `npm run check:cli`：它声明为先做 `node --check bin/csl-agent-kit.js`，再运行 `test:cli`，最后执行 `install --yes --dry-run --json`。本次受限分析未执行该入口。证据：`package.json#scripts.check:cli`。

- `--yes --dry-run` 的 CLI 测试断言成功且只展示默认的 Codex 插件；JSON 变体还断言结果目标正好是 `codex-plugin`，直接固定了“默认外部目标可由 `--yes` 非交互选中”的当前行为。证据：`tests/cli-install-output.test.js:44-57`、`tests/cli-install-output.test.js:222-229`。
- 保存选择的测试覆盖历史选择复用、无效记录回退到 Codex 默认项，以及显式 `--target` 不改写交互记录。证据：`tests/cli-install-output.test.js:232-264`、`tests/cli-install-output.test.js:450-469`。
- 未知目标测试固定状态 2；插件执行失败测试固定选择完成后的状态 1。证据：`tests/cli-install-output.test.js:268-275`、`tests/cli-install-output.test.js:426-448`。
- 当前测试文件没有直接覆盖无显式选择的非 TTY/`CI` 出口、缺少 `prompts`、交互取消或外部确认被拒绝；这些行为在本报告中仅由 `resolveInstallTargets` 与 `die` 的源码直接证明。证据：`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die`。
