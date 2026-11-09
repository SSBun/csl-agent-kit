# 迁移本项目 Task 存储并适配 Pi 面板

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 11:20) |
| Artifacts | [Artifacts](../artifacts/migrate-workspace-task-storage/) |
| Kind | Task |

## Scope

用户确认本项目统一存储迁移及Pi面板适配。保持Memory现有库、源码、技能发现入口与其他项目/用户数据不变。不擅自中断其他会话或共享服务；活动记录、审查证据及focus须能合法交接后才切换。

## Plan

1. 真实迁移已完成，保留独立备份和原树，不再重复apply或恢复旧根。
2. 用户已直接确认“The task panel has fixed”，CLI及focus也已恢复；不将用户反馈夸大为本Agent逐项GUI操作测试。
3. 对任务所属运行时及实际迁移结果完成R2独立审查和最终验证。本轮不运行测试套件，不为使历史快照通过而覆盖其他任务的源码改动。

## Execution Log

### 001 — 接受目标与初步盘点

用户在完整Target后明确yes，已resume并focus本任务。只读盘点发现旧tasks约19MB：445个任务文件、2863个产物文件、2个归档文件、5个Topic文件；另有根索引、旧Context/Lessons及Finder元数据，未发现文件符号链接。新Task目标尚不存在，Memory已在新根，不重复迁移。未发现本项目旧SOP/Rules/Hooks候选；.agents中的技能及插件入口不是迁移对象。当前只是初步盘点，不是冻结清单。

Task核心、Topic、快照/审查报告解析及Pi面板均仍含旧根路径；快照和报告存在绑定旧相对路径的历史身份，不能批量替换不可变证据。面板文件已有他人未提交的参数类型校验，本任务不得覆盖。尚未修改任何运行时代码，也未复制、移动或清理数据。

### 002 — 并发写入边界

lsof实际确认Pi进程7538、62412、79807的cwd均为本项目；本工具链父进程为62412，另外两个前台会话不能认定已静止。索引中的proactive-memory-maintenance仍In Progress，其任务文件最近于2026-11-03T11:57:31.016Z更新。状态标签或进程存活本身不证明它们正在写入，但目前无法证明它们已停止写入。尚未找到覆盖CLI及Agent直接文件编辑的统一冻结能力，不能只凭临时无锁就宣布安全窗口。

需用户协调另外两个本项目会话暂停写入，再继续共享运行时改动及冻结清单；不要求关闭当前会话，也不擅自停止Memory服务。接受目标不是终止其他活动工作的授权。本任务保持未完成，当前仅做盘点。

### 003 — 用户要求重查

重新检查：三个Pi进程仍以本项目为cwd；proactive-memory-maintenance已于2026-11-03 20:09完成，任务文件及索引确在上一轮检查后更新。因此此前具体执行任务已结束，但进程存在不代表仍在写入，也不能证明其他会话已进入暂停窗口。尚未迁移或修改运行时；只需用户确认其他会话暂停本项目写入，不要求退出进程。

### 004 — 写入窗口已确认，核对历史引用风险

用户明确表示其他任务均已完成，已resume并focus；不再把其他Pi进程仍存活单独视为阻碍。继续只读核对发现：任务正文中至少129处相对链接指向Task树外（如技能源码），整体目录下移一层会改变其含义。Task快照和审查报告还绑定旧路径及任务正文fingerprint，不能机械改链接或旧快照来让校验通过。原目录正文和不可变证据需要专门的迁移交接支持，而不仅是替换面板索引常量。

为建立变更前基线及后续保真验证，需运行Task核心、Topic、证据、归档与Pi任务面板的定向测试。已核对package脚本：npm run check会连带运行完整测试，不可当作普通静态检查使用；拟只运行明确列出的测试及后续相关迁移用例，不触发Memory模型或全项目测试。当前用户尚未明确授权测试套件，未执行，运行时代码和数据尚未修改。

### 005 — 获得定向测试授权并建立基线

用户明确同意运行迁移相关定向测试。用户收窄实际操作为整个tasks树移至.csl-agent-kit下、内部分类暂不改变，并要求持久路径使用相对表示。其他会话完成的确认继续适用，不据进程存活臆测写入。

