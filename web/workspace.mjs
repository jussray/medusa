const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const encoder=new TextEncoder();
export async function session(request,db){
 const values=(request.headers.get('cookie')??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('__Host-medusa_customer='));
 if(values.length!==1)return null;
 const token=values[0].slice('__Host-medusa_customer='.length);
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 return db.prepare("SELECT customer_id FROM customer_sessions WHERE token_hash=? AND role='customer' AND expires_at>? AND revoked=0").bind(hash,Date.now()).first();
}
function receipt(row){return {schema:'medusa.integrity.v1',id:row.id,status:row.hash_match&&row.quote_match?'MATCH':'MISMATCH',sha256:row.sha256,hashMatch:!!row.hash_match,quoteMatch:!!row.quote_match,authority:'NONE',independentTruthVerified:false,checkedAt:row.checked_at}}
export async function workspace(request,env,integrity){
 const path=new URL(request.url).pathname;
 if(env?.MEDUSA_WORKSPACE_ENABLED!=='true'||!env.WORKSPACE_DB)return json({error:'WORKSPACE_NOT_CONFIGURED'},503);
 const db=env.WORKSPACE_DB;
 try{
  const account=await session(request,db);
  if(!account?.customer_id)return json({error:'CUSTOMER_SESSION_REQUIRED'},401);
  if(path==='/api/workspace'&&request.method==='GET'){
   const rows=await db.prepare('SELECT id,sha256,hash_match,quote_match,checked_at FROM customer_receipts WHERE customer_id=? ORDER BY checked_at DESC,id DESC LIMIT 100').bind(account.customer_id).all();
   return json({receipts:rows.results.map(receipt)});
  }
  if(path==='/api/workspace/receipts'&&request.method==='POST'){
   if(request.headers.get('x-medusa-save-consent')!=='yes')return json({error:'SAVE_CONSENT_REQUIRED'},400);
   const checked=await integrity(request,true);if(!checked.ok)return checked;
   const r=await checked.json();const id=crypto.randomUUID();
   await db.prepare('INSERT INTO customer_receipts(id,customer_id,sha256,hash_match,quote_match,checked_at) VALUES (?,?,?,?,?,?)').bind(id,account.customer_id,r.sha256,Number(r.hashMatch),Number(r.quoteMatch),r.checkedAt).run();
   return json({...r,id},201);
  }
  return json({error:'METHOD_NOT_ALLOWED'},405);
 }catch{return json({error:'WORKSPACE_UNAVAILABLE'},503)}
}
