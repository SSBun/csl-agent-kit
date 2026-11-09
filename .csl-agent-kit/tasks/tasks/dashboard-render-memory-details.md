# 详情正文优先展示并使用第三方 Markdown/JSON 渲染

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 18:19) |
| Artifacts | [Artifacts](../artifacts/dashboard-render-memory-details/) |
| Kind | Task |

## Scope

只优化详情呈现，正文默认展开、来源/元数据默认折叠；记忆文件及维护逻辑不变。第三方资源从本机npm依赖加载，不用运行时CDN，不增加前端框架。保持loopback、Bearer及同源/CSP保护，不允许内容执行脚本或自动请求外部图片。

## Plan

1. 固定兼容当前项目的Markdown与JSON浏览器库，设置静态资源白名单。
2. 统一详情渲染与默认折叠，保留纯文本回退和原有操作。
3. 在隔离实际服务/浏览器检查格式、JSON交互、错误回退、安全及窄屏。
4. 独立审查后在空闲时加载真实服务并核验真实记忆详情。

## Execution Log

### 001 — 库选择与依赖

选用markdown-it 14.2.0与json-formatter-js 2.5.23。初次考察的markdown-it15依赖entities8要求Node20，与根包Node18声明不符，已在最终依赖中改用14.2及entities4.5。npm install使用--ignore-scripts，未执行安装脚本或测试。与安装前备份相比，根package仅新增两个精确版本依赖；锁文件新增8个相关包，既有包无版本变化/移除，但npm自动规范化111项已有可选peer元数据。未重置用户原有package修改。安装前package及lock备份在/tmp/dashboard-render-package-before.json和/tmp/dashboard-render-lock-before.json。

### 002 — 渲染及安全实现

新增本机静态资源映射，只暴露两个指定vendor脚本和自己的renderer；不按请求路径任意读取node_modules。JSONFormatter包会注入随包CSS，已在沙箱比对该CSS与注入内容完全相同，仅把其SHA256作为精确style-src哈希加入CSP，未加入unsafe-inline/eval。Markdown关闭raw HTML，validateLink只允许http/https/mailto并保留库自身校验；图片转换成转义说明，不自动加载。JSON值由库创建文本节点；所有链接增加noopener/noreferrer。JSON节点补充键盘与aria-expanded，展开新节点后同步属性。

正文与前后对比使用渲染容器；有效JSON字符串/对象/数组以及json代码块用JSON树。历史csl-memory文件的YAML头通过格式识别单独折叠，不猜测其他Markdown头。外层来源及元数据每次detail都重置折叠；渲染器缺失或特殊JSON结构错误会明确回退完整原文。未改变恢复/重试动作与确认条件。

### 003 — 隔离浏览器及包装核验

使用独立临时home、实际daemon与Chrome，预置两个仅user作用域样例且无注册workspace/队列事件，不调用模型或修改真实记忆。最终样例目录为/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/csl-detail-render-mSygLx；脚本为/tmp/csl-prepare-detail-render-preview.cjs和/tmp/csl-detail-render-check.mjs。

最终依赖版本下观察：标题/加粗/列表/引用/表格/代码块及JSON代码块正确渲染；正文默认可见，metadata默认关闭并可展开，JSON来源数组键盘展开可用，换记录重新折叠。原始script/img、javascript及实体编码scheme、data/file链接样例无执行、无危险链接、无外部资源加载；CSP事件数组为空。390px无页面或浮窗横向溢出。历史YAML头与元数据默认折叠；特殊constructor结构安全回退；205项数组可通过分组展开至200…204而非截断；库缺失明确回退JSON原文。白名单资源200，路径穿越尝试及未授权API均401。脚本完成后停止其隔离服务。

首轮CSP事件监听未启用Page域，不能把undefined当无违规；修正采集后两轮确认空数组。完整最终观察见[evidence/browser-check.txt](../artifacts/dashboard-render-memory-details/evidence/browser-check.txt)，另有[Markdown](../artifacts/dashboard-render-memory-details/evidence/markdown.png)及[窄屏JSON](../artifacts/dashboard-render-memory-details/evidence/json-mobile.png)截图。npm pack --dry-run --ignore-scripts确认新增renderer及资源映射包含在发布文件中；npm ls确认两个固定版本。JS语法及git diff --check通过，未运行单元/项目测试套件。

真实服务部署留在审查后，避免把隔离观察冒充已交付；task_focus异常已披露。

### 004 — TR-1复现与修正

首轮Reviewer指出合法嵌套JSON的constructor字段会在懒展开时触发第三方库异常，首次render的try/catch无法接住。主Agent实际浏览器复现鼠标及键盘均报TypeError，tail字段未出现、无回退，见[evidence/lazy-json-before.txt](../artifacts/dashboard-render-memory-details/evidence/lazy-json-before.txt)。

修正为交给库前迭代检查完整结构；任意层级有自身constructor字段时直接进入原文回退，不删改原对象，也不安装会失败的懒展开节点。JSON围栏保留转义原代码。修复后鼠标/键盘路径均无错误，完整tail可见且无危险切换节点，见[lazy-json-after.txt](../artifacts/dashboard-render-memory-details/evidence/lazy-json-after.txt)。补充正文JSON字符串及JSON围栏与原始数据逐字一致检查；全部原浏览器检查再次通过、CSP数组仍为空，见[browser-check-round2.txt](../artifacts/dashboard-render-memory-details/evidence/browser-check-round2.txt)。当前待复审，不把作者修正自行认定为Reviewer已解决。

