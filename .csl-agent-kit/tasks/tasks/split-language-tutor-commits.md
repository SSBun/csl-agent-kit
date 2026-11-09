# 按功能拆分已推送的插件提交

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-21 18:14) |
| Kind | Task |

## Task Summary

**插件 Git 历史**：[仓库](file:///Users/caishilin/Desktop/personal/pi-language-tutor) 将原提交拆为 SQLite 保存、浏览窗口、确认删除、句子强调和词汇展示五个提交，远端 feat-grammar-history 更新至 b321b6360c330b6874d26474fbdbc7b55df90323；原提交保留在本地 chore-backup-grammar-history-61f68d6 分支。最终源码未变。

## Target
- [x] T1: 将 feat-grammar-history 上的 61f68d6 拆分为按独立功能或关注点组织的 conventional commits。
- [x] T2: 拆分后的最终文件内容与原提交完全一致，不丢失功能或用户数据。
- [x] T3: 同步更新 SSBun/pi-language-tutor 的同名远端分支，不改 main；远端出现新提交时停止覆盖。

## Result

- T1: 独立提交 d91c4ea SQLite保存、5410005 浏览、3bab8fa 删除、f4b7b78 句子强调、b321b63 词汇展示；每个提交单独导出并通过tsc和嵌入JS语法检查。
- T2: HEAD^{tree} 与原61f68d6完全相等；git diff backup HEAD为空，工作树干净；保留本地备份分支chore-backup-grammar-history-61f68d6。
- T3: 使用精确旧SHA的force-with-lease成功更新origin/feat-grammar-history；ls-remote为b321b6360c330b6874d26474fbdbc7b55df90323，与本地一致；未改main。
- Review gate: Skipped — R1 可恢复的Git重组且树等价与提交边界已验证。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅已授权的提交历史重组，最终内容字节级不变且原历史有备份。
- Snapshot: b321b6360c330b6874d26474fbdbc7b55df90323
- Evidence: 最终tree相等、五次中间提交类型与JS检查、精确lease及远端SHA一致。
- Result clarity: 用户明确确认拆分和同分支历史更新。
- Bounded impact: 仅个人fork功能分支；无main或源码内容变更。
- Low risk: 备份原历史并用精确lease防止覆盖远端并发提交。
- Sufficient verification: 五个中间提交均可类型检查；最终tree完全相同，格式检查通过，未运行测试套件。
- Task fingerprint: e49e42bd5fecb33e270dbe5af563873044ad2306e159c00c276f1a19d56d1d24

## Verification

- Passed: 远端和本地均b321b6360c330b6874d26474fbdbc7b55df90323；工作树干净、tree相等；未运行测试，功能分支push不触发CI。
