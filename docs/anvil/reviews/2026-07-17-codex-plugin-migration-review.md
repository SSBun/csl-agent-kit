# 最终 MR 评审：`2026-07-17-codex-plugin-migration`

## 元数据

| 字段 | 值 |
|---|---|
| MR / Commit | Task commit follows approval; reviewed base `26e4e77` on `main` |
| Author | Codex / anvil-lead |
| Review Date | 2026-07-17 |
| Review Writer | anvil-lead |
| Status | `APPROVED` |

## 第一层：3 分钟读懂

### 1. Review 摘要

- **一句话结论**：APPROVED — CSL Agent Kit now installs into Codex as one repository-root plugin containing both shared skills and hooks, with ownership-safe removal of legacy per-skill symlinks.
- **为什么现在要改**：The previous split installation loaded hooks from a plugin but skills from `~/.agents/skills`, creating two distribution mechanisms and a recurring duplicate-discovery risk.
- **交付结果**：The marketplace points to the repository root; the manifest exports `skills/`; root hooks resolve scripts from plugin-root variables; `codex-skills` is removed; legacy owned links are cleaned only after plugin installation succeeds.
- **主要影响**：Codex installation and upgrades. Claude Code, Cursor, Pi, individual `npx skills` installation, and the project-local integration workflow remain supported and unchanged in ownership.
- **Reviewer Action**：Read `bin/csl-agent-kit.js:224`, `bin/csl-agent-kit.js:251`, `hooks/hooks.json:1`, and `tests/cli-install-output.test.js:314`. No human decision remains.

### 2. 背景与目标

#### Before / After

| 视角 | Before | After |
|---|---|---|
| 用户 / 调用方行为 | Default install selected a Codex skill-symlink target plus a hooks-only plugin target. | Default install selects only `codex-plugin`; one plugin provides shared skills and hooks. |
| 系统内部行为 | Shared skills were linked individually under `~/.agents/skills`; hooks preferred those global paths. | Manifest exports root `skills/`; hooks use plugin-root variables; owned legacy links are removed after successful install. |
| 评审 / 运维方式 | Two installation surfaces had to remain synchronized and deduplicated. | One plugin identity and root package are inspected with CLI, package, hook, and migration tests. |

- **背景 / 问题**：The hooks-only workaround had preserved the old global skill-link installer, so the package was not using the new Codex plugin as its complete distribution unit.
- **本次目标**：Make `csl-agent-kit@csl-agent-market` the sole Codex distribution source while preserving user-owned filesystem entries and installed hook behavior.
- **非目标**：No npm release, MR/PR, dependency change, Claude/Cursor/Pi redesign, or export of `.agents/skills/integrate-third-skills`.
- **成功标准**：One discoverable plugin package; no recreated Codex skill links; safe/idempotent migration; executable plugin-root hooks; all project, package, live-install, review, Yao, and knowledge gates green.

### 3. 技术方案与方案取舍

- **技术方案**：Use the repository root as the plugin source, export `./skills/` from `.codex-plugin/plugin.json`, use default root `hooks/hooks.json` discovery, and delete the duplicate nested hook manifest.
- **关键机制**：`installCodexPlugin` completes marketplace/plugin commands before `removeLegacyCodexSkillLinks`; cleanup scans direct entries in a real directory and removes only symlinks whose lexical or canonical target lies under the package's canonical `skills/` root.
- **调用链 / 数据流**：

```text
csl-agent-kit install -> codex marketplace/plugin reinstall -> verify command success
  -> scan ~/.agents/skills direct entries -> classify symlink ownership
  -> remove owned links or report dry-run records -> CLI human/JSON output
Codex plugin load -> .codex-plugin/plugin.json -> root skills/ + root hooks/hooks.json
  -> PLUGIN_ROOT/CLAUDE_PLUGIN_ROOT -> bundled scripts
```

| 方案 | 优点 | 代价 / 风险 | 选择结论 |
|---|---|---|---|
| Repository-root plugin plus post-install owned-link cleanup | One source, no new dependency or mirror, safe upgrade path | Requires careful broken/external symlink classification | Adopted; behavior and boundaries are covered by focused tests. |
| Keep plugin plus global links | Minimal installer change | Preserves duplicate discovery and two update paths | Not adopted. |
| Delete every legacy-directory entry | Simple cleanup | Can destroy user/third-party data | Not adopted. |