## Task Summary

**Memory 详情**：组件 [memory](../../../bin/memory/) 增加本机第三方Markdown/JSON渲染、正文优先及元数据折叠，统一安全回退、JSON键盘交互及固定资源/CSP策略。

**依赖清单**：[package.json](../../../package.json)与[锁文件](../../../package-lock.json)固定两个渲染库及其依赖。

**Memory 文档**：组件 [docs](../../../docs/) 更新富文本、元数据、外部资源限制和回退说明。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 两个无框架浏览器库，复用原详情动作；关闭raw HTML避免额外HTML清洗体系，资源白名单精确。 | 只渲染支持的Markdown/JSON；图片不自动加载。 |
| 稳定性 | A | 隔离真实服务及Chrome覆盖格式、CSP、攻击样例、节点键盘、长数组、缺库与窄屏；TR-1深层特殊结构实际复现后预检回退，正文及围栏原文完整性重新核验。 | 未运行测试套件；npm规范化可选peer标记，未升级已有包；安全样例不保证所有未来漏洞不存在。 |
| 完整性 | A | 正文/元数据默认状态及两类第三方渲染均已实际观察，旧操作入口保留。 | 真实服务部署在审查后；仅Chrome实测，task_focus绑定异常已披露。 |

## Target
- [x] T1: 详情默认突出并展开主要正文，来源与元数据默认折叠且可手动展开。
- [x] T2: 选择适合当前项目的第三方库渲染Markdown正文及JSON内容，不再仅以原始文本展示。
- [x] T3: 保留现有详情查看与交互，渲染不执行内容中的脚本或不安全HTML。

## Result

- T1: 隔离实际Chrome显示正文默认可见、来源元数据默认折叠；展开后JSON可读，换记录重置折叠，历史YAML头亦默认折叠。
- T2: markdown-it14.2.0及json-formatter-js2.5.23固定安装并本机加载；标题/列表/表格/代码块/JSON树与有效JSON围栏实际渲染，205项数组可展开完整分组，包装包含资源。
- T3: TR-1鼠标/键盘原失败已实际复现并修正；完整结构预检后深层constructor数据完整回退，无懒展开异常，正文字符串与JSON围栏原文一致。最终隔离浏览器全套观察再次通过：无脚本执行/危险节点/外部请求，CSP数组空、长数组/键盘/窄屏/缺库回退及401正常；真实部署待复审后。
- Review gate: Passed — 新上下文只读复审6b33487a确认TR-1 resolved，无新增阻塞项；round02持久化并复核当前源码/vendor/证据快照。实际服务部署仍待最终核验。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 第三方渲染及CSP边界，TR-1深层JSON回退修正后需重新独立核验。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/dashboard-render-memory-details/evidence/3f1e78b53fb6d855e58997e40fc3f7734874b1ee2d449fe46165f9edaaa4bc25.json#3f1e78b53fb6d855e58997e40fc3f7734874b1ee2d449fe46165f9edaaa4bc25
- Evidence: Execution Log003/004与browser-check-round2/lazy-json-before/lazy-json-after，最终源码语法及隔离实际浏览器观察。
- Task fingerprint: 27732658e87cc889dd83b0ebb2afd474112af29e68de14477b11ad2aa34d56ca
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/dashboard-render-memory-details/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/dashboard-render-memory-details/evidence/2e79229679f9ea2b12bafc902d084cbe59c12df4f239b53cfb2bef19bbb34d9f.json#2e79229679f9ea2b12bafc902d084cbe59c12df4f239b53cfb2bef19bbb34d9f | findings | 4ebe937aadeb6bff9d42eb20232049f013b48216904a3dcd797b5b902994e167 |
| 02 | [Round 02](../artifacts/dashboard-render-memory-details/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/dashboard-render-memory-details/evidence/3f1e78b53fb6d855e58997e40fc3f7734874b1ee2d449fe46165f9edaaa4bc25.json#3f1e78b53fb6d855e58997e40fc3f7734874b1ee2d449fe46165f9edaaa4bc25 | no blocking findings | 272d75d7517070cda997ae0df2a789b7783b2610b1feb5375c6b4ef0ccb44a67 |

## Verification

- Passed: 独立复审后在后台空闲窗口加载实际服务，端口55815与token保持，renderer资源HTTP200。真实Chrome从卡片打开记忆：标题匹配、正文Markdown产生6个格式节点、metadata默认关闭且JSON树存在、无回退/页面错误/CSP违规；手动展开13个JSON键、键盘可用，切换记录重置关闭。真实历史after为Markdown且YAML头/metadata默认折叠、变更摘要保留；390px无页面/浮窗横向溢出，全部资源同源。最终四份JS语法、git diff及源码/vendor/两份review报告check-evidence通过。Self Assessment边界仍适用：特殊constructor结构回退完整原文，未运行单元或项目测试套件；task_focus失败已披露。
