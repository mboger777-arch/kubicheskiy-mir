# Рендер листов согласования: shots/approval/heroes_v2.png, enemies_v2.png, bloki_before_after.png
import asyncio,base64,io,sys
from PIL import Image,ImageDraw,ImageFont
from playwright.async_api import async_playwright
OUT='/workspace/kub-game/shots/approval/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pg=await b.new_page()
    pg.on('console',lambda m:print('console',m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto('http://127.0.0.1:18640/tools/art/sheet.html');await pg.wait_for_function('window.ready')
    async def rend(names,W,H,fn,**o):
      d=await pg.evaluate(f"sheet({names!r},{W},{H},{o!r})".replace("'",'"'));Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGB').save(OUT+fn);print(fn)
    await rend(['bloki','gran','pixel','krivo'],2400,1300,'heroes_v2.png',gap=10)
    await rend(['zombie','spider','slime','skeleton','drowned','tupik','phantom'],3000,1100,'enemies_v2.png',gap=9)
    await rend(['old:bloki','bloki'],1600,1300,'bloki_before_after.png',gap=12)
    await rend(['old:bloki','old:gran','old:pixel','old:krivo'],2400,1300,'heroes_v1.png',gap=10)
    await b.close()
  im=Image.open(OUT+'bloki_before_after.png');d=ImageDraw.Draw(im);
  try:fnt=ImageFont.truetype('/workspace/kub-game/fonts/'+[f for f in __import__('os').listdir('/workspace/kub-game/fonts') if f.endswith('.ttf')][0],64)
  except Exception:fnt=ImageFont.load_default()
  d.text((im.width*.25,40),'было',fill=(60,60,80),font=fnt,anchor='mt');d.text((im.width*.75,40),'стало',fill=(60,60,80),font=fnt,anchor='mt');im.save(OUT+'bloki_before_after.png')
asyncio.run(main())
