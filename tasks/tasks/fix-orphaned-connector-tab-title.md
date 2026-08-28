# 修复标签标题插件生成连接词碎片标题

Status: Completed (2026-08-28 11:03)
Kind: Task

## Target
- [x] T1: cleanModelTitle 确定性拒绝以连接词开头的碎片标题(如「与运行指南」),且复合短语标题(如「构建与运行指南」)不再因剥离前导动词而产生碎片
- [x] T2: 脚本 --self-test 与 skill-quality 门禁通过;已存储的碎片标题在新校验下不再被恢复(自愈)

## Result

- T1: cleanModelTitle smoke:「与运行指南」返回空,「构建与运行指南」「修复与预防认证竞态」原样保留,「同步缓存策略」「并行加载方案」不受影响
- T2: 脚本 --self-test 全部断言通过(含新增碎片回归);skill-quality 0 failed 仅既有 1281>1000 token 非阻塞警告;preservedTitle 对已存「与运行指南」返回空、对有效中文标题正常恢复
- Review gate: Skipped — 用户未要求独立 Reviewer 或对抗性审查

## Verification

- Passed: node --self-test 通过;两文件 node --check 通过;独立 smoke 验证拒绝/保留/自愈四项行为均为 true;未运行项目测试套件(用户未要求)
