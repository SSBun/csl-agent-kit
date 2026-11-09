const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'memory-history-boundary-'));
process.env.CSL_AGENT_KIT_HOME=path.join(root,'home');
const workspace=path.join(root,'project');fs.mkdirSync(workspace);
const repo='/Users/caishilin/Desktop/personal/skills';
const queue=require(repo+'/bin/memory/queue.js');
const runtime=require(repo+'/bin/memory/runtime-files.js');
const store=require(repo+'/bin/memory/store.js');
const commits=require(repo+'/bin/memory/commits.js');
const output=(stage,data)=>console.log(JSON.stringify({stage,...data}));
const event=eventKey=>({schema:'csl-memory-event/v1',workspace,session:'boundary',eventKey,messages:[{role:'user',text:'隔离容量走查'}]});
function nearLimit(id){
 const values={};
 for(let i=0;i<15196;i++) values[id.slice(0,2)+crypto.createHash('sha256').update(String(i)).digest('hex').slice(2)]='a'.repeat(64);
 runtime.write(`receipts/${id.slice(0,2)}.json`,values);
 return values;
}
function collected(prefix){
 const value=runtime.read(`receipts/${prefix}.json`);
 if(!value)return {};
 if(value.schema!=='csl-memory-receipt-branch/v1')return value;
 return Object.assign({},...Array.from('0123456789abcdef',ch=>collected(prefix+ch)));
}
const first=queue.enqueue(event('capacity'));
const original=nearLimit(first.id);
const beforeBytes=fs.statSync(runtime.file(`receipts/${first.id.slice(0,2)}.json`)).size;
queue.complete(first.id);
const values=collected(first.id.slice(0,2));
output('跨2MiB旧读取边界',{beforeBytes,unsplitAfterBytes:beforeBytes+138,readLimit:2*1024*1024,rootKind:runtime.read(`receipts/${first.id.slice(0,2)}.json`).schema,keys:Object.keys(values).length,lost:Object.entries(original).filter(([id,h])=>values[id]!==h).length,maxFileBytes:Math.max(...runtime.names('receipts').map(n=>fs.statSync(runtime.file('receipts/'+n)).size)),duplicate:queue.enqueue(event('capacity')).duplicate,oldReceipt:queue.get(Object.keys(original)[0]).event.payloadHash});
const interrupted=queue.enqueue(event('interrupted-split'));
if(interrupted.id.slice(0,2)===first.id.slice(0,2))throw new Error('Choose independent prefix for this manual fixture');
const prior=nearLimit(interrupted.id);
const write=runtime.write;let children=0;
runtime.write=(name,value)=>{if(name.startsWith('receipts/')&&name.split('/')[1].split('.')[0].length>2&&++children===3)throw new Error('manual split interruption');return write(name,value);};
try{queue.complete(interrupted.id);}catch(e){output('分裂中断',{message:e.message,status:queue.get(interrupted.id).state.status,eventRetained:fs.existsSync(runtime.file('events/'+interrupted.id+'.json'))});}finally{runtime.write=write;}
queue.reconcile();
const recovered=collected(interrupted.id.slice(0,2));
output('分裂恢复',{retired:queue.get(interrupted.id).state.retired,duplicate:queue.enqueue(event('interrupted-split')).duplicate,lost:Object.entries(prior).filter(([id,h])=>recovered[id]!==h).length,keys:Object.keys(recovered).length});
const history=path.join(fs.realpathSync(workspace),'.csl-agent-kit/memory/.history');fs.mkdirSync(history,{recursive:true});
for(let i=0;i<205;i++){
 const id=crypto.randomUUID();
 fs.writeFileSync(path.join(history,id+'.json'),JSON.stringify({schema:'csl-memory-change/v1',id,entryId:'audit-'+i,status:i%50===0?'prepared':'committed',at:new Date(Date.UTC(2026,0,1,0,0,i)).toISOString(),reason:'隔离分页资料',before:null,after:'fixture'}));
}
const read=fs.readFileSync;let reads=0;
fs.readFileSync=function(file,...args){if(String(file).startsWith(history+path.sep))reads++;return read.call(this,file,...args);};
try{
 const firstPage=commits.list({scope:'project',workspace,limit:20});
 const firstReads=reads;reads=0;
 const secondPage=commits.list({scope:'project',workspace,offset:20,limit:20});
 output('205笔审计分页读次数',{firstReads,secondReads:reads,total:firstPage.total,first:firstPage.items[0].entryId,second:secondPage.items[0].entryId,overlap:firstPage.items.filter(x=>secondPage.items.some(y=>y.id===x.id)).length,nonCommitted:firstPage.items.filter(x=>x.status!=='committed').length});
}finally{fs.readFileSync=read;}
output('隔离目录',{root});