基线147项中143通过、4失败，失败均为已有Skill文案正则断言（task-files.test.mjs的artifact paths、workflow routes、contract、maintenance用例）；未为本任务改写无关规则或放宽断言。运行时基线正常。现新增共享Task根解析、显式迁移状态与清单绑定、可变链接的保真重定位、旧快照定位/转换验证、内核no-replace发布及中断回滚。目录不切换时继续旧工作流，切换后不回退、不双写，旧索引再出现则拒绝访问。

### 006 — 兼容实现及切换准备

Task/Topic/证据与归档使用共享路径解析；Pi面板更新索引、进度、链接、Topic、focus并在迁移冻结期间显示不可用提示。扩展重载刷新完整Task模块组，task_focus返回可见storage schema以核实实际加载版本。保留面板原有他人参数类型检查。当前宿主task_focus仍返回旧格式，尚未加载新插件。

迁移工具prepare产生独立备份、暂存树及逐文件相对路径/hash/权限清单；apply在冻结状态下保留原树并独占发布，验证后才启用新根；rollback仅处理未完成且内容无漂移的迁移。Task正文的纯链接变换由前后fingerprint映射绑定，其他变更不能沿用旧审查。不可变产物及快照原文不改写。新建流程参考说明能力及边界。

运行时定向测试138项已全通过，涵盖新旧路径、链接、历史快照、Topic规范身份、冲突拒绝、回滚、面板/focus；随后补充代码示例不改写用例。Pi tsc、JS语法及diff检查通过。agent-migration、archive两个改动Skill包均质量门通过，0警告0失败。原4项文案基线失败保留，不声称全套测试通过。

下一步生成真实准备清单，并由用户重载Pi使当前面板/focus具备切换能力，再复核清单和执行实际迁移。尚未移动真实旧根，不将临时合成迁移测试当成本项目已迁移。

### 007 — 实际准备完成，等待前台激活

最终当前定向运行时测试139/139通过，Pi类型检查通过。prepare已对本项目创建准备目录`.csl-agent-kit/migrations/task-root-20261103/`：3322个文件，60份可变记录需要链接重定位；独立原文备份、暂存树、清单和state.json已落盘，旧根尚未移动。该清单是准备时点；本条日志及Blocked状态更新会改变源记录，因此实际apply前必须重新盘点并用新ID生成最终清单，不对旧清单忽略漂移。

当前task_focus查询仍输出旧版本格式、没有storage schema，说明当前会话尚未验证加载新版面板。下一步由用户/reload或完整重启Pi，查询task_focus实际出现csl-task-storage/v1后再继续。不得先移走旧索引再假定旧工具可跟随。需要最终迁移、实际运行核对与R2独立审查，任务未完成。

### 008 — 新前台接口已实际激活

用户回复continue后，实际task_focus查询与重新聚焦均返回csl-task-storage/v1且保留本任务ID；已解除前台激活阻碍并resume。当前旧tasks仍存在、新Task目标尚不存在，validate与diff检查通过。接下来使用新的最终准备ID重新盘点，不复用已因日志更新而漂移的初次清单；发布后保留原树及独立备份，验证当前任务、索引、Topic及历史证据，再完成独立审查。

### 009 — 冻结中断恢复及真实切换

本会话用户确认恢复迁移目标。初始CLI resume与task_focus因冻结失败；只读核对最终清单3322个文件、284个目录，旧源、before及stage的完整文件集合、目录权限、大小和hash均一致，新目标及retired均不存在。使用原apply命令续做成功，状态返回migrated；原树保留于迁移目录retired-tasks，独立before备份保留。未手删冻结标记，未覆盖数据，未运行测试。

切换后CLI resume成功，宿主task_focus成功并返回csl-task-storage/v1；validate返回valid:true。真实切换已经完成，纠正此前Self Assessment中旧前台及尚未切换的历史限制。仍需最终历史证据/Topic检查、面板显示验证及R2独立审查；不宣称整项任务完成。

### 010 — 切换后保真与关联核对

