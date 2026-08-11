- Scope: bin/csl-agent-kit.js
- Need: Learn how --all, an explicit target, --yes, and bare install currently select targets. Use one representative path and one existing contrast branch; do not create a course or change plan.
- HEAD: 05a6c689e2344dc925b7dc111f02aa03750114f6
- Working tree: clean
- Generated at: 2026-08-09T15:35:02Z

## Direct Answer（直接回答）

当前目标解析是有优先级的短路链，而不是把各选项合并：`--all` 直接按 `targets` 的声明顺序选择 `cursor`、`codex-plugin`、`pi`；没有 `--all` 时，显式目标会先逐项校验，再按首次出现顺序去重；既无 `--all` 也无显式目标时，`--yes` 只选择 `default: true` 的 `codex-plugin`。最早改变结果的实质条件是 `resolveInstallTargets` 中的 `options.all`，后续依次才是 `options.targets.length > 0` 与 `options.yes`；因此组合使用时是 `--all` 覆盖显式目标和 `--yes`，显式目标覆盖 `--yes`。证据：[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#targets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#targets)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets)。

裸 `install` 不预先确定最终目标：在 TTY 且不处于 `CI` 时，它用已保存的有效选择作为 checklist 预选；没有有效记录时以 `codex-plugin` 为预选，最终以用户提交的 `response.selected` 为准。非 TTY 或 `CI` 会在读取保存记录之前以退出码 2 终止，因而不选择任何目标。涉及外部命令的交互选择若未确认，也会在返回选择前终止。证据：[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#buildInstallChoices"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#buildInstallChoices)。

## Need-bounded Working Model（需求限定工作模型）

- **目标目录是事实源。** `targets` 同时给出三个合法名称、声明顺序与默认位；当前只有 `codex-plugin.default` 为真。显式目标校验、`--all` 和 `--yes` 都从这一个对象派生。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#targets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#targets)
- **参数先归一化，再集中决策。** `parseInstallArgs` 把 `--all`（以及位置参数 `all`）设为布尔值，把 `--target`/`--targets`、`--target=...` 和其他非选项位置参数按逗号拆入同一 `options.targets`，并单独记录 `--yes`；参数出现顺序不会改变解析器之后的分支优先级。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#parseInstallArgs"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#parseInstallArgs)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#splitTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#splitTargets)
- **保存记录只服务裸交互模式。** `loadInstallSelection` 只保留当前仍存在的目标；空或无效结果变为 `null`，使 `buildInstallChoices` 回退到默认位。只有成功完成交互确认后才调用 `saveInstallSelection`；显式分支在此前已经返回，不读写该记录。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#loadInstallSelection"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#loadInstallSelection)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#saveInstallSelection"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#saveInstallSelection)

## Critical Evidence Path（关键证据路径）

代表路径：`csl-agent-kit install --target cursor,pi`。

| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
| 1 | `main` 识别 `install`，依次调用参数解析、目标解析和安装分派。 | 目标选择只经过一个 `resolveInstallTargets` 决策点。 | [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#main"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#main) |
| 2 | `parseInstallArgs` 将 `cursor,pi` 拆为 `options.targets = ["cursor", "pi"]`，且 `all`、`yes` 仍为假。 | 输入进入显式目标分支。 | [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#parseInstallArgs"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#parseInstallArgs) |
| 3 | `resolveInstallTargets` 跳过 `all`，校验两个名称并以 `Set` 去重后返回。 | 当前代表输入得到 `["cursor", "pi"]`；重复项只保留首次出现的位置。 | [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#validateTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#validateTargets) |
| 4 | `installTargets` 按返回顺序调用各目标的 `run`，并把名称写入每个结果的 `target`。 | 文本或 JSON 的可观察结果保持所选目标顺序。 | [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#installTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#installTargets) |
| 5 | 若任一显式名称不在 `targets` 中，`validateTargets` 调用 `die`。 | 安装分派前以退出码 2 结束；不会得到部分选择结果。 | [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#validateTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#validateTargets)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#die"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#die) |

## Verification Anchors（验证锚点）

- `JSON output remains valid and color-free when --color is passed` 断言 `--yes` 的结果目标精确等于 `["codex-plugin"]`；默认输出测试也断言出现 Codex、未出现 Cursor。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L44-L57"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L44-L57)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L222-L230"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L222-L230)
- 交互 checklist 测试断言有效保存记录会成为预选，无效记录会回退到 `["codex-plugin"]`；显式目标测试断言它不会覆写交互保存记录。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L232-L266"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L232-L266)、[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L450-L468"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L450-L468)
- 未知显式目标有现成退出断言；当前没有直接测试断言 `--all` 的完整目标数组、组合选项的优先级或裸 TTY 提交后的最终数组，这些结论由上述分支和目标目录直接证明。[`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L268-L285"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/tests/cli-install-output.test.js#L268-L285)

## Learning Check（学习检查）

### Prompts

- **Prediction：** 当前输入 `install --all --target pi --yes` 会把哪些目标交给 `installTargets`，顺序是什么？
- **Transfer：** 对比现有裸安装分支：当前输入 `install` 在 `CI` 中运行时，已保存的交互选择会不会决定目标？

### Key

- **Prediction — 判断：** `["cursor", "codex-plugin", "pi"]`。**原因：** `options.all` 是首个短路分支，直接返回 `Object.keys(targets)`，所以显式 `pi` 与 `--yes` 均不再参与决策。**锚点：** [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets)。
- **Transfer — 判断：** 不会。**原因：** 无前三类显式选择时，`CI` 检查先调用 `die`；`loadInstallSelection` 位于该退出之后。**锚点：** [`"/private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets"`](file:///private/tmp/analyze-project-need-contract-v1.9wTdVA/learning/bin/csl-agent-kit.js#resolveInstallTargets)。
