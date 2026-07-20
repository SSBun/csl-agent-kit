# Baseline Raw Output

## Arm D — 原始最终回复

这个 CLI 同时面向三类消费者：交互安装者、CI/脚本，以及通过 `require` 使用少量 helper 的代码。单文件设计尚未成为问题；更明显的是三类消费者看到的“成功、预览和错误”语义并不完全一致。

### 公开表面

入口只实现一个业务 command：`install`。安装目标由顶部注册表定义：Cursor、Codex plugin、Pi。可见选项包括 target 选择、全部安装、默认安装、dry-run、verbose、颜色和 JSON。

内部结构可分为：

```text
CLI 路由
  → 参数归一
  → 目标决策/交互
  → handler 调度
  → 文件系统或外部 CLI
  → change 记录
  → 文本/JSON/退出码
```

模块被 `require` 时不会执行 `main`，这是正确的；但目前只导出 `buildInstallChoices`、`loadInstallSelection` 和 `saveInstallSelection`，核心 CLI 行为仍只能通过进程边界验证。

### 交互用户看到的行为

交互模式要求 TTY 且没有 `CI` 环境变量。它会：

1. 读取上次选择；
2. 默认选中历史值或 `default: true` 的 Codex；
3. 对 external 目标追加确认；
4. 在执行安装前保存选择。

这里有两个 UX 问题：

- dry-run 仍执行第 4 步，所以可能写 `install-selection.json`，与帮助承诺冲突。
- Codex/Pi 缺失时显示绿色成功标记和 skipped 摘要，并计入 “integrations ready”。用户会同时看到“成功”和“跳过”。

保存选择失败只产生 warning，不阻止安装；这符合“偏好记录不是安装必要条件”的定位。

### CI/脚本看到的行为

非交互调用可用显式 target、`--all` 或 `--yes`。`--yes` 当前只选 Codex；显式 target 会校验并去重。

自动化契约的主要问题是：

1. **退出码不能证明目标已安装。** 缺少 Codex/Pi 时 handler 返回 skip，外层仍设置 `ok: true`，最终可能退出 0。
2. **JSON 不覆盖早期错误。** 参数错误、target 错误和非 TTY 选择错误由 `die` 输出纯文本；只有进入 results 阶段后才序列化 JSON。
3. **`--verbose --json` 中 verbose 无效果。** JSON 分支绕过 `printResults`，这是可以接受的，但帮助没有说明组合语义。
4. **allowFailure 状态不可见。** 命令 change 保存非零 status，摘要和详细输出却都不展示它。
5. **未知 command 成功退出。** 除 install 外的拼写错误与帮助请求没有区分。

参数解析还有两个具体边界：`--all` 会绕过显式 target 校验；`--target` 后如果紧接另一个 option，该 option 会被消费成 target 值。

### 安装执行的状态风险

Cursor 只有一次链接变更，幂等判断完整。Pi 只有一次外部 install，状态语义由 Pi CLI 决定。Codex 则是多阶段迁移：

```text
删除当前/旧插件名
→ 删除当前/旧 marketplace 名
→ 添加当前 marketplace
→ 添加当前插件
→ 清理旧 skill 链接
```

前六次删除允许失败，后两次新增必须成功。新增失败没有回滚；后置链接清理失败又可能在插件已经安装后把整个 target 标为失败。所有抛错路径只保留 error message，之前完成的 changes 不会进入 Result。

这意味着结果存在两种方向相反的失真：

- 未执行安装的 skip 可能是 `ok: true`；
- 已完成插件安装但后置清理失败可能是 `ok: false`。

### 安全与实现质量

已有实现避免了几类常见风险：

- 外部命令使用 `spawnSync(cmd, args)`，不经过 shell。
- Cursor 不覆盖普通文件或目录。
- 悬空和有效符号链接都能被识别。
- 旧 skill 清理只处理直接子项中的符号链接。
- 删除前对原始来源与真实来源做目录范围判断。
- 选择文件以 `0600` 临时文件原子替换。
- target 异常被逐项隔离，其余目标仍会执行。

较小的运行问题包括：auto color 不检查 stdout TTY、任意非空 `CI` 都视为 CI、同步外部命令没有 timeout，且启动错误不优先采用 `result.error`。

### 最小改动建议

1. 交互 dry-run 跳过选择保存。
2. 缺少必需 CLI 时让 target 失败。
3. Codex 失败 Result 保留已执行 changes，并明确后置清理的严重性。
4. 文本输出展示被忽略的非零命令状态。
5. 收紧 target 参数与顶层 command 校验。
6. 明确 JSON 是否需要覆盖所有错误；需要时统一错误输出。
7. 仅为这些行为开放最小测试入口，不拆分通用安装框架。

