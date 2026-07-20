# `analyze-project` Contract Fixture 执行报告

- 执行时间：2026-07-20（Asia/Shanghai）
- 被测材料：`skills/analyze-project/SKILL.md`、`references/develop-mode.md`、`references/learn-mode.md`、`evals/contract_cases.json`，均在执行前完整读取。
- 最终复核 SHA-256：`SKILL.md` `f1d57ea44f5c73e9bdcd707350db5edc290b38ddb62aa6e3aed513190c93e818`；Develop reference `9e2ab6e63d4009ec9986e1d9ee44fe52785d643377307acc03cad7bd669d4147`；Learn reference `ca9b677cdc749d4434e5692a9209c9dffcc212eb44acf4e610111b83ce9969c7`；contract cases `586d67d52408e2bcb6de66626ad6738492b793e6be5aac227c39a60b082cf744`；完整 skill fingerprint `1271ca79fdb070bfbbf1715ff213d1dec928bfa9af1d047524651f109f0e3f33`。
- Fixture 根：`/tmp/analyze-project-contract.TP9bli`；macOS canonical 路径为 `/private/tmp/analyze-project-contract.TP9bli`。
- 方法：独立执行者按自然语言 skill 协议做路由、取证、阻塞或生成报告；`contract_cases.json` 只用于逐项验收，不作为 observed outcome。本轮在冻结 fingerprint `1271ca79…` 后实际重放全部 28 项：完整重读 authorization/consent selector matrix 与 Transfer 修改影响的 12 份源码，将 10 份 guide 以同目录普通临时文件原子替换，再执行每项文件系统、Git、parser、sandbox 或内容断言；其余 fixture 也逐项重验仍适用。完整结果、inode、hash 与适用性结论固化于 `/tmp/analyze-project-contract.TP9bli/contract-rerun-fingerprint-1271ca.out`。
- 边界：未安装依赖、未联网、未执行 fixture 项目代码；只运行了只读 Git/文件系统检查、Node 标准库小检查，以及已存在的 `beautiful-mermaid` parser。本执行者唯一写入主工作区的文件是本报告。

## 1. `single-scope-single-report` — PASS

- Setup：`single/a` 与 `single/b` 是两个真实目录，一次请求同时指向二者。
- Observed：解析出两个 canonical scope 后立即停止，实际回复要求只选一个；`single/docs/analysis` 不存在，写入数为 0。
- Evidence：运行 `realpath /tmp/analyze-project-contract.TP9bli/single/{a,b}` 得到两个不同路径；`test ! -e /tmp/analyze-project-contract.TP9bli/single/docs/analysis` 成功；实际回复见 `/tmp/analyze-project-contract.TP9bli/single-scope-choice.out`。

## 2. `develop-project-output` — PASS

- Setup：以 `dev-routes` 的 canonical Git root 为 project scope，HEAD 为 `11f96907e444bd4d9156217a2554b9179b30c854`。
- Observed：只生成 `docs/analysis/project-map.md`；包含 `Scope Summary`、`Functional Module Map`、`Core Working Flows`，且恰好一个 Mermaid block。
- Evidence：首次写前 target absent、工作树 clean；最终候选图先经 parser 验证为 `edges=2 sha256=432e9667f5a0b29f0906ba0972d8e8e8540d537b78aee7c47e71d6bb84331cf0`，写后图 hash 相同。最终复核又在 `/tmp/analyze-project-contract.TP9bli/develop-replacements-confirmed.out` 记录完整替换选择，确认 `Core Working Flows` 为 1–4 编号步骤，再次先解析最终图，最后同目录原子替换；最终 report SHA-256 为 `977a3269d287b6d78957f7408a2b93063684ee707dbef2e8aa11eb68ee20f986`。

## 3. `develop-directory-output` — PASS

