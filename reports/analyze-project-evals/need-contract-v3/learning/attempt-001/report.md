- Scope: bin/csl-agent-kit.js
- Need: `--all`、显式目标、`--yes` 和裸 `install` 当前如何选择目标？以 `--target pi,cursor,pi` 为代表路径，并检验指定的 Prediction 与 Transfer 分支。
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: includes uncommitted changes read by this analysis
- Generated at: 2026-08-09T23:52:52+08:00

## Direct Answer

目标解析采用固定优先级：`--all` 先于显式目标，显式目标先于 `--yes`，最后才是裸 `install` 的交互路径；因此最早能改变结果的条件是 `options.all`。单独使用 `--all` 会按注册顺序选择 `cursor`、`codex-plugin`、`pi`；`--target pi,cursor,pi` 会先校验三个输入，再以首次出现顺序去重为 `pi`、`cursor`；单独使用 `--yes` 只选择唯一标记为默认的 `codex-plugin`。（bin/csl-agent-kit.js#targets；bin/csl-agent-kit.js#resolveInstallTargets）

裸 `install` 只有在有 TTY 且未设置 `CI` 时才进入 checklist；保存状态或默认值只决定初始勾选，最终目标来自用户提交的 `response.selected`。若提交项包含 `codex-plugin` 或 `pi` 这类 external 目标，还必须通过外部命令确认；CI/非 TTY 则在读取保存状态和显示任何提示之前退出。（bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#loadInstallSelection；bin/csl-agent-kit.js#buildInstallChoices）

## Need-bounded Working Model

| 因果角色 | 当前行为 | 对目标结果的影响 | 证据 |
| --- | --- | --- | --- |
| 目标注册表 | 三个目标按 `cursor`、`codex-plugin`、`pi` 声明；仅 `codex-plugin` 的 `default` 为 `true`，后两者为 external | 决定 `--all` 集合、`--yes` 默认集和交互确认条件 | bin/csl-agent-kit.js#targets |
| 参数归一化 | `--target`/`--targets`、`--target=...` 和非选项位置参数都进入 `options.targets`；逗号项被 trim 并移除空项 | 代表输入形成 `pi,cursor,pi`，但此时尚未去重 | bin/csl-agent-kit.js#parseInstallArgs；bin/csl-agent-kit.js#splitTargets |
| 非交互解析 | 依次检查 `all`、显式目标、`yes`；显式目标先全量校验，再用 `Set` 去重 | 多种模式同时出现时，较早分支覆盖较晚分支 | bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#validateTargets |
| 交互解析 | 仅裸调用通过 TTY gate 后加载保存选择；有效保存项优先，否则用默认项预选 | 保存状态不直接成为结果，提交的 checklist 才成为结果 | bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#loadInstallSelection；bin/csl-agent-kit.js#buildInstallChoices |
| 安装边界 | 已解析的名称数组交给 `installTargets` 逐项分派 | 选择阶段到此结束；`--dry-run` 不参与目标解析 | bin/csl-agent-kit.js#main；bin/csl-agent-kit.js#installTargets |

## Critical Evidence Path

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 对 `install` 先解析参数，再等待目标解析 | 所有安装模式汇入同一选择链 | bin/csl-agent-kit.js#main |
| 2 | 代表路径把 `pi,cursor,pi` 追加到 `options.targets` | 保留原输入顺序与重复项 | bin/csl-agent-kit.js#parseInstallArgs；bin/csl-agent-kit.js#splitTargets |
| 3 | `resolveInstallTargets` 先处理 `all`；否则显式列表经 `validateTargets` 后以 `Set` 去重 | 代表路径得到 `pi,cursor`；未知名称在此以退出码 2 失败 | bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#validateTargets；bin/csl-agent-kit.js#die |
| 4 | 无显式目标时，`yes` 分支直接筛选 `default`；再无 `yes` 才检查 TTY/CI | `--yes` 得到 `codex-plugin` 且绕过交互；裸 CI/非 TTY 在交互状态读取前失败 | bin/csl-agent-kit.js#resolveInstallTargets |
| 5 | 裸交互调用才加载保存选择、构建 checklist，并对 external 选择追加确认 | 成功提交并确认后的 `response.selected` 才返回，同时尝试记忆本次选择 | bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#loadInstallSelection；bin/csl-agent-kit.js#saveInstallSelection |
| 6 | 返回数组交给 `installTargets` | 只有选中的、已验证名称进入目标实现 | bin/csl-agent-kit.js#main；bin/csl-agent-kit.js#installTargets |

## Verification Anchors

- `tests/cli-install-output.test.js:44-56` 与 `tests/cli-install-output.test.js:222-229` 静态断言 `install --yes --dry-run` 的结果只有 `codex-plugin`。
- `tests/cli-install-output.test.js:232-265` 检查保存选择会成为 checklist 预选，无效保存内容则回退到 `codex-plugin`。
- `tests/cli-install-output.test.js:268-274` 检查未知显式目标以退出码 2 失败；`tests/cli-install-output.test.js:450-469` 检查显式目标路径不改写保存的交互选择。
- 现有测试没有直接覆盖 `--all` 的完整顺序、`--target pi,cursor,pi` 的去重、CI/非 TTY gate 或 external 确认；这些结论由上述源代码分支直接证明。

## Learning Check

**Prediction**

- 在 CI 或非 TTY 环境运行 `install --yes --dry-run` 时，它会到达 TTY gate、读取保存的选择状态，还是显示 external 确认？

**Transfer**

- 运行 `install --target unknown --yes` 时，最先在哪里失败，后续哪些阶段因此不可达？

**Key**

- **Prediction — 都不会。** `yes` 分支位于 TTY/CI 检查之前，直接选出默认的 `codex-plugin`；`dryRun` 不参与选择，所以不会读取保存状态或创建交互确认。（bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#targets）
- **Transfer — 先在显式目标校验失败。** `options.targets` 分支先于 `yes`，`validateTargets` 遇到 `unknown` 后由 `die` 以退出码 2 终止；默认目标筛选、TTY gate、保存状态读取、checklist/external 确认、`installTargets` 和结果输出均不可达。（bin/csl-agent-kit.js#resolveInstallTargets；bin/csl-agent-kit.js#validateTargets；bin/csl-agent-kit.js#die；bin/csl-agent-kit.js#main）
