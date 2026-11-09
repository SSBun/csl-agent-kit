# 修复 Memory 失败批次并恢复队列处理

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 14:36) |
| Kind | Task |

## Target
- [x] T1: 当前已发现的超时和索引读取失败得到修复或恢复，相关批次成功完成。
- [x] T2: 两个受阻项目的后续 Memory 队列恢复推进，并核对恢复前已有变更，保留有效记忆。

## Scope

处理本次确认的两个失败会话批次及其队列阻塞；先用现有恢复入口，只有再次失败且证据支持时才修改实现。不清空或丢弃批次，不伪造完成，不放宽写入保护。

## Task Summary

未修改程序代码或组件配置。通过现有显式重试入口恢复两个失败批次；后台 Memory Agent 按现行条件写入机制维护记忆，已有事务历史保留。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 核对现有证据后使用两次定向retry解决阻塞，无新增代码、依赖或重试机制。 | 无已知实质缺口。 |
| 稳定性 | A | 两批真实completed凭据、两个后续事件running；核对原事务和新事务连续hash及当前源码，未丢弃批次或放宽保护。 | 验证不保证未来模型调用不会超时或生成错误路径；没有运行测试套件。 |
| 完整性 | A | 已确认的两批失败全部完成且两项目队列推进，满足本次恢复目标。 | 积压仍由后台继续处理；没有承诺全部排队清空。 |

## Plan

1. 核对失败事件、实际索引路径和已提交事务。
2. 显式重试两个阻塞头，观察真实处理结果；若再次失败则据新证据修复。
3. 核对完成凭据、已有记忆保留及两个项目后续事件推进。

## Execution Log

### 001 — 目标确认与根因核对

用户确认修复目标。恢复前服务running、active=[]、failed=2、queued=39。skills失败路径中的主题文件名漏掉9b6e4493，索引中实际完整路径存在且可读；不是存储索引丢失，不应新建错误路径或忽略必需文件错误。native-short-reader的五分钟超时发生在事务提交后约2秒。

已读取事务16f6e2b5-c239-4545-a6ff-ba04de76f545的完整before/after与source，状态committed且source匹配原事件fffb7e4e2c21b7ddb4120c07ec2a4a95e2744b34d736d9c20267a2504c4e83ff；当前manuscript-hybrid-preload条目hash与afterHash完全一致（ab4c48ddfee690d23a568e20e72b4b499ac0c9e10b39ccd933f621ffdb5d90b3），有效更新未丢失。skills失败未记录effects。两级索引generation稳定且pending=false。

### 002 — 定向恢复已启动

通过现有memory retry分别重试cbf76d340ed092b08c51adb7cb4b497d8f45c61255f37bed1acab547f953b802和fffb7e4e2c21b7ddb4120c07ec2a4a95e2744b34d736d9c20267a2504c4e83ff各一次。返回queued；这不是完成证据。现有执行器会提供previousEffects并按当前revision/hash写入。尚待确认实际完成及后续推进，未修改代码或服务配置。

### 003 — 恢复成功及变更保留

2026-11-05T06:34:48Z 两个原失败ID均返回completed、retired=true，证明执行器成功完成并留下去重凭据。两个后续事件分别在06:34:12Z（skills，9eb9e3645ff26b2eaded39ce0b8786244b2136812edbbd6da28f5c84604cc0d4）和06:34:19Z（native-short-reader，be762673054b51cdd8b0700aa69b5e5e209e4e2afb745b93c481ff4bbb1d480e）进入running。服务running、running=2、queued=39，无failed/interrupted，schedulerError=null、maintenanceErrors=[]。新会话持续入队，排队总量不是完成批次数。

超时批次重试新增事务3a513caa-1967-48ad-8550-40c681c4dc4d，其beforeHash等于原事务afterHash，更新同条目的revision 2→3，原审计保留。已阅读两份实际Swift源码，确认外部SPI preload为空实现、RN preload固定返回disabled；新变更纠正过时外部预加载结论，并保留页内与缓存边界，不是重复提交。原失败在现有机制下恢复成功，无须修改程序、重建索引或放宽失败保护。

## Result

- T1: 两个原失败事件cbf76d…b802和fffb7e…83ff经各一次显式retry均completed、retired=true；不是手工完成或丢弃。路径误抄且实际索引可读，超时原事务完整保留，现有机制恢复成功，无代码修改。
- T2: 2026-11-05T06:36:15Z两个项目的首个后续事件也均completed；全局running=2、queued=37、无failed/interrupted、schedulerError=null、maintenanceErrors=[]。原事务16f6e2b5与新事务3a513caa均committed且after/before hash连续，新内容与实际Swift源码相符。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 限定两个已知失败的显式恢复，现有版本条件写入与去重机制不变，实际完成凭据及审计已核对。
- Snapshot: operational:completed-receipts:cbf76d340ed092b08c51adb7cb4b497d8f45c61255f37bed1acab547f953b802,fffb7e4e2c21b7ddb4120c07ec2a4a95e2744b34d736d9c20267a2504c4e83ff;commits:16f6e2b5-c239-4545-a6ff-ba04de76f545,3a513caa-1967-48ad-8550-40c681c4dc4d
- Evidence: Execution Log 001-003及最终2026-11-05T06:36:15Z只读核对；未运行单元或项目测试。
- Result clarity: 用户确认修复当前两批失败并恢复队列，不要求清空全部积压或更改调度机制。
- Bounded impact: 只对两个失败ID调用现有retry，各一次；后续由原调度器处理。没有更改源码、超时或错误判定。
- Low risk: 原事务在重试前核对committed及当前hash；恢复保留previousEffects、CAS及审计，没有删除或伪造完成。
- Sufficient verification: 两原批次及两个首后续批次均completed；原审计保留、新旧事务hash连续且源码支持更新；真实服务无失败/中断和调度错误。
- Task fingerprint: 5bb3c97775b64faf53a7703a15aef527c45005ad99a18015a4399b6681bbf9bb

## Verification

- Passed: 06:36:15Z再次读取两原批次与两后续批次完成凭据，核对两事务仍committed且hash连续；running=2 queued=37，后台继续处理。恢复已验证，不承诺未来模型请求不再失败。