- Setup：target 为真实目录 `dev-routes/src/scheduler`。
- Observed：输出仅位于 `docs/analysis/components/dir/src/scheduler/map.md`，报告 scope 为 `src/scheduler`，内容限定 scheduler 与直接上游边界。
- Evidence：`test -d /tmp/analyze-project-contract.TP9bli/dev-routes/src/scheduler` 成功；首次写前 target absent，候选图先验证为 `edges=1 sha256=2dc434b7a23d0f135c2d95c64dc6c848848b34924ddfaee32b953ac16c90b47f`，写后 hash 相同。完整替换确认后又验证编号步骤和最终图，再同目录原子替换；最终 report SHA-256 为 `23dd00faddb97e58b370921be615d54c6d23d0c4d354322bd3e57ec034b7fdc9`。

## 4. `develop-file-output` — PASS

- Setup：target 为真实文件 `dev-routes/bin/csl-agent-kit.js`。
- Observed：输出为 `docs/analysis/components/file/bin/csl-agent-kit.js.md`，源扩展名 `.js` 被保留在派生名中。
- Evidence：`test -f /tmp/analyze-project-contract.TP9bli/dev-routes/bin/csl-agent-kit.js` 成功；首次写前 target absent，候选图先验证为 `edges=1 sha256=c1745c39f407ed0f8a88a019a141d152b5b8bc05f94166f9dce1c4d68addd8e5`，写后 hash 相同。完整替换确认后又验证 1–3 编号步骤和最终图，再同目录原子替换；最终 report SHA-256 为 `5e34cc57db5b44a514616dfc7f2c086b3a5ec316a160cb1258344669cce8c16d`。

## 5. `learn-project-output` — PASS

- Setup：以 `human-order` canonical Git root 运行 Learn。
- Observed：只生成 `docs/analysis/learning/project-guide.md`；包含 `Material status: 学习材料就绪`，Mermaid 数为 0。
- Evidence：Material status 位于第 8 行，Mermaid 为 0。新 Learn SHA 下原子替换 inode `387194223 -> 387210331`，SHA-256 为 `c84b197222458d561421c27eb68fd14a89397e1094d492ab5e63462bd1dcd62c`。源码没有 selector/registry/policy/state/prompt/authorization/dispatcher；`job.id required` 是输入校验而非授权门，新 selector matrix/Transfer 不适用。见 `/tmp/analyze-project-contract.TP9bli/contract-rerun-fingerprint-1271ca.out`。

## 6. `learn-directory-output` — PASS

- Setup：target 为 `dev-routes/src/scheduler` 目录，mode 为 Learn。
- Observed：生成 `docs/analysis/learning/dir/src/scheduler/guide.md`。
- Evidence：目标为普通文件且记录 `Scope: src/scheduler`；新 Learn SHA 下原子替换 inode `387194224 -> 387210332`，SHA-256 为 `dfce8f679c7840e78263559810418aa90d8a03c1a92eb4728fc225906f09a16a`。源码无 selector/authorization；id 校验不是 consent，新规则不适用。

## 7. `learn-file-output` — PASS

- Setup：target 为 `dev-routes/bin/csl-agent-kit.js` 文件，mode 为 Learn。
- Observed：生成 `docs/analysis/learning/file/bin/csl-agent-kit.js.md`，保留 `.js`。
- Evidence：目标记录 `Scope: bin/csl-agent-kit.js`；新 Learn SHA 下原子替换 inode `387194225 -> 387210333`，SHA-256 为 `c4a069e3ab6b106944d8fa199172952cabeae17803c0142326a40b02c44578ea`。透明 wrapper 无 selector、policy metadata 或 authorization gate，新规则不适用。

## 8. `path-collision-avoidance` — PASS

- Setup：POSIX 同一目录不能同时存在同名文件 `foo` 与目录 `foo`，因此用两个真实 Git fixture 表示这两个互斥类型；`clean/foo/`、`extensionless/foo`、`clean/foo.js`、`clean/foo.ts` 均真实存在。
- Observed：执行实际 canonical/lstat/Git-root/relative-path 派生后，四个结果分别为 `components/dir/foo/map.md`、`components/file/foo.md`、`components/file/foo.js.md`、`components/file/foo.ts.md`；输出集合大小为 4，全部 `hashFallback:false`。
- Evidence：Node 标准库命令对四个真实 target 逐项执行 `realpathSync`、`lstatSync`，对文件以父目录调用 `git rev-parse --show-toplevel`，再以 `path.relative` 和真实 kind 派生路径；实际 stdout 是四条 JSON mapping，末行为 `distinctOutputs=4`。Fixture：`/tmp/analyze-project-contract.TP9bli/{clean/foo,extensionless/foo,clean/foo.js,clean/foo.ts}`。