当前标记为unified，迁移phase为completed，旧tasks根不存在。逐项重新核对3322份已迁文件，仅本任务因resume及新日志产生预期变化；2865份artifacts全部保持迁移前原字节。现有Topic layered-memory-system通过topic check，成员关联和新根file链接有效。误查不存在的csl-agent-kit-storage Topic返回ENOENT，随后以topic list的实际清单核对，没有创建该Topic。

compact-task-panel的check-evidence能定位迁移后的历史快照，但报告README.md的内容或Git身份已变化。不能把历史审查当作当前源码验证；未修改历史快照或README。该快照原文属于上述逐字节保持的artifacts，不能归因为迁移改写。任务核心validate通过不等于真实TUI可见结果已验证；本会话尚无切换后的面板截图或用户观察，须补齐后再作独立审查及终态声明。

### 011 — 用户确认面板恢复及审查前自查

用户直接回复“The task panel has fixed”，据此解除面板可见结果阻碍，resume及task_focus再次成功。当前agent-migration与archive两个包质量门均通过且无警告；task-storage和迁移脚本语法检查、迁移相关源码diff空白检查及Task validate通过。本轮未运行单元测试；此前日志中的定向测试结果仅为历史执行证据，不冒充本轮重跑。下一步冻结迁移相关代码、清单和状态进行独立审查。

### 012 — 首轮审查整改

首轮报告已登记round-01。TR-1确认：规范正文链接变换会改变Topic Revision身份；现使用prepare及apply双入口保护，对Scope、Spec Context、Decisions、Dependencies段的任何重定位变化拒绝发布，不重写不可变规范快照。实际本项目Topic不触发该情况，topic check仍通过。新增prepare拒绝及旧暂存树apply拒绝两项回归源码，仅做语法检查，未运行测试。

TR-2确认：此前快照遗漏未跟踪专项测试，下一快照纳入该文件。当前质量门、语法和diff检查通过；before及retired各3322文件的hash/大小/权限及目录集合再次匹配原清单，2865历史产物原字节保持。迁移后正文差异仅本任务和其索引，系合法生命周期更新；新审查报告和快照是后续新增产物。尚待fresh审查核对两项整改。

### 013 — 第二轮审查整改

round-02确认TR-1及TR-2 resolved，发现TR-3：链接重定位丢失目录末尾斜杠，可能改变Topic reference目录资源类型。现保留路径末尾斜杠并保持fragment位置，新增迁移前后Resources字段、Revision及目录href保持的回归用例。源码与测试语法检查、diff检查通过，未运行测试。实际Topic资源清单只有一项normative文件，无目录资源，因此不修改已迁数据、清单或历史快照。已解决的TR-1/TR-2从活动ledger移除，历史报告保留。

## Task Summary

**Task存储运行时**：[共享运行时](../../../skills/meta/csl-tasks/shared)新增统一路径解析、显式迁移与恢复工具，接通Task、Topic和证据身份验证；prepare/apply拒绝会改变Topic规范段的重定位，链接重定位保留目录末尾斜杠。

**Pi任务面板**：[Pi扩展](../../../pi/extensions)接通统一路径、模块刷新、迁移状态与focus存储版本报告。

**归档入口**：[archive](../../../skills/meta/archive)使用当前Task根写入会话归档。

**迁移规范**：[agent-migration](../../../skills/meta/agent-migration)增加Task根迁移命令及历史证据处理说明。

**验证用例**：[tests](../../../tests)新增存储切换与恢复用例、面板切换/focus验证，以及Topic规范段变换拒绝用例（本轮仅语法检查，未运行）。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 共用单一路径解析，保留内部树结构，复用现有核心与面板。 | 历史身份保真必须维护显式迁移清单。 |
| 稳定性 | A | 真实apply完成；源、备份、暂存完整核对通过，历史产物字节未变，validate与Topic核对通过，实际focus恢复；用户确认面板恢复。 | GUI结果来自用户观察而非Agent逐项点击；历史面板任务快照因README当前身份漂移不能作为当前源码证明。本轮未运行测试。 |
| 完整性 | A | 整树已切换统一根，旧根不存在，备份保留，任务读写、focus及面板恢复；源码与Memory不在搬迁范围。 | 尚须通过独立审查与最终验证门槛；不宣称历史审查对之后变动的源码重新有效。 |

