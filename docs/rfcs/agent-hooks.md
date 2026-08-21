# RFC: Agent Hooks 事件驱动自动化机制

- 状态：Accepted
- 日期：2026-07-22
- 优先宿主：Codex、Claude Code、Pi
- V1 不支持：Cursor、Windows
- 对抗讨论结论：SUFFICIENT

## 1. 摘要

Agent Hooks 是 CSL Agent Kit 的事件驱动自动化机制。用户通过 Markdown Trigger，在指定 Agent 生命周期事件中执行且仅执行一个动作：

- 向下一次相关模型请求注入一次性 Prompt。
- 运行一个受约束的本地可执行脚本。
- 当宿主、事件和动作组合支持阻止时，根据脚本结果拒绝当前操作。

Agent Hooks 将宿主原生事件转换为统一事件 payload，以结构化条件 AST 判断规则是否匹配，再由宿主适配器把动作结果映射回原生协议。

```text
宿主原生事件
    -> 宿主适配器
    -> Agent Hooks 标准事件 payload
    -> scope 与 trust gate
    -> 规则校验和三值条件求值
    -> inject-prompt 或 run-script
    -> 标准结果
    -> 宿主原生响应
```

十个标准事件只是 Agent Hooks 的词汇表，不代表所有宿主都支持每个事件、动作、字段或阻止能力。支持性必须由 `host x event x action` capability matrix 决定。

## 2. 背景与动机

静态规则文件可以提前向 Agent 提供长期指令，但无法按生命周期事件执行条件化动作。原生 Hook 可以确定性地执行脚本或注入上下文，但各宿主的事件名称、payload 和结果协议不同，用户还需要手写复杂配置。

Agent Hooks 解决以下问题：

1. 用统一 Markdown 文件描述触发时机、条件和动作。
2. 让 Skill 根据自然语言创建和维护 Trigger。
3. 让 Codex、Claude Code 和 Pi 复用同一规则与条件语义。
4. 在宿主不支持某种能力时明确报告，而不是静默失效。
5. 为自锁和错误规则提供不经过 Agent Hook 的恢复入口。

Agent Hooks 与其他机制的职责边界：

| 机制 | 职责 |
|---|---|
| Agent Hooks | 注入跨会话持久指令，或在 Agent 生命周期事件中执行自动化动作 |
| Git hooks / CI | 提供仓库级最终约束 |
| 宿主权限和 sandbox | 决定工具或命令是否获准执行 |

## 3. 规范性语言

本文中的“必须”“禁止”“应该”“可以”分别对应 RFC 2119 的 MUST、MUST NOT、SHOULD、MAY。

## 4. 目标

- 使用 `Agent Hooks` 作为 Skill 和机制名称。
- Codex 为第一优先宿主，Claude Code 为第二优先，Pi 为第三优先。
- 使用统一事件名称和统一 payload 隔离宿主差异。
- 支持用户全局规则和项目级规则。
- 项目规则只在适配器能够证明 workspace trusted 时加载。
- 支持 `inject-prompt` 和 `run-script` 两种动作。
- 每个 Hook Markdown 文件只定义一个事件、一个条件树和一个动作。
- 使用可版本化、可静态校验、无副作用的条件 AST。
- 提供创建、列出、查看、更新、启停和删除能力。
- 规则修改后在下一次事件中生效，无需重启宿主。
- 无效、不可信、不支持和运行错误必须具有可解释诊断。

## 5. 非目标

- 不实现 cron、定时器、文件 watcher 或后台 daemon。
- 不实现多动作 DAG、动作依赖或通用工作流编排。
- 不替代 Git `pre-commit`、CI、安全 sandbox 或权限系统。
- 不保证拦截外部终端、IDE Git 面板或其他进程的操作。
- 不把条件 DSL 扩展成 CEL、Rego、JsonLogic 或通用脚本语言。
- 条件求值不读取文件、网络、环境变量，也不执行命令。
- V1 不重写工具参数，不自动批准权限，不提供远程规则市场。
- V1 不支持 Cursor 或 Windows。
- V1 不自动删除关联脚本。
- V1 不保证与 Agent Hooks 之外的原生 Hook 具有确定执行顺序。

