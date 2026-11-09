# 配置并验证 GLM-5.3-Flash

Status: Completed (2026-08-27 14:11)
Kind: Task

## Target
- [x] T1: Pi 模型选择中可使用 glm-5.3-flash，且不移除现有模型配置。
- [x] T2: 使用当前已配置的 GLM/Z.AI 凭据实际调用 glm-5.3-flash 成功并得到响应。

## Plan

1. 在当前已认证的 `zai-coding-cn` Provider 中补充模型定义并保留其他条目。
2. 检查 Pi 可发现该模型。
3. 通过 Pi 模型运行时实际调用并核对响应。

## Result

- T1: python3 -m json.tool 验证 models.json 合法；pi --list-models 显示 zai-coding-cn/glm-5.3-flash（1M、thinking、images），原有 glm 与 zai-coding-cn 模型仍在。
- T2: 通过 Pi ModelRuntime 使用默认 zai-coding-cn 凭据实际调用 glm-5.3-flash，返回 stopReason=stop、text=GLM_FLASH_OK、50 tokens。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 配置语法、模型发现、既有目录保留与真实 API 调用均通过。
