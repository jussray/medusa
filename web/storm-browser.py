import pathlib,subprocess,json,time
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).parent
server=subprocess.Popen(['node','browser-fixture.mjs'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
try:
 server.stdin.write(json.dumps(dict(url='https://medusa.example.invalid/brand',method='GET',headers={}))+'\n');server.stdin.flush();r=json.loads(server.stdout.readline());assert r['status']==200
 script=(root/'public/public-ui.js').read_text();html=r['body'].replace('<script src="/public-ui.js" defer></script>','<script>'+script+'</script>')
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(1536,864),(390,844)]:
   page=b.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   probe='''<script>window.stormStarts=[];window.stormStops=0;const proto=AudioBufferSourceNode.prototype,oldStart=proto.start,oldStop=proto.stop;proto.start=function(when,...rest){if(this.buffer&&Math.abs(this.buffer.duration-5.6)<.01)stormStarts.push({at:performance.now()+(when-this.context.currentTime)*1000});return oldStart.call(this,when,...rest)};proto.stop=function(...args){if(this.buffer&&Math.abs(this.buffer.duration-5.6)<.01)stormStops++;return oldStop.apply(this,args)};</script>'''
   page.set_content(html.replace('</head>',probe+'</head>'),wait_until='load');page.wait_for_function("document.querySelector('#livingWater')?.dataset.motionState==='running'")
   before=page.locator('header').evaluate('e=>({w:e.offsetWidth,h:e.offsetHeight,x:e.offsetLeft,y:e.offsetTop})');page.locator('#soundToggle').click();page.wait_for_function("document.querySelector('#soundToggle').dataset.audioState==='running'");page.wait_for_function('stormStarts.length===1',timeout=6500);page.wait_for_function("Number(document.querySelector('#livingWater').dataset.stormGlow)>.3",timeout=4000)
   timing=page.evaluate('({lead:stormStarts[0].at-performance.now(),glow:Number(document.querySelector("#livingWater").dataset.stormGlow)})');assert -600<timing['lead']<1200,timing
   assert page.locator('header').evaluate('e=>({w:e.offsetWidth,h:e.offsetHeight,x:e.offsetLeft,y:e.offsetTop})')==before;assert page.locator('form,#source,#auditResult').count()==0;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(root/f'storm-{width}.png'))
   page.locator('#soundToggle').click();assert page.evaluate('stormStops')==1;assert page.locator('#soundToggle').get_attribute('aria-pressed')=='false';page.emulate_media(reduced_motion='reduce');page.wait_for_function("document.querySelector('#livingWater').dataset.motionState==='paused'");assert page.locator('#livingWater').get_attribute('data-storm-glow')=='0';assert not errors,errors
   print('PASS',width,timing,'thunder scheduled, glow active, stop and reduced motion, no tools, layout stable',flush=True);page.close()
  b.close()
finally:server.terminate();server.wait()
