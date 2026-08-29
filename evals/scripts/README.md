# 评测脚本

此目录保存多个评测套件共用的确定性 Node.js 工具。脚本默认离线运行，不持有模型凭据，也不把付费模型调用加入普通测试。

`evaluate-task-target-alignment.js` 提供：

- `validate`：校验 64-case v2 corpus、L0–L4 decisions、S0／S1 overlays、contrast pairs 和 reason requirements。
- `prepare`：生成不含 oracle 的 model request JSONL。
- `score`：计算 under／over guard、L2 checkpoint、L3／L4 mode、Safety Overlay、reason、transition、family 和稳定性指标。
- `compare`：比较 baseline 与 candidate report，列出逐 case regressions。
- `--self-test`：验证 perfect baseline 以及 under-guard、over-guard、checkpoint、L3／L4 和 safety regressions。

该脚本不调用模型；host／provider adapter 只负责把 `prepare` 输出转换为 prediction JSONL。
