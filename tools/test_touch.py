# Настоящие касания (hasTouch, мобильная эмуляция) на 3 телефонах: ходьба (удержание), прыжок, копать/строить/исправить,
# все 5 зон от начала до конца: в каждом раунде нарочная ошибка -> ввод свободен <=600 мс -> исправление сразу; монстры; сундуки; финал.
# хит-зоны кнопок >= 56 css px; ошибки JS. VPS=844x390 LVS=... для выборочного запуска.
import asyncio,os,time,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
VPS=[(844,390),(667,375),(932,430)]
if os.environ.get('VPS'):VPS=[tuple(map(int,v.split('x'))) for v in os.environ['VPS'].split(',')]
async def run(b,W,H,F,R):
  tag=f'{W}x{H}';out=f'shots/touch/{tag}';os.makedirs(out,exist_ok=True)
  ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2)
  pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  cdp=await ctx.new_cdp_session(pg)
  await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(2500)
  await pg.evaluate('G.fast=true;G.mute=true')
  async def shot(n):
    if W==844:await pg.wait_for_timeout(120);await pg.screenshot(path=f'{out}/{n}.png')
  async def tapxy(x,y,wait=230):await pg.touchscreen.tap(x,y);await pg.wait_for_timeout(wait)
  async def bxy(i):
    bs=await pg.evaluate('G.btns()');bb=[x for x in bs if x['id']==i]
    if not bb:return None
    return await pg.evaluate(f"G.pg({bb[0]['x']},{bb[0]['y']})")
  async def btn(i,wait=230):
    q=await bxy(i)
    if not q:F.append(f'{tag} no button {i} (have {[x["id"] for x in await pg.evaluate("G.btns()")]})');return False
    await tapxy(q['x'],q['y'],wait);return True
  async def hold(i,ms):
    q=await bxy(i)
    if not q:F.append(f'{tag} no hold button {i}');return
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':q['x'],'y':q['y'],'id':7}]})
    await pg.wait_for_timeout(ms);await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await pg.wait_for_timeout(120)
  async def hitcheck(where):
    small=await pg.evaluate("PUI.filter(b=>!b.dis).map(b=>({id:b.id,w:Math.max(b.w+12,56/S)*S,h:Math.max(b.h+12,56/S)*S,vw:b.w*S,vh:b.h*S})).filter(b=>b.w<56||b.h<56)")
    for s in small:F.append(f'{tag} {where}: button {s["id"]} hit {s["w"]:.0f}x{s["h"]:.0f}css <56')
    vis=await pg.evaluate("PUI.filter(b=>!b.dis).map(b=>({id:b.id,x:OX+b.x*S,y:OY+b.y*S})).filter(b=>b.x<0||b.y<0||b.x>W||b.y>H)")
    for s in vis:F.append(f'{tag} {where}: button {s["id"]} off screen')
  async def unlock_ms():
    t=time.time()
    while await pg.evaluate('G.locked()'):
      await pg.wait_for_timeout(20)
      if time.time()-t>6:break
    return (time.time()-t)*1000
  async def task():return await pg.evaluate('G.task()')
  async def walk_to(xt,name,maxs=40):
    # бот-ребёнок: держит «вправо», упёрся — прыгает, не помогло — копает впереди
    t0=time.time();lastx=-1;stuck=0
    while time.time()-t0<maxs:
      if await task():return 'task'
      p=await pg.evaluate('G.P()')
      if p['x']>=xt:return 'ok'
      q=await bxy('right')
      if not q:F.append(f'{tag} walk {name}: no right btn {await pg.evaluate("G.btns().map(b=>b.id)")}');return 'nobtn'
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':q['x'],'y':q['y'],'id':7}]})
      await pg.wait_for_timeout(350);await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await pg.wait_for_timeout(60)
      p=await pg.evaluate('G.P()')
      if p['x']-lastx>0.3:lastx=p['x'];stuck=0;continue
      stuck+=1
      if stuck==1:
        q=await bxy('right');u=await bxy('up')
        if (not q or not u) and await task():return 'task'
        if not q or not u:F.append(f'{tag} walk {name}: buttons gone {await pg.evaluate("G.btns().map(b=>b.id)")} {await task()} {await pg.evaluate("G.scene")}');return 'nobtn'
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':q['x'],'y':q['y'],'id':7},{'x':u['x'],'y':u['y'],'id':8}]})
        await pg.wait_for_timeout(450);await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await pg.wait_for_timeout(200);continue
      c=int(p['x']+.34+.05);rf=int(p['y']-.01)
      dug=0
      await btn('dig',150)
      for r in (rf-1,rf):
        tt=await pg.evaluate(f'[G.tile({c},{r}),solid(G.tile({c},{r})),!!TT[G.tile({c},{r})].hard]')
        if tt[1]:
          if tt[2]:F.append(f'{tag} walk {name}: unbreakable wall at {c},{r} x={p["x"]:.2f}');return 'blocked'
          xy=await pg.evaluate(f'G.tileXY({c},{r})');await tapxy(xy['x'],xy['y'],450);dug+=1
      if not dug and stuck>3:F.append(f'{tag} walk {name}: stuck at x={p["x"]:.2f}');return 'stuck'
    F.append(f'{tag} walk {name}: timeout at {(await pg.evaluate("G.P()"))["x"]:.1f}');return 'timeout'
  async def play_task(name,rounds_expected=None,shotname=None):
    t=await task()
    if not t:F.append(f'{tag} {name}: task not open');return
    await hitcheck(name)
    if await pg.evaluate('G.locked()'):F.append(f'{tag} {name} locked during intro voice')
    n=0;rounds=0
    while n<12:
      n+=1;t=await task()
      if not t:break
      r0=t['r'];m0=t['mist']
      for i in await pg.evaluate('G.ans(false)'):await btn(i)
      await pg.wait_for_timeout(150);t2=await task()
      if not t2 or t2['mist']<=m0:F.append(f'{tag} {name} r{r0}: mistake not registered {t2}')
      ms=await unlock_ms()
      if ms>600:F.append(f'{tag} {name} r{r0}: input locked {ms:.0f}ms after mistake')
      if shotname and n==1:await shot(shotname+'_mistake')
      # исправление — сразу, без ожидания
      k=0
      while k<8:
        k+=1;t=await task()
        if not t or t['r']!=r0:break
        ids=await pg.evaluate('G.ans(true)')
        if not ids:break
        for i in ids:await btn(i,170)
        t0=time.time()
        while time.time()-t0<8:
          t=await task()
          if not t or t['r']!=r0 or not t['lock']:break
          await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(120)
      if shotname and n==1:await shot(shotname+'_fixed')
      t=await task()
      if t and t['r']==r0:F.append(f'{tag} {name} r{r0}: correct answer not accepted {t}');break
      rounds+=1
    R.append(f'{tag} {name}: {rounds} rounds')
    if rounds_expected and rounds!=rounds_expected:F.append(f'{tag} {name}: rounds {rounds}!={rounds_expected}')
  # ---- заставка -> знакомство -> мир (кнопки)
  await shot('title');await hitcheck('title');await pg.evaluate('G.fast=false');await btn('play',400)
  if await pg.evaluate('G.scene')!='intro':F.append(f'{tag} play did not open intro')
  await hitcheck('intro');await shot('intro');await pg.evaluate('G.fast=true');await btn('skip',800)
  if await pg.evaluate('G.scene')!='world':F.append(f'{tag} skip did not open world')
  await hitcheck('world');await shot('world')
  # ---- ходьба, прыжок, копать, ставить, исправить
  p0=await pg.evaluate('G.P()');await hold('right',700);p1=await pg.evaluate('G.P()')
  if p1['x']-p0['x']<1.5:F.append(f'{tag} hold right moved only {p1["x"]-p0["x"]:.2f}')
  await hold('left',350);p2=await pg.evaluate('G.P()')
  if p2['x']>=p1['x']:F.append(f'{tag} hold left did not move')
  q=await bxy('up');await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':q['x'],'y':q['y'],'id':8}]});await pg.wait_for_timeout(120)
  py=await pg.evaluate('G.P().y');await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  if py>p2['y']-.3:F.append(f'{tag} jump did not lift ({py} vs {p2["y"]})')
  await pg.wait_for_timeout(900)
  await pg.evaluate('G.tp(8.5);talk=null');await pg.wait_for_timeout(400)
  await btn('dig');c=9;xy=await pg.evaluate(f'G.tileXY({c},10)');await tapxy(xy['x'],xy['y'],600)
  if await pg.evaluate(f'G.tile({c},10)')!=0:F.append(f'{tag} dig: tile not removed')
  inv=(await pg.evaluate('G.P()'))['inv']
  if not inv.get('2'):F.append(f'{tag} dig: no dirt in bag {inv}')
  await shot('dig')
  far=await pg.evaluate('G.tileXY(14,10)');await tapxy(far['x'],far['y'],500)
  if await pg.evaluate('G.tile(14,10)')==0:F.append(f'{tag} dug a block out of reach')
  await btn('place');xy=await pg.evaluate(f'G.tileXY({c},9)');await tapxy(xy['x'],xy['y'],300)
  if await pg.evaluate(f'G.tile({c},9)')==0:F.append(f'{tag} place: block not placed')
  await shot('place')
  # исправить: выкопать поставленный блок обратно
  await btn('dig');await tapxy(xy['x'],xy['y'],600)
  if await pg.evaluate(f'G.tile({c},9)')!=0:F.append(f'{tag} undo placed block failed')
  R.append(f'{tag} walk/jump/dig/place/undo ok')
  # ---- 1. шахта: доходим ногами до первой стены
  await pg.evaluate('G.tp(9.5)');await walk_to(60,'to mine wall');t=await task()
  if not t or t['id']!='mw':F.append(f'{tag} walking to crystal wall did not open task ({t}, {await pg.evaluate("G.P()")})');await pg.evaluate("G.open('mw',0)")
  await play_task('mine wall1',1,'mine')
  for i in (1,2):
    await walk_to(60,f'to wall{i+1}');t=await task()
    if t and t['id']=='spider':
      R.append(f'{tag} first spider met on foot in cavern');await shot('spider_cave');await play_task('spider cave',None,'spider')
      await walk_to(60,f'to wall{i+1}');t=await task()
    if not t or t['id']!='mw':F.append(f'{tag} wall{i+1} not reached on foot {t}');await pg.evaluate(f"G.open('mw',{i})")
    await play_task(f'mine wall{i+1}',1)
  # алмазы: выкопать открытые стены
  await btn('dig')
  for wc in (29,40,50):
    await pg.evaluate(f'G.tp({wc-1}.5,13);talk=null');await pg.wait_for_timeout(300)
    for r in (10,11,12):
      xy=await pg.evaluate(f'G.tileXY({wc},{r})');await tapxy(xy['x'],xy['y'],420)
  await pg.wait_for_timeout(500);p=await pg.evaluate('G.P()')
  if p['z']<1 or p['dia']<6:F.append(f'{tag} mine not completed z={p["z"]} dia={p["dia"]}')
  await shot('mine_done')
  # ---- монстры
  await pg.evaluate("G.night('spider')");await pg.wait_for_timeout(500);await shot('spider');await play_task('spider',None,'spider')
  await pg.evaluate("G.night('zombie')");await pg.wait_for_timeout(900);await shot('zombie');await play_task('zombie',None,'zombie')
  # ---- 2. река (подходим ногами)
  await pg.evaluate('G.zone(2);DAY.night=false');await pg.wait_for_timeout(900);await pg.evaluate("talk=null;if(G.task())G.close();G.tp(62.6)");await pg.wait_for_timeout(300)
  await hold('right',700);t=await task()
  if not t or t['id']!='river':F.append(f'{tag} walking to river did not open task ({t})');await pg.evaluate("G.open('river')")
  await play_task('river',3,'river')
  if (await pg.evaluate('G.P()'))['z']<2:F.append(f'{tag} river not completed')
  await pg.evaluate('G.tp(64);talk=null');await hold('right',3200);p=await pg.evaluate('G.P()')
  if p['x']<75.5:F.append(f'{tag} could not walk across the bridge x={p["x"]:.1f}')
  await shot('bridge')
  # ---- 3. кузница + отмена правильной раскладки
  await pg.evaluate("G.zone(3);DAY.night=false");await pg.wait_for_timeout(900);await pg.evaluate("if(G.task())G.close();G.open('forge')");await pg.wait_for_timeout(300)
  ids=await pg.evaluate('G.ans(true)');await btn(ids[0]);await btn(ids[1]);await btn(ids[1])
  left=await pg.evaluate("TASK.items.filter(i=>!i.loc).length")
  if left!=3:F.append(f'{tag} forge: tapping chest did not take pick back (left {left})')
  await play_task('forge',2,'forge')
  if (await pg.evaluate('G.P()'))['z']<3:F.append(f'{tag} forge not completed')
  # ---- 4. пустыня
  await pg.evaluate("G.zone(4);DAY.night=false");await pg.wait_for_timeout(900);await pg.evaluate("if(G.task())G.close();G.open('desert')");await play_task('desert',3,'desert')
  if (await pg.evaluate('G.P()'))['z']<4:F.append(f'{tag} desert not completed')
  # ---- сундуки
  for i in range(4):
    await pg.evaluate(f"if(G.task())G.close();G.open('chest',{i})");await pg.wait_for_timeout(300);await play_task(f'chest{i+1}',1,'chest' if i==0 else None)
  # ---- 5. замок: 3 щита + крыша (ошибочный блок можно убрать)
  await pg.evaluate("G.zone(5);DAY.night=false");await pg.wait_for_timeout(900);await pg.evaluate("if(G.task())G.close();G.open('castle')");await pg.wait_for_timeout(300);await shot('castle')
  for k in range(3):
    t=await task()
    if not t:break
    m0=t['mist'];r0=t['r']
    for i in await pg.evaluate('G.ans(false)'):await btn(i)
    if (await task())['mist']<=m0:F.append(f'{tag} castle r{r0} mistake not registered')
    if await unlock_ms()>600:F.append(f'{tag} castle r{r0} locked after mistake')
    for i in await pg.evaluate('G.ans(true)'):await btn(i)
    t0=time.time()
    while time.time()-t0<8 and (await task())['r']==r0:await pg.wait_for_timeout(60)
    if (await task())['r']==r0:F.append(f'{tag} castle r{r0} not accepted')
  await pg.wait_for_timeout(300);await shot('roof_start')
  cells=await pg.evaluate('G.roof()')
  await tapxy(cells[0]['x'],cells[0]['y'],250);await tapxy(cells[0]['x'],cells[0]['y'],250)
  if await pg.evaluate('G.tile(178,5)')!=0:F.append(f'{tag} roof: second tap did not remove block')
  for q in cells[:-1]:await tapxy(q['x'],q['y'],200)
  await shot('roof_almost')
  await tapxy(cells[-1]['x'],cells[-1]['y'],200)
  t0=time.time()
  while time.time()-t0<10 and await pg.evaluate('G.scene')!='fin':await pg.wait_for_timeout(100)
  if await pg.evaluate('G.scene')!='fin':F.append(f'{tag} finale not reached after roof')
  await pg.wait_for_timeout(700);await shot('finale');await hitcheck('fin')
  await btn('world',700)
  if await pg.evaluate('G.scene')!='world':F.append(f'{tag} finale world button failed')
  await btn('home',700)
  if await pg.evaluate('G.scene')!='title':F.append(f'{tag} home button failed')
  # ---- проход пешком через деревню, пустыню и замок (после открытия ворот)
  await pg.evaluate("G.zone(5);DAY.night=false");await pg.wait_for_timeout(800);await pg.evaluate("if(G.task())G.close();G.tp(77);talk=null;STIN={castle:1}");await pg.wait_for_timeout(200)
  r=await walk_to(171,'village->castle',90);R.append(f'{tag} walk 77->171: {r}')
  # ---- старая корутина не трогает новое задание
  await pg.evaluate("G.zone(2);DAY.night=false");await pg.wait_for_timeout(800);await pg.evaluate("if(G.task())G.close();G.open('zombie')");await pg.wait_for_timeout(200)
  ids=await pg.evaluate('G.ans(false)');await btn(ids[0]);await pg.evaluate("G.close();G.open('desert')");await pg.wait_for_timeout(2200)
  t=await task()
  if not t or t['id']!='desert' or t['mist']!=0:F.append(f'{tag} stale coroutine leaked into new task {t}')
  F.extend(f'{tag} JSERR {e}' for e in errs);await ctx.close()
async def main():
  F=[];R=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for W,H in VPS:await run(b,W,H,F,R)
    await b.close()
  print('\n'.join(R));print('FAILS',json.dumps(F,ensure_ascii=False,indent=0));print('PASS' if not F else 'FAIL')
asyncio.run(main())
