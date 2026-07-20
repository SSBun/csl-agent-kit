# Baseline Raw Output

## Arm D — 原始最终回复

这个组件的设计核心不是三个 installer，而是两份隐式协议：handler 返回 change 作为动作日志，调度器用“是否抛异常”判定 target 成败。结构简洁，但几条用户可见的不变量没有被代码完整维持。

### 结构概览

```text
targets 注册表
    ↓
参数解析 → 目标解析 → handler 串行执行
                         ↓
                   change[] / error
                         ↓
                 文本或 JSON + 退出码
```

目标策略集中在 `targets`，通用机制集中在符号链接、旧链接清理和命令执行函数。没有动态插件发现，也没有不必要的抽象；针对三个固定集成，这是合理取舍。

### 不变量检查

| 期望不变量 | 当前是否成立 | 反例 |
|---|---:|---|
| dry-run 不写文件 | 否 | 交互路径仍保存 `install-selection.json` |
| `ok: true` 表示集成 ready | 否 | 缺少 Codex/Pi 时返回 skip，但仍为 true |
| “command completed” 表示状态码为 0 | 否 | allowFailure 命令非零仍被计为 completed |
| 显式错误输入一定被拒绝 | 否 | `--all --target invalid` 跳过 target 校验 |
| 更新失败不会无声丢失旧状态 | 否 | Codex 先 remove，add 失败后无恢复或动作日志 |
| 单 target 失败不阻断其他 target | 是 | `installTargets` 按 target 捕获异常 |
| 不覆盖未知普通文件/目录 | 是 | Cursor 仅接管符号链接 |

### 主要问题

#### P1：dry-run 的全局约束漏过了选择持久化

安装原语都检查 `options.dryRun`，但交互选择保存发生在执行 installer 之前，且没有同样的守卫。用户在 TTY 中执行 `install --dry-run`，确认目标后仍可能创建目录和选择文件。

这是单点遗漏：在 dry-run 时跳过 `saveInstallSelection` 即可解决，无需修改 handler。

#### P1：成功模型把 skip 当成 ready

`installCodexPlugin` 和 `installPi` 在命令缺失时正常返回 skip。`installTargets` 只在异常时生成 `ok: false`，所以整体退出码和 JSON 不能区分“已安装”和“未执行”。

如果 target 是用户主动选择的，依赖缺失应直接失败。当前只有一种可跳过情形，不值得为此引入多状态框架。

#### P1：Codex 更新会产生不可见的部分变更

六条删除命令先于两条新增命令。新增失败时旧注册可能已经消失；同时 `runCommands` 的局部 changes 因抛错无法返回，最终 Result 只有 error message。

最小风险降低方式是：先做可执行文件和输入预检，成功添加当前标识后再清理纯旧别名。仍不可避免的部分动作应附在失败结果中。

#### P2：动作日志与人类摘要不一致

command change 已包含 `status`，但摘要只检查 action 类型。允许失败的删除命令即使非零，仍显示为 completed；verbose 也不输出 status。这里不缺数据，只缺渲染逻辑。

#### P2：解析器没有完整验证参数边界

- `--all` 在显式 target 校验前短路。
- `--target` 后接另一个 option 时，后者会被消费成 target 值。
- 未知顶层 command 与无参数调用一样，只打印帮助并成功结束。

保持手写解析器仍是最小方案；增加 token 类型判断和顶层 command 分支即可。

#### P3：终端与子进程诊断

- auto color 不判断 stdout TTY。
- 任意非空 `CI` 值都会禁止交互。
- `spawnSync` 没有超时，启动错误也没有优先展示 `result.error`。
- `--json` 只覆盖正常产生 results 的路径，早期错误仍是文本。

### 安全边界

几项实现降低了误操作风险：

- `spawnSync` 使用参数数组而非 shell 字符串。
- 符号链接来源先解析为真实仓库路径。
- 旧 skill 删除只作用于符号链接，并使用 `isWithin` 限定来源。
- 旧链接目录自身若是符号链接，会直接跳过。
- 选择文件通过临时文件 rename，且模式为 `0600`。
- ENOENT 在旧链接扫描中按“无需清理”处理，其他文件系统错误继续上抛。

### 建议用反例驱动修复

每项修复对应一个最小行为检查：

1. 交互 dry-run 后选择文件不存在或保持原内容。
2. 指定 Pi 且 `pi` 不存在时，Result 为 false、退出码为 1。
3. allowFailure 命令非零时，输出不得写 completed。
4. `--all --target invalid` 和 `--target --dry-run` 都退出 2。
5. Codex add 失败时，错误结果列出此前已执行动作。

本次只阅读指定源码，未修改文件，也未运行程序、构建或测试。

## Arm L — 原始最终回复

