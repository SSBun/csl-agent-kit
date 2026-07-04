# Yao Meta Skill 全量审计报告

生成时间：2026-07-03
审计范围：`/Users/caishilin/Desktop/personal/skills/skills/*/SKILL.md`，共 17 个 skill。
方法：按 `yao-meta-skill` 的 skill atlas、validate、resource boundary、trust 方法审计；原始审计未修改任何 skill 源文件。后续修复状态见下方。

## 修复状态（2026-07-03）

已按本报告修复或分流所有发现：

1. **Yao metadata 缺口已标为 release-only gate**：新增 `skill_atlas/policy.json`，明确本仓库以 OpenAI/Codex 为主要运行时，Yao `agents/interface.yaml`、owner、review cadence、maturity、updated_at 等缺口只作为发布前门禁，不作为日常运行 blocker。
2. **OpenAI schema 冲突已修复**：6 个 `argument-hint` frontmatter 已删除，参数提示迁移到正文 Usage。
3. **入口 token 超预算已修复**：原 5 个失败项均降到 1000 token 以下，细节迁移到 `references/`。
4. **重复安装说明已清理**：`beautiful-mermaid` 只保留一处全局安装提示，并继续要求用户确认。
5. **Atlas 产物已刷新**：`docs/analysis/yao-meta-skill-audit/skill-atlas.json` 已显示 `scope_policy.present: true`，且所有 skill 的 `atlas_scope` 为 `release`。

保留的预期门禁：`yao.py validate skills/<name>` 仍会报告 `Missing agents/interface.yaml`。这是上面策略明确标记的 release-only gap；如果未来要发布为 Yao-governed package，再批量补 `agents/interface.yaml` 和治理 metadata。

修复后验证：

- OpenAI `quick_validate.py`：17/17 通过。
- Yao `resource_boundary_check.py`：17/17 通过。
- Yao Atlas：route collision 0，shared resource 0，no-route opportunity 0，policy 已加载。
- Yao `validate`：17/17 仅剩 `Missing agents/interface.yaml`，已分流为 release-only gate。

## 原始结论（修复前）

当前 skill 集合的路由边界总体可用：Yao Skill Atlas 未发现 route collision、shared resource collision 或 no-route opportunity。主要问题集中在三类：

1. **跨平台元数据标准不一致**：OpenAI `quick_validate.py` 不接受 `argument-hint`，Yao `validate` 又要求 `agents/interface.yaml` 和治理 metadata；当前仓库同时不满足两边的严格发布门禁。
2. **部分入口过重**：5 个 `SKILL.md` 超过 Yao production 入口预算 1000 tokens，3 个接近预算上限。
3. **治理信息缺失**：Atlas 认为 17/17 skills 都缺 `owner`、`review_cadence`、`maturity`，且因缺 `updated_at` 被判定 stale。

## 自动化证据

- Yao Atlas：`docs/analysis/yao-meta-skill-audit/skill-atlas.json`
- Yao Atlas HTML：`docs/analysis/yao-meta-skill-audit/skill-atlas.html`
- Atlas 摘要：
  - `skill_count`: 17
  - `route_collision_count`: 0
  - `owner_gap_count`: 17
  - `stale_count`: 17
  - `shared_resource_count`: 0
  - `no_route_opportunity_count`: 0
- `resource_boundary_check.py`：
  - 5 个失败：`analyze-project`、`figma-describe`、`handoff-save`、`repo-map`、`same-page`
  - 3 个接近上限警告：`sop-manager`、`test-triage`、`venom-cli`
- OpenAI `quick_validate.py`：
  - 6 个失败，原因都是 `argument-hint` frontmatter key 不被 OpenAI skill schema 接受。
- Yao `trust`：
  - 0 个 secret finding。
  - 0 个 network script。
  - 但若按 governed release 门禁解释，所有 skill 都缺 `remote_inline_execution: forbid` 之类 trust metadata。

## 主要发现

### 1. OpenAI schema 与现有 frontmatter 冲突

严重性：高
影响：使用 OpenAI/Codex skill 校验或发布流水线时，这 6 个 skill 会失败。
证据：

| Skill | 位置 | 问题 |
| --- | --- | --- |
| `analyze-project` | `skills/analyze-project/SKILL.md:4` | `argument-hint` 非允许 key |
| `create-app-icon` | `skills/create-app-icon/SKILL.md:4` | `argument-hint` 非允许 key |
| `figma-describe` | `skills/figma-describe/SKILL.md:4` | `argument-hint` 非允许 key |
| `handoff-restore` | `skills/handoff-restore/SKILL.md:4` | `argument-hint` 非允许 key |
| `handoff-save` | `skills/handoff-save/SKILL.md:4` | `argument-hint` 非允许 key |
| `venom-cli` | `skills/venom-cli/SKILL.md:4` | `argument-hint` 非允许 key |

建议修复：删除这些 `argument-hint`，把参数提示移动到正文 `Usage` 或平台专属 metadata。先修这项，收益最大，改动也最小。

### 2. Yao validate 全量失败于缺 `agents/interface.yaml`

严重性：中
影响：如果目标是通过 Yao governed/library/package 门禁，17/17 skills 都不满足 interface metadata 要求。
证据：`yao.py validate skills/<name>` 对每个 skill 都报告 `Missing agents/interface.yaml`。当前只有 `inject-may-agents` 有 `agents/openai.yaml`，但 Yao 的 validator 不识别它为 `interface.yaml`。

