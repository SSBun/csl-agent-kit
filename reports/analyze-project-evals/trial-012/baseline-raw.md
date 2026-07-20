# Baseline Raw Output

## Arm D — 原始最终回复

这个 CLI 的结构已经足够直接：注册表定义三个目标，解析器决定选哪些目标，调度器同步执行 handler，最后输出 change 和 Result。当前开发重点不应是拆文件，而应是修正“成功”的含义，并让 dry-run、JSON 和退出码形成一致契约。

### 当前架构

```text
argv
→ parseInstallArgs
→ resolveInstallTargets
→ installTargets
   ├─ installCursor
   ├─ installCodexPlugin
   └─ installPi
→ terminal / JSON
→ exit code
```

`targets` 注册表同时保存展示信息、默认选择、external 标记和 handler。三个目标规模下，这比通用 installer class 更容易理解和扩展。

唯一第三方运行依赖是交互时动态加载的 `prompts`；非交互安装只依赖 Node 内置模块和外部的 Codex/Pi CLI。

### 应先明确的行为不变量

理想情况下，这个组件应满足：

1. 退出 0 表示所有选中目标达到约定的成功状态。
2. dry-run 不产生持久化副作用。
3. JSON 模式的 stdout 始终可解析。
4. 失败结果能描述失败前已经完成的动作。
5. 清理只删除当前项目拥有的旧链接。
6. 单个目标失败不阻止其他目标执行。

现有实现较好地满足了第 5、6 项，但前四项存在边界。

### 主要发现

#### 1. skip 与 success 混为一体

Codex 或 Pi 命令不存在时，installer 返回：

```js
[{ action: "skip", reason: "... CLI not found" }]
```

因为 handler 没有抛异常，调度器生成 `ok: true`。由此会出现：

- 绿色成功标记；
- “integration ready”；
- JSON 顶层 `ok: true`；
- 退出码 0。

这对交互用户只是误导，对 CI 则是错误的机器契约。至少应把 skipped 与 succeeded 分开；缺少必需 CLI 时是否退出非零，需要由明确产品语义决定。

#### 2. Codex 部分完成不可观测

Codex 流程是：

```text
容错删除旧 plugin
→ 容错删除旧 marketplace
→ 添加 marketplace
→ 添加 plugin
→ 清理旧 skill 链接
```

前六个删除允许失败，两个添加不允许失败。执行中途抛错时，`installTargets` 只保留 error message，`runCommands` 已累积的 changes 丢失。

因此：

- 前置删除和 marketplace 添加不会回滚；
- 用户不知道失败前执行了哪些动作；
- 后置链接清理失败可能把已经安装好的 plugin 标成失败；
- Result 没有表达 partial 状态。

#### 3. 交互 dry-run 可能写选择文件

交互确认结束后，无论 `options.dryRun` 是否为 true，都会调用 `saveInstallSelection`。所以 dry-run 可以修改 `install-selection.json`。

显式 `--target`、`--all` 或 `--yes` 不走这条保存路径；问题只发生在交互 dry-run。

#### 4. JSON 不是端到端协议

只有安装执行完成后的结果使用 JSON。以下错误仍由 `die` 输出普通 stderr：

- 未知 install option；
- 非法 target；
- 非 TTY 且未显式选择；
- prompts 缺失；
- 用户取消或未确认 external。

脚本若要求稳定 JSON，当前必须同时处理两种错误格式。

#### 5. 参数优先级会掩盖错误

`resolveInstallTargets` 的顺序是：

```text
all
→ explicit targets
→ yes
→ interactive
```

具体后果：

- `--all --target invalid` 不校验 invalid；
- `--target --dry-run` 会把 `--dry-run` 当成 target 值；
- 显式 target 会覆盖 `--yes`；
- 未知顶层 command 只打印帮助并正常结束。

前两项应收紧；显式 target 覆盖 yes 可以保留，但应在帮助中明确。

#### 6. 命令执行信息不足

allowFailure 命令即使非零退出，也会记录为 command change；摘要称其为 completed，verbose 只显示命令，不显示 status。

另外：

- `spawnSync` 启动错误没有优先使用 `result.error`；
- 失败信息可能退化成 `exit null`；
- 外部命令没有 timeout；
- auto color 只看 `NO_COLOR`，不检查 stdout TTY；
- `process.exit` 紧跟输出，理论上可能在重定向场景提前终止尚未刷新的输出。

