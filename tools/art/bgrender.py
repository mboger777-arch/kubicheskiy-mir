import asyncio,base64,sys
from playwright.async_api import async_playwright
Z=sys.argv[1:] or ['forest','mine','river','village','desert','castle']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pg=await b.new_page()
    pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto('http://127.0.0.1:18640/tools/art/voxel.html');await pg.wait_for_function('window.ready',timeout=60000)
    for z in Z:
      d=await pg.evaluate(f"bg('{z}',1600,900)");open(f'/workspace/kub-game/assets/bg_{z}.jpg','wb').write(base64.b64decode(d.split(',')[1]));print(z)
    await b.close()
asyncio.run(main())
