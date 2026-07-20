# Baseline Raw Output

## Arm D — 原始最终回复

该文件实现的是一个小型安装协调器，而不是安装逻辑库：它决定目标、调用副作用、记录动作，再把结果翻译成终端或 JSON。代码量不大，现有函数边界足以承载当前三个目标；风险主要来自几个全局语义没有贯穿所有路径。

### 五类策略

| 策略 | 实现位置 | 当前规则 |
|---|---|---|
| 目标目录 | 第 9–31 行 | Cursor、Codex、Pi 三项，Codex 为默认项 |
| 选择 | 第 51–155 行 | `--all`、显式 target、`--yes`、交互依次优先 |
| 执行 | 第 209–360 行 | 每个目标同步执行，异常按目标隔离 |
| 记录 | 各 handler | 返回 symlink、command、remove、skip 等 change |
| 呈现 | 第 366–442 行 | 人类摘要或 JSON，退出码依赖所有 `result.ok` |

注册表方式很合适：增加目标只需增加一条描述和一个 handler。当前没有理由引入类层次、工厂或插件接口。

### 发现

#### 高：交互式 dry-run 仍会修改文件

帮助文本承诺 `--dry-run` 不修改文件，但交互路径在第 149–150 行无条件调用 `saveInstallSelection`。因此在 TTY 中执行不带 target 的 `install --dry-run`，用户确认选择后仍会创建或更新 `install-selection.json`。

其他副作用函数都检查了 `options.dryRun`，只有选择持久化漏掉了这条全局约束。最小修复是在 dry-run 时不保存选择，或者把帮助文案明确限定为“不执行安装动作”；前者更符合通常预期。

#### 高：目标未就绪却能整体成功

Codex/Pi handler 在缺少外部 CLI 时返回 `skip`，没有抛异常。`installTargets` 将任何正常返回包装成 `ok: true`。结果是：

- `--json` 的顶层 `ok` 仍可能为 true；
- 进程可能以 `0` 退出；
- 文本把被跳过的目标计入 ready。

如果用户明确选中了目标，缺少安装前提应是失败。直接抛错比新增状态机更简单，也更符合安装命令的契约。

#### 高：Codex 路径可能先卸载后失败

该路径先删除六个插件或 marketplace 标识，再执行两条新增命令。新增失败不会恢复已删除状态；而且 `installTargets` 只保留异常消息，已执行的 changes 也随异常丢失。

建议把仅用于兼容迁移的旧名称清理移到成功安装之后，并在真正变更前完成可行的检查。无需构建通用回滚机制，但至少不要无谓地提前删除仍可工作的旧状态。

#### 中：输出不能如实反映允许失败的命令

`runCommands` 对 `allowFailure` 命令保留非零 `status`，随后仍返回普通 `command` action。摘要只数 action，因而会说这些命令 “completed”；verbose 输出也不打印 status。

现有 change 已有足够信息，渲染层按 status 区分即可。

#### 中：参数错误有两条漏网路径

1. `--all` 在验证显式 target 前返回，所以 `--all --target typo` 不报错。
2. 未知顶层命令只显示帮助并以成功状态结束。

对命令行自动化而言，静默忽略比明确失败更危险。所有显式 target 应先验证；未知 command 应调用参数错误出口。

#### 低：运行环境处理不完整

- `CI` 的任意非空字符串都会禁用交互，包括 `CI=false`。
- 自动颜色没有检查 stdout TTY，重定向输出可能含 ANSI 序列。
- 同步子进程没有 timeout；启动失败时错误信息不会优先采用 `result.error`。

### 防误操作设计

文件操作部分有几项值得保留：

- Cursor 安装拒绝覆盖非符号链接对象。
- 已正确链接时不会重复写入。
- 旧 skill 清理只删除链接，不删除目录或普通文件。
- 删除候选必须指向当前仓库 skills 范围。
- 选择文件通过同目录临时文件和 rename 更新，文件模式为 `0600`。
- 单个目标失败后仍会处理剩余目标。

### 建议的最小验证集

后续修改时，四个行为检查就能覆盖主要契约：

1. 交互 dry-run 不写选择文件。
2. 显式 Codex/Pi 在 CLI 缺失时返回非零。
3. Codex 新增失败时不提前清除无关旧别名。
4. 未知 command 和 `--all` 搭配非法 target 都返回参数错误。

本次没有修改源码，也没有执行安装器、构建或测试。

## Arm L — 原始最终回复

可以用五个问题读懂这个 CLI：能装什么、怎样选、会改什么、失败怎样传播、结果怎样告诉用户。下面按这五个问题走一遍。