按要求没有修改源码，也没有运行组件、构建或测试。

## Arm L — 原始最终回复

可以把这个文件理解为同一个安装核心的三种使用方式：人在终端里选、脚本明确指定、其他 JavaScript 代码导入少量 helper。先分别看这三个视角，再合并成完整心智模型。

### 1. 交互安装者

用户只输入：

```bash
csl-agent-kit install
```

代码要求 stdin 是 TTY，且不存在真值 `CI`。随后动态加载 `prompts`，显示三个选择：Cursor、Codex plugin、Pi。

预选规则是：

```text
有效的历史选择
  否则
default: true 的目标
```

当前只有 Codex 默认选中。若最终选择包含 Codex 或 Pi，因为它们的 `external` 为 true，还会出现第二个确认问题。

确认后，选择先写入 `install-selection.json`，再进入安装。保存失败只打印 warning，不会中止。

### 2. 脚本调用者

脚本可以避开 prompts：

```bash
csl-agent-kit install --target cursor,pi
csl-agent-kit install --all
csl-agent-kit install --yes
```

三者的含义不同：

- `--target`：显式名称，校验后去重；
- `--all`：注册表中的全部名称；
- `--yes`：只取 default 目标，目前是 Codex。

显式调用不会再询问 external 确认。非 TTY 或 CI 中如果三种方式都没用，程序以参数/交互错误退出 2。

脚本通常还会组合：

```bash
--dry-run --json
```

dry-run 阻止链接创建、旧链接删除和外部命令启动；JSON 则把每个 target 的 Result 输出到 stdout。

### 3. 模块消费者

底部的保护条件：

```js
if (require.main === module) {
  main()
}
```

保证其他代码 `require` 该文件时不会运行 CLI。当前只导出三个与交互选择有关的 helper：构建 choices、读取选择、保存选择。

解析器、resolver、installer、命令执行器和输出函数没有导出，所以它们不是模块级公开 API。

### 4. 三个 target 的内部动作

**Cursor**

目标是 `~/.cursor/plugins/local/csl`，来源是仓库根目录。当前目标不存在则创建；链接正确则 unchanged；其他链接会替换；普通文件或目录会报错。

**Codex**

先检查 `codex --version`，随后尝试删除六个当前或历史标识，再添加本地 marketplace 与插件，最后扫描 `~/.agents/skills` 并删除指向当前仓库 skills 的旧链接。

**Pi**

检查 `pi --version`，然后执行 `pi install repoRoot`。

Codex/Pi 检查失败时都返回 skip。因为没有抛异常，外层会把 target 记为 `ok: true`。

### 5. change 与 Result 的区别

handler 返回 change，例如：

```text
symlink   计划或完成链接
unchanged 链接已正确
command   计划或执行命令
remove    计划或删除旧链接
skip      未执行目标
```

调度器再包装 Result：

```js
{ target, ok: true, changes }
{ target, ok: false, error }
```

正常 return 就是 true，throw 才是 false。最终 JSON 的顶层 `ok` 和进程退出码都由 `results.every(item => item.ok)` 决定。

这就是为什么 skip 可以伴随退出码 0：Result 判断的是 handler 控制流，不是安装后的可用性检查。

### 6. 常见选项组合

| 组合 | 实际效果 |
|---|---|
| `--target cursor --yes` | 显式 target 优先，只装 Cursor |
| `--all --target bad` | all 先返回，bad 不会校验 |
| `--verbose --json` | 输出 JSON，verbose 文本明细不执行 |
| `--color --json` | JSON 不使用颜色设置 |
| 交互 `--dry-run` | 安装动作预览，但仍可能保存选择文件 |
| `--yes --dry-run` | 预览默认 Codex，不读写历史选择 |

`--json` 也不是全程 JSON：如果在参数或 target 解析阶段调用 `die`，stderr 仍是普通文本。

### 7. 怎样阅读失败

区分三类：

1. `die`：命令用法或交互前提错误，立即退出 2。
2. handler 抛错：转换为该 target 的 `ok: false`，其他 target 继续。
3. allowFailure 命令非零：保留 status 后继续，target 仍可能成功。

Codex 的后两条新增命令不允许失败；前六条清理允许失败。旧 skill 清理的文件系统错误则会在新增成功后抛错，因此“Codex target 失败”有时表示后置迁移未完成，而不是插件一定没装上。

### 8. 最短记忆版

```text
人：prompts + 历史选择 + external 确认
脚本：target/all/yes + dry-run/json
核心：逐 target 同步执行，return=true，throw=false
输出：change 摘要或 Result JSON
```

本次只进行了静态源码讲解，未修改或执行该 CLI。

## 报告路径与 Git 状态

- Develop：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：`NO_OUTPUT`；`git status --short` 无输出（clean）。
