# Рендер воксельных героев в assets/sprites (прозрачный фон, обрезка по альфе, ноги = низ картинки)
import asyncio,base64,io,os,sys
from PIL import Image
from playwright.async_api import async_playwright
OUT='/workspace/kub-game/assets/sprites/';NAMES=sys.argv[1:] or ['bloki','gran','pixel','krivo','zombie','spider']
YAW={'spider':24,'pixel':22}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pg=await b.new_page()
    pg.on('console',lambda m:print('console',m.text));pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto('http://127.0.0.1:18640/tools/art/voxel.html');await pg.wait_for_function('window.ready')
    for n in NAMES:
      W,H=(1100,800) if n=='spider' else (900,1100)
      d=await pg.evaluate(f"renderSprite('{n}',{YAW.get(n,16)},{W},{H})")
      im=Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGBA');bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
      im=im.crop(bb);s=560/im.height if n!='spider' else 420/im.height;im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
      im.save(OUT+n+'.png');print(n,im.size)
    await b.close()
asyncio.run(main())
