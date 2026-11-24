import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from './worker.mjs';
const origin='https://medusa.example.invalid';
const source='Fictional evidence about an imaginary plan.';
const digest=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
const a='a'.repeat(64), b='b'.repeat(64), expired='c'.repeat(64), revoked='d'.repeat(64);
async function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec(readFileSync(new URL('./migrations/0001_workspace.sql',import.meta.url),'utf8'));
 for(const [token,owner,expiry,rev] of [[a,'alice',Date.now()+60000,0],[b,'bob',Date.now()+60000,0],[expired,'alice',0,0],[revoked,'alice',Date.now()+60000,1]])db.prepare('INSERT INTO customer_sessions VALUES (?,?,?,?,?)').run(await digest(token),owner,'customer',expiry,rev);
 const D1={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)??null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>db.prepare(sql).run(...args)}}}}};
 const env={MEDUSA_WORKSPACE_ENABLED:'true',WORKSPACE_DB:D1};
 const body={source,expected:await digest(source),quote:'an imaginary plan',consent:true,saveConsent:true};
 const call=(path,token,method='GET',data,extra={},configuration=env)=>worker.fetch(new Request(origin+path,{method,headers:{...(token?{cookie:'__Host-medusa_customer='+token}:{}),...(method==='POST'?{origin,'content-type':'application/json','x-medusa-save-consent':'yes'}:{}),...extra},...(data===undefined?{}:{body:JSON.stringify(data)})}),configuration);
 return {call,body,db,env};
}
test('workspace requires an active customer session and configured database',async t=>{
 const {call,env}=await fixture(t);for(const token of [undefined,expired,revoked,'e'.repeat(64)])assert.equal((await call('/api/workspace',token)).status,401);
 assert.equal((await call('/api/workspace',a,'GET',undefined,{},{})).status,503);
 assert.equal((await call('/api/workspace',a,'GET',undefined,{},env)).status,200);
});
test('server recomputes receipts and isolates customer records',async t=>{
 const {call,body,db}=await fixture(t);const saved=await call('/api/workspace/receipts',a,'POST',{...body,customer_id:'bob',status:'VERIFIED'});assert.equal(saved.status,201);
 const r=await saved.json();assert.equal(r.status,'MATCH');assert.equal(r.authority,'NONE');assert.equal(r.independentTruthVerified,false);
 const mine=await (await call('/api/workspace',a)).json();const theirs=await (await call('/api/workspace',b)).json();assert.equal(mine.receipts.length,1);assert.equal(theirs.receipts.length,0);assert.equal(mine.receipts[0].id,r.id);
 assert.equal(db.prepare('SELECT customer_id FROM customer_receipts').get().customer_id,'alice');assert.equal(JSON.stringify(mine).includes(source),false);
});
test('save needs separate consent, same origin, valid evidence and a real session',async t=>{
 const {call,body,db}=await fixture(t);for(const [token,data,headers,status] of [[a,{...body,saveConsent:false},{},400],[a,body,{origin:'https://other.invalid'},403],[a,{...body,expected:'invalid'},{},400],[undefined,body,{},401]])assert.equal((await call('/api/workspace/receipts',token,'POST',data,headers)).status,status);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM customer_receipts').get().n,0);
});
test('mismatch persisted as mismatch; founder route stays private',async t=>{
 const {call,body}=await fixture(t);const r=await (await call('/api/workspace/receipts',b,'POST',{...body,expected:'0'.repeat(64)})).json();assert.equal(r.status,'MISMATCH');assert.equal((await call('/founder',b)).status,404);
});
