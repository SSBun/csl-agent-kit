# 关键词化 Tips 按需注入

## 记住交互式安装选择

### 计划

- [x] 先补 CLI 回归测试，覆盖保存选择、下次交互预选、无效状态回退默认项，以及显式参数不改写已保存选择。
- [x] 用 Node 标准库在用户数据目录保存交互式已确认选择，并在交互 checklist 中读取它。
- [x] 更新 CLI 说明与变更记录，保持非交互参数和现有安装行为不变。
- [x] 运行聚焦与全量检查、打包检查和差异复核。

### 复核

- 仅记住交互式 checklist 的已确认选择；`--target`、`--all` 和 `--yes` 继续使用其当前显式语义。
- 选择文件以原子替换方式写入；无效、损坏或只包含未知目标的文件会回退到原有三个默认预选项。外部命令未确认、取消或保存失败不会阻断既有安装流程。
- 回归测试先确认缺少存储 API 时失败；实现后 `env -u NO_COLOR npm run test:cli` 的 10 项测试、`env -u NO_COLOR npm run check` 的 37 项测试与安装 dry-run 均通过。
- `npm pack --dry-run` 成功生成 83 文件的发布清单，`git diff --check` 通过。当前命令软链接到本工作区；已将截图中确认的 5 项写入 `/Users/caishilin/.csl-agent-kit/install-selection.json`。
- 未解决但不属于本改动的风险：`/Users/caishilin/.agents/skills/grill-me` 是普通目录而非符号链接，勾选 `Codex skills symlinks` 时仍会因该冲突失败。

## 删除全局 Wildcard Tip

### 计划

- [x] 先补回归测试，明确所有 tips 都会被静默检查，但 `"*"` 不是合法关键词且不会匹配每条 prompt。
- [x] 移除 wildcard 校验与匹配分支，并更新 skill、诊断和相关说明。
- [x] 通过共享 JSON 写入逻辑删除本地 `DO NOT send optional commentary` tip，不改动其余 5 条。
- [x] 运行聚焦与全量验证、打包检查和必需的 `yao-meta-skill` 审计。

### 复核

- 范围仅限删除用户指定的全局 tip 及其 `"*"` 机制；其他 tips 保持“每轮静默检查、仅命中注入”的现有行为。
- 测试先行确认 RED：新增 `"*"` 能写入且会命中任意 prompt；实现后 `tips` 的 18 个测试和 Pi 的 9 个测试均通过。
- 本地 JSON 在文件锁内按精确正文删除目标条目，再用共享原子写入器校验；现在保留 5 条显式关键词 tips，未命中 prompt 不输出任何 tip。
- `env -u NO_COLOR npm run check` 通过 34 个测试与 install dry-run；Bash/Node/JSON 静态检查、manifest parity、`npm pack --dry-run`（82 个文件）和 `git diff --check` 通过。
- `yao-meta-skill` 的 lint、governance、resource-boundary 通过；聚合校验仍仅报告既有的 `Missing agents/interface.yaml`，并提示可选的 `manifest.json` 未提供。
- 已有会话历史中的旧完整 tips developer context 无法由 hook 删除；新会话和后续 prompt 不会再注入该 wildcard tip。

## 计划

- [x] 审查现有 tips 存储、Codex/Pi 生命周期、SOP candidate 实现及回归测试。
- [x] 确定 JSON 存储、关键词匹配、`"*"` 全局关键词及 6 条本地 tip 的候选映射。
- [x] 将 tips 改为按 prompt 关键词匹配，只把命中的 tip 注入对应 turn 的上下文。
- [x] 更新跨客户端实现、诊断、文档与回归测试。
- [x] 按用户确认的 150 字符单条上限迁移本地数据，并重装本地 Codex plugin。
- [x] 完成全量静态、打包与 `yao-meta-skill` 审计。

## 复核

- JSON 存储、写入锁、候选 hook、Pi 动态匹配、诊断与回归测试均已实现；旧 Markdown 不再作为运行时 fallback。
- 单条上限已按用户要求调整为 150 个字符；150/151 的 ASCII 与中文边界回归通过。
- 已迁移 `/Users/caishilin/.csl-agent-kit/tips/tips.md`：现在有 6 条 JSON tips，旧文件安全保留为 `tips.md.bak`，`tips-doctor.sh` 未报告数据或 lifecycle 警告。
- `csl-agent-kit@csl-agent-market` 已重新安装并启用，来源为当前工作区。
- `env -u NO_COLOR npm run check` 通过 32 个测试与 install dry-run；Bash/Node/JSON 静态检查、hook manifest parity、`npm pack --dry-run`（82 个文件且包含新运行时脚本）和 `git diff --check` 均通过。
- `yao-meta-skill` 的 lint、governance、resource-boundary 检查通过；聚合校验仅报告既有的 `Missing agents/interface.yaml`，governance 另提示未提供可选 `manifest.json`。
- 对抗性复核覆盖 150/151 字符边界、失败迁移不改动原文件、目标/源同路径拒绝、JSON 候选只命中相关 tip、`"*"` 全局匹配与旧 Markdown 备份；未发现需要修复的问题。
