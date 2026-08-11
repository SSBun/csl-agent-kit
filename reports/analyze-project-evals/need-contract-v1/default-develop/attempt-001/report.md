- Scope: bin/csl-agent-kit.js
- Need: Before changing non-interactive external-integration authorization, explain the current selection/consent path, failure exits, and existing verification entry. Do not provide an implementation plan.
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: includes unrelated untracked changes not read by this analysis; analyzed source files match HEAD
- Generated at: 2026-08-09T23:34:21+08:00

## Direct Answer

当前非交互式授权由“选择参数本身”表达，没有独立的外部集成确认步骤：`--all` 直接选择全部目标；任何显式 `--target`/位置目标先校验后直接返回；`--yes` 直接选择 `default: true` 的目标。三条分支都在交互判断和 `confirmExternal` 提示之前返回。因此当前 `--yes` 会无提示选择同时标记为 `default: true`、`external: true` 的 `codex-plugin`，而显式选择或 `--all` 也会无提示接受 `codex-plugin`、`pi` 等外部目标。只有没有这些选择参数、且进入 TTY 交互分支时，外部目标才要求第二次确认；该确认默认值为 `false`。（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`）

最早改变结果的条件是 `resolveInstallTargets` 的分支顺序：`all` 优先于显式目标，显式目标优先于 `yes`，三者又都优先于 TTY/CI 检查和交互式同意。选择完成后，`main` 才把目标交给安装阶段，并按所有结果是否成功返回状态 `0` 或 `1`。（`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#resolveInstallTargets`）

## Need-bounded Working Model

- 目标表同时承载选择与授权所需的两个事实：`default` 决定 `--yes`，`external` 只决定交互式流程是否显示并强制 `confirmExternal`；它不参与三个非交互式分支的额外检查。（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`）
- 交互式流程先读取已保存选择作为 checklist 预选值，再收集至少一个目标。若所选目标中存在 `external: true`，随后显示默认拒绝的确认；取消或未确认都会在安装前退出。只有通过确认后才尝试保存选择。（`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#resolveInstallTargets`）
- 保存记录不是授权凭据：读取失败、格式不符或没有仍有效的目标时回退到默认预选；保存失败只打印警告并继续。显式目标、`--all` 和 `--yes` 分支既不读取也不更新该记录。（`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#resolveInstallTargets`）
- 选择与执行分离。选中的每个目标由 `installTargets` 顺序执行；单个目标抛出的异常被转成失败结果，不会阻止后续目标执行。外部可执行文件不存在时，`installCodexPlugin`/`installPi` 返回成功结果中的 `skip` 变更，因此不会形成失败退出。（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`）

## Critical Evidence Path

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 解析 `install` 参数，再调用 `resolveInstallTargets`。 | 所有安装都经过同一个选择边界。 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#parseInstallArgs` |
| 2 | `all`、非空 `targets`、`yes` 依次提前返回。显式目标仅做名称校验；`yes` 过滤默认目标。 | 这些非交互式路径不运行外部目标确认；当前 `--yes` 选择 `codex-plugin`。 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets`、`bin/csl-agent-kit.js#targets` |
| 3 | 没有非交互式选择时，非 TTY 或 `CI` 环境调用 `die`；TTY 环境才加载 `prompts`。 | 自动化环境不能无参数退回交互，缺少 `prompts` 也在选择前失败。两者均以状态 `2` 退出。 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 4 | 交互式 checklist 使用保存值预选；选择包含外部目标时才出现 `confirmExternal`，默认拒绝。 | 取消触发 `Install cancelled.`；外部选择未确认触发 `External integrations were not confirmed.`；两者均在执行前以状态 `2` 退出。 | `bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 5 | 选择通过后执行目标；目标异常被记录为 `ok: false`，任一失败使 `main` 返回状态 `1`。 | 选择/同意失败使用状态 `2`，已进入执行后的目标失败使用状态 `1`；未找到外部 CLI 则记为 `skip` 并仍可返回 `0`。 | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#main` |

参数层还有两个安装前的状态 `2` 出口：`--target` 缺少值，以及未知安装选项；显式目标名称无效也经 `validateTargets`/`die` 返回状态 `2`。交互确认后的选择记录保存失败不是出口，只产生警告。（`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#validateTargets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die`）

## Verification Anchors

- 现有聚合入口是 `package.json#scripts.check:cli`：它依次做 CLI 语法检查、运行 `test:cli`，再执行一次 `install --yes --dry-run --json`。本次受只读约束限制，未运行该入口。（`package.json#scripts.check:cli`）
- `default install output is colorful and summarizes integrations without path noise` 与 `JSON output remains valid and color-free when --color is passed` 都以 `--yes --dry-run` 启动真实 CLI，并断言成功且结果只含 `codex-plugin`；这直接固定了 `--yes` 当前无交互选择默认外部目标的行为。（`tests/cli-install-output.test.js#test("default install output is colorful and summarizes integrations without path noise")`、`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`）
- `Codex plugin install migrates legacy identities` 以显式 `--target codex-plugin --dry-run --json` 断言状态 `0` 和外部命令序列；`explicit target installs do not overwrite the saved interactive selection` 还固定了显式非交互选择不会改写交互记录。（`tests/cli-install-output.test.js#test("Codex plugin install migrates legacy identities")`、`tests/cli-install-output.test.js#test("explicit target installs do not overwrite the saved interactive selection")`）
- 无效显式目标的状态 `2` 已由 `repo-local skills links are not an install target` 等测试覆盖；执行期状态 `1` 已由 `Codex plugin add failure leaves owned legacy links untouched` 覆盖。（`tests/cli-install-output.test.js#test("repo-local skills links are not an install target")`、`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`）
- 当前测试文件没有直接驱动 TTY prompt，也没有直接断言取消、拒绝外部确认、无选择的非 TTY/CI 拒绝或缺少 `prompts` 的出口；这些行为目前由实现源码直接证明，而非现有测试直接验证。（`tests/cli-install-output.test.js`、`bin/csl-agent-kit.js#resolveInstallTargets`）
