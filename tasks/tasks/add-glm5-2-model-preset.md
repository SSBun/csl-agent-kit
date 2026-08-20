# 添加 glm5.2 模型预设

Status: Completed (2026-08-20 14:40)
Kind: Task

## Target
- [x] 在 `~/.pi/agent/presets.json` 添加预设 `glm5.2` → `{provider: "glm", model: "glm-5.2", thinkingLevel: "off"}`，保存后 `/preset glm5.2` 可切换成功。

## Plan

1. 在 presets.json 中追加 glm5.2 预设。
2. 验证 JSON 有效，并确认扩展加载逻辑接受该条目（glm-5.2 非推理模型，off 合法）。

## Result

- 已追加 `glm5.2` 预设并通过扩展真实加载路径验证：`/preset glm5.2` 通知 `Preset "glm5.2": glm/glm-5.2 · off`。
