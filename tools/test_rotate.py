# Портрет → нарисованная подсказка «Поверни телефон»; ландшафт → холст на весь экран без чёрных полос.
import asyncio,os
from playwright.async_api import async_playwright
from PIL import Image
URL='http://127.0.0.1:18640/index.html';F=[]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for W,H in [(390,844),(844,390),(667,375),(932,430)]:
      ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True);pg=await ctx.new_page();await pg.goto(URL);await pg.wait_for_timeout(2500)
      if H>W:
        r=await pg.evaluate("[typeof portrait!=='undefined'?portrait:null, IM.rotate&&IM.rotate.complete]")
        await pg.screenshot(path=f'shots/rotate_{W}x{H}.png')
      else:
        await pg.evaluate("G.go('world')");await pg.wait_for_timeout(600)
        c=await pg.evaluate("(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return[c.left,c.top,c.width,c.height]})()")
        if abs(c[2]-W)>1 or abs(c[3]-H)>1 or c[0]!=0 or c[1]!=0:F.append(f'{W}x{H} canvas {c} not full screen')
        await pg.screenshot(path='/tmp/r.png');im=Image.open('/tmp/r.png').convert('RGB')
        for x,y in [(2,2),(W-3,2),(2,H-3),(W-3,H-3),(W//2,2),(W//2,H-3),(2,H//2),(W-3,H//2)]:
          if sum(im.getpixel((x,y)))<15:F.append(f'{W}x{H} black pixel at edge {x},{y}')
      await ctx.close()
    await b.close()
  print(F);print('PASS' if not F else 'FAIL')
asyncio.run(main())
