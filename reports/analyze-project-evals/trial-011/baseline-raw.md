# Baseline Raw Output

## Arm D — 原始最终回复

这个 CLI 已经具备清楚的“选择目标—执行安装—汇总结果”骨架，暂时不需要拆分成多个类或引入命令框架。当前最值得开发处理的是结果契约：代码把“handler 没抛异常”当成“安装成功”，导致 skip、部分完成和真实可用性之间出现偏差。

### 组件边界

```text
main
├─ parseInstallArgs          参数解析
├─ resolveInstallTargets     显式选择、默认选择或 prompts
├─ installTargets            target 调度与异常隔离
│  ├─ installCursor
│  ├─ installCodexPlugin
│  └─ installPi
└─ printResults / JSON       输出与退出码
```

顶部 `targets` 注册表同时承担元数据、默认选择、external 确认和 handler 路由。对目前三个目标而言，这个扩展点足够简单直接。

模块被 `require` 时不会执行 `main`，并只导出三个选择持久化 helper。其余核心逻辑仍以进程级 CLI 为主要测试边界。

### 高优先级问题

1. **缺少外部 CLI 被当成成功**

   `installCodexPlugin` 和 `installPi` 在找不到命令时返回 `skip` change。外层看到正常 return，就写入：

   ```js
   { target, ok: true, changes }
   ```

   所以终端显示绿色勾号，JSON 顶层可能为 `ok: true`，进程退出 0，并宣称 integration ready。自动化调用无法据此判断目标是否真的安装。

2. **Codex 部分执行状态丢失**

   Codex 安装依次删除旧身份、添加 marketplace、添加 plugin、清理旧 skill 链接。它不是事务：

   - 前六个删除命令允许失败；
   - 两个添加命令必须成功；
   - 添加成功后，后置清理仍可能抛错；
   - 发生异常时，已经积累的 changes 不会进入失败 Result。

   因而失败结果既没有回滚，也没有保留完成到哪一步的信息。

3. **交互 dry-run 仍会写文件**

   交互确认完成后会无条件保存选择。即使使用 `--dry-run`，仍可能更新 `install-selection.json`，与帮助中“不改变文件”的直观承诺不一致。

4. **JSON 只覆盖后半段错误**

   `--json` 只在安装调度完成后生效。非法选项、未知 target、无 TTY、取消确认等路径由 `die` 输出普通文本并退出 2。若 JSON 是脚本接口，应统一错误 envelope；否则应明确它只描述安装结果。

5. **参数组合存在隐藏优先级**

   - `--all` 会直接返回全部目标，额外传入的非法 target 不会校验。
   - `--target` 无条件消费下一个 token；另一个 option 可能被误当作 target。
   - 未知顶层 command 只显示帮助，并以成功状态结束。
   - `--verbose --json` 中 verbose 不产生额外信息。

6. **命令失败信息没有完整呈现**

   allowFailure 命令的非零 status 会写入 change，但摘要和 verbose 输出都不展示 status。`spawnSync` 启动错误也会退化成不明确的 `exit null`。同步外部命令没有 timeout，卡住时整个 CLI 会一直阻塞。

### 安全性与幂等性

实现中已经有几项可靠边界：

- 使用 argv 数组执行外部命令，没有 shell 注入面。
- Cursor 不覆盖普通文件或目录。
- 正确链接返回 unchanged，错误链接才替换。
- 旧 skill 清理不遍历目录，只处理直接子符号链接。
- `~/.agents/skills` 本身是符号链接时完全跳过。
- 外部链接、普通目录和不属于仓库的断链会保留。
- 选择记录通过 `0600` 临时文件和 rename 更新。
- 单个 target 抛错不会阻止后续 target。

Codex 的清理顺序也有合理设计：先完成 plugin add，再删除旧 skill 链接。聚焦测试明确保证 plugin add 失败时旧链接仍存在。

### 测试覆盖与缺口

现有聚焦测试覆盖了：

- 默认、verbose、ANSI 与 JSON 输出；
- Codex 历史身份迁移命令顺序；
- 交互选择的保存与无效值过滤；
- 废弃 target 的拒绝；
- 旧链接清理的 dry-run、范围和幂等性；
- plugin add 失败后的旧链接保留；
- 显式安装不覆盖交互选择。

建议优先补充：

1. Codex/Pi 不存在时的 Result、输出和退出码；
2. 交互 dry-run 不写选择文件；
3. `--all` 与非法 target 同时出现；
4. `--target` 后紧跟 option；
5. 未知顶层 command；
6. allowFailure 非零 status 的可见性；
7. Codex 部分完成后的失败结果；
8. 外部命令启动错误和 timeout。

### 最小改进方案

先统一一个明确的状态模型，例如区分 `success`、`skipped`、`failed`、`partial`，并让文本、JSON 和退出码从同一状态派生。随后：

1. dry-run 跳过交互偏好写入；
2. 失败 Result 保留已经执行的 changes；
3. verbose 显示命令 status；
4. 收紧参数和未知 command 处理；
5. 视自动化需求决定是否统一 JSON 错误。

这些修改可以继续留在单文件中完成。等 target 数量或执行协议真正增长后，再考虑拆分。

本次仅静态阅读源码、直接依赖声明和聚焦测试；没有修改源码，也没有运行项目、测试或构建。

## Arm L — 原始最终回复

