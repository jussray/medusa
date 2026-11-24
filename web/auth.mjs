const encoder=new TextEncoder();
const headers={'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(error,status)=>Response.json({error},{status,headers});
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async s=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
function cookie(request,name){const values=(request.headers.get('cookie')??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));const value=values.length===1?values[0].slice(name.length+1):'';return /^[a-f0-9]{64}$/.test(value)?value:null}
const setCookie=(name,value,age)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
const redirect=(location,status,cookies)=>{const h=new Headers({...headers,location});for(const c of cookies)h.append('set-cookie',c);return new Response(null,{status,headers:h})};
const issuer='https://accounts.google.com';
const oauthCookie='__Host-medusa_oauth',customerCookie='__Host-medusa_customer';
async function verify(token,nonce,client,network){
 if(typeof token!=='string'||token.length>16000)throw Error();const parts=token.split('.');if(parts.length!==3||parts.some(x=>!/^[A-Za-z0-9_-]+$/.test(x)))throw Error();
 const parse=s=>JSON.parse(new TextDecoder().decode(decode(s)));const h=parse(parts[0]),c=parse(parts[1]);
 const now=Math.floor(Date.now()/1000);
 if(h.alg!=='RS256'||typeof h.kid!=='string'||h.crit!==undefined||![issuer,'accounts.google.com'].includes(c.iss)||c.aud!==client||(c.azp!==undefined&&c.azp!==client)||!Number.isSafeInteger(c.exp)||c.exp<=now||!Number.isSafeInteger(c.iat)||c.iat>now+60||c.iat<now-600||c.nonce!==nonce||typeof c.sub!=='string'||!c.sub||c.sub.length>255)throw Error();
 const response=await network('https://www.googleapis.com/oauth2/v3/certs',{redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();const keys=(await response.json()).keys;const matches=keys.filter(k=>k.kid===h.kid&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig');if(matches.length!==1)throw Error();
 const key=await crypto.subtle.importKey('jwk',matches[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw Error();return c.sub;
}
export function googleConfigured(url,env){return !!(env?.WORKSPACE_DB&&env.MEDUSA_WORKSPACE_ENABLED==='true'&&env.MEDUSA_GOOGLE_ENABLED==='true'&&url.protocol==='https:'&&env.MEDUSA_PUBLIC_ORIGIN===url.origin&&env.GOOGLE_CUSTOMER_CLIENT_ID&&env.GOOGLE_CUSTOMER_CLIENT_SECRET&&env.GOOGLE_CUSTOMER_CLIENT_ID!==env.GOOGLE_FOUNDER_CLIENT_ID)}
export async function auth(request,env,network=fetch){
 const url=new URL(request.url),path=url.pathname,db=env?.WORKSPACE_DB,client=env?.GOOGLE_CUSTOMER_CLIENT_ID,secret=env?.GOOGLE_CUSTOMER_CLIENT_SECRET;
 if(!googleConfigured(url,env))return json('AUTH_NOT_CONFIGURED',503);
 const callback=url.origin+'/auth/google/callback';
 try{
 if(path==='/auth/customer/logout'){
  if(request.method!=='POST')return json('METHOD_NOT_ALLOWED',405);if(request.headers.get('origin')!==url.origin)return json('ORIGIN_REQUIRED',403);
  const token=cookie(request,customerCookie);if(token)await db.prepare('UPDATE customer_sessions SET revoked=1 WHERE token_hash=?').bind(await hash(token)).run();
  return Response.json({signedOut:true},{headers:{...headers,'set-cookie':setCookie(customerCookie,'',0)}});
 }
 if(request.method!=='GET')return json('METHOD_NOT_ALLOWED',405);
 if(path==='/auth/google/start'){
  const state=random(),nonce=random(),verifier=random();await db.prepare('DELETE FROM customer_oauth_transactions WHERE expires_at<=?').bind(Date.now()).run();
  await db.prepare('INSERT INTO customer_oauth_transactions VALUES (?,?,?,?)').bind(state,nonce,verifier,Date.now()+300000).run();
  const params=new URLSearchParams({client_id:client,redirect_uri:callback,response_type:'code',scope:'openid',state,nonce,code_challenge:b64(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))),code_challenge_method:'S256'});
  return redirect(issuer+'/o/oauth2/v2/auth?'+params,302,[setCookie(oauthCookie,state,300)]);
 }
 if(path!=='/auth/google/callback')return json('NOT_FOUND',404);
 const state=cookie(request,oauthCookie),code=url.searchParams.get('code');if(!state||url.searchParams.getAll('state').length!==1||url.searchParams.get('state')!==state||url.searchParams.getAll('code').length!==1||!code||code.length>4096||url.searchParams.has('error')||(url.searchParams.has('iss')&&url.searchParams.get('iss')!==issuer))return json('INVALID_CALLBACK',400);
 const tx=await db.prepare('DELETE FROM customer_oauth_transactions WHERE state=? AND expires_at>? RETURNING nonce,verifier').bind(state,Date.now()).first();if(!tx)return json('INVALID_CALLBACK',400);
 const response=await network('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:client,client_secret:secret,redirect_uri:callback,grant_type:'authorization_code',code_verifier:tx.verifier}).toString(),redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();
 const sub=await verify((await response.json()).id_token,tx.nonce,client,network);const token=random(),customerId=await hash(issuer+'\n'+sub);const old=cookie(request,customerCookie);if(old)await db.prepare('UPDATE customer_sessions SET revoked=1 WHERE token_hash=?').bind(await hash(old)).run();
 await db.prepare('INSERT INTO customer_sessions(token_hash,customer_id,role,expires_at,revoked) VALUES (?,?,?,?,0)').bind(await hash(token),customerId,'customer',Date.now()+28800000).run();
 return redirect('/brand#workspace',303,[setCookie(customerCookie,token,28800),setCookie(oauthCookie,'',0)]);
 }catch{return json('SIGN_IN_NOT_CONFIRMED',400)}
}
