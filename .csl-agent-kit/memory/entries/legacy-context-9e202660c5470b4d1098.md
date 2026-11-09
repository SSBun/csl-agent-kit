---
schema: csl-memory/v2
id: legacy-context-9e202660c5470b4d1098
revision: 4
type: fact
title: Pi 标题生成与共享 UI 状态
summary: 中文标题4–24码点；有界对话自动或/title刷新。保持重写所属历史值；无历史、模型失败或无效输出不覆盖。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-tab-title — Pi terminal tab title refresh:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-28 为模型生成的短 UI 标签设置确定性边界:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-28 共享 UI 状态的“保持”不能等同于无操作:1
  - "skills/meta/agent-hooks/scripts/refresh-tab-title.js#SYSTEM_PROMPT;
    #applyTitle; #runWorker"
  - skills/meta/agent-hooks/hooks/refresh-tab-title.md
updated: 2026-11-06T11:21:01.801Z
deleted: false
retrieval:
  aliases:
    - Pi终端标题
    - /title
    - refresh-tab-title
    - 共享UI状态恢复
    - KEEP_CURRENT_TITLE
  situations:
    - 修改标题刷新、格式约束或上下文来源
    - 排查保持标题未恢复宿主覆盖值
    - 区分保持、无历史值与生成失败
  topics:
    - Pi/标题
    - UI/状态恢复
  links: []
---

inner:refresh-tab-title写终端OSC标题，不改Pi session metadata。标题描述当前工作，中文、4–24 Unicode码点、含汉字；可保留技术术语和数字，不带目录前缀或模型元标签。代码强制格式与纯操作输出边界，不能仅靠prompt。

带prompt的before_agent_start触发prompt-submit；独立模型仅接收当前保存标题及活跃分支用户／Assistant文本与最新prompt，上下文最多12,000字符，排除工具、thinking、图片、项目文件及主Agent上下文。Compaction completed. Continue.内部续接提示确定性跳过。

自动刷新非阻塞、无toast；/title手动刷新，参数追加为最新请求。派发失败立即报告原始错误且不监听；成功派发后报告refreshed／unchanged／failed／timed out。

原标题仍准确或上下文不足时保持；新标题须脱离最新消息也能表达当前工作。保持在TTY锁及latest-token检查内重写该workspace最后成功标题，以恢复可能被宿主覆盖的共享状态；无历史值不写。模型失败、无效输出不覆盖已有值，不能与保持混同。

权威：pi/extensions/csl-context-hooks.ts、skills/meta/agent-hooks/scripts/refresh-tab-title.js；回归入口tests/pi-context-hooks.test.mjs、tests/agent-hooks.test.js。
