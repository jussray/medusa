import test from 'node:test';
import assert from 'node:assert/strict';
import {audit, paths} from './smoke.mjs';
const origin='https://example.invalid';
const html='<h1>Medusa</h1><link rel="canonical" href="https://example.invalid/brand"><script src="/public-ui.js"></script>';
function fixture(change={}){return async url=>{const p=new URL(url).pathname;const base=p==='/brand'?{body:html}:p==='/sitemap.xml'?{body:'<urlset><loc>'+origin+'/brand</loc></urlset>'}:p==='/robots.txt'?{body:'User-agent: *\nDisallow: /app\nSitemap: '+origin+'/sitemap.xml'}:p==='/llms.txt'?{body:'# Medusa'}:p==='/crawlers.json'?{body:'{"policy":"public"}'}:p==='/api/status'?{body:'{"integrity":false,"customerAuth":false,"operationalActions":false}'}:p==='/app'?{status:302,headers:{location:'/auth/sign-in','x-robots-tag':'noindex'}}:{status:401,headers:{'x-robots-tag':'noindex'}};const r={...base,...change[p]};return new Response(r.body??null,{status:r.status??200,headers:r.headers})}}
test('all expected public and denied routes pass',async()=>{const r=await audit(origin,fixture());assert.equal(r.ok,true);assert.equal(r.checks.length,paths.length)});
test('reject publicly exposed tools, unexpected redirects and private bundle responses',async()=>{const r=await audit(origin,fixture({'/brand':{body:html+'<form id="form">'},'/app':{headers:{location:'https://other.invalid','x-robots-tag':'noindex'}},'/app.js':{status:200}}));assert.equal(r.ok,false);assert.equal(r.checks.filter(x=>!x.ok).length,3)});
test('network failure is not a passing observation',async()=>{const r=await audit(origin,async()=>{throw Error('offline')});assert.equal(r.ok,false);assert.ok(r.checks.every(x=>x.status===null))});
