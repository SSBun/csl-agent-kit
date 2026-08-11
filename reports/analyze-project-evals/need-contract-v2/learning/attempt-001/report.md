- Scope: bin/csl-agent-kit.js
- Need: 了解 `--all`、显式目标、`--yes` 和裸 `install` 当前如何选择目标；以 `--target pi,cursor,pi` 为代表路径，并检查指定的 Prediction 与 Transfer。
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: includes uncommitted changes read by this analysis
- Generated at: 2026-08-09T23:44:07+0800

## Direct Answer

目标选择遵循固定的短路优先级：`--all` → 显式目标 → `--yes` → 裸 `install`。`--all` 按注册顺序选择全部目标，即 `cursor`、`codex-plugin`、`pi`；显式的 `--target pi,cursor,pi` 先验证每个原始值，再以首次出现顺序去重为 `pi`、`cursor`；没有前两类输入时，`--yes` 只选择唯一标为默认的 `codex-plugin`。裸 `install` 在 CI 或 stdin 非 TTY 时直接报错；仅在交互环境中读取保存的选择作为清单预选，最终采用用户提交的选择，并在其中含 `codex-plugin` 或 `pi` 时要求外部命令确认。最早改变结果的条件就是上述四个分支中第一个命中的分支。证据：bin/csl-agent-kit.js#targets、bin/csl-agent-kit.js#resolveInstallTargets。

## Need-bounded Working Model

`targets` 同时定义选择顺序与两项选择属性：只有 `codex-plugin` 的 `default` 为 `true`；`codex-plugin` 和 `pi` 的 `external` 为 `true`，`cursor` 则不是外部目标。参数解析只负责把逗号列表拆分、去空白、保留顺序和重复项，并分别记录 `all` 与 `yes`；选择语义集中在后续解析器中。证据：bin/csl-agent-kit.js#targets、bin/csl-agent-kit.js#parseInstallArgs。

保存状态只属于裸交互路径：通过 TTY/CI 门和 `prompts` 依赖检查后才读取，用来构造预选清单；它不会参与 `--all`、显式目标或 `--yes` 的选择。交互提交后，外部目标确认成功才保存本次选择。证据：bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#buildInstallChoices、bin/csl-agent-kit.js#loadInstallSelection、bin/csl-agent-kit.js#saveInstallSelection。

## Critical Evidence Path

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 解析 `install` 参数，再等待 `resolveInstallTargets` | 安装阶段只能收到解析器最终返回的目标数组 | bin/csl-agent-kit.js#main |
| 2 | `options.all` 最先短路并返回 `Object.keys(targets)` | `--all` 选择 `cursor`、`codex-plugin`、`pi` | bin/csl-agent-kit.js#resolveInstallTargets |
| 3 | 非空显式列表先逐项验证，再用 `Set` 去重 | `--target pi,cursor,pi` 返回 `pi`、`cursor`；若同时给出 `--yes`，也不会追加默认目标 | bin/csl-agent-kit.js#parseInstallArgs、bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#validateTargets |
| 4 | 没有前述输入时，`options.yes` 过滤 `default: true` | `--yes` 只返回 `codex-plugin`，且在 TTY 门之前结束选择 | bin/csl-agent-kit.js#targets、bin/csl-agent-kit.js#resolveInstallTargets |
| 5 | 裸调用先检查 `!process.stdin.isTTY || process.env.CI` | CI/非 TTY 由 `die` 以状态 2 退出；交互路径才读取保存状态、显示清单，并按所选外部目标决定是否显示确认 | bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#die |
| 6 | `installTargets` 按已选数组依次派发 | 目标选择在任何目标安装动作之前已经完成 | bin/csl-agent-kit.js#installTargets |

显式无效目标的主失败出口也位于选择阶段：`validateTargets` 在去重和安装之前调用 `die`；因此 `install --target unknown --yes` 不会回退到 `--yes`。证据：bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#validateTargets、bin/csl-agent-kit.js#die。

## Verification Anchors

- `--yes --dry-run` 的现有 CLI 测试断言只出现 `Codex plugin`，且不出现 Cursor：tests/cli-install-output.test.js:44-55。
- 保存选择、无效保存状态回退默认清单分别由直接函数测试覆盖：tests/cli-install-output.test.js:232-267。
- 显式目标不会覆盖交互保存状态：tests/cli-install-output.test.js:450-469。
- 无效显式目标以状态 2 和 `Unknown target` 失败有现有覆盖：tests/cli-install-output.test.js:268-273。
- 现有测试没有直接覆盖 `--all` 的完整顺序、`pi,cursor,pi` 的去重结果、裸调用的 CI/TTY 门，或 `unknown` 与 `--yes` 同时存在时的分支顺序；这些结论由上述选择函数的有序短路源码直接证明。

## Learning Check

**Prediction：** 在 CI 或 stdin 非 TTY 中执行 `install --yes --dry-run`，它会到达 TTY 门、读取保存的选择状态，还是显示外部命令确认？

**Transfer：** `install --target unknown --yes` 最先在哪里失败？之后哪些阶段不可达？

**Key**

- **Prediction：三者都不会。** `--yes` 在 TTY 门之前返回默认目标 `codex-plugin`；保存状态和外部确认都只在更后的裸交互分支。`--dry-run` 影响后续安装动作，不改变选择分支。证据：bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#installCodexPlugin。
- **Transfer：先在 `validateTargets` 失败。** 参数解析已完成，但解析器在显式列表分支中调用 `die`；因此去重返回、`--yes` 默认选择、TTY/CI 门、保存状态读取、交互及外部确认、状态保存、`installTargets` 和结果输出均不可达。证据：bin/csl-agent-kit.js#parseInstallArgs、bin/csl-agent-kit.js#resolveInstallTargets、bin/csl-agent-kit.js#validateTargets、bin/csl-agent-kit.js#die。