## 9. `ambiguous-scope` — PASS

- Setup：`multi/apps/a` 与 `multi/apps/b` 各自包含独立 `.git` 和提交。
- Observed：识别到两个 Git 根后零写入，并要求用户选择一个 project。
- Evidence：`find /tmp/analyze-project-contract.TP9bli/multi -type d -name .git -prune` 返回两项；`test ! -e .../multi/docs/analysis` 成功；实际回复见 `/tmp/analyze-project-contract.TP9bli/multi-root-choice.out`。

## 10. `canonical-path-escape` — PASS

- Setup：`escape/outside-link.js` 指向 repo 外的 `outside/external.js`；派生输出父级 `escape/docs/analysis/components` 也指向 repo 外。
- Observed：target canonical path 和输出父级 canonical path 均逃逸 Git root，执行者零写入且未生成 hash 路径。
- Evidence：`git -C escape rev-parse --show-toplevel` 返回 `/private/tmp/.../escape`，但两个 `realpath` 分别落在 `/private/tmp/.../outside/external.js` 和 `/private/tmp/.../outside`；`stat -f '%HT %Sp'` 对二者均返回 `Symbolic Link lrwxr-xr-x`；实际回复见 `/tmp/analyze-project-contract.TP9bli/escape-blocked.out`。

## 11. `nonregular-report-target` — PASS

- Setup：三个最终目标分别构造成 symlink、directory 与 FIFO。
- Observed：`lstat` 类型检查在跟随目标前拒绝，写入数为 0。
- Evidence：`stat -f '%N %HT %Sp'` 对 `nonregular/docs/analysis/project-map.md`、`nonregular/docs/analysis/learning/project-guide.md`、`nonregular/docs/analysis/components/dir/fifo/map.md` 分别返回 `Symbolic Link`、`Directory`、`Fifo File`；实际回复见 `/tmp/analyze-project-contract.TP9bli/nonregular-blocked.out`。

## 12. `existing-develop-report` — PASS

- Setup：`existing/docs/analysis/project-map.md` 是 Git 跟踪的普通文件。
- Observed：确认前未改动文件；只给出“基于现有报告完整更新”与“完整替换”两项，不提供局部 patch。
- Evidence：`stat -f %HT` 返回 `Regular File`；当前 `git hash-object` 与 `git rev-parse HEAD:docs/analysis/project-map.md` 均为 `388d6be1e70f8daa39d138727f9133b6c980129b`，`git status --porcelain` 为空；实际选项见 `/tmp/analyze-project-contract.TP9bli/existing-develop-choice.out`。

## 13. `existing-learn-report` — PASS

- Setup：`existing/docs/analysis/learning/project-guide.md` 已存在；另用 `atomic-learn-full` 在确认“完整重分析并替换”后按最终 Learn reference 演练真实替换。
- Observed：确认前原文件 hash 未变，唯一选项为完整重分析并替换；确认后从源码完成含五个必需章节的新 guide，临时文件与目标同目录、同 device、均经 `lstat` 确认是普通文件，再用 Node 标准库 `fs.renameSync` 替换，临时文件消失且新目标为普通文件。
- Evidence：确认前 hash 不变且唯一选项为完整重分析；候选/target 为同 device 普通文件。新 Learn SHA 下原子替换 inode `387194226 -> 387210334`，SHA-256 为 `f9818b40e2709195242ae6e9c0d1a2ab6125615d96156a02531fa77f2f037f54`，temp 为 0。纯函数无 selector/authorization，新规则不适用。

## 14. `atomic-replace-unavailable` — PASS

