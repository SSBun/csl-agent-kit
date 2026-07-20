# Baseline Raw Output

## Arm D — 原始最终回复

从开发者视角看，这不是一个通用安装框架，而是一个针对三种集成的轻量编排器。461 行代码把参数选择、状态迁移、文件操作、子进程调用和终端输出放在同一模块中；规模仍可控，但若要依赖它做自动化安装，结果契约需要先收紧。

### 边界与职责

| 边界 | 相关代码 | 作用 |
|---|---|---|
| 命令输入 | 第 33–155 行 | 解析参数、选择目标、处理交互确认 |
| 用户状态 | 第 157–198 行 | 读取并原子保存上次交互选择 |
| 目标调度 | 第 209–220 行 | 执行目标并把异常转换为结果 |
| 本地文件系统 | 第 251–338 行 | 清理旧链接、维护 Cursor 链接 |
| 外部工具 | 第 227–249、340–360 行 | 调用 Codex 和 Pi |
| 输出契约 | 第 366–442 行 | 生成人类可读摘要或 JSON |

`targets` 注册表把目标元数据和 handler 绑定在一起，避免了多处分支。各 handler 返回 change 记录，输出层再统一消费，这是本文件最清晰的设计边界。

### 关键问题

#### 1. `ok` 代表“没有抛错”，不代表“安装成功”

Codex 或 Pi 不存在时，handler 返回一条 `skip` 记录。调度器看到正常返回便设置 `ok: true`，随后：

- JSON 顶层可能仍是 `"ok": true`；
- 进程退出码可能仍是 `0`；
- 文本汇总会把该集成计入 ready 数量。

这会让 CI 把“依赖缺失、没有安装”误认为成功。当前需求下最小且清楚的处理是：显式选择的目标缺少必需命令时直接失败。若跳过确实属于业务状态，则不能继续用单一布尔值表达 ready。

#### 2. Codex 安装不是失败原子的

第 231–240 行先移除多个插件和 marketplace 名称，最后才执行两条新增命令。新增失败时，前面的删除不会撤销，用户可能从旧版本可用变成新旧版本都不可用。

可行的低复杂度改进：

- 在变更前完成可执行文件及必要输入的预检；
- 把纯旧别名清理移到新安装成功之后；
- 失败结果携带已经执行的 change，避免丢失部分状态信息。

#### 3. 允许失败的命令被描述为已完成

六条删除命令设置了 `allowFailure: true`。即使返回非零状态，它们仍作为普通 `command` 保存；摘要按 action 计数后输出 “completed”，verbose 也不显示保存下来的 `status`。

因此内部知道命令失败，外部却看不到。可以直接在渲染时依据 `status` 区分成功和忽略的失败，不需要引入新的命令执行层。

#### 4. CLI 对错误输入过于宽松

- `resolveInstallTargets` 遇到 `--all` 立即返回，显式附带的非法 target 不再校验。
- `main` 对未知顶层命令打印帮助后自然返回成功。
- `process.env.CI` 使用普通真值判断，因此字符串 `"false"` 仍被视为 CI。

这些行为都可能隐藏调用脚本中的配置错误。建议让所有显式 target 先经过校验，未知命令走参数错误出口，并对 CI 采用明确值约定。

#### 5. 子进程与终端处理还有可观测性缺口

`spawnSync` 没有超时；启动层错误没有优先使用 `result.error`；自动颜色只检查 `NO_COLOR`，没有检查 stdout 是否连接终端。对应后果是命令可能无限等待、启动失败信息退化为 `exit null`，以及重定向文本含颜色控制字符。

### 文件操作的防护情况

文件系统部分较谨慎：

- Cursor 目标若存在普通文件或目录，会拒绝替换。
- 已指向仓库的链接保持不动。
- 悬空链接仍能被识别和替换。
- 旧 skill 清理只对符号链接生效，并限制链接来源在当前仓库的 skills 根目录内。
- `dryRun` 在实际 `symlink`、`unlink` 和外部命令之前返回。
- 选择文件先写临时文件再 rename，权限设置为 `0600`。

### 可测试性提示

模块末尾只导出了选择构建和选择文件读写三个函数。参数解析、目标解析、命令执行、链接维护和结果渲染均为私有函数，因此细粒度验证较困难，只能依赖进程级覆盖或调整导出边界。无需提前拆成多个类；先让关键纯函数与副作用函数具备最小可调用测试面即可。

推荐处理顺序是：安装成功语义、Codex 部分迁移、命令状态展示、参数错误行为，最后再处理终端与子进程细节。

本次仅阅读指定源码，没有执行程序、构建或测试，也没有改动文件。

## Arm L — 原始最终回复

学习这个文件时，不要先记每个函数；先跟踪数据形状的变化：

```text
argv
  ↓
options
  ↓
selected target names
  ↓
per-target results
  ↓
JSON / terminal text / exit code
```

掌握这条链后，其余函数只是为某个阶段提供服务。

### 第一步：从 `argv` 到 `options`

