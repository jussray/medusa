import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIdentity } from './runtime.mjs';
const iss='https://accounts.google.com';
const founder={iss,aud:'private-client',sub:'owner-sub',email:'owner@example.invalid',email_verified:true};
const config={founderId:'owner',founderEmails:['owner@example.invalid'],founderLinks:[{iss,clientId:'private-client',sub:'owner-sub'}],clients:{founder:{[iss]:'private-client'},customer:{[iss]:'public-client'}}};
test('distinct lane clients cannot cross authentication lanes',()=>{
 assert.equal(resolveIdentity(founder,config,'founder').role,'founder');
 assert.equal(resolveIdentity(founder,config,'customer'),null);
 assert.equal(resolveIdentity({...founder,aud:'public-client'},config,'founder'),null);
 assert.equal(resolveIdentity({...founder,aud:'public-client'},config,'customer').role,'customer');
});
test('shared clients and incorrect authorized presenter fail closed',()=>{
 assert.equal(resolveIdentity(founder,{...config,clients:{founder:{[iss]:'private-client'},customer:{[iss]:'private-client'}}},'founder'),null);
 assert.equal(resolveIdentity({...founder,aud:['private-client','other'],azp:'other'},config,'founder'),null);
 assert.equal(resolveIdentity({...founder,aud:['private-client','other']},config,'founder'),null);
 assert.equal(resolveIdentity({...founder,azp:'other'},config,'founder'),null);
});
