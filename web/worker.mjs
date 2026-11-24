const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=()'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const maxBody=49152;
async function readBody(request){
 const declared=request.headers.get('content-length');if(declared!==null&&Number(declared)>maxBody)throw 413;
 if(!request.body)throw 400;
 const reader=request.body.getReader();let bytes=0;const decoder=new TextDecoder('utf-8',{fatal:true});let text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBody){await reader.cancel();throw 413}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();return JSON.parse(text)}catch(e){throw e===413?413:400}finally{reader.releaseLock()}
}
async function integrity(request){
 if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'ORIGIN_REQUIRED'},403);
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return json({error:'JSON_REQUIRED'},415);
 let data;try{data=await readBody(request)}catch(e){return json({error:e===413?'BODY_TOO_LARGE':'INVALID_JSON'},e===413?413:400)}
 const {source,expected,quote,consent}=data??{};const encoder=new TextEncoder();
 if(consent!==true||typeof source!=='string'||!source.trim()||encoder.encode(source).length>16384||typeof expected!=='string'||!/^[a-fA-F0-9]{64}$/.test(expected)||typeof quote!=='string'||quote.trim().length<12||encoder.encode(quote).length>1024)return json({error:'INVALID_INPUT'},400);
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(source))),b=>b.toString(16).padStart(2,'0')).join('');
 const hashMatch=sha256===expected.toLowerCase(),quoteMatch=source.includes(quote);
 return json({schema:'medusa.integrity.v1',status:hashMatch&&quoteMatch?'MATCH':'MISMATCH',sha256,hashMatch,quoteMatch,authority:'NONE',independentTruthVerified:false,checkedAt:new Date().toISOString()});
}
const pages=new Map([['/','home'],['/brand','home'],['/overview','method'],['/evidence','review'],['/threats','threats'],['/audit','audit'],['/workspace','workspace'],['/auth/sign-in','signin'],['/auth/sign-up','signup']]);
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/integrity')return integrity(request);
 if(path==='/api/status'&&request.method==='GET')return json({integrity:true,customerAuth:false,aiRuntime:false,operationalActions:false});
 if(!['GET','HEAD'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
 if(pages.has(path)&&pages.get(path)!=='home')return new Response(null,{status:302,headers:{...headers,location:'/brand#'+pages.get(path)}});
 if(!pages.has(path)&&path!=='/index.html'&&path!=='/app.js')return json({error:'NOT_FOUND'},404);
 if(!env?.ASSETS)return json({error:'ASSETS_NOT_CONFIGURED'},503);
 url.pathname=path==='/app.js'?path:'/index.html';const asset=await env.ASSETS.fetch(new Request(url,{method:request.method}));
 const h=new Headers(asset.headers);for(const [k,v] of Object.entries(headers))h.set(k,v);h.set('content-security-policy',"default-src 'none'; script-src 'self' 'sha256-q3hfs2fI689rFKVRlx3rn74b6EqF9FlntT4F7Qr6VxI=' 'sha256-R9SrlQ+yvp8J6Kv3L+YUDy5N0An6J/S/akMbbOBq14s='; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");return new Response(asset.body,{status:asset.status,headers:h});
}};
