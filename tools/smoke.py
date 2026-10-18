# Быстрая проверка: ошибки JS, самотест, скриншоты сцен. python tools/smoke.py [scene ...]
import asyncio,sys,os
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':int(os.environ.get('W',1280)),'height':int(os.environ.get('H',720))});logs=[]
    pg.on('pageerror',lambda e:logs.append('ERR '+str(e)));pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
    await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(2500)
    print('selftest',await pg.evaluate('G.selftest()'),'scene',await pg.evaluate('G.scene'))
    os.makedirs('shots',exist_ok=True)
    for s in sys.argv[1:]:
      await pg.evaluate('G.fast=true;G.mute=true;'+s);await pg.wait_for_timeout(1300);fn='shots/smoke_%d.png'%sys.argv.index(s);await pg.screenshot(path=fn);print(fn,s)
    print(logs[:10]);await b.close()
asyncio.run(main())