### 4. 修改边界与影响

#### Current Diff 范围

- **Base / Head**：`26e4e77` / working tree reviewed for the task commit.
- **Changed Files**：Plugin/marketplace manifests, root hooks, installer, CLI and tips tests, README, task/lesson records, confirmed spec/plan, review, and atomic knowledge page/index; duplicate nested hooks deleted.
- **Touched Symbols**：`targets`, `installCodexPlugin`, `removeLegacyCodexSkillLinks`, `isWithin`, `summarizeChanges`, `printChangeDetails`, CLI help, root hook commands.
- **Affected Modules**：Codex plugin packaging, installer migration, lifecycle hook resolution, regression/package verification.
- **Loaded Standards**：Project `AGENTS.md`, Anvil code/review/compound rules, plugin-creator contract, Yao production package/install audit rules, local JavaScript style.
- **Requirements / Plan**：`docs/anvil/brainstorms/2026-07-17-codex-plugin-migration.md`; `docs/anvil/plans/2026-07-17-codex-plugin-migration-plan.md`.

| 边界 | 范围 | 变化 / 影响 | 证据 |
|---|---|---|---|
| Changed（直接修改） | Codex package, hooks, installer, tests, docs | Replaces dual Codex installation with plugin-only behavior | `.codex-plugin/plugin.json:38`; `.agents/plugins/marketplace.json:10`; `bin/csl-agent-kit.js:17` |
| Direct impact（直接影响） | New and upgrade Codex installs | Plugin add precedes owned-link cleanup; output includes removal records | `bin/csl-agent-kit.js:224-241`; `bin/csl-agent-kit.js:251-305` |
| Indirect impact（间接影响） | Tips/SOP lifecycle scripts | Installed hooks execute scripts from the plugin package | `hooks/hooks.json:9-40`; `tests/cli-install-output.test.js:112-142` |
| Not changed（明确未改） | Claude commands, Cursor/Pi behavior, skill contents, dependencies | Existing surfaces remain available; project-local skill is excluded | `tests/cli-install-output.test.js:144-151`; package dry-run evidence |

### 5. Reviewer 导航 / 热点

| 优先级 | 文件 / Symbol / 链路 | 为什么要看 | 建议验证方式 |
|---|---|---|---|
| P0 | `removeLegacyCodexSkillLinks` | Home-directory deletion boundary | Run owned, broken, external, parent-symlink, dry-run, and failure-order tests. |
| P1 | plugin manifest + marketplace + root hooks | Determines package discovery and installed script paths | Inspect JSON, run hook fixtures, recursive list, package dry-run, and live plugin list. |
| P2 | saved selections and CLI output | Removed target must not crash upgrades or reappear | Run CLI tests and inspect JSON/human help. |

- **建议阅读顺序**：Manifest/marketplace → installer ordering and ownership predicate → cleanup tests → hook execution tests → package/live evidence.
- **最可能出错的假设**：A path with a familiar skill name is not necessarily owned; ownership must come from its stored or resolved target.
- **需要领域 Reviewer 确认的事项**：None outstanding.

## 第二层：技术评审正文

### 6. 需求—实现—验证映射

