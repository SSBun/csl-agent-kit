# 实现 Pi 快速小模型命令

Status: Completed (2026-08-27 13:57)
Kind: Task

## Scope

- 首版仅实现 Pi 扩展命令；暂不实现 Codex 入口。

## Target
- [x] T1: Pi 提供一个通用命令，接收任意 prompt，并使用预设的快速小模型执行后返回结果。
- [x] T2: `quick` 预设使用 `deepseek/deepseek-v4-flash` 模型。
- [x] T3: `quick` 预设随后更新为 `deepseek/deepseek-v4-flash-vision-exp` 模型。

## Plan

1. 保持 `/quick` 一次性执行行为，仅将 `quick` 预设切换到指定模型。
2. 同步 README 中的配置示例。
3. 验证配置、模型发现与目标文件格式。

## Result

- T1: /quick 继续读取 quick preset、发送任意 prompt，并在 agent_settled 恢复原模型与 thinking level。
- T2: 用户配置与 README 示例均将 quick 设为 deepseek/deepseek-v4-flash，并保留 thinkingLevel off。
- T3: 用户配置与 README 示例均将 quick 更新为 deepseek/deepseek-v4-flash-vision-exp，并保留 thinkingLevel off。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: quick preset JSON 断言、Pi 模型发现（1M context、384K max output、thinking 与 image 支持）及目标文件 git diff --check 均通过；未运行单元测试。
