# Предпросмотр мира для согласования: лес, шахта, замок (+деревня, пустыня). python world_shots.py <url> <суффикс>
import asyncio,sys
from playwright.async_api import async_playwright
URL=sys.argv[1];SUF=sys.argv[2];Q=sys.argv[3] if len(sys.argv)>3 else '';ONLY=sys.argv[4].split(',') if len(sys.argv)>4 else None
OUT='/workspace/kub-game/shots/approval/'
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
SH=[('forest',"G.zone(1);G.close();talk=null;G.tp(9.5,23.5);G.look(Math.PI/2+.35,-.12)"),
    ('mine',"G.zone(2);G.close();talk=null;G.tp(42.6,23.5,13);G.look(Math.PI/2,-.08)"),
    ('mine2',"G.zone(2);G.close();talk=null;G.tp(48.5,22.7,13);CAMS.fp=true;G.look(Math.PI/2-.42,-.12)"),
    ('village',"G.zone(3);G.close();talk=null;G.tp(80,23.5);G.look(Math.PI/2+.25,-.12)"),
    ('desert',"G.zone(4);G.close();talk=null;G.tp(117,23.5);G.look(Math.PI/2+.1,-.06)"),
    ('moat',"G.zone(5);G.close();talk=null;G.tp(136.5,21.5);G.look(Math.PI/2+.5,-.2)"),
    ('pyramid',"G.zone(4);G.close();talk=null;G.tp(122,17.5);G.look(Math.PI/2+.9,-.05)"),
    ('castle',"G.zone(5);G.close();talk=null;G.tp(149,23.5);G.look(Math.PI/2+.2,-.06)")]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);ctx=await b.new_context(viewport={'width':1280,'height':640},device_scale_factor=1);pg=await ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL+('?q='+Q if Q else ''));await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=90000)
    await pg.evaluate("G.mute=true;SV.f.intro=1;G.go('world');Object.keys(FOES).forEach(k=>SV.f['fo_'+k]=1)");await pg.wait_for_timeout(1500)
    for n,js in SH:
      if ONLY and n not in ONLY:continue
      await pg.evaluate("CAMS.fp=false");await pg.evaluate(js);await pg.wait_for_timeout(2500);await pg.evaluate("talk=null;document.getElementById('c').style.opacity=0");await pg.wait_for_timeout(600)
      await pg.screenshot(path=f'{OUT}world_{SUF}_{n}.png');await pg.evaluate("document.getElementById('c').style.opacity=1")
      print(n,await pg.evaluate('[G.fps(),G.tris()]'))
    print('errors',errs);await b.close()
asyncio.run(main())
