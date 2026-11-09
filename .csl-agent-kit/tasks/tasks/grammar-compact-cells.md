# 压缩语法详情并将删除入口移到列表单元格

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-15 17:21) |
| Kind | Task |

## Task Summary

**语法笔记界面**：[网页目录](file:///Users/caishilin/Desktop/personal/pi-language-tutor/web) 将删除按钮与确认移到每个列表单元格，选择与删除使用并列按钮；将详情纠错和教学改为紧凑行，减少标题与空白，保留原文和整句表达。

## Target
- [x] T1: 每条语法列表单元格提供删除按钮，保留删除确认且不误触记录选择。
- [x] T2: 解析详情采用类似 Pi 面板的紧凑表达，减少重复标签与空白，完整保留解析内容。
- [x] T3: 不改变语法存储、搜索、筛选及闪卡行为。

## Result

- T1: 真实隐藏 Glimpse WebView 验证两个 cell 都有删除按钮、详情无删除按钮，删除非选中记录不切换 selected，取消有效，失败保留、成功回执后才移除。
- T2: 真实 WebView 两条纠错各为紧凑 grammar-line，短行实测高度 23px；原文、纠正和解释保留；教学句型仍展示。类型检查及 diff check 通过。
- T3: 本任务只修改 web/grammar.html；DB桥接删除协议、保存实现、闪卡不变。WebView 搜索无匹配验证通过，筛选表达式未变。
- Review gate: Skipped — R1 局部界面更改有真实WebView行为验证，无独立审查要求。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅既有网页布局及按钮位置调整，不改变删除权限或数据库逻辑。
- Snapshot: a9630ae86dbdf103cbf20dd3d5f202257bfcbf3570d2144e211a9e99716256ea
- Evidence: 真实WebView交互冒烟、23px行高、tsc和diff check。
- Result clarity: 截图明确要求 cell 删除及 Pi 面板式紧凑内容。
- Bounded impact: 一个HTML文件，选择与删除按钮并列而非嵌套。
- Low risk: 复用既有确认和成功回执；未触碰真实数据，非新增删除行为。
- Sufficient verification: 取消、非选中删除不切换、失败保留、ack成功、教学与搜索已验证；未运行测试套件，当前会话需 reload。
- Task fingerprint: 2d69ec1553a59a39d45a5398320830b42b41afdb7e07878d2c9c034242e88449

## Verification

- Passed: 原记录报告 WebView 交互和内容检查通过、短行 23px、类型检查与 diff check 通过；未运行测试套件。
- 记录修正：原 Verification 的 SHA256 字段含乱码，无法据此恢复原值；Review Assessment 保留了当时记录的 Snapshot，本次未重新核验历史文件或运行上述检查。
