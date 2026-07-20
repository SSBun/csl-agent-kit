# Baseline Raw Output

## Arm D — 原始最终回复

该组件用一个文件同时服务交互用户和自动化调用者。主干简单，目标执行也是同步串行；真正需要开发处理的是各运行模式之间的行为不完全一致，特别是 dry-run、JSON 和成功退出的含义。

### 运行模式矩阵

| 调用方式 | 目标来源 | 交互 | 主要行为 |
|---|---|---|---|
| 无选择参数 | 历史选择或默认值 | 是 | 多选、外部命令确认、保存选择 |
| `--target`/位置参数 | 显式名称 | 否 | 校验、去重、按输入顺序执行 |
| `--yes` | `default: true` | 否 | 当前只选择 `codex-plugin` |
| `--all`/`all` | 注册表全部键 | 否 | Cursor、Codex、Pi 顺序执行 |
| `--dry-run` | 与以上模式组合 | 视选择方式而定 | 安装动作预览 |
| `--json` | 与以上模式组合 | 视选择方式而定 | 安装完成后输出结果 JSON |

控制流为：`main → parseInstallArgs → resolveInstallTargets → installTargets → 输出/退出`。`targets` 注册表承担目标元数据和 handler 路由，当前规模下无需再加框架。

### 模式契约中的问题

#### 1. dry-run 并非始终只读

当调用进入交互分支时，`resolveInstallTargets` 会保存本次选择；这一步没有检查 `options.dryRun`。因此 `install --dry-run` 仍可能创建目录并更新 `install-selection.json`，与帮助中的 “without changing files” 不一致。

修复只需在保存选择前判断 dry-run，不需要改动各安装 handler。

#### 2. JSON 只覆盖正常进入结果阶段的调用

`--json` 的序列化发生在目标解析和执行之后。参数错误、非法 target、非 TTY 交互错误和取消操作都通过 `die` 输出普通文本并退出 `2`，不会返回 JSON 错误对象。

这未必必须修改，但应明确契约：如果 `--json` 面向稳定的程序调用，则错误也应保持机器可读；若只保证成功结果为 JSON，帮助文案需要说清楚。

#### 3. 缺少外部 CLI 仍满足成功条件

Codex 或 Pi 不可用时，handler 返回 `skip`。`installTargets` 以“是否抛异常”生成 `ok`，所以 skip 得到 `ok: true`。随后文本 ready 计数、顶层 JSON `ok` 和退出码都会把它当成功。

最小修复是让显式请求但无法执行的 target 抛错。这样现有结果结构和退出聚合都可继续使用。

#### 4. Codex 操作无法保证失败前状态

执行顺序先删除六个当前或旧名称，再添加 marketplace 与插件。新增阶段失败时，前面动作不会恢复；异常还会让 `runCommands` 已收集的 changes 丢失，结果中只剩错误字符串。

应先做命令与输入预检，并把纯旧别名清理延后。若仍可能部分失败，错误结果至少要保留已执行动作，便于人工恢复。

#### 5. 允许失败的命令缺乏可见性

六条 remove 允许返回非零，`runCommands` 也保存了 status；但摘要仍把所有 command 说成 completed，verbose 只显示命令文本。渲染层没有消费已经存在的状态数据。

直接在摘要和明细中区分 `status === 0` 与被忽略的非零状态即可。

#### 6. 参数边界有两个异常情况

- `--all` 比显式 target 校验更早返回，组合中的错误 target 会被忽略。
- `--target --dry-run` 会把 `--dry-run` 当作 target 值，而不是报告缺少 target 参数。

第二项源于只检查下一个 token 是否存在，没有检查它是否仍是 option。解析器保持手写即可，但应补这个守卫。

未知顶层 command 也会打印帮助并以 `0` 结束，容易掩盖拼写错误。

### 正向实现特征

- 子进程通过参数数组启动，没有经过 shell 拼接。
- Cursor 链接不会覆盖普通文件或目录。
- 链接已正确时返回 unchanged，重复调用不会重写。
- 旧 skill 清理只作用于符号链接，并检查来源是否位于仓库 skills 根下。
- 选择文件使用 `0600` 临时文件后 rename。
- 一个目标失败不会阻断其他目标。
- 显式 target 保持顺序并去重，便于预测执行次序。

### 最小开发计划

1. 修正交互 dry-run 的选择文件写入。
2. 将缺失必需 CLI 改为目标失败。
3. 延后 Codex 旧别名清理，并保留部分执行信息。
4. 展示被允许忽略的命令失败。
5. 补齐参数值检查和未知 command 错误。
6. 决定 `--json` 是否覆盖错误路径，并据此实现或更新帮助。

本次只进行了指定文件的静态分析，没有修改源码或运行任何项目命令。

## Arm L — 原始最终回复