这些优先级低于状态契约，但适合在同一轮 CLI 稳定性工作中处理。

### 已有的安全与可靠性设计

- 外部命令通过 executable 与 argv 数组调用，不经过 shell。
- Cursor 不覆盖普通文件或目录。
- 正确符号链接保持 unchanged，错误链接才替换。
- 悬空符号链接也能被识别。
- 旧 skills 根目录若自身是符号链接，则完全不进入。
- 清理只看直接子项，并只删除符号链接。
- 原始链接路径或真实解析路径必须落在项目 `skills` 范围内。
- 选择文件使用 `0600` 临时文件再原子 rename。
- target 异常逐项隔离，其他目标继续执行。
- Codex plugin 添加失败时，后置旧链接清理不会运行。

### 测试覆盖

聚焦测试对输出、颜色、JSON、历史身份迁移、选择持久化、废弃目标过滤、旧链接清理范围、幂等性和 plugin add 失败顺序已有较好覆盖。

最重要的缺口是：

1. Codex/Pi 缺失时的 success/skip/exit 语义；
2. 交互 dry-run 的偏好写入；
3. `--all` 与非法 target 的组合；
4. `--target` 缺值但后接 option；
5. 未知顶层 command；
6. allowFailure status 的呈现；
7. 部分完成 Result；
8. 外部命令启动错误与超时。

### 建议实施顺序

1. 定义 `success`、`skipped`、`failed`、`partial` 的统一状态。
2. 从该状态派生文本、JSON 和退出码。
3. 让失败 Result 保留已执行 changes。
4. 让交互 dry-run 跳过选择保存。
5. 收紧参数解析和未知 command。
6. 改善 command status、启动错误和 timeout。
7. 用现有进程级测试补齐上述边界。

这些变更仍可在当前单文件中完成。等目标数量明显增加或 handler 需要异步生命周期时，再拆分模块更合适。

本次仅静态阅读了目标源码、直接依赖声明与聚焦测试，没有修改源码，也没有运行项目、测试或构建。

## Arm L — 原始最终回复

可以通过一条典型命令理解整个组件：

```bash
csl-agent-kit install --yes --dry-run --json
```

它会选择默认的 Codex plugin，生成安装计划，不启动 Codex 命令，并把 Result 输出成 JSON。沿着这条路径阅读代码，就能看清选择、动作和成功状态之间的关系。

### 1. CLI 先把输入变成 options

`parseInstallArgs` 生成一个普通对象：

```js
{
  all: false,
  colorMode: "auto",
  dryRun: false,
  json: false,
  verbose: false,
  yes: false,
  targets: []
}
```

目标可以来自：

- `--target cursor,codex-plugin`；
- 多个位置参数；
- `--all`；
- `--yes`；
- 没有显式输入时的交互选择。

目标决策顺序是：

```text
--all
→ 显式 targets
→ --yes
→ prompts
```

所以 `--target cursor --yes` 只选择 Cursor，而 `--all` 会直接选择注册表中的全部目标。

### 2. 注册表描述三个 integration

```text
cursor        本地符号链接
codex-plugin  Codex marketplace + plugin
pi            pi install
```

每个目标有四个关键字段：

- `title` 和 `description`：帮助与交互展示；
- `default`：`--yes` 和首次交互的默认选择；
- `external`：交互时是否需要额外确认；
- `run`：实际 installer。

当前只有 `codex-plugin` 的 `default` 为 true。

### 3. 交互模式怎样工作

只有 stdin 是 TTY 且没有真值 `CI` 时，程序才加载 `prompts`。

它先读取历史选择。有效历史值优先；否则使用默认 Codex。选中 Codex 或 Pi 时，会追加一个 external command 确认。

确认后的选择保存为：

```json
{
  "version": 1,
  "selectedTargets": ["codex-plugin"]
}
```

默认路径是 `~/.csl-agent-kit/install-selection.json`，也可用 `CSL_AGENT_KIT_HOME` 改变目录。

保存使用 `0600` 临时文件和 rename。读取则很宽容：文件不存在、JSON 损坏、版本不符或没有有效 target 都返回 `null`。

