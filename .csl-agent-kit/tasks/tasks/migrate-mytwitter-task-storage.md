# 迁移MyTwitter任务存储并恢复读取

| Field | Value |
| --- | --- |
| Status | Blocked (2026-11-10 14:31) |
| Artifacts | [Artifacts](../artifacts/migrate-mytwitter-task-storage/) |
| Kind | Task |

## Scope

用户确认迁移MyTwitter整棵Task树、恢复读取与继续执行，保留新目标已有产物和历史证据；用户后续明确授权仅对scripts/x-target-runtime.mjs作路径适配；不修改其他业务文件或Memory、不测试提交推送。 owning Task在skills工作区，避免目标工作区Task解析故障阻止恢复记账。

## Plan

1. 核对Task/Topic/证据/宿主和项目实际读写方的目标路径兼容性。
2. 解决新目标孤立产物归属与兼容阻塞后，正式prepare/apply并核对完整清单及CLI。
3. 当前受阻于项目执行脚本硬编码旧路径，先取得边界变更决定，未搬移任何目标工作区文件。

## Execution Log

### 001 — 已确认范围与实际预检

用户已确认目标。旧Task树2544文件；无tasks/.topic-write.lock，lsof未发现cwd为MyTwitter的Pi进程。Memory project preview为current，不迁移或备份Memory。宿主task_focus实际返回csl-task-storage/v1，overlay源码details含storageRoot/storageSchema，核心、Topic共用task-storage解析。

新目标唯一文件为artifacts/publish-codex-astro-consumption/evidence/action.json，701字节，SHA256 b2f62d6a7d09e63af95ec98ad37b6e821dacc0dda2379eca93d2e15a48839390；旧树无同名文件，无需覆盖。尚未移动该文件或生成备份，可在兼容阻塞解决后通过显式清单保留并纳入迁移。

### 002 — 项目读写方不兼容

scripts/x-target-runtime.mjs第8—11行将defaultStatePath/expectedSource固定为tasks/topics/...；第132行读取默认状态，第158行校验source身份，第500和611行将恢复授权绑定到tasks/artifacts。迁移后Task核心能解析逻辑tasks引用，但这个项目脚本没有使用该解析器，因此默认执行及失败恢复会读旧根。只有该脚本被rg识别为硬编码Task子路径的项目执行脚本。当前已接受范围禁止修改业务文件；不能通过符号链接、双写或遗留旧权威树掩盖兼容问题。未执行prepare/apply、未改业务或Memory、未测试。

### 003 — 已执行正式迁移与读写适配

用户明确同意单脚本路径适配。脚本增加遵循Task标记的逻辑路径映射，覆盖默认state、显式旧根state、恢复授权和两处历史证据路径；expectedSource保持逻辑身份，不修改动作/授权/重发逻辑。语法检查通过。

原新目标树经原子no-replace保留至migrations/task-storage-20261110-existing-target，唯一action.json按原hash/权限加入原树，随后正式prepare/apply。迁移清单含2545文件，59份可变文档仅重定位链接；原树保留retired-tasks、独立before备份，unified标记由工具提交。没有手工补完成标记。

### 004 — 当前验证及范围限制

verify.cjs实际核对全部2545目标文件的SHA256/大小/权限、retired原文hash，旧根不存在；当前target-engagement-50-current从新根读取In Progress，脚本validate只读成功，98个range状态保留。未执行X动作、测试、提交或推送。list命令另因15份旧任务格式错误失败，逐份对retired原文调用相同parser确认迁移前后同样失败；未改写这些历史记录。宿主UI未直接重开验收，需在MyTwitter会话重载支持新路径的面板。

### 005 — 独立审查与宿主观察

首轮fresh Reviewer(gpt-6.1-sol:low)未发现迁移新增缺陷；TR-1为完整恢复验收缺口：全量list仍失败、真实面板尚未核对。反馈原样保存reviews/round-01.md。父桥接结束核对before与retired各2545文件/448目录全量集合、hash、大小、权限一致；原action四份副本hash和0644一致；59份变动只限可变Task/Topic，其余beforeHash=afterHash。