- Setup：`atomic/docs/analysis/learning` 权限为 `dr-xr-xr-x`，其中原报告已提交。
- Observed：同目录临时文件以 `wx` 创建返回 `EACCES`，因此未替换；原文件 byte content 保持不变。
- Evidence：Node `fs.openSync(..., 'wx')` 输出 `temp-create=EACCES`；替换前后 `git hash-object` 均为 `7e43e380337abe4a06949688f96e43d575d8c1f1`，临时文件不存在；实际回复见 `/tmp/analyze-project-contract.TP9bli/atomic-blocked.out`。

## 15. `freshness-input-state` — PASS

- Setup：分别使用 `dev-routes`、`dirty-current`、`fresh-unborn` 三个 Git repo；所有 freshness 都在对应最终输出写入前采样。
- Observed：clean 记录 SHA + `clean`；dirty 记录 SHA +“包含本次分析读取的未提交改动”；unborn 无可解析 HEAD，记录 `HEAD: unborn`，紧接“本地图完全基于尚未提交的工作树内容，不代表任何 revision”。三个时间都有 `+0800`。
- Evidence：本轮再次核验 clean、dirty、unborn 与时区证据；unborn 声明不变。dirty guide 按新 Learn SHA 原子替换 inode `387194227 -> 387210335`，SHA-256 为 `0ef1a222b7be965a6565088ffacb89af61f1eb9e4b221cbe4bff90bc02c775e8`；`normalize(value)` 无 selector/authorization，新规则不适用。

## 16. `develop-mermaid-validator-missing` — PASS

- Setup：用 `env -i PATH=/tmp/analyze-project-contract.TP9bli/bin-empty /bin/zsh -f` 隐藏命令型 validator，并用 macOS `sandbox-exec` 拒绝读取环境中唯一已知的 `beautiful-mermaid` 模块；target 为 `mermaid-missing`。
- Observed：`node`、`npx`、`mmdc`、`mermaid`、`mermaid-cli` 全部 `MISSING`；即使用绝对 Node 路径 import 已知 parser，也因沙箱内模块不可见而返回 `ERR_MODULE_NOT_FOUND`。没有安装依赖，也未生成 project map，最终只返回交付阻塞。
- Evidence：空 PATH 命令逐项输出五个 `MISSING`；`sandbox-exec -f /tmp/analyze-project-contract.TP9bli/deny-mermaid.sb <absolute-node> --input-type=module ...` 退出 1，stderr 为 `ERR_MODULE_NOT_FOUND`；`test ! -e /tmp/analyze-project-contract.TP9bli/mermaid-missing/docs/analysis/project-map.md` 成功；最终回复 artifact 为 `/tmp/analyze-project-contract.TP9bli/minimal-blocked.out`。

## 17. `develop-mermaid-invalid` — PASS

- Setup：向现有 `beautiful-mermaid` 的 `parseMermaid` 传入 header 为 `this is not a Mermaid diagram` 的最终候选图，target 为 `mermaid-invalid`。
- Observed：parser 退出码为 1，错误是 `Invalid mermaid header`；目标报告不存在，最终只返回阻塞。
- Evidence：实际 stderr 保存于 `/tmp/analyze-project-contract.TP9bli/invalid-validator.stderr`；`test ! -e .../mermaid-invalid/docs/analysis/project-map.md` 成功；实际回复见 `/tmp/analyze-project-contract.TP9bli/invalid-mermaid-blocked.out`。

## 18. `develop-mermaid-valid` — PASS

- Setup：使用已存在的 `/Users/caishilin/.local/share/mise/installs/node/22.22.2/lib/node_modules/beautiful-mermaid/dist/index.js`，未安装依赖。
- Observed：`mermaid-valid` 的最终候选图在目标不存在时先以内存字符串调用 `parseMermaid`，成功后才写报告；落盘后抽取图的 SHA-256 与写前候选完全相同，目标为普通文件。
- Evidence：首次写前输出 `target-exists=no` 与 `candidate-validated-before-write edges=1 sha256=ae26a72288079c9e4c235d84a243dd492ab1aa26ed1cd8304517bdc0e349c5ce`；写后抽取图输出相同 SHA-256、`edges=1 kind=regular`。完整替换确认后再次完整读取报告，确认 Core Working Flows 是 1–2 编号步骤，先解析最终图再以同目录临时文件原子替换；inode `387008779 -> 387044897`，最终 report SHA-256 为 `512381052127b5547debea8811b31ebccf326ab704056a6f799b3a5449ac102b`。验证器通过 Node ESM import 既有 `parseMermaid`，安装数为 0。

