# python tools/shot.py out.png "js" waitms [w h]   (телефонная эмуляция при h<=500)
import asyncio,sys,os
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();w=int(sys.argv[4]) if len(sys.argv)>4 else 844;h=int(sys.argv[5]) if len(sys.argv)>5 else 390
    ctx=await b.new_context(viewport={'width':w,'height':h},is_mobile=h<=500,has_touch=h<=500,device_scale_factor=2 if h<=500 else 1)
    pg=await ctx.new_page();pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.wait_for_timeout(2200)
    for i,js in enumerate(sys.argv[2].split('||')):
      await pg.evaluate('G.fast=true;G.mute=true;'+js);await pg.wait_for_timeout(int(sys.argv[3]))
      out=sys.argv[1] if '||' not in sys.argv[2] else sys.argv[1].replace('.png',f'_{i}.png');await pg.screenshot(path=out);print(out)
    await b.close()
asyncio.run(main())
