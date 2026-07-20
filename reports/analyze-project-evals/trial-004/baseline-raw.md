# Baseline Raw Output

## Arm D — 原始最终回复

这个安装组件的主体结构是合适的：目标定义集中、实际副作用集中、输出与执行基本分离。当前最需要开发者关注的不是拆文件或增加抽象，而是让“安装结果”准确反映机器的最终状态。

### 组件契约

入口流程从第 33 行开始：

```text
读取命令
→ 解析 install 选项
→ 确定目标列表
→ 顺序执行各目标
→ 输出文本或 JSON
→ 根据 result.ok 设置退出码
```

`targets` 是组件的核心目录，保存三个安装目标及其策略信息：

- `cursor`：维护 `~/.cursor/plugins/local/csl` 符号链接；
- `codex-plugin`：通过 Codex CLI 重装 marketplace 与插件，并清理旧 skill 链接；
- `pi`：执行 `pi install <repoRoot>`。

### 状态变更清单

| 状态 | 写入位置 | dry-run 行为 |
|---|---|---|
| 上次交互选择 | `~/.csl-agent-kit/install-selection.json` 或自定义根目录 | 只有交互分支会保存；dry-run 不影响该保存逻辑 |
| Cursor 插件链接 | `~/.cursor/plugins/local/csl` | 仅返回计划记录 |
| Codex 插件与 marketplace | 外部 Codex CLI 管理的状态 | 不启动子进程 |
| 旧 skill 链接 | `~/.agents/skills/*` | 扫描但不删除 |
| Pi 包状态 | 外部 Pi CLI 管理的状态 | 不启动子进程 |

这里有一个值得明确的细节：交互选择在安装开始前就会被记住，所以记录的是“用户选择”，不是“成功安装的目标”。

### 正确性问题

#### 高：依赖缺失被计为成功

第 227–249 行在找不到 `codex` 或 `pi` 时返回 `skip`。第 209–220 行只以 handler 是否抛异常决定 `ok`，因此 skip 会得到 `ok: true`。顶层 JSON、文本 ready 计数与退出码都继续把它当成成功。

这破坏了 CLI 对自动化调用者的基本承诺。最小修复是：用户明确选中的 target 缺少必需 CLI 时抛出错误，让该 target 失败。若必须保留跳过语义，则顶层成功条件不能再只看 `ok`。

#### 高：Codex 重装存在不可恢复的中间状态

Codex 路径先执行六条 remove，再执行两条 add。任何 add 失败都会保留之前的删除结果，当前函数也不会把已经完成的 changes 附在错误结果上。调用者只能知道安装失败，不知道环境已被改到哪一步。

建议在删除前完成所有可做的预检，把兼容旧名称的清理尽量放到新安装成功后，并让失败结果保留已执行动作。无需实现通用事务系统。

#### 中：允许失败的命令在摘要中仍显示完成

`runCommands` 会记录非零 `status`，但只要 `allowFailure` 为真就继续执行，并仍返回 `action: "command"`。`summarizeChanges` 随后把所有 command 统一描述为 “completed”；`printChangeDetails` 也不展示 status。

直接依据现有 `status` 调整摘要和 verbose 输出即可，不需要扩展命令元组。

#### 中：无效调用可能以成功状态结束

- `--all` 分支先于 target 校验，因此同时传入错误 target 时会被忽略。
- 除 `install` 外的未知顶层命令都会打印帮助并自然退出 `0`。

前者会隐藏配置错误，后者会隐藏命令拼写错误。显式 target 应先验证；无参数可显示帮助，未知命令应退出 `2`。

#### 低：环境和子进程细节

- `CI=false` 仍是非空字符串，会禁用交互。
- 自动颜色没有结合 `process.stdout.isTTY`。
- `spawnSync` 没有 timeout，且启动失败时没有优先使用 `result.error`。

这些不会改变主要安装逻辑，但会降低流水线输出和故障诊断的可靠性。

### 已有防护

- Cursor 目标拒绝覆盖普通文件或目录。
- 已正确指向仓库的链接返回 `unchanged`。
- 旧链接删除前同时检查对象类型和来源范围。
- 选择文件采用临时文件后 rename，并设为 `0600`。
- 单目标异常被隔离，后续目标仍可执行。
- 所有安装副作用都有 dry-run 分支。

### 最小修改顺序

1. 让缺失外部 CLI 产生失败结果。
2. 调整 Codex 操作顺序，并保留部分执行信息。
3. 让命令摘要尊重 `status`。
4. 收紧顶层命令和 target 校验。
5. 补充四个最小行为检查：缺失 CLI、Codex add 失败、`--all` 加非法 target、未知顶层命令。

