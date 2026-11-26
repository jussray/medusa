/* Emberis is decorative; request state and authorization remain authoritative. */
function createEmberis(anchor,label,doc=document){const root=doc.createElement('div');root.className='medusa-emberis';root.hidden=true;root.setAttribute('role','status');const sprite=doc.createElement('span');sprite.className='medusa-emberis-sprite';sprite.setAttribute('aria-hidden','true');const copy=doc.createElement('span');copy.textContent='Emberis · '+label;root.append(sprite,copy);anchor.after(root);return active=>{root.hidden=!active};}
const emberisStyle=document.createElement('style');emberisStyle.textContent=".medusa-emberis{display:flex;align-items:center;gap:.5rem;color:inherit;font-size:.9rem}.medusa-emberis[hidden]{display:none!important}.medusa-emberis-sprite{display:inline-block;flex:none;width:48px;height:48px;background:url(data:image/webp;base64,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) no-repeat 0 0/384px 48px;animation:medusa-emberis-flutter 1.2s steps(8,end) infinite}@keyframes medusa-emberis-flutter{to{background-position:-384px 0}}@media(prefers-reduced-motion:reduce){.medusa-emberis-sprite{animation:none;background-position:0 0}}";document.head.append(emberisStyle);
/* end Emberis */
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
 const emberis=createEmberis(result,'Checking evidence integrity…');
 let receipt=null,busy=false;
 function sync(){run.disabled=busy||!consent.checked;emberis(busy)}
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
 const emberis=createEmberis(result,'Checking and saving receipt…');
 let active=false,busy=false;const sync=()=>{save.disabled=!active||busy||!consent.checked;emberis(busy)};
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
 button.addEventListener('click',async()=>{try{const r=await fetch('/auth/customer/logout',{method:'POST',credentials:'same-origin'});if(!r.ok)throw Error();location.replace('/auth/sign-in')}catch{button.textContent='Sign out not confirmed'}});
})();

;addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
;(()=>{
 const status=async()=>{try{const r=await fetch('/api/status',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)});return r.ok&&(await r.json()).customerAuth===true}catch{return false}};
 let replay=false,busy=false;
 async function gate(event){if(replay)return;event.preventDefault();event.stopImmediatePropagation();if(busy)return;busy=true;try{if(!await status()){location.replace('/auth/sign-in');return}replay=true;if(event.type==='submit')event.target.requestSubmit();else event.target.click()}finally{replay=false;busy=false}}
 document.getElementById('form')?.addEventListener('submit',gate,true);document.getElementById('sample')?.addEventListener('click',gate,true);
 document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&!await status())location.replace('/auth/sign-in')});
})();
