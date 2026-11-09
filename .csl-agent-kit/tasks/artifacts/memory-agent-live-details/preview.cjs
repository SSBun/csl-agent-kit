const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'memory-live-preview-'));
process.env.CSL_AGENT_KIT_HOME=path.join(root,'home');
const repo='/Users/caishilin/Desktop/personal/skills';
const workspace=path.join(root,'project');fs.mkdirSync(workspace);
const live=require(repo+'/bin/memory/live.js');
require(repo+'/bin/memory/endpoint.js').resolve=()=>({port:0,token:'a'.repeat(64)});
require(repo+'/bin/memory/model-config.js').resolveModel=async()=>({provider:'isolated',model:'preview'});
require(repo+'/bin/memory/maintenance.js').schedule=()=>[];
require(repo+'/bin/memory/agent.js').createManager=()=>({inspect:live.get,close:live.clear,async run(event,{signal}){
 live.start(event,1);
 live.observe(event.workspace,{type:'tool_execution_start',toolName:'read',toolCallId:'preview-call',args:{path:'/isolated/example.md'}});
 live.observe(event.workspace,{type:'message_end',message:{role:'assistant',content:[{type:'thinking',thinking:'HIDDEN_CANARY'},{type:'text',text:'正在核对相关记忆。'}]}});
 const timer=setInterval(()=>live.observe(event.workspace,{type:'tool_execution_end',toolName:'read',toolCallId:'preview-call',result:{content:[{type:'text',text:'公开工具结果 <img src=x onerror="window.liveXss=true">'}]},isError:false}),1000);
 await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));clearInterval(timer);live.finish(event.workspace,'interrupted','预览结束');
}});
require(repo+'/bin/memory/queue.js').enqueue({schema:'csl-memory-event/v1',workspace,session:'preview',eventKey:'preview',messages:[{role:'user',text:'这是隔离输入，展示实时工具处理。'}]});
require(repo+'/bin/memory/daemon.js').main().then(()=>{const descriptor=require(repo+'/bin/memory/runtime-files.js').read('daemon.json');fs.writeFileSync(path.join(__dirname,'preview-location.json'),JSON.stringify({port:descriptor.port,workspace,root,pid:process.pid}));});
setTimeout(()=>process.kill(process.pid,'SIGTERM'),180000).unref();
