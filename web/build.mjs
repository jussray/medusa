import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url);
const original=await readFile(new URL('canon/index.html',root),'utf8');
if(createHash('sha256').update(original).digest('hex')!=='e51d1e2ae2842e866ed660ce24f3fc24f7682ed0e6f58ff92e28db24d9ddc251')throw Error('Canon changed; review required');
if(original.split('</body>').length!==2)throw Error('Unexpected canonical markup');
await mkdir(new URL('public/',root),{recursive:true});
await writeFile(new URL('public/index.html',root),original.replace('</body>','<script src="/app.js" defer></script></body>'));
await copyFile(new URL('app.js',root),new URL('public/app.js',root));