## 6. 标准事件

V1 定义以下十个 kebab-case 事件：

```text
session-start
prompt-submit
before-tool
permission-request
after-tool
before-compact
after-compact
subagent-start
subagent-stop
stop
```

### 6.1 候选宿主映射

下表描述映射候选，不等于能力保证。每个适配器发布前必须用当前官方协议和 golden payload 固定实际 capability matrix。

| Agent Hooks | Codex | Claude Code | Pi | 初始映射质量 |
|---|---|---|---|---|
| `session-start` | `SessionStart` | `SessionStart` | `session_start` | exact / exact / exact |
| `prompt-submit` | `UserPromptSubmit` | `UserPromptSubmit` | `input` 或 `before_agent_start` 组合 | exact / exact / partial |
| `before-tool` | `PreToolUse` | `PreToolUse` | `tool_call` | exact / exact / exact |
| `permission-request` | `PermissionRequest` | `PermissionRequest` | 无 | exact / exact / unsupported |
| `after-tool` | `PostToolUse` | `PostToolUse` | `tool_result` | exact / exact / exact |
| `before-compact` | `PreCompact` | `PreCompact` | `session_before_compact` | exact / exact / exact |
| `after-compact` | `PostCompact` | `PostCompact` | `session_compact` | exact / exact / exact |
| `subagent-start` | `SubagentStart` | `SubagentStart` | 无精确对应 | exact / exact / unsupported |
| `subagent-stop` | `SubagentStop` | `SubagentStop` | 无精确对应 | exact / exact / unsupported |
| `stop` | `Stop` | `Stop` | `agent_settled` | exact / exact / approximate |

`prompt-submit` 表示用户消息已经提交、但尚未进入本轮 Agent 模型请求的时刻。不会启动 Agent 的宿主命令不产生该标准事件。

### 6.2 Capability matrix

每个 `host x event` 至少公开：

| 字段 | 含义 |
|---|---|
| `observed` | 能否可靠观测事件 |
| `can_inject_prompt` | 能否满足 Agent Hooks 的一次性注入语义 |
| `can_run_script` | 能否在该时机运行脚本 |
| `can_block` | 脚本返回 `2` 时能否阻止当前原生操作 |
| `provides_changed_files` | 能否可靠提供文件变化 |
| `can_prove_workspace_trust` | 能否证明项目 workspace 已受信 |
| `mapping_quality` | `exact`、`partial`、`approximate`、`unsupported` |

未知 capability 必须按 unsupported 处理。事件名相同不能作为能力相同的证据。

## 7. 目录与文件生命周期

### 7.1 全局规则

```text
~/.csl-agent-kit/hooks/
├── load-global-context.md
├── check-before-commit.md
├── config.json
└── scripts/
    └── check-before-commit.sh
```

### 7.2 项目规则

```text
<workspace>/.agents/hooks/
├── format-and-lint-swift.local.md
├── check-before-commit.md
└── scripts/
    ├── format-and-lint-swift.local.sh
    └── check-before-commit.sh
```

### 7.3 命名规则

| 类型 | Hook | Script |
|---|---|---|
| 用户全局 | `<name>.md` | `<name>.<ext>` |
| 项目私有 | `<name>.local.md` | `<name>.local.<ext>` |
| 项目共享 | `<name>.md` | `<name>.<ext>` |

- `<name>` 必须匹配 `[a-z0-9][a-z0-9-]*`。
- 文件名描述行为，不编码事件、动作或优先级。
- 项目 `create` 默认生成 `.local.*`。
- 只有用户明确要求 shared 时才生成可提交文件。
- 创建项目私有文件时，管理层必须幂等维护 `.gitignore` 中的 Agent Hooks local patterns，不改写无关条目。
- Prompt 直接使用 Hook Markdown 正文，V1 不创建 `prompts/` 目录。
- 单脚本保持扁平；真正需要多个文件时可以使用 `scripts/<name>/` 子目录。

