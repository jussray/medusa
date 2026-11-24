import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('compiled app includes the tested atmosphere module without changing the canon',async()=>{
 const read=p=>readFile(new URL(p,import.meta.url),'utf8');
 assert.equal(await read('public/app.js'),await read('app.js')+'\n'+await read('atmosphere.js'));
 assert.equal(await read('public/public-ui.js'),await read('public-ui.js')+'\n'+await read('atmosphere.js'));
 assert.equal((await read('public/index.html')).replace('<script src="/app.js" defer></script>',''),await read('canon/index.html'));
});
