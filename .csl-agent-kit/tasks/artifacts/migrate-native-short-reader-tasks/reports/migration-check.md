# native-short-reader Task 迁移检查

## 已验证结果

旧 tasks 整树已通过官方 apply 切换至 `.csl-agent-kit/tasks`。迁移标记为 unified，迁移 state 为 completed。清单标识为 task-storage-20261112，清单 SHA256 为 5e32933cb134efa2243feabfa5fcecb84f96f66b76b9d5b3d06cafb8ad627faf。

新目标、before 原文备份及 retired-tasks 保留原树均独立逐项复算：1067 文件、294 目录，摘要、大小、权限和目录集合均匹配清单。旧活动 tasks 根不存在。57 份可变记录仅应用清单中的链接转换，历史产物原文不变。421 份任务中397份可通过当前核心单独读取，原迁移任务 show 成功；Topic check 通过且规范 revision 未变。

恢复材料位于目标项目 `.csl-agent-kit/migrations/task-storage-20261112/`，原清单及备份未覆盖。Memory 和业务代码不在迁移范围。

## 未完成验收

完整 list 原被24份既有非标准状态记录阻断；用户随后明确授权删除，已删除24份记录及24条对应索引项，CLI list 恢复并返回397份任务。真实项目 Pi 窗口未独立操作；直接加载当前面板模块、模拟UI并读取真实目标项目数据，确认标题、进度、文件链接和 focus 均解析新根，采样窄屏无溢出。未运行单元测试或项目测试，未提交推送。独立审查在最终自检之后执行。

## 用户授权的删除范围

用户原话：“for illegal old tasks, you can just remove them”。已执行范围严格限于下列24份文件及 tasks.md 中对应24条索引项。附件、其他历史引用、迁移备份及原清单均保留。没有规范状态元数据或编造状态日期。

删除后复核新目标共1043文件、294目录；除24份已授权删除及索引精确删除对应行之外，其余文件摘要、大小、权限均匹配迁移清单。before 与 retired-tasks 各1067文件、294目录仍与原清单匹配。索引删除前SHA256为c1aefbe649979c2145e945c065cbcd2e45555990f6f4a6f583e146bc4b3ee8b7，删除后为c25c2c5e19711a0e213f538f3c1d49017da14c6961ca6ab644676075c5460c17。下列清单保留为本任务的授权范围说明，不再是待执行提案。

以下路径均相对于目标项目 `.csl-agent-kit/tasks/tasks/`：

- add-ios-short-story-get-coupon-button-anchor.md
- add-ios-vip-market-popup-svip-channel.md
- add-short-story-browse-history-method.md
- add-short-story-last-read-api.md
- add-short-story-page-style-three.md
- add-short-story-screenshot-protection.md
- add-source-to-hybrid-manuscript-page-anchor.md
- audit-short-story-visit-duration.md
- control-short-story-main-content-line-height.md
- diagnose-manuscript-preload-main-thread-crash.md
- document-coupon-popup-exposure-comparison.md
- fix-ios-salt-coupon-popup-anchors.md
- fix-short-story-page-source.md
- fix-short-story-preload-main-thread.md
- fix-trial-fade-after-purchase.md
- group-local-changes-into-commits.md
- log-story-header-badge-models.md
- mock-marketing-activity-failure.md
- pass-real-paragraph-range-to-short-story-report.md
- report-page-disappear-for-reader-overlays.md
- research-vip-short-work-report-url.md
- rfc-fix-marketing-popup-anchor-underreporting.md
- stop-marketing-activity-info-retry.md
- wire-short-story-browse-history-lifecycle.md