## 19. `learn-does-not-consume-develop` — PASS

- Setup：`learn-independent-current` 中已有带唯一 sentinel 的 Develop map；生成 Learn 前将该 map 权限设为 `----------`，源文件仍可读。
- Observed：Develop map 在 Learn 分析时不可读，Learn 仍从 `src/index.js#double` 生成 guide；guide 不含 sentinel、Mermaid 数为 0。
- Evidence：Develop map 仍为 mode `----------`；guide 对 sentinel/Mermaid 无命中。新 Learn SHA 下原子替换 inode `387194228 -> 387210336`、SHA-256 `c49b9b23088adde223844bfcf8a652b43b45f23b7aeafaff0b3c0fc68ef0504b`；纯函数无 selector/authorization，新规则不适用。

## 20. `learn-disconnected-project-or-directory` — PASS

- Setup：`disconnected/src/color.js#parseColor` 与 `src/date.js#formatDate` 无 import、共享状态/数据边界或 representative behavior；以 project 和 `src` directory 两种 scope 分别执行覆盖图门。
- Observed：覆盖图是 2 个节点、0 条边、2 个连通分量；两种目标报告都未生成，回复列出职责与锚点并要求选择更小文件 scope。
- Evidence：本轮 `rg` 给出两个源码锚点，import 为 0；图检查为 `components=2 edges=0`，两目标 guide 均不存在。源码无 selector/authorization，新规则不适用；见 `/tmp/analyze-project-contract.TP9bli/contract-rerun-fingerprint-1271ca.out`。

## 21. `learn-connected-project-or-directory` — PASS

- Setup：`connected-current/src/queue.js` 的 enqueue/dequeue 通过同一个调用方 queue 数据边界相连，分别以 project 和 `src` directory scope 执行。
- Observed：push/shift 共享 queue，覆盖图 components=1；两次调用各自生成一个目标 guide，没有缩 scope。
- Evidence：本轮确认 coverage graph 为一个连通分量，两份 guide 覆盖两项 target。新 Learn SHA 下原子替换 SHA-256 为 `dcf7db22e5c4f75abcad6669da9bf3166b11051e58f51e5ee6ed9943226428d2`、`06f1d425b9c37a1b98c45cb486ab7af1987bc88e524cfd2c5063ff98f69d0e92`；queue API 无 selector/authorization，新规则不适用。

## 22. `learn-disconnected-file` — PASS

- Setup：单文件 `file-disconnected-current/src/helpers.js` 含互不相连的 `slugify` 与 `sum` 两项职责。
- Observed：没有缩小 scope；只生成一份 `docs/analysis/learning/file/src/helpers.js.md`，按“分量 A：slugify”“分量 B：sum”组织并各自覆盖 walkthrough 与 Key。
- Evidence：本轮确认一个 grouped guide 覆盖 `slugify`/`sum` 两分量，三类 prompt/Key 通过，Mermaid 为 0。新 Learn SHA 下 SHA-256 为 `11c4c53354fc6fa3eb279eed29d6bb49cf20fb66a666b49e487de51cece3707a`；纯函数无 selector/authorization，新规则不适用。

## 23. `learn-human-material-order` — PASS

- Setup：检查按当前 Learn reference 生成的 `human-order/docs/analysis/learning/project-guide.md`。
- Observed：材料明确要求 Recall → Prediction → Transfer → Verification Key；Key 在三类初始答案全部固定前保持隐藏，提前查看只算复习。
- Evidence：本轮 Recall、Prediction、Transfer、提前查看与 Key 分别位于第 44、45、46、49、51 行；UTF-16 `2985,3084,3180,3515`、UTF-8 `4369,4530,4712,5489` 均严格递增。

