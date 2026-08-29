# 项目评测工作区

`evals/` 是 CSL Agent Kit 仓库专用的评测根目录。这里保存评测套件、跨套件脚本和评测 Agent Skills；它不属于共享 `skills/` 分发树，也不进入 npm 发布清单或全局安装。

## 结构

- `task-target-alignment/`：Task Target Alignment gold cases、suite 说明和未来报告边界。
- `scripts/`：跨评测套件复用的确定性 validator、runner、scorer 与 compare 工具。
- `skills/`：评测专用 Agent Skills 的 canonical source。
- `<suite>/results/`：生成的模型 predictions 和报告，默认不纳入版本控制。

## 项目级激活

评测 skill 的源码只保存在 `evals/skills/<name>/`。需要项目内发现时，在 `.agents/skills/<name>` 建立指向 canonical source 的相对符号链接；不得复制到共享 `skills/`、全局 skill 目录或发布 manifest。这样 Codex、Claude Code 与 Pi 可使用同一项目级入口，而共享 CLI 与安装器不会暴露评测 skill。

## 约束

- Oracle cases、schema、固定 prediction samples 和确定性脚本可提交；provisional labels 在人工 adjudication 前保持 report-only。
- 付费模型运行必须由用户明确授权，不得藏在普通单元测试或默认检查中。
- 不保存 chain-of-thought、凭据、客户数据或未脱敏完整会话。
- 真实失败进入 corpus 前必须脱敏、最小化、人工标注并配套 contrast case。