共享 Hook 禁止引用 `.local` 脚本。Local Hook 可以引用 shared 或 local 脚本。

### 7.4 Qualified ID

```text
global:<name>
project:<name>
```

逻辑名由 Hook 文件名去掉 `.md`，再去掉末尾唯一的 `.local` 得到：

```text
check-before-commit.md       -> global:check-before-commit
check-before-commit.local.md -> project:check-before-commit
```

同一 scope 同时存在 `<name>.md` 与 `<name>.local.md` 时，两条规则都 invalid，不选择赢家。跨 scope 同名不冲突，两条规则都可以执行。

脚本不产生逻辑 ID，也不通过同名自动绑定，只由 Hook 的 `script` 字段显式引用。

## 8. Workspace trust

全局规则位于用户目录，默认可信。

项目规则只有在宿主适配器能明确证明当前 canonical workspace trusted 时才能进入运行时加载流程。无法取得 verdict、verdict 为 unknown，或无法证明 verdict 对应当前 canonical workspace 时：

```text
project scope = unsupported
```

事件运行时在此状态下禁止：

- 读取项目 Hook 正文。
- 解析项目 Prompt。
- 解析或执行项目脚本。
- 将项目规则作为条件候选参与求值。

`.local` 只控制版本管理生命周期，不改变 trust。

管理 CLI 是显式控制面。它可以列出项目文件名和 trust 状态；只有用户显式 `show` 或修改某条规则时才读取相应内容，并且永远不因此执行 Prompt 或脚本。

Agent Hooks 不建立独立的隐式 trust 数据库。适配器无法复用或证明宿主 trust 时，项目 scope 保持 unsupported，而不是自行推断。

## 9. Hook 文件格式

### 9.1 通用字段

| 字段 | 必需 | 说明 |
|---|---:|---|
| `schema` | 是 | 固定为 `agent-hooks/v1` |
| `event` | 是 | 十个标准事件之一 |
| `action` | 是 | `inject-prompt` 或 `run-script` |
| `description` | 否 | 单行、非空、最多 160 字符；用于 `list` 和 `show` 展示 |
| `enabled` | 否 | 缺省为 `true`；管理器创建时必须显式写出 |
| `when` | 否 | 缺失表示无条件匹配 |
| `script` | 条件必需 | `run-script` 必须提供 |
| `timeout` | 否 | 正整数秒；必须受运行时默认值和上限约束 |
| Markdown 正文 | 条件必需 | `inject-prompt` 必须为非空正文 |

未知字段使规则 invalid，避免拼写错误被静默忽略。

### 9.2 Prompt 动作

```markdown
---
schema: agent-hooks/v1
event: session-start
action: inject-prompt
description: 在会话开始时注入持久指令。
enabled: true
---

始终先说明问题根因，除非用户明确要求直接修复。
```

### 9.3 脚本动作

`script` 相对于规则所属 scope 的 `scripts/` 目录，不包含 `scripts/` 前缀：

```markdown
---
schema: agent-hooks/v1
event: before-tool
action: run-script
enabled: true
script: check-before-commit.local.sh
timeout: 10
when:
  all:
    - path: /tool/category
      op: eq
      value: shell
    - path: /tool/command
      op: regex
      value: '(^|[;&|]\s*)git\s+commit(?:\s|$)'
---
```

## 10. `inject-prompt` 语义

一次注入必须满足：

1. 保持原始用户消息和原生事件数据不变。
2. 作为独立、带 Agent Hooks 来源标识的附加上下文进入下一次相关模型请求。
3. 只影响该次模型请求，消费后清除。
4. 不持久修改 system prompt。
5. 不重新产生 `prompt-submit`，不递归触发 Agent Hooks。
6. 不声明高于 system、developer、managed policy 或用户指令的优先级。

