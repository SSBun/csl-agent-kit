---
schema: csl-memory/v2
id: legacy-context-9cdf026514a05e858751
revision: 3
type: reference
title: 项目评测布局与验证边界
summary: evals仅限本仓库；项目symlink发现，结果默认忽略；provisional评测不证明真实模型交互。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-project-evals — Project-local evaluation
    workspace:1
  - evals/README.md#项目级激活
  - "evals/skills/task-target-alignment-eval/SKILL.md#Workspace Boundary;
    #Workflow; #Safety and Cost; #Maintainer Checks"
updated: 2026-11-06T11:20:18.984Z
deleted: false
retrieval:
  aliases:
    - 项目评测
    - evals
    - task-target-alignment-eval
    - provisional
    - report-only
  situations:
    - 修改项目评测布局或Skill发现边界
    - 判断Task Target评测结果的适用范围
  topics:
    - 评测/项目布局
    - 评测/证据边界
  links: []
---

evals/仅供本仓库，不进入共享skills、npm、全局安装或Pi共享命令。scripts/放跨suite工具，<suite>/放cases与文档，skills/<name>/为评测Skill源码；.agents/skills/<name>仅用相对symlink发现。生成predictions与报告默认留ignored results/，持久产物另需明确许可。

Task Target评测：labels人工裁定前保持provisional／report-only；prepare不含oracle，仅比较相同v6 dataset hash。固定候选、索引匹配与确定性检查不证明语义蕴含、自由生成或真实工具等待行为。付费模型、行为检查、self-test及项目测试按当前明确授权执行；不伪造结果，不保存隐藏推理、凭据或未脱敏会话。

布局约束查evals/README.md；v6探索／实现、接受来源、评分维度、检查命令查evals/skills/task-target-alignment-eval/SKILL.md及evals/scripts/evaluate-task-target-alignment.js。