按要求仅做了源码静态分析，没有修改或运行该组件。

## Arm L — 原始最终回复

这份代码适合“倒着读”：先看它怎样宣布成功，再追踪谁产生结果，最后看输入如何选择这些执行路径。这样最容易发现安装器真正的行为契约。

### 1. 先读输出：什么叫完成

第 366–403 行把每个 target 的结果渲染成终端文本。成功 target 的 `changes` 会被展平，并按 action 计数：

```text
symlink   链接已更新
unchanged 已经是目标状态
command   命令已完成或计划执行
remove    旧链接已删除或计划删除
skip      已跳过
```

最终 ready 数量只统计 `result.ok`。第 33–45 行的 JSON 顶层 `ok` 和退出码也使用同一个判断：所有 target 的 `ok` 都为真则成功。

因此，学习这份文件时要一直追问：谁设置 `result.ok`？

### 2. 再读结果生产者

答案在第 209–220 行。`installTargets` 逐个调用注册表中的 `run`：

```js
handler 正常返回 → { target, ok: true, changes }
handler 抛出异常 → { target, ok: false, error }
```

这意味着 `ok` 描述的是控制流，而不是最终环境。比如 Codex 或 Pi 不存在时，handler 正常返回一条 `skip`，所以仍会得到 `ok: true`。

三个 handler 的工作量不同：

- Cursor 只调用一次本地链接 helper。
- Codex 组织八条外部命令，再扫描并清理旧链接。
- Pi 只组织一条外部安装命令。

### 3. 理解副作用原语

真正接触系统的函数集中在第 251–360 行。

`ensureSymlink` 负责 Cursor 链接：

- 目标为空时创建；
- 已指向正确来源时不动；
- 其他符号链接会替换；
- 普通文件或目录不会覆盖。

`removeLegacyCodexSkillLinks` 遍历 `~/.agents/skills`，只处理符号链接。`isWithin` 用相对路径判断链接来源是否属于当前仓库的 `skills` 根目录。

`runCommands` 同步执行命令数组。每个条目是：

```js
[commandName, args, allowFailure]
```

非零状态且不允许失败时抛错；允许失败时保存 status 后继续。

### 4. 最后读输入选择

第 51–99 行把参数归一为 options，第 101–155 行决定安装目标。分支顺序本身就是优先级：

| 条件 | 结果 |
|---|---|
| `all` 为真 | 全部三个目标 |
| 有显式 targets | 校验后去重 |
| `yes` 为真 | 只取 `default: true` 的目标 |
| 以上都没有 | 交互式多选 |

交互模式还有两项额外行为：读取上次选择作为默认值；若选中 `external: true` 的目标，则要求再次确认。显式 target、`--all` 和 `--yes` 都不会经过这个确认问题。

### 5. 用失败场景串起整条链

设想这个调用：

```bash
csl-agent-kit install --target cursor,pi --verbose
```

再假设 Cursor 目标路径已经是普通目录，而系统中没有 `pi`：

1. 参数解析得到两个显式 target，不进入交互。
2. Cursor handler 尝试维护链接，发现普通目录后抛错。
3. 调度器记录 `{ target: "cursor", ok: false, error }`，然后继续。
4. Pi handler 发现命令不存在，返回 `skip`。
5. 调度器把 Pi 记录为 `{ target: "pi", ok: true, changes: [...] }`。
6. 文本汇总会把 Pi 算作一个 ready 集成，同时显示它被跳过。
7. 因为 Cursor 为 false，进程整体退出 `1`。

这个例子展示了三个核心特征：目标之间故障隔离、skip 与成功共用 `ok: true`、最终退出码只看 result 层。

### 6. dry-run 究竟保证什么

dry-run 会阻止：

- `mkdir`、`unlink`、`symlink`；
- Codex 与 Pi 子进程启动。

它不会阻止：

- 解析仓库真实路径；
- 检查和遍历旧链接目录；
- 读取链接内容；
- 构造完整命令列表。

所以它是“无安装写入的计划生成”，不是完全脱离环境的纯计算。

### 7. 扩展代码时遵守现有协议

新增 target 最少需要：

1. 在 `targets` 注册标题、说明、默认值、external 和 handler。
2. handler 接收 options。
3. 在副作用发生前处理 `dryRun`。
4. 正常路径返回 change 或 change 数组。
5. 无法完成时抛错，而不是返回一个看似成功的空结果。

不需要为第四个 target 预先创建基类或工厂；当前注册表已经是足够的扩展点。

本次只阅读了指定源码，没有修改文件，也没有执行项目、构建或测试。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
