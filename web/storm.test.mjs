import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const script=await readFile(new URL('atmosphere.js',import.meta.url),'utf8');
function score(){return vm.runInNewContext(script+'\nmedusaStormScore',{document:{querySelector:()=>null}})}
test('glow precedes thunder on the same repeating score and stays smooth',()=>{
 const s=score(); assert.equal(s.period,24); assert.equal(s.lightAt,3); assert.equal(s.thunderAt,3.8);
 assert.equal(s.glow(0),0); assert.equal(s.glow(s.lightAt),0); assert.ok(s.glow(s.thunderAt)>.3); assert.equal(s.glow(12),0); assert.ok(Math.abs(s.glow(24+s.thunderAt)-s.glow(s.thunderAt))<1e-10);
 for(let t=0;t<48;t+=.02)assert.ok(Math.abs(s.glow(t+.02)-s.glow(t))<.04);
});
test('scheduler never catches up a missed strike or plays it twice',()=>{const s=score();assert.equal(s.next(0),3.8);assert.equal(s.next(3.9),27.8);assert.equal(s.next(27.9),51.8);assert.equal(s.next(24),27.8)});
test('thunder envelope has a quiet onset and tail and bounded rhythmic rumble',()=>{const s=score();assert.equal(s.envelope(0),0);assert.equal(s.envelope(5.6),0);assert.ok(s.envelope(.8)>.2);for(let t=0;t<5.6;t+=.01)assert.ok(s.envelope(t)>=0&&s.envelope(t)<=1)});