| Requirement / Success Criterion | Implementation | Current Diff Evidence | Verification | 状态 / 缺口 |
|---|---|---|---|---|
| One plugin exports shared skills and hooks | Root source, `skills` export, default root hooks, duplicate hook deletion | `.agents/plugins/marketplace.json:10-16`; `.codex-plugin/plugin.json:38`; `hooks/hooks.json:1` | JSON checks, recursive 27-skill list, 132-entry package dry-run, live plugin list | verified |
| No Codex skill symlink target | Removed target and help path; plugin is sole default | `bin/csl-agent-kit.js:9-31`; `bin/csl-agent-kit.js:439`; `tests/cli-install-output.test.js:266-276` | Node CLI tests | verified |
| Remove only legacy owned links | Direct-entry lstat, parent guard, lexical/canonical containment | `bin/csl-agent-kit.js:251-305` | `tests/cli-install-output.test.js:314-438` | verified |
| Hooks resolve bundled scripts | Prefer `PLUGIN_ROOT`, then `CLAUDE_PLUGIN_ROOT`, then development root | `hooks/hooks.json:9-40` | Exact shell command execution at `tests/cli-install-output.test.js:112-142` | verified |
| Project-local workflow excluded | Marketplace exports root `skills/`, while workflow remains under `.agents/skills` | `.codex-plugin/plugin.json:38`; `tests/cli-install-output.test.js:144-151` | Recursive list and package-content checks | verified |
| Saved selections survive removed target | Loader filters values through current target keys | `bin/csl-agent-kit.js:169-177`; `tests/cli-install-output.test.js:296-311` | Node CLI tests | verified |
| Dry-run/output/idempotence/failure order | Explicit remove records; cleanup runs after commands; repeated scan yields no removals | `bin/csl-agent-kit.js:231-241`; `bin/csl-agent-kit.js:294-297`; `bin/csl-agent-kit.js:397-409` | Focused tests and live reinstall | verified |
| Full success criteria | Documentation/status and external-state migration completed | `README.md:93-111`; `tasks/todo.md:1-22` | 52 tests, package/list/JSON/diff/live/Yao/Compound gates | verified |

### 7. 风险、兼容性、发布、回滚与观测

| 主题 | 结论 | 触发信号 / 影响 | 处置与证据 |
|---|---|---|---|
| 技术 / 产品风险 | Controlled | Wrong ownership classification could remove a user link or leave duplicates | Dual lexical/canonical containment plus preservation tests |
| 向后 / 向前兼容性 | Compatible with saved state; intentional CLI target removal | Explicit `codex-skills` now errors; saved mixed selection retains plugin | `tests/cli-install-output.test.js:266-311` |
| 数据 / 配置 / 协议兼容性 | No data migration; only owned symlinks removed | Plugin-add failure or external legacy entries | Cleanup occurs only after success and preserves external/regular entries |
| 发布策略 | Local plugin migration completed; npm publish out of scope | `codex plugin list` missing/disabled entry | Live installed/enabled entry verified at version `2.0.0` |
| 回滚策略 | Revert task commit and reinstall the prior package/plugin layout | Hook or discovery regression | Links contain no user data; prior package reinstall can recreate prior links |
| 观测 / 告警 | CLI result records and Codex plugin list are sufficient for this local installer | Nonzero result, missing plugin, or unexpected remaining links | JSON `changes`, process exit, plugin list, and legacy-directory inspection |

- **回滚步骤**：Revert the task commit, reinstall the prior CSL version, and run its prior Codex targets if the old split layout must be restored.
- **回滚后数据 / 状态处理**：No content data is deleted; removed entries were symlinks only. Reinstall recreates links when required.
- **发布后确认窗口与负责人**：Immediate local verification completed by anvil-lead; future npm publication remains a separate user-authorized release.

### 8. Current Diff Findings 与完整闭环

| ID | Severity | 原始问题摘要 | Current Diff Evidence | 状态 | 轮次 | Contributors |
|---|---|---|---|---|---|---|
| F1 | Medium | Cleanup could traverse a symlinked legacy parent directory. | `bin/csl-agent-kit.js:254-261` | fixed | 2 | cleanup-safety, anvil-lead |
| F2 | Low | Child `lstat` catch suppressed errors other than disappearance races. | `bin/csl-agent-kit.js:273-279` | fixed | 2 | cleanup-safety, anvil-lead |
| F3 | Low | Broken external symlink preservation lacked direct coverage. | `tests/cli-install-output.test.js:376-410` | fixed | 2 | cleanup-safety, anvil-lead |
| F4 | Medium | Hook assertions inspected strings but did not execute the exact commands; installed-package fixture kept a duplicate hook copy. | `tests/cli-install-output.test.js:112-142`; `tests/tips.test.mjs:408-433` | fixed | 2 | plugin-package, anvil-lead |
| F5 | Low | Codex CLI exposes no deterministic command for an automated nested-skill enumeration assertion. | `.codex-plugin/plugin.json:38` plus external list/catalog evidence | accepted | 2 | plugin-package, anvil-lead |

