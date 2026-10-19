# Кадры «было/стало»: мост (вопрос, ошибка-квадрат, готовый мост) и взмах кирки (3-е и 1-е лицо). python extra_shots.py <url> <suf>
import asyncio,sys
from playwright.async_api import async_playwright
URL=sys.argv[1];SUF=sys.argv[2];OUT='/workspace/kub-game/shots/approval/'
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);pg=await (await b.new_context(viewport={'width':1280,'height':640})).new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    E=pg.evaluate
    await pg.goto(URL);await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=90000)
    await E("G.mute=true;SV.f.intro=1;G.go('world')");await pg.wait_for_timeout(1500)
    async def S(n,hud=False):
      if not hud:await E("document.getElementById('c').style.opacity=0")
      await pg.wait_for_timeout(120);await pg.screenshot(path=f'{OUT}{n}_{SUF}.png');await E("document.getElementById('c').style.opacity=1")
    # мост
    await E("G.zone(2);G.close();talk=null;G.tp(62.5,23.5);G.open('river')");await pg.wait_for_timeout(2500);await E("talk=null");await S('bridge_q',True)
    await E("TD.river.pick(TASK,'sq')");await pg.wait_for_timeout(1700);await E("talk=null");await S('bridge_fold')
    await pg.wait_for_timeout(3500)
    for r in range(3):
      await E("TD.river.pick(TASK,G.ans(true)[0])");await pg.wait_for_timeout(1300 if r==0 else 300)
      if r==0:await E("talk=null");await S('bridge_build')
      await pg.wait_for_timeout(5000)
    await pg.wait_for_timeout(2500);await E("talk=null");await S('bridge_done')
    # кирка
    await E("G.close();G.zone(1);G.close();talk=null;G.tp(10.5,23.5);CAMS.fp=false;G.look(Math.PI/2+.5,-0.8)");await pg.wait_for_timeout(1200)
    await E("KEYS.dig=1");await pg.wait_for_timeout(int(sys.argv[3]) if len(sys.argv)>3 else 450);await S('swing3')
    await E("KEYS.dig=0;CAMS.fp=true;G.look(Math.PI/2,-0.5)");await pg.wait_for_timeout(800);await E("KEYS.dig=1");await pg.wait_for_timeout(int(sys.argv[3]) if len(sys.argv)>3 else 450);await S('swing1')
    await E("KEYS.dig=0");print('errors',errs);await b.close()
asyncio.run(main())
