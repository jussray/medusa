import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const origin='https://medusa.example.invalid';
const source='Fictional evidence for a review of an invented project.';
const sha=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source))).toString('hex');
const fixture={source,expected:sha,quote:'a review of an invented project',consent:true};
const call=(path,options={})=>worker.fetch(new Request(origin+path,options),{ASSETS:{fetch:async r=>new Response(new URL(r.url).pathname)}});
const post=(data,headers={})=>call('/api/integrity',{method:'POST',headers:{'content-type':'application/json',origin,...headers},body:JSON.stringify(data)});
test('brand serves the canonical build; private paths fail closed',async()=>{
 const r=await call('/brand');assert.equal(await r.text(),'/index.html');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal((await call('/founder')).status,404);
});
test('valid digest and quotation return a metadata-only advisory receipt',async()=>{
 const r=await post(fixture);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const b=await r.json();assert.equal(b.status,'MATCH');assert.equal(b.sha256,sha);assert.equal(b.authority,'NONE');assert.equal(b.independentTruthVerified,false);assert.equal(JSON.stringify(b).includes(source),false);
});
test('mismatched quotation and digest are not verified',async()=>{
 const r=await post({...fixture,expected:'0'.repeat(64),quote:'different fictional quote'});const b=await r.json();assert.equal(b.status,'MISMATCH');assert.equal(b.hashMatch,false);assert.equal(b.quoteMatch,false);
});
test('consent, same origin and input bounds enforced',async()=>{
 for(const [body,headers,status] of [[{...fixture,consent:false},{},400],[fixture,{origin:'https://other.invalid'},403],[{...fixture,source:'é'.repeat(9000)},{},400],[{...fixture,source:'a'.repeat(50000)},{},413]])assert.equal((await post(body,headers)).status,status);
});
test('status does not imply authentication or AI activation',async()=>{
 const b=await (await call('/api/status')).json();assert.equal(b.customerAuth,false);assert.equal(b.aiRuntime,false);assert.equal(b.operationalActions,false);
});
test('build preserves every canonical byte and serves the actual compiled HTML',async()=>{
 const {readFile}=await import('node:fs/promises');const original=await readFile(new URL('canon/index.html',import.meta.url),'utf8');const compiled=await readFile(new URL('public/index.html',import.meta.url),'utf8');assert.equal(compiled.replace('<script src="/app.js" defer></script>',''),original);
 const r=await worker.fetch(new Request(origin+'/brand'),{ASSETS:{fetch:async()=>new Response(compiled,{headers:{'content-type':'text/html'}})}});assert.equal(await r.text(),compiled);assert.match(r.headers.get('content-security-policy'),/sha256-/);
});