虽然这是 JavaScript 文件，但可以先把它当成有四种数据类型的程序来读。理解 Options、TargetSpec、Change、Result 后，函数之间的关系就很清楚。

### 1. Options：用户要求怎样运行

`parseInstallArgs` 产出的对象可以写成：

```text
Options = {
  all,
  colorMode,
  dryRun,
  json,
  verbose,
  yes,
  targets[]
}
```

它只负责把 token 归一化，不决定最终目标。目标字符串会按逗号拆分，位置参数与 `--target` 最终都进入 `targets[]`。

`resolveInstallTargets` 再消费 Options：

```text
all → 全部目标
targets 非空 → 校验并去重
yes → 默认目标
其他 → 交互选择
```

因此分支顺序也定义了参数优先级。

### 2. TargetSpec：每个目标是什么

文件顶部的注册表可以抽象成：

```text
TargetSpec = {
  title,
  description,
  default,
  external,
  run(options)
}
```

三项的差异主要在 `run`：

- Cursor 把仓库根目录链接到用户的 Cursor 插件目录。
- Codex 执行一组 remove/add 命令，之后清理旧 skill 链接。
- Pi 执行一次 `pi install`。

`default` 只供 `--yes` 使用；`external` 只供交互确认使用。显式 target 不会触发 external 确认，因为它没有进入 prompts 分支。

### 3. Change：handler 描述了什么

handler 返回的不是打印文本，而是一组动作对象。它们形成一个简单的联合类型：

```text
Change =
  | { action: symlink, target, source, dryRun? }
  | { action: unchanged, target, source }
  | { action: command, command, status?, dryRun? }
  | { action: remove, target, source, dryRun? }
  | { action: skip, reason, command }
```

这层设计把“做了什么”与“怎样展示”分开。普通输出会按 action 聚合，verbose 会逐项打印，JSON 则保留原始对象。

### 4. Result：目标是否成功

`installTargets` 将每个 handler 包装成：

```text
Result =
  | { target, ok: true, changes }
  | { target, ok: false, error }
```

这里的判断非常机械：正常 return 就是 true，throw 才是 false。于是 `skip` 虽然表示没有安装，却仍属于 `ok: true`。

顶层结果和退出码都执行：

```js
results.every(item => item.ok)
```

所以要区分两个概念：代码中的 ok 是“handler 无异常”，用户理解的成功通常是“目标已经可用”。两者当前并不总相等。

### 5. 四个循环分别负责什么

文件中最重要的循环有四个：

1. 参数循环：逐个消费命令行 token。
2. target 循环：顺序运行所选集成，并隔离异常。
3. command 循环：同步运行 Codex/Pi 命令列表。
4. 旧链接循环：检查 `~/.agents/skills` 中每个直接子项。

这些循环都是串行的，因此执行顺序稳定，也不会出现并发写入冲突。代价是外部命令慢时整个 CLI 会阻塞。

### 6. 文件系统规则

Cursor 链接处理分四种情况：

| 当前目标 | 行为 |
|---|---|
| 不存在 | 创建链接 |
| 已指向仓库 | 返回 unchanged |
| 是其他符号链接 | 删除后重建 |
| 是普通文件/目录 | 抛错 |

旧 skill 清理更保守：目标必须是符号链接，并且其原始或解析后的来源必须位于当前仓库 skills 根目录中。

选择记忆保存在 `install-selection.json`。读取失败会回退到默认选择；写入使用临时文件、`0600` 权限和 rename。

### 7. 模式推演

```bash
csl-agent-kit install --target cursor --dry-run --json
```

数据变化如下：

```text
Options.targets = [cursor]
→ selected = [cursor]
→ Change(action=symlink, dryRun=true)
→ Result(target=cursor, ok=true)
→ JSON + exit 0
```

不会进入交互，也不会保存选择文件。

再看：

```bash
csl-agent-kit install --all --verbose
```

它会按注册表顺序执行 Cursor、Codex、Pi。即使 Cursor 失败，后两个目标仍会继续；最终只要有一个 Result 为 false，整体退出 `1`。`--all` 也不会询问 external 确认。

最后看一个反直觉组合：

```bash
csl-agent-kit install --dry-run
```

在 TTY 中它进入交互，读取旧选择并保存新选择。安装副作用不会发生，但选择文件仍可能改变。因此 dry-run 标志在安装原语中生效，却没有覆盖选择持久化。

### 8. 阅读后的检查点

- `--yes` 当前只选择 Codex，因为只有它的 default 为 true。
- `--json` 不保证参数错误也是 JSON；错误可能由 `die` 直接输出文本。
- allowFailure 只影响是否抛错，不影响 command action 名称。
- `--all --target invalid` 不验证 invalid，因为 all 分支先返回。
- 缺少 Codex/Pi CLI 会生成 skip，而不是失败 Result。

本次仅对源码做静态讲解，没有修改文件或执行组件。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