已使用agent-desktop只读观察iTerm2（accessibility/screen recording granted），当前窗口π-skills。AX树可见π-MyTwitter标签但disabled，未对其发送点击或物理按键，也未擅自输入任务命令。无法凭此证明MyTwitter面板标题/进度/focus已更新；GUI验收仍欠缺。未修改15份历史格式错误记录。

### 006 — 用户选择删除错误记录

用户明确要求删除15份错误任务记录。独立任务remove-invalid-mytwitter-task-records已逐份复核原错误后删除这15份活动记录及6条实际存在的索引条目，产物证据、状态资源、Topic及迁移备份不动。迁移后当前树出现此项用户授权变更，不能再按原2545文件快照声称当前树逐字不变；迁移原始清单仍为历史交接证据，不修改。实际core.listTasks读取544份，真实CLI list exit0，原全量列表阻塞已消除。MyTwitter面板GUI仍未验收，后续复审应包含删除清单及新身份。

## Review

- Schema: task-review-ledger/v1
- Pass: 1
- Next finding: 2
- `TR-1` | no-progress=0 | T1完整恢复验收 | 列表原格式问题经用户授权删除后已解决；补实际MyTwitter面板核对，并刷新包含删除记录的迁移后身份复审。

## Block

- Reason: 存储迁移、当前任务读取及全量列表现已正常；MyTwitter宿主面板没有可操作的语义入口完成GUI核对，原审查快照也需纳入用户授权删除记录后刷新。
- Unblock when: MyTwitter面板可见且可只读核对标题、进度、链接和focus后，刷新自检及迁移后身份，重新独立审查。

## Task Summary

MyTwitter整棵Task树已切换至.csl-agent-kit/tasks，保留原目标产物及恢复材料；x-target-runtime.mjs仅适配Task物理路径，不改逻辑身份和执行保护。全文件清单验证及当前任务读取通过；全量列表仍受15份原有格式缺陷影响，未声称所有历史任务可解析。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用正式迁移器，仅一份业务脚本适配，无符号链接或双写。 | 项目独立运行脚本保留少量标记解析代码。 |
| 稳定性 | A | 2545文件完整hash/权限核验，原树恢复材料保留；当前任务和状态实际读取成功。 | 未运行测试或执行外部动作，未验证真实GUI。 |
| 完整性 | B | 迁移与兼容适配均已执行，新目标产物保留。 | 15份迁移前已有的历史格式缺陷仍阻塞全量列表，明确披露，不改写历史。 |

## Result

T1：存储迁移完成，2545文件与清单匹配、unified标记有效、当前任务及执行状态读取通过；历史列表原有格式错误未修复。详细可复验脚本见../artifacts/migrate-mytwitter-task-storage/evidence/verify.cjs。R2等待独立审查，任务尚不完成。
- Review gate: Required — R2独立审查义务。
## Target

- [ ] T1: MyTwitter旧Task树完整迁入统一根，保留新目录已有产物及历史证据，CLI与Task读取恢复。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 跨仓库Task根迁移和执行脚本路径适配，历史证据及恢复链路需独立复核。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/migrate-mytwitter-task-storage/evidence/658a8afda6dc33ab9417208d2bf2416e833db7a8c4d43465c0993ad85bf9f9c3.json#658a8afda6dc33ab9417208d2bf2416e833db7a8c4d43465c0993ad85bf9f9c3
- Evidence: Log003—004、verify.cjs：2545文件hash/权限完整核对，当前任务及状态读取通过；15份原有历史格式缺陷迁移前后同样失败，GUI未验收，未运行测试。
- Task fingerprint: 0cb56235207a5ebe359d91c8d4748d172b12c2c1f35feaf671fbefb7ca026e16
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/migrate-mytwitter-task-storage/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/migrate-mytwitter-task-storage/evidence/658a8afda6dc33ab9417208d2bf2416e833db7a8c4d43465c0993ad85bf9f9c3.json#658a8afda6dc33ab9417208d2bf2416e833db7a8c4d43465c0993ad85bf9f9c3 | findings | 1f1f056cd2a427a035c1866fcbf6fa9f4746715f1046cf71511dbb9126f448c6 |
