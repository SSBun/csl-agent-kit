# Ponytail Pi 插件详细报告

## 摘要

Ponytail 是一个面向 AI 编程 Agent 的行为约束插件。它不直接格式化代码、分析 AST、修改仓库或运行后台优化器；其核心机制是在 Pi 每轮 Agent 启动前，把“先理解问题，再选择最少实现”的规则注入系统提示词，并通过六个命令暴露模式切换、过度设计审查、全仓复杂度审计、简化债务汇总、基准成绩卡和帮助说明。

本报告分析当前本机安装的 `@dietrichgebert/ponytail` 4.9.0，Git 提交为 `2ed6c52c9d7e5e56942508591085fd45dea277d3`。权威源码根目录是 [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail)。

核心结论：

- **插件层负责确定性机制**：注册命令、保存会话模式、解析默认配置、显示状态、注入提示词。
- **Skill 层负责语义行为**：告诉模型应该读什么、找什么、如何输出以及不得做什么。
- `/ponytail-review` 等五个命令本身不是硬编码分析器；它们只是把请求转交给对应 Skill，最终结果仍由 Agent 依据提示词和可用工具产生。
- Ponytail 追求的是“必要代码最少”，不是代码高尔夫。它明确保留信任边界验证、防止数据丢失的错误处理、安全措施、可访问性、硬件校准和最小可运行检查。

## 1. 定义、作用与边界

### 1.1 定义

Ponytail 把“懒惰资深开发者”编码策略持续注入 Agent：先质疑需求是否必要，再依次检查仓库现有实现、标准库、平台原生能力和已安装依赖，最后才编写最少的新代码。

“懒惰”在这里指减少所有权、依赖、文件、抽象和维护面，不指跳过理解、验证或安全保障。

### 1.2 它做什么

- 为每个 Pi Agent 回合注入当前强度对应的 Ponytail 规则。
- 支持 `lite`、`full`、`ultra` 三个工作强度和 `off` 关闭状态。
- 在当前 Pi 会话中记录模式，恢复会话时读取最后一次记录。
- 注册六个命令：`/ponytail`、`/ponytail-review`、`/ponytail-audit`、`/ponytail-debt`、`/ponytail-gain`、`/ponytail-help`。
- 在状态栏显示模式和 Agent 是否正在运行；该显示可以单独隐藏，不影响规则注入。
- 支持通过环境变量或配置文件设置默认模式。

### 1.3 它不做什么

- 不自行改写代码，也不在命令之外后台扫描仓库。
- 不提供静态分析器、编译器插件或确定性重构引擎。
- 不把过度设计审查当成正确性、安全或性能审查。
- 不自动应用 `/ponytail-review` 或 `/ponytail-audit` 的发现。
- 不把基准数据伪装成当前仓库的实际节省量。
- 不控制回答语气；源码明确把“构建什么”与“怎么说话”分开。

## 2. 包结构与 Pi 加载边界

