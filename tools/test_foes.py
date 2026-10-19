# Новые враги: каждый встречается в своей зоне «ногами» (подходит сам), ошибка → подсказка, ввод свободен ≤600 мс → исправление → враг исчезает.
import asyncio,os,time,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
VPS=[tuple(map(int,v.split('x'))) for v in os.environ.get('VPS','844x390').split(',')]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
# зона, подготовка, точка входа, куда идти
CASES=[('slime',1,"SV.f.tut=1",22.5,31),('tupik',1,"SV.mw=Math.max(SV.mw,2)",49.6,55),('drowned',3,"",73.2,79),('skeleton',4,"SV.z=3",112.6,118),('phantom',5,"SV.z=4",145.6,152)]
async def run(b,W,H,F,R):
  tag=f'{W}x{H}';ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2);pg=await ctx.new_page()
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  E=pg.evaluate
  await pg.goto(URL);await E('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=90000)
  await E("G.mute=true;SV.f.intro=1;G.go('world')");await pg.wait_for_timeout(1500)
  async def btn(i):
    for n in range(6):
      bs=await E('G.btns()');bb=[x for x in bs if x['id']==i]
      if bb:break
      await pg.wait_for_timeout(200)
    if not bb:F.append(f'{tag} no button {i} have {[x["id"] for x in bs]}');return
    q=await E(f"G.pg({bb[0]['x']},{bb[0]['y']})");await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(200)
  for k,z,prep,x0,x1 in CASES:
    await E(f"G.zone({z});G.close();DAY.night=false;{prep};talk=null;G.tp({x0},23.5)");await pg.wait_for_timeout(400)
    t0=time.time();t=None
    while time.time()-t0<25:
      t=await E('G.task()')
      if t:break
      p=await E('G.P()')
      if p['x']<x1:await E("G.look(Math.PI/2,-0.2)");await E(f"G.tp(Math.min({x1},G.P().x+.5),23.5,G.P().y)")
      await pg.wait_for_timeout(250)
    if not t or t['id']!=k:F.append(f'{tag} {k}: encounter did not open ({t}) ents={[e["k"] for e in await E("G.ents()")]}');continue
    small=await E("PUI.filter(b=>!b.dis).map(b=>({id:b.id,w:Math.max(b.w+12,56/S)*S,h:Math.max(b.h+12,56/S)*S})).filter(b=>b.w<56||b.h<56)")
    for s in small:F.append(f'{tag} {k}: button {s["id"]} small')
    await pg.wait_for_timeout(900)
    if W==844:await pg.screenshot(path=f'shots/foes/{k}.png')
    rounds=0;rlast=-1
    for r in range(4):
      t=await E('G.task()')
      if not t or t['id']!=k or (r>0 and t['r']==rlast):break
      rlast=t['r'];m0=t['mist'];r0=t['r']
      for i in await E('G.ans(false)'):await btn(i)
      t=await E('G.task()')
      if not t or t['mist']<=m0:F.append(f'{tag} {k} r{r0}: mistake not registered')
      ts=time.time()
      while await E('G.locked()') and time.time()-ts<3:await pg.wait_for_timeout(20)
      if (time.time()-ts)*1000>600:F.append(f'{tag} {k}: locked after mistake')
      if W==844 and r==0:await pg.wait_for_timeout(300);await pg.screenshot(path=f'shots/foes/{k}_mistake.png')
      for i in await E('G.ans(true)'):await btn(i)
      ts=time.time()
      while time.time()-ts<12:
        t=await E('G.task()')
        if not t or t['r']!=r0:break
        await pg.wait_for_timeout(80)
      if t and t['r']==r0:F.append(f'{tag} {k} r{r0}: correct not accepted');break
      rounds+=1
    gone=await E(f"!G.ents().some(e=>e.k==='{k}')");done=await E(f"!!SV.f.fo_{k}")
    if not gone or not done:F.append(f'{tag} {k}: not finished gone={gone} done={done}')
    R.append(f'{tag} {k}: {rounds} rounds, mistake→fix ok')
    if W==844:await pg.wait_for_timeout(600);await pg.screenshot(path=f'shots/foes/{k}_done.png')
  R.append(f'{tag} fps {await E("G.fps()"):.1f}')
  F.extend(f'{tag} JSERR {e}' for e in errs);await ctx.close()
async def main():
  F=[];R=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL)
    for W,H in VPS:await run(b,W,H,F,R)
    await b.close()
  print('\n'.join(R));print('FAILS',json.dumps(F,ensure_ascii=False,indent=0));print('PASS' if not F else 'FAIL')
asyncio.run(main())
