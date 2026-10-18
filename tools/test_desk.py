# Компьютер: WASD/стрелки идут, пробел прыгает, F — вид от первого лица, Z — отменить блок, цифры — выбор блока; паук в туннеле виден; стройка дома.
import asyncio,os,math
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html');F=[]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);ctx=await b.new_context(viewport={'width':1280,'height':720},has_touch=True);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000)
    E=pg.evaluate;await E("G.mute=true;SV.f.intro=1;G.go('world')");await pg.wait_for_timeout(1500);await E("talk=null;G.look(Math.PI/2,-.25)")
    p0=await E('G.P()');await pg.keyboard.down('w');await pg.wait_for_timeout(900);await pg.keyboard.up('w');p1=await E('G.P()')
    if p1['x']-p0['x']<1.5:F.append(f'W did not walk {p0["x"]}->{p1["x"]}')
    y0=(await E('G.P()'))['y'];await pg.keyboard.down(' ');await pg.wait_for_timeout(180);y1=(await E('G.P()'))['y'];await pg.keyboard.up(' ');await pg.wait_for_timeout(700)
    if y1-y0<.3:F.append('space did not jump')
    await pg.keyboard.press('f');await pg.wait_for_timeout(200)
    if not (await E('G.cam()'))['fp']:F.append('F did not toggle view')
    await pg.keyboard.press('f')
    # стройка дома: встаём у участка, ставим блоки касанием-прицелом и кнопкой
    await E("G.zone(3);G.close();talk=null;SV.inv[3]=20;SV.sel=3");await E("G.tp(85.5,27.2,13);G.look(0,-.55)");await pg.wait_for_timeout(800)
    n0=(await E('G.P()'))['placed']
    for x,z in [(84,30),(85,30),(86,30),(87,30),(84,30),(85,30),(86,30),(87,30)]:
      await E("G.look(0,-.55)");await pg.wait_for_timeout(120)
      top=await E(f"(()=>{{for(let y=20;y>0;y--)if(solidT(G.vget({x},y,{z})))return y;return 0}})()")
      q=await E(f'G.blockXY({x},{top},{z})');await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(120)
      a=await E('G.aim()');await E("G.tapId('place')");await pg.wait_for_timeout(150)
    n1=(await E('G.P()'))['placed']
    if n1-n0<4:F.append(f'house: placed only {n1-n0}')
    await E("G.look(-0.5,-.35)");await pg.wait_for_timeout(700);await pg.screenshot(path='shots/t3d/build_house.png')
    await pg.keyboard.press('z');await pg.wait_for_timeout(200)
    if (await E('G.P()'))['placed']!=n1-1:F.append('Z did not undo')
    # паук в туннеле ночью
    await E("G.zone(2);G.close();talk=null;G.tp(50.5,23.5,13);G.night('spider')");await pg.wait_for_timeout(1500);await pg.screenshot(path='shots/t3d/spider_tunnel.png')
    F.extend('JSERR '+e for e in errs);await b.close()
  print(F);print('PASS' if not F else 'FAIL')
asyncio.run(main())