需要注意：交互 dry-run 仍会保存选择，因为选择持久化发生在 installer 调度之前。

### 4. 每个 installer 产生 change

**Cursor**

```text
目标不存在       → symlink
目标是正确链接   → unchanged
目标是其他链接   → 删除并重建
目标是普通文件   → throw
```

目标路径是 `~/.cursor/plugins/local/csl`，来源是仓库根目录。

**Codex plugin**

实际安装前先检查 `codex --version`，然后：

1. 删除三个当前或历史 plugin 身份；
2. 删除三个当前或历史 marketplace 身份；
3. 添加当前仓库 marketplace；
4. 添加当前 plugin；
5. 删除指向当前仓库 skills 的旧链接。

前六个删除允许失败，两个添加必须成功。旧链接清理发生在 plugin add 之后，因此 add 失败不会提前破坏旧 skill 入口。

**Pi**

检查 `pi --version` 后执行：

```text
pi install <repoRoot>
```

### 5. dry-run 是怎样实现的

dry-run 没有复制另一套 installer，而是在实际副作用点返回计划：

- 链接函数返回 `symlink` change；
- 命令函数返回 `command` change；
- 清理函数返回 `remove` change；
- 每项带 `dryRun: true`。

因此代码路径与真实安装接近，预览能展示相同动作顺序。

不过它仍会读取真实路径、扫描旧 links，并且交互模式可能保存选择，所以它是“安装动作预览”，不是绝对零写入沙箱。

### 6. change 不等于 Result

installer 返回的 change 说明“发生或计划了什么”：

```text
symlink
unchanged
command
remove
skip
```

调度器再生成 Result：

```js
// 正常返回
{ target, ok: true, changes }

// 抛出异常
{ target, ok: false, error }
```

这里的判断规则只是：

```text
return → ok
throw  → not ok
```

它没有检查安装后是否真的可用。

因此 Codex/Pi CLI 不存在时，installer 返回 skip，没有 throw，最后仍可能是：

```text
ok: true
exit code: 0
1 integration ready
```

这说明“handler 正常结束”，不说明 integration 已安装。

### 7. 结果怎样呈现

文本模式会把嵌套 change 展平，按 action 计数：

```text
1 link updated
8 commands planned
2 legacy links removed
1 skipped
```

`--verbose` 再显示具体路径与命令。`--json` 则直接输出 Result 数组，不经过文本渲染，因此不会混入颜色。

颜色 auto 模式只检查环境中是否存在 `NO_COLOR`，没有检查 stdout 是否为 TTY。重定向普通文本时仍可能带 ANSI。

allowFailure 命令会保存非零 status，但文本摘要和 verbose 明细都不展示 status，所以“commands completed”不一定表示每条命令退出 0。

### 8. 错误分为三类

```text
参数/交互错误
  → die
  → stderr 文本
  → exit 2

installer 抛错
  → target ok:false
  → 其他 target 继续
  → 最终 exit 1

installer 返回 skip
  → target ok:true
  → 最终可能 exit 0
```

即使传了 `--json`，第一类错误仍是普通文本，因为它发生在 JSON 输出分支之前。

Codex 中途失败也不会回滚。失败 Result 只保留 error，不保留失败前已经执行的 changes，所以无法从结果完整重建机器当前状态。

### 9. 旧 skill 清理为何较安全

清理逻辑依次检查：

1. `~/.agents/skills` 是否真实目录；
2. 子项是否符号链接；
3. 链接文本路径或解析后的真实路径是否位于项目 `skills`；
4. dry-run 时只记录，真实运行才 unlink。

它不遍历一个符号链接形式的 skills 根目录，不碰普通目录，也保留外部或断开的外部链接。聚焦测试覆盖了 dry-run、归属判断、目录符号链接与幂等性。

### 10. 阅读时记住这张图

```text
target registry
      ↓
options + selection
      ↓
installer
      ↓
change[]
      ↓
Result
      ↓
terminal / JSON / exit code
```

这个组件的结构并不复杂。维护时最容易出错的地方是最后两步：change 中的 `skip` 或部分执行状态，没有被 Result 的单一 `ok` 布尔值准确表达。

本次只进行了静态源码讲解，没有修改或执行该 CLI，也没有运行测试或构建。

## 报告路径与 Git 状态

- Develop：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
