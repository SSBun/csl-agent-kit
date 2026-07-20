# Baseline Raw Output

## Arm D — 原始最终回复

这个文件的复杂度主要不在代码数量，而在一个 target 可能经历多次外部状态迁移。Cursor 和 Pi 路径很短；Codex 路径包含清理、注册、安装和迁移后清理，任何阶段失败都可能让“Result”与真实环境不同步。

### 总体调用链

```text
argv / TTY / CI
  → options
  → selected targets
  → target handler
  → filesystem / external CLI
  → changes 或 error
  → 文本 / JSON / exit code
```

`targets` 注册表是足够的扩展点。当前没有必要拆出通用 provider、事务接口或命令对象；应先修复现有状态迁移的可观测性。

### Codex 状态迁移时间线

| 阶段 | 动作 | 失败处理 | 失败后的可能状态 |
|---|---|---|---|
| 0 | `codex --version` | 返回 skip | 未安装，但 target 仍可能 `ok: true` |
| 1 | 删除当前插件名 | 忽略非零状态 | 是否删除不可从摘要判断 |
| 2 | 删除两个旧插件名 | 忽略非零状态 | 继续执行 |
| 3 | 删除三个 marketplace 名 | 忽略非零状态 | 继续执行 |
| 4 | 添加当前仓库 marketplace | 抛错 | 旧注册可能已移除 |
| 5 | 添加当前插件 | 抛错 | marketplace 已添加，插件未添加 |
| 6 | 清理旧 skill 链接 | 文件错误抛出 | 插件可能已安装，但 target 报失败 |

最后一行尤其重要：`removeLegacyCodexSkillLinks` 位于两条 add 成功之后。若 `skills` 路径解析、目录读取或 unlink 因非 ENOENT 错误失败，handler 会抛错；调度器只记录 error，不保留前八条成功 command。此时系统可能已经可用，但输出会说该 target 失败。

反过来，阶段 0 找不到 Codex 时返回 skip，却会被调度器当成正常成功。也就是说，当前结果模型既可能把“没安装”报成成功，也可能把“已安装但清理失败”报成完全失败。

### 根因：异常是唯一失败通道

`installTargets` 的规则是：

```text
handler return → ok: true
handler throw  → ok: false，仅保存 error.message
```

这会丢失两个维度：

1. 正常返回是否真的达成目标，例如 skip。
2. 抛错前已经完成了哪些动作，例如 Codex add 后清理失败。

无需全面重做 Result 类型。最小方案是：缺少必需 CLI 直接抛错；`runCommands` 抛错时附带已执行 changes；后置旧链接清理明确决定是致命失败还是 warning，并在结果中表达真实状态。

### 其他跨路径问题

#### dry-run 仍有选择文件写入

交互目标解析会无条件保存选择，发生在 installer 之前。于是 dry-run 虽然阻止链接、unlink 和子进程，仍可能更新 `install-selection.json`。这直接违背帮助文本中的“不修改文件”。

#### allowFailure 状态没有进入输出

命令 change 保存了 status，但摘要只统计 `action: "command"`，verbose 也不显示状态码。六条被允许忽略的 remove 即使都失败，仍可显示为八条命令 completed。

#### 参数和输出契约不闭合

- `--all` 会在显式 target 校验前返回。
- `--target` 后的另一个 option 会被当成 target 值。
- 未知顶层 command 打印帮助后成功退出。
- `--json` 只作用于已经形成 results 的路径，参数/交互错误仍输出文本。
- auto color 不检查 stdout 是否为 TTY。

### 文件系统防护

本地写入部分有明确保护：

- Cursor 不覆盖普通文件或目录。
- 已指向仓库的链接不重建。
- 旧 skill 目录如果本身是符号链接，整个清理会跳过。
- 旧 skill 子项必须是符号链接。
- 删除前使用 `isWithin` 限制链接来源。
- ENOENT 被视为并发消失或无需处理，其他错误上抛。
- 选择文件通过 `0600` 临时文件和 rename 更新。

### 建议的最小改动边界

1. dry-run 不保存交互选择。
2. Codex/Pi 缺失时让 target 失败。
3. Codex command 失败时保留此前 changes。
4. 明确定义“插件已安装但遗留清理失败”的 Result 与退出码。
5. 摘要和 verbose 展示非零 command status。
6. 补齐参数 token、未知 command 和 JSON 错误契约。

本次仅做静态源码分析，没有修改或运行组件。

## Arm L — 原始最终回复

要学会这个安装器，先抓住最重的一条路径：Codex。它把“清旧状态、注册本地来源、安装新插件、删除旧链接”串成一个同步流程；理解它以后，Cursor 和 Pi 都很简单。

### 1. Codex 是怎样被选中的

顶部注册表中，`codex-plugin` 有两个标志：

