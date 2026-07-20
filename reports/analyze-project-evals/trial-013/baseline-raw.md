# Baseline Raw Output

## Arm D — 原始最终回复

这个安装组件的文件操作边界整体谨慎，目标注册和调度结构也足够简单。真正需要开发关注的是公共契约不一致：交互用户、自动化脚本和模块调用者对“成功、跳过、预览和失败”会得到不同且有时误导的信号。

### 组件对外的三种使用面

1. **交互 CLI**

   无显式 target 时加载 `prompts`，读取历史选择，并对 Codex/Pi 这类 external 目标追加确认。

2. **自动化 CLI**

   通过 `--target`、`--all` 或 `--yes` 选择目标，可组合 `--dry-run`、`--json` 和 `--verbose`。

3. **模块 helper**

   被 `require` 时不会执行 `main`，只导出：

   ```js
   buildInstallChoices
   loadInstallSelection
   saveInstallSelection
   ```

核心解析、安装和结果转换仍只能通过进程边界使用和测试。

### 内部执行链

```text
argv
→ parseInstallArgs
→ resolveInstallTargets
→ installTargets
→ target handler
→ change[]
→ Result
→ 文本 / JSON / 退出码
```

顶部 `targets` 注册表是合适的扩展点。当前只有 Cursor、Codex plugin 和 Pi，没有必要引入通用 provider、installer class 或异步任务框架。

### 问题优先级

| 优先级 | 问题 | 影响 |
|---|---|---|
| 高 | skip 被包装为 `ok: true` | 未安装也可能退出 0 |
| 高 | Codex 失败丢失已执行 changes | 无法判断部分完成状态 |
| 高 | 交互 dry-run 写选择文件 | 预览模式仍有持久化副作用 |
| 中 | `--json` 不覆盖早期错误 | 自动化需解析两种协议 |
| 中 | 参数优先级掩盖非法输入 | 拼写错误可能不被及时发现 |
| 中 | allowFailure status 不展示 | “completed” 可能包含失败 |
| 低 | color auto 不检查 TTY | 重定向文本可能带 ANSI |
| 低 | 外部命令无 timeout | CLI 可能无限阻塞 |

### 1. 成功状态的核心缺陷

Codex 或 Pi 不存在时，handler 返回一个 `skip` change，而不是抛异常。`installTargets` 的判断只有：

```text
正常 return → ok: true
throw       → ok: false
```

所以结果可能同时是：

```text
action: skip
ok: true
✓ target
integration ready
exit 0
```

这里的 `ok` 实际表示“handler 正常结束”，不是“目标安装完成”。CI 使用退出码或 JSON 顶层 `ok` 时会得到错误结论。

建议使用最小但明确的状态，例如：

```js
{
  target,
  status: "succeeded" | "skipped" | "failed" | "partial",
  changes,
  error
}
```

文本、JSON 和退出码都应从同一个状态派生。

### 2. Codex 是多阶段且非事务的

Codex handler 的顺序是：

```text
删除旧 plugin 身份（允许失败）
→ 删除旧 marketplace 身份（允许失败）
→ 添加当前 marketplace（必须成功）
→ 添加当前 plugin（必须成功）
→ 清理旧 skill links
```

这套顺序有一个正确的安全属性：plugin add 失败时，旧 skill links 不会被提前删除，聚焦测试也覆盖了这一点。

但仍有两个状态问题：

- 新增失败不会回滚此前删除或添加的内容；
- 后置清理失败时，plugin 可能已经安装成功。

异常穿过 `runCommands` 后，外层只保存 error message，已经累积的 changes 丢失。因此失败结果无法表达机器现在处于哪个阶段。

### 3. dry-run 的边界不一致

链接、命令和旧链接清理都正确地在副作用点支持 dry-run。但交互选择确认后会无条件调用 `saveInstallSelection`。

因此：

- `--yes --dry-run` 不写历史选择；
- 显式 target dry-run 不写历史选择；
- 交互 dry-run 可能写 `install-selection.json`。

帮助写的是“without changing files”，交互路径不满足这个承诺。

### 4. 自动化接口不完整

`--json` 只控制最终 results 的输出。以下路径仍走 `die`，输出普通 stderr 并退出 2：

- 未知 option；
- 非法 target；
- 无 TTY 且没有明确选择；
- `prompts` 缺失；
- 交互取消；
- external 未确认。

如果 JSON 被定义为机器接口，应让这些路径也返回稳定 JSON；若不准备这样做，至少应在帮助中明确 JSON 仅适用于安装结果。

