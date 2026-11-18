---
schema: csl-memory-index/v4
formatVersion: 5
scope: project
generation: 2e70a77ef3b248db1001e7c4d386a6dfb12b3b03d078a062dd1c6e749aee3dee
count: 10
entries: entries
---

# 项目记忆索引

索引只描述当前知识。先定位主题，再读取正文及适用条件；覆盖不足时搜索全部当前正文。写入前重新读取文件hash；索引过期时以entries中的实际文件为准。

## [提交保护与命令检测](entries/commit-protection.md)

commit-guard的暂存内容检查、Git命令检查范围、Shell检测、宿主执行边界和审查说明清理条件。

sha256: 7fe6d1caad58cb0e8bb0788f025abb38b6e898887a63333c21c505ea343cf427

## [项目基础信息](entries/context.md)

项目定位、组件职责、命名、语言及本机数据边界；专题细节按当前索引读取。

sha256: 332ad4ea106565cd42222eab43278d86db1614363b75c2ae1d5de1768613e564

## [宿主与自动化](entries/hosts-and-automation.md)

宿主Hook接入、持久规则注入、信任及设置解析；区分安装、配置、实际加载与运行效果。

sha256: ea42afb412201a6c3c851348c8463d1065b4de6ebe61bb7d688326c91a53ebe7

## [交互与使用体验](entries/interaction-and-experience.md)

Pi与Memory界面的导航、标题、状态和展示偏好；覆盖CLI人类输出及近期上下文的产品需求，不承载后台调度规则。

sha256: 85039596c3ba3e433f15bf212b53301597130213c059049c6f74c8460c416778

## [记忆组织与检索](entries/knowledge-and-recall.md)

宽主题case组织、知识准入与当前正文检索；只保存当前知识，不保留来源、审查、历史或恢复副本。

sha256: 8550c8ce36dcde283b394cca45a36170b622d82328e51e05089dc722297c849d

## [通用经验](entries/lessons.md)

跨任务复用的质量检查、格式变更、证据判断、协作及Pi异常处理要求；提交保护细节见提交保护与命令检测主题。

sha256: 694e9dc4c9cb9d2ab254ae2cb5a53e6996eefd2d0be2ce2de426375e21a306e1

## [运行与数据管理](entries/runtime-and-data.md)

后台调度、队列恢复、存储身份和迁移；覆盖并发、数据保真、服务升级及本机访问边界。

sha256: ace319be23f91d2f5567293cac4ed1eb7123eba4776b814254d77679e70b478b

## [技能与流程生态](entries/skills-and-procedures.md)

Skill与SOP的组织、发现、导入、分发及编写原则；包括项目理解工具的职责边界与DDD指导方法的设计侧重点。

sha256: 5a33dcb6d1d4f66c17c8b5af5d808ab3d08da631f664b895b3481866d8482710

## [任务与协作](entries/tasks-and-collaboration.md)

Task、Plan、Queue与长期Topic的职责、目标及安全确认表达、证据失效和协作审查；界面展示归交互主题。

sha256: b6605482cc59b460850f5cd0976cb841838301411b700d2f20b37f5d84f59947

## [近期上下文](entries/temp.md)

最近7个UTC自然日的用户意图与必要背景；不是执行授权。

sha256: c3c84eaaf76308c54761a014cb68ce3354d719ecf8cd97222a28f44702f51183
