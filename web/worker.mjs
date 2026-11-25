import {auth,googleConfigured} from './auth.mjs';
import {workspace,session} from './workspace.mjs';
import {pages,searchable,renderPublic,discovery} from './discovery.mjs';
const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=()'};
const privateHeaders={...headers,'x-robots-tag':'noindex, nofollow, noarchive','vary':'Cookie'};
const json=(value,status=200)=>Response.json(value,{status,headers:privateHeaders});
const maxBody=49152;
async function readBody(request){
 const declared=request.headers.get('content-length');if(declared!==null&&Number(declared)>maxBody)throw 413;
 if(!request.body)throw 400;
 const reader=request.body.getReader();let bytes=0;const decoder=new TextDecoder('utf-8',{fatal:true});let text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBody){await reader.cancel();throw 413}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();return JSON.parse(text)}catch(e){throw e===413?413:400}finally{reader.releaseLock()}
}
async function integrity(request,save=false){
 if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'ORIGIN_REQUIRED'},403);
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return json({error:'JSON_REQUIRED'},415);
 let data;try{data=await readBody(request)}catch(e){return json({error:e===413?'BODY_TOO_LARGE':'INVALID_JSON'},e===413?413:400)}
 const {source,expected,quote,consent}=data??{};const encoder=new TextEncoder();
 if((save&&data?.saveConsent!==true)||consent!==true||typeof source!=='string'||!source.trim()||encoder.encode(source).length>16384||typeof expected!=='string'||!/^[a-fA-F0-9]{64}$/.test(expected)||typeof quote!=='string'||quote.trim().length<12||encoder.encode(quote).length>1024)return json({error:'INVALID_INPUT'},400);
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(source))),b=>b.toString(16).padStart(2,'0')).join('');
 const hashMatch=sha256===expected.toLowerCase(),quoteMatch=source.includes(quote);
 return json({schema:'medusa.integrity.v1',status:hashMatch&&quoteMatch?'MATCH':'MISMATCH',sha256,hashMatch,quoteMatch,authority:'NONE',independentTruthVerified:false,checkedAt:new Date().toISOString()});
}
const publicOrigin='https://medusa-public-review.mcgill-raylene.workers.dev';
const csp="default-src 'none'; script-src 'self' 'sha256-q3hfs2fI689rFKVRlx3rn74b6EqF9FlntT4F7Qr6VxI=' 'sha256-R9SrlQ+yvp8J6Kv3L+YUDy5N0An6J/S/akMbbOBq14s='; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
async function authorized(request,env){try{return env?.MEDUSA_WORKSPACE_ENABLED==='true'&&env.WORKSPACE_DB&&Boolean((await session(request,env.WORKSPACE_DB))?.customer_id)}catch{return false}}
function redirect(location,status=302){return new Response(null,{status,headers:{...privateHeaders,location}})}
function pageResponse(body,request,privatePage=false,type='text/html; charset=utf-8'){
 return new Response(request.method==='HEAD'?null:body,{headers:{...(privatePage?privateHeaders:headers),'content-type':type,'content-security-policy':csp}});
}
async function assetText(env,request,path){if(!env?.ASSETS)throw Error('ASSETS_NOT_CONFIGURED');const url=new URL(request.url);url.pathname=path;url.search='';const response=await env.ASSETS.fetch(new Request(url));if(!response.ok)throw Error('ASSET_NOT_AVAILABLE');return response.text()}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname,origin=env?.MEDUSA_PUBLIC_ORIGIN||publicOrigin;
 if(['/auth/google/start','/auth/google/callback','/auth/customer/logout'].includes(path)){const r=await auth(request,env);if(path==='/auth/google/callback'&&r.status===400&&request.headers.get('accept')?.includes('text/html'))return redirect('/auth/sign-in?reason=verification',303);const h=new Headers(r.headers);h.set('x-robots-tag',privateHeaders['x-robots-tag']);return new Response(r.body,{status:r.status,headers:h})}
 if(path==='/api/integrity'){if(!await authorized(request,env))return json({error:'CUSTOMER_SESSION_REQUIRED'},401);return integrity(request)}
 if(path==='/api/workspace'||path==='/api/workspace/receipts'){const r=await workspace(request,env,integrity);const h=new Headers(r.headers);h.set('x-robots-tag',privateHeaders['x-robots-tag']);h.set('vary','Cookie');return new Response(r.body,{status:r.status,headers:h})}
 if(path==='/api/status'&&request.method==='GET'){const active=await authorized(request,env);return json({integrity:!!active,customerAuth:!!active,googleConfigured:googleConfigured(url,env),aiRuntime:false,operationalActions:false})}
 if(!['GET','HEAD'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
 if(path==='/')return new Response(null,{status:301,headers:{...headers,location:'/brand'}});
 const manifest=discovery(path,origin);if(manifest)return pageResponse(manifest[1],request,false,manifest[0]);
 try{
  if(path==='/app'||path==='/app.js'){
   if(!await authorized(request,env))return path==='/app'?redirect('/auth/sign-in'):json({error:'CUSTOMER_SESSION_REQUIRED'},401);
   return pageResponse(await assetText(env,request,path==='/app'?'/index.html':'/app.js'),request,true,path==='/app'?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
  }
  if(path==='/public-ui.js')return pageResponse(await assetText(env,request,path),request,false,'text/javascript; charset=utf-8');
  if(Object.hasOwn(pages,path)){if(['/access','/auth/sign-in','/auth/sign-up','/auth/verify-account'].includes(path)&&await authorized(request,env))return redirect('/app#workspace');return pageResponse(renderPublic(await assetText(env,request,'/marketing.html'),path,origin,googleConfigured(url,env),url.searchParams.get('reason')==='verification'),request,!searchable.includes(path));}
  return json({error:'NOT_FOUND'},404);
 }catch{return json({error:'ASSET_UNAVAILABLE'},503)}
}};
