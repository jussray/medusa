import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const approvedBase='name = "medusa-public-review"\nmain = "worker.mjs"\ncompatibility_date = "2026-11-23"\nworkers_dev = false\npreview_urls = false\n\n[assets]\ndirectory = "./public"\nbinding = "ASSETS"\nrun_worker_first = true\nhtml_handling = "none"\n';
export function releaseConfig(base,id){
 if(base!==approvedBase)throw Error('Deployment base changed; review required');
 if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))throw Error('Valid MEDUSA_D1_DATABASE_ID required');
 return base+'\n[vars]\nMEDUSA_WORKSPACE_ENABLED = "false"\nMEDUSA_GOOGLE_ENABLED = "false"\nMEDUSA_AI_ENABLED = "false"\n\n[[d1_databases]]\nbinding = "WORKSPACE_DB"\ndatabase_name = "medusa-workspace"\ndatabase_id = "'+id+'"\n';
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=await readFile(new URL('wrangler.toml',import.meta.url),'utf8');
 const config=releaseConfig(base,process.env.MEDUSA_D1_DATABASE_ID);
 await writeFile(new URL('wrangler.release.toml',import.meta.url),config,{flag:'wx',mode:0o600});
 console.log('Release configuration prepared; activation and public URLs remain disabled.');
}