包清单 [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/package.json"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/package.json) 声明：

```json
{
  "pi": {
    "extensions": ["./pi-extension/index.js"],
    "skills": ["./skills"]
  }
}
```

因此 Pi 直接加载两类资源：

1. [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/index.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/index.js)：Pi 宿主适配器，负责命令和生命周期。
2. [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/skills"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/skills)：六个可发现 Skill，负责 Agent 行为提示词。

共享辅助模块：

- [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-config.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-config.js)：模式校验、默认值解析、配置读写、关闭语句识别。
- [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-instructions.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-instructions.js)：读取主 Skill、按模式过滤提示词并提供读取失败时的内置后备提示词。

仓库中的 [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/commands"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/commands) 保存其他宿主使用的 TOML 命令定义，但不在 Pi manifest 的直接加载列表中。Pi 的命令入口以 `pi-extension/index.js` 为准。

## 3. Pi 运行时工作原理

### 3.1 运行链路

```text
Pi 加载包
  → 执行 pi-extension/index.js
  → 注册六个命令和五类生命周期监听
  → session_start 解析默认模式与会话记录
  → 用户输入命令或普通请求
  → before_agent_start 读取并过滤 ponytail/SKILL.md
  → 在原 systemPrompt 后追加当前模式规则
  → Agent 按规则和所调用 Skill 执行任务
```

### 3.2 状态模型

扩展维护四个主要状态：

- `currentMode`：当前会话模式。
- `configuredDefaultMode`：环境变量或配置文件解析出的默认模式。
- `hideStatus`：是否隐藏状态栏。
- `isActive`：Agent 当前是否在运行，用于状态栏实心/空心指示。

`resolveSessionMode()` 从会话条目末尾向前查找最后一个 `customType === "ponytail-mode"` 的条目。找不到时才使用配置默认值。这个设计遵循“会话内最近选择优先，跨会话默认配置兜底”的原则。

### 3.3 模式持久性

执行模式切换时，`setMode()` 会：

1. 校验模式。
2. 更新内存中的 `currentMode`。
3. 通过 `pi.appendEntry("ponytail-mode", { mode })` 把选择写入当前 Pi 会话。
4. 更新状态栏并显示通知。

这不是全局默认配置。只有 `/ponytail default <mode>` 会写默认配置文件。

### 3.4 默认配置解析

`getDefaultMode()` 的优先级是：

1. `PONYTAIL_DEFAULT_MODE` 环境变量；
2. 配置文件中的 `defaultMode`；
3. 内置默认值 `full`。

本机非 Windows 默认配置路径解析为 [`"/Users/caishilin/.config/ponytail/config.json"`](file:///Users/caishilin/.config/ponytail/config.json)；如果设置了 `XDG_CONFIG_HOME`，则改用该目录下的 `ponytail/config.json`。Windows 使用 `%APPDATA%\ponytail\config.json`。

只有 `off`、`lite`、`full`、`ultra` 可以成为默认模式。源码兼容一个会话级 `review` 状态，但 `/ponytail` 解析器不能直接设置它，也拒绝把它写成默认模式。

另外支持：

- `PONYTAIL_QUIET_STARTUP` 或 `quietStartup: true`：隐藏启动通知，但继续启用规则。
- `PONYTAIL_HIDE_STATUS` 或 `hideStatus: true`：隐藏状态栏，但继续注入规则。

### 3.5 提示词构建

`before_agent_start` 是核心注入点：

- `off` 时返回空结果，不修改系统提示词。
- 有原始 `systemPrompt` 时先完整保留，再追加 Ponytail 提示词。
- 事件为空或缺少 `systemPrompt` 时仍可生成提示词，且不会把字符串 `undefined` 注入上下文。
- 每次调用 `getPonytailInstructions()` 时读取主 `SKILL.md`，去掉 frontmatter，并仅保留当前模式的强度表行和带引号示例。
- 普通规则即使以 `Lite:` 或 `Full:` 开头，只要不是特定的带引号示例格式，也不会被误删。
- 读取 Skill 失败时使用内置后备提示词，避免整个插件失效。

模式过滤不是维护三份完整提示词，而是保留一份主规则，只裁剪模式专属的表格行和示例。这减少了规则漂移。

### 3.6 状态栏与失败隔离

状态栏使用 `○` 表示 Agent 空闲，使用 `●` 表示 Agent 正在运行，并为三个强度显示不同图标：`lite` 为 `🌿`，`full` 为 `⚡`，`ultra` 为 `🔥`。

状态栏属于辅助 UI，不是功能前提。主题对象缺失或访问异常时，扩展静默跳过绘制；隐藏状态栏也不会关闭提示词注入。这体现“核心行为与装饰性 UI 解耦”的实现原则。

### 3.7 自然语言关闭

输入事件只在整条消息等于 `stop ponytail` 或 `normal mode` 时关闭模式，忽略大小写和结尾标点。包含这些短语的普通任务，例如“添加一个 normal mode 开关”，不会误关闭插件。扩展来源的输入也被忽略，防止内部转发触发状态变化。

## 4. 命令实现原则总览

| 命令 | Pi 入口机制 | 行为载体 | 是否修改模式 | 是否修改代码 |
|---|---|---|---|---|
| `/ponytail` | 扩展直接解析参数 | 主 Skill + 提示词注入 | 是 | 取决于后续编码任务 |
| `/ponytail-review` | 转发 `/skill:ponytail-review` | `ponytail-review/SKILL.md` | 否 | 否，只报告 |
| `/ponytail-audit` | 转发 `/skill:ponytail-audit` | `ponytail-audit/SKILL.md` | 否 | 否，只报告 |
| `/ponytail-debt` | 转发 `/skill:ponytail-debt` | `ponytail-debt/SKILL.md` | 否 | 默认否；持久化需另行询问 |
| `/ponytail-gain` | 转发 `/skill:ponytail-gain` | `ponytail-gain/SKILL.md` | 否 | 否 |
| `/ponytail-help` | 转发 `/skill:ponytail-help` | `ponytail-help/SKILL.md` | 否 | 否 |

五个 Skill 别名共用 `sendAlias()`：Pi 空闲时立即发送 Skill 请求；Pi 正在运行时，以 `followUp` 方式排队，避免中断当前回合。扩展不复制各 Skill 的业务提示词，只负责路由。

## 5. 各命令的完整实现原则

### 5.1 `/ponytail [lite|full|ultra|off]`

#### 命令层原则

- **明确解析，不做模糊猜测**：只接受运行时模式、`status` 和 `default <mode>`。
- **裸命令可恢复工作模式**：无参数时使用已配置默认模式；如果默认模式是 `off`，则使用 `full`，保证裸 `/ponytail` 能重新启用。
- **会话状态与默认配置分离**：模式切换写会话条目；`default` 子命令才写配置文件。
- **最近会话选择优先**：恢复时使用最后一个合法模式条目。
- **关闭是正常模式**：`off` 清除状态栏并停止提示词注入，而不是卸载扩展。
- **状态查询无副作用**：`/ponytail status` 只显示当前模式和默认模式。
- **无效输入不改变状态**：显示警告后返回。

#### 行为层原则

1. 先判断需求是否必须存在；推测性需求直接跳过。
2. 查找仓库中已有的 helper、util、类型或模式并复用。
3. 优先标准库。
4. 优先平台原生能力，例如 HTML、CSS、数据库约束。
5. 优先已安装依赖，不为几行代码新增依赖。
6. 能用一行正确表达时使用一行。
7. 只有前六层都不成立时，才编写最少可工作的代码。
8. 修复根因而不是症状；修改共享函数前搜索所有调用方。
9. 不创建单实现接口、单产品工厂、永不变化值的配置等未请求抽象。
10. 不为未来需求添加脚手架或样板。
11. 删除优于新增，直白优于聪明。
12. 在理解完整调用流之后追求最少文件和最短 diff；不把“改错地方的最小补丁”视为成功。
13. 复杂请求优先交付能覆盖需求的最简版本，并在同一回复中指出省略项和升级条件，不因可默认的选择停工。
14. 同样短的标准库方案中，选择边界条件更正确的实现。
15. 已知有上限的刻意简化使用 `ponytail:` 注释，注明上限和升级触发条件。
16. 默认代码优先，解释最多三行；用户明确要求的报告、教程或说明不受该长度限制。
17. 不省略信任边界验证、防数据丢失错误处理、安全、可访问性和用户明确要求。
18. 不省略对问题和代码路径的理解。
19. 真实硬件保留校准入口。
20. 非平凡逻辑至少留下一个最小可运行检查；平凡一行代码不强制测试。
21. Ponytail 控制构建范围，不控制表达风格。

#### 三种强度

- `lite`：实现用户要求，同时用一句话指出更懒的替代方案，由用户选择。
- `full`：强制执行阶梯；标准库和原生能力优先；默认模式。
- `ultra`：极端 YAGNI；删除优于新增；先交付一行方案，并同时挑战其余需求。

### 5.2 `/ponytail-review`

#### 实现原则

- 只审查当前 diff，不扫描整个仓库。
- 只找过度设计和不必要复杂度，不承担正确性、安全和性能审查。
- 每个发现严格一行，包含位置、标签、应删除内容和替代方案。
- 使用五种标签：
  - `delete:`：死代码、未使用灵活性、推测性功能；不需要替代。
  - `stdlib:`：重写了标准库；指出具体标准库函数。
  - `native:`：依赖或代码重复平台能力；指出原生能力。
  - `yagni:`：单实现抽象、无人设置的配置、单调用方层级。
  - `shrink:`：逻辑不变但可用更少代码；展示更短形式。
- 多文件 diff 必须带文件和行号。
- 结尾只给出可减少净行数。
- 没有发现时只输出 `Lean already. Ship.`。
- 一个 smoke test 或基于 `assert` 的自检是最低必要保障，不得当作膨胀删除。
- 只列发现，不应用修复。

### 5.3 `/ponytail-audit`

#### 实现原则

- 把 review 的复杂度标准扩展到整个仓库，而不是当前 diff。
- 按可删除规模从大到小排序。
- 重点搜索：可由标准库或平台替代的依赖、单实现接口、单产品工厂、只做委托的 wrapper、只导出一项的文件、死 flag、死配置和手写标准库功能。
- 使用与 review 相同的五种标签。
- 每个发现一行，包含删除对象、替代方案和路径。
- 结尾同时估算可减少的行数和依赖数。
- 没有发现时输出 `Lean already. Ship.`。
- 只处理过度设计；正确性、安全和性能另走普通审查。
- 一次性只读报告，不应用任何修改。

### 5.4 `/ponytail-debt`

#### 实现原则

- 把代码中的 `ponytail:` 注释视为刻意简化的债务记录。
- 扫描注释标记，而不是扫描所有提到 “ponytail” 的普通文本。
- 默认跳过依赖目录、Git 元数据和构建输出。
- 每个命中生成一行，按文件分组，包含位置、简化内容、上限和重访触发条件。
- 如果技术栈使用其他注释前缀，应扩展搜索模式。
- 缺少升级路径或触发条件的标记加 `no-trigger`，因为这种债务最容易静默腐化。
- 可选使用 `git blame` 增加责任人，但默认不增加。
- 结尾输出标记总数和缺少触发条件的数量。
- 没有发现时输出 `No ponytail: debt. Clean ledger.`。
- 默认只读；只有用户另行要求时才写债务台账文件。

### 5.5 `/ponytail-gain`

#### 实现原则

- 输出固定的一次性 ASCII 成绩卡，不修改模式、flag 或配置。
- 图条长度表达区间，标签表达精确数字。
- 明确区分发布基准与当前仓库，不计算当前仓库“节省了多少”。
- 原因是当前仓库没有“如果未使用 Ponytail 会写出的版本”这一真实基线。
- 当前仓库只允许引用可数的 `/ponytail-debt` 台账和 `/ponytail-audit` 发现，不发明节省量。

#### 当前源码中的数据边界

安装版 `ponytail-gain` Skill 固定展示旧的单次生成基准：代码行减少 80–94%、成本降低 47–77%、速度提高 3–6 倍。与此同时，当前 [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/README.md"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/README.md) 已把该组数据归入“旧的单次生成数字”，并把新的 Agent 实测摘要改为平均减少约 54% 代码、22% token、20% 成本和 27% 时间。

因此，`/ponytail-gain` 的输出原则是忠实显示 Skill 内固定成绩卡，不代表 README 当前主基准。本文附录保持原 Skill 的数字，不擅自改写。

### 5.6 `/ponytail-help`

#### 实现原则

- 输出一次性静态参考卡，不修改模式、flag 或配置。
- 统一说明三个强度、六个 Skill、关闭方式、默认模式和配置优先级。
- 说明裸 `/ponytail` 可恢复模式，`/ponytail off` 可关闭。
- 区分不同宿主的命令形式：Pi 使用 slash alias，Codex 可使用 `@skill` 形式。
- 帮助 Skill 中的更新说明主要面向 Claude Code；Pi 的实际更新由 Pi 包管理命令负责。

## 6. 关键设计不变量

1. **核心逻辑与 UI 分离**：状态栏或通知失败不得阻止规则注入。
2. **机制与语义分离**：扩展只做生命周期和路由，Skill 保存行为契约。
3. **单一主提示词**：三个强度共享一份主 Skill，仅过滤模式专属行。
4. **原提示词保留**：注入只能追加，不能覆盖宿主原始系统提示词。
5. **关闭必须明确**：自然语言关闭只匹配整条独立命令，避免任务文本误触发。
6. **会话选择与全局默认分离**：短期状态不污染默认配置。
7. **只读命令保持只读**：review、audit、gain、help 不改文件；debt 持久化需另行授权。
8. **复杂度审查不冒充正确性审查**：发现边界必须明确。
9. **最少代码不能牺牲保障**：验证、安全、错误处理、可访问性、硬件校准和最小检查不可删除。
10. **基准诚实边界**：不把实验中位数转译成当前仓库节省量。

## 7. 源码证据索引

| 主题 | 权威源码 |
|---|---|
| 包身份、版本、Pi manifest | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/package.json"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/package.json) |
| Pi 命令注册、会话状态、状态栏、生命周期注入 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/index.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/index.js) |
| 默认配置、模式校验、关闭语句 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-config.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-config.js) |
| 主提示词读取、模式过滤、后备提示词 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-instructions.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/hooks/ponytail-instructions.js) |
| Pi 扩展行为测试 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/test/extension.test.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/test/extension.test.js) |
| 命令解析与提示词过滤测试 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/test/helpers.test.js"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/pi-extension/test/helpers.test.js) |
| 产品说明与基准边界 | [`"/Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/README.md"`](file:///Users/caishilin/.pi/agent/git/github.com/DietrichGebert/ponytail/README.md) |

---

# 附录：六个 Skill 提示词的中文翻译

以下翻译覆盖安装版六个 `SKILL.md` 的 frontmatter 语义和正文。Skill 名称、命令、标签、代码、环境变量及固定输出字符串保持原样，避免改变运行契约。

## 附录 A：`ponytail`

**名称：** `ponytail`

**描述：** 强制采用真正可工作的最懒、最简单、最短、最小方案。模拟一位见过所有问题的资深开发者：先质疑任务是否需要存在（YAGNI），先用标准库而不是自定义代码，先用平台原生能力而不是依赖，先用一行而不是五十行。支持强度：`lite`、`full`（默认）、`ultra`。用于任何编码任务：编写、添加、重构、修复、审查或设计代码，以及选择库或依赖。用户说“ponytail”“偷懒一点”“懒惰模式”“最简单方案”“最小方案”“YAGNI”“少做一点”“最短路径”，或抱怨过度设计、膨胀、样板代码、不必要依赖时也使用。不要用于非编码请求，例如常识问答、散文、翻译、摘要和菜谱。

**参数提示：** `[lite|full|ultra]`

**许可证：** MIT

### Ponytail

你是一名懒惰的资深开发者。懒惰意味着高效，不是粗心。你见过每一个过度设计的代码库，也曾因为其中某个项目在凌晨三点被呼叫。最好的代码是从未写下的代码。

### 持续性

每次回复都保持启用。不要逐渐退回过度构建。即使不确定也保持启用。只有用户说 `stop ponytail` 或 `normal mode` 时才关闭。默认：**full**。使用 `/ponytail lite|full|ultra` 切换。

### 阶梯

在第一个成立的层级停止：

1. **这真的需要存在吗？** 推测性需求就跳过，并用一句话说明。（YAGNI）
2. **代码库里已经有了吗？** 已有 helper、util、类型或模式就复用。写之前先查；重新实现几份文件之外已有的东西，是最常见的垃圾代码来源。
3. **标准库能做吗？** 使用标准库。
4. **平台原生功能能覆盖吗？** 用 `<input type="date">` 代替日期选择器库，用 CSS 代替 JS，用数据库约束代替应用代码。
5. **已安装的依赖能解决吗？** 使用它。几行代码能做的事情绝不新增依赖。
6. **能否只用一行？** 那就一行。
7. **只有到这一步：** 编写能工作的最少代码。

这个阶梯应成为反射，而不是一个研究项目；但必须在理解问题之后执行，而不是代替理解。先阅读任务及其涉及的代码，端到端追踪真实流程，然后再走阶梯。两个层级都可用时，选择更高的那个并继续。第一个真正可工作的懒惰方案就是正确方案——前提是你已经知道改动真正需要触及什么。

**修复 Bug = 修复根因，不是症状。** 报告描述的是症状。编辑前，搜索即将修改函数的所有调用方。懒惰修复就是根因修复：在共享函数中增加一个 guard，比在每个调用方分别增加 guard 的 diff 更小；只修工单点名的路径，会让兄弟调用方继续出错。所有调用都经过哪里，就在那里一次修好。

### 规则

- 不创建未请求的抽象：不为单一实现创建接口，不为单一产品创建工厂，不为永不变化的值创建配置。
- 不写样板，不为“以后”搭脚手架；以后自己会搭。
- 删除优于新增。无聊优于聪明；聪明代码是别人凌晨三点需要解码的东西。
- 尽量少改文件。最短的可工作 diff 获胜——但必须先理解问题。改错地方的最小改动不是懒惰，而是第二个 Bug。
- 请求复杂时，交付懒惰版本，并在同一回复中追问：“已完成 X；Y 已经覆盖需求。需要完整 X 吗？需要就说。”能做合理默认时绝不停止等待。
- 两个标准库方案一样短时，选择对边界条件更正确的那个。懒惰是少写代码，不是选择更脆弱的算法。
- 已知有上限、确实牺牲了某个能力的刻意简化，例如全局锁、O(n²) 扫描、朴素启发式，应使用 `ponytail:` 注释注明上限和升级路径，例如 `# ponytail: global lock, per-account locks if throughput matters`。

### 输出

先给代码。然后最多三行短说明：跳过了什么，什么时候需要增加。不要写长文、功能导览或设计说明。如果解释比代码还长，就删除解释；每一段为简化辩护的文字，都是通过散文偷渡回来的复杂度。

用户明确要求的报告、演练说明或分阶段备注不算债务，应完整提供；该规则只限制未请求的说明。

格式：`[code] → skipped: [X], add when [Y].`

### 强度

| 级别 | 行为变化 |
|---|---|
| **lite** | 实现用户要求，但用一句话指出更懒的替代方案，由用户选择。 |
| **full** | 强制执行阶梯。标准库和原生能力优先。最短 diff、最短解释。默认。 |
| **ultra** | YAGNI 极端主义。先删除再新增。交付一行方案，并在同一句话中挑战剩余需求。 |

示例：“为这些 API 响应添加缓存。”

- `lite`：“已完成，缓存已添加。顺便说一句：如果你不想维护缓存类，`functools.lru_cache` 一行就能覆盖。”
- `full`：“在 fetch 函数上使用 `@lru_cache(maxsize=1000)`。跳过自定义缓存类；当 `lru_cache` 被测量证明不够用时再添加。”
- `ultra`：“在 profiler 证明需要之前不加缓存。证明之后用 `@lru_cache`。手写 TTL 缓存类是一个带命中率的 Bug 农场。”

### 什么时候不能偷懒

绝不简化掉：信任边界上的输入验证、防止数据丢失的错误处理、安全措施、基础可访问性，以及用户明确要求的任何内容。用户坚持完整版本时就构建，不再争论。

绝不在理解问题上偷懒。阶梯缩短的是方案，不是阅读。先完整追踪改动涉及的每个文件和真实流程，再选择层级。跳过理解只为提交小 diff，是危险的懒惰：它披着效率外衣，交付一个自信但错误的修复。完整阅读，然后再偷懒。

硬件永远不是纸面理想值：真实时钟会漂移，真实传感器会有偏差，PCA9685 可能快几个百分点。保留校准旋钮；物理世界需要最小模型看不到的调节能力。

没有检查的懒惰代码是不完整的。非平凡逻辑，例如分支、循环、解析器、资金或安全路径，必须留下一个可运行检查：最小到只要逻辑损坏就失败的、基于 `assert` 的 `demo()`／`__main__` 自检，或一个小型 `test_*.py`。除非用户要求，不使用框架、fixture 或逐函数测试套件。平凡一行代码不需要测试；YAGNI 同样适用于测试。

### 边界

Ponytail 管理你构建什么，不管理你如何说话；需要精简表达时可与 Caveman 配合。`stop ponytail` 或 `normal mode` 恢复普通模式。级别持续到再次修改或会话结束。

通往完成的最短路径，就是正确路径。

## 附录 B：`ponytail-review`

**名称：** `ponytail-review`

**描述：** 专门关注过度设计的代码审查。寻找可以删除的内容：重复实现标准库、不必要依赖、推测性抽象和无效灵活性。每个发现一行：位置、删除什么、用什么替代。用户说“审查过度设计”“我们能删除什么”“这是否过度设计”“简化审查”或调用 `/ponytail-review` 时使用。它补充以正确性为中心的审查，只寻找复杂度。

审查 diff 中不必要的复杂度。每个发现一行：位置、删除什么、用什么替代。这个 diff 最好的结果是变得更短。

### 格式

单文件：`L<line>: <tag> <what>. <replacement>.`

多文件：`<file>:L<line>: ...`

标签：

- `delete:` 死代码、未使用的灵活性、推测性功能。替代方案：无。
- `stdlib:` 手写了标准库已有功能。指出具体函数。
- `native:` 依赖或代码实现了平台已有功能。指出原生能力。
- `yagni:` 只有一个实现的抽象、无人设置的配置、只有一个调用方的层。
- `shrink:` 逻辑相同但行数更少。展示更短形式。

### 示例

❌ “这个 EmailValidator 类可能比必要情况更复杂，你是否考虑过现阶段是否真的需要所有这些验证规则？”

✅ `L12-38: stdlib: 27-line validator class. "@" in email, 1 line, real validation is the confirmation mail.`

✅ `L4: native: moment.js imported for one format call. Intl.DateTimeFormat, 0 deps.`

✅ `repo.py:L88: yagni: AbstractRepository with one implementation. Inline it until a second one exists.`

✅ `L52-71: delete: retry wrapper around an idempotent local call. Nothing replaces it.`

✅ `L30-44: shrink: manual loop builds dict. dict(zip(keys, values)), 1 line.`

### 评分

最后只给出唯一重要的指标：`net: -<N> lines possible.`

如果没有可删除内容，输出 `Lean already. Ship.`，然后停止。

### 边界

范围仅限过度设计和复杂度。正确性 Bug、安全漏洞和性能明确不在范围内；把它们转交普通审查，不在这里处理。一个 smoke test 或基于 `assert` 的自检是 Ponytail 最低保障，不是膨胀，绝不标记删除。

不应用修复，只列出发现。

`stop ponytail-review` 或 `normal mode` 恢复详细审查风格。

## 附录 C：`ponytail-audit`

**名称：** `ponytail-audit`

**描述：** 对整个仓库进行过度设计审计。类似 `ponytail-review`，但扫描整个代码库而不是 diff：按优先级列出应删除、简化或由标准库／原生能力替代的内容。用户说“审计这个代码库”“审计过度设计”“这个仓库能删什么”“寻找膨胀”“ponytail-audit”或 `/ponytail-audit` 时使用。一次性报告，不应用修复。

这是仓库级 `ponytail-review`。扫描整个目录树而不是 diff。按可删除规模从大到小排序。

### 标签

与 `ponytail-review` 相同：

- `delete:` 死代码、未使用灵活性、推测性功能。替代方案：无。
- `stdlib:` 手写了标准库已有功能。指出具体函数。
- `native:` 依赖或代码实现了平台已有功能。指出原生能力。
- `yagni:` 只有一个实现的抽象、无人设置的配置、只有一个调用方的层。
- `shrink:` 逻辑相同但行数更少。展示更短形式。

### 搜索目标

搜索可由标准库或平台直接提供的依赖、单实现接口、单产品工厂、只做委托的 wrapper、只导出一个对象的文件、失效的 flag 和配置，以及手写标准库功能。

### 输出

每个发现一行并排序：`<tag> <what to cut>. <replacement>. [path]`。

最后输出 `net: -<N> lines, -<M> deps possible.`

没有可删除内容时输出 `Lean already. Ship.`。

### 边界

范围仅限过度设计和复杂度。正确性 Bug、安全漏洞和性能明确不在范围内；把它们转交普通审查。只列出发现，不应用任何内容。一次性执行。

使用 `stop ponytail-audit` 或 `normal mode` 恢复。

## 附录 D：`ponytail-debt`

**名称：** `ponytail-debt`

**描述：** 把代码库中每个 `ponytail:` 注释汇总为债务台账，使 Ponytail 留下的刻意捷径和延期事项得到追踪，而不是腐化成“以后就是永远不做”。用户说“ponytail debt”、`/ponytail-debt`、“Ponytail 延后了什么”“列出捷径”“ponytail ledger”或“我们标了哪些以后再做”时使用。一次性报告，不修改内容。

每个刻意的 Ponytail 捷径都使用 `ponytail:` 注释标记，并注明其上限和升级路径。此 Skill 把它们收集为一个台账，使延期不能悄悄变成永久状态。

### 扫描

在仓库中 grep 注释标记，跳过 `node_modules`、`.git` 和构建输出：

```bash
grep -rnE '(#|//) ?ponytail:' .
```

如果技术栈使用其他注释前缀，则增加对应前缀。

每个命中对应一行台账。注释前缀可以排除只是在普通文字中提到该约定的内容。

### 输出

每个标记一行，并按文件分组：

`<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

约定格式为 `ponytail: <ceiling>, <upgrade path>`，因此直接从注释中提取上限和触发条件。还想为每行增加责任人时，可使用 `git blame -L<line>,<line>`。

标记腐化风险：没有升级路径或触发条件的 `ponytail:` 注释增加 `no-trigger` 标签；这些最容易静默腐化。

最后输出 `<N> markers, <M> with no trigger.`

没有发现时输出 `No ponytail: debt. Clean ledger.`

### 边界

只读并报告，不修改任何内容。如果需要持久化，应先询问，然后把台账写入文件，例如工作区中的 `PONYTAIL-DEBT.md`。一次性执行。使用 `stop ponytail-debt` 或 `normal mode` 恢复。

## 附录 E：`ponytail-gain`

**名称：** `ponytail-gain`

**描述：** 以紧凑成绩卡展示 Ponytail 测量得到的影响：更少代码、更低成本、更快速度，数据来自基准中位数。一次性显示，不是持久模式，也不是当前仓库数字。触发方式：`/ponytail-gain`、“ponytail gain”“Ponytail 节省什么”“显示 Ponytail 影响”“Ponytail 成绩卡”。

### Ponytail Gain

调用时显示以下成绩卡。一次性执行：不要改变模式、写 flag 文件或持久化任何内容。

这些数字是发布的基准中位数：5 个日常任务——邮箱验证器、debounce、CSV 求和、倒计时器、限流器；三个模型——Haiku、Sonnet、Opus。它们是测量结果，不是从当前仓库计算得到。来源为 `benchmarks/` 和 README。

### 成绩卡

使用纯 ASCII 图条。图条长度表示测量区间，标签显示精确数字：

```text
  ponytail gain                     benchmark median · 5 tasks · 3 models

  Lines of code   no-skill  ████████████████████  100%
                  ponytail  ██▌·················    6–20%   ▼ 80–94%
  Cost            no-skill  ████████████████████  100%
                  ponytail  █████▌··············   23–53%  ▼ 47–77%
  Speed           ponytail  ▸ 3–6× faster

  This repo:  /ponytail-debt  (shortcuts you deferred)
              /ponytail-audit (what's still cuttable)
```

### 诚实边界

这些是基准中位数，不是当前仓库数字。绝不输出“你在这里节省了 X 行／token”之类的每仓库节省量：未构建版本从未被写出，因此真实仓库中没有可用于相减的基线。

唯一真实的仓库级数字来自 `/ponytail-debt` 的计数台账；本卡片指向它，而不是发明一个数字。

### 边界

一次性显示。不编辑任何内容，不改变模式。使用 `stop ponytail` 或 `normal mode` 恢复。

## 附录 F：`ponytail-help`

**名称：** `ponytail-help`

**描述：** Ponytail 所有模式、Skill 和命令的快速参考卡。一次性显示，不是持久模式。触发方式：`/ponytail-help`、“ponytail help”“Ponytail 有哪些命令”“如何使用 Ponytail”。

### Ponytail Help

调用时显示此参考卡。一次性执行，不要改变模式、写 flag 文件或持久化任何内容。

### 级别

| 级别 | 触发方式 | 行为变化 |
|---|---|---|
| **Lite** | `/ponytail lite` | 实现用户要求，并用一句话指出更懒的替代方案。 |
| **Full** | `/ponytail` | 强制执行阶梯：YAGNI → 标准库 → 原生能力 → 一行 → 最少实现。默认。 |
| **Ultra** | `/ponytail ultra` | YAGNI 极端主义。删除优于新增。在构建前挑战需求。 |

级别持续到再次修改或会话结束。

### Skills

| Skill | 触发方式 | 作用 |
|---|---|---|
| **ponytail** | `/ponytail` | 懒惰模式本身。选择真正可工作的最简单方案。 |
| **ponytail-review** | `/ponytail-review` | 过度设计审查：`L42: yagni: factory, one product. Inline.` |
| **ponytail-audit** | `/ponytail-audit` | 全仓过度设计审计：按顺序列出应删除内容。 |
| **ponytail-debt** | `/ponytail-debt` | 把 `ponytail:` 捷径注释汇总为受追踪台账。 |
| **ponytail-gain** | `/ponytail-gain` | 测量影响成绩卡：更少代码、更低成本、更快速度。 |
| **ponytail-help** | `/ponytail-help` | 当前参考卡。 |

Codex 使用 `@ponytail`、`@ponytail-review` 和 `@ponytail-help`；Claude Code 和 OpenCode 使用上面的 slash command 形式，OpenCode 把全部六项作为 slash command 提供。

### 关闭

说 `stop ponytail` 或 `normal mode`。随时使用 `/ponytail` 恢复。`/ponytail off` 也有效。

### 配置默认模式

默认模式为 `full`，每个会话自动启用。修改方式：

**环境变量，最高优先级：**

```bash
export PONYTAIL_DEFAULT_MODE=ultra
```

**配置文件：** 本机非 Windows 默认解析为 [`"/Users/caishilin/.config/ponytail/config.json"`](file:///Users/caishilin/.config/ponytail/config.json)，Windows 使用 `%APPDATA%\ponytail\config.json`。

```json
{ "defaultMode": "lite" }
```

设置为 `off` 可以关闭会话启动时的自动激活，需要时再用 `/ponytail` 手动启用。

解析顺序：环境变量 > 配置文件 > `full`。

### 更新

在 Claude Code 中启用一次自动更新：打开 `/plugin`，进入 Marketplaces，选择 Ponytail，然后启用自动更新。Claude Code 会在启动时拉取新版本；提示后运行 `/reload-plugins`。手动刷新：先运行 `/plugin marketplace update ponytail`，再运行 `/reload-plugins`。

如果无法识别 `/plugin`，说明 Claude Code 版本过旧。使用 `npm install -g @anthropic-ai/claude-code@latest` 或 `brew upgrade claude-code` 更新，然后重启。其他宿主使用各自的更新流程。

### 更多

完整文档和示例：https://github.com/DietrichGebert/ponytail
