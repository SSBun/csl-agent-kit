const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const workspace = process.cwd();
const store = require(path.join(workspace, 'bin/memory/store.js'));
const base = path.join(workspace, '.csl-agent-kit/tasks/artifacts/memory-file-count-budget/evidence');
const before = JSON.parse(fs.readFileSync(path.join(base, 'reorganization-before.json'), 'utf8'));
const find = token => {
  const matches = before.filter(e => e.id.includes(token));
  if (matches.length !== 1) throw new Error(`Ambiguous entry: ${token}`);
  return matches[0];
};
const specs = [
  ['迁移协调、历史整理与旧项目检测', '目录与Memory迁移分别验收；保真移动与冲突恢复保留，Pi自动检测需求不授权无人确认搬迁。', ['agent-migration-directory', 'bf4d705', 'pi-legacy-project']],
  ['项目架构、数据边界与命名', 'Kit架构与职责、用户数据根、产品及插件命名；新名称未定，取消兼容须有明确要求，语言服从当前指令。', ['5b681', '01aa1', 'ee92e', 'bacee', 'bc839', 'e393c']],
  ['Agent Hooks 接入、注入与宿主信任', 'Hook运行时、Rules来源、生命周期与宿主信任；配置、eligible及安装成功均不等于实际注入，实际规则来源须核对。', ['2e317', 'd88f', '9151d']],
  ['SOP 发现、存储与编写边界', '项目优先于用户及内置，保留旧发现路径过渡；示例轻量化，语言按当前有效要求，不扩张局部字段约束。', ['22ba57', '51c13', 'b6cd5']],
  ['CLI 安装选择、确认与输出', '默认安装、保存选择和显式选择分别处理；同次选择不重复确认，独立门禁仍适用，人类输出默认有色。', ['d3613', '81137', 'ed7ba']],
  ['Task 工作流、证据与展示边界', '任务执行族、证据失效和完成门禁；评分留记录，重要局限仍报告，取消限制不等于取消流程。', ['4a985', 'task-score', '7ac549']],
  ['项目约定与多 Agent 审查职责', '稳定规则与易变流程分层；语言依当前指令，角色匹配工作阶段，审查按Required Outcome而非建议方案关闭。', ['c9e1b', '2699b']],
  ['Pi 标题生成与共享 UI 状态', '自动及手动标题刷新、确定性短标签约束；保持决定可重应用已有值，失败和无历史值遵循独立边界。', ['9e202', 'c4d4a', 'f7005']],
  ['Memory 召回、准入与紧凑索引', '项目20条、每条1000词、单索引；召回与条件保留优先，先存后删，检索不授权，Repo Map聚焦职责关系。', ['042589', 'recall-first', 'c5a35']],
  ['Pi 设置、审查模型与状态显示', 'Task模式层级和审查模型解析，配置错误显式显示；Git只显示干净与否，重载和实际生效须分别验证。', ['66a03', 'pi-git-status']],
  ['Skill 整合、分发与集成参考', '来源元数据、自包含和项目专用发现边界；移动检查所有消费者，清空不授权重装，含本机参考仓及Hook接入线索。', ['c1c22', '1617a']],
];
const groups = specs.map(([title, summary, tokens]) => ({ title, summary, entries: tokens.map(find) }));
const destinations = new Map(groups.flatMap(g => g.entries.map(e => [e.id, g.entries[0].id])));
const uniq = values => [...new Set(values)];
function bodyOf(entry) {
  let body = entry.body;
  if (entry.id.includes('c9e1b')) body = body.replace('- 项目本地及可分发 Skill 包：SKILL.md、运行参考、prompt、模板、评测说明用英文；报告与回复用用户语言。故意测试其他语言的 fixture 除外；局部修改不授权批量翻译其他包。', '- 语言以当前实际注入的指令为准。本机 /Users/caishilin/AGENTS.md 要求文档、报告与回复使用中文，AGENTS.md、CLAUDE.md及规则文件例外；代码和标识符保持原语言。历史 Skill 包英文约定不能覆盖当前要求；故意测试其他语言的 fixture 保留，局部修改不授权批量翻译。');
  if (entry.id.includes('5b681')) body = body.replace('Skill 规则／运行契约用英文，回复／报告用用户语言。', '语言遵守当前实际注入指令；历史 Skill 包英文约定不能覆盖本机现行中文文档与回复要求，规则文件等例外见 /Users/caishilin/AGENTS.md。');
  if (entry.id.includes('1617a')) body = body.replace('Agent Hooks 的分发 `SKILL.md` 使用英文，以 bundled CLI', 'Agent Hooks 的分发 `SKILL.md` 语言服从当前有效指令，以 bundled CLI');
  if (entry.id.includes('b6cd5')) body = body.replace('不要把 SOP 文件全文强制为某一种语言；主流程描述可以使用任意语言，只有用户明确要求的字段或模板片段才固定语言。', '遵守当前有效语言指令；在没有全文语言要求时，主流程描述可使用任意语言，只有明确要求的字段或模板片段固定语言，不能由局部约束推出全文要求。');
  return body;
}
const plan = groups.map(g => {
  const target = g.entries[0];
  const retrieval = {
    aliases: uniq(g.entries.flatMap(e => [e.title, ...(e.retrieval?.aliases || [])])),
    situations: uniq(g.entries.flatMap(e => e.retrieval?.situations || [])),
    topics: uniq(g.entries.flatMap(e => e.retrieval?.topics || [])),
    links: [...new Map(g.entries.flatMap(e => e.retrieval?.links || []).map(l => ({...l, id:l.scope === 'project' ? destinations.get(l.id) || l.id : l.id})).filter(l => !(l.scope === 'project' && l.id === target.id)).map(l => [JSON.stringify(l), l])).values()],
  };
  const sources = uniq(g.entries.flatMap(e => e.sources));
  if (g.entries.some(e => /c9e1b|5b681|1617a|b6cd5/.test(e.id))) sources.push('/Users/caishilin/AGENTS.md#Language Protocol');
  const content = {title:g.title,summary:g.summary,type:target.type,sources,body:g.entries.map(e => `## ${e.title}\n\n${bodyOf(e)}`).join('\n\n'),retrieval};
  if (store.words(content.body) > 1000 || sources.length > 30) throw new Error(`Budget exceeded: ${target.id} ${store.words(content.body)} words/${sources.length} sources`);
  return {id:target.id,memberIds:g.entries.map(e=>e.id),content};
});
fs.writeFileSync(path.join(base, 'reorganization-plan.json'), JSON.stringify(plan,null,2)+'\n');
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({before:before.length,after:before.length-plan.reduce((n,g)=>n+g.memberIds.length-1,0),groups:plan.map(g=>({id:g.id,members:g.memberIds.length,words:store.words(g.content.body),sources:g.content.sources.length}))},null,2));
  process.exit(0);
}
const root = store.rootFor({workspace,scope:'project'});
for (const old of before) if (store.get(root,old.id).hash !== old.hash) throw new Error(`Entry changed since baseline: ${old.id}`);
const observations = [];
function apply(input) {
  const file=path.join(base,'reorganization-mutation.json');
  fs.writeFileSync(file,JSON.stringify(input,null,2));
  const output=JSON.parse(execFileSync(process.execPath,['bin/csl-agent-kit.js','memory',input.operation,'--scope','project','--workspace',workspace,'--input',file],{encoding:'utf8'}));
  observations.push({id:input.id,operation:input.operation,result:output});
  fs.writeFileSync(path.join(base,'reorganization-effects.json'),JSON.stringify(observations,null,2)+'\n');
}
const source='task:memory-file-count-budget; 用户本轮明确要求按新设计整理当前工作区记忆; evidence/reorganization-before.json与reorganization-plan.json';
for(const group of plan){
  const current=store.get(root,group.id);
  apply({id:group.id,operation:'put',expected:{revision:current.revision,hash:current.hash},reason:'按相容主题合并；保留全部成员来源、正文条件及检索入口，显式修正历史语言约定的当前适用边界。',source,content:group.content});
  const saved=store.get(root,group.id);
  if(saved.body !== group.content.body || JSON.stringify(saved.sources)!==JSON.stringify(group.content.sources))throw new Error(`Readback failed: ${group.id}`);
}
for(const group of plan)for(const id of group.memberIds.slice(1)){
  const current=store.get(root,id);
  if(current.hash!==before.find(e=>e.id===id).hash)throw new Error(`Deletion conflict: ${id}`);
  apply({id,operation:'delete',expected:{revision:current.revision,hash:current.hash},reason:`正文及来源已合入 ${group.id} 并完整回读；组内关系映射到保留条目，删除仍经writer入链检查。`,source});
}
fs.unlinkSync(path.join(base,'reorganization-mutation.json'));
console.log(JSON.stringify({changes:observations.length,budget:store.budgetStatus(root),index:store.inspectIndex({workspace,scope:'project'}).index},null,2));
