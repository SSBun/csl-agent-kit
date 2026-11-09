# 创建逐字对话归档 Skill

Status: Completed (2026-08-12 10:50)
Kind: Task

## Target
- [x] T1: 用户可通过 archive Skill 或 Pi /archive 命令用自然语言指定当前 Session 中要保存的对话范围。
- [x] T2: 归档文件写入 tasks/conversations，保持所选 User 与 Agent 可见文本的原始顺序、内容和换行，并明确标记为非权威历史记录。
- [x] T3: 归档流程默认排除系统提示、thinking、工具调用和工具结果，并在无法可靠确定范围时拒绝写入而不是猜测。
- [x] T4: Skill、Pi 命令接入和确定性提取逻辑通过聚焦测试与 Skill 包校验。

## Plan

1. 建立 archive Skill 的范围判定、精确性和失败关闭契约。
2. 实现当前 Pi 分支的确定性文本提取与归档，并让 /archive 传递调用前的 Session 来源边界。
3. 同步发现清单和文档，运行聚焦测试、包校验与任务完成门禁。

## Result

- T1: archive Skill 已加入共享发现，Pi /archive 会把调用前的 session file、workspace 和 active leaf 作为来源边界发送给 Agent；聚焦命令测试通过。
- T2: archive-session.mjs 的写入测试确认文件落到 tasks/conversations、按 User/Agent 顺序保留双空格与换行，并写入非权威历史记录声明。
- T3: 分支夹具与真实 PI_SESSION_FILE 提取验证确认排除 thinking、toolResult 和 abandoned branch；无效或反向范围以退出码 1 拒绝。
- T4: npm run test:all 全部通过；local quality gate validate、resource boundary、16/16 trigger eval、JSON、Context validate 与 git diff --check 均通过。
- Review gate: Skipped — 用户未要求独立 adversarial review；按任务契约跳过。

## Verification

- Passed: 完整 npm run test:all、Archive 聚焦测试、local quality gate 包校验、路由 eval、真实 Session 精确提取、Context/task validate 与 diff 检查均通过。
