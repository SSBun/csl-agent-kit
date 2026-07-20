# Baseline Raw Output

## Arm D — 原始最终回复

这个安装 CLI 的主体结构清晰，461 行单文件目前仍可维护。核心问题不是缺少抽象，而是“安装成功”的状态语义不够准确，尤其会影响 CI 和脚本调用者。

### 执行结构

```text
main
├─ parseInstallArgs
├─ resolveInstallTargets
│  ├─ 显式 target / all / yes
│  └─ prompts 交互选择与偏好持久化
├─ installTargets
│  ├─ installCursor
│  ├─ installCodexPlugin
│  └─ installPi
└─ JSON 或终端结果输出
```

`targets` 注册表集中保存名称、描述、默认值、外部命令标志和 handler，是当前最合适的扩展点。没有必要为三个目标引入 installer class、provider 接口或更复杂的命令框架。

### 做得比较好的部分

- 外部程序使用 `spawnSync(command, args)`，没有通过 shell 拼接执行。
- Cursor 安装不会覆盖普通文件或目录，且能识别正确、错误和悬空符号链接。
- 交互选择文件采用临时文件加 rename，并以 `0600` 写入。
- 旧 Codex skill 清理只检查直接子项，不遍历符号链接目录。
- 清理前同时检查链接的原始路径与解析后的真实路径是否属于仓库 `skills`。
- 各 target 独立捕获异常，一个失败不会阻止其他目标执行。
- Codex 插件新增失败时不会继续删除旧 skill 链接；聚焦测试明确覆盖了这一点。
- dry-run 能覆盖链接、外部命令和旧链接清理动作。

### 优先问题

1. **skip 被计为成功**

   Codex 或 Pi CLI 不存在时，handler 返回 `skip` change，而不是抛错。`installTargets` 因而生成 `ok: true`，文本输出显示绿色勾号，JSON 顶层可能是 `ok: true`，进程也退出 0。

   这只能说明 handler 正常返回，不能说明 integration 已安装。对 CI 来说，这是最重要的契约缺陷。

2. **Codex 安装不是事务，但失败结果丢失部分进度**

   Codex 流程先执行六次容错删除，再添加 marketplace、添加 plugin，最后清理旧链接。新增阶段失败不会回滚前面动作；后置清理失败则可能把已经安装成功的插件标记为失败。

   `installTargets` 捕获异常后只保留 error message，已经执行的 command changes 全部丢失，因此用户无法从结果判断系统停在哪一步。

3. **dry-run 仍可能写交互选择文件**

   `resolveInstallTargets` 在交互确认后无条件调用 `saveInstallSelection`。因此 `install --dry-run` 虽然不执行安装动作，仍可能修改 `install-selection.json`，与“without changing files”的帮助语义不一致。

4. **JSON 不是完整的机器接口**

   `--json` 只影响安装结果阶段。未知选项、非法 target、无 TTY、取消安装等错误仍由 `die` 输出普通 stderr 并退出 2。脚本不能假设所有路径都返回 JSON。

5. **参数优先级存在意外边界**

   - `--all` 优先返回全部目标，附带的非法显式 target 不会被校验。
   - `--target` 会直接消费下一个 token；如果下一个 token 是另一个 option，会被当作 target 名。
   - 未知顶层 command 只打印帮助并成功结束，命令拼写错误不会产生非零退出码。

6. **被允许失败的命令状态不可见**

   六个 Codex 删除命令允许非零退出，change 中保存了 status，但文本摘要和 verbose 明细均不展示它。失败可能完全隐藏在“8 commands completed”后面。

### 测试覆盖情况

聚焦测试对以下行为覆盖较好：

- 默认、verbose、颜色及 JSON 输出；
- Codex 旧身份迁移命令顺序；
- 选择保存、无效历史选择和废弃 target；
- dry-run 清理、清理范围、幂等性；
- 插件新增失败时保留旧链接；
- 显式安装不覆盖交互偏好。

值得补充的边界测试是：

- Codex/Pi 缺失时的退出码与 JSON `ok`；
- 交互 dry-run 是否写偏好；
- `--all` 与非法 target 的组合；
- `--target` 后跟 option；
- 未知顶层 command；
- allowFailure 非零状态的文本展示；
- Codex 部分完成后的结果内容。

### 最小改动顺序

1. 明确定义 `skip` 是否代表失败；若安装目标不可用，应让 Result 和退出码反映未安装。
2. 交互 dry-run 不保存选择。
3. 在 Codex 命令失败时保留已执行 changes，明确 partial 状态。
4. verbose 输出显示非零 status。
5. 收紧参数解析和未知 command 退出行为。
6. 如果 `--json` 要作为稳定自动化接口，再统一所有错误路径的 JSON envelope。

不建议现在拆分文件或引入通用安装框架；先修正结果契约，并用现有进程级测试锁定行为即可。

本次仅进行了静态分析，没有修改源码，也没有运行项目、构建或测试。

## Arm L — 原始最终回复

这个文件可以理解为一个“小型同步安装编排器”：先决定安装什么，再逐项执行，最后把执行记录翻译成人类输出或 JSON。

### 1. 从命令入口开始

`main` 只特别处理 `install`：

