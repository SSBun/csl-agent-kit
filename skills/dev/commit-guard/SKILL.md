---
name: commit-guard
description: 检查 Agent Git 提交的内容保护、解释提交被阻断的原因或诊断内置提交 hook 时使用。当前规则阻止临时 code-review 说明进入提交；不负责生成或清理说明，不提供推送扫描、密钥扫描或通用代码质量审查。
---

# Commit Guard

## 职责

负责提交内容检查和阻断诊断。内置保护默认开启，独立于是否调用本 Skill；调用本 Skill 不会自动提交、暂存、清理文件或改变 hook 设置。

当前对仓库根目录 `.csl-agent-kit/` 之外的完整暂存内容搜索保留字符串（`@code` 与 `-review` 无间隔拼接）。该目录及其全部子目录豁免检查，以保留任务证据和测试材料原文；同名嵌套目录或相似前缀目录不豁免。检查范围内任何位置命中均拒绝，包括字符串、行尾、文档示例和二进制内容，不要求注释前缀或完整 begin/end。规则、支持的提交形式与覆盖限制见 [提交保护边界](references/commit-guard.md)，唯一检查实现为 [check-commit.js](scripts/check-commit.js)。不要把检查通过解释为代码正确、没有密钥或可安全推送。

## 检查与诊断

1. 明确实际仓库、宿主、待执行命令和暂存内容；工作区仍有说明但 index 干净时允许提交。
2. 使用 `agent-hooks` 查看 `inner:code-inline-review-commit` 在实际宿主的配置、校验和生效状态。配置有效不等于当前会话已加载或实际执行。
3. 内置 hook 仅对可见的 `git commit` 调用执行检查，命中标记或无法完成检查时阻断，并报告位置或失败原因。其他所有 Git 子命令直接放行，包括 stash、merge、rebase 和别名；包含其他子命令的调用若另有可见的 `git commit`，仍检查该提交入口。检查器只读，不执行收到的提交命令。
4. 提交被阻断时解释原因和可行修复。用户授权清理说明后，交由 `code-inline-review` 的清理流程处理；本 Skill 不复制其注释格式、生成或删除算法。
5. 修复后重新检查实际 index。暂存与提交使用独立、顺序调用，保留部分暂存选择，不通过包装命令、禁用 hook 或其他入口绕过。

## 内置 hook 接入

`inner:code-inline-review-commit` 是本 Skill 的审查标记规则，保留历史 ID 以兼容已有启用／禁用设置。注册文件及薄脚本入口仍位于 `agent-hooks` 的受控目录，后者只调用本 Skill 的检查器；`agent-hooks` 负责发现、调度和宿主适配，不拥有内容规则。

保护仅覆盖 CSL Hooks 可见的 Agent shell 调用；不安装原生 Git hooks，不检查外部终端／GUI，也不扫描 `git push` 的提交历史。不要以本 Skill 的名称承诺尚未实现的防泄露或远端强制保护。

## 验证

维护时核对 index 与工作区分离、完整文件扫描、失败阻断及 hook 调用链。路由边界见 [触发案例](evals/trigger_cases.json)；修改包后运行 skill-quality，不把静态门禁当作实际宿主已生效的证据。