```js
default: true
external: true
```

所以：

- `install --yes` 会选择它，因为它是唯一默认目标；
- 交互模式选择它时，会出现外部命令确认；
- `--target codex-plugin` 或 `--all` 已经是显式调用，不再询问该确认。

目标解析完成后，`installTargets` 找到 `run: installCodexPlugin` 并同步调用。

### 2. 前置命令检查

非 dry-run 时，handler 先执行：

```text
codex --version
```

状态码为 0 才认为命令可用。否则返回：

```js
{ action: "skip", reason: "Codex CLI not found", command: "codex" }
```

由于这是正常 return，外层会生成 `ok: true`。这是代码中“skip 不等于失败”的来源。

dry-run 会跳过这项检查，因此即使机器没有 Codex，也能生成完整命令计划。

### 3. 八条命令的结构

`runCommands` 接收的每项是：

```js
[command, args, allowFailure]
```

Codex 路径按顺序包含：

| 顺序 | 命令目的 | allowFailure |
|---:|---|---:|
| 1 | 删除当前插件标识 | true |
| 2–3 | 删除两个历史插件标识 | true |
| 4 | 删除当前 marketplace 标识 | true |
| 5–6 | 删除两个历史 marketplace 标识 | true |
| 7 | 从 `repoRoot` 添加 marketplace | false |
| 8 | 添加当前插件 | false |

`runCommands` 串行调用 `spawnSync`。dry-run 时不启动进程，只记录计划命令；真实执行时，非零状态只有在 `allowFailure` 为 false 时才抛错。

因此前六条的目的不是证明删除成功，而是尽量把已知名称清干净。后两条才是必须成功的安装步骤。

### 4. 每个失败点意味着什么

按时间线推理：

- 前六条失败：被允许忽略，继续安装。
- 第七条失败：旧名称可能已删除，但新 marketplace 尚未注册。
- 第八条失败：新 marketplace 已注册，但插件未完成安装。
- 八条全成功：进入旧 skill 链接清理。

`runCommands` 在第七或第八条抛错时，不会返回已积累的 changes，所以最终 Result 只有错误文本。真实环境已经发生的部分变化不会出现在结果里。

### 5. 安装后的旧链接清理

目标目录是：

```text
~/.agents/skills
```

函数首先取得当前仓库 `skills` 的真实路径，然后执行安全筛选：

1. 目录不存在：无需处理。
2. 该路径自身是符号链接或不是目录：跳过。
3. 子项不是符号链接：跳过。
4. 链接原始来源和解析后来源都不在当前 skills 根下：跳过。
5. 只有通过筛选的旧链接才删除。

dry-run 仍会完成读取和判断，但返回计划 remove，不执行 unlink。

如果这里发生权限等非 ENOENT 错误，整个 Codex handler 会抛错。注意此时插件命令已经成功，所以 Result 的失败表示“完整流程未完成”，不一定表示“插件没有安装”。

### 6. Result 如何影响最终输出

`installTargets` 把 handler 的正常返回包装为：

```js
{ target: "codex-plugin", ok: true, changes }
```

异常则变成：

```js
{ target: "codex-plugin", ok: false, error }
```

文本模式按 changes 的 action 计数；JSON 模式直接序列化 Result；进程退出码取决于所有 Result 是否 `ok: true`。

这解释了两个看似矛盾的现象：

- Codex 不存在：skip，可能退出 0。
- Codex 已安装但旧链接清理失败：Result false，退出 1。

### 7. 与另外两个目标对比

**Cursor**

只维护一个符号链接。相同链接返回 unchanged；其他符号链接可替换；普通文件或目录不覆盖。它自己具备完整的本地幂等判断。

**Pi**

先用 `pi --version` 检查，再调用一次 `pi install repoRoot`。命令缺失同样返回 skip；安装语义和幂等性由 Pi CLI 决定。

### 8. 再把入口接回来

完整流程可以记成：

```text
parse options
→ resolve target names
→ run each handler, catch per-target errors
→ render changes or serialize JSON
→ all result.ok ? exit 0 : exit 1
```

交互目标选择还会保存 `install-selection.json`。这一步不受 dry-run 保护，所以无显式 target 的 dry-run 仍可能修改选择记录。

理解检查：

1. 为什么前六条 remove 可以失败？它们是兼容清理，不是新安装的必要成功条件。
2. 为什么第八条失败后 marketplace 可能仍存在？第七条已经成功且没有回滚。
3. 为什么旧链接清理失败会丢失八条 command 日志？handler 在拼接最终返回值前抛错，外层只保存 error message。
4. 为什么 dry-run 能列出 Codex 命令而不要求 Codex 已安装？前置检查明确受 `!options.dryRun` 限制。

本次只做了静态源码讲解，没有修改文件，也没有执行任何命令路径。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
