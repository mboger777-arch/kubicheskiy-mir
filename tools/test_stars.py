# Звёзды в настоящей игре: сундуки выкапываем/достаём сами (кирка, лесенка из блоков), дом строим касаниями,
# замок проходим — в финале должно быть «Звёзды: 5 из 5». Касания настоящие (CDP), без открытия заданий напрямую.
import asyncio,os,time,math,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html');F=[];R=[]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
W,H=844,390
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2);pg=await ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));cdp=await ctx.new_cdp_session(pg)
    await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000)
    E=pg.evaluate
    async def touch(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart' if pts else 'touchEnd','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    async def tmove(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    async def bxy(i):
      bs=[x for x in await E('G.btns()') if x['id']==i]
      return await E(f"G.pg({bs[0]['x']},{bs[0]['y']})") if bs else None
    async def btn(i,w=220):
      q=await bxy(i)
      if not q:F.append(f'no button {i}');return
      await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(w)
    async def hold(i,ms):
      q=await bxy(i);await touch([(q['x'],q['y'])]);await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(100)
    async def aim(x,y,z):
      q=await E(f'G.blockXY({x},{y},{z})');await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(120);a=await E('G.aim()')
      return a and (a['x'],a['y'],a['z'])==(x,y,z)
    async def dig(x,y,z):
      for k in range(3):
        if await aim(x,y,z):break
      else:F.append(f'cannot aim {x},{y},{z} got {await E("G.aim()")}')
      await hold('dig',1500)
      if await E(f'G.vget({x},{y},{z})')!=0:F.append(f'dig failed {x},{y},{z}')
    async def look_at(x,z,pitch=-.35):
      pl=await E('G.P()');yaw=math.atan2(x-pl['x'],z-pl['z']);await E(f'G.look({yaw},{pitch})');await pg.wait_for_timeout(350)
    async def walk(ms):
      x0,y0=W*.16,H*.72;await touch([(x0,y0)]);await pg.wait_for_timeout(50)
      for k in range(1,5):await tmove([(x0,y0-90*k/4)]);await pg.wait_for_timeout(20)
      await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(100)
    async def answer():
      for k in range(10):
        t=await E('G.task()')
        if not t:return
        for i in await E('G.ans(true)'):await btn(i,200)
        t0=time.time()
        while time.time()-t0<8:
          t2=await E('G.task()')
          if not t2 or t2['r']!=t['r'] or not t2['lock']:break
          await pg.wait_for_timeout(80)
        await pg.wait_for_timeout(250)
    async def foe():
      t=await E('G.task()')
      if t and await E(f"!!FOES[{json.dumps(t['id'])}]"):
        print('met foe',t['id'],flush=True);await answer()
        t0=time.time()
        while time.time()-t0<8 and await E('G.task()'):await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(600);return True
      return False
    async def wait_task(sec=6):
      t0=time.time()
      while time.time()-t0<sec:
        t=await E('G.task()')
        if t:return t
        await pg.wait_for_timeout(150)
    async def surf(x,z):return await E(f"(()=>{{for(let y=30;y>0;y--)if(solidT(G.vget({x},y,{z})))return y;return 0}})()")
    async def dig_down(x,z,cy):
      top=await surf(x,z)
      for y in range(top,cy,-1):
        if await E(f'G.vget({x},{y},{z})')==0:continue
        await look_at(x+.5,z+.5,-1.1);await dig(x,y,z)
    async def stars():return await E('SV.st.reduce((a,b)=>a+b,0)+(SV.house?1:0)')
    await E("G.mute=true;G.fast=true;G.zone(5);G.close();talk=null;SV.inv[3]=40;SV.sel=3");await pg.wait_for_timeout(800);await btn('view',300)
    # сундук 3: песок над ним в пустыне
    await E("talk=null;G.tp(120.5,14.2)");await dig_down(120,12,11)
    t=await wait_task()
    if not t or t['id']!='chest':F.append(f'chest3 did not open {t}')
    else:await answer()
    R.append(f'after desert chest: stars {await stars()}');print(R[-1],flush=True)
    # сундук 4: кирпичный тайник в замке
    await E("talk=null;G.tp(150.5,37.6,13)");await look_at(150.5,39.5,-.55);await dig(150,13,39);await walk(300)
    t=await wait_task()
    if not t or t['id']!='chest':F.append(f'chest4 did not open {t} {await E("G.P()")}')
    else:await answer()
    R.append(f'after castle chest: stars {await stars()}');print(R[-1],flush=True)
    # сундук 1: под землёй в лесу — копаем шахту вниз
    await E("talk=null;G.tp(14.5,29.2)");await dig_down(14,31,9)
    await look_at(14.5,31.5,-.2);await walk(500)
    t=await wait_task()
    if not t or t['id']!='chest':F.append(f'chest1 did not open {t} {await E("G.P()")}')
    else:await answer()
    R.append(f'after forest chest: stars {await stars()}');print(R[-1],flush=True)
    # сундук 2: на столбе в деревне — лесенка из блоков (прыжок + поставить под себя)
    await E("talk=null;G.tp(104.5,37.5)");await pg.wait_for_timeout(400)
    for k in range(7):
      if await E('G.task()'):break
      pl=await E('G.P()');gy=int(math.floor(pl['y']+.01))-1
      await E("G.look(0,-1.45);SV.sel=3");await pg.wait_for_timeout(300)
      ok=await aim(104,gy,37)
      q=await bxy('jump');await touch([(q['x'],q['y'])]);await pg.wait_for_timeout(260)
      await E("G.tapId('place')");await touch([]);await pg.wait_for_timeout(700)
    t=await wait_task(4)
    if not t or t['id']!='chest':F.append(f'chest2 did not open {t} {await E("G.P()")}')
    else:await answer()
    R.append(f'after pillar chest: stars {await stars()} (y={(await E("G.P()"))["y"]})');print(R[-1],flush=True)
    # дом: 12 блоков на участке
    await E("talk=null;G.tp(85.5,33.5);SV.sel=3");await pg.wait_for_timeout(400)
    cells=[(83,31),(84,31),(85,31),(86,31),(87,31),(88,31),(83,35),(84,35),(85,35),(86,35),(87,35),(88,35),(83,33),(88,33),(83,32),(88,32),(83,34),(88,34),(84,33),(87,33)]
    for x,z in cells:
      if await E('SV.house'):break
      await foe()
      await look_at(x+.5,z+.5,-.75);top=await E(f"(()=>{{for(let y=20;y>0;y--)if(solidT(G.vget({x},y,{z})))return y;return 0}})()")
      ok=await aim(x,top,z)
      if not ok:
        q=await E(f'G.blockXY({x},{top},{z})');print('miss at',q,await E('G.aim()'),flush=True)
        await look_at(x+.5,z+.5,-1.05);ok=await aim(x,top,z)
      if ok:await btn('place',200)
      print('cell',x,z,top,ok,await E('SV.placed.length'),await E('JSON.stringify(G.task())'),flush=True)
    await pg.wait_for_timeout(500);await btn('view',300);await E("G.look(Math.PI*1.2,-.4)");await pg.wait_for_timeout(800);await pg.screenshot(path='shots/t3d/house_star.png')
    if not await E('SV.house'):F.append(f'house star not awarded (placed {await E("SV.placed.length")})')
    R.append(f'after house: stars {await stars()}');print(R[-1],flush=True)
    # замок: щиты и крыша
    await E("talk=null;G.tp(151,23.5,13)");await look_at(160,23.5,-.2);await walk(1600)
    t=await wait_task()
    for k in range(4):
      if not t or t['id']=='castle':break
      if await foe():await look_at(160,23.5,-.2);await walk(1600);t=await wait_task()
      else:break
    if not t or t['id']!='castle':F.append(f'castle did not open {t}')
    else:
      for k in range(3):
        r0=(await E('G.task()'))['r']
        for i in await E('G.ans(true)'):await btn(i)
        t0=time.time()
        while time.time()-t0<9 and (await E('G.task()'))['r']==r0:await pg.wait_for_timeout(80)
      await pg.wait_for_timeout(1500)
      for q in await E('G.roof()'):await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(220)
      t0=time.time()
      while time.time()-t0<12 and await E('G.scene')!='fin':await pg.wait_for_timeout(150)
    await pg.wait_for_timeout(1800);await pg.screenshot(path='shots/t3d/finale_stars.png')
    n=await stars();R.append(f'finale scene={await E("G.scene")} stars {n}/5')
    if await E('G.scene')!='fin':F.append('finale not reached')
    if n!=5:F.append(f'finale stars {n}/5')
    F.extend('JSERR '+e for e in errs);await b.close()
  print('\n'.join(R));print(F);print('PASS' if not F else 'FAIL')
asyncio.run(main())
