const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const workspace=process.cwd(),profile=fs.mkdtempSync(path.join(os.tmpdir(),'memory-ui-check-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-proxy-server','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
(async()=>{
 const endpoint=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('Browser startup timeout')),15000);chrome.stderr.on('data',b=>{text+=b;const m=text.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});chrome.on('error',reject);});
 const tabs=await(await fetch(endpoint+'/json/list')).json();socket=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map();socket.addEventListener('message',e=>{const x=JSON.parse(e.data);if(x.id){const p=pending.get(x.id);if(p){pending.delete(x.id);x.error?p.reject(new Error(x.error.message)):p.resolve(x.result);}}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const {url}=await require(path.join(workspace,'bin/memory/service.js')).dashboard();const navigation=await call('Page.navigate',{url});if(navigation.errorText)throw new Error(navigation.errorText);
 for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));const r=await call('Runtime.evaluate',{expression:'typeof showJob === "function" && !!window.MemoryDetailRenderer',returnByValue:true});if(r.result.value)break;}
 const observation=await call('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{try{
 if(typeof api !== 'function')return {error:'dashboard script unavailable',title:document.title,origin:location.origin,pathname:location.pathname,body:document.body?.textContent.slice(0,300),scripts:[...document.scripts].map(s=>new URL(s.src,location.href).pathname)};
 const page=await api('/api/jobs?newestFirst=true&limit=20');let chosen,maintenance;
 for(const item of page.items){const job=await api('/api/job?'+query({id:item.id}));if(job.event?.maintenance)maintenance={id:item.id,...job};if(job.event?.messages?.length>1){chosen={id:item.id,...job};break;}}
 if(!chosen)return {available:false,reason:'没有多消息待处理批次'};
 await showJob(chosen.id);const messages=chosen.event.messages;const out={available:true,messageCount:messages.length,latestSelected:$('job-history').value===String(messages.length-1),latestRendered:$('job-message').textContent.length>0,diagnosticsCollapsed:!$('job-diagnostics').open,changesCollapsed:!$('job-changes').open,metadataCollapsed:!$('detail-metadata').open,comparisonHidden:document.querySelector('.comparison').hidden};
 $('job-history').value='0';$('job-history').dispatchEvent(new Event('change'));out.historySwitch=$('job-message-heading').textContent.includes('1 / '+messages.length);
 $('job-diagnostics').open=true;await showJob(chosen.id);out.reopenDefaults=!$('job-diagnostics').open&&$('job-history').value===String(messages.length-1);
 if(maintenance){await showJob(maintenance.id);out.maintenanceEmpty=$('job-history').disabled&&$('job-message').textContent.includes('周期维护');}
 return out;
 }catch(e){return {error:e.message};}})()`});
 const result=observation.result.value||{error:observation.exceptionDetails?.text};
 fs.writeFileSync(path.join(__dirname,'browser-observation.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));if(result.error||!result.available)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(async()=>{socket?.close();chrome.kill();await new Promise(r=>setTimeout(r,500));fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});});
