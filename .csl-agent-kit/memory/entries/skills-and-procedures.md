---
title: 技能与流程生态
summary: Skill与SOP的组织、发现、导入、分发及编写原则；包括项目理解工具的职责边界。
---

- [2026-11-05] 第三方整合入口仅本仓库，vendored叶子放skills/<source-group>/<skill>/，.repository.json保留repository/sourcePath/ref/commit/license/upstreamStatus，许可证在来源分组根。数量现场查询；status按来源/ref复用临时检出并比较导入commit，diff区分上游新增变化和相对本地差异，--patch才输出逐行补丁。
- [2026-11-05] 共享CLI/Pi递归枚举skills叶子，以frontmatter名称公开；项目流程在受版本控制的.agents/skills/，排除共享发布、全局安装及共享命令，检查链接不会重新暴露并移除仅为此生成链接的选项。Pi slash alias默认转Skill请求；archive使用调用前会话文件、工作区与active leaf，归档命令和压缩摘要不当原始对话。
- [2026-11-05] 移动、删除或重命名Skill/alias时 MUST 检查README、manifest、安装枚举、规则、Authority、测试和路径构造；解析根变量、相对路径与生成消费者，MUST NOT 只搜完整旧字符串。只暴露canonical替代名、确认当前路径存在，不批量改历史；导入更新还核对来源元数据与发布包内容。
- [2026-11-05] 分发技能的运行指导 MUST 随包自包含，项目RFC除非明确纳入否则仅背景；Agent模板/example不含作者机器include，私有配置可有。孤立agents接口目录先查运行及打包依赖，仅无用途且获授权时删除。
- [2026-11-05] 要求清空目标再列候选时，保持清空结果，推荐不授权重装。Caveman压缩自然语言冗词，Ponytail约束代码清晰和实现规模；可互补，不因都强调简洁就当作重复。
- [2026-11-05] 本机~/Desktop/test/skills是mattpocock/skills参考仓，按engineering/productivity/misc/personal/in-progress/deprecated分类；使用前 MUST 复核路径。
- [2026-11-05] 同frontmatter name的SOP按项目>用户>内置暴露，发布无独立注册表。目标根为项目.csl-agent-kit/sops/、用户CSL_AGENT_KIT_HOME/sops/、内置随技能分发，仅迁Kit数据。过渡发现器仍读.agents/sops/，用户支持CSL_AGENT_KIT_SOPS_DIR；规范更新不证明安装读写方切换，MUST 确认兼容后显式迁移，不双写或凭目录猜权威，不扩张搬迁授权。
- [2026-11-05] Native hooks用sop-summaries生成摘要、sop-candidates路由，Pi传ctx.cwd；发现/注入改变时 MUST 核对脚本、Pi适配与对应回归，源码或测试不证明已加载。代码风格入口为agent-sops的code-style SOP，语言细则在references/code-style/，Swift为swift-style.md。
- [2026-11-05] SOP确认模式以agent-sops的Priority boundary为准；SOLO只跳过授权范围内确认暂停，身份、防重复、平台限制和验证保留，不通过改用户SOP切换模式。
- [2026-11-05] SOP示例默认轻量元数据version/update_date，不无需求加入id、owner及多级审批治理字段。语言服从现行指令，无全文要求时MUST NOT 把局部字段约束扩大到全文。Swift具体风格按主题收录，只对精确语法/布局配最小代码例，适用顺序归主SOP。
- [2026-11-05] Repo Map聚焦经文件结构、CodeGraph、调用关系和代码阅读确认的职责、边界、关键类型与流程，不重复显见项目名/语言/框架inventory或展开实现细节。
- [2026-11-07] 安装--all/--target按显式选择，--yes用默认codex-plugin且不读保存选择；交互复用有效保存值，无值时也默认codex-plugin。目标为cursor/codex-plugin/pi，不替换全局指令文件，拒绝super-agent旧选项。同次多选提交已授权同一范围，不追加通用确认；范围或不可逆风险变化、Task目标及独立安全门仍保留。移除prompt须同步移除读取和guard。
- [2026-11-09] 工具包内置SOP仅保留code-style及其语言参考；用户明确选择将其余平台和专门场景SOP归用户级。macOS五项、swift-api-design及monospace-circuit-diagrams位于~/.csl-agent-kit/sops/，相关依赖参考随SOP放在用户级，后续维护 MUST 保持相对引用有效。
