# Learn 模式

目标：生成一份源码驱动的掌握指南，建立理解顺序、代表行为的因果模型，以及严格的 recall、prediction、transfer 检验。生成报告只表示“学习材料就绪”。

默认人类会读目标语言基本语法，理解 Git、测试和常见工程术语，但不熟悉本仓库；默认 Agent 能读取 Markdown 与源码锚点，但没有现成心智模型。只有用户明确要求定制时才改变假设。

只有 scope 不唯一、Learn/通用教学路由不清，或用户要求定制却未提供背景时，才问一个聚焦问题。缺少通用前置知识会使本次 Learn 无法成立时，只询问是否先转对应教学能力。

v1 独立从源码取证，不读取或自动生成 Develop map，不生成 Mermaid，不创建课程、进度或完成状态。

## 报告顺序

### 1. Learning Orientation & Targets

先记录：

- `Scope`：仓库相对路径；project 写 `.`。
- `HEAD`：commit SHA 或 `unborn`。
- `Working tree`：`clean` 或“包含本次分析读取的未提交改动”。
- `Generated at`：带时区时间。
- `Learner assumption`：实际采用的假设。
- `Material status`：`学习材料就绪`。

用数句源码锚定的内容说明 scope 对项目的贡献、可观察输入/输出及直接边界；不展开 Develop 的完整 Summary、Module Map 或 Working Flows。

随后列出可检验 Learning Targets、必需前置和明确不覆盖内容，并给出覆盖表：

```markdown
| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
```

每项主要可观察职责必须经 target、behavior/checkpoint、check 与 Key 形成完整覆盖链；同一行为可覆盖多个 target，仅为覆盖缺口增加行为。

### 2. Concept Ladder

```markdown
| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
```

项目含义、行为关系与因果结果由源码证明；顺序是基于证据的教学决策，只给最短理由，不声称源码证明唯一顺序。只保留覆盖 targets 所需概念。

### 3. Guided Code Walkthrough

选择覆盖 targets 的最小 representative behavior 集合，从真实入口/边界走到可观察输出，包含改变理解的主要失败或对比分支。

```markdown
| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
```

事实就地附源码锚点；另用一句话说明选择该行为的教学理由。不得复制 Develop 的完整流程地图。

### 4. Human Recall, Prediction & Transfer Checks

报告必须明确下面的材料开放顺序，且把 prompts 与 Verification Key 分开：

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 和源码，只看 recall prompt 并独立作答。
2. **Prediction**：正文可见，Key 与源码仍隐藏；先固定预测和理由。
3. **Transfer**：正文与源码可见，Key 仍隐藏；固定入口、影响边界、验证位置与理由。
4. 三类初始答案全部固定后才打开 Key，用报告和源码逐项核对并补充解释。

Recall 只检查核心职责、关键概念关系、代表行为因果链及一个关键边界/失败，不要求背路径或符号。任何阶段提前查看 Key，本轮只算复习；重新测试必须换用等价 prompts。

不要给 Agent 设置“主动回忆通过”。Agent 可持续读取报告；只有报告外 sealed held-out prediction/transfer task 才能评价“报告支持/未支持”其推理，不得声称 Agent 形成记忆或已经学会。

### 5. Verification Key & Completion Standard

每项 Key 只包含必须判断、可接受替代表述、源码锚点及必要对比分支。没有 issue、测试或文档证据时，不称“常见错误模型”；改写为源码分支揭示的“易错判断”或省略。

人类只有按上述可见材料顺序完成三类初始答案、再打开 Key，并满足所有关键判断与因果解释时才算本轮完成。提前看 Key 只算复习。不写完成记录、学习画像或进度文件。

## 覆盖图与 scope 门

```text
主要可观察职责 → Learning Target → 必需概念
  → Representative behavior/checkpoint → Prediction/Transfer check → Verification Key
```

两条学习链共享必需概念、状态/数据边界或 representative behavior 时相连：

- project/目录 scope 有多个连通分量：零写入；列出每个分量的职责与锚点，请用户选择可解析到单一目录或文件的更小组件。
- file scope 有多个分量：仍生成一份报告，按连通分量组织并覆盖该文件全部主要职责。
- 不以篇幅、条目数或主观“过大”判断 scope。

## 失败门

以下情况零写入：核心事实、因果关系或 Key 无法由源码证明；无法覆盖三类检查；核心行为必须运行才能确认但未获授权；project/目录覆盖图不连通。无直接测试不阻塞静态可证内容，但不得声称已被测试覆盖；可选事实无证据时省略。

## 排除项

不生成 Develop 的完整结构、通用语言/框架课程、MISSION/RESOURCES/HTML/assets、完整 API/类型/文件/测试 inventory、审计/风险/建议/change plan、练习分支、sandbox、学习者配置或 Mermaid。

## 交付自检

- 一 scope、一 guide、正确路径、freshness、学习者假设与“学习材料就绪”。
- 主要职责到 Key 的覆盖链完整；事实与教学理由清楚分离。
- Walkthrough 为最小充分行为集合；Recall/Prediction/Transfer 的材料顺序明确且 Key 分离。
- Agent 只使用 held-out 语义；无 Develop 复制、课程状态、秘密、空章节或占位符。