`main` 在第 33 行取出顶层命令，只有 `install` 会进入安装流程。第 51 行的 `parseInstallArgs` 将剩余参数整理成：

```js
{
  all,
  colorMode,
  dryRun,
  json,
  verbose,
  yes,
  targets
}
```

需要注意，target 有三种写法：

```text
--target cursor,pi
--target=cursor,pi
cursor,pi
```

`splitTargets` 负责按逗号拆分、去空格并过滤空项。

### 第二步：从 `options` 到目标名称

第 101 行的 `resolveInstallTargets` 按代码顺序作决定：

```text
all 为真       → 返回全部注册目标
存在 targets   → 校验并去重
yes 为真       → 返回 default 目标
其他情况       → 进入交互选择
```

注册表位于第 9–31 行。除了安装函数，它还保存交互界面需要的标题、说明、默认值和 `external` 标志。

交互模式会读取 `install-selection.json` 作为预选项。文件默认位于 `~/.csl-agent-kit/`，也可由 `CSL_AGENT_KIT_HOME` 改变根目录。选择保存使用临时文件加 rename，避免直接覆盖时留下半份 JSON。

### 第三步：从名称到结果

第 209 行的 `installTargets` 根据名称查注册表并调用 handler。它会形成两种结果：

```js
{ target, ok: true, changes }
{ target, ok: false, error }
```

这里有一个重要语义：只有“抛异常”会产生 `ok: false`。handler 返回 `skip` 也属于正常返回，所以仍是 `ok: true`。

三个目标各自做什么：

- `cursor`：让 `~/.cursor/plugins/local/csl` 指向仓库根目录。
- `codex-plugin`：移除若干现有/旧名称，重新加入本地 marketplace 与插件，再清理旧 skill 链接。
- `pi`：把仓库根目录交给 `pi install`。

### 第四步：理解 change 记录

handler 不打印结果，而是描述动作。常见记录形态包括：

```js
{ action: "symlink", target, source }
{ action: "unchanged", target, source }
{ action: "command", command, status }
{ action: "remove", target, source }
{ action: "skip", reason, command }
```

第 366 行之后才负责把它们变成人类可读输出。`--json` 则绕过这套渲染，直接序列化 results。这个分离让同一套安装行为能够同时服务终端用户和自动化调用方。

### 完整推演一个命令

假设用户输入：

```bash
csl-agent-kit install cursor,codex-plugin --dry-run --json
```

不运行代码也能推导出：

1. parser 得到两个 target，并打开 dry-run 与 JSON。
2. resolver 校验名称并保持输入顺序。
3. Cursor handler 返回计划创建的 symlink，不创建目录或链接。
4. Codex handler在 dry-run 时不检查 `codex --version`。
5. 八条 Codex 子命令都转成带 `dryRun: true` 的 command 记录。
6. 旧 skill 链接会被扫描；匹配项只返回计划删除记录，不执行 unlink。
7. 两个 handler 都未抛错，因此两个 result 都是 `ok: true`。
8. `main` 输出 JSON，并依据所有 result 的 `ok` 返回 `0`。

由此可见，dry-run 的承诺是“不产生安装写操作”，并不是“不访问文件系统”或“不构造外部命令”。

### 三条安装路径的幂等性差异

Cursor 路径由 `ensureSymlink` 自己判断当前状态：

- 同一来源：`unchanged`；
- 其他符号链接：替换；
- 普通文件或目录：报错。

Codex 路径采取“先删后装”，每次都会重放迁移命令。它的重复执行能力主要依赖删除命令允许失败，以及 Codex CLI 自身行为。

Pi 路径没有本地状态判断，幂等性完全交给 `pi install`。

### 安全判断在哪里发生

- 是否需要外部命令确认：`targets[*].external`，但只用于交互流程。
- 是否允许覆盖 Cursor 路径：`ensureSymlink`。
- 旧链接能否删除：`removeLegacyCodexSkillLinks` 与 `isWithin`。
- 外部命令失败能否忽略：命令元组的第三个布尔值。
- 是否真正写入：各副作用函数中的 `options.dryRun`。

### 四个快速自测

1. `install --target cursor --yes` 选哪些目标？  
   只选 Cursor，因为显式 target 早于 `yes`。

2. `install --all --target unknown` 会在哪里报错？  
   当前不会报错；`all` 分支先返回全部目标。

3. CI 中不传 target 或 `--yes` 会怎样？  
   `resolveInstallTargets` 调用 `die`，进程退出 `2`，避免等待交互输入。

4. 用户选择 Pi，但机器没有 `pi`，最终一定失败吗？  
   不会。handler 返回 `skip`，调度器仍标记 `ok: true`，所以可能以 `0` 退出。

如果要为它新增第四种安装目标，最小路径是：在 `targets` 中登记元数据与 handler；handler 遵守 dry-run，并返回现有 change 形状。只有出现重复实现时才值得提取新抽象。

本次按要求只做源码走读，未修改或运行该组件。

## 写入路径与 Git 状态

- Arm D：`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Arm L：`NO_OUTPUT`；`git status --short` 无输出（clean）。
