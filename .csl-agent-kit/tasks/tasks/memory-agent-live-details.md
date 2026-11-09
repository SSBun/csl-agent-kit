# 查看Memory Agent实时处理详情

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 18:02) |
| Artifacts | [Artifacts](../artifacts/memory-agent-live-details/) |
| Kind | Task |

## Target
- [x] T1: Dashboard按工作区展示当前批次输入、工具调用及结果、写入效果和状态，并实时更新
- [x] T2: 过程仅使用有界内存临时缓存，不落盘，不展示隐藏推理，保留现有授权边界

## Scope

用户希望查看正在处理的Agent的详细处理内容，并对已展示的实时查看Target回复yes。范围为本批输入、工具调用及参数/文本结果、公开回复、写入效果、次数与状态；过程临时有界、不落盘、不展示隐藏推理，原有提交审计保留。

## Execution Log

新增live.js维护每workspace当前/最近一批的内存轨迹，输入32KiB、每步16KiB、100步且步骤序列化192KiB上限；超限提示和早期步骤淘汰计数。两分钟定时释放，下一批替换且旧定时器不能删除新批次。SDK订阅仅接收工具开始/结束和assistant公开text块，显式忽略thinking、图像、details和原始会话。

manager生命周期接入输入、模型、effects与完成状态；授权API只返回选定workspace的临时快照。Dashboard新增运行中工作区入口，详情每秒更新，工作区列表每3秒更新；关闭或切换详情使用generation阻止旧响应覆盖，不在后台标签页发起轮询。使用textContent显示输入和步骤；现有CSS延伸换行，未重做页面。

VM隔离观察使用实际live.js与替代定时器：隐藏思考canary不进入返回值，凭证基本遮盖、工作区隔离、两种容量上限、过期与新批次替换均观察符合。实际daemon及真实网页用替代模型manager在独立home/临时端口运行：Chrome详情自动刷新3次、显示输入/工具/公开结果；关闭后请求数不再增加，HTML按纯文本，无脚本执行。API无授权401、跨Origin403、授权200/no-store，响应不含隐藏canary。已查看截图。未执行单元/项目套件或真实模型实验。

源码均为此前存在的未跟踪文件，live.js为本次新增；不将整份既有文件或其他修改归入本任务。生产激活及真实运行观察留待审查后执行。SDK事件形状已与安装版types.d.ts核对；所有修改JS通过node --check。观测缓存只有内存操作，没有文件写入。

## Task Summary

Memory Agent新增仅内存的有界实时轨迹与授权查询接口。Dashboard增加按工作区进入的实时详情，展示输入、公开输出、工具结果和写入效果；同步文档中的缓存寿命、截断、授权和隐藏推理边界。

## Self Assessment

| 维度 | 等级 | 证据与限制 |
| --- | --- | --- |
| 简洁性 | A | 复用SDK订阅、现有授权API与详情弹窗；无数据库、持久日志或流式基础设施 |
| 稳定性 | A | 实际隔离API/浏览器验证，缓存容量/过期/替换及隐藏块排除观察通过；源文件语法通过 | 模型manager替身，未运行真实模型实验或套件；部署状态以最终Verification为准 |
| 完整性 | A | T1显示与轮询、T2授权/纯文本/缓存限制有证据；不改变提交历史 | 基本凭证遮盖不保证识别任意敏感文本，仍依赖现有本机授权；结束两分钟或重启后详情消失 |

## Result

- T1: 真实隔离daemon+Chrome显示本批输入、工具调用/结果和公开回复；详情自动更新3次，关闭后停止请求。manager源接入模型、attempt及写入effects。见browser-observation.json与live-preview.png。
- T2: 实际live.js隔离观察：隐藏canary排除、文本容量限制、淘汰计数、2分钟到期/新批次替换/clear成立；模块无文件写入。实际API401/403/200+no-store，HTML纯文本无执行。源SDK过滤仅公开text。无模型实验/套件；真实激活待审查后执行。
- Review gate: Passed — fresh独立只读审查无发现，报告round-01；审查后16文件机械核验通过；进入生产激活验证
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 新增SDK事件观察、授权详情API与异步UI，须核对隐私、缓存和状态边界
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-agent-live-details/evidence/80fff734631c5feba2ea50f78a004461bcb06a69ecec92b9c3fdd02d117fbefd.json#80fff734631c5feba2ea50f78a004461bcb06a69ecec92b9c3fdd02d117fbefd
- Evidence: Result、隔离容量观察、实际daemon API和Chrome观察及截图
- Task fingerprint: 7dc9d072117f04a9d54a34bf4096d754855d8a2b2c02ceba274d0ee03afa641d

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-agent-live-details/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-agent-live-details/evidence/80fff734631c5feba2ea50f78a004461bcb06a69ecec92b9c3fdd02d117fbefd.json#80fff734631c5feba2ea50f78a004461bcb06a69ecec92b9c3fdd02d117fbefd | no blocking findings | 8fd0662b14f1cf0be3dcafd541822361cae2e6acba484943d824b284f13c8b35 |

## Verification

- Passed: 审查后及部署后16文件快照和独立报告机械核验通过。空闲重启后台PID32482，真实/api/agent-live授权查询各workspace成功返回available=false，页面已包含工作区入口与实时弹窗，无schedulerError；当前服务空闲，无新真实批次可观察，未额外发起模型调用，不能声称已看到真实模型轨迹。实际daemon+Chrome隔离路径与SDK类型/接入源码已核验，容量/隐藏块/授权/纯文本/关闭轮询证据见observation.json、browser-observation.json和截图；生产加载证据production.json。Self Assessment限制仍适用，未跑项目套件。Dashboard已打开。
