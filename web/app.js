(()=>{
 const $=id=>document.getElementById(id);
 const panel=document.createElement('div');panel.className='notice';
 const info=document.createElement('p');info.textContent='Optional server check: only submit fictional or non-sensitive evidence. Your text is transmitted to this service for this check; no application ledger is connected.';
 const consent=document.createElement('input');consent.type='checkbox';consent.id='serverConsent';
 const label=document.createElement('label');label.htmlFor=consent.id;label.textContent='I agree to send this text to the Medusa service.';
 const run=document.createElement('button');run.type='button';run.className='btn';run.textContent='Check on server';run.disabled=true;
 const result=document.createElement('output');result.setAttribute('aria-live','polite');
 panel.append(info,consent,label,run,result);$('form').after(panel);
 const audit=document.createElement('output');audit.textContent='No server receipt in this session.';
 const save=document.createElement('button');save.type='button';save.className='btn';save.textContent='Export server receipt';save.disabled=true;
 $('auditResult').after(audit,save);
 let receipt=null,busy=false;
 function sync(){run.disabled=busy||!consent.checked}
 consent.addEventListener('change',sync);
 run.addEventListener('click',async()=>{
  if(busy||!consent.checked)return;busy=true;sync();result.textContent='Checking…';receipt=null;save.disabled=true;audit.textContent='No current server receipt.';
  try{const response=await fetch('/api/integrity',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source:$('source').value,expected:$('expected').value,quote:$('quote').value,consent:true}),credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
   const data=await response.json();if(!response.ok||data.schema!=='medusa.integrity.v1'||!['MATCH','MISMATCH'].includes(data.status)||!/^[a-f0-9]{64}$/.test(data.sha256)||typeof data.hashMatch!=='boolean'||typeof data.quoteMatch!=='boolean'||data.authority!=='NONE'||data.independentTruthVerified!==false)throw Error('Unverified response');
   receipt=data;result.textContent=JSON.stringify(data,null,2);audit.textContent=result.textContent;save.disabled=false;
  }catch{result.textContent='Server check unavailable or invalid input. No receipt recorded.'}finally{busy=false;consent.checked=false;sync()}
 });
 save.addEventListener('click',()=>{if(!receipt)return;const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='medusa-integrity-receipt.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();
;(()=>{
 const section=document.getElementById('workspace'), form=document.getElementById('form');
 if(!section||!form)return;
 const panel=document.createElement('div');panel.className='notice';
 const status=document.createElement('p');status.setAttribute('aria-live','polite');status.textContent='Checking workspace availability…';
 const list=document.createElement('ol');const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='Refresh receipts';
 panel.append(status,refresh,list);section.append(panel);
 const save=document.createElement('button');save.type='button';save.className='btn';save.textContent='Check and save to workspace';save.disabled=true;
 const consent=document.createElement('input');consent.type='checkbox';consent.id='workspaceSaveConsent';
 const label=document.createElement('label');label.htmlFor=consent.id;label.textContent='Send non-sensitive text for checking and save the resulting digest and receipt metadata to my account.';
 const result=document.createElement('output');result.setAttribute('aria-live','polite');
 const control=document.createElement('div');control.className='notice';control.append(consent,label,save,result);form.after(control);
 let active=false,busy=false;const sync=()=>{save.disabled=!active||busy||!consent.checked};
 async function load(){active=false;sync();list.replaceChildren();try{
  const r=await fetch('/api/workspace',{credentials:'same-origin',cache:'no-store'});
  if(r.status===401){status.textContent='Sign in with an enrolled customer account to view saved receipts.';return}
  if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.receipts))throw Error();
  active=true;status.textContent=data.receipts.length?'Saved receipts (latest 100).':'No saved receipts yet.';
  for(const receipt of data.receipts){const li=document.createElement('li');li.textContent=`${receipt.checkedAt} · ${receipt.status} · ${receipt.sha256}`;list.append(li)}
 }catch{status.textContent='Customer workspace is not available on this deployment.'}finally{sync()}}
 refresh.addEventListener('click',load);consent.addEventListener('change',sync);
 save.addEventListener('click',async()=>{if(!active||busy||!consent.checked)return;busy=true;sync();result.textContent='Checking…';try{
  const r=await fetch('/api/workspace/receipts',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-medusa-save-consent':'yes'},body:JSON.stringify({source:document.getElementById('source').value,expected:document.getElementById('expected').value,quote:document.getElementById('quote').value,consent:true,saveConsent:true})});
  if(!r.ok)throw Error();const data=await r.json();if(!data.id||!['MATCH','MISMATCH'].includes(data.status))throw Error();result.textContent=`Saved receipt: ${data.status} · ${data.id}`;await load();
 }catch{result.textContent='Save not confirmed.'}finally{busy=false;consent.checked=false;sync()}});
 load();
})();
;(async()=>{
 try{const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok||!(await r.json()).googleConfigured)return}catch{return}
 for(const id of ['signin','signup']){
  const section=document.getElementById(id);if(!section)continue;
  const link=document.createElement('a');link.href='/auth/google/start';link.className='btn primary';link.textContent='Continue with Google';section.append(link);
 }
 const section=document.getElementById('workspace');if(!section)return;
 const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='Sign out';section.append(button);
 button.addEventListener('click',async()=>{try{const r=await fetch('/auth/customer/logout',{method:'POST',credentials:'same-origin'});if(!r.ok)throw Error();location.assign('/brand#signin');location.reload()}catch{button.textContent='Sign out not confirmed'}});
})();
