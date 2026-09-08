# 评测脚本

此目录保存多个评测套件共用的确定性 Node.js 工具。脚本默认离线运行，不持有模型凭据，也不把付费模型调用加入普通测试。

`evaluate-task-target-alignment.js` 提供：

- `validate`：校验 92-case v4 corpus、main-session L0–L4 decisions、task-plan → task Target 继承、delegated child handoff、S0／S1 overlays、contrast pairs，以及条款来源、待核对项和等待原因。
- `prepare`：生成不含 oracle 的 model request JSONL。
- `score`：计算 under／over guard、L2 等待与可见性、条目重复确认、错误来源复用、覆盖遗漏、展示 Target 不一致，以及 L3／L4、Safety、child confirmation leak、stale-plan continue、reason、transition、family 和稳定性指标；相同 level 下错误直行也会被计入 under-guard。
- `compare`：仅比较 dataset hash 一致的 v4 baseline 与 candidate report，列出包含条款错误的逐 case regressions。
- `--self-test`：验证合成 perfect baseline 及各类 guard／条款回归、来源结构和未定分区；它是测试模式，需当前用户明确授权才能运行，不证明真实模型表现。

该脚本不调用模型；host／provider adapter 只负责把 `prepare` 输出转换为 v4 prediction JSONL。条款来源按 provisional reference 精确匹配；人工需审定语义及其他有效来源，报告保持 report-only。未获测试授权时，仅运行 `validate`、`prepare`、语法与结构检查。