宿主或事件无法提供上述最小保证时，`can_inject_prompt=false`，对应规则 support 为 unsupported。

多个 Prompt 同时命中时，按规则执行顺序作为独立上下文块附加。不能把已注入正文再次解析为 Trigger。

## 11. `run-script` 执行模型

V1 只支持 macOS 和 Linux。Windows 为 unsupported。

共享核心必须兼容 Node.js 18。脚本通过等价于以下方式启动：

```javascript
spawn(canonicalScriptPath, [], {
  shell: false,
  cwd: canonicalWorkspace
})
```

规范：

- 直接 spawn executable，禁止经过 shell。
- 脚本必须具有 executable bit 和有效 shebang。
- 禁止 command string 和隐式按扩展名选择解释器。
- 相对路径从当前 scope 的 `scripts/` 根解析。
- 拒绝绝对路径、空路径、NUL 和任何 `..` segment。
- 使用 `realpath` 校验最终目标仍在 canonical `scripts/` 根内。
- 拒绝逃出根目录的 symlink、非普通文件和不可执行文件。
- 项目脚本缺少 canonical workspace 时不执行。
- cwd 为 canonical workspace；stdin 接收一个 UTF-8 JSON 文档，随后 EOF。

运行时应该继承宿主环境以保留 `PATH`、Git 和 Swift 工具链，并增加：

```text
AGENT_HOOKS_ROOT
AGENT_HOOKS_SCOPE
AGENT_HOOKS_HOOK_ID
AGENT_HOOKS_WORKSPACE
AGENT_HOOKS_HOST
AGENT_HOOKS_EVENT
AGENT_HOOKS_HOOK_CONFIG
AGENT_HOOKS_HOOK_INPUT
```

运行时禁止默认记录完整环境、Prompt、工具输入、工具输出或原始 payload。

默认 timeout、最大 timeout、stdout/stderr 上限属于实现期参数，但必须有限、可测试，并对超限产生明确诊断。

## 12. 脚本退出协议

| 结果 | 行为 |
|---:|---|
| `0` | 动作成功，Agent Hooks 不提出阻止 |
| `2` 且 `can_block=true` | 阻止当前宿主操作 |
| `2` 且 `can_block=false` | 协议错误，不回滚，显示诊断 |
| 其他非零 | Runtime error，默认 fail-open |
| Spawn 失败、timeout、signal | Runtime error，默认 fail-open |

补充规则：

- `permission-request` 中的 `0` 仅表示 Agent Hooks 不拒绝，宿主继续原有审批；绝不表示自动批准。
- `after-tool`、`after-compact` 等 post-event 返回 `2` 是协议错误，不能声称撤销已经发生的行为。
- V1 不提供 `on-error: block`。需要 fail-closed 的约束必须由 Git hooks、CI 或其他确定性机制承担。
- `run-script` 的 stdout/stderr 只作为有界诊断，不转换成动态 Prompt；动态上下文应使用独立 `inject-prompt` 规则。

## 13. 标准事件 payload

所有标准顶层字段始终存在；宿主不提供时使用 `null`。

```json
{
  "schema": "agent-hooks.event/v1",
  "event": "after-tool",
  "host": {
    "name": "codex",
    "version": "..."
  },
  "workspace": {
    "root": "/canonical/workspace",
    "trusted": true
  },
  "session": {
    "id": "..."
  },
  "prompt": null,
  "tool": {
    "name": "apply_patch",
    "category": "file",
    "command": null,
    "success": true
  },
  "permission": null,
  "compact": null,
  "subagent": null,
  "stop": null,
  "changed_files": [
    {
      "path": "Sources/App/User.swift",
      "operation": "modified"
    }
  ],
  "native": {
    "event": "PostToolUse",
    "payload": {}
  }
}
```

### 13.1 `changed_files`

```json
"changed_files": null
```

表示适配器不知道文件是否变化。

