# 关键词化 Tips 迁移实施计划

> **执行方式：** 在当前会话按测试先行逐项实现；不使用 subagent。

**目标：** 将用户 tips 从无结构的 Markdown 列表迁移为带必填 `keywords` 的 JSON，并只在当前 prompt 命中时注入对应 tip。

**架构：** 新增一个 Node 共享模块，统一解析、校验、迁移和匹配 JSON；Codex hook 与 Pi extension 均调用相同候选选择逻辑。保留 Bash 写入锁，迁移成功后将旧 `tips.md` 重命名为备份，避免旧 hook 再次读取全量内容。

**技术栈：** Node.js 标准库、Bash、JSON、Codex hooks、Pi TypeScript extension、Node test runner。

## 全局约束

- 默认用户数据文件为 `/Users/caishilin/.csl-agent-kit/tips/tips.json`，格式为 `{ "version": 1, "tips": [{ "text": string, "keywords": string[] }] }`。
- 每条 tip 必须有 1–5 个非空显式关键词；每条 prompt 都会静默检查全部 tips，但只输出命中条目。
- 普通关键词采用 Unicode 不敏感大小写的字面子串匹配；输出只包含命中的 tip 正文，不泄露关键词或未命中 tip。
- `tips-add.sh` 与 `tips-migrate.sh` 只在 `--confirmed` 下写用户数据；写入保持 20 条、单条 150 字符、正文总计 2,000 字符限制。
- 不添加 npm 依赖；不保留 Markdown 读取 fallback。迁移成功后把旧文件保留为 `.bak`。

### Task 1: 建立 JSON 数据与候选契约

**文件：**

- 创建：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-store.js`
- 创建：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-candidates.js`
- 修改：`/Users/caishilin/Desktop/personal/skills/tests/tips.test.mjs`

**接口：**

- 产生：`loadTips(file)`, `validateTips(document)`, `findCandidates(prompt, tips)`, `formatCandidates(candidates, file)`。
- 消费：JSON 数据文件和 Codex `UserPromptSubmit` 的 stdin `{ "prompt": string }`。

- [x] 先写失败测试，覆盖 JSON 读取、ASCII/中文关键词命中、wildcard 拒绝、未命中时无输出、无关键词时拒绝。

```js
assert.deepEqual(findCandidates("请修复这个 bug", tips), [tips[0]]);
assert.equal(formatCandidates([], file), "");
```

- [x] 运行 `npm run test:tips`，确认测试因缺少 JSON candidate 实现失败。
- [x] 实现只依赖 `node:fs`、`node:path` 的 JSON 读取、校验与匹配；hook wrapper 只读 stdin 并输出 `formatCandidates` 的结果。
- [x] 再运行 `npm run test:tips`，确认新增契约通过。

### Task 2: 安全写入与一次性迁移

**文件：**

- 修改：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-add.sh`
- 创建：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-migrate.sh`
- 修改：`/Users/caishilin/Desktop/personal/skills/tests/tips.test.mjs`

**接口：**

- `tips-add.sh --confirmed --keywords "关键字一,关键字二" "tip 正文"`。
- `tips-migrate.sh --confirmed --keywords-json '<按原文映射的 JSON 对象>'`。

- [x] 先写失败测试，覆盖缺少 `--keywords` 的拒绝、合法 JSON 写入、完整关键词映射迁移和旧 `tips.md` 备份。
- [x] 运行 `npm run test:tips`，确认上述迁移/写入测试失败。
- [x] 在已有文件锁范围内调用共享模块写 JSON；迁移仅在映射覆盖每条旧 tip 且目标文件不存在时写入，再重命名旧文件为 `.bak`。
- [x] 再运行 `npm run test:tips`，确认写入、迁移和原有并发限制测试通过。

### Task 3: 接入 Codex、Pi 与诊断

**文件：**

- 修改：`/Users/caishilin/Desktop/personal/skills/hooks/hooks.json`
- 修改：`/Users/caishilin/Desktop/personal/skills/.codex-plugin/hooks/hooks.json`
- 修改：`/Users/caishilin/Desktop/personal/skills/pi/extensions/csl-context-hooks.ts`
- 修改：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-inject.sh`
- 修改：`/Users/caishilin/Desktop/personal/skills/skills/tips/scripts/tips-doctor.sh`
- 修改：`/Users/caishilin/Desktop/personal/skills/tests/tips.test.mjs`
- 修改：`/Users/caishilin/Desktop/personal/skills/tests/pi-context-hooks.test.mjs`

**接口：**

- Codex `UserPromptSubmit` 同时运行 `tips-candidates.js` 与现有 `sop-candidates.js`。
- Pi `before_agent_start` 仅把 `findCandidates(event.prompt, tips)` 的结果添加到临时 system prompt。

- [x] 先写失败 manifest/Pi 测试，要求不存在 tips 的 `SessionStart`/`PostCompact` 全量 hook，且匹配 prompt 只收到匹配 tip。
- [x] 运行 `npm run test:tips` 与 `npm run test:pi`，确认新断言失败。
- [x] 用 `tips-candidates.js` 替换两个 manifest 的 lifecycle hook；Pi 改为共享 selector；doctor 检查 candidate hook 与 JSON 数据，`tips-inject.sh` 仅作手动完整预览。
- [x] 再运行两个测试命令，确认跨客户端候选契约通过。

### Task 4: 更新说明、迁移本地数据与验证发布表面

**文件：**

- 修改：`/Users/caishilin/Desktop/personal/skills/skills/tips/SKILL.md`
- 修改：`/Users/caishilin/Desktop/personal/skills/README.md`
- 修改：`/Users/caishilin/Desktop/personal/skills/CHANGELOG.md`
- 修改：`/Users/caishilin/Desktop/personal/skills/tasks/todo.md`
- 修改：`/Users/caishilin/Desktop/personal/skills/tasks/context.md`

- [x] 写入测试后，更新存储格式、确认流程、迁移命令和匹配语义；不把全量 tips 重新作为 session context。
- [x] 用用户已确认的关键词映射运行 `tips-migrate.sh --confirmed --keywords-json ...`，再运行 `tips-doctor.sh` 验证本地 JSON 与 hook 生命周期。
- [x] 运行 `env -u NO_COLOR npm run check`、`npm run test:pi`、Bash/Node/JSON 语法检查、hook parity、`npm pack --dry-run` 与 `git diff --check`。
- [x] 按 `yao-meta-skill` 运行 tips skill 的 lint、governance、resource-boundary 审计；记录已知的仓库级 `agents/interface.yaml` 缺口而不为此扩展范围。