### 1. 能装什么？

答案在文件顶部的 `targets`：

| 名称 | handler | external | default |
|---|---|---:|---:|
| `cursor` | `installCursor` | false | false |
| `codex-plugin` | `installCodexPlugin` | true | true |
| `pi` | `installPi` | true | false |

`external` 只控制交互流程是否追加确认问题；`default` 只决定 `--yes` 选哪些目标。它们不直接执行安装。

### 2. 怎样选择目标？

`parseInstallArgs` 先生成 options。target 可以是位置参数，也可以用 `--target`/`--targets`，并支持逗号列表。

`resolveInstallTargets` 再按分支顺序选择：

```text
--all          → Object.keys(targets)
显式 targets  → 校验并用 Set 去重
--yes          → 取 default 目标
其他           → 交互多选
```

这个顺序会产生两个容易忽略的结果：

- `--target cursor --yes` 仍只选择 Cursor；
- `--all --target bad` 直接选择全部目标，`bad` 不会被校验。

交互模式会读取上一次选择；选择 external 目标后还需确认。非 TTY 或存在 `CI` 环境变量时，代码要求调用者显式指定目标、`--all` 或 `--yes`。

### 3. 会改变哪些状态？

整体关系如下：

```text
交互选择 ──→ install-selection.json
Cursor   ──→ ~/.cursor/plugins/local/csl
Codex    ──→ plugin/marketplace 状态
         └─→ ~/.agents/skills 中的旧链接
Pi       ──→ pi install 管理的状态
```

Cursor 的规则最完整：正确链接保持不变，其他链接被替换，普通文件或目录拒绝覆盖。

Codex 会顺序执行八条命令：六条 remove 允许失败，两条 add 必须成功。命令全部完成后才扫描旧 skill 链接。

Pi 只调用一条 `pi install <repoRoot>`；它是否幂等由 Pi CLI 自己决定。

### 4. dry-run 是否完全不写？

不是所有路径都如此。

安装相关的三个底层操作遵守 dry-run：

- 不创建或删除符号链接；
- 不删除旧 skill 链接；
- 不启动 Codex/Pi 子进程。

但如果调用没有显式目标并进入交互，`resolveInstallTargets` 仍会保存用户选择。也就是说，交互式 `install --dry-run` 可能更新 `install-selection.json`。这与帮助中的“不修改文件”描述存在差异。

此外，dry-run 仍会读取真实路径、遍历旧链接目录并构造命令记录；预览需要这些信息。

### 5. 失败怎样传播？

有三层行为：

**参数/交互层**

`die` 打印错误并退出 `2`，例如未知 option、非交互环境缺少选择方式、用户取消确认。

**目标层**

`installTargets` 捕获每个 handler 的异常，生成 `ok: false`，然后继续下一个目标。一个目标失败不会阻止其他目标。

**外部命令层**

不允许失败的命令返回非零会抛异常；允许失败的命令只记录 status。Codex/Pi 命令根本不存在时，handler 返回 `skip`，而不是抛错。

最后这一点很关键：调度器把 skip 当成正常返回，所以对应 target 是 `ok: true`。

### 6. 结果怎样交付？

普通模式把 changes 按 action 汇总；verbose 再逐条显示路径或命令。JSON 模式直接输出：

```js
{
  ok: results.every(item => item.ok),
  results
}
```

退出码也用同一个 `every` 判断。由此可知，“进程成功”的严格含义是“所有 handler 都没有抛异常”，而不是“所有集成都完成安装”。

### 推演两个调用

```bash
csl-agent-kit install --yes --dry-run --json
```

- `--yes` 选择唯一默认目标 `codex-plugin`；
- 不进入交互，因此不保存选择文件；
- 不检查 Codex CLI，也不执行八条命令；
- 返回计划命令，并只读扫描旧链接；
- 没有异常时 JSON 顶层 `ok` 为 true。

```bash
csl-agent-kit install --dry-run
```

- 在 TTY 中进入交互；
- 读取历史选择并要求用户确认 external 目标；
- 确认后先保存本次选择，即使这是 dry-run；
- 随后才生成安装预览。

读到这里，应能回答三个检查题：

1. 为什么显式 target 不会出现 external 确认？因为该确认只存在于交互分支。
2. 为什么 Codex 的六条 remove 失败后可能仍显示 completed？因为摘要只统计 `action: "command"`，没有查看 status。
3. 为什么缺少 Pi CLI 可能退出 `0`？因为 `skip` 是正常返回，调度器据此设置 `ok: true`。

本次只对指定文件做了静态走读，没有修改或运行代码。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