```text
argv
→ 解析 install 参数
→ 解析目标集合
→ 逐个安装
→ 输出结果
→ 根据 Result 退出
```

其他 command 会显示总帮助。安装错误有两套退出规则：

- 参数或交互前提错误通过 `die` 立即退出 2；
- target handler 抛错会形成 `ok: false`，全部执行完后退出 1。

### 2. 怎样选择安装目标

目标注册表包含三个成员：

- `cursor`：创建本地插件链接；
- `codex-plugin`：调用 Codex CLI 安装插件；
- `pi`：调用 Pi CLI 安装仓库。

选择优先级是：

```text
--all
  > 显式 --target 或位置参数
  > --yes 所代表的默认目标
  > 交互 prompts
```

当前默认目标只有 `codex-plugin`。

交互模式要求 stdin 是 TTY，且 `CI` 环境变量不为真值。它会读取上次确认的选择；没有有效历史记录时回退到默认 Codex。Codex 和 Pi 标为 external，因此选择它们后还要额外确认。

### 3. 选择记录怎样保存

选择记录默认位于：

```text
~/.csl-agent-kit/install-selection.json
```

也可以通过 `CSL_AGENT_KIT_HOME` 改变目录。文件格式带 `version: 1`，只接受注册表中仍然存在的目标；废弃目标会被过滤。

写入过程是：

```text
创建目录
→ 写入 0600 临时文件
→ rename 到正式文件
→ finally 删除残留临时文件
```

因此它避免直接把正式文件写到一半。读取则采取宽容策略：文件不存在、JSON 损坏、版本错误或没有有效目标都返回 `null`。

一个容易忽略的细节是：交互 `--dry-run` 仍会保存选择，因为保存发生在安装调度之前。

### 4. 三个 installer 分别做什么

**Cursor**

把仓库根目录链接到 `~/.cursor/plugins/local/csl`：

- 不存在：创建链接；
- 已是正确链接：返回 `unchanged`；
- 是其他链接：删除后重建；
- 是普通文件或目录：抛错，不覆盖。

**Codex plugin**

非 dry-run 时先探测 `codex --version`。存在后依次：

1. 容错删除当前及历史 plugin 标识；
2. 容错删除当前及历史 marketplace 标识；
3. 添加当前仓库作为 marketplace；
4. 添加 `csl-agent-kit@csl-agent-market`；
5. 删除 `~/.agents/skills` 中指向当前仓库 skills 的旧链接。

前六个删除命令允许失败，两个新增命令不允许失败。旧链接清理放在新增之后，所以插件新增失败时不会提前删除旧入口。

**Pi**

先探测 `pi --version`，然后运行：

```text
pi install <repoRoot>
```

### 5. change 和 Result 不是同一个概念

installer 返回的是 change：

```text
symlink   创建或更新链接
unchanged 已经正确
command   计划或执行外部命令
remove    删除旧链接
skip      跳过目标
```

调度器把它包装成 Result：

```js
{ target, ok: true, changes }
{ target, ok: false, error }
```

这里的关键规则是：

```text
handler 正常 return → ok: true
handler throw         → ok: false
```

所以 `skip` 也会得到 `ok: true`。Codex/Pi 不存在时，用户可能看到绿色成功标记、JSON `ok: true` 和退出码 0，但实际安装没有发生。

### 6. dry-run 到底保证什么

dry-run 会阻止：

- Cursor 创建或替换链接；
- 外部命令执行；
- 旧 Codex skill 链接删除。

它仍会解析真实路径和检查部分文件系统状态，并且交互路径仍可能保存选择记录。因此它更接近“安装动作预览”，还不是严格的零写入模式。

### 7. 输出怎样形成

默认文本输出先把嵌套 change 展平，再按 action 计数。`--verbose` 才显示路径和命令；`--json` 则直接输出 Result，不经过文本渲染。

颜色规则是：

```text
--color       强制开启
--no-color    强制关闭
auto          只检查 NO_COLOR 是否存在
```

auto 没有检查 stdout 是否为 TTY，所以重定向输出也可能带 ANSI 颜色。

另外，允许失败的 Codex 删除命令虽然记录了 status，但文本输出不显示 status，非零结果可能看起来仍像正常完成。

### 8. 如何理解安全边界

旧链接清理采取了较谨慎的边界：

- `~/.agents/skills` 自身是符号链接时完全跳过；
- 只处理其直接子项；
- 只删除符号链接；
- 链接文本路径或解析后的真实路径至少有一个位于仓库 `skills` 内才删除；
- 外部链接、普通目录和断开的外部链接保留。

聚焦测试覆盖了 dry-run、目录符号链接、归属判断、幂等执行，以及插件新增失败后不清理旧链接。

### 9. 最短心智模型

```text
选择层：all / target / yes / prompts
执行层：三个同步 installer
记录层：change
结果层：return=成功，throw=失败
呈现层：摘要 / verbose / JSON
```

分析这个组件时，最应记住的是：当前 `ok` 表示“handler 没有抛异常”，不一定表示“integration 已经可用”。

本次只静态阅读了源码和聚焦测试，没有修改或执行该 CLI。

## 报告路径与 Git 状态

- Develop：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
