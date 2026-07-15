# Remove Tips UserPromptSubmit Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 停止 hook-only 客户端在每个用户 prompt 上追加完整 tips，同时保留会话/压缩生命周期与逐轮 SOP candidate 路由。

**Architecture:** 不新增抽象。先用 manifest 契约测试固定边界，再从两个保持一致的 hook manifest 删除单个 tips command，并让 doctor 只检查仍然必需的 `SessionStart` 与 `PostCompact` tips 生命周期。

**Tech Stack:** JSON hook manifests、Bash、Node.js 18+ 内置 test runner、npm。

## Global Constraints

- 不新增依赖。
- `UserPromptSubmit` 必须保留 `sop-candidates.js`。
- `SessionStart`、`PostCompact` 和 Pi `before_agent_start` 保持不变。
- 仅修改与 tips 生命周期契约直接相关的文件。

---

### Task 1: 移除逐轮 Tips 注入

**Files:**

- Modify: `tests/tips.test.mjs`
- Modify: `hooks/hooks.json`
- Modify: `.codex-plugin/hooks/hooks.json`
- Modify: `skills/tips/scripts/tips-doctor.sh`
- Modify: `skills/tips/SKILL.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: `document.hooks.UserPromptSubmit[].hooks[].command` 的现有 hook manifest 结构。
- Produces: `UserPromptSubmit` 只运行 `sop-candidates.js`；doctor 只把 `SessionStart` 与 `PostCompact` 视为 hook-only tips 生命周期。

- [x] **Step 1: 写入失败的 manifest 契约测试**

在 `tests/tips.test.mjs` 增加测试，遍历两个 manifest，断言 `UserPromptSubmit` 命令不含 `tips-inject.sh` 且仍含 `sop-candidates.js`：

```js
test("does not inject tips on UserPromptSubmit while preserving SOP candidates", () => {
  for (const relativePath of ["hooks/hooks.json", ".codex-plugin/hooks/hooks.json"]) {
    const document = JSON.parse(readFileSync(join(root, relativePath), "utf8"));
    const commands = (document.hooks.UserPromptSubmit || [])
      .flatMap((entry) => entry.hooks || [])
      .map((hook) => hook.command || "");

    assert.equal(commands.some((command) => command.includes("tips-inject.sh")), false);
    assert.equal(commands.some((command) => command.includes("sop-candidates.js")), true);
  }
});
```

同时把两个 doctor 测试对 `UserPromptSubmit=found` 的断言改成不应输出该 tips lifecycle。

- [x] **Step 2: 运行测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='does not inject tips on UserPromptSubmit' tests/tips.test.mjs
```

Expected: FAIL，因为当前两个 manifest 仍包含 `tips-inject.sh`。

- [x] **Step 3: 最小修改生产配置**

从 `hooks/hooks.json` 与 `.codex-plugin/hooks/hooks.json` 的 `UserPromptSubmit` 删除 tips command object，只保留现有 `sop-candidates.js` object。将 `skills/tips/scripts/tips-doctor.sh` 的 hook lifecycle 循环从：

```bash
for event_name in SessionStart UserPromptSubmit PostCompact; do
```

改为：

```bash
for event_name in SessionStart PostCompact; do
```

同步修正 `skills/tips/SKILL.md` 和 `CHANGELOG.md` 的 tips 生命周期描述，明确 hook-only 客户端只在会话开始和 compact 后注入，Pi 仍在每轮临时刷新。

- [x] **Step 4: 运行聚焦测试并确认 GREEN**

Run:

```bash
npm run test:tips
```

Expected: 所有 tips tests PASS。

- [x] **Step 5: 运行完整验证**

Run:

```bash
jq empty hooks/hooks.json .codex-plugin/hooks/hooks.json
bash -n skills/tips/scripts/tips-doctor.sh
cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json
npm run check
npm pack --dry-run --json
git diff --check
```

Expected: 全部 exit 0；包中仍包含两个 hook manifest、tips scripts 与 Pi extension。

- [x] **Step 6: 运行 Yao 审计并记录结果**

确认两个 manifest 无 `UserPromptSubmit` tips command、无 hook parity 漂移，doctor 与测试契约一致；将执行结果写入 `tasks/todo.md` 复核
