# 将当前 Astra 上下文配置调整为 1050k

Status: Completed (2026-09-11 17:23)
Kind: Task

## Plan

1. 核对当前会话的 provider、模型、推理强度及模型目录中的上下文元数据。
2. 使用 Pi 官方支持的单模型覆盖，仅调整当前 Astra 的上下文窗口，保留其他模型和输出配置。
3. 通过离线模型加载、JSON 结构与改动范围检查验证；说明当前会话的刷新步骤及未验证的服务端限制。

## Target
- [x] T1: 说明当前 272k 上下文配置的来源。
- [x] T2: 将当前 gpt-6-astra 的上下文配置调整为 1050000 tokens，并验证配置读取结果。

## Result

- T1: 会话环境确认为 openai-codex/gpt-6-astra、xhigh；修改前离线 Pi 模型列表为 272K，models-store.json 中该模型 contextWindow=272000、maxTokens=128000，models.json 原先仅有 gpt-5.6-sol 的 872000 覆盖。
- T2: 在 /Users/caishilin/.pi/agent/models.json 仅新增 openai-codex.modelOverrides.gpt-6-astra.contextWindow=1050000；离线 pi --no-extensions --list-models gpt-6-astra 加载成功，窗口显示舍入后的 1.1M、输出仍为 128K。JSON 与去除新增项后的语义 SHA256 验证其他配置不变；settings.json 与 models-store.json 哈希不变。当前会话需用 /model 重新选择模型；未发送大上下文服务端请求，未运行测试。
- Review gate: Skipped — 当前 R1 的四项依据已记录：单模型官方覆盖可逆、范围明确，修改前后实际离线加载与未改配置哈希检查通过；无显式独立审查要求。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 使用官方支持的单模型 contextWindow 覆盖，未修改宿主代码、认证、输出限制或其他模型；实际离线加载成功。
- Snapshot: /Users/caishilin/.pi/agent/models.json SHA256=493bb04c7840b7ebf46632a4f9f515961da51e5bdfe74cdf25246f536ed08bd6
- Evidence: T1/T2：修改前后 Pi 离线模型列表、JSON 数值与语义差异检查、settings.json/models-store.json 哈希比较均已观察。
- Result clarity: 用户最后明确要求 1050k，配置精确写入 1050000 而非 105000；当前 provider 与模型已从会话环境核实。
- Bounded impact: 仅影响该用户所有项目中 openai-codex/gpt-6-astra 的本地上下文预算；官方 modelOverrides 为指定模型生效，不覆盖其他元数据，重选模型加载。
- Low risk: 本地可逆配置，不触及认证、不发起大上下文推理或付费调用；远端容量未验证，后续长上下文可能增加配额消耗或触发服务端限制，交付时说明。
- Sufficient verification: 离线 Pi 实际读取显示 1.1M（1050000 舍入）、max-out=128K；JSON 精确值和其余配置语义哈希通过，未运行测试。
- Task fingerprint: cabcd4ef2502de3d5807ab9c1334299a8fc7a3b89d8603bc8b8b33539e9b0af4

## Verification

- Passed: 最终重新执行 Pi 离线模型列表成功：Astra=1.1M 舍入显示、输出128K；JSON精确值1050000和最终SHA256均与assessment一致；任务范围diff检查与Context校验通过。仅验证本地配置加载，当前UI需/model重选，未发送1050k请求或运行测试。
