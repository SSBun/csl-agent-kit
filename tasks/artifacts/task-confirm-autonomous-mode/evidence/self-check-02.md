# Skill 入口补齐自检

## 有效修订

用户纠正：“这个 task-mode 应该是一个skill，这样我才能在codex中使用，否者就检索不到”。主会话展示完整修订 Target：共享 Skill 可被 Codex 等受支持宿主发现并调用；支持三层查询、切换、恢复继承；复用配置；报告有效模式、来源及当前会话生效状态；保留 Pi 入口及全部原安全和质量边界。用户回复“确认执行”。

## 变化范围

- 新增 skills/meta/task-mode/SKILL.md 及 routing fixtures；复用原 shared CLI，不新增存储。
- Claude 显式 skills manifest 登记；Codex 既有 skills 根目录递归发现，无须更改 manifest。
- Pi 自动 Skill alias 跳过 task-mode，直接命令仍归 csl-settings，原生 /skill:task-mode 保留。
- 更新 README、Context 与发现／冲突回归用例。原三层配置代码及注入协议未改变。

## 观察证据

- Skill Quality 退出 0：0 failure，context-budget warning 1151 tokens。保留完整身份与生效边界，不为预算删除必要规则。
- Pi alias TypeScript 语法检查、新增／修改测试源码语法检查全部退出 0。
- Context validate：valid=true；git diff --check 通过。
- npm pack --dry-run --ignore-scripts --json 实际列出 shared task-mode.js lib／CLI、task-mode/SKILL.md、task-mode/evals/trigger_cases.json，证明发布包资源包含入口与依赖。未打包落盘、未发布。
- 直接解析 manifest：Codex skills 根 skills/ 下该 Skill 实际存在；Claude 登记为 true；shared CLI exists=true。
- 源码检查 Pi 自动 alias 在 registerCommand 前跳过 task-mode；直接命令未变。新增回归断言，但遵循用户规则未运行测试套件。

## 逐 Target 结论

T1–T4 原配置实现、Hook 注入和共享协议未改变；第一轮隔离 CLI／Hook 观察仍适用，相应字节身份将在 snapshot-02.json 中固定。T5 已有共享 Skill、实际分发路径、调用语义、错误处理及生效边界说明。无会话身份时明确仅为项目／全局解析，不冒充会话实际值。

## 限制

未更新用户已安装的 Codex 插件，未观察真实 Codex Skill 检索界面或调用；因此不声明用户当前 Codex 会话已经加载入口。需要安装包含当前源码的插件并按宿主方式重新加载，源码修改本身不完成部署。本次未执行单元测试、项目测试、真实 TUI、真实发布或模型行为回放。用户真实配置未改动。