#### Finding F1

- **原始问题**：Reading a symlinked `~/.agents/skills` parent could scan and mutate an arbitrary external directory.
- **触发条件与后果**：A user-controlled parent symlink targets a directory containing links that look package-owned; cleanup could cross the intended boundary.
- **Current Diff 证据**：`removeLegacyCodexSkillLinks` owns home-directory deletion at `bin/csl-agent-kit.js:251-299`.
- **根因**：The first implementation checked child entries without first requiring the parent itself to be a real directory.
- **修复方案**：`lstat` the parent and return without scanning when it is a symlink or non-directory.
- **为何充分**：No child path is read or deleted when the parent boundary is indirect.
- **验证证据**：`tests/cli-install-output.test.js:344-365` verifies parent and external child remain symlinks.
- **状态 / 轮次 / Contributors**：fixed / 2 / cleanup-safety, anvil-lead.

#### Finding F2

- **原始问题**：A catch-all child `lstat` path silently treated permission/I/O failures as an absent entry.
- **触发条件与后果**：Unexpected filesystem errors would produce a successful but incomplete migration without surfacing the reason.
- **Current Diff 证据**：Child classification occurs at `bin/csl-agent-kit.js:271-280`.
- **根因**：The initial race guard did not distinguish `ENOENT` from other errors.
- **修复方案**：Ignore only `ENOENT`; rethrow every other error.
- **为何充分**：A genuine disappearance race remains harmless while operational failures reach the existing CLI error boundary.
- **验证证据**：Current branch-specific code review plus the full CLI suite.
- **状态 / 轮次 / Contributors**：fixed / 2 / cleanup-safety, anvil-lead.

#### Finding F3

- **原始问题**：Tests covered live external links but not broken external links.
- **触发条件与后果**：A regression could classify every broken link as package-owned and delete third-party state.
- **Current Diff 证据**：Broken targets use the lexical ownership path at `bin/csl-agent-kit.js:282-292`.
- **根因**：The first matrix omitted the external-broken quadrant.
- **修复方案**：Add `broken-external` and assert it remains a symlink after first and repeated installs.
- **为何充分**：The matrix now distinguishes owned/live, owned/broken, resolved-owned alias, external/live, external/broken, and regular entries.
- **验证证据**：`tests/cli-install-output.test.js:376-410`.
- **状态 / 轮次 / Contributors**：fixed / 2 / cleanup-safety, anvil-lead.

#### Finding F4

- **原始问题**：Manifest tests checked environment-variable text but did not prove the shell command selected the correct bundled script; the installed fixture duplicated hooks below `.codex-plugin`.
- **触发条件与后果**：Quoting or precedence errors could break installed hooks despite string assertions, and duplicate fixture structure could conceal the intended root-only package.
- **Current Diff 证据**：Root commands are at `hooks/hooks.json:9-40`; installed fixture is at `tests/tips.test.mjs:408-433`.
- **根因**：The initial tests validated configuration shape instead of command behavior and retained the former package layout.
- **修复方案**：Execute the exact SessionStart command against distinct fake plugin roots and build the installed fixture with root `hooks/hooks.json` only.
- **为何充分**：Both `PLUGIN_ROOT` precedence and `CLAUDE_PLUGIN_ROOT` fallback are observed through distinct outputs; lifecycle discovery passes without git metadata or duplicate hooks.
- **验证证据**：`tests/cli-install-output.test.js:112-142`; `tests/tips.test.mjs:408-433`.
- **状态 / 轮次 / Contributors**：fixed / 2 / plugin-package, anvil-lead.

#### Finding F5

