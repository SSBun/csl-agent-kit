# Baseline Raw Output

## Arm D — 原始最终回复

这个组件是一个单文件、同步执行的安装编排器：

```text
CLI 参数
  → 选择安装目标
  → 逐目标执行
  → 收集结构化变更
  → 文本/JSON 输出
  → 汇总退出码
```

核心设计集中在 `targets` 注册表：每个目标定义展示信息、默认状态、是否调用外部命令及安装函数。当前支持 Cursor 符号链接、Codex 插件重装、Pi 包安装三条路径。

主要发现：

1. **缺失外部 CLI 被当作安装成功。**  
   `installCodexPlugin` 和 `installPi` 在命令不存在时返回 `skip`，随后 `installTargets` 无条件记录 `ok: true`。因此 JSON 顶层 `ok` 为 `true`、退出码为 `0`，文本还会报告 “integrations ready”，但组件实际未安装。位置：`bin/csl-agent-kit.js:209`、`:227`、`:244`、`:384`。这会误导 CI 和自动化调用方。

2. **Codex 重装会先破坏现有状态，失败后没有恢复。**  
   流程先删除三个插件标识和三个 marketplace 标识，再添加当前 marketplace 与插件；任一添加步骤失败都会留下部分卸载状态。位置：`:231`–`:241`。至少应把旧别名清理延后到新插件安装成功之后，并在错误中明确报告部分完成状态。

3. **允许失败的删除命令仍被汇总为 “completed”。**  
   六个清理命令允许失败，但 `runCommands` 无论状态如何都记录为 `action: "command"`；摘要只按 action 计数，详细输出也不展示失败状态。位置：`:232`–`:237`、`:340`–`:353`、`:390`–`:412`。结果可能显示 “8 commands completed”，实际前六条中已有失败。

4. **参数优先级会吞掉无效输入。**  
   `resolveInstallTargets` 先判断 `--all`，再验证显式 targets，所以 `--all --target typo` 会静默安装全部目标，而不是报告无效 target。位置：`:101`–`:105`。应先验证所有显式 target，再应用选择优先级。

5. **未知顶层命令以成功状态退出。**  
   除 `install` 外的任意命令都会打印帮助并自然退出 `0`，例如拼错的 `instal`。位置：`:33`–`:49`。无参数可继续显示帮助，但未知命令应走 `die`。

6. **自动颜色模式不判断输出是否为 TTY。**  
   只要没有设置 `NO_COLOR`，重定向到文件或管道的普通文本也会包含 ANSI 转义序列。位置：`:416`–`:418`。自动模式应同时检查 `process.stdout.isTTY`。

值得保留的实现：

- `--dry-run` 覆盖符号链接、外部命令和旧链接清理三种写操作。
- `ensureSymlink` 不覆盖普通文件或目录，并正确处理悬空链接。
- 旧 skill 清理只删除指向当前仓库 `skills` 目录内部的符号链接，`isWithin` 防止误删外部目标。
- 安装选择通过临时文件加重命名写入，文件权限为 `0600`。
- 单个 target 失败不会阻止后续 target，最终统一返回非零状态。

建议按最小改动顺序处理：先修正 `skip` 的成功语义，再保留 Codex 旧安装直到新安装成功，随后修正命令状态汇总、target 验证顺序和未知命令退出码。

本次仅做静态源码分析；按要求未修改源码，也未运行项目、构建或测试。

## Arm L — 原始最终回复

先记住一句话：这是一个“注册表驱动的同步安装器”——`targets` 决定能安装什么，参数解析决定装哪些，目标函数执行副作用，结构化 `changes` 决定最后怎么展示。

### 1. 从主流程建立骨架

入口位于 `bin/csl-agent-kit.js:33`：

```text
main
  ├─ parseInstallArgs       解析参数
  ├─ resolveInstallTargets  决定目标
  ├─ installTargets         逐个安装
  ├─ JSON 或文本输出
  └─ 根据所有 result.ok 设置退出码
```

只有 `install` 是有效业务命令；其余情况打印总帮助。

