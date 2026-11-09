---
schema: csl-memory/v2
id: review-comments-editor-portability
revision: 20
type: fact
title: 源码审查说明与独立提交保护
summary: code-inline-review显式管理说明；commit-guard默认只读扫描整个index，精确保留子串任意位置均阻断，无文件豁免。agent-hooks保留历史ID与薄入口；保留shell漏检及宿主、并发边界。
sources:
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:decide-review-explanation-comments;
    events:d1cd7785e9044bbdc198cccd045c8af0c053269aa4f35f197c86f19089dfcc3b,79ade66b204e71ef0ba87e54c88e3e0629f06e3561626a6212140878726e0bf1,59276f999c0d6ce7970d5a21af93dd4336f7d27b1d21cc500524f536fff71e16,111b8c54840b48ca7695c15f0d42853fdf858dd230e8a4101055645a97f66e01;
    启用与逻辑组/删除范围
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:decide-review-explanation-comments;
    events:38a44aa9fdd3553e5ab2747d4e12f65e69f131e95147f20b384598f5f8d83f73,e8b4f8dfcdc4b9ca41102507cbf175da9a21656b5acab4c0b3cd673b13aa377f,3b87de518f12ecd337e84feebf2a052934f11b5d82f9b0d8670e7966cd853473,49fef80e02b974e039a9d9f0204830b88fe24caa805c3568f2a5e518b800be09;
    当前解释/清理/关闭；默认生成已被后续替代
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:decide-review-explanation-comments;
    events:36e00c02577430ce185e0bd0bfc98f92243e2a1e1b0a61e755418b01b77917c2,5ea0c85945aaf00dc0eacafbc862a50e965be5c16084d6cb7512715a069f486e,c34d1107b6b7e7f837d500a489f894b19b70e6e38534ecfcdcaa0bb3dddc5473,9a970ad94203c533fa40d2c8dd1a85fe32e2a4dfcbab6a667b44ba34e624cdf5;
    显式生成/默认保护/index隔离/Pi纠正
  - .csl-agent-kit/tasks/tasks/decide-review-explanation-comments.md#Target
  - /Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md#tool_call
  - skills/meta/agent-hooks/scripts/lib/runtime.js#PI_CAPABILITIES;
    pi/extensions/csl-context-hooks.ts#tool_call
  - skills/dev/code-inline-review/SKILL.md;
    skills/dev/code-inline-review/references/comment-format.md
  - skills/dev/code-inline-review/references/commit-guard.md;
    历史位置，现迁移至skills/dev/commit-guard/references/commit-guard.md
  - .csl-agent-kit/tasks/tasks/implement-code-inline-review.md#Result
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:implement-code-inline-review/event:da2ddde7ed22fa98db39644ea706541ff771158e1248e643d53d334f22daf787#user-and-assistant
  - session:01a1aaff-66d3-761c-80b2-30359f32d804/event:caab002fe14656e8e327f5dc1c114da0962867cd113114f42b26ddb22783a5f4#assistant-TR-1
  - skills/meta/agent-hooks/scripts/check-code-review-commit.js#visibleGitInvocation/checkCommand;
    历史实现位置，现为薄入口
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:implement-code-inline-review/event:fe261bba67225285f97ca848cb38652ae88a7937c19cf3afbf3b1bcbf936123d#assistant
  - session:01a1ab06-6f3a-7713-8545-02bbeed7175f/event:0b3419488d5bccd33b84b4dbec9b5c3bdf55ace70044dda624a74b81e4dba4e7#assistant-TR-1
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:implement-code-inline-review/event:71e9a11e6c635bf1bccf5e40fd801317fe5d40df5a2a70eb0b713903ac042ec6#assistant;
    bisect run漏检
  - skills/meta/agent-hooks/scripts/check-code-review-commit.js:10-15,215-217;
    历史NON_COMMIT_COMMANDS实现
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:implement-code-inline-review/event:8ad78c5a429e53f69da56738140c7c20b47130e30760e5174fca2c75757a3dd2#assistant;
    shell包装叠加语法漏检
  - skills/meta/agent-hooks/scripts/check-code-review-commit.js#SHELL_WRAPPERS/visibleGitInvocation/checkCommand;
    历史两条解析路径
  - session:01a1aefb-7537-70a4-9655-606b159cc6ac/task:null/event:197e88eedadf81e29f817b03cd556c785bcb6170e76883c332a50a25f326a36b
  - skills/dev/commit-guard/SKILL.md#内置 hook 接入;
    skills/dev/commit-guard/references/commit-guard.md;
    skills/meta/agent-hooks/scripts/check-code-review-commit.js:5-8
  - session:01a1af93-d195-73f3-9aea-76b7dde1d67d/task:null/event:93e4193f502cebd6cf3c23288fcdf85ea07ea80a023533ebe02239a21d314938#user
  - skills/dev/commit-guard/scripts/check-commit.js:9,85;
    skills/dev/commit-guard/references/commit-guard.md#判定
