---
schema: csl-memory/v2
id: legacy-context-3f04e0f0972b0b999ca0
revision: 3
type: reference
title: Skill 质量门禁与变更验证边界
summary: 确定性门禁不证明模型行为；workflow完整性优先预算warning。共享格式核对全部读写方，新旧记录分开校验，发布核对最终远端CI。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:CTX-skill-quality
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    sections:2026-07-23 Workflow skill 完整性优先于初始加载预算;2026-07-31
    共享格式迁移必须覆盖所有读写方;2026-07-29 用目标化检查阻止历史样例覆盖新记录契约;2026-07-31 发布完成前必须验证最终远端 CI
  - skills/meta/skill-quality/SKILL.md
  - skills/meta/skill-quality/scripts/check.js
  - AGENTS.md
updated: 2026-11-05T11:16:54.996Z
deleted: false
retrieval:
  aliases:
    - skill-quality
    - 1000-token
    - 共享格式迁移
    - headSha
    - 最终远端CI
  situations:
    - 修改Skill后选择验证入口
    - 处理workflow预算警告
    - 修改共享文件格式
    - 校验含历史记录的索引
    - 发布后确认最终CI
  topics:
    - Skill/质量门禁
    - 验证/兼容与发布
  links: []
---

日常Skill质量入口 skills/meta/skill-quality/SKILL.md 及 scripts/check.js：单包传<skill-dir>；--all --workspace递归检查 skills/ 与 .agents/skills/ 的叶子。共享发现递归，Claude manifest显式枚举共享叶子，项目本地包不进入共享分发。

门禁检查frontmatter、JSON/YAML、已有agents/openai.yaml、资源目录、1000-token初始加载warning；同时存在trigger_cases.json与semantic_config.json时执行确定性routing。package结果pass/warning/failure；退出码失败2、仅warning为0、调用错误1。只验证声明契约，不运行package脚本、项目测试、构建、打包、telemetry或检查非Skill规则。

修改包逐包检查，failure阻止完成；warning按语义评估。Workflow准确完整优先于加载预算，不能为消warning删除、失真压缩或拆散核心判断、步骤、状态、异常处理及完成条件，必要契约须能从主SKILL.md完整获得。行为、宿主发现、manifest与包专属验证另查对应检查；结构通过不证明行为。

共享文件格式变化：先找全部生产者、运行消费者与fixture，同改规则、校验器、消费者测试；同一候选须通过写入侧与运行解析，旧格式只留有意历史或负向断言。同索引兼容旧记录时，为当前新建/重开/更新记录提供并执行现行契约检查，旧格式或canonical不一致目标应失败；未触及旧兄弟记录不阻塞，不借机批量迁移。

向CI保护分支push、打tag或发布后：最终run的headSha须等于远端目标branch HEAD，结论success；本地测试、dry-run、registry成功及旧commit结果均不替代。失败重开owning task，修复后验证新的最终run；Result留run ID/URL及结论。
