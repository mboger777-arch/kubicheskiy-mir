# 3D-игра: настоящие касания (CDP) на 3 телефонах. Джойстик, взгляд, прыжок, копать (держать), ставить, отменить, вид от первого лица,
# все 5 зон (ошибка → ввод свободен ≤600 мс → сразу исправление), монстры ночью, сундуки, крыша, финал, кнопки ≥56 css px, ошибки JS, fps.
import asyncio,os,time,json,math
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
VPS=[(844,390),(667,375),(932,430)]
if os.environ.get('VPS'):VPS=[tuple(map(int,v.split('x'))) for v in os.environ['VPS'].split(',')]
FOES=('slime','tupik','drowned','skeleton','phantom')
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def run(b,W,H,F,R):
  tag=f'{W}x{H}';MET=set();out=f'shots/t3d/{tag}';os.makedirs(out,exist_ok=True)
  ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2)
  pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console '+m.text) if m.type=='error' else None)
  cdp=await ctx.new_cdp_session(pg)
  await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000);await pg.wait_for_timeout(1500)
  await pg.evaluate('G.mute=true')
  async def shot(n):
    if W==844:await pg.wait_for_timeout(150);await pg.screenshot(path=f'{out}/{n}.png')
  async def E(js):return await pg.evaluate(js)
  async def tapxy(x,y,wait=230):await pg.touchscreen.tap(x,y);await pg.wait_for_timeout(wait)
  async def bxy(i):
    bs=await E('G.btns()');bb=[x for x in bs if x['id']==i]
    if not bb:return None
    return await E(f"G.pg({bb[0]['x']},{bb[0]['y']})")
  async def btn(i,wait=230):
    for k in range(3):
      q=await bxy(i)
      if q:break
      await pg.wait_for_timeout(200)
    if not q:F.append(f'{tag} no button {i} (have {[x["id"] for x in await E("G.btns()")]})');return False
    await tapxy(q['x'],q['y'],wait);return True
  async def touch(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart' if pts else 'touchEnd','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
  async def tmove(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
  async def hold(i,ms):
    q=await bxy(i)
    if not q:F.append(f'{tag} no hold button {i}');return
    await touch([(q['x'],q['y'])]);await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(100)
  async def joy(dx,dy,ms,extra=None):
    x0,y0=W*.16,H*.72;await touch([(x0,y0)]+([extra] if extra else []));await pg.wait_for_timeout(60)
    for k in range(1,5):await tmove([(x0+dx*k/4,y0+dy*k/4)]+([extra] if extra else []));await pg.wait_for_timeout(20)
    await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(80)
  async def hitcheck(where):
    small=await E("PUI.filter(b=>!b.dis).map(b=>({id:b.id,w:Math.max(b.w+12,56/S)*S,h:Math.max(b.h+12,56/S)*S})).filter(b=>b.w<56||b.h<56)")
    for s in small:F.append(f'{tag} {where}: button {s["id"]} hit {s["w"]:.0f}x{s["h"]:.0f}css <56')
    vis=await E("PUI.filter(b=>!b.dis).map(b=>({id:b.id,x:OX+b.x*S,y:OY+b.y*S})).filter(b=>b.x<0||b.y<0||b.x>W||b.y>H)")
    for s in vis:F.append(f'{tag} {where}: button {s["id"]} off screen')
  async def unlock_ms():
    t=time.time()
    while await E('G.locked()'):
      await pg.wait_for_timeout(20)
      if time.time()-t>6:break
    return (time.time()-t)*1000
  async def task():return await E('G.task()')
  async def play_task(name,rounds_expected=None,shotname=None):
    await pg.wait_for_timeout(300);t=await task()
    if not t:F.append(f'{tag} {name}: task not open');return
    await hitcheck(name)
    if await E('G.locked()'):F.append(f'{tag} {name} locked during intro voice')
    n=0;rounds=0
    while n<12:
      n+=1;t=await task()
      if not t:break
      r0=t['r'];m0=t['mist']
      for i in await E('G.ans(false)'):await btn(i)
      await pg.wait_for_timeout(150);t2=await task()
      if not t2 or t2['mist']<=m0:F.append(f'{tag} {name} r{r0}: mistake not registered {t2}')
      ms=await unlock_ms()
      if ms>600:F.append(f'{tag} {name} r{r0}: input locked {ms:.0f}ms after mistake')
      if shotname and n==1:await pg.wait_for_timeout(500);await shot(shotname+'_mistake')
      k=0
      while k<8:
        k+=1;t=await task()
        if not t or t['r']!=r0:break
        ids=await E('G.ans(true)')
        if not ids:break
        for i in ids:await btn(i,180)
        t0=time.time()
        while time.time()-t0<30:
          t=await task()
          if not t or t['r']!=r0 or not t['lock']:break
          await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(150)
      if shotname and n==1:await shot(shotname+'_fixed')
      t=await task()
      if t and t['r']==r0:F.append(f'{tag} {name} r{r0}: correct answer not accepted {t}');break
      rounds+=1
    R.append(f'{tag} {name}: {rounds} rounds')
    if rounds_expected and rounds!=rounds_expected:F.append(f'{tag} {name}: rounds {rounds}!={rounds_expected}')
  async def walk_to(xt,name,maxs=60,zt=23.5):
    # бот: камера вдоль +x, джойстик вперёд (с поправкой к тропе), упёрся — прыгает, не помогло — копает
    t0=time.time();lastx=-1;stuck=0
    while time.time()-t0<maxs:
      tt=await task()
      if tt and tt['id'] in FOES:
        R.append(f'{tag} met {tt["id"]} on foot (walk {name})');await shot('foe_'+tt['id']);await play_task('foe '+tt['id'],2,'foe_'+tt['id']);MET.add(tt['id']);t0=time.time();continue
      if tt and tt['id'] in ('zombie','spider') and name.startswith('across'):
        R.append(f'{tag} {tt["id"]} met on foot ({name})');await play_task(tt['id']+' on foot',None);t0=time.time();continue
      if tt:return 'task'
      p=await E('G.P()')
      if p['x']>=xt:return 'ok'
      side=max(-40,min(40,(zt-p['z'])*30))
      await E('G.look(Math.PI/2,-0.2)');await joy(side,-90,450)
      p=await E('G.P()')
      if p['x']-lastx>0.25:lastx=p['x'];stuck=0;continue
      stuck+=1
      if stuck==1:
        u=await bxy('jump')
        if u:await joy(0,-90,500,(u['x'],u['y']))
        continue
      tt=await task()
      if tt and tt['id'] not in FOES:return 'task'
      if tt:continue
      c=int(p['x']+.6);dug=0
      for y in (int(p['y']),int(p['y'])+1):
        for zz in (int(p['z']),):
          tt=await E(f'[G.vget({c},{y},{zz}),!!BT[G.vget({c},{y},{zz})].hard,solidT(G.vget({c},{y},{zz}))]')
          if tt[2]:
            if tt[1]:F.append(f'{tag} walk {name}: unbreakable at {c},{y},{zz} x={p["x"]:.2f}');return 'blocked'
            await dig_block(c,y,zz);dug+=1
      if not dug and stuck>3:F.append(f'{tag} walk {name}: stuck at {p}');return 'stuck'
    F.append(f'{tag} walk {name}: timeout at {(await E("G.P()"))["x"]:.1f}');return 'timeout'
  async def dig_block(x,y,z,ms=1400):
    q=await E(f'G.blockXY({x},{y},{z})');await tapxy(q['x'],q['y'],120)
    a=await E('G.aim()')
    if not a or (a['x'],a['y'],a['z'])!=(x,y,z):F.append(f'{tag} tap-to-aim missed {x},{y},{z} got {a}')
    await hold('dig',ms)
  # ---- заставка → знакомство → мир
  await shot('title');await hitcheck('title');await btn('play',600)
  if await E('G.scene')!='intro':F.append(f'{tag} play did not open intro')
  await pg.wait_for_timeout(1200);await hitcheck('intro');await shot('intro');await btn('skip',2500)
  if await E('G.scene')!='world':F.append(f'{tag} skip did not open world')
  await E('G.fast=true');await hitcheck('world');await pg.wait_for_timeout(800);await shot('world_third')
  fps=await E('G.fps()');R.append(f'{tag} fps(headless swiftshader) {fps:.1f}')
  # ---- джойстик, взгляд, прыжок
  await E('G.look(Math.PI/2,-0.22)');p0=await E('G.P()');await joy(0,-90,900);p1=await E('G.P()')
  if math.hypot(p1['x']-p0['x'],p1['z']-p0['z'])<1.5:F.append(f'{tag} joystick moved only {p1["x"]-p0["x"]:.2f}')
  if p1['x']-p0['x']<1:F.append(f'{tag} joystick forward did not go along camera (+x) {p0}->{p1}')
  c0=await E('G.cam().yaw');await touch([(W*.75,H*.45)]);await pg.wait_for_timeout(40)
  for k in range(1,6):await tmove([(W*.75-k*24,H*.45)]);await pg.wait_for_timeout(25)
  await touch([]);c1=await E('G.cam().yaw')
  if abs(c1-c0)<.3:F.append(f'{tag} look drag did not turn camera {c0}->{c1}')
  await E('G.look(Math.PI/2,-0.22)')
  y0=(await E('G.P()'))['y'];q=await bxy('jump');await touch([(q['x'],q['y'])]);y1=y0
  for k in range(8):
    await pg.wait_for_timeout(50);y1=max(y1,(await E('G.P()'))['y'])
  await touch([]);await pg.wait_for_timeout(700)
  if y1-y0<.3:F.append(f'{tag} jump did not lift {y0}->{y1}')
  # ---- копать (держать), ставить, отменить
  await E('G.tp(10.5,23.5);talk=null');await E('G.look(Math.PI/2,-0.5)');await pg.wait_for_timeout(1000)
  gy=int((await E('G.P()'))['y'])-1;await dig_block(12,gy,23)
  if await E(f'G.vget(12,{gy},23)')!=0:F.append(f'{tag} dig: block not removed')
  inv=(await E('G.P()'))['inv']
  if sum(inv.values())<1:F.append(f'{tag} dig: bag empty {inv}')
  await shot('dig')
  await E('G.look(Math.PI/2,-0.5)');q=await E(f'G.blockXY(13,{gy},23)');await tapxy(q['x'],q['y'],150)
  a=await E('G.aim()');n0=(await E('G.P()'))['placed'];await btn('place',300);n1=(await E('G.P()'))['placed']
  if n1!=n0+1:F.append(f'{tag} place failed aim={a}')
  else:
    tx,ty,tz=a['x']+a['n'][0],a['y']+a['n'][1],a['z']+a['n'][2]
    if await E(f'G.vget({tx},{ty},{tz})')==0:F.append(f'{tag} placed block missing')
    await shot('place');await btn('undo',300)
    if await E(f'G.vget({tx},{ty},{tz})')!=0:F.append(f'{tag} undo did not remove block')
  far=await E('G.blockXY(30,12,23)')
  await btn('view',400)
  if not (await E('G.cam()'))['fp']:F.append(f'{tag} view toggle failed')
  await E('G.look(Math.PI/2,-0.3)');await pg.wait_for_timeout(400);await shot('first_person');await btn('view',300)
  R.append(f'{tag} joystick/look/jump/dig/place/undo/view done')
  # ---- 1. шахта: пешком от леса до кристальных стен
  await E('G.tp(25.5,23.5);talk=null');r=await walk_to(60,'to wall1');t=await task()
  if not t or t['id']!='mw':F.append(f'{tag} wall1 not reached on foot {t} {await E("G.P()")}');await E("G.open('mw',0)")
  await play_task('mine wall1',1,'mine')
  for i in (1,2):
    await walk_to(60,f'to wall{i+1}');t=await task()
    if t and t['id']=='spider':
      R.append(f'{tag} spider met on foot in cave');await shot('spider_cave');await play_task('spider cave',None,'spider')
      await walk_to(60,f'to wall{i+1}');t=await task()
    if not t or t['id']!='mw':F.append(f'{tag} wall{i+1} not reached {t} {await E("G.P()")}');await E(f"G.open('mw',{i})")
    await play_task(f'mine wall{i+1}',1)
  # алмазы из стен
  for wx in (40,48,56):
    await E(f'G.tp({wx-1.6},23.5,13);talk=null');await E('G.look(Math.PI/2,-0.25)');await pg.wait_for_timeout(500)
    t=await task()
    if t:await play_task('cave '+t['id'],None);await E(f'G.tp({wx-1.6},23.5,13);talk=null');await E('G.look(Math.PI/2,-0.25)');await pg.wait_for_timeout(500)
    if await E(f'G.vget({wx},13,23)')==5:await dig_block(wx,13,23,1700)
  p=await E('G.P()')
  if p['dia']<3 or p['z_']<1:F.append(f'{tag} mine: dia={p["dia"]} z={p["z_"]}')
  await shot('mine_done')
  # ---- монстры ночью: сами приходят
  await E("G.zone(2);G.close();DAY.night=true;DAY.t=5;DAY.spawn=0.1;SV.f.zb1=1");await pg.wait_for_timeout(500);await E('G.tp(58.5,23.5,13);talk=null')
  t0=time.time()
  while time.time()-t0<25 and not await task():await pg.wait_for_timeout(300)
  t=await task()
  if not t or t['id'] not in('spider','zombie'):F.append(f'{tag} night monster did not come {t} {await E("G.ents()")}')
  else:await shot('night_monster');await play_task('night '+t['id'],None,'night_'+t['id'])
  await E("G.close();G.night('zombie')");await pg.wait_for_timeout(1200);await shot('zombie');await play_task('zombie',None,'zombie')
  await E("G.night('spider')");await pg.wait_for_timeout(800);await play_task('spider',None)
  await E('G.day()')
  # ---- 2. река (подходим ногами)
  await E('G.zone(2)');await pg.wait_for_timeout(800);await E("DAY.night=false;if(G.task())G.close();talk=null;G.tp(59.5,23.5)");await pg.wait_for_timeout(300)
  r=await walk_to(64.5,'to river',20);t=await task()
  if not t or t['id']!='river':F.append(f'{tag} river not opened on foot ({t}) {await E("G.P()")}');await E("G.close();G.open('river')")
  await play_task('river',3,'river')
  if (await E('G.P()'))['z_']<2:F.append(f'{tag} river not completed')
  await E('G.tp(64.2,23.5,13);talk=null');r=await walk_to(79,'across bridge',40)
  if (await E('G.P()'))['x']<75 and r!='ok':F.append(f'{tag} could not cross bridge {await E("G.P()")}')
  await E('G.look(Math.PI*1.25,-0.3)');await pg.wait_for_timeout(500);await shot('bridge')
  # ---- 3. кузница + забрать предмет обратно
  await E("G.zone(3)");await pg.wait_for_timeout(800);await E("if(G.task())G.close();talk=null;G.tp(89,25.5)");r=await walk_to(92.5,'to forge',20,zt=26.5);t=await task()
  if not t or t['id']!='forge':F.append(f'{tag} forge not opened on foot {t} {await E("G.P()")}');await E("G.close();G.open('forge')")
  await pg.wait_for_timeout(300);ids=await E('G.ans(true)');await btn(ids[0]);await btn(ids[1]);await btn(ids[1])
  if await E("TASK.items.filter(i=>!i.loc).length")!=3:F.append(f'{tag} forge: chest tap did not take item back')
  await play_task('forge',2,'forge')
  if (await E('G.P()'))['z_']<3:F.append(f'{tag} forge not completed')
  # ---- 4. пустыня
  await E("G.zone(4)");await pg.wait_for_timeout(800);await E("if(G.task())G.close();talk=null;G.tp(114.2,23.5)");r=await walk_to(119,'to desert',20);t=await task()
  if not t or t['id']!='desert':F.append(f'{tag} desert not opened on foot {t}');await E("G.close();G.open('desert')")
  await play_task('desert',3,'desert')
  if (await E('G.P()'))['z_']<4:F.append(f'{tag} desert not completed')
  # ---- сундуки
  for i in range(4):
    await E(f"if(G.task())G.close();G.open('chest',{i})");await play_task(f'chest{i+1}',1,'chest' if i==0 else None)
  # ---- 5. замок: 3 щита + крыша касаниями (ошибочный блок убрать)
  await E("G.zone(5)");await pg.wait_for_timeout(800);await E("if(G.task())G.close();talk=null;G.tp(147.2,23.5)");r=await walk_to(155,'to castle',20);t=await task()
  if not t or t['id']!='castle':F.append(f'{tag} castle not opened on foot {t}');await E("G.close();G.open('castle')")
  await pg.wait_for_timeout(500);await shot('castle')
  for k in range(3):
    t=await task();m0=t['mist'];r0=t['r']
    for i in await E('G.ans(false)'):await btn(i)
    if (await task())['mist']<=m0:F.append(f'{tag} castle r{r0} mistake not registered')
    if await unlock_ms()>600:F.append(f'{tag} castle r{r0} locked after mistake')
    if k==0:await shot('castle_mistake')
    for i in await E('G.ans(true)'):await btn(i)
    t0=time.time()
    while time.time()-t0<9 and (await task())['r']==r0:await pg.wait_for_timeout(60)
    if (await task())['r']==r0:F.append(f'{tag} castle r{r0} not accepted')
  await pg.wait_for_timeout(1500);await shot('roof_start')
  cells=await E('G.roof()');RC=await E('ROOF')
  async def roofn():return await E('ROOF.filter(([x,y,z])=>G.vget(x,y,z)===23).length')
  await tapxy(cells[0]['x'],cells[0]['y'],300)
  if await roofn()!=1:F.append(f'{tag} roof tap did not place ({await roofn()})')
  await tapxy(cells[0]['x'],cells[0]['y'],300)
  if await roofn()!=0:F.append(f'{tag} roof second tap did not remove')
  for q in cells[:-1]:await tapxy(q['x'],q['y'],220)
  await shot('roof_almost')
  if await roofn()!=len(cells)-1:F.append(f'{tag} roof cells placed {await roofn()} of {len(cells)-1}')
  await tapxy(cells[-1]['x'],cells[-1]['y'],200)
  t0=time.time()
  while time.time()-t0<12 and await E('G.scene')!='fin':await pg.wait_for_timeout(150)
  if await E('G.scene')!='fin':F.append(f'{tag} finale not reached (roof {await roofn()})')
  await pg.wait_for_timeout(1500);await shot('finale');await hitcheck('fin')
  await btn('world',1500)
  if await E('G.scene')!='world':F.append(f'{tag} finale world button failed')
  await btn('home',800)
  if await E('G.scene')!='title':F.append(f'{tag} home button failed')
  # ---- герои стоят на земле, масштаб одинаковый
  await E('G.zone(3)');await pg.wait_for_timeout(2500)
  for e in await E('G.ents()'):
    if e['hide']:continue
    if abs(e['y']-e['gnd'])>.06:F.append(f'{tag} {e["k"]} not on ground y={e["y"]:.2f} gnd={e["gnd"]}')
    if len(set(round(v,6) for v in e['sc']))!=1:F.append(f'{tag} {e["k"]} non-uniform scale {e["sc"]}')
  # ---- старая корутина не трогает новое задание
  await E("if(G.task())G.close();G.open('zombie')");await pg.wait_for_timeout(300);ids=await E('G.ans(false)');await btn(ids[0]);await E("G.close();G.open('desert')");await pg.wait_for_timeout(2300)
  t=await task()
  if not t or t['id']!='desert' or t['mist']!=0:F.append(f'{tag} stale coroutine leaked {t}')
  for k in FOES:
    if k not in MET:F.append(f'{tag} enemy {k} never met on foot')
  fps2=await E('G.fps()');R.append(f'{tag} fps end {fps2:.1f}')
  F.extend(f'{tag} JSERR {e}' for e in errs);await ctx.close()
async def main():
  F=[];R=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL+['--autoplay-policy=no-user-gesture-required'])
    for W,H in VPS:await run(b,W,H,F,R)
    await b.close()
  print('\n'.join(R));print('FAILS',json.dumps(F,ensure_ascii=False,indent=0));print('PASS' if not F else 'FAIL')
asyncio.run(main())
