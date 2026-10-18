# Живой сайт: 3D-версия грузится, нет ошибок JS и ответов 4xx/5xx.
import asyncio,sys
from playwright.async_api import async_playwright
URL='https://mboger777-arch.github.io/kubicheskiy-mir/'
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);ctx=await b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True);pg=await ctx.new_page()
    errs=[];bad=[];n=[0]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console '+m.text) if m.type=='error' else None)
    def resp(r):
      n[0]+=1
      if r.status>=400:bad.append(f'{r.status} {r.url}')
    pg.on('response',resp)
    await pg.goto(URL);await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=90000)
    info=await pg.evaluate('[window.V,!!window.THREE,THREE.REVISION,G.chunks&&G.chunks()]')
    await pg.evaluate("G.mute=true;SV.f.intro=1;G.go('world')");await pg.wait_for_timeout(3000)
    info.append(await pg.evaluate('[G.scene,G.tris(),G.fps()]'));await pg.screenshot(path='shots/live_3d.png')
    print('info',info,'responses',n[0]);print('errors',errs);print('bad',bad);print('PASS' if not errs and not bad else 'FAIL')
    await b.close()
asyncio.run(m())