- **原始问题**：There is no deterministic Codex CLI assertion that lists every recursively discovered plugin skill.
- **触发条件与后果**：Future Codex discovery changes could require manual/live catalog inspection beyond repository tests.
- **Current Diff 证据**：The manifest exports the recursive root at `.codex-plugin/plugin.json:38` and the package retains nested `skills/mattpocock/*/SKILL.md` files.
- **根因**：Current `codex plugin` commands support add/list/marketplace/remove, but no plugin-details or skill-enumeration command.
- **修复方案**：Use `npx skills add . --list --full-depth`, package inspection, live installed plugin state, and the active Codex catalog as equivalent evidence.
- **为何充分**：All 27 recursive leaves are independently enumerated and nested plugin skills are present in the active catalog; the remaining limitation is test automation ergonomics, not observed behavior.
- **验证证据**：27-skill list, 132-entry package dry-run, installed/enabled plugin entry, current active skill catalog.
- **状态 / 轮次 / Contributors**：accepted / 2 / plugin-package, anvil-lead.

#### 修复轮次与复核

| 轮次 | Finding IDs | 修复摘要 | Current Diff 复核 | 验证 | ReviewerContribution |
|---|---|---|---|---|---|
| 1 | F1-F5 | Initial adversarial cleanup and plugin-package findings | Fixes requested before approval | Focused failures/gaps identified | cleanup-safety, plugin-package |
| 2 | F1-F4 | Parent boundary, error propagation, broken-external case, exact hook execution, root-only fixture | No new finding | 52 tests and scoped checks pass | cleanup-safety, plugin-package, anvil-lead |
| 2 | F5 | Accepted equivalent current evidence; documented tooling limitation | Non-blocking | Recursive list/package/live catalog pass | plugin-package, anvil-lead |

### 9. Knowledge Used

| Knowledge Page / Conclusion | 如何影响设计或评审 | Current Evidence | 一致性 / 冲突 |
|---|---|---|---|
| None at design/review start | Knowledge directory was absent, so no prior page influenced implementation or served as finding evidence. | Requirement, plan, current code, tests, and plugin state | unrelated |

- **Draft clues**：0.
- **Relevant conflicts**：0.
- **Unrelated conflicts**：0.

### 10. Knowledge Impact

| Knowledge Page / Scope | Changed File / Symbol / Module | Impact | Current Evidence | Required Action | Synchronization / Conflict Decision |
|---|---|---|---|---|---|
| `docs/anvil/knowledge/tooling/safe-symlink-migration.md` | `removeLegacyCodexSkillLinks`; installer migration tests | `create` | `bin/csl-agent-kit.js:251-305`; `tests/cli-install-output.test.js:314-438` | Create one active atomic pattern and index it | Synchronized by review-auto Compound; no conflict. |

- **Compound / Review-Auto 审计证据引用**：See section 15 only.

### 11. 已知限制与后续事项

| Item | 类型 | 影响 / 原因 | Owner | 时机 / 跟踪位置 |
|---|---|---|---|---|
| Plugin-creator validator treats every immediate `skills/*` directory as a leaf and reports `skills/mattpocock` missing `SKILL.md`. | known limitation | False positive for the verified recursive source-group layout; manifest/interface checks otherwise pass. | Codex plugin tooling | Revisit when validator supports recursive leaf directories. |
| Codex CLI has no deterministic nested skill enumeration command. | known limitation | Repository test uses recursive Agent Skills listing plus package/live catalog evidence. | Codex CLI tooling | Replace equivalent evidence if a details/enumeration command appears. |

## 第三层：审计附录

### 12. Contributors

| Reviewer | Role | Scope | Files / Dimensions | Findings | Verification | Knowledge Impact |
|---|---|---|---|---|---|---|
| anvil-lead | Final adversarial reviewer and adjudicator | Full diff, spec traceability, security, Compound re-review | All changed files; all eight dimensions | No new findings; adjudicated F1-F5 | Full project/package/live/knowledge gates | `create` |
| cleanup-safety | Adversarial filesystem/security reviewer | Ownership and deletion boundary | `bin/csl-agent-kit.js`, cleanup tests | F1-F3 fixed; no new findings on re-review | CLI 22/22 and diff check | `none` |
| plugin-package | Adversarial packaging/compatibility reviewer | Root structure, hooks, recursive discovery evidence | Manifests, hooks, CLI/tips tests | F4 fixed; F5 accepted limitation | Focused 40/40, package/catalog checks | `none` |
| anvil-learnings-researcher | Changed-scope knowledge researcher | Reusable migration conclusion | Knowledge index/page candidate and current evidence | No conflict; recommended one pattern | Code/test/requirement/plan evidence | `create` |

