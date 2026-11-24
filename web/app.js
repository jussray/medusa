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