### 5. 参数与命令边界

当前解析存在几个具体行为：

- `--all` 的优先级最高，因此 `--all --target bad` 不会校验 `bad`。
- `--target` 直接消费下一个 token，因此 `--target --dry-run` 会把 option 当作目标名。
- 显式 target 优先于 `--yes`。
- 未知顶层 command 只打印帮助并成功返回。
- `--verbose --json` 中 verbose 不产生额外明细。

其中显式 target 覆盖 `--yes` 可以视为合法优先级，其余至少应增加测试并明确或收紧。

### 安全性与幂等性

已有实现值得保留：

- `spawnSync` 使用 executable 与 argv 数组，不经过 shell。
- Cursor 不覆盖普通文件或目录。
- 正确链接返回 unchanged，其他链接才替换。
- 悬空链接能够被识别。
- 旧 skills 根目录本身是符号链接时不进入。
- 清理只处理直接子符号链接，不遍历目录。
- 链接的文本路径或真实路径必须落在项目 `skills` 范围。
- 普通目录、外部链接和外部断链会保留。
- 选择文件使用 `0600` 临时文件和 rename。
- target 失败相互隔离，其余目标继续执行。

### 聚焦测试现状

现有测试较好覆盖：

- 默认、verbose、颜色及 JSON 输出；
- Codex 迁移命令顺序；
- 交互选择保存与无效历史值回退；
- 废弃 target 过滤；
- 旧链接清理的 dry-run、范围和幂等性；
- plugin add 失败时保留旧 links；
- 显式安装不覆盖历史选择。

优先补充：

1. Codex/Pi 缺失时的 Result 与退出码；
2. 交互 dry-run 是否写选择文件；
3. 部分完成 Result；
4. `--all` 与非法 target；
5. `--target` 后接 option；
6. 未知顶层 command；
7. allowFailure 非零 status 的输出；
8. `spawnSync` 启动错误和超时。

### 推荐的最小开发顺序

1. 统一 Result 状态模型。
2. 修正 skip、文本成功标记和退出码。
3. 失败时保留已执行 changes。
4. 让交互 dry-run 不保存选择。
5. 收紧参数解析和未知 command。
6. 完善 JSON 错误与命令状态可观测性。
7. 补齐对应进程级测试。

保持单文件完成这些修改更合适；现在拆分只会增加导航成本，并不能解决状态语义问题。

本次仅进行了静态分析，没有修改源码，也没有运行项目、测试或构建。

## Arm L — 原始最终回复

理解这个 CLI，可以先记住四种数据：target spec、options、change 和 Result。它们依次回答四个问题：

```text
target spec：能装什么？
options：用户选择了什么？
change：计划或执行了什么？
Result：程序认为成功了吗？
```

最后一个问题最容易误读，因为当前“成功”只表示 handler 没有抛异常。

### 1. target spec：能安装什么

顶部注册表定义三个目标：

| 名称 | 实际动作 | 默认选择 | 需外部确认 |
|---|---|---:|---:|
| `cursor` | 创建本地插件符号链接 | 否 | 否 |
| `codex-plugin` | 调用 Codex CLI 安装 plugin | 是 | 是 |
| `pi` | 调用 `pi install` | 否 | 是 |

每个 target 的 `run` 字段指向对应 installer。新增第四个目标时，最自然的入口仍是这个注册表。

### 2. options：用户选择了什么

解析器识别：

```text
--target / --targets
--all
--yes
--dry-run
--verbose
--color / --no-color
--json
```

目标选择顺序是：

```text
all
→ 显式 targets
→ yes 对应的 default targets
→ prompts 交互
```

例子：

| 命令 | 选中的目标 |
|---|---|
| `install --yes` | `codex-plugin` |
| `install --target cursor --yes` | `cursor` |
| `install --all` | 三个目标 |
| `install cursor,pi` | `cursor`、`pi` |

显式目标会校验并去重。`--all` 会提前返回，所以同时提供的非法 target 不会校验。

### 3. prompts：没有显式选择时怎么办

交互模式要求：

```text
stdin 是 TTY
且
CI 环境变量不是真值
```

程序动态加载唯一第三方依赖 `prompts`，显示多选列表。预选顺序是：

```text
有效历史选择
否则
default targets
```

Codex 和 Pi 标为 external，因此选中它们后还会要求确认。

确认结果会保存到：

```text
~/.csl-agent-kit/install-selection.json
```

