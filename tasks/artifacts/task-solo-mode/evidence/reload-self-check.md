# Pi 重载旧枚举回归自检

## 用户报告与原目标

用户运行 `/task-mode project solo`，在 Pi 显示 Reloaded 后仍报 `Error: Mode must be confirm, autonomous, or inherit`。截图已读取。此为原 SOLO 配置入口结果的回归纠正，任务重开补验 T4，不改变用户配置或恢复 X 批次。

## 根因与最小复现

- `pi/lib/csl-settings.ts` 使用 Node `createRequire(import.meta.url)` 加载 shared task-mode.js，并将其函数导出给设置命令。
- 当前已安装 Pi 的 extension loader 使用 jiti `moduleCache: false`，但 native createRequire 仍使用 Node CommonJS require.cache。
- 在临时目录中复制真实 TypeScript helper 和 shared 模块，初次写入旧 autonomous 枚举并用实际已安装 jiti(moduleCache=false) 加载。随后在同一 Node 进程内把 shared 文件替换成当前 SOLO 版本，再以新 jiti 实例重载 TS helper，调用 saveTaskMode(project, solo)。所有配置路径固定到临时 CSL_AGENT_KIT_HOME。
- 修改前实际输出：`On-disk shared module: SOLO`、`Reloaded call: Mode must be confirm, autonomous, or inherit`。复现了截图同类错误，不依赖用户设置或真实 X 页面。

## 修复与观察

设置 helper 重载时 resolve shared task-mode 的精确模块路径，只 delete 该 require.cache 条目，再 require。该直接依赖无状态且仅使用 Node 内建模块；不递归清理模块图，不清空整个缓存。

相同复现步骤，使用修复后的真实 helper，实际输出：

```text
On-disk shared module: SOLO
Reloaded call: accepted solo
Resolved mode: solo
```

临时目录与配置已删除。该观察来自同进程升级／重载路径，而不是仅新启动进程的 import。

## 配置来源核对

只读查看本机 Pi settings 的 packages／extensions：全局 package 指向当前本地 CSL 仓库；MyTwitter 的 `.pi/settings.json` 不存在。未修改安装配置，未查看或更改真实模式文件。没有检查用户运行中进程的额外命令行扩展参数，所以不把这项静态配置观察夸大为所有可能加载路径的证明。

## 改动与验证

- pi/lib/csl-settings.ts：定向驱逐旧 task-mode 模块缓存。
- tests/pi-settings.test.mjs：增加旧原生缓存条目下重新 import helper 的回归断言，检查 solo 可写及无关 task-core 缓存保留；源码语法检查通过，未运行该测试。
- README、Context：说明重载代码缓存与旧安装副本的区别；原 SOLO 权限、配置和流程语义未改。
- 执行 `node --experimental-strip-types --check pi/lib/csl-settings.ts`、`node --check tests/pi-settings.test.mjs` 与 `git diff --check`，全部退出 0。
- T1–T3 的规则和 shared 配置代码未改；新增 T4 由同进程 jiti 前后复现支持。

## 限制

未运行单元测试或项目测试套件，未在用户当前 TUI 进程中实际执行 /reload，也未更新插件或修改真实配置。完成后用户需再次 /reload 以加载修复；若实际加载的是旧安装副本，单纯 /reload 仍不能更新副本。保留前轮模型回放、TUI、真实发布的覆盖限制。