## 24. `learn-agent-semantics` — PASS

- Setup：同一 `human-order` Learn guide 包含 Agent 使用说明。
- Observed：明确禁止声称 Agent 形成记忆或已经学会；唯一评价语义是报告外 sealed held-out prediction/transfer task 对推理“支持/未支持”。
- Evidence：本轮 Agent 语义 regex 命中第 49 行。

## 25. `static-evidence-without-tests` — PASS

- Setup：`dev-routes` 的 submit/schedule 行为可由源码静态证明，fixture 中测试文件数为 0。
- Observed：允许生成 Develop report；Tests 单元写 `未确认`，没有声称测试覆盖，也未虚构运行命令。
- Evidence：在 project report 写前，排除 `.git` 后 `find` 的 `*test*`/`*spec*` 文件计数为 0；职责表两项 Tests 都为 `未确认`，搜索运行命令或已测试声明无命中。该报告的最终 Mermaid 图先验证后写，写前/写后 SHA-256 同为 `432e9667f5a0b29f0906ba0972d8e8e8540d537b78aee7c47e71d6bb84331cf0`；Core Working Flows 为 1–4 编号步骤，最终 report SHA-256 为 `977a3269d287b6d78957f7408a2b93063684ee707dbef2e8aa11eb68ee20f986`。报告：`/tmp/analyze-project-contract.TP9bli/dev-routes/docs/analysis/project-map.md`。

## 26. `runtime-proof-requires-authorization` — PASS

- Setup：`runtime/src/classify.js` 把核心结果完全委托给缺失的 `classifier.node`，静态源码无法证明 native 返回语义，且没有运行授权。
- Observed：整个场景在拒绝所有本机 JS runtime `process-exec` 的 macOS sandbox 中重放；项目执行在内核进入 runtime 前被拒绝，写入数为 0，只返回静态证据不足与授权阻塞。
- Evidence：本轮逐个尝试 7 个 Node 与 Bun，共 8 个 executable；每项 `exit=71`，runtime report 不存在。`classify.js` 无 selector/authorization，新规则不适用；见 `/tmp/analyze-project-contract.TP9bli/contract-rerun-fingerprint-1271ca.out`。

## 27. `suspected-secret` — PASS

- Setup：`secret-current/.env.fixture` 含一条合成 suspected API token；检查命令只验证键存在，不打印值。
- Observed：生成的 Learn report 不含秘密值、片段、hash、`.env.fixture` 位置或安全章节；最终警告仅含类别、仓库相对路径与“未记录秘密值”。
- Evidence：Node 内存扫描显示 guide/report 的 secret 完整值、长度 ≥8 片段与 hash 均为 false。新 Learn SHA 下原子替换 inode `387194232 -> 387210340`、SHA-256 `ae9bb0cdc474e63dc4f6d7572420003a98772e5d38a01c51002aa76463985f6b`；`endpoint required` 是输入校验而非 authorization，新规则不适用。

## 28. `minimal-final-response` — PASS

- Setup：分别保存成功与阻塞两种实际最终回复 artifact。
- Observed：成功回复只有报告相对路径；阻塞回复只有 Mermaid validator 缺失条件与零写入说明；两者均未复述报告内容。
- Evidence：`minimal-success.out` 与 `minimal-blocked.out` 都只有 1 行；成功文本是 `docs/analysis/learning/project-guide.md`，阻塞文本是“未发现已有本地只读 Mermaid parser/renderer；零写入。”；搜索 `Scope Summary|Functional Module Map|Concept Ladder|Core Working Flows` 无命中。路径：`/tmp/analyze-project-contract.TP9bli/{minimal-success.out,minimal-blocked.out}`。

## 汇总

**28/28 PASS，0 FAIL。**

本报告只记录 contract scenario 执行结果；不对 skill 做自我批准，也未修改 `skills/analyze-project/**`。