```json
"changed_files": []
```

表示适配器可靠确认没有文件变化。

非空数组只包含适配器可靠确认的实际变化。不能把 before-tool 中的预期目标冒充为已变化文件。

标准 operation：

```text
created
modified
deleted
renamed
```

路径必须相对 canonical workspace，使用 `/` 分隔，不包含未解析的 `.` 或 `..`。Rename 应提供 `previous_path`。

Agent Hooks 不通过每次工具调用前后扫描整个 Git workspace 来填充此字段。任意 shell、MCP 或自定义工具造成的变化无法可靠识别时使用 `null`。需要完整状态检查时由脚本查询 Git 或文件系统。

### 13.2 `native`

`native` 是宿主专属逃生口。条件引用 `/native` 时，规则标记为 host-specific；其他宿主上的缺失字段按 `unknown` 处理。

## 14. YAML 与 schema

Frontmatter 使用严格 YAML 1.2 Core Schema。

解析器必须：

- 拒绝重复 key。
- 拒绝自定义 tag、merge key 和多文档 YAML。
- 拒绝不安全或无法确定展开的 anchor/alias。
- 不采用 YAML 1.1 的 `yes/no/on/off` 布尔语义。
- 不静默丢弃未知字段。
- 报告文件路径和准确错误位置。

V1 schema 固定为：

```yaml
schema: agent-hooks/v1
```

## 15. 条件 AST

V1 支持：

```text
all
some
eq
in
glob
regex
```

无 `when` 表示 `true`。

### 15.1 标量谓词

```yaml
path: /tool/category
op: eq
value: shell
```

`path` 使用 RFC 6901 JSON Pointer。Pointer 缺失返回 `unknown`。存在且值为 JSON `null` 是已知值；`eq null` 可以成功。其他操作符接收 `null` 或错误类型时返回 `unknown`。

### 15.2 `all`

```yaml
all:
  - <condition>
  - <condition>
```

```text
all([]) = true
任一 false -> false
全部 true -> true
无 false 且至少一个 unknown -> unknown
```

### 15.3 `some`

```yaml
some:
  path: /changed_files
  where:
    <condition>
```

```text
some([]) = false
some(null) = unknown
some(missing) = unknown
任一元素为 true -> true
无 true 且至少一个 unknown -> unknown
全部 false -> false
```

`where` 以当前数组元素作为新的 evaluation root。`where` 内的 `/path` 指当前元素的 `path`。V1 不提供从 `where` 返回事件根的特殊路径。

### 15.4 最终结果

```text
true    -> 执行动作
false   -> 跳过
unknown -> 跳过并保留诊断
```

## 16. V1 操作符

### 16.1 `eq`

严格比较 JSON 类型和值，不做隐式转换：

```text
"1" eq 1 -> false
```

### 16.2 `in`

左侧必须是标量，`value` 必须是数组，元素使用 `eq` 的严格比较。

### 16.3 `regex`

- 使用 Node.js 18 ECMAScript `RegExp` 语义。
- 等价于 `new RegExp(pattern).test(input)`。
- Case-sensitive，无 flags。
- 不接受 `/pattern/flags` 包装。
- 默认 substring search；全字符串匹配由规则显式使用 `^...$`。
- Pattern 或 input 必须受到有限资源预算约束。
- 无效正则使规则 invalid。

### 16.4 `glob`

V1 只支持：

| 语法 | 含义 |
|---|---|
| `*` | 零个或多个非 `/` 字符 |
| `?` | 一个非 `/` 字符 |
| `**` | 作为完整 segment 时匹配零个或多个路径 segment |

其他语义：

- Case-sensitive，whole-string match。
- `/` 是唯一目录分隔符。
- `**/*.swift` 同时匹配 `Foo.swift` 与 `Sources/Foo.swift`。
- `.` 没有隐藏文件特殊语义。
- 不支持 brace、字符类、extglob 或宿主 shell glob。
- 非完整 segment 的 `**` 使规则 invalid。