或者：

```text
$CSL_AGENT_KIT_HOME/install-selection.json
```

文件带 `version: 1`。读取失败、JSON 无效、版本不符或所有 target 都已废弃时，返回 `null` 并回到默认 Codex。

保存过程使用 `0600` 临时文件再 rename，避免直接把正式文件写到一半。

### 4. change：installer 做了什么

**Cursor**

来源是仓库根，目标是 `~/.cursor/plugins/local/csl`：

```text
没有目标       → 创建 symlink
已是正确链接   → unchanged
链接指向别处   → 删除后重建
普通文件或目录 → throw
```

**Codex plugin**

非 dry-run 时先运行 `codex --version`。存在后执行：

```text
删除 3 个旧 plugin 标识
→ 删除 3 个旧 marketplace 标识
→ 添加当前仓库 marketplace
→ 添加当前 plugin
→ 删除旧 skill links
```

六个删除允许失败，两个添加不允许失败。

旧 link 清理只扫描 `~/.agents/skills` 的直接子项，并只删除属于当前仓库 `skills` 的符号链接。

**Pi**

非 dry-run 时先运行 `pi --version`，然后：

```text
pi install <repoRoot>
```

### 5. dry-run 怎样形成计划

dry-run 不执行外部命令，也不创建或删除链接，而是返回同类型 change，并加上：

```js
{ dryRun: true }
```

所以 `install --yes --dry-run` 会直接列出八条 Codex command 计划，即使本机没有 Codex CLI；因为 dry-run 不执行 `hasCommand` 检查。

它仍会读取真实路径和扫描旧链接。交互 dry-run 还可能保存选择文件，所以 dry-run 的准确含义是“安装动作预览”，不是完全无写入。

### 6. Result：为什么 skip 也可能成功

installer 返回 change，例如：

```text
symlink
unchanged
command
remove
skip
```

调度器只按控制流包装：

```js
// 正常返回
{ target, ok: true, changes }

// 抛出异常
{ target, ok: false, error }
```

Codex/Pi CLI 不存在时，handler 返回 `skip`，没有抛错，因此仍是 `ok: true`。

这会让终端和机器接口同时产生矛盾：

```text
✓ Codex plugin  1 skipped
Done · 1/1 integrations ready
```

JSON 顶层也可能是 `ok: true`，退出码是 0。这里的 `ok` 只能理解为“流程正常结束”。

### 7. 三种失败路径

```text
参数或交互前提错误
→ die
→ 普通 stderr
→ exit 2

installer 抛异常
→ target ok:false
→ 其他 target 继续
→ 最终 exit 1

installer 返回 skip
→ target ok:true
→ 最终可能 exit 0
```

`--json` 只影响第三阶段的 Result 输出。第一类错误发生得更早，所以仍是普通文本。

Codex 还可能部分完成：旧身份已经删除或 marketplace 已添加，后续命令才失败。失败 Result 只保留 error，不保留之前的 changes，也不会回滚。

### 8. 输出层做了什么

文本模式会展平 change，按 action 统计摘要。`--verbose` 再打印路径和命令。`--json` 直接序列化 Result，因此 `--color --json` 仍是无 ANSI 的有效 JSON。

普通文本的 auto color 只检查环境中是否存在 `NO_COLOR`，不检查 stdout 是否为终端，所以管道输出可能带颜色。

allowFailure 命令会记录 status，但摘要只说 command completed，verbose 也不显示 status。非零删除命令因此可能完全隐藏。

### 9. 旧链接清理的安全边界

清理逻辑不会盲目递归：

1. skills 根本身是符号链接时跳过；
2. 只检查直接子项；
3. 普通文件和目录跳过；
4. 只处理符号链接；
5. 链接文本路径或真实解析路径必须位于仓库 `skills`；
6. dry-run 只返回 remove 计划。

因此外部链接、外部断链和普通目录会保留。聚焦测试还验证了清理幂等，以及 plugin add 失败时不会删除旧 links。

### 10. 最短心智模型

```text
registry
  ↓
options / prompts
  ↓
installer
  ↓
change[]
  ↓
Result
  ↓
text / JSON / exit
```

这个组件的结构本身很简单。阅读输出时要特别区分：

```text
change 表示发生了什么
Result 表示 handler 是否抛错
```

它们目前还没有共同证明 integration 已经可用。

本次只进行了静态源码解释，没有修改或执行该 CLI，也没有运行测试或构建。

## 报告路径与 Git 状态

- Develop：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
