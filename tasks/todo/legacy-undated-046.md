# 修复复审发现的全部问题

## 计划

- [x] 为自定义 tips 路径、C locale Unicode 边界、Node 18 测试面和发布版本归属补回归检查。
- [x] 统一 Pi 与 shell readers 的 `CSL_AGENT_KIT_TIPS_FILE`/`CSL_AGENT_KIT_TIPS_DIR` 路径解析。
- [x] 使用 Node Unicode code-point 计数替代 locale-sensitive 的 Bash/AWK 长度计算。
- [x] 将未发布功能移回 CHANGELOG `[Unreleased]`，保留已发布 `2.0.0` 的真实内容，不执行版本发布动作。
- [x] 拆分 Node 18 CLI/tips 测试与 Node 22.19+ Pi 测试，并在 CI 覆盖两条运行时边界。
- [x] 运行 Node 18/20/22、全量检查、npm pack、trigger eval、Yao audit 和 diff 验证。
- [x] 调用独立只读 Pi reviewer 复审完整 diff；若发现有效问题则继续修复并重复验证。

## 复核

- Pi、inject、doctor 和 add 现在按 `TIPS_FILE > TIPS_DIR > CSL_AGENT_KIT_HOME` 解析路径；跨客户端 override 回归通过。
- tips 单条与总量、doctor overlong 诊断均改为 Node Unicode code-point 计数，`LC_ALL=C` 下 120/121 个中文字符边界通过。
- tips 并发写入改用 Linux `flock` / macOS `lockf` 原生进程锁；进程退出或崩溃后内核自动释放，已有 lock file 可安全复用。doctor 改为 JSON 解析 hooks，不再依赖格式或事件名正则。
- CHANGELOG 将新功能移回 `[Unreleased]`；当前 source of truth 仍为已发布 `2.0.0`，package-lock 无需变化，未执行 tag、push 或 publish。
- CI 以 Node 18/20 matrix 验证 CLI/tips，并以固定 Node 22.19.0 验证 Pi；本地 Node 18、20、22 全部通过。Node 22 共通过 26 个测试，Node 18/20 各通过 19 个并明确跳过不受支持的 Pi runtime。
- npm pack、TypeScript no-emit、Bash/Node/YAML/JSON、hook parity、trigger eval 与 `git diff --check` 通过；quick validation 通过。Yao lint、governance、resource boundary 通过，聚合结果仅保留仓库既有 `Missing agents/interface.yaml` 约定缺口。
- 两个独立只读 Pi reviewer 经过多轮复审；修复原生锁、JSON hook 解析、Node 20 CI 和 Node 22.19 pin 后，最终均返回“无发现”。
