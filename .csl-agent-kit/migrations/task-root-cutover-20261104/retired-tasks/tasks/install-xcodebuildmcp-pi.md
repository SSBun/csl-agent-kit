# 为 Pi 安装 XcodeBuildMCP

Status: Completed (2026-08-07 13:21)

## Target

- [x] T1: XcodeBuildMCP 按上游支持方式安装并注册到当前用户的 Pi MCP 配置。
- [x] T2: Pi 能发现并连接该 server，且可列出其工具或返回明确的运行依赖状态。
- [x] T3: 安装仅修改必要的用户级配置，不影响现有 MCP servers。

## Plan

1. 核对 XcodeBuildMCP 上游安装说明、Pi 扩展机制和当前 MCP adapter 配置。
2. 使用最小受支持方式安装并注册 server。
3. 在 Pi 中连接并验证 server 状态、工具发现和既有配置保留情况。

## Result

- T1: 在用户级共享 MCP 配置 `/Users/caishilin/.config/mcp/mcp.json` 中注册 `xcodebuildmcp`，使用上游支持的 `npx -y xcodebuildmcp@latest mcp`；首次连接已缓存 `xcodebuildmcp@2.7.0`。
- T2: 新 Pi 进程成功连接 server；Pi 报告 28 个可用项，缓存证据为 24 个 tools 加 4 个 resources。
- T3: 配置仍同时包含 `tolaria` 与 `xcodebuildmcp`，原有 `tolaria` 定义未改变。

## Verification

- `npx -y xcodebuildmcp@latest --version` → `2.7.0`
- `npx -y xcodebuildmcp@latest tools` → 72 canonical / 100 total CLI tools
- `pi -p --no-session --thinking off --tools mcp ...` → `已连接`，`工具数量：28`
- `jq` 检查 `mcp-cache.json` → `24 tools + 4 resources`
- Review gate: Skipped — 用户未要求独立 adversarial review。
