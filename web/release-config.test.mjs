import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseConfig} from './release-config.mjs';
const base='name = "medusa-public-review"\nmain = "worker.mjs"\ncompatibility_date = "2026-11-23"\nworkers_dev = false\npreview_urls = false\n\n[assets]\ndirectory = "./public"\nbinding = "ASSETS"\nrun_worker_first = true\nhtml_handling = "none"\n';
const id='00000000-0000-4000-8000-000000000001';
test('release binds only the named D1 and keeps activation switches off',()=>{
 const out=releaseConfig(base,id);assert.ok(out.startsWith(base));assert.match(out,/binding = "WORKSPACE_DB"/);assert.ok(out.includes(`database_id = "${id}"`));for(const flag of ['MEDUSA_WORKSPACE_ENABLED','MEDUSA_GOOGLE_ENABLED','MEDUSA_AI_ENABLED'])assert.ok(out.includes(`${flag} = "false"`));assert.match(out,/workers_dev = false/);assert.match(out,/preview_urls = false/);
});
test('reject missing, malformed and injected identifiers',()=>{for(const value of [undefined,'','invalid',id+'\n[vars]'])assert.throws(()=>releaseConfig(base,value));});
test('reject ambiguous or changed deployment configuration',()=>{for(const value of [base.replace('workers_dev = false','workers_dev = true'),base+'\n[vars]\nMEDUSA_AI_ENABLED = "true"\n',base.replace('medusa-public-review','other-worker'),base+'\n[[d1_databases]]\nbinding = "OTHER"\n'])assert.throws(()=>releaseConfig(value,id));});