理解这个文件最有效的方法，是把它分成五层：目标注册、输入解析、目标选择、安装动作和结果呈现。每层传递的数据都很简单，但“change”和“Result”的区别决定了整个 CLI 的成功语义。

### 第一层：目标注册表

`targets` 定义三个安装目标：

| target | 动作 | 默认 | external |
|---|---|---:|---:|
| `cursor` | 创建本地插件符号链接 | 否 | 否 |
| `codex-plugin` | 调用 Codex CLI 安装插件 | 是 | 是 |
| `pi` | 调用 Pi CLI 安装仓库 | 否 | 是 |

`default` 决定 `--yes` 和首次交互时预选什么；`external` 决定交互流程是否追加外部命令确认；`run` 指向具体 installer。

### 第二层：解析命令输入

入口只对 `install` 走安装流程。安装参数最终形成：

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

目标可以通过逗号列表、重复参数或位置参数传入。显式 target 会去重并校验。

目标决策优先级为：

```text
--all
→ 显式 targets
→ --yes 的默认目标
→ prompts 交互
```

因此 `--target cursor --yes` 实际只选 Cursor；`--all` 则覆盖其他 target 输入。

### 第三层：交互选择

只有 stdin 是 TTY 且没有真值 `CI` 时，程序才允许进入 prompts。

交互流程先读取历史选择：

```text
有效历史选择
  否则
注册表中的 default 目标
```

当前默认选中 Codex plugin。若选择中含 Codex 或 Pi，还会要求确认即将执行外部 CLI。

确认后，选择保存到：

```text
$CSL_AGENT_KIT_HOME/install-selection.json
```

未设置该变量时使用：

```text
~/.csl-agent-kit/install-selection.json
```

写入采用 `0600` 临时文件再 rename。读取失败采取宽容策略，文件不存在、JSON 损坏、版本不对或只包含废弃目标时都回退到默认选择。

### 第四层：安装动作

**Cursor**

目标是 `~/.cursor/plugins/local/csl`，来源是仓库根目录：

```text
不存在       → 创建链接
链接已正确   → unchanged
链接指向别处 → 删除并重建
普通文件目录 → 抛错
```

**Codex plugin**

非 dry-run 时先探测 `codex --version`。之后执行：

```text
容错删除 3 个 plugin 身份
→ 容错删除 3 个 marketplace 身份
→ 添加当前仓库 marketplace
→ 添加当前 plugin
→ 清理旧 skill 链接
```

旧链接清理只看 `~/.agents/skills` 的直接子项，并只删除指向当前仓库 `skills` 的符号链接。它不会遍历一个符号链接形式的 skills 目录，也不会删除普通目录或外部链接。

**Pi**

探测 `pi --version` 后运行：

```text
pi install <repoRoot>
```

### 第五层：change 与 Result

每个 installer 返回 change 列表。change 描述动作：

```text
symlink   链接创建或更新
unchanged 链接已经正确
command   外部命令
remove    旧链接清理
skip      未执行
```

`installTargets` 再把 handler 结果转换成 Result：

```js
// handler 正常返回
{ target, ok: true, changes }

// handler 抛出异常
{ target, ok: false, error }
```

这个区别非常重要：`ok` 判断的是控制流，不是安装后的可用性。

例如 Codex CLI 不存在时，installer 返回一个 `skip`，没有抛异常，所以仍得到 `ok: true`。最终可能同时出现：

```text
✓ Codex plugin  1 skipped
Done · 1/1 integrations ready
exit 0
```

这并不代表 Codex plugin 已安装。

### dry-run 的真实边界

dry-run 会阻止：

- 创建或替换 Cursor 链接；
- 启动 Codex/Pi 命令；
- 删除旧 skill 链接。

它会返回带 `dryRun: true` 的计划 change。不过，交互路径仍会保存选择记录，因此 dry-run 不是严格意义上的零写入。

### 输出和退出码

普通输出会把 change 展平、按 action 计数，并在 `--verbose` 时显示路径和命令。JSON 输出直接序列化 Result。

退出码分三类：

```text
0  所有 handler 都正常返回
1  至少一个 handler 抛错
2  参数或交互前提错误
```

早期的退出码 2 错误即使带 `--json`，仍是普通 stderr 文本。

颜色 auto 模式只检查是否存在 `NO_COLOR`，不检查 stdout 是否为终端，因此输出重定向时也可能包含 ANSI。

### 如何阅读 Codex 失败

Codex 的前六个删除命令允许失败，两个添加命令不允许失败。plugin add 失败时，后面的旧链接清理不会运行，这是测试保障的安全顺序。

但如果命令执行到一半才失败：

- 之前的删除或 marketplace 添加不会回滚；
- 失败 Result 只保留 error；
- 已完成的 changes 不会返回；
- 后置清理失败时，plugin 本身可能已经装好。

因此 `ok: false` 表示流程没有完整结束，并不能精确说明机器当前处于什么安装状态。

### 最短总结

```text
注册表决定装什么
参数或 prompts 决定选什么
installer 产生 change
调度器把 return 当成功、throw 当失败
输出层再决定文本、JSON 和退出码
```

阅读或维护这个组件时，优先检查状态语义，而不是急于拆分结构：现有结构简单，真正容易误解的是 `skip`、部分完成与 `ok` 之间的关系。

本次只进行了静态分析，没有修改或执行该 CLI，也没有运行测试或构建。

## 报告路径与 Git 状态

- Develop：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
- Learn：预期 report 不存在，`NO_OUTPUT`；`git status --short` 无输出（clean）。