### 13. 自动化预检与安全

| 检查项 | 命令 / 范围 | 结果 | 证据 / 备注 |
|---|---|---|---|
| Lint | Project has no separate lint script; syntax/behavior included in `npm run check` | N/A | No independent lint target. |
| 类型检查 | CommonJS installer and Node tests; no project type-check target | N/A | No TypeScript change or type-check script. |
| 单元测试 | `mise exec node@22 -- env -u NO_COLOR npm run check` | PASS | 52/52 across CLI/integration, tips, and Pi. |
| 其他验证 | JSON, diff, recursive list, package dry-run, live install/list, hook execution, knowledge validator | PASS | 27 skills, 132 package entries, plugin installed/enabled, legacy count 0, Compound 33 fixtures. |
| 硬编码密钥 / 敏感日志 | current diff | CLEAN | No credential material or new sensitive logging. |
| 注入 / XSS | CLI paths and fixed subprocess arguments; no web/SQL surface | N/A | No shell interpolation of legacy entry names; hook commands use quoted roots. |
| 依赖 CVE | changed dependencies | N/A | No dependency or lockfile change. |
| Yao rules audit | Production package/install audit after hook/docs changes | PASS | Package/resource boundaries pass; no `SKILL.md` routing change, so trigger eval is N/A. |

### 14. Karpathy 原则与适用维度

| 原则 | 结论 | Current diff 证据 |
|---|---|---|
| Think Before Coding | PASS | Spec records plugin-root, ownership, broken-link, saved-state, and failure-order assumptions. |
| Simplicity First | PASS | One existing root package and two small installer functions replace a dual installation target; no new abstraction/dependency. |
| Surgical Changes | PASS | Every behavior line maps to plugin packaging, hook resolution, migration safety, output, or regression evidence. |
| Goal-Driven Execution | PASS | Tests assert externally visible defaults, commands, filesystem state, failure order, package contents, and live installation. |

| 评审维度 | 结论 | 范围 / 备注 |
|---|---|---|
| Design | PASS | Repository-root plugin matches the platform distribution boundary. |
| Functionality | PASS | Required install, hook, cleanup, output, and saved-state cases pass. |
| Complexity | PASS | Direct standard-library scan; no framework or persistent migration state. |
| Naming | PASS | `removeLegacyCodexSkillLinks` and `isWithin` describe behavior and predicate. |
| Comments | PASS | No explanatory comment debt introduced. |
| Style & Consistency | PASS | Existing CommonJS/fs/spawn and Node test patterns retained. |
| Context | PASS | Removes duplicate package and discovery paths; documentation updated. |
| Tests | PASS | Behavior matrix covers success, failure, dry-run, idempotence, filesystem boundaries, hooks, and package layout. |

### 15. Compound / Review-Auto 审计

- **Review-Auto Applicability / Rationale**：Required because this is the same open full-flow review and code, security, and verification gates reached provisional PASS.
- **Compound Authorization**：`review-auto`.
- **Compound Status**：`active`.
- **Compound Mode**：`apply`.
- **Fresh Ephemeral OperationPlan**：Collect one reusable changed-scope pattern; select/rank it as an active `pattern`; inspect code/test/requirement/plan evidence; assert both target files absent; validate the complete virtual final state; apply deterministic create operations; independently revalidate actual state and hashes.
- **Operations**：`C1 create docs/anvil/knowledge/index.md`; `C2 create docs/anvil/knowledge/tooling/safe-symlink-migration.md`. Deterministic order: action priority, then lexical path.
- **Independent Preflight**：`validate_proposed_state` passed schema, body sections, path shape, realpath containment, related links, evidence, index/orphans, sensitive scan, forbidden legacy, and `plan_drift`; expected current state was exact absence for both paths.
- **Exact Knowledge Writes**：`docs/anvil/knowledge/index.md` SHA-256 `09ec54c289363edcec92c1e0ba5f04751583da57b4978c8de357855f2188765b`; `docs/anvil/knowledge/tooling/safe-symlink-migration.md` SHA-256 `8983ac4fe88bc60f9c11efe30a66d8c87844760a1d31232f6c20294cfe1855ac`.
- **Exact Knowledge Deletes**：None.
- **Independent Postflight**：Whole-root validator passed 33 behavior fixtures and one page; second in-memory validation passed every category including exact final-hash `plan_drift`; refreshed diff re-review found no schema, evidence, link, security, or conflict issue.
- **CompoundResultV2**（严格按 `Action`, `Mode`, `Scope`, `Candidates`, `Active`, `Draft`, `Conflicts`, `Operations`, `Writes`, `Deletes`, `Validation`, `Decision` 顺序）：