### 2. 理解“目标注册表”

`targets` 位于 `:9`–`:31`，每项包含：

- `title`、`description`：交互界面和帮助信息。
- `default`：`--yes` 时是否默认选择。
- `external`：交互选择后是否需要确认调用外部 CLI。
- `run`：真正的安装函数。

三个目标的行为是：

| 目标 | 实际动作 |
|---|---|
| `cursor` | 把仓库根目录链接到 `~/.cursor/plugins/local/csl` |
| `codex-plugin` | 清理旧插件/marketplace 名称，注册当前仓库，再安装插件，并清理旧 skill 链接 |
| `pi` | 执行 `pi install <repoRoot>` |

新增安装目标时，核心入口通常只需在这个注册表增加一项并实现对应函数。

### 3. 参数如何变成目标

`:51`–`:99` 把命令行转换成统一的 `options`。目标可来自：

```text
--target cursor,codex-plugin
--target=cursor
cursor
--all
--yes
```

`:101`–`:155` 的选择优先级是：

```text
--all
  > 显式 targets
  > --yes 的默认目标
  > 交互式多选
```

只有交互式路径会加载 `prompts`、读取上次选择，并对 external 目标再次确认。显式传入 target 被视为调用者已经明确授权。

### 4. 选择记忆是怎样保存的

`:157`–`:198` 使用：

```text
${CSL_AGENT_KIT_HOME}/install-selection.json
```

若环境变量未设置，则使用：

```text
~/.csl-agent-kit/install-selection.json
```

保存时先写入同目录临时文件，再重命名到正式文件，并设置 `0600`。读取失败、JSON 无效或版本不符时直接退回默认选择，不阻塞安装。

### 5. 副作用集中在哪里

`:209`–`:220` 逐个调用目标的 `run`，把异常转换成 `{ ok: false, error }`，因此一个目标失败后仍会继续处理其他目标。

具体副作用分三类：

- 文件链接：`:307`–`:338`
- 删除旧链接：`:251`–`:305`
- 外部进程：`:340`–`:360`

`ensureSymlink` 的关键规则是：目标不存在就创建；已经指向当前仓库就返回 `unchanged`；若是其他符号链接则替换；若是普通文件或目录则拒绝覆盖。

旧 skill 清理只检查 `~/.agents/skills` 下的符号链接，并通过 `isWithin` 确认其原始或解析后路径位于当前仓库 `skills` 目录内，避免删除无关链接。

### 6. 用一次 dry-run 串起全流程

假设输入：

```bash
csl-agent-kit install --target cursor,codex-plugin --dry-run --json
```

代码会依次：

1. 解析两个 targets、`dryRun: true` 和 `json: true`。
2. 验证 target 名称并去重，不进入交互提示。
3. Cursor 返回一个计划中的 symlink 变更，不写文件。
4. Codex 返回八个计划中的外部命令，并扫描可能需要清理的旧链接，但不执行命令或删除。
5. 输出包含每个 target 的 JSON 结果。
6. 只要所有 target 的 `ok` 都为真，退出码为 `0`。

因此 `dry-run` 是“不写入”，不是“完全不读取文件系统”。

### 7. 掌握三类退出语义

- 参数或交互错误调用 `die`：退出码 `2`。
- 某个安装目标抛错：该目标 `ok: false`，其他目标继续，最终退出码 `1`。
- 外部 `codex` 或 `pi` 不存在：当前实现返回 `skip`，但 target 仍记为 `ok: true`，最终可能退出 `0`。这是理解自动化行为时最容易忽略的细节。

推荐阅读顺序：先顺着 `main → resolveInstallTargets → installTargets` 读主干，再分别追踪三个 `install*`，最后阅读链接安全检查和输出格式。这样能先掌握控制流，再处理文件系统细节。

本次仅阅读源码；按要求未修改源码，也未运行项目、构建或测试。

## 写入路径与 Git 状态

- Arm D：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Arm L：`NO_OUTPUT`；`git status --short` 无输出（clean）。
