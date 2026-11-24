import subprocess, pathlib, json, re
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).parent
server=subprocess.Popen(['node','browser-fixture.mjs'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
origin='https://medusa.example.invalid'
def call(path,method='GET',headers=None,body=None):
 server.stdin.write(json.dumps(dict(url=origin+path,method=method,headers=headers or {},body=body))+'\n');server.stdin.flush();return json.loads(server.stdout.readline())
try:
 script=(root/'public/public-ui.js').read_text()
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(1536,864),(1280,800),(768,1024),(390,844)]:
   c=b.new_context(viewport={'width':width,'height':height},reduced_motion='no-preference');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   for path in ['/brand','/overview','/evidence','/threats','/audit','/workspace','/faq','/auth/sign-in','/auth/sign-up','/access']:
    r=call(path);assert r['status']==200,(path,r['status']);h=r['body'];assert '<script src="/public-ui.js" defer></script>' in h
    # Local rendering of actual Worker output, with the external script inserted inline. No HTTP navigation.
    page.set_content(h.replace('<script src="/public-ui.js" defer></script>','<script>'+script+'</script>'),wait_until='load');page.wait_for_function("document.querySelector('#livingWater')?.dataset.motionState==='running'",timeout=4000)
    assert page.locator('form,#source,#expected,#quote,#sample,#auditResult,script[src="/app.js"]').count()==0,path
    assert page.locator('h1:visible').count()==1,(path,page.locator('h1:visible').count());assert page.locator('link[rel=canonical]').get_attribute('href')==origin+path
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,path,page.evaluate('document.documentElement.scrollWidth'))
    if path=='/brand':
     canvas=page.locator('#livingWater');a=canvas.evaluate('e=>e.toDataURL()');page.wait_for_timeout(200);assert canvas.evaluate('e=>e.toDataURL()')!=a
     page.locator('#soundToggle').click();page.wait_for_function("document.querySelector('#soundToggle').dataset.audioState==='running'",timeout=4000);page.locator('#soundToggle').click();page.screenshot(path=str(root/f'public-{width}.png'))
   assert not errors,errors
   print(f'PASS {width}: ten public pages, canonical metadata, no tool markup, no overflow, motion and sound activation (offline DOM)',flush=True);c.close()
  b.close()
 for path in ['/app.js','/index.html','/marketing.html','/founder']:assert call(path)['status'] in (401,404),path
 assert call('/api/integrity','POST',body='{}')['status']==401
 assert call('/app')['status']==302
 cookie={'cookie':'__Host-medusa_customer='+'a'*64}
 assert call('/app',headers=cookie)['status']==200 and call('/app.js',headers=cookie)['status']==200
 assert call('/app.js')['status']==401
 print('PASS Worker request fixtures: anonymous private API/HTML/bundle denial; authenticated fixture access; cookie removal denial',flush=True)
finally:
 server.terminate();server.wait()