```yaml
Action: submit
Mode: apply
Scope: codex-plugin-migration changed-scope knowledge
Candidates: 1
Active: 1
Draft: 0
Conflicts: 0
Operations: 2
Writes: 2
Deletes: 0
Validation: preflight-pass; apply-exact; postflight-pass; hashes-match
Decision: continue
```

- **Unrelated Conflicts Reported**：None.
- **Relevant Conflict Resolution**：No relevant conflict exists.

### 16. MigrationDisposition

| Source Path | Disposition | Current Evidence |
|---|---|---|
| `.codex-plugin/hooks/hooks.json` | `duplicate` | Deleted; root `hooks/hooks.json` is packaged and lifecycle tests pass. |
| `hooks/hooks.json` | `extracted-and-code-validated` | Root manifest is canonical and exact commands execute from plugin-root variables. |
| `bin/csl-agent-kit.js::installCodexSkills` | `stale` | Removed target/function; explicit old target fails and saved selections migrate. |
| `~/.agents/skills/<CSL-owned-link>` | `stale` | Live migration removed owned links; directory inspection reports zero entries. |

### 17. 门禁

| 门禁项 | 状态 | 证据 / 阻塞项 |
|---|---|---|
| 3 分钟摘要可独立解释背景、Before/After、技术方案、边界、影响与 Reviewer 热点 | PASS | Sections 1-5. |
| 需求—实现—验证映射完整，未验证项显式 | PASS | Section 6; no unverified acceptance criterion. |
| 风险、兼容性、发布、回滚、观测、已知限制与后续事项完整 | PASS | Sections 7 and 11. |
| 自动化检查满足风险要求 | PASS | 52 tests plus package/list/live/knowledge evidence. |
| 安全扫描干净 | PASS | No secrets/dependency surface; deletion boundary reviewed and tested. |
| Karpathy 4/4 | PASS | Section 14. |
| 无未解决 Critical / High finding | PASS | F1-F4 fixed; F5 low and accepted with equivalent evidence. |
| Findings 均有 current diff 证据且闭环完整，或明确 `No findings.` | PASS | Section 8 preserves original issue-to-verification closure. |
| Knowledge Used 与 Knowledge Impact 已分离记录 | PASS | Sections 9-10. |
| Knowledge Impact 已同步或无需写入，且只记录分类、动作、同步/冲突结论和审计引用 | PASS | One `create`, synchronized; full evidence only in section 15. |
| `Compound / Review-Auto 审计` 中的 authorization / plan / preflight / exact Apply / postflight / ResultV2 完整 | PASS | Section 15. |
| 无未裁决相关知识冲突 | PASS | Conflicts 0. |
| Source of truth、验证证据、恢复点完整 | PASS | Implemented spec, executed plan, review evidence; next action is task commit. |
| 本 MR 只有一个 human-facing review 文档 | PASS | This is the only file under `docs/anvil/reviews/`. |

### 18. Final Decision

- **Decision**：`APPROVED`.
- **Rationale**：All specified plugin-only behavior is implemented and traceable; deletion boundaries and hook execution are directly tested; live migration and packaging evidence pass; all findings are closed or non-blockingly accepted; Yao and Compound gates pass with no knowledge conflict.
- **Unresolved Items**：None blocking. Two tooling limitations are documented in section 11.
- **Knowledge Synchronization**：One active safe-symlink-migration pattern and its index entry were applied and independently validated.
- **Resume / Next Action**：Stage only the accepted task write set and this approved review/status/knowledge artifact set, create the task commit, then verify a clean working tree. Do not create an MR/PR without a separate explicit request.
