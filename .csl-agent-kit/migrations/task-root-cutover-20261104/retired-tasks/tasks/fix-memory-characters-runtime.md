# 修复 Memory 索引运行时接口不一致

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 11:38) |
| Artifacts | [Artifacts](../artifacts/fix-memory-characters-runtime/) |
| Kind | Task |

## Scope

修复 Memory bridge 的直接 store 加载边界，不改记忆格式、预算、后台服务或其他已有改动。用户已确认目标；不自动重启进程、不运行单元测试。

## Plan

1. 核对扩展重载与原生 CommonJS 缓存的关系。
2. 采用已有的直接无状态依赖刷新方式，保留注入和降级行为。
3. 用加载诊断、真实索引只读调用及语法检查验证，记录实际会话尚需重载的限制。

## Execution Log

### 001 — 确认缓存生命周期不一致

当前磁盘模块在新进程中能正常注入 Memory。通过宿主安装的 jiti，以 moduleCache:false 连续加载 bridge 两次，观测到原生 require.cache 中 store 模块对象未改变；该缓存生命周期与扩展重载不一致。Pi loader 本身也使用 moduleCache:false。pi/lib/csl-settings.ts 已通过定向驱逐直接无状态依赖解决同类问题。store 顶层仅导入依赖并定义常量，没有定时器或进程监听器。

首次诊断从工作区解析 jiti 失败，随后使用宿主实际安装的 jiti 完成观察。未运行测试；未取得截图报错进程的缓存对象，因此不宣称已证明截图历史事件的唯一根因。

### 002 — 定向刷新与只读验证

只修改 pi/lib/memory-bridge.ts 的 store 加载：解析模块路径、删除该单一 require.cache 条目，再加载当前导出。未清除其他模块缓存；预算、异常捕获及后台服务逻辑保持原样。

使用宿主 jiti 的实际加载机制连续加载两次，均观测 storeRefreshed=true、characters=function、Memory 注入成功、两级索引存在且 warnings=[]。前后索引 SHA256 相同。TypeScript transpileModule 返回0条诊断（仅语法转译，不代表完整类型检查），node --check store.js 与 git diff --check 成功。未运行单元测试或项目测试套件；未自动重载用户当前 Pi 进程。实际会话需用户 /reload 后观察；仍失败时需采集该进程加载路径和导出对象，不应扩大缓存清除范围。

## Task Summary

**Pi Memory bridge** — ["/Users/caishilin/Desktop/personal/skills/pi/lib"](file:///Users/caishilin/Desktop/personal/skills/pi/lib)：扩展加载时定向刷新无状态 store 的原生模块缓存，使重载读取当前导出；保留索引预算和错误降级。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用相邻设置模块已有模式，仅调整直接依赖加载，无新抽象或依赖。 | 不尝试刷新无关依赖。 |
| 稳定性 | A | 两次真实加载均取得新 store，正常注入且无警告；索引哈希不变，预算与catch未改。 | 未运行单元测试；未自动重载用户进程，截图历史缓存对象不可得。 |
| 完整性 | A | 完成缓存生命周期修复并验证正常索引注入，保留边界。 | 用户当前运行会话仍需 /reload 才能加载改动；历史事件的唯一根因未证实。 |

## Target
- [x] T1: 修复 Memory 索引读取时 store.characters 不可调用的问题，使有效索引能够正常注入
- [x] T2: 保留索引预算检查、失败降级和现有记忆数据，不扩大无关改动

## Result

- T1: 修改后通过宿主jiti连续加载两次，store对象均刷新且characters=function，before_agent_start均正常注入Memory、warnings=[]；最后再次读取注入JSON确认两级索引与磁盘全文一致。
- T2: 仅改bridge的直接store加载；预算检查、catch降级与服务逻辑未改。只读诊断前后两级索引SHA256一致，语法转译0诊断，node --check及git diff --check成功。未运行测试或重载用户进程。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 直接无状态依赖缓存刷新，复用已有局部模式，属于有边界的低风险加载修复
- Snapshot: snapshot:tasks/artifacts/fix-memory-characters-runtime/evidence/baade97428b09cc9f8b527a070298789dd782061281a9bb592ee70a06a0b79ee.json#baade97428b09cc9f8b527a070298789dd782061281a9bb592ee70a06a0b79ee
- Evidence: 执行日志001、002及T1/T2，实际加载观测证明重载不再复用store缓存
- Result clarity: 要求保持索引正常注入及预算降级；实现只调整模块加载
- Bounded impact: 只驱逐store直接缓存，不清理子依赖或其他扩展，不改变读写接口
- Low risk: store无顶层资源或会话状态；不写记忆、不自动重启服务，变更可局部回退
- Sufficient verification: 宿主jiti重复加载、真实索引注入和字节哈希、语法检查；当前用户会话重载与单元测试未执行并已披露
- Task fingerprint: 95207f2f05200f399a3dc4e80cc0dbeb65a8504f061b8710fe950c8869a22342

## Verification

- Passed: 最终重新调用before_agent_start，user/project索引全文与磁盘一致且无警告；受管快照校验当前源码，自评依据不变。