## 17. Schema 版本策略

`agent-hooks/v1` 发布后冻结：

- AST 节点和操作符集合。
- 三值与空集合语义。
- JSON Pointer scope。
- Regex、glob 和类型语义。
- Payload 字段类型。
- 脚本退出协议。

未来增加 `any`、`not`、`every`、`none`、`count` 或其他操作符必须使用新 schema，例如 `agent-hooks/v2`。运行时可以同时支持多个 schema，V1 规则无需迁移。

## 18. 加载、排序与短路

规则执行顺序：

```text
global scope
-> project scope
```

scope 内按 logical ID 的 UTF-8 字节序排序，禁止 locale-sensitive 排序。动作串行执行。

- 条件为 `false` 或 `unknown` 时跳过。
- Runtime error 默认 fail-open，继续下一条。
- 首个有效 block 立即停止剩余 Agent Hooks 规则。
- 已发生的脚本副作用不回滚。
- block 前已经累计但尚未消费的 Prompt 块丢弃。
- 不同事件和并发工具调用彼此独立。
- V1 不提供 `priority`。

Agent Hooks 只保证内部顺序，不保证与其他原生 Hook 的相对顺序。

## 19. 管理 Skill 与恢复 CLI

Skill 入口：

```text
$agent-hooks
```

V1 操作：

```text
create
list
show
update
enable
disable
delete
```

自然语言和显式参数映射到同一管理核心。

### 19.1 独立控制面

错误 `before-tool` 规则可能阻止 Agent 使用 shell 或文件工具，Skill 不能作为唯一恢复路径。现有 CLI 必须增加不经过 Agent Hooks 事件数据面的子命令：

```bash
csl-agent-kit agent-hooks list
csl-agent-kit agent-hooks disable project:broken-rule
```

外部终端调用 CLI 时：

- 不触发 Agent Hooks。
- 不执行任何规则、脚本或 Prompt。
- 可以列出并禁用 invalid、unsupported 或自锁规则。
- Skill 应复用相同管理核心。

### 19.2 `list`

状态使用正交维度：

| 维度 | 值 |
|---|---|
| `configured` | `enabled`, `disabled` |
| `validation` | `valid`, `invalid` |
| `trust` | `trusted`, `untrusted`, `unavailable`, `not-applicable` |
| `support` | `supported`, `partial`, `approximate`, `unsupported` |
| `effective` | `active`, `inactive` |

`effective=active` 至少要求 enabled、valid、trust 允许且 capability 支持。列表必须显示 qualified ID、scope、local/shared、event、action、脚本、路径和稳定 reason code。

### 19.3 `show` 与 `update`

- `show` 展示规则定义、脚本路径、兼容性和错误，默认不输出脚本全文。
- `update` 只修改用户要求的字段，保留其他字段和正文。
- 只有用户要求改变脚本逻辑时才修改脚本。
- scope、local/shared 和 ID 默认不变；重命名或移动必须明确要求。
- 修改操作必须使用 qualified ID；非 qualified ID 有歧义时直接报错。

### 19.4 `enable` / `disable`

修改 `enabled`，不删除文件。下一次事件立即生效。

### 19.5 `delete`

V1 `delete` 只删除 Hook Markdown：

- 永远保留关联脚本。
- 不做引用分析。
- 不清理脚本目录。
- 不询问是否同时删除脚本。

未来可以独立设计 `prune`，但不属于 V1。

## 20. 错误语义

以下情况使单条规则 invalid：

- Frontmatter 或严格 YAML 无效。
- 重复 key 或不支持的 schema。
- 未知字段、事件、action、节点或操作符。
- 无效 JSON Pointer、regex 或 glob。
- `run-script` 缺少脚本。
- `inject-prompt` 缺少非空正文。
- 脚本路径绝对、包含 `..` 或 realpath 越界。
- 脚本不存在、不可执行或不是普通文件。
- 同 scope logical ID 冲突。
- shared Hook 引用 local 脚本。

