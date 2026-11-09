# Review round 04

- Schema: task-review-report/v1
- Task: implement-code-inline-review
- Round: 04
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/implement-code-inline-review/evidence/7496f39b801075d618a07fdc971e247a5c568987b41d724c39b97b2e45333aa3.json#7496f39b801075d618a07fdc971e247a5c568987b41d724c39b97b2e45333aa3
- Task fingerprint: dba39e77473a06cce1414957d142a748c1b196dfb8526aeeb499f6a605759e1a
- Outcome: findings
- Mode: independent subagent
- Run: fe0ea771-dfbb-4bed-9ad3-be6d1936f555

## Reviewer feedback

## 审查模式与范围

- **Review mode**：independent subagent，独立只读审查。
- **范围**：T1–T3，重点检查命令识别、index 扫描、清理预览及宿主阻断链。
- **快照**：`7496f39b801075d618a07fdc971e247a5c568987b41d724c39b97b2e45333aa3`。主 Agent 在本轮末段重新执行 `check-evidence`，报告 `snapshot: verified`、历史报告检查数 3；不是 Reviewer 自行计算的哈希。

## 发现

### TR-1 · P1 · Critical Finding：静态 shell 包装叠加重定向或组合命令仍绕过检查

- **位置**：["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/scripts/check-code-review-commit.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/scripts/check-code-review-commit.js)，第 98–184、192–201 行。
- **问题**：字面参数解析失败后，仅调用 `visibleGitInvocation`。该扫描器没有沿用正常解析路径对 shell 包装参数的识别，因而漏掉引号内明确可见的 `git commit`。
- **证据**：Reviewer 追踪源码后，请主 Agent 只读调用当前 `checkCommand`，得到：

  | 命令 | 实际结果 |
  | --- | --- |
  | `sh -c 'git commit -m x'` | `blocked: true` |
  | `sh -c 'git commit -m x' >/dev/null` | `blocked: false` |
  | `true && sh -c 'git commit -m x'` | `blocked: false` |

  主 Agent 明确未执行上述字符串或真实提交。
- **影响**：添加重定向或组合语法反而取消拒绝，提交可未经 index 检查执行。这不依赖隐藏脚本、动态命令名或外部竞态，违反 T2/T3 对可见不确定提交形式的拒绝要求。
- **最小修复建议**：使解析失败路径同样识别执行位置上的静态 shell 包装及其可见 Git 参数，统一拒绝；保留普通文本和静态 heredoc 的非误报边界，无需实现通用 shell 解释器。
- **进展分类**：**substantive progress，尚未 resolved**。沿用 TR-1，不新增编号。此发现需要修复。

## 已确认正确的部分

- `bisect` 已从非提交白名单移除；当前源码会拒绝 `git bisect run git commit`，作者当前哈希证据也记录三宿主拒绝。
- Skill 明确要求显式启用、每组一个主块、关联块目标/职责/主块 ID，以及删除例外和不保存问答。
- 清理工具仅输出预览；流程要求验证语言上下文、保持普通注释及部分暂存选择。
- 提交扫描读取完整 index；Pi 将阻断结果返回给 `tool_call`，没有自动清理或暂存行为。

## 未验证风险

- **非阻断集成限制**：Pi 证据是实际模块注册后的 handler 调用，不证明当前交互会话已 reload，也不证明真实提交端到端运行。不得据此宣称当前会话保护已生效。
- 本轮未发现其他证据充分、需要独立编号的问题。

## 实际检查与作者证据

- **Reviewer 实际检查**：读取审查规范、任务要求、快照清单、相关源码和差异、Skill 格式及清理协议；追踪解析失败路径、index 扫描和宿主返回链；提出上述反例并取得主 Agent 的只读观察。
- **作者证据已读**：当前 `repair-04` 的 44 场景、三宿主 bisect 拒绝和干净 index 放行；初始清理/index 观察；Pi handler 观察；第三轮历史报告。旧观察未冒充当前哈希验证。
- **覆盖限制**：未修改文件或状态，未运行 shell、测试套件、真实提交或委派。未扩审其他任务的 Memory/storage migration 改动，未逐项重跑全部场景。语法、Skill Quality、whitespace 通过及 2147 tokens 警告属于作者报告。