建议修复：先决定标准来源：

- 如果以 OpenAI/Codex 为主，不要为了 Yao 盲目生成 `interface.yaml`；把它记录为 Yao-only 门禁差异。
- 如果要把本仓库升级成 Yao-governed skill package，批量生成最小 `agents/interface.yaml`，并让它与 `agents/openai.yaml` 不冲突。

### 3. 5 个 skill 的入口上下文超过 Yao production 预算

严重性：中
影响：skill 被触发时初始上下文过重，增加误路由、慢响应和压缩风险。
Yao production 预算：1000 estimated initial-load tokens。

| Skill | 入口 tokens | 状态 | 主要证据 |
| --- | ---: | --- | --- |
| `repo-map` | 2240 | fail | `skills/repo-map/SKILL.md:43` 起工作流过长，适合迁移到 reference |
| `analyze-project` | 1798 | fail | `skills/analyze-project/SKILL.md:18` 起模式/阶段说明过长 |
| `same-page` | 1674 | fail | `skills/same-page/SKILL.md:22` 起格式设计细节过长 |
| `figma-describe` | 1039 | fail | `skills/figma-describe/SKILL.md:30` 起 MCP 分支和输出规范可压缩 |
| `handoff-save` | 1038 | fail | `skills/handoff-save/SKILL.md:23` 起表格/模板可迁移 |

接近上限但未失败：

| Skill | 入口 tokens | 状态 |
| --- | ---: | --- |
| `sop-manager` | 974 | warning |
| `venom-cli` | 958 | warning |
| `test-triage` | 925 | warning |

建议修复：不要先重写所有内容。优先处理 `repo-map`、`analyze-project`、`same-page` 三个最大项，把长模板、格式说明、示例和分支细节放到 `references/`，`SKILL.md` 只保留触发条件、核心流程和资源索引。

### 4. 治理 metadata 全量缺失

严重性：中
影响：Yao Atlas 无法判断 owner、review cadence、maturity、updated_at，所有 skill 被标为 owner gap 和 stale。
证据：`docs/analysis/yao-meta-skill-audit/owner_review_gaps.json` 和 `stale_skills.json` 覆盖 17/17 skills。

建议修复：如果要走 Yao 生命周期管理，新增一个轻量 `manifest.json` 或统一 policy 文件，不要把这些字段塞进 OpenAI frontmatter。最低可行字段：

- `owner`
- `maturity`
- `review_cadence`
- `updated_at`

### 5. `beautiful-mermaid` 的安装说明重复

严重性：低
影响：不是安全漏洞，因为两处都要求用户确认；但重复的全局安装说明增加维护成本。
证据：`skills/beautiful-mermaid/SKILL.md:14` 和 `skills/beautiful-mermaid/SKILL.md:24` 都描述 `npm install -g beautiful-mermaid`。

建议修复：保留 Preflight 一处即可，删除 Setup 中重复安装段落。

## 正向结果

- 17 个 skill 均被 Atlas 识别为 actionable skill。
- Route collision 为 0。
- Shared resource collision 为 0。
- No-route opportunity 为 0。
- `inject-may-agents` 已正确设置显式调用边界，并要求写入前展示完整最终内容。
- 安全关键词扫描未发现未确认的 destructive command；`tips`、`handoff-save`、`inject-may-agents` 都有写入/覆盖前确认规则。
- Trust scan 未发现 secrets 或 network scripts。
- README 和插件 manifest 已包含 `inject-may-agents`。

## 建议修复顺序

1. **先修 OpenAI schema 失败**：删除 6 个 `argument-hint`，迁移到正文 Usage。验证命令：`python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>`。
2. **压缩 3 个最大入口**：`repo-map`、`analyze-project`、`same-page`。目标不是删能力，而是把细节迁移到 `references/`。
3. **决定 metadata 标准**：如果继续使用 Yao 管理，就补 `agents/interface.yaml` / `manifest.json`；如果以 OpenAI/Codex 为主，就把 Yao metadata 缺口标为 release-only gate。
4. **清理重复说明**：处理 `beautiful-mermaid` 的重复安装段落。
5. **建立 release gate**：在发布前统一跑 `quick_validate.py`、Yao `resource_boundary_check.py`、JSON manifest 校验、`git diff --check`。

## 最可能失败模式

1. **误把 Yao-only 缺口当成当前平台 blocker**：会导致无意义地批量生成 metadata。缓解：先确认发布目标是 OpenAI/Codex、Claude、Cursor，还是 Yao-governed package。
2. **压缩 `SKILL.md` 时丢失核心流程**：尤其是 `repo-map` 和 `analyze-project`。缓解：只迁移示例/长表格/格式说明，保留触发、分支选择和安全边界。
3. **移除 `argument-hint` 后命令 UX 下降**：缓解：把提示放进正文 `Usage`，必要时放进平台专属配置。
4. **批量 metadata 改动污染现有 dirty workspace**：当前仓库已有大量未提交改动。缓解：后续修复按主题分批，不做一把梭。

## 验证命令

```bash
python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py skill-atlas --workspace-root /Users/caishilin/Desktop/personal/skills --output-dir /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit --report-json /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.json --report-html /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.html --today 2026-07-03
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate "$d"; done
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/resource_boundary_check.py "$d"; done
for d in skills/*; do [ -f "$d/SKILL.md" ] && python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py "$d"; done
jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json
git diff --check
```
