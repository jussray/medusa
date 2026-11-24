import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIdentity, review } from './runtime.mjs';
const identity={iss:'https://accounts.google.com',aud:'google-app',sub:'fixture-owner',email:'owner@example.invalid',email_verified:true};
const config={founderId:'owner',founderEmails:['owner@example.invalid'],founderLinks:[{iss:identity.iss,clientId:identity.aud,sub:identity.sub}],clients:{founder:{'https://accounts.google.com':'google-app','https://auth.openai.com':'openai-app'},customer:{'https://accounts.google.com':'google-customer','https://auth.openai.com':'openai-customer'}}};
test('only pre-enrolled verified identity in private lane is founder',()=>{
 assert.equal(resolveIdentity(identity,config,'founder').role,'founder');
 assert.equal(resolveIdentity({...identity,aud:'google-customer'},config,'customer').role,'customer');
});
test('email alone, wrong client and unverified email cannot grant founder',()=>{
 for(const c of [{...identity,sub:'different'},{...identity,aud:'wrong'},{...identity,email_verified:false}]) assert.equal(resolveIdentity(c,config,'founder'),null);
});
test('linked OpenAI subject maps to same founder',()=>{
 const claims={...identity,iss:'https://auth.openai.com',aud:['openai-app'],sub:'openai-owner'};
 const cfg={...config,founderLinks:[...config.founderLinks,{iss:claims.iss,clientId:'openai-app',sub:claims.sub}]};
 assert.equal(resolveIdentity(claims,cfg,'founder').id,'owner');
});
test('runtime disabled by default and no provider calls',async()=>{
 let called=0;const f=async()=>{called++;throw Error('unexpected');};
 await assert.rejects(review({session:{id:'customer',role:'customer'},provider:'openai',evidence:'fictional',consent:true}, {}, f)); assert.equal(called,0);
});
test('explicit consent and tenant scope required before sending',async()=>{
 const env={MEDUSA_AI_ENABLED:'true',OPENAI_API_KEY:'fake',OPENAI_MODEL:'test-model'};
 const session={id:'customer',role:'customer',workspaceId:'a'};
 for(const opts of [{consent:false,workspaceId:'a'},{consent:true,workspaceId:'b'}]) await assert.rejects(review({session,provider:'openai',evidence:'fictional',...opts},env,()=>{throw Error('network forbidden');}));
});
test('provider adapters use fixed endpoints, no tools and advisory output',async()=>{
 const env={MEDUSA_AI_ENABLED:'true',OPENAI_API_KEY:'fake',OPENAI_MODEL:'test-model',ANTHROPIC_API_KEY:'fake',ANTHROPIC_MODEL:'test-model'};
 for(const provider of ['openai','anthropic']){
  const f=async(url,opts)=>{const b=JSON.parse(opts.body);assert.equal(url,provider==='openai'?'https://api.openai.com/v1/responses':'https://api.anthropic.com/v1/messages');assert.equal(b.tools,undefined);if(provider==='openai')assert.equal(b.store,false);return new Response(JSON.stringify(provider==='openai'?{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'review'}]}]}:{content:[{type:'text',text:'review'}]}),{status:200,headers:{'content-type':'application/json'}});};
  const r=await review({session:{id:'customer',role:'customer',workspaceId:'a'},provider,workspaceId:'a',evidence:'fictional',consent:true},env,f);assert.equal(r.authority,'NONE');assert.equal(r.status,'ADVISORY');assert.equal(r.text,'review');
 }
});
test('provider failure is not a successful review',async()=>{
 await assert.rejects(review({session:{id:'customer',role:'customer',workspaceId:'a'},provider:'openai',workspaceId:'a',evidence:'fictional',consent:true},{MEDUSA_AI_ENABLED:'true',OPENAI_API_KEY:'fake',OPENAI_MODEL:'test-model'},async()=>new Response('',{status:429})));
});
