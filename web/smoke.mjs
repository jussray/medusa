import {pathToFileURL} from 'node:url';
export const paths=['/brand','/sitemap.xml','/robots.txt','/llms.txt','/crawlers.json','/api/status','/app','/app.js','/api/integrity'];
export async function audit(origin,fetcher=fetch){
 const base=new URL(origin);if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('HTTPS origin required');
 const checks=await Promise.all(paths.map(async path=>{try{
  const r=await fetcher(base.origin+path,{redirect:'manual',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000),...(path==='/api/integrity'?{method:'POST',headers:{'content-type':'application/json',origin:base.origin},body:'{}'}:{})});
  const h=r.headers;const noindex=/noindex/i.test(h.get('x-robots-tag')??'');let ok=false;
  if(path==='/app')ok=r.status===302&&h.get('location')==='/auth/sign-in'&&noindex;
  else if(path==='/app.js'||path==='/api/integrity')ok=r.status===401&&noindex;
  else if(r.status===200){const body=await r.text();
   if(path==='/brand')ok=/<h1\b/i.test(body)&&body.includes('/public-ui.js')&&body.includes(base.origin+'/brand')&&!/<form\b|id="(?:source|expected|quote|auditResult|sample)"|src="\/app\.js"/i.test(body);
   else if(path==='/sitemap.xml')ok=body.includes(base.origin+'/brand</loc>')&&!/\/auth\/|\/api\/|\/app[</]/.test(body);
   else if(path==='/robots.txt')ok=body.includes('Disallow: /app')&&body.includes('Sitemap: '+base.origin+'/sitemap.xml');
   else if(path==='/llms.txt')ok=body.startsWith('# Medusa');
   else if(path==='/crawlers.json')ok=typeof JSON.parse(body).policy==='string';
   else if(path==='/api/status'){const b=JSON.parse(body);ok=b.integrity===false&&b.customerAuth===false&&b.operationalActions===false;}
  }
  return {path,status:r.status,ok};
 }catch{return {path,status:null,ok:false}}}));
 return {ok:checks.every(c=>c.ok),checks};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=await audit(process.argv[2]??'');console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
