# 我的 Pi 环境：插件、配置与复用指南

> 记录日期：2026-09-11。基于本机安装文件、配置、包 manifest 与当前会话的只读核对，不是“推荐插件排行榜”。版本与配置会随更新变化。
>
> 本文可以单独分享。账号、密钥、私人知识库位置和服务路径没有导出；所有 ["/Users/yourname"](file:///Users/yourname) 路径均为脱敏模板，阅读者需要替换为自己的用户主目录。文中的本地链接用于定位文件，不会随 Markdown 自动打包对应资源。

## 0. 引导安装：先把现有 Pi 插件装起来

如果你主要想使用这套插件，先按本章安装，再按第 3～7 节选择配置；不必先复制我的整个环境。本文所说的 plugins 对应 Pi 的 packages，可能同时包含扩展、Skills 和 Prompt 模板。

本章提供 **9 个可分发包**的安装命令：用 npm 版 CSL 替代本机开发仓库，其余沿用快照中的 6 个 npm 包和 2 个 Git 包。Vibe Island 和独立本地扩展需要各自的文件或伴随应用，放在最后处理。

所有版本均按 2026-09-11 的环境快照锁定，不是最新版推荐。以下步骤供读者自行执行，编写本文时没有实际安装或更新插件。

### 0.1 准备 Node、Git 和 Pi

在普通终端执行；**这些是 Shell 命令，不是在 Pi 对话框里发送的提示词**：

```bash
node --version
npm --version
git --version
```

需要已安装 Node.js 和 npm，并能访问 npm 与 GitHub。建议从本文的 Node 22.22.2 起步；压缩插件至少需要 Node 22.19.0。若上面提示命令不存在，先通过你使用的 Node 版本管理器或 [Node.js 官网](https://nodejs.org/) 安装 Node，并安装 Git，再继续。

尚未安装 Pi 时执行：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.85.1
pi --version
```

已安装兼容版本可跳过，不要为了照抄而直接降级现有环境。后台子 Agent 依赖 npm 形态的 Pi，只有单文件 Pi 可执行程序不够。

开始前先阅读第 2 节的包来源与用途；第三方扩展可以在本机执行代码。已有 Pi 环境的读者先备份自己的配置，并运行 `pi list` 查看已装来源，避免把本地开发版 CSL 与 npm 版重复加载。

### 0.2 安装工作流、子 Agent、搜索与 MCP

以下命令均为**当前用户全局安装**，不加 `-l`；安装器会维护 ["/Users/yourname/.pi/agent/settings.json"](file:///Users/yourname/.pi/agent/settings.json) 中的 `packages`，不需要手写整份包列表。

在普通终端中逐条执行；某条失败时先解决该错误，再继续下一条：

```bash
# Task 工作流、Skills、Rules/Hooks 和任务界面
pi install npm:@ssbun/csl-agent-kit@5.1.0

# 子 Agent 与多 Agent 工作流
pi install npm:pi-subagents@0.66.0

# 联网搜索、网页与视频内容获取
pi install npm:pi-web-access@0.28.0

# MCP 接入；不等于同时安装了所有 MCP 服务
pi install npm:pi-mcp-adapter@2.32.1
```

如果已经使用 CSL 本地开发包，保留原来源即可，不必再安装上面的 npm 替代包。其他包也可以按需求选择，不是 Pi 本身的强制依赖。

### 0.3 按需安装语言学习与 Codex 增强

```bash
# 外语写作检查、翻译与记忆卡片
pi install npm:pi-language-tutor@0.4.1

# 图片生成与编辑：需要自己的 Codex 登录和图片额度
pi install npm:pi-codex-image-gen@0.1.12

# Codex 原生压缩：只对相应 Codex 会话生效
pi install npm:@ogulcancelik/pi-codex-compaction@0.1.5
```

语言学习会额外调用模型。图片生成与原生压缩使用自己的 `openai-codex` 认证；安装包不会赠送账号、模型权限或额度。不使用这些功能时可以跳过对应插件。

### 0.4 安装图表与输出风格包

```bash
# 图表设计 Skill
pi install git:github.com/cathrynlavery/diagram-design@2724fd2efd8c6737f6fa704fbf5da52d67375497

# 可切换的行动优先输出模式
pi install git:github.com/ayghri/i-have-adhd@58494af57962b2d7a996b4d419474380a299af5e
```

Git 包按 commit 锁定。`diagram-design` 主要提供 Skill，并非必须有独立工具按钮的扩展；安装 `i-have-adhd` 也不意味着自动打开该模式。

### 0.5 首次启动、登录和插件确认

回到普通终端执行：

```bash
pi list
pi
```

如果完整执行了上述安装，包清单应包含本章的 9 个来源；已有其他插件时，总数可以更多。**`pi list` 只证明注册了来源，接下来还要检查加载。**

进入 Pi 后，下面才是 **Pi 内部命令**，逐项执行，不要复制到 Shell：

```text
/login
/model
```

用自己的账号登录，并选择实际可用的模型；不要直接套用我的默认模型 ID。检查启动时是否有扩展加载错误。若在另一个终端给正在运行的 Pi 装了包，可以在原会话运行 `/reload`；必要时退出并重新启动。

| 已安装包 | 首次操作 / 检查 |
| --- | --- |
| CSL Agent Kit | `/tasks` 可列出任务；新目录没有任务记录是正常现象。`/preset` 还需要第 4 节的预设配置，不能用“没有预设”判断安装失败 |
| pi-subagents | `/subagents-doctor` 检查运行环境；需要实际委派时再选一个只读任务，模型调用可能消耗额度 |
| pi-web-access | 安装后应出现 `web_search` / `fetch_content` 等工具；让 Pi 列出当前可用工具可检查发现，不必立刻发起联网调用 |
| pi-mcp-adapter | `/mcp setup` 添加自己的服务；未配置服务器时工具数量为空不代表适配器安装失败 |
| pi-language-tutor | `/lang` 查看设置；`/lang model default` 跟随当前模型；暂时不想额外调用时 `/lang check off`，保持自动翻译关闭 |
| pi-codex-image-gen | 应出现 `codex_generate_image` 工具；不需要为了验收而生成付费图片 |
| pi-codex-compaction | 确认无加载错误即可；没有独立配置向导，也不必强制触发一次远程压缩。生效条件见第 5 节 |
| diagram-design | 输入 `/skill:` 查看补全列表是否包含 `diagram-design`；实际出图时再调用 |
| i-have-adhd | 在需要时 `/i-have-adhd on`，用 `/i-have-adhd off` 关闭 |

### 0.6 最后再迁移本机专用插件

- **Vibe Island：** 先在目标机器准备伴随应用及它提供的 Pi 扩展包，再按应用自身的集成方式启用。本文没有可核验的公共安装命令，不猜测 npm 包名。
- **iTermate / Otty：** 使用各自应用生成的集成文件，不直接复用作者机器上的 socket 或 CLI 路径。
- **Git 状态 Footer：** 需要另行取得第 2 节所列的独立扩展源文件；它不包含在上述 9 个包中。

本地路径安装只是注册原文件位置，不会复制文件。后续移动或删除该文件会影响加载。4 个额外用户 Skills、个人 Prompts/Rules/Hooks/SOP 也需要单独提供脱敏资源；不要把 43 个失效链接一起迁过去。

### 安装遇到问题时

| 现象 | 先做什么 |
| --- | --- |
| `pi: command not found` | 确认当前终端使用刚安装 Pi 的 Node 环境，检查 npm 全局可执行目录是否进入 PATH，再重新打开终端 |
| npm 找不到固定版本 / Git 无法拉取 | 核对包名、版本/ref、registry 与网络；不要在未确认兼容性时静默换成最新版 |
| 包在列表里，但命令或工具没有出现 | `/reload` 或重启，查看加载错误；回到普通终端用 `pi config` 检查资源是否被禁用或重复加载 |
| 工具出现，但提示认证失败或没有模型 | 用 `/login`、`/model` 检查自己的权限；安装插件与开通服务是两件事 |
| MCP 无法连接 | 按第 6 节检查服务程序、启动参数和系统权限；不要用写入/删除操作验证连接 |

插件装好后，再阅读第 8 节迁移界面、预设和个性化配置。这里锁定的是本机观察值，尚未在空白机器验证所有版本可下载或整套安装成功；本章不提供一键整机克隆保证。

## 1. 环境概览

我的配置以 **Pi + CSL Agent Kit + 子 Agent + Web/MCP 工具** 为核心，另加语言学习、图片生成和终端状态集成。

| 项目 | 本机快照 |
| --- | --- |
| 系统 | macOS 26.5.1，Apple Silicon / arm64 |
| 终端 / Shell | iTerm2 / zsh |
| Node.js / npm | 22.22.2 / 10.9.7，Node 由 mise 管理 |
| Pi | `@earendil-works/pi-coding-agent` 0.85.1，npm 安装形态 |
| 默认 Provider / 模型 | `openai-codex` / `gpt-6-astra` |
| 默认思考强度 | `xhigh` |
| 界面 | `dark`，`regular` TUI，隐藏思考块，显示硬件光标 |
| 包配置 | 10 项：6 个 npm 包、2 个 Git 仓库、2 个本地包 |
| 独立本地扩展 | 3 个 TypeScript 文件 |

这里的模型名是**本机配置值和会话所选 ID**，不代表每个账号都有权限，也不证明服务端实际路由。其他人应在 `/login` 后，用 `/model` 选择自己的可用模型。

本机还发现 Git、mise、RTK、Python 3、ffmpeg、yt-dlp、uv/uvx、Xcode 命令行工具，以及 Codex、Claude、Cursor Agent CLI。这里只核对了可执行文件存在；不是所有功能的必需依赖，也没有逐一验证登录和运行状态。

## 2. 已配置的 Pi 包

“已配置”表示存在于包列表且安装目录存在；不能据此断言每项功能都已执行成功。

| 包 / 来源 | 本机版本或 revision | 用途 | 复用注意 |
| --- | --- | --- | --- |
| [CSL Agent Kit](https://github.com/SSBun/csl-agent-kit) | `@ssbun/csl-agent-kit` 5.1.0；本地 HEAD `1ac923f76c03fe9db6a42dd8ed3150a0c7222ef2` | Task 工作流、Skills、Rules、Hooks、SOP、模型预设、任务 UI | 当前直接加载本地开发仓库；npm 版本是分享用替代，不含个人规则与本地资源 |
| [pi-language-tutor](https://github.com/mackt/pi-language-tutor) | 0.4.1 | 英文写作检查、中文输入辅导、双语翻译、记忆卡片 | 使用独立的 DeepSeek 模型；会产生额外模型调用 |
| [pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) | 2.32.1 | MCP 配置发现、工具代理、按需连接 | MCP 服务本身需另装、另配 |
| [pi-web-access](https://github.com/nicobailon/pi-web-access) | 0.28.0 | 搜索、网页/PDF/GitHub 内容获取、视频理解 | 搜索和视频能力取决于 Provider、网络及可选工具 |
| [pi-subagents](https://github.com/nicobailon/pi-subagents) | 0.66.0 | 独立子 Agent、并行/顺序工作流、后台任务与状态面板 | 后台原生子 Agent 需要 npm 形态的 Pi，不能只装单文件可执行版 |
| [pi-codex-image-gen](https://github.com/jvm/pi-mono/tree/main/packages/pi-codex-image-gen) | 0.1.12 | 通过 Codex 登录生成/编辑位图，后端使用 `gpt-image-2` | 需要自己的 `openai-codex` 登录和图片额度 |
| [@ogulcancelik/pi-codex-compaction](https://github.com/ogulcancelik/pi-extensions/tree/main/packages/pi-codex-compaction) | 0.1.5 | Codex 原生远程上下文压缩 | checkpoint 有模型绑定，不是跨模型通用摘要 |
| Vibe Island 本地包 | `vibe-island-pi-extension` 1.0.0 | 桌面伴随应用集成 | 本地包存在；未验证伴随应用运行状态，没有推断公共安装来源 |
| [diagram-design](https://github.com/cathrynlavery/diagram-design) | `2724fd2efd8c6737f6fa704fbf5da52d67375497` | 架构、流程、数据及展示型图表 Skill | Git 安装；该检出未发现 package manifest，按约定目录发现 Skill |
| [i-have-adhd](https://github.com/ayghri/i-have-adhd) | 0.2.0；`58494af57962b2d7a996b4d419474380a299af5e` | 可切换的行动优先、短步骤输出模式 | 没有全局 always-on 配置；会话状态或启动参数仍可开启 |

本机 npm/Git 注册没有锁定版本。上表记录的是实际安装版本，而非 registry 最新版。`i-have-adhd` 检出有一个未跟踪的依赖锁文件；Git revision 不包括该文件。CSL 源仓库同时存在其他任务的本地改动，HEAD 也不代表整机环境。

### CSL Agent Kit 提供的 5 个 Pi 扩展

| 扩展标识 | 功能 |
| --- | --- |
| `csl-context-hooks` | 向 Pi 接入 Agent Hooks、Rules、Task Contract 和 SOP 上下文；终端标题刷新 |
| `csl-model-presets` | `/preset` 切换模型及 thinking；`/quick` 临时执行后恢复原模型 |
| `csl-skill-commands` | 给共享 Skills 提供 `/task`、`/repo-map` 等短命令 |
| `csl-task-overlay` | 任务进度 UI、`/tasks`、`/task-focus`、`task_focus` 工具 |
| `openai-codex-fast` | `/fast` 和持久化 Fast Mode 设置 |

### 不在包清单中的 3 个本地扩展

全局自动发现目录： ["/Users/yourname/.pi/agent/extensions/"](file:///Users/yourname/.pi/agent/extensions/)。

| 文件 | 已核实行为 | 移植方式 |
| --- | --- | --- |
| ["/Users/yourname/.pi/agent/extensions/git-status-footer.ts"](file:///Users/yourname/.pi/agent/extensions/git-status-footer.ts) | 显示 staged / modified / untracked 数量；约每 3 秒及工具结束后刷新 | 独立本地代码，不随上述 npm 包安装；需另行提供文件 |
| ["/Users/yourname/.pi/agent/extensions/iTermate-integration.ts"](file:///Users/yourname/.pi/agent/extensions/iTermate-integration.ts) | 经本机 socket 上报 idle / running / finished / detached，含运行心跳 | 需要对应 iTermate 应用与通信接口 |
| ["/Users/yourname/.pi/agent/extensions/otty-integration.ts"](file:///Users/yourname/.pi/agent/extensions/otty-integration.ts) | 调用 Otty CLI 上报 Agent 状态 | 原文件含安装时写入的绝对路径；应由接收者的 Otty 安装流程生成 |

Vibe Island 包位于 ["/Users/yourname/.vibe-island/pi-extension/"](file:///Users/yourname/.vibe-island/pi-extension/)。仅复制包清单不会安装这些桌面应用或本地代码；不使用相应应用时可以不装这些集成。

## 3. 全局 Pi 配置

位置： ["/Users/yourname/.pi/agent/settings.json"](file:///Users/yourname/.pi/agent/settings.json)。当前 workspace 没有项目级 Pi 配置覆盖。

以下是本机的非包配置原值：

```json
{
  "defaultModel": "gpt-6-astra",
  "defaultProjectTrust": "always",
  "defaultProvider": "openai-codex",
  "defaultThinkingLevel": "xhigh",
  "doubleEscapeAction": "tree",
  "editorPaddingX": 1,
  "fullscreenScrollbar": "auto",
  "hideThinkingBlock": true,
  "lastChangelogVersion": "0.85.1",
  "showHardwareCursor": true,
  "theme": "dark",
  "tuiMode": "regular"
}
```

- `hideThinkingBlock` 只影响显示，不是关闭模型推理。
- `showHardwareCursor` 有助于中文输入法候选框定位。
- `fullscreenScrollbar` 在当前 `regular` 模式下不起作用。
- `lastChangelogVersion` 是已读更新日志状态，移植时不必复制。
- **`defaultProjectTrust: "always"` 会跳过通常的项目信任询问，允许加载项目设置及可执行扩展。分享用配置建议改为 `"ask"`，不要默认信任陌生仓库。**

本机没有自定义快捷键文件，也没有自定义主题目录；以 Pi 默认快捷键和 `dark` 为基础。项目配置对象会覆盖/合并全局设置；数组（如包列表）应按官方规则处理，不要盲目覆盖既有配置。

## 4. 模型、预设和 Fast Mode

### 模型预设

位置： ["/Users/yourname/.pi/agent/presets.json"](file:///Users/yourname/.pi/agent/presets.json)。

```json
{
  "quick": {
    "provider": "deepseek",
    "model": "deepseek-v4-flash-vision-exp",
    "thinkingLevel": "off"
  },
  "flash-max": {
    "provider": "deepseek",
    "model": "deepseek-v4-flash",
    "thinkingLevel": "max"
  },
  "sol-xhigh": {
    "provider": "openai-codex",
    "model": "gpt-5.6-sol",
    "thinkingLevel": "xhigh"
  },
  "glm5.2": {
    "provider": "glm",
    "model": "glm-5.2",
    "thinkingLevel": "off"
  }
}
```

使用 `/preset list`、`/preset flash-max` 或 `/quick 帮我解释这段代码`。这些配置只定义选择，不提供模型权限；Provider、模型和 thinking 级别需同时可用。

### 自定义模型配置快照

位置： ["/Users/yourname/.pi/agent/models.json"](file:///Users/yourname/.pi/agent/models.json)。私人 endpoint 和 key 不分享，下表保留与行为相关的声明：

| Provider | 声明 |
| --- | --- |
| `glm` | `anthropic-messages`；4 个模型：`glm-4.6`、`glm-4.7`、`glm-5.1`、`glm-5.2`；均为文本输入、`reasoning: false`、`contextWindow: 1000000`、`maxTokens: 8192` |
| `zai-coding-cn` | `openai-completions`；`glm-5.3-flash`；文本和图像、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 131072`；thinking 仅声明 `low`、`high`、`max` |
| `openai-codex` | 将 `gpt-5.6-sol` 的 `contextWindow` 覆盖为 `872000`；没有在此为当前默认 `gpt-6-astra` 添加覆盖 |

`glm` 与 `zai-coding-cn` 自定义模型的 input/output/cacheRead/cacheWrite 费用字段均填为 0：**这只是本地费用估算配置，不能理解成服务免费。** 上述上下文长度也是本地声明，未做服务端极限验证。

`zai-coding-cn` 的兼容性配置为：

```json
{
  "supportsStore": false,
  "supportsDeveloperRole": false,
  "supportsReasoningEffort": true,
  "maxTokensField": "max_tokens",
  "thinkingFormat": "zai",
  "zaiToolStream": true
}
```

`zaiToolStream` 是本机保留字段，本文未证明它被当前 Pi 版本消费。新用户应以自己的 endpoint 与 Provider 文档为准。

若需要自己的 `glm` Provider，可按下列**配置结构示例**添加；它不是完整本机导出，域名必须替换、密钥必须自行设置。可以按上表添加其余模型。

```json
{
  "providers": {
    "glm": {
      "baseUrl": "https://your-gateway.example.com",
      "api": "anthropic-messages",
      "apiKey": "$GLM_API_KEY",
      "models": [
        {
          "id": "glm-5.2",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 1000000,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

在当前 Pi 版本中，环境变量引用使用 `$GLM_API_KEY`，不是裸字符串 `GLM_API_KEY`。不要将真实 key 写进分享文档或 Git。

### Fast Mode：开关开启，不等于当前模型生效

位置： ["/Users/yourname/.pi/agent/csl/openai-codex-fast.json"](file:///Users/yourname/.pi/agent/csl/openai-codex-fast.json)，本机内容为：

```json
{ "enabled": true }
```

**当前 CSL 实现只对匹配 GPT-5.4 / GPT-5.5 家族的 `openai-codex` 模型注入 `service_tier: "priority"`。因此当前默认 `gpt-6-astra` 不满足这段实现的资格判断。** Footer 出现 `fast` 也不能证明请求实际使用 priority。

用 `/fast status` 查看资格；支持的模型仍需账号权益，可能有额度或费用影响。新用户可先 `/fast off`，确认后再开。

## 5. 插件独立配置

### 语言学习

位置： ["/Users/yourname/.pi/agent/language-learn.json"](file:///Users/yourname/.pi/agent/language-learn.json)。

```json
{
  "learning": "en",
  "native": "zh-CN",
  "model": "deepseek/deepseek-v4-flash",
  "check": "on",
  "auto": false,
  "context": false,
  "tutor": true
}
```

英语输入开启检查，中文输入开启 tutor；关闭自动翻译和翻译上下文。`/translate` 或 Option+T 手动翻译，`/flashcards` 复习。没有 DeepSeek 账号时，使用 `/lang model default` 跟随已登录的会话模型。

记忆卡片设置： ["/Users/yourname/.pi/agent/flashcards-settings.json"](file:///Users/yourname/.pi/agent/flashcards-settings.json)。

```json
{
  "newPerDay": 20,
  "sessionLimit": 20,
  "requestRetention": 0.9,
  "theme": "dark"
}
```

只分享设置，不分享包含个人学习记录的 ["/Users/yourname/.pi/agent/flashcards.json"](file:///Users/yourname/.pi/agent/flashcards.json)。

### Web 搜索与抓取

位置： ["/Users/yourname/.pi/web-search.json"](file:///Users/yourname/.pi/web-search.json)。注意不在 Pi agent 子目录中。

本机唯一显式配置：

```json
{
  "ssrf": {
    "allowRanges": ["198.18.0.0/15"]
  }
}
```

这是为 fake-IP 网络代理保留地址段放行的 SSRF 例外，不是代理地址配置。**只有你的网络确实使用这一段 fake-IP 时才迁移；普通网络省略，保留默认防护。**

没有显式固定搜索 Provider、workflow、代理或 API key。当前工具契约会在无显式 Provider 时自动选择：可用的本地 SearXNG 优先，当前为 Codex 模型时再优先尝试 Codex-backed OpenAI 搜索，随后按可用配置选择其他服务。这不是固定使用某一个搜索引擎的保证。

主要工具：`web_search`、`source_check`、`fetch_content`、`get_search_content`。`/curator` 控制搜索结果整理界面。视频帧提取可能需要 yt-dlp 和 ffmpeg；是否能理解视频还取决于对应模型能力。未启用浏览器 Cookie 读取，不应为了复用而导出浏览器数据。

### Codex 原生压缩

本机存在旧配置： ["/Users/yourname/.pi/agent/pi-codex-compaction.json"](file:///Users/yourname/.pi/agent/pi-codex-compaction.json)。

```json
{
  "autoCompact": true,
  "thresholdRatio": 0.9,
  "notify": true
}
```

**不要据此声称当前一定在 90% 时压缩。** 已安装插件说明明确：Pi 0.84.4 及以上由 Pi 原生生命周期控制触发时机，旧 90% guard 仅用于旧版兼容。当前 Pi 0.85.1 的全局配置没有覆盖 `compaction`，应按该版 Pi 默认设置理解：enabled 为 true、reserveTokens 为 16384、keepRecentTokens 为 20000。

原生 checkpoint 会发往 Codex endpoint 并保存在本地会话中；切换模型可能无法继续消费该 checkpoint，不应当作通用文本摘要迁移。

### 图片生成与 ADHD 输出模式

- 图片生成没有独立用户配置；插件默认路由模型为 `gpt-5.5`，实际图片模型为 `gpt-image-2`，默认保存到全局生成图片目录。必须自行 `/login`，不会因为安装插件而免费或无限调用。
- `i-have-adhd` 未发现 always-on 文件或独立配置；用 `/i-have-adhd on` / `/i-have-adhd off` 控制当前会话。本文未读取历史会话来判断某个会话的开关。

### 子 Agent

未发现独立用户配置 ["/Users/yourname/.pi/agent/extensions/subagent/config.json"](file:///Users/yourname/.pi/agent/extensions/subagent/config.json)，也没有当前项目配置覆盖。

本次运行时能力列表确认可执行的原生角色：`scout`、`researcher`、`worker`、`reviewer`、`oracle`、`delegate`，以及用户 `pi-agent`。另有 Codex / Claude Code / Cursor Agent 的只读与 writer 外部 CLI 角色；PATH 检测到 runner 不等于已登录或成功启动。

用户 Agent 目录 ["/Users/yourname/.pi/agent/agents/"](file:///Users/yourname/.pi/agent/agents/) 还存在 `Designer`、`Explore` 文件，但本次可执行角色列表没有列出二者，**不将“文件存在”视为“角色可调用”**。`pi-agent` 是指向 CSL 仓库角色文件的有效链接；安装 Pi 包本身不保证创建这个额外链接。

用 `/subagents-doctor` 检查环境，`/subagents-fleet` 查看运行状态。安装扩展不会自动替你安排所有任务；CSL 的 Task 工作流另有自己的独立审查要求。

## 6. MCP 服务清单

本机共享配置来自 ["/Users/yourname/.config/mcp/mcp.json"](file:///Users/yourname/.config/mcp/mcp.json)，当前未发现 Pi 专属或 workspace MCP 覆盖。

| 服务 | 启动形式 | 本机声明及复用边界 |
| --- | --- | --- |
| `tolaria` | Node 启动本地脚本 | 环境变量 `VAULT_PATH`、`WS_UI_PORT`；脚本、知识库及本地服务需单独准备，私人值不导出 |
| `xcodebuildmcp` | `npx -y xcodebuildmcp@latest mcp` | 依赖 macOS/Xcode；`latest` 未锁版本，本文没有推断实际缓存版本 |
| `apple-notes` | `npx -y apple-notes-mcp@2.7.0` | lazy；请求超时 60000ms；写入/删除/移动类工具有审批列表；需要本机 Apple Notes 授权 |
| `kicad` | `kicad-mcp-pro --transport stdio` | lazy；请求超时 120000ms；24 个工具白名单；需要 KiCad、对应 CLI 与自己的项目路径 |

Apple Notes 的 `approveTools` 原值：

```json
[
  "create-note", "update-note", "append-to-note", "delete-note", "move-note",
  "create-folder", "delete-folder", "batch-delete-notes", "batch-move-notes",
  "save-attachment"
]
```

KiCad 的环境变量名称为 `KICAD_MCP_PROJECT_DIR`、`KICAD_MCP_PROFILE`、`KICAD_MCP_OPERATING_MODE`、`KICAD_MCP_KICAD_CLI`、`KICAD_MCP_LOG_LEVEL`。路径和运行参数需在目标机器重设，本文未导出其值。

KiCad 的 `includeTools` 原值：

```json
[
  "kicad_get_server_info", "kicad_get_version", "kicad_get_project_info",
  "kicad_set_project", "kicad_create_new_project", "sch_build_circuit",
  "sch_get_symbols", "sch_get_wires", "sch_get_connectivity_graph", "run_erc",
  "lib_assign_footprint", "pcb_sync_from_schematic", "pcb_get_board_summary",
  "pcb_get_footprints", "pcb_get_nets", "pcb_get_pads", "pcb_set_board_outline",
  "pcb_auto_place_by_schematic", "pcb_move_footprint", "pcb_route_trace",
  "pcb_add_track", "pcb_save", "run_drc", "pcb_visual_qa"
]
```

MCP 配置有分层合并：共享全局 → 兼容全局 → Pi 全局 → 项目共享 → Pi 项目覆盖。新用户优先使用 `/mcp setup` 选择共享配置落点，再添加自己需要的服务。可先只配置 Xcode 或 Apple Notes，不要复制不存在的本地服务路径。

这里只核对配置和本会话工具表，没有逐个连接服务、操作笔记或修改 KiCad 项目；工具表/缓存存在不证明服务健康。

## 7. Skills、Prompt、规则与 Hooks

### Skills 来源

| 来源 | 当前资源 |
| --- | --- |
| CSL Agent Kit | 28 个共享 Skills，随包安装 |
| 通用用户 Skill 目录 | `avoid-ai-writing`、`save-to-mywiki`、`stylekit`、`tech-blog-style` 共 4 个 |
| Pi 包携带的 Skills | diagram-design、i-have-adhd，以及 MCP / subagents / imagegen 包内资源；是否自动展示还受其 frontmatter 控制 |
| 当前 CSL workspace 专用 | `integrate-third-skills`、`task-target-alignment-eval`；不属于全局共享安装结果 |

CSL 28 个共享 Skills：

- 开发：`adversarial-review`、`align`、`beautiful-mermaid`、`brainstorming`、`bug-fix`、`deliberate`、`eli5`、`git-conflict`、`project-index`、`repo-map`、`tldr`。
- 领域：`create-app-icon`、`figma-describe`、`venom-cli`、`yunxiao`。
- 元工作流：`agent-hooks`、`agent-rules`、`agent-sops`、`archive`、`skill-quality`、`task`、`task-context`、`task-grill`、`task-lessons`、`task-maintenance`、`task-plan`、`task-queue`、`task-review`。

4 个额外用户 Skills 位于 ["/Users/yourname/.agents/skills/"](file:///Users/yourname/.agents/skills/)，不随上述 Pi 包安装：

- `avoid-ai-writing`：文件声明版本 3.26.0，[上游](https://github.com/conorbronsdon/avoid-ai-writing)。
- `stylekit`：[项目主页](https://www.stylekit.top)，本地文件未声明版本。
- `save-to-mywiki`、`tech-blog-style`：本地自定义，均声明 1.0.0；如需完全复用，须另行分享脱敏后的完整 Skill 目录，而不是只复制链接。

### 失效链接：不是可用技能

["/Users/yourname/.pi/agent/skills/"](file:///Users/yourname/.pi/agent/skills/) 中有 **43 个符号链接，全部目标不存在**。不能把这 43 个名字算进可用能力；此次仅记录，不删除或重装。

<details>
<summary>43 个失效链接名称（历史残留清单）</summary>

`ask-matt`、`claude-handoff`、`code-review`、`codebase-design`、`design-an-interface`、`diagnosing-bugs`、`domain-modeling`、`edit-article`、`find-skills`、`git-guardrails-claude-code`、`grill-me`、`grill-with-docs`、`grilling`、`handoff`、`implement`、`improve-codebase-architecture`、`loop-me`、`macos-design`、`migrate-to-shoehorn`、`obsidian-vault`、`prototype`、`qa`、`request-refactor-plan`、`research`、`resolving-merge-conflicts`、`scaffold-exercises`、`setup-matt-pocock-skills`、`setup-pre-commit`、`setup-ts-deep-modules`、`swiftui-pro`、`tdd`、`teach`、`to-prd`、`to-spec`、`to-tickets`、`triage`、`ubiquitous-language`、`wayfinder`、`wizard`、`writing-beats`、`writing-fragments`、`writing-great-skills`、`writing-shape`。

</details>

### Prompt 模板

用户目录： ["/Users/yourname/.pi/agent/prompts/"](file:///Users/yourname/.pi/agent/prompts/)。

| 命令 | 来源 / 用途 |
| --- | --- |
| `/commit` | 本地模板；只提交当前任务相关改动 |
| `/commit-all` | 本地模板；按关注点拆分提交全部改动 |
| `/csl-works` | 本地模板；登记到个人项目账本，包含私人仓库路径，不可原样迁移 |
| `/implement`、`/implement-and-review`、`/scout-and-plan` | 指向当前 Pi npm 包示例的有效链接；Node 安装目录变化后可能失效 |
| `/council`、`/gather-context-and-clarify`、`/parallel-cleanup`、`/parallel-research`、`/parallel-review`、`/review-loop` | pi-subagents 包内模板 |
| `/yx-approve-all` | CSL 包内模板；面向特定工作系统，不是通用 GitHub 审批命令 |

模板是展开的提示词，不是独立可执行插件。尤其 Pi 示例模板与第三方 subagents 的角色和工具接口未做联合验证，不应承诺复制后直接可用。带提交、审批语义的模板不要在不理解范围时调用。

### 规则与 SOP

需要区分 Pi 自身上下文文件和 CSL 注入规则，不能统称为一份全局 AGENTS。

1. 当前会话加载了用户主目录和当前仓库的 AGENTS 规则，包括中文回答、最小修改与证据验证等要求。
2. ["/Users/yourname/.pi/agent/AGENTS.md"](file:///Users/yourname/.pi/agent/AGENTS.md) 和 ["/Users/yourname/.agents/AGENTS.md"](file:///Users/yourname/.agents/AGENTS.md) 均是失效链接；它们当前不能提供有效文件内容。Pi 本身会读取父目录上下文，不能由这两个链接推断所有规则都失效。
3. CSL 独立合并内置、用户和项目 Agent Rules。用户数据根是 ["/Users/yourname/.csl-agent-kit/"](file:///Users/yourname/.csl-agent-kit/)，并非 Pi 包源码目录。

当前会话还注入了个人规则：本地路径使用绝对链接、Mermaid 需要图片呈现、未明确要求时不运行测试、个人项目账本的固定位置等。新用户不必复制这些个人约束。

用户 SOP 位于 ["/Users/yourname/.csl-agent-kit/sops/"](file:///Users/yourname/.csl-agent-kit/sops/)，覆盖 Apple Notes、MyWiki、GitHub 发布、TypeScript CLI、macOS 签名/打包等；还有 CSL 内置 SOP。它们不是 Pi 原生插件，个人 SOP 不随 npm 包分发，涉及私有系统的内容需要单独脱敏。

### Hooks 配置

位置： ["/Users/yourname/.csl-agent-kit/hooks/config.json"](file:///Users/yourname/.csl-agent-kit/hooks/config.json)。

```json
{
  "schema": "agent-hooks.config/v1",
  "disabledHooks": [],
  "hookSettings": {
    "inner:refresh-tab-title": {
      "model": "deepseek/deepseek-v4-flash"
    }
  }
}
```

`disabledHooks` 为空，即没有在用户配置中禁用内置 Hook。标题生成同样依赖自己的 DeepSeek 认证。

另有两个已启用的用户 `after-tool` 脚本 Hook：`format-swift`（编辑后格式化 Swift）、`notify-todo-changed`（任务文件变更通知）。它们需要对应本地脚本与工具，不能只复制规则文件。本文未执行其脚本来验证行为。

还发现旧 `pi-goal-list-loop-audit` 设置 `autoResume: false` 及其生成的 Agent 文件，但当前包清单没有这个插件；按历史残留记录，不推断正在运行。

## 8. 其他人如何复用

### 第一步：先完成插件引导安装

按文首第 0 节安装 Pi 和所需插件，再回到这里迁移配置。安装命令只维护一份，避免两处的版本和步骤发生分歧。仅安装这些可分发包不包含第 0.6 节的本机专用资源，不能称为整机完全克隆。

### 第二步：登录、选择模型并迁移界面设置

启动 `pi`，执行 `/login` 登录自己的 Provider，再 `/model` 选择可用模型；在模型选择器按 Ctrl+S 保存启动默认值。`/thinking` 同样可以保存默认强度。

建议先合并下面的安全起步设置到 ["/Users/yourname/.pi/agent/settings.json"](file:///Users/yourname/.pi/agent/settings.json)，**保留安装器写入的 `packages` 和你已有的其他配置，不要整文件覆盖**：

```json
{
  "defaultProjectTrust": "ask",
  "doubleEscapeAction": "tree",
  "editorPaddingX": 1,
  "hideThinkingBlock": true,
  "showHardwareCursor": true,
  "theme": "dark",
  "tuiMode": "regular"
}
```

这是明确区别于本机原值的**分享建议**：不固定可能无权访问的模型，不默认启用全信任，也不默默迁移 Fast Mode、SSRF 放行或私人 endpoint。

### 第三步：按需加回个性化能力

1. **模型和语言：** 有相应账号后再配置预设、语言学习与标题模型；没有 DeepSeek 时先 `/lang model default`。
2. **MCP：** `/mcp setup`，选择共享全局或项目配置，添加自己的服务器与必要权限。没有 Xcode、KiCad 或 Apple Notes 的系统不要照抄对应服务。
3. **个人资源：** 需要本地扩展、Prompt、Skill、Rules、Hooks、SOP 时，另行索取完整脱敏资源；用接收者本机路径重建链接，勿复制失效链接或作者的绝对路径。
4. **终端：** iTerm2 regular 模式通常无需额外设置；语言插件的 Option+T 需要终端能传递 Meta，无法使用时直接 `/translate`。
5. **可选性能设置：** 用 `/fast status` 检查实际资格；只在确认额度/费用后开启。确有 fake-IP 网络需要时再配置最小 SSRF 例外。

### 第四步：验证是否装好

终端执行管理命令：

```bash
node --version
npm --version
pi --version
pi list
```

在 Pi 内检查 `/settings`、`/preset list`、`/fast status`、`/subagents-doctor`；用 `/reload` 重载资源，检查启动警告、命令发现和失效链接。

随后自行选择一个低风险、非隐私内容，分别验证搜索、一个只读 MCP 查询、一个只读子 Agent。图片生成、语言学习和 Provider 调用可能消耗额度，不必作为安装验收的必做项；不要用写入笔记、删除文件等高副作用动作来验证连接。

安装/更新后如果资源冲突，用 `pi config` 管理启用项。`pi update` 在当前版本只更新 Pi；`pi update --extensions` 更新包，`pi update --all` 更新两者。**锁定版本的包不会自动跟随最新版**；升级固定版本需显式安装新的版本/ref。

## 9. 分享边界与核验说明

**不要打包整个 Pi 用户目录。** 不分享登录文件、模型认证存储、会话、信任记录、缓存、生成图片、学习记录、浏览器数据、私人知识库或服务环境变量值。分享配置模板，接收者重新登录、重新授权。

本次已核对：核心版本、10 个包及其 manifest/revision、显式配置、3 个本地扩展、Skill 和 Prompt 目录、链接有效性、MCP 声明、可执行 Agent 列表，以及 Fast Mode/压缩的关键生效边界。

未执行：单元测试或项目测试套件、全新机器安装、付费能力调用、全部 MCP 服务连接、桌面伴随应用联调、失效资源修复、发布或上传。本文是**可复核的脱敏环境快照与迁移指南**，不是凭据备份或一键完整恢复包。

### 参考来源

配置语义按本机 Pi 0.85.1 附带文档核对；下面公开链接便于读者继续查询，但远端内容可能已更新：

- [Pi 官方文档入口](https://pi.dev/)
- [Pi settings](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md)、[packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md)、[models](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)
- [CSL Agent Kit](https://github.com/SSBun/csl-agent-kit)
- [pi-subagents](https://github.com/nicobailon/pi-subagents)、[pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter)、[pi-web-access](https://github.com/nicobailon/pi-web-access)
- [pi-language-tutor](https://github.com/mackt/pi-language-tutor)、[pi-codex-image-gen](https://github.com/jvm/pi-mono/tree/main/packages/pi-codex-image-gen)、[pi-codex-compaction](https://github.com/ogulcancelik/pi-extensions/tree/main/packages/pi-codex-compaction)
