# Портрет → нарисованная подсказка «Поверни телефон» (3D не рисуется); ландшафт → оба холста на весь экран, без чёрных полос.
import asyncio,os
from playwright.async_api import async_playwright
from PIL import Image
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html');F=[]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);os.makedirs('shots/rot3d',exist_ok=True)
    for W,H in [(390,844),(844,390),(667,375),(932,430)]:
      ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True);pg=await ctx.new_page();await pg.goto(URL)
      await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000);await pg.wait_for_timeout(800)
      if H>W:
        r=await pg.evaluate("PORTRAIT()");await pg.screenshot(path=f'shots/rot3d/rotate_{W}x{H}.png')
        if not r:F.append('portrait not detected')
        await pg.set_viewport_size({'width':H,'height':W});await pg.wait_for_timeout(900)
        c=await pg.evaluate("[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return[r.left,r.top,r.width,r.height]})")
        for q in c:
          if abs(q[2]-H)>1 or abs(q[3]-W)>1:F.append(f'after rotate canvas {q} not full')
        await pg.screenshot(path=f'shots/rot3d/after_rotate.png')
      else:
        await pg.evaluate("G.mute=true;G.go('world')");await pg.wait_for_timeout(1500)
        c=await pg.evaluate("[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return[r.left,r.top,r.width,r.height]})")
        for q in c:
          if abs(q[2]-W)>1 or abs(q[3]-H)>1 or q[0]!=0 or q[1]!=0:F.append(f'{W}x{H} canvas {q} not full screen')
        await pg.screenshot(path='shots/rot3d/r.png');im=Image.open('shots/rot3d/r.png').convert('RGB')
        for x,y in [(2,2),(W-3,2),(2,H-3),(W-3,H-3),(W//2,2),(W//2,H-3),(2,H//2),(W-3,H//2)]:
          if sum(im.getpixel((x,y)))<15:F.append(f'{W}x{H} black pixel at edge {x},{y}')
      await ctx.close()
    await b.close()
  print(F);print('PASS' if not F else 'FAIL')
asyncio.run(main())
