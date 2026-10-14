# 任务记录自动链接已有产物目录

| Field | Value |
| --- | --- |
| Status | Completed (2026-09-18 14:11) |
| Artifacts | [Artifacts](../artifacts/task-artifacts-directory-link/) |
| Kind | Task |

## Scope

修改共享 Task 生成与后续更新规则，适用于 Task、Plan 与 Queue；不批量迁移历史记录，不修改用户举例的外部项目，不为链接创建空 artifacts 目录。

## Plan

1. 在共享写入路径以 Field／Value 两列表格呈现顶部元数据，维护 artifacts 目录链接，并兼容读取旧式逐行字段。
2. 同步 Task 工作流文档和回归用例，保持导航元数据与纯展示转换不影响审查证据有效性；既有正文和状态约束不变。
3. 执行语法、Skill Quality 与隔离临时目录中的 CLI 行为核对；不运行单元测试或项目测试套件。

## Target
- [x] T4: 任务文件顶部元数据以两列表格显示，左列为字段名、右列为对应值；Status、Artifacts 与 Kind 各占一行，Artifacts 保持可点击。
- [x] T1: 每个任务文件在对应 artifacts 目录存在时包含指向该目录的可点击链接。
- [x] T2: 对应 artifacts 目录不存在时，不生成指向不存在目录的链接，也不为添加链接而创建空目录。
- [x] T3: 任务创建后才产生 artifacts 目录时，在后续任务更新中自动补充该目录链接，且不批量改写未触及的历史任务。

## Result

- T1: 当前共享核心将已有目录链接生成于顶部两列表格的 Artifacts 行；marked 解析实际任务确认该单元格为指向 ../artifacts/task-artifacts-directory-link/ 的 HTML a 元素。Task/Plan/Queue CLI 生成及解析通过。当前七文件身份见 ../artifacts/task-artifacts-directory-link/evidence/snapshot-02.json，五文件任务基线差异见 scope-02.patch。
- T2: 目录存在性判断沿用已核对的 stat.isDirectory 路径；本轮临时 Plan 与 Queue 无目录时仅有 Status/Kind 两行，未创建空目录。原缺失、删除、普通文件分支与新表格渲染分离，源码逐项核对未改变。
- T3: 所有核心写入仍在共享 writeMany 中按最新目录投影链接，再渲染表格；读取与 check 不写入，临时旧式记录 check 前后字节一致，后续 verify 转换表格且 complete 成功。旧式读取兼容，不批量扫描回填。
- T4: marked 实际解析本任务元数据为两列 Field/Value，Status、Artifacts、Kind 三行；CLI 父子关联时 Parent 单独占一行。旧式与表格状态读取、评估指纹、任务完成、索引 validate 均通过。已更新两份回归源码但未运行测试；语法、Skill Quality、Context 和 diff 检查通过。
- Review gate: Passed — fresh 只读 Reviewer a6c59a21-884c-4b62-bd32-63731678eb34 无 findings 或阻断风险；报告已保存并索引于 reviews/round-01.md。主 Agent 审查后复算 snapshot-02.json 全部七文件 SHA-256 一致，补齐 Reviewer 无法独立重算的核对边界。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 元数据从逐行字段变为 Markdown 表格，影响共享读取、状态更新与指纹规范化，需独立检查兼容路径。
- Snapshot: tasks/artifacts/task-artifacts-directory-link/evidence/snapshot-02.json：七文件 SHA-256；scope-02.patch：任务范围差异
- Evidence: 当前 Result T1–T4；实际 CLI 完成与旧格式转换、marked 渲染、语法、质量及 Context 核对；未运行测试。
- Task fingerprint: fba9a2eda5cb72e36b40b00b273b6e0ca4953ead08967c5273e836fdba8b65cc

## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [第 01 轮](../artifacts/task-artifacts-directory-link/reviews/round-01.md) | snapshot-02.json：七文件 SHA-256 | no blocking findings；独立只读审查未发现问题，未独立执行程序或重算哈希 |

## Verification

- Passed: 独立审查报告与快照已核对；七文件哈希无漂移，核心和两份测试源码语法、git diff --check、Context validate 最终通过。实际 marked 渲染为 Field/Value 两列且目录链接可点击；CLI 与旧格式转换证据适用于未变源码。未运行单元测试或项目测试套件，Skill Quality 仅有上下文预算警告。