updated: 2026-11-06T06:40:25.560Z
deleted: false
retrieval:
  aliases:
    - code-inline-review
    - commit-guard
    - 临时审查注释
    - 代码改动说明
    - 主块与关联块
    - CSL Hooks
    - Pi tool_call 阻断
    - 工作区保留审查块
    - 暂存区检查
    - 保留子串固定匹配
    - inner:code-inline-review-commit
    - Git赋值前缀
    - here-document
    - 命令替换
    - 前置重定向
    - time包装
    - git bisect run
    - NON_COMMIT_COMMANDS
    - 静态shell包装
    - sh -c
    - literalWords
    - visibleGitInvocation
  situations:
    - 区分源码说明生命周期与提交保护职责
    - 查找提交检查器及兼容hook入口
    - 决定何时启用源码审查注释
    - 查找逻辑组说明格式与安全清理入口
    - 判断工作区含审查块但提交版本不含时能否提交
    - 排查Pi提交阻断与宿主加载状态
    - 判断隐式暂存、复合提交和并发index变更的保护边界
    - 核对shell可见执行位置覆盖与普通文本非误报边界
    - 区分双引号命令替换与单引号普通文本
    - 核对Git子命令包装执行与非提交白名单漏检
    - 核对静态shell包装叠加重定向或组合命令时两条解析路径的一致性
    - 判断字符串、文档或二进制中的保留标记是否阻断提交
  topics:
    - 代码审查/改动说明
    - Git/提交保护
    - Pi/工具调用阻断
  links: []
---

CSL Agent Kit：code-inline-review仅显式调用时为当前授权任务生成、维护和清理源码说明；任意编辑器可见，关闭只停止新增。按逻辑组组织主块与关联块，机械修改可集中说明，整文件/模块删除无需单独注释。只留当前解释，讨论留聊天。格式与清理契约见skills/dev/code-inline-review/SKILL.md及references/comment-format.md。

commit-guard独立拥有提交规则与检查器skills/dev/commit-guard/scripts/check-commit.js；code-inline-review不负责提交检查或hook管理。agent-hooks负责发现、调度、宿主适配；注册及兼容薄入口留在其受控目录。历史规则ID inner:code-inline-review-commit保留已有启用/禁用设置，保护默认开启，不依赖显式调用Skill。规范入口skills/dev/commit-guard/references/commit-guard.md。

扫描整个index完整文件，含未改动行及二进制；区分大小写固定匹配由@code与-review拼接的保留子串。任意位置命中均阻断，无关注释语法、文件类型或begin/end配对；字符串、文档示例也不豁免。协议实现、文档、夹具用拆分或转义表示，无文件白名单。只保证完整保留子串匹配，不识别无标记自然语言或编码变形；不得改写标记夹带临时说明。工作区或未跟踪文件独有说明不阻止提交。检查只读，不清理或重新暂存；失败请用户修复或授权清理。暂存与提交顺序分开；隐式暂存、路径提交、复合提交等不可可靠检查形式应拒绝。不提供push历史、密钥或通用代码质量扫描。

解析核对：赋值前缀、if/then、here-document后续命令、双引号内$(...)、反引号、前置重定向、time包装均是可见执行位置；不支持应识别后拒绝。首词识别、双引号整体当文本、遇<<停止扫描可能漏检；保留单引号及普通文本中git commit的非误报边界。

静态shell包装须与重定向/组合语法交叉核对。字面分支识别sh/bash/zsh/eval，而解析失败后的visibleGitInvocation不识别同集合时，sh -c 'git commit …'可独立被拒绝、叠加语法却放行。两条路径须保持包装语义一致，shell命令字符串不能视为普通文本。

Git执行入口git bisect run git commit …：将bisect整体列入NON_COMMIT_COMMANDS、按外层子命令放行会漏检。shell包装识别不能替代Git子命令语义。

Pi before-tool阻断传递为tool_call的{block:true,reason}；检查异常也阻断。须宿主加载对应版本且规则启用，源码存在不证明当前会话生效。限适配器可见Agent shell Git调用；不覆盖外部终端、GUI、任意脚本，不安装原生Git hooks。检查与提交无跨进程锁，不保证并发index或原生Git hook修改后的内容；跨客户端强制保障需另设Git/CI层，本地Git hook可绕过。

preview-clean.js仅输出预览；精确删除前核实语言注释上下文、原文未变及任务归属，保留普通注释、业务代码和部分暂存选择。需保留解释先存owning Task artifact，远端发布另需授权。标记为保留前缀加:begin/end及组/块ID；不支持安全注释的文件用关联说明或聊天/PR解释。
