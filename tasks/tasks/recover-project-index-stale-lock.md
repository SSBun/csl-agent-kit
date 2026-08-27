# 安全回收 Project Index 陈旧写锁

Status: Completed (2026-08-27 11:55)
Kind: Task
Parent: fix-selected-audit-findings

## Scope

- 只修复本机 Project Index 写锁的崩溃恢复；保留单写者、原子索引写入、活锁拒绝与数据校验边界。

## Target
- [x] T1: Project Index 写锁在持有进程已不存在时可安全回收，并在活锁存在时继续拒绝并发写入。

## Plan

1. 让新写锁记录可验证的持有进程身份。
2. 仅在持有进程不存在时原子隔离并回收陈旧锁，其他锁继续失败关闭。
3. 以隔离数据目录验证陈旧锁恢复与活锁拒绝。

## Result

- T1: 隔离 CLI smoke 观察到死 PID ticket 被回收、活 PID ticket 与新鲜 legacy lock 拒绝写入、10 分钟旧 legacy lock 被回收，最终 index validate=true 且无残留 ticket。
- Review gate: Skipped — 用户未要求独立 Reviewer；已对并发创建、双恢复者、崩溃窗口和活锁误删风险完成本地自审。

## Verification

- Passed: 隔离 CLI lock smoke、node --check/help、Yao validate、resource boundary（996/1000 initial-load tokens）与 whitespace check 均通过。
