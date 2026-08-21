# 修复安装脚本关闭 Shell 会话

Status: Completed (2026-08-21 10:37)
Kind: Task

## Scope

- 包含：兼容安装包装脚本在直接执行或被当前 Shell 加载时，安装命令结束后把控制权交还调用方，并保留 CLI 退出状态。
- 不包含：重设计安装流程、目标选择或安装产物。

## Target
- [x] T1: 按项目支持的安装方式运行安装脚本后，调用方 Shell 会话保持存活并重新获得控制。
- [x] T2: 安装流程原有成功、失败退出状态及安装结果不因修复而失真。
- [x] T3: 根因由可复现命令或静态控制流证据确认，并留下与风险相称的回归保护或确定性检查。

## Plan

1. 对比直接执行与加载执行，定位导致调用方 Shell 退出的控制流。
2. 让兼容包装脚本安全返回，同时保持 CLI 的成功和失败状态。
3. 增加聚焦回归保护，并执行语法、安装 dry-run 与 Shell 存活检查。

## Result

- T1: 隔离的 Bash 与 zsh 加载调用在安装成功和参数失败后均打印 alive，调用方会话继续执行。
- T2: 直接执行、Bash 加载和 zsh 加载均观测到成功状态 0、未知参数失败状态 2；安装使用 dry-run。
- T3: 修复前直接执行打印 alive、加载执行在 exec 后提前结束；现已用子 Shell 包装并添加聚焦回归用例。
- Review gate: Skipped — 用户未请求独立 adversarial review。

## Verification

- Passed: bash -n、node --check、git diff --check 均通过；直接/Bash source/zsh source 的 dry-run 与失败状态探针均通过。
