# 创建云效 One 普通任务

## 适用范围与依据

适用于用户要求新建知乎云效普通任务／工作项。任务和 MR 是不同对象；不要求先提供代码仓库或项目链接。已有 `scripts/yunxiao.mjs create` 创建的是 MR，不支持此接口，不要编造 `create-task` 子命令。

依据：用户于 2026-11-05 提供的浏览器创建请求及成功响应。接口为 `POST https://one.in.zhihu.com/api/v4/tasks`，JSON 请求和响应。样例任务 ID 为 `875704`，`code=0`；该任务已创建，不应再次发送样例。本文只保留接口字段，不保留 Bearer token、Cookie 或完整人员资料。

## 输入与请求体

先从当前用户请求及已核实的上下文确定标题和负责人 ID。不能仅因历史样例使用某个 ID 就把所有任务分配给该人；不能用姓名、邮箱或未核实的登录身份猜 ID。缺少负责人 ID 时只询问该项或从可信的当前人员数据核实。

以下为已观察到的请求形状，不代表所有字段都是服务端必填字段：

```json
{
  "taskBindEntityList": [],
  "bindEventType": 0,
  "attentionUserIds": [],
  "type": 1,
  "priority": 5,
  "mode": "极简模式",
  "title": "修复短故事会员鉴权异常展示",
  "assigneeId": 6833
}
```

| 字段 | 已确认含义与使用约束 |
| --- | --- |
| `title` | 用户要求的任务标题，非空字符串；示例标题不是默认值。 |
| `assigneeId` | 负责人数字 ID；`6833` 仅是来源样例，执行时替换为已确认的负责人。 |
| `type: 1` | 普通任务。不要因为标题包含“修复”就称为缺陷类型。 |
| `priority: 5` | 响应映射为 P4；普通任务无其他要求时可采用该样例默认值并说明。其他枚举未核实。 |
| `mode` | 样例为 `极简模式`。 |
| `taskBindEntityList` | 样例为空数组，响应 `projectId`、`projectName` 为 null，说明这种无项目绑定的创建已成功。 |
| `bindEventType` | 保留样例值 `0`；未核实其他取值。 |
| `attentionUserIds` | 样例为空数组，没有关注人。 |

用户要求绑定项目、描述、其他类型或优先级时，先核实对应写入结构；不要从响应中存在某字段就推断它可写，也不要静默丢弃用户要求。当前证据只覆盖上述极简普通任务。

## 鉴权与执行

1. 确定用户确实要求创建任务。提供接口样例、要求更新技能或要求起草内容，不授权实际创建。若用户已给出成功响应，先识别已有任务，避免重复创建。
2. 展示即将创建的标题、负责人、普通任务类型、P4 优先级和无项目绑定状态；已有明确创建授权且字段无歧义时继续，不为已确定的信息重复询问。
3. 优先读取环境变量 `YUNXIAO_TOKEN`，兼容原始 token 和 `Bearer ...`。现有 MR 脚本具备 Chrome Local Storage 读取能力，但本页的独立示例只读取环境变量，不应宣称自动复用了 Chrome 回退。变量不可用时，可按主技能既有凭据流程在内存中获取；不得打印或持久化凭据，也不得要求用户在聊天中发送 token。
4. 发送一次 POST，固定同源地址，禁止自动重定向和自动重试。用结构化 JSON 序列化，不能将标题拼接进 shell 命令。请求只需表达 JSON 和鉴权；不要复制浏览器完整 Cookie、`sec-ch-ua` 或追踪字段。来源请求同时携带 Bearer 和 Cookie；仅 Bearer 的任务创建尚未现场验证，不能据此保证所有部署都不需要额外会话信息。明确鉴权失败时核实登录状态，不盲目重放。
5. 校验 HTTP 成功、响应可解析且 `code === 0`、`data.id` 为正整数，并核对返回标题和负责人。若状态未知或数据不匹配，保留已返回的任务 ID 并核查远端，不重新创建。

以下示例从权限为 `0600` 的临时 JSON 文件读取上述请求体；文件不能含凭据，使用后删除。命令中的 `<payload.json>` 是待替换的文件路径。只有实际获得创建授权时才执行，维护技能时不要运行此示例：

```sh
node --input-type=module - '<payload.json>' <<'NODE'
import { readFile } from 'node:fs/promises';
const body = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (typeof body.title !== 'string' || !body.title.trim()
    || !Number.isSafeInteger(body.assigneeId) || body.assigneeId <= 0) {
  throw new Error('标题或负责人 ID 无效');
}
const raw = process.env.YUNXIAO_TOKEN?.trim();
if (!raw) throw new Error('缺少 YUNXIAO_TOKEN；不要在聊天或命令参数中传递凭据');
const authorization = /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
let response;
try {
  response = await fetch('https://one.in.zhihu.com/api/v4/tasks', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
} catch {
  throw new Error('创建结果未知；先核查远端任务，禁止自动重试');
}
let result;
try { result = await response.json(); }
catch { throw new Error('响应无法解析；先核查远端任务，禁止自动重试'); }
const task = result?.data;
if (!response.ok || result?.code !== 0
    || !Number.isSafeInteger(task?.id) || task.id <= 0) {
  // 不输出可能包含人员信息或会话数据的原始响应。
  throw new Error(`创建未获有效成功确认（HTTP ${response.status}）；核查远端后再决定下一步`);
}
console.log(JSON.stringify({
  id: task.id,
  title: task.title,
  assigneeId: task.assigneeId,
  type: task.type,
  priority: task.priority,
  status: task.status,
}));
if (task.title !== body.title || task.assigneeId !== body.assigneeId) {
  throw new Error('已返回任务 ID，但标题或负责人不匹配；核查该任务，禁止重新创建');
}
NODE
```

## 结果与重复创建防护

来源成功响应的最小相关字段为：

```json
{
  "code": 0,
  "msg": "请求成功",
  "data": {
    "id": 875704,
    "title": "修复短故事会员鉴权异常展示",
    "assigneeId": 6833,
    "type": { "code": 1, "text": "普通任务" },
    "priority": { "code": 5, "text": "P4" },
    "status": { "code": 0, "text": "未完成" }
  }
}
```

报告任务 ID、标题、负责人、类型、优先级和状态；仅在已核实实际页面 URL 时提供详情链接，不猜 URL 格式。不要输出完整人员对象、邮箱或登录资料。

接口未提供已验证的幂等键。超时、断连、重定向、非 JSON 或含糊的服务端失败都可能留下已创建对象，不能自动重试。先在 One 页面或已验证的只读查询中按标题、负责人、创建时间核查，发现已有对象则复用；无法确定时报告“创建结果未知”。本资料未验证任务详情或搜索 GET 接口，不编造路径。
