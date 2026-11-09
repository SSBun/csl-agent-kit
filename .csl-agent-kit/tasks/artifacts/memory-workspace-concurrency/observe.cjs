const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'memory-concurrency-'));
process.env.CSL_AGENT_KIT_HOME=path.join(root,'home');
const repo='/Users/caishilin/Desktop/personal/skills';
const queue=require(repo+'/bin/memory/queue.js'),store=require(repo+'/bin/memory/store.js');
const service=require(repo+'/bin/memory/service.js'),maintenance=require(repo+'/bin/memory/maintenance.js');
const originalSchedule=maintenance.schedule;maintenance.schedule=()=>[];
require(repo+'/bin/memory/endpoint.js').resolve=()=>({port:0,token:crypto.randomBytes(32).toString('hex')});
require(repo+'/bin/memory/model-config.js').resolveModel=async()=>({provider:'isolated',model:'stub'});
const spaces=Array.from({length:7},(_,i)=>{const p=path.join(root,'workspace-'+i);fs.mkdirSync(p);return fs.realpathSync(p);});
const input=(workspace,eventKey)=>({schema:'csl-memory-event/v1',workspace,session:'isolated',eventKey,messages:[{role:'user',text:'隔离调度观察'}]});
const put=(workspace,id)=>store.mutate({scope:'project',workspace},{operation:'put',id,expected:{revision:0,hash:null},reason:'隔离调度观察',source:'isolated',session:'isolated',content:{title:id,summary:'隔离资料',type:'fact',sources:['isolated'],body:'隔离资料'}});
const permanent=queue.enqueue(input(spaces[0],'permanent'));
const following=queue.enqueue(input(spaces[0],'following'));
const existing=queue.enqueue(input(spaces[1],'legacy-exhausted'));queue.update(existing.id,{status:'failed',attempts:2,error:'old failure'});
queue.enqueue(input(spaces[1],'normal-b'));
const interrupted=queue.enqueue(input(spaces[2],'interrupted'));queue.update(interrupted.id,{status:'interrupted',attempts:1});
const capped=queue.enqueue(input(spaces[3],'queued-at-cap'));queue.update(capped.id,{attempts:2});queue.enqueue(input(spaces[3],'normal-d'));
const transient=queue.enqueue(input(spaces[4],'transient'));
const crashed=queue.enqueue(input(spaces[5],'crashed'));queue.update(crashed.id,{status:'running',attempts:1});
const calls={},busy=new Set();let maxActive=0,sameWorkspaceOverlap=0,effectsOnRetry=0,transaction;
require(repo+'/bin/memory/agent.js').createManager=()=>({close(){},async run(event,options){
 const key=event.eventKey;calls[key]=(calls[key]||0)+1;if(busy.has(event.workspace))sameWorkspaceOverlap++;
 busy.add(event.workspace);maxActive=Math.max(maxActive,busy.size);
 try{
  if(key==='permanent'&&calls[key]===1){const result=put(event.workspace,'partial');transaction=result.transaction;options.recordEffect({scope:'project',transaction});}
  if(key==='permanent'&&calls[key]===2)effectsOnRetry=queue.get(event.id).state.effects.length;
  await new Promise(resolve=>setTimeout(resolve,80));
  if(['permanent','interrupted','crashed'].includes(key)||key==='transient'&&calls[key]===1)throw new Error('isolated simulated failure');
 }finally{busy.delete(event.workspace);}
}});
(async()=>{
 await require(repo+'/bin/memory/daemon.js').main();
 const deadline=Date.now()+12000;
 while(Date.now()<deadline){if(calls.following===1&&queue.get(transient.id).state.retired&&busy.size===0)break;await new Promise(resolve=>setTimeout(resolve,100));}
 const status=await service.status();
 const observed={maxActive,sameWorkspaceOverlap,calls,permanent:queue.get(permanent.id).state.status,attempts:queue.get(permanent.id).state.attempts,legacy:queue.get(existing.id).state.status,capped:queue.get(capped.id).state.status,interruptedAttempts:queue.get(interrupted.id).state.attempts,crashedAttempts:queue.get(crashed.id).state.attempts,effectsOnRetry,partialCommit:store.changeDetail({scope:'project',workspace:spaces[0]},transaction).status,schedulerError:status.schedulerError};
 try{queue.retry(permanent.id);observed.manualRetry='accepted';}catch(e){observed.manualRetry=e.code;}
 queue.reconcile();observed.afterReconcile=queue.get(permanent.id).state.status;
 await service.request('/api/stop',{method:'POST',body:{ifIdle:true}});
 maintenance.schedule=originalSchedule;
 put(spaces[6],'a');put(spaces[6],'b');
 const sweep=queue.enqueue({schema:'csl-memory-event/v1',workspace:spaces[6],session:'memory-maintenance',eventKey:'maintenance:project:initial',maintenance:{scope:'project',ids:['a']},messages:[]});
 queue.update(sweep.id,{status:'exhausted',attempts:2,error:'isolated exhausted'});
 const now=Date.now();maintenance.schedule(queue.all(),now);
 const pending=()=>queue.all().filter(x=>x.event.workspace===spaces[6]&&x.state.status==='queued');
 observed.sweepImmediate=pending().length;
 maintenance.schedule(queue.all(),now+maintenance.INTERVAL+1000);
 observed.sweepLater=pending().map(x=>({ids:x.event.maintenance.ids,newID:x.event.id!==sweep.id}));
 observed.successCheckpoint=queue.checkpoint('project',spaces[6]);
 observed.root=root;
 console.log(JSON.stringify(observed,null,2));
 fs.writeFileSync(repo+'/.csl-agent-kit/tasks/artifacts/memory-workspace-concurrency/observation.json',JSON.stringify(observed,null,2)+'\n');
})().catch(async e=>{console.error(e);try{await service.request('/api/stop',{method:'POST',body:{}});}catch{}process.exitCode=1;});