## Target
- [x] T1: 本项目已确认属于Kit且需要切换的旧数据迁入统一.csl-agent-kit根，保留内容、关联、审计及可恢复材料，不重复迁移已就绪的Memory。
- [x] T2: 相关运行时读写入口与Pi任务面板一致使用迁移后位置，任务状态、进度、链接、Topic及当前任务focus可正确访问。
- [x] T3: 迁移经过兼容性检查、精确清单、冲突保护和切换验证；无关源码、宿主入口及其他项目/用户数据不变。

## Result

- T1: Log009/010：apply迁移3322文件284目录，旧根不存在，before及retired原树保留；2865历史产物逐字节保持，Memory未迁移。
- T2: 切换后CLI resume、validate、实际task_focus成功且返回csl-task-storage/v1；Topic check通过新根链接及成员关联；用户确认The task panel has fixed。GUI未由Agent逐项点击。
- T3: Log009-011：原清单hash匹配，源/备份/stage文件目录权限和字节核对通过后原apply续做，unified/completed状态成立。质量门与语法检查通过，无本轮测试；README历史快照漂移保留未改，不将历史审查等同当前源码验证。
- Review gate: Passed — fresh只读round-03无新finding，TR-1/2/3均resolved；主Agent已补齐该报告保留的最终核验：check-evidence当前18文件及3报告通过，双备份3322文件284目录全量hash/大小/权限匹配，原2865产物原字节保持，新根仅当前任务/索引合法变化及6个本任务新增产物，旧根未再生。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 真实持久数据迁移兼容，整改后保持独立审查义务
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/migrate-workspace-task-storage/evidence/39878713223a6bcf063a9846cf2331195cd0cc1862ee5fce74f3fe980c5dabbc.json#39878713223a6bcf063a9846cf2331195cd0cc1862ee5fce74f3fe980c5dabbc
- Evidence: Result T1-T3及Log012/013；TR-1/2上轮resolved，TR-3目录斜杠修复静态检查通过、用例未运行，实际Topic无目录资源
- Task fingerprint: 94a33142f0fc50b18b78e86e6ef5f20f377a67b265099773ab29093c60715eae
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/migrate-workspace-task-storage/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/migrate-workspace-task-storage/evidence/dba5ddaafe7585a79960f14761b3fb2073bcc8a5f7b5c164dc699321b00b0a06.json#dba5ddaafe7585a79960f14761b3fb2073bcc8a5f7b5c164dc699321b00b0a06 | findings | 5e5e8c5da27c1eb57349803dea6159ed73626c90d887fec19c50dec897911d3f |
| 02 | [Round 02](../artifacts/migrate-workspace-task-storage/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/migrate-workspace-task-storage/evidence/b03cd4b14d01b472f35956ecbda87c1a6694099535fdf892a314364c288094f2.json#b03cd4b14d01b472f35956ecbda87c1a6694099535fdf892a314364c288094f2 | findings | ef173fd44df707663f2ce8bdb87491cba2e3f4324d9ece3595ef6a6923472a13 |
| 03 | [Round 03](../artifacts/migrate-workspace-task-storage/reviews/round-03.md) | snapshot:.csl-agent-kit/tasks/artifacts/migrate-workspace-task-storage/evidence/39878713223a6bcf063a9846cf2331195cd0cc1862ee5fce74f3fe980c5dabbc.json#39878713223a6bcf063a9846cf2331195cd0cc1862ee5fce74f3fe980c5dabbc | no blocking findings | 0362b10dda4537f98e5d39a15b5e57139dbfe1f1ec97213691eb6f887ec1cc74 |

## Verification

- Passed: 最终check-evidence验证当前18文件/Git身份及3报告通过；全量核对双备份3322文件284目录和新根原文件权限/大小/hash通过，2865历史产物原字节保持，差异仅本任务生命周期及6新增证据。unified/completed且无旧根；validate、Topic check、实际focus正常，用户确认面板。自评限制不变，新增用例未运行，不声称全套测试通过。
