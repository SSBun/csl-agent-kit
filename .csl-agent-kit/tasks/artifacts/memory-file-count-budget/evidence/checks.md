# 非测试验证记录

本记录汇总本任务已经执行的检查，不代表运行过单元测试、项目测试套件或独立模型实验。

- Node.js v22.22.2，ICU 78.2，Unicode 17.0。项目词数由 `Intl.Segmenter("zh", {granularity: "word"})` 的 `isWordLike` 段统计；标点和空白不计。
- 8 个修改过的 JavaScript 文件通过 `node --check`：Memory store、recall-index、migration、agent、cli、bootstrap读取脚本，以及两个更新后的测试文件。仅检查测试文件语法，没有执行测试。
- Pi Memory bridge 通过 `node --experimental-strip-types --check`，这仅证明 TypeScript 语法可解析，不是完整类型检查。
- `skill-quality` 对 agent-memory 和 agent-hooks 均为零失败。初始上下文大小分别约 3232 与 2147 tokens，超过建议的 1000-token 预算；保留必要读写和恢复约束，接受该警告。
- 本任务范围的 `git diff --check` 无输出；未跟踪文件不受该命令完整覆盖，另由语法检查和快照绑定内容。
- 隔离 CLI 观察见 [cli-observations.json](cli-observations.json)：前20条写入成功、第21条拒绝、1000词可写、1001个英文或中文词拒绝、满容量已有chip更新成功、满容量恢复拒绝、pending恢复不改变已提交正文hash。
- 当前59条项目记忆的隔离副本升级为v4，entry集合及每条hash保持不变；项目只生成index.md并移除旧.indexes。独立用户根保留cards/topics布局。
- 审查前后 `check-evidence memory-file-count-budget` 均返回 `snapshot: verified`。校验由主Agent执行，独立Reviewer未执行摘要计算。

真实服务与实际库整理另见 [activation.json](activation.json) 和 [runtime-result.json](runtime-result.json)，不能用隔离观察替代真实库完成证据。

运行态补充后，agent.js语法检查再次通过；agent-memory Skill Quality零失败，最终上下文警告为3271 tokens。只读来源工具已在真实后台调用成功，复用来源清单核对。完整索引整理事件最后以MODEL_TIMEOUT耗尽两次尝试：实际41/20、无超长正文、单索引、无缺失引用与pending。首轮独立审查不覆盖随后增加的来源工具和维护范围说明；尚不能宣称全部交付通过最终复审。
