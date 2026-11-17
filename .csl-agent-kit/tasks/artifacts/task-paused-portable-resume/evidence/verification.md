# 暂停与跨会话恢复验证记录

本记录是主 Agent 的实际检查观察，不是独立审查结论。检查对象为本任务修改后的源码及技能说明；最终版本由任务的 managed snapshot 固定。

## CLI 行为观察

使用系统临时目录创建工作区，通过独立 Node CLI 进程执行操作。完成后清除临时目录，未修改其他真实任务。

- 不完整恢复摘要被拒绝，原任务文件字节保持不变。
- `pause --input` 将任务及索引更新为 Paused；八项摘要经 JSON 输出完整回读。摘要包含换行、Markdown 标题和代码围栏，仍作为字符串数据，不改变任务章节。
- `check` 通过，`list --json` 识别 Paused。
- Paused 无法直接 complete、进入 In Review、返回 Pending，或以普通 status 入口进入 Paused 绕过摘要。
- 将整个临时工作区及部分成果复制到另一目录后，新 CLI 进程能读取原任务与摘要，以相对路径找到成果；`resume` 返回 In Progress 和保存的下一步。复制后的工作区 `validate` 通过。
- Paused 可以取消，原有 Cancelled 到 In Progress 的恢复仍可用。
- In Review 暂停保留 Required 审查义务，清除旧 Verification；恢复后仍保留 Required，未恢复旧验证。
- Blocked 任务拒绝 pause，原阻断状态保留。
- Queue 的 `next` 返回第一个 Paused 子任务，没有跳到后面的任务。

## 其他检查

- 两个修改后的 JavaScript 文件 `node --check` 通过。
- Pi 扩展以 Node 22.22.2 的 TypeScript stripping 加载成功。Node 提示包未声明模块类型并自动按 ES module 解析；未改动全包模块设置。
- task、task-plan、task-queue 的 skill-quality 检查均无 failure；存在技能初始上下文超预算警告，task 另有篇幅警告。保留必要指引，新增详细流程放在引用资源中。
- `git diff --check` 通过。

## 覆盖边界

未运行单元测试或项目测试套件，未运行会包含测试的 npm run check。未进行真实第二台电脑验证、云传输或新的 Agent 会话端到端回放；跨路径验证证明任务与摘要读取不依赖旧绝对根目录，不能证明任意外部工具和凭证可用。CLI 验证摘要字段结构，不验证人写的语义、外部文件存在或转移完成；现场核对及缺失依赖阻断由技能流程负责。Pi 扩展已验证模块加载，未验证当前运行中的宿主已重新加载或实际屏幕显示。

工作区开始前已有 Memory、Hook、规则等无关改动，Pi 扩展也已有任务面板错误恢复改动。本任务仅增加 Paused 的状态识别、图标、排序、分组及活动数量处理，不声称拥有这些既有改动。