Invalid rule：

- 不执行。
- 必须出现在 `list` 中。
- 必须在 `show` 中提供文件、位置和具体错误。
- 不阻止其他有效规则运行。

重复 runtime diagnostic 应在会话内去重，避免每次事件刷屏。

## 21. 安全考虑

- 项目规则和 Prompt 在 trust gate 前不得被事件运行时读取。
- 脚本路径必须经过 canonical path 和 symlink escape 检查。
- 脚本不经过 shell，避免二次解释和 quoting 差异。
- 条件求值无 I/O、无副作用、无用户函数。
- 原始 payload 可能包含 Prompt、命令、文件内容或凭证，禁止默认持久化。
- 诊断必须限制大小，并避免回显完整敏感字段。
- Regex 和条件树必须有深度、节点数、pattern 长度和求值预算。
- Prompt 注入不能覆盖更高优先级指令，也不能递归触发。
- Agent Hooks 继承宿主 sandbox，不宣称提供额外隔离。
- `before-tool` 的 commit 检查只是 Agent 内提前反馈，最终约束应复用 Git `pre-commit` 或 CI。
- Runtime error 默认 fail-open，因此 Agent Hooks V1 不是安全强制边界。

## 22. 示例

### 22.1 Swift 文件格式化和检查

```markdown
---
schema: agent-hooks/v1
event: after-tool
action: run-script
enabled: true
script: format-and-lint-swift.local.sh
when:
  some:
    path: /changed_files
    where:
      all:
        - path: /operation
          op: in
          value:
            - created
            - modified
        - path: /path
          op: glob
          value: "**/*.swift"
---
```

`changed_files=null` 时结果为 unknown，不触发。删除 Swift 文件时 operation 不匹配，也不触发。脚本从 stdin 读取实际变化列表，先 formatter，再 linter。

### 22.2 Commit 前检查

```markdown
---
schema: agent-hooks/v1
event: before-tool
action: run-script
enabled: true
script: check-before-commit.local.sh
when:
  all:
    - path: /tool/category
      op: eq
      value: shell
    - path: /tool/command
      op: regex
      value: '(^|[;&|]\s*)git\s+commit(?:\s|$)'
---
```

脚本检查 Git 变更和特殊文件，`0` 继续，`2` 在 capability 支持时阻止。Regex 不能完整解析 shell alias、wrapper 或间接调用，因此同一检查脚本应由 Git `pre-commit` 复用。

### 22.3 无条件注入 Prompt

```markdown
---
schema: agent-hooks/v1
event: session-start
action: inject-prompt
enabled: true
---

始终先说明问题根因，除非用户明确要求直接修复。
```

## 23. 实施阶段

### Phase 1: 共享核心

- Node 18-compatible core。
- 严格 YAML 1.2 parser 与 schema 校验。
- Qualified ID、加载、冲突和排序。
- RFC 6901 Pointer。
- 三值求值器和 V1 AST/operator。
- 可解释 condition trace。

### Phase 2: 安全脚本运行时

- Canonical path 和 symlink escape 检查。
- Direct executable spawn。
- stdin payload、环境变量、timeout 和输出限制。
- 退出协议、串行执行和 block 短路。

### Phase 3: Codex adapter

- 十个事件逐项建立并验证 capability matrix。
- 标准 payload 和 golden fixtures。
- Workspace trust 证明。
- Prompt 注入和阻止映射。

### Phase 4: CLI 与 Skill

- 七个管理操作。
- `.local` 默认和 `.gitignore` 维护。
- 正交状态展示。
- 外部终端恢复路径。

### Phase 5: Claude Code adapter

- 独立 capability matrix。
- 复用共享核心和规则格式。
- 验证与 Codex 的重叠语义。

### Phase 6: Pi adapter

- 支持可证明映射的事件。
- 显式报告 partial、approximate 和 unsupported。
- 不伪造 permission 或 subagent 事件。

