# 重写并测试图标生成 Skill

Status: Completed (2026-08-28 17:08)
Kind: Plan

## Scope

- 包含重写 `skills/domain/create-app-icon/SKILL.md`、加入最小的 Node.js `sharp` 绿幕去除脚本与兼容依赖、同步 README 描述，并通过一张非生产图标验证完整交互流程。
- 不修改外部 `imagegen` Skill，不自动生成用户尚未选择的平台素材，也不从单张扁平 PNG 伪造 Icon Composer 的分层 `.icon` 文件。
- 平台素材必须优先遵循目标项目已有资源结构和执行时的官方规范；本轮在透明主文件完成后先询问用户，再决定是否继续生成。

## Target
- [x] T1: `create-app-icon` Skill 按“确定风格 → 生成纯绿色背景原图 → 用户验收 → Node.js `sharp` 抠图 → 交付 1024×1024 透明 PNG → 询问是否生成 macOS/iOS/Android 标准素材”的固定顺序运行。
- [x] T2: 用户批准绿幕原图前不得抠图；修改意见会回到生成与预览阶段，源背景不合格或主体含冲突绿色时失败而不是输出伪正确结果。
- [x] T3: Skill package 的最小脚本、依赖和文档改动通过适用的非测试验证，透明输出可复现地验证为 PNG、1024×1024、含 alpha、角点透明且主体仍可见。
- [x] T4: 使用重写后的流程生成一张非生产用途的测试图标，向用户展示绿幕原图并取得验收后生成透明主文件，再询问是否需要 macOS/iOS/Android 标准素材。
- [x] T5: 根据用户选择，从透明主文件生成可直接用于当前项目的标准 macOS App Icon 素材目录，并验证清单、尺寸与 alpha 输出。

## Decisions

- 重写对象是现有 `create-app-icon` 叶子 Skill；Skill runtime prose、脚本帮助文本和其他 eval-facing prose 使用英文，任务计划和用户交互继续使用中文或用户当前语言。
- 将现有“只产出 prompt”的流程改为端到端状态机：读取必要的项目与品牌信息；让用户确定风格；生成绿幕原图；展示原图并等待批准或修改；批准后执行 `sharp` 抠图；验证并交付透明主文件；最后询问是否继续生成平台素材。
- 风格阶段同时确定主体、构图、配色、平台安全区和后续平台合成所需的背景意图。默认给出少量有区分度的候选；用户已给出完整风格时直接复述关键约束并继续，不重复访谈。因为固定使用绿色键背景，主体与边缘不得使用会被误删的同类绿色；冲突时先让用户调整图标配色。
- 图像生成优先使用当前宿主可用的原生图像生成能力，不把共享 Skill 锁死到 Pi 的工具名。Prompt 固定要求正方形、纯色 `#00FF00` 背景、无渐变/纹理/阴影/反射/地面/文字/水印、主体与边缘留足安全区且主体内不使用键色。宿主没有图像生成能力时，只交付可复制 prompt 并明确暂停，不能假装已经生成文件。
- 绿幕原图必须先以内联预览或宿主支持的等价方式展示。用户批准是独立阶段门；“继续”“抠图”等明确授权才允许进入后处理，任何视觉修改都重新生成并再次验收。
- 在 `skills/domain/create-app-icon/scripts/remove-green-background.mjs` 提供唯一的确定性后处理入口：读取获批原图、拒绝非正方形或不够均匀/不够绿色的边框背景、用 `sharp` 的 RGBA raw buffer 做带软边与去绿溢色的 chroma key、等比缩放为 1024×1024、强制写 PNG，并拒绝覆盖既有文件。只暴露输入与输出参数；阈值保持为脚本内部常量，验证失败时回到生成阶段，不增加未被需求驱动的调参接口。
- 脚本内置最小 `--self-test`：合成纯绿背景与非绿主体，执行同一处理路径，并断言输出为 1024×1024 RGBA PNG、角点透明且中心主体不透明。它是非测试套件的可运行自检，用来覆盖 raw-pixel 分支与循环。
- 将 `sharp@^0.32.6` 加入根 package runtime dependencies 并更新 lockfile；该版本线兼容当前 `node >=18` 契约，避免为采用要求更高 Node 版本的新版本而扩大本任务的 engine 边界。脚本在依赖缺失时输出明确安装提示。
- 透明主文件通过后，Skill 只问一次平台素材选择，明确列出 macOS、iOS、Android、可多选以及目标目录；未选择时结束。选择后先检查目标项目已有的 asset catalog、Icon Composer 文件或 Android `res/` 结构，再按其格式生成，并避免覆盖。
- Apple 分支优先沿用项目现有 `.appiconset` 或 `.icon` 工作流；单张透明主文件只能作为 Icon Composer 图层素材，不能宣称已生成真正的分层 `.icon`。iOS/macOS 的最终透明度、外边距和尺寸由目标格式及执行时 Apple Authority 决定。Android 分支以透明主文件作为 adaptive foreground，并在需要 legacy 图标时使用风格阶段确认的背景合成；格式和 density 列表以执行时 Android Authority 为准。
- 同步根 `README.md` 中 `create-app-icon` 的 prompt-only 描述，使其反映实际的生成、验收、透明 PNG 与可选平台素材流程；不改动其他 Skill 文档或清单。
- 当前工作区已有与本任务无关的 README、package manifest 和 lockfile 改动；执行时必须重新读取目标 hunks，仅追加本任务所需差异，不能覆盖或整理其他变更。

## Plan

1. 重写 `create-app-icon` 的运行时契约，完整表达风格选择、绿幕生成、用户批准门、Sharp 后处理、透明主文件验收、失败回退和最终平台素材询问。
2. 新增最小绿幕去除脚本并加入兼容现有 Node engine 的 `sharp` 依赖，确保获批原图能确定性转换和自检。
3. 同步该 Skill 的 README 描述，并补齐用户选择平台后的项目原生资源边界，不预先生成未选择的平台资产。
4. 执行语法、自检、metadata/alpha、Skill quality、陈旧引用和 diff 检查；不运行未获授权的单元测试或项目测试套件。
5. 按当前项目语义确定一套非生产测试风格，生成纯绿色背景原图并展示给用户；收到验收或修改意见前停止。
6. 用户批准后，用重写后的 Sharp 路径生成并验证 1024×1024 透明 PNG，再询问是否继续生成 macOS/iOS/Android 标准素材。
7. 按用户选择生成标准 macOS App Icon 素材目录，验证每个 manifest slot、实际像素尺寸和透明通道后交付。

## Result

- T1: 重写后的 SKILL.md 明确固定六阶段顺序；skill-quality 通过（970/1000 tokens，无 failure/warning）。
- T2: 会话先展示绿幕原图并等待用户明确“继续执行”；获批前未抠图，Sharp 首次验证失败也未写出无效文件。
- T3: Node 语法、自检、JSON、npm dependency、npm pack dry-run、diff 检查均通过；透明主文件实测为 1024×1024 RGBA PNG，四角 alpha=0。
- T4: 生成并展示非生产绿幕测试图标，用户批准后产出 output/create-app-icon-test/transparent-master.png，并询问平台素材后收到 macOS 选择。
- T5: 生成 AppIcon.appiconset 的 10 个 macOS slots 与 Contents.json；逐项像素/alpha 检查和 AppIcon.icns iconutil 往返验证通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 适用的非测试验证全部通过；按用户规则未运行单元测试或项目测试套件。
