# 诊断指定 Pi 会话的文件工具不可用问题

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-30 16:43) |
| Kind | Task |

## Scope

只读诊断指定 session 和本机 Pi/扩展代码，不修改会话、配置或插件，不执行原会话的业务任务。

## Execution Log

### 001 — 定位压缩后的工具声明丢失

会话 01a18778-0aaa-71a0-abc9-b46cf09ebb31 的第 342、343 行仍有成功 read，第 347 行在 2026-10-30T08:05:08.311Z 写入原生压缩 checkpoint；之后截至第 363 行没有工具调用，只有助手声称接口缺失。第 6 行 toolsAdded 含 read/bash/edit/write。

本机 Pi 1.4.0；@ogulcancelik/pi-codex-compaction 0.1.6。models-store.json 的 gpt-6-astra 同时启用 supportsAdditionalTools 和 supportsMidConvoSystemMessages。Pi 的 getResponsesToolSupport 因而选择 changes，resolveTranscriptTools 返回空 requestTools，工具通过 input 的 additional_tools 声明。扩展 index.ts 的 before_provider_request 在存在 checkpoint 时替换 input；native-compaction.ts 的 messagesToResponseItems 不处理 system/toolsAdded，replacementHistory 仅保留用户消息及加密压缩项，导致工具定义丢失。源码链路与故障时间吻合，未抓取历史请求或在线重放。

恢复建议：先备份并保留原会话；使用 /tree 回到原生压缩之前建立分支，避开该 checkpoint，并在再次压缩前停用或修复不兼容扩展。不能只停用扩展后直接依赖现有压缩点，因为其 summary 只是 checkpoint 标记。另一方案是修复请求重建时的工具声明保留与当前工具集同步，再验证原会话只读调用。此任务未执行恢复操作。

## Task Summary

未修改代码、配置或原始会话，仅保存诊断任务记录。

## Target
- [x] T1: 根据指定会话记录和工具配置解释文件工具不可用的原因，给出恢复建议并注明证据限制

## Result

- T1: 会话第347行原生压缩后停止工具调用；核对Pi changes工具声明路径及扩展覆盖input时忽略system/toolsAdded的代码，定位工具schema丢失兼容问题；给出压缩前分支或修复扩展的恢复建议。未捕获真实请求或在线验证恢复，未运行测试。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读诊断，无交付代码或配置修改
- Snapshot: session:01a18778-0aaa-71a0-abc9-b46cf09ebb31:363-lines:sha256-daedac0a9e0d430eda34e942fe47327fba078ceaa9333f78718577f45c62034b;pi-1.4.0;compaction-0.1.6
- Evidence: Execution Log 001及T1：会话时间线、模型compat配置、provider与插件源码交叉核对
- Task fingerprint: d0b66db50637851c047bfd1ab352386ffa5645604199f742fc929cc7333faaa7

## Verification

- Passed: 确认read成功先于checkpoint，后续无调用；模型支持changes声明，插件input重建缺少system分支。结论为源码与日志定位，非在线恢复成功。