## 24. 验收标准

- Codex 十个事件都有经过验证的 capability matrix 和 golden payload。
- Claude Code、Pi 的每个启用映射都有独立 fixture。
- 无效、禁用、不可信和不支持规则均能列出且不会执行。
- 缺失字段和 `changed_files=null` 产生 unknown，不误触发。
- 三值逻辑、`all([])`、`some([])` 和 `some(null)` 有确定测试。
- Regex、glob 和 JSON Pointer 在共享核心中只有一种语义。
- 全局和项目规则按确定顺序串行执行。
- 同 scope shared/local 重名时全部 invalid。
- 未证明 trust 时，项目规则正文和脚本不进入事件运行时。
- Prompt 注入只影响下一次相关模型请求且不递归。
- 脚本无法通过绝对路径、`..` 或 symlink 越出 `scripts/` 根。
- `0`、`2`、其他非零、spawn failure、timeout 和 signal 均有确定结果。
- Post-event 的 `2` 不会虚假声称回滚。
- 外部 CLI 可以在 Agent 自锁时列出并禁用规则。
- `delete` 不删除关联脚本。
- Swift 文件和 commit 两个端到端用例按本文语义工作。

## 25. 已考虑的替代方案

### 25.1 直接移植 Hookify

拒绝。Hookify 的字段和动作与 Claude 工具协议耦合，条件主要是隐式 AND，也不能覆盖 Agent Hooks 的脚本、trust、跨宿主和管理需求。

### 25.2 CEL

CEL 无副作用、非图灵完备且适合结构化数据，但会增加表达式 parser 和运行时依赖，简单规则也更难生成和解释。Agent Hooks 使用 YAML AST，并保持脚本作为复杂逻辑逃生口。

### 25.3 Rego / OPA

表达力强，但对本地 Agent Hook 明显过重，会引入独立策略运行时和部署模型。

### 25.4 JsonLogic

可序列化并支持集合量词，但嵌套 JSON/YAML 可读性较差，现有 truthiness 和 coercion 语义也不符合严格三值设计。

### 25.5 只提供 Skill，不提供 CLI

拒绝。错误 `before-tool` 规则可能阻止 Agent 的 shell 和文件工具，Skill 无法保证自我恢复；必须保留不经过 Agent Hook 的外部控制面。

## 26. 非阻塞实现问题

以下参数可以在实现阶段确定，但不得改变本文语义：

- 默认 timeout 和最大 timeout。
- stdout/stderr、Prompt 和 native payload 的大小上限。
- Runtime diagnostic 去重周期。
- 满足严格 YAML 1.2 要求的 Node parser 选择。
- Capability matrix 的具体 CLI 展示格式。
- 各宿主用于承载一次性 Prompt 的原生 role 或字段。
- 未来是否增加独立 `prune`。

## 27. 参考资料

- [Claude Code Hook reference](https://code.claude.com/docs/en/hooks)
- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)
- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Pi extension events](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi extension event types](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts)
- [Anthropic Hookify source](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/hookify)
- [RFC 6901 JSON Pointer](https://www.rfc-editor.org/info/rfc6901/)
- [CEL specification](https://github.com/google/cel-spec)
- [OPA policy language](https://www.openpolicyagent.org/docs/policy-language)
- [JsonLogic operations](https://jsonlogic.com/operations.html)

## 28. 决策记录

对抗讨论先由 Synthesizer 形成草案，再由 Challenger 给出 `NEEDS REVISION`，指出事件同名不等于能力一致、动态项目规则可能绕过宿主 trust、退出码不能跨事件统一解释、`changed_files` 需要区分 unknown 与 empty、管理操作存在自锁等问题。

修订稿吸收这些问题后，Synthesizer 最终裁决为 `SUFFICIENT`。本 RFC 因此接受为 Agent Hooks V1 的设计基线；开始实现前仍需按 Phase 3 对当前 Codex 官方行为生成 capability matrix 和 golden fixtures。
