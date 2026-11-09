# Memory Dashboard 使用固定端口

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 17:02) |
| Artifacts | [Artifacts](../artifacts/memory-dashboard-stable-port/) |
| Kind | Task |

## Scope

固定本机Dashboard端点，优先保留当前端口和已有授权；端口冲突失败关闭，不自动抢占或换端口。继续仅loopback、Host/Origin、Bearer和CSP保护，不强制中断维护任务。稳定端口不承诺后台停机时仍可打开。

## Plan

1. 将持久端口与令牌从临时进程描述符分离；旧服务restart前保存现有端点。
2. 启动使用持久端口，冲突明确报告，dashboard有限等待就绪或错误。
3. 在隔离运行目录核验重启、冲突恢复、损坏配置和授权检查。
4. 独立审查后空闲重启真实服务，验证保留当前地址并再次重启验证稳定性。

## Execution Log

### 001 — 根因与实现

旧daemon使用listen(0)和每次随机token，stop删除daemon.json；所以端口和浏览器授权均会在重启时失效。新增endpoint.js，在专用锁内初始化并校验endpoint.json；优先沿用旧descriptor，否则全新安装使用47831及随机32字节token。创建沿用runtime原子写入0600权限。saved null、无效端口或损坏JSON均失败关闭，JSON解析错误不泄露原文。service.restart在旧descriptor删除前保存端点，保留ifIdle保护。daemon按保存端口监听，EADDRINUSE记录DASHBOARD_PORT_IN_USE；启动错误记录code，dashboard只有限等待就绪，不重复spawn。文档说明持久凭据的保密及撤销方式。

### 002 — 隔离进程验证

通过/tmp/csl-memory-stable-port-smoke.cjs启动实际daemon子进程，使用独立临时CSL_AGENT_KIT_HOME，不运行模型维护或项目测试套件。最终隔离目录为/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/csl-stable-port-k8XcTJ。

实际观察：首次保留原descriptor的端口和token，文件mode600；连续两次restart前后URL相等。旧凭据HTTP200，无凭据401，外部Origin403，原生HTTP请求错误Host403。占用固定端口后dashboard返回running=false、DASHBOARD_PORT_IN_USE，配置端口不变；释放后原URL恢复。非法端口、JSON null、损坏JSON都INVALID_ENDPOINT，损坏JSON响应不包含令牌。全新配置默认47831、mode600。检查过程中不打印或存档授权URL/令牌。

### 003 — 自检与部署边界

三个JS语法和git diff --check通过。实际用户服务尚未切换，初查端口55815、active=0；最终部署时须重新检查，不能将旧空闲观察当授权绕过ifIdle。task_focus返回Canonical task not found已披露，未迁移或复制任务。

### 004 — TR-1修正及隔离复核

首轮独立审查确认：端点锁争用的LOCKED会被daemon入口误当重复服务而静默忽略。已核对并修正为只在获取daemon.lock处忽略预期争用；拿到daemon锁后任何启动错误均记录并失败退出。使用实际子进程重跑隔离操作：重复daemon退出0且原PID不变、startupError=null；另一个进程持有endpoint.lock时dashboard报告LOCKED并明确endpoint.lock，daemon锁已释放；释放端点锁后同URL恢复。两次重启地址一致、401/403、端口冲突恢复和损坏配置拒绝也再次通过。最终本轮隔离目录为/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/csl-stable-port-tHobq3。未执行测试套件。

## Task Summary

**Memory 服务**：组件 [memory](../../../bin/memory/) 增加私有持久端点，正常重启保留端口与令牌；启动冲突及配置损坏失败关闭，Dashboard启动提供有限就绪等待和具体错误。

**Memory 文档**：组件 [docs](../../../docs/) 说明固定端口、旧安装沿用规则、冲突处理与持久凭据撤销边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 独立端点文件复用已有锁及原子写入，不引入代理、自动换端口或新服务。 | 无已知实质缺口。 |
| 稳定性 | A | 实际隔离daemon验证重复重启、原凭据及401/403、冲突恢复、损坏配置拒绝；额外确认重复daemon不影响原进程、端点锁失败可观察且释放后恢复，语法检查通过。 | 未运行单元/项目测试套件；本机凭据是权限保护而非加密。 |
| 完整性 | A | 固定端点与冲突语义已在真实隔离进程观察；实际服务部署安排在审查后。 | 不提供后台停机时的自动唤醒；task_focus绑定异常已披露。 |

## Target
- [x] T1: Memory Dashboard 在后台正常重启后保持固定访问端口，不再每次随机变化。
- [x] T2: 固定端口被占用时明确报告冲突，不静默切换端口；保留本机访问与授权保护。

## Result

- T1: 隔离实际daemon首次沿用旧descriptor，连续两次restart后URL完全一致，旧token仍获200；真实用户服务部署留到审查后。
- T2: 最新隔离运行再次确认DASHBOARD_PORT_IN_USE/无fallback及释放恢复；401/403保护、mode600及非法配置拒绝。TR-1修正后端点锁争用记录LOCKED并释放daemon锁，释放端点锁后同URL恢复；重复daemon退出0且原进程及startupError不受影响。
- Review gate: Passed — 新上下文只读复审8f3e3d71确认TR-1 resolved，无新增问题或实现审查阻塞风险；round02已持久化，源码及报告复核verified。实际空闲部署与重启核验仍须最终完成。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 服务启动恢复和授权生命周期改动；TR-1锁错误修正后需新独立复核。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-dashboard-stable-port/evidence/966371aa194323121d53b47d223cfc24f9411449c8394a966c8ff6a6eae6e801.json#966371aa194323121d53b47d223cfc24f9411449c8394a966c8ff6a6eae6e801
- Evidence: Execution Log 002/004与T1/T2，最新实际隔离进程含两类锁争用及授权/端口场景。
- Task fingerprint: ad1c9049ab939d7b8b57c6e60bed89e1bf58fe7bb6e95579a2c65f3e78b7778d
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-dashboard-stable-port/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-dashboard-stable-port/evidence/69b9bf41f3cf5150bf6bea20082b42a93931b738dcf7261d9033b0dde1d9baf1.json#69b9bf41f3cf5150bf6bea20082b42a93931b738dcf7261d9033b0dde1d9baf1 | findings | a82954f60dbf7f2c123005f2654e872add20afc8151cef40d452750b50fe801d |
| 02 | [Round 02](../artifacts/memory-dashboard-stable-port/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-dashboard-stable-port/evidence/966371aa194323121d53b47d223cfc24f9411449c8394a966c8ff6a6eae6e801.json#966371aa194323121d53b47d223cfc24f9411449c8394a966c8ff6a6eae6e801 | no blocking findings | 8db89964dfb8f80374014950de5f628150e6caa3f3a8a0e211e719a66227abc3 |

## Verification

- Passed: 复审后先观察active=1未重启，有限等待空闲后执行ifIdle保护restart升级：PID变化、原端口55815及token均保持；随即在再次确认空闲后第二次restart，PID再次变化且完整授权URL相同。真实HTTP旧token200、未授权401、错误Origin403及原生HTTP错误Host403；endpoint与descriptor一致，文件mode600。服务running且已请求浏览器打开。最终三份JS语法、git diff检查及当前源码/两份review报告check-evidence全部通过。Self Assessment的部署步骤已按审查后执行，其他边界不变；未运行单元或项目测试套件，task_focus失败先前已披露。