下面用“纸上执行”读懂这个安装器。选一个包含重复目标、dry-run 和详细输出的调用：

```bash
csl-agent-kit install --target cursor,codex-plugin,cursor --dry-run --verbose
```

不实际运行，也能沿函数逐步推出结果。

### 第 1 步：`main` 拆出 command

`process.argv.slice(2)` 的首项是 `install`，其余 token 交给 `parseInstallArgs`。只有这个 command 会进入安装分支；其他 command 都只显示总帮助。

### 第 2 步：parser 建立 options

循环处理参数后，关键字段是：

```js
{
  dryRun: true,
  verbose: true,
  targets: ["cursor", "codex-plugin", "cursor"]
}
```

`--target` 的值先按逗号拆开。此时重复项仍存在，因为 parser 只负责采集。

### 第 3 步：resolver 校验并去重

没有 `--all`，所以进入显式 targets 分支。`validateTargets` 确认三个名称都在注册表中，然后 `new Set(...)` 保留首次出现顺序：

```js
["cursor", "codex-plugin"]
```

因为已经显式指定目标，不会加载 prompts、读取历史选择、保存选择，也不会询问 external 确认。

### 第 4 步：执行 Cursor target

`installCursor` 调用 `ensureSymlink`。它先解析仓库根目录的真实路径，再构造：

```js
{
  action: "symlink",
  target: "~/.cursor/plugins/local/csl",
  source: repoRootRealPath,
  dryRun: true
}
```

由于 dry-run 在创建父目录前返回，所以不会检查或改变现有 Cursor 目标。

### 第 5 步：执行 Codex target

dry-run 下不会调用 `hasCommand("codex")`。`runCommands` 把八条 remove/add 全部转换成计划 command，不启动子进程。

随后 `removeLegacyCodexSkillLinks` 仍会读取仓库 skills 路径和 `~/.agents/skills`。每个匹配的旧链接会产生一条 `remove` 计划，但不会 unlink。因此 Codex 的 changes 是：

```text
8 条计划 command
+ 0 到多条计划 remove
```

### 第 6 步：形成 Results

两个 handler 都正常返回时，调度器产生：

```js
[
  { target: "cursor", ok: true, changes: [...] },
  { target: "codex-plugin", ok: true, changes: [...] }
]
```

`ok` 在这里表示 handler 没有抛异常。它不是对真实安装状态的再次检查。

### 第 7 步：详细文本输出

因为没有 `--json`，进入 `printResults`：

- 标题按 target title 的最大宽度对齐；
- changes 经 `flatten` 展平；
- 摘要统计 planned commands、planned links 和 planned removals；
- verbose 再逐条打印命令和路径；
- 两个 Result 都为 true，因此退出码是 0。

### 读懂三个 handler

| handler | 主要机制 | 自己掌握的幂等性 |
|---|---|---|
| Cursor | 符号链接 | 完整：相同则 unchanged，不同链接则替换 |
| Codex | remove/add 命令序列 | 部分依赖 Codex CLI；旧名称删除允许失败 |
| Pi | 单条 install 命令 | 完全交给 Pi CLI |

Cursor 对普通文件或目录会报错，避免覆盖未知用户数据。Codex 只有在八条命令全部结束后才清理旧 skill 链接。Pi 的实现最薄，只负责检查命令和传递仓库路径。

### 几个值得问“为什么”的细节

**为什么 `main` 是 async，而安装函数是同步的？**

只有交互 prompts 需要 await；文件系统和子进程路径都使用同步 API，保证安装步骤严格串行。

**为什么 `targets` 可以引用后面才声明的函数？**

这些 handler 使用 function declaration，JavaScript 会提升声明。

**为什么旧链接同时检查 `source` 和 `resolvedSource`？**

`source` 根据链接文本计算，即使链接悬空也能使用；`resolvedSource` 在链接有效时提供真实规范路径。任一落在 skills 根目录内，才允许删除旧链接。

**为什么有两次展平？**

旧链接扫描用 `flatMap` 让每个目录项返回零或一条 change；展示前的递归 `flatten` 则统一处理 handler 可能返回的嵌套 change 数组。

### 从调用预测行为

- `install --yes`：只选默认的 Codex，不进入交互。
- `install --all`：按 Cursor、Codex、Pi 顺序执行，不询问 external 确认。
- `install --target pi` 且没有 Pi CLI：产生 skip，但 Result 仍为 `ok: true`。
- `install --dry-run` 且进入交互：安装动作不执行，但选择文件仍可能被保存。
- `install --all --target bad`：`--all` 先返回，bad 不会被校验。

掌握这一次纸上执行后，阅读其他参数组合只需要替换 options 和 selected 两个中间状态。

本次仅进行静态源码讲解，没有修改或运行组件。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
