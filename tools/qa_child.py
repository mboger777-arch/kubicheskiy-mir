# Детская QA: сохранение/перезагрузка, уход посреди задания (домой/пешком), спам касаний, замуровать себя и выкопаться,
# копать станции заданий, возврат в пройденные зоны, кнопки (качество, хотбар, вид), голос без наложений, fps на «быстрой».
import asyncio,os,time,math,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
W,H=[int(v) for v in os.environ.get('VP','844x390').split('x')]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']
F=[];R={}
INIT="""(()=>{const A=window.Audio;window.__VO={max:0,cur:new Set(),n:0,files:[]};window.Audio=function(s){const a=new A(s);
 if(s&&s.includes('voice/')){__VO.files.push(s);a.addEventListener('playing',()=>{__VO.cur.add(a);__VO.n++;__VO.max=Math.max(__VO.max,[...__VO.cur].filter(x=>!x.paused&&!x.ended).length)});
 const off=()=>__VO.cur.delete(a);a.addEventListener('pause',off);a.addEventListener('ended',off)}return a};window.Audio.prototype=A.prototype})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL);ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2)
    await ctx.add_init_script(INIT);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));cdp=await ctx.new_cdp_session(pg)
    E=pg.evaluate
    async def boot(clear=False):
      if clear:await pg.goto(URL);await E('localStorage.clear()')
      await pg.goto(URL);await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000)
    async def touch(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart' if pts else 'touchEnd','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    async def tmove(pts):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    async def bxy(i):
      bs=[x for x in await E('G.btns()') if x['id']==i and not x['dis']]
      return await E(f"G.pg({bs[0]['x']},{bs[0]['y']})") if bs else None
    async def btn(i,w=220,need=True):
      q=await bxy(i)
      if not q:
        if need:F.append(f'no button {i} have {[x["id"] for x in await E("G.btns()")]}')
        return False
      await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(w);return True
    async def hold(i,ms):
      q=await bxy(i)
      if not q:F.append(f'no hold {i}');return
      await touch([(q['x'],q['y'])]);await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(100)
    async def aim(x,y,z):
      q=await E(f'G.blockXY({x},{y},{z})')
      if not q or not q.get('vis'):return False
      await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(150);a=await E('G.aim()')
      return bool(a) and (a['x'],a['y'],a['z'])==(x,y,z)
    async def look_at(x,z,pitch=-.35):
      pl=await E('G.P()');await E(f"G.look({math.atan2(x-pl['x'],z-pl['z'])},{pitch})");await pg.wait_for_timeout(300)
    async def walk(ms,dx=0,dy=-90):
      x0,y0=W*.16,H*.72;await touch([(x0,y0)]);await pg.wait_for_timeout(50)
      for k in range(1,5):await tmove([(x0+dx*k/4,y0+dy*k/4)]);await pg.wait_for_timeout(20)
      await pg.wait_for_timeout(ms);await touch([]);await pg.wait_for_timeout(150)
    async def answer(maxr=12):
      for k in range(maxr):
        t=await E('G.task()')
        if not t:return True
        for i in await E('G.ans(true)'):await btn(i,200,False)
        t0=time.time()
        while time.time()-t0<9:
          t2=await E('G.task()')
          if not t2 or t2['r']!=t['r']:break
          await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(300)
      return not await E('G.task()')
    async def sane(tag):
      s=await E("(()=>{const p=PL.p;return{inb:collides(p.x,p.y+.02,p.z,PL.hw,PL.h-.04),y:p.y,onG:PL.onG,lock:G.locked(),scene:G.scene,nan:!isFinite(p.x+p.y+p.z)}})()")
      if s['nan']:F.append(f'{tag}: NaN position')
      if s['inb']:F.append(f'{tag}: player inside block {s}')
      return s
    async def to_world(k,fast=True):
      await E(f"G.mute=true;G.fast={str(fast).lower()};G.zone({k})");await pg.wait_for_timeout(1200);await E("talk=null;skipTalk&&skipTalk()")
    async def joy_moves(tag):
      tb=await E('G.task()')
      if tb and await E(f"!!FOES[{json.dumps(tb['id'])}]"):R[f'foe in {tag}']=tb['id'];await answer();await pg.wait_for_timeout(800)
      p0=await E('G.P()');await walk(900);p1=await E('G.P()')
      if math.hypot(p1['x']-p0['x'],p1['z']-p0['z'])<.8:F.append(f'{tag}: joystick did not move player {p0["x"]:.1f},{p0["z"]:.1f}')
    ids={2:'river',3:'forge',4:'desert',5:'castle'}
    # 1 сохранение / перезагрузка
    await boot(True);await to_world(3)
    await E("G.tp(64.5,38.5)");await pg.wait_for_timeout(600);await E("G.look(Math.PI/2,-.5);SV.sel=3")
    pl=await E('G.P()');gy=int(math.floor(pl['y']+.01))-1;await aim(66,gy,38) or await aim(65,gy,38);await btn('place',300)
    await walk(600,60,-60);await pg.wait_for_timeout(1800);s0=await E('({z:SV.z,px:SV.px,placed:SV.placed.slice(),dia:SV.dia,inv:SV.inv})')
    await boot();s1=await E('({z:SV.z,px:SV.px,placed:SV.placed.slice(),dia:SV.dia,inv:SV.inv})')
    if json.dumps(s0,sort_keys=True)!=json.dumps(s1,sort_keys=True):F.append(f'save mismatch {s0} vs {s1}')
    await E('G.mute=true');await btn('play',1500)
    if await E('G.scene')!='world':F.append('resume: play did not go to world')
    pl=await E('G.P()')
    if s1['px'] and math.hypot(pl['x']-s1['px'][0],pl['z']-s1['px'][1])>1.5:F.append(f'resume pos {pl} vs {s1["px"]}')
    if s1['placed'] and await E(f"G.vget({s1['placed'][-1][0]},{s1['placed'][-1][1]},{s1['placed'][-1][2]})")==0:F.append('resume: placed block lost')
    await pg.wait_for_timeout(800);await sane('resume');R['save_reload']=f"placed {len(s1['placed'])} z {s1['z']}"
    # 2 уход посреди задания: «домой» и обратно, затем пешком
    for k,i in ids.items():
      await to_world(k);t=await E(f"G.open('{i}')")
      if not t:F.append(f'{i}: did not open');continue
      await pg.wait_for_timeout(1500)
      for kk in range(6):await pg.touchscreen.tap(W*.5,H*.4);await pg.wait_for_timeout(40)   # спам в мир
      await btn('back',600);tb=await E('G.task()')
      if tb and await E(f"!!FOES[{json.dumps(tb['id'])}]"):R[f'foe after back {i}']=tb['id'];await answer()
      elif tb:F.append(f'{i}: back did not close task')
      await btn('home',800)
      await E('G.mute=true');await btn('play',1500);await E("talk=null")
      t=await E('G.task()');s=await sane(f'{i} after home')
      if s['lock']:F.append(f'{i}: locked after home->play')
      if not t:await joy_moves(f'{i} after home')
      await E("G.close()");await pg.wait_for_timeout(300);t=await E(f"G.open('{i}')")
      # спам: все варианты по 3 раза подряд
      t=await E('G.task()');m0=t['mist'] if t else 0
      for rep in range(3):
        for bb in list(dict.fromkeys((await E('G.ans(false)'))+(await E('G.ans(true)')))):
          q=await bxy(bb)
          if q:await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(15)
      await pg.wait_for_timeout(500)
      z0=await E('SV.z');ok=await answer()
      if i=='castle':
        await pg.wait_for_timeout(1200)
        for q in await E('G.roof()'):await pg.touchscreen.tap(q['x'],q['y']);await pg.wait_for_timeout(200)
        t0=time.time()
        while time.time()-t0<12 and await E('G.scene')!='fin':await pg.wait_for_timeout(200)
        if await E('G.scene')!='fin':F.append(f'castle after spam: finale not reached {await E("G.task()")}')
      else:
        t0=time.time()
        while time.time()-t0<15 and await E('SV.z')==z0:
          if not await E('G.task()'):break
          await pg.wait_for_timeout(200)
        if i!='river' and await E('SV.z')<=z0:F.append(f'{i} after spam: not completed z={await E("SV.z")} task={await E("G.task()")}')
        if i=='river' and await E('SV.z')<=z0:
          # мост: нужно перейти
          await E("G.look(Math.PI/2,-.2)");await walk(5000);t0=time.time()
          while time.time()-t0<8 and await E('SV.z')<=z0:await pg.wait_for_timeout(200)
          if await E('SV.z')<=z0:F.append(f'river after spam: not completed {await E("G.P()")} {await E("G.task()")}')
      await sane(f'{i} after spam');R[f'leave+spam {i}']='done'
    # 3 уйти пешком посреди задания
    for k,i in ids.items():
      if i=='castle':continue
      await to_world(k);await E(f"G.open('{i}')");await pg.wait_for_timeout(1200)
      await walk(2500,0,90);t=await E('G.task()');s=await sane(f'{i} walk-off')
      if t and s['lock']:pass
      await E("G.close()");await pg.wait_for_timeout(400)
      if await E('G.locked()'):F.append(f'{i}: locked after close')
      await joy_moves(f'{i} walk-off');R[f'walkoff {i}']=f'task during walk: {bool(t)}'
    # 4 замуровать себя и выкопаться (настоящие кнопки)
    await to_world(3);await E("G.tp(20.5,36.5)");await pg.wait_for_timeout(500)
    pl=await E('G.P()');fx,fy,fz=20,int(math.floor(pl['y']+.01)),36
    await E(f"for(let x={fx-1};x<={fx+3};x++)for(let y={fy};y<={fy+3};y++)vset(x,y,{fz},0)")
    await E(f"for(const[a,c]of[[1,0],[-1,0],[0,1],[0,-1]])for(let y={fy};y<={fy+1};y++)vset({fx}+a,y,{fz}+c,B.cobble);vset({fx},{fy+2},{fz},B.cobble)")
    await pg.wait_for_timeout(400)
    p0=await E('G.P()');await walk(800);p1=await E('G.P()')
    if math.hypot(p1['x']-p0['x'],p1['z']-p0['z'])>.6:F.append(f'walled: walked through wall {p0}->{p1}')
    await E("G.look(Math.PI/2,-.1)");await pg.wait_for_timeout(300);dug=0
    for y in (fy+1,fy):
      for pit in (-.1,-.45,.2,-.7):
        await E(f"G.look(Math.PI/2,{pit})");await pg.wait_for_timeout(250)
        if await aim(fx+1,y,fz):await hold('dig',1600);break
      dug+=await E(f'G.vget({fx+1},{y},{fz})')==0
    if dug<2:F.append(f'walled: could dig only {dug}/2')
    await walk(1200);p2=await E('G.P()')
    if p2['x']<fx+1.55:F.append(f'walled: did not get out {p2}')
    await sane('walled');R['wall_in']=f'dug {dug} out x={p2["x"]:.1f}'
    # 5 копать станции заданий и вернуться
    for k,i in ids.items():
      await to_world(k);await E(f"G.close();G.tp(SPOTS.{i}[0]+4,SPOTS.{i}[1])");await pg.wait_for_timeout(400)
      sp=await E(f"SPOTS.{i}");await look_at(sp[0],sp[1],-.6);n=0
      for dx,dz in [(0,0),(1,0),(0,1),(-1,0)]:
        x,z=int(math.floor(sp[0]))+dx,int(math.floor(sp[1]))+dz
        top=await E(f"(()=>{{for(let y=30;y>0;y--)if(solidT(G.vget({x},y,{z})))return y;return 0}})()")
        if await aim(x,top,z):await hold('dig',1500);n+=1
      await E("G.close()");await pg.wait_for_timeout(300)
      await E(f"G.tp(SPOTS.{i}[0]+6,SPOTS.{i}[1])");await pg.wait_for_timeout(400);await E(f"G.tp(SPOTS.{i}[0],SPOTS.{i}[1])");t0=time.time();t=None
      while time.time()-t0<4 and not t:t=await E('G.task()');await pg.wait_for_timeout(150)
      if not t or t['id']!=i:F.append(f'{i}: station did not open after digging around it ({n} dug) {t} {await E("G.P()")}')
      await sane(f'{i} dug station');R[f'dig station {i}']=f'dug {n}, reopened {bool(t)}'
    # 6 вернуться в пройденные зоны
    await to_world(5)
    for x,z in [(30,40.5),(45,40.5),(61,40.5),(88,40.5),(116,40.5),(20,40.5)]:
      await E(f"G.tp({x},{z})");await pg.wait_for_timeout(900);t=await E('G.task()')
      if t and t['id'] in('mw','river','forge','desert'):F.append(f'revisit {x}: done task reopened {t}')
      if t:await answer()
      await sane(f'revisit {x}')
    R['revisit']='ok'
    # 7 хотбар / вид / отмена
    await to_world(3);bs=[x['id'] for x in await E('G.btns()')];R['world buttons']=bs
    hot=[i for i in bs if i.startswith('hot') or i.startswith('slot')]
    for h in hot:
      await btn(h,200);sel=await E('SV.sel')
    if hot and len(hot)>1:
      await btn(hot[0],200);a=await E('SV.sel');await btn(hot[1],200);b2=await E('SV.sel')
      if a==b2:F.append(f'hotbar did not change selection {a}')
    fp0=(await E('G.cam()'))['fp'];await btn('view',300);await btn('view',300)
    if (await E('G.cam()'))['fp']!=fp0:F.append('view toggle twice not back')
    for k in range(8):await btn('undo',60,False)
    await sane('undo spam')
    # 8 голос: без наложений при спаме пропуска
    await boot(True);await E('G.mute=false;G.fast=false');await btn('play',300)
    for k in range(25):await pg.touchscreen.tap(W*.5,H*.5);await pg.wait_for_timeout(120)
    await pg.wait_for_timeout(1500);await E("G.go('world')");await pg.wait_for_timeout(4000)
    for k in range(10):await pg.touchscreen.tap(W*.5,H*.3);await pg.wait_for_timeout(200)
    vo=await E('({max:__VO.max,n:__VO.n,files:__VO.files.length})');R['voice']=vo
    if vo['max']>1:F.append(f'voice overlap: {vo["max"]} at once')
    if vo['n']<2:F.append(f'voice did not play ({vo})')
    miss=await E("(async()=>{const bad=[];for(const k in VOICE){const r=await fetch('assets/voice/'+VOICE[k][0],{method:'HEAD'});if(!r.ok)bad.push(k)}return[Object.keys(VOICE).length,bad]})()")
    R['voice files']=miss[0]
    if miss[1]:F.append(f'voice files missing {miss[1]}')
    nolines=await E("Object.keys(LINES).filter(k=>!VOICE[k])");R['lines without voice']=nolines
    # 9 качество
    await boot();q0=await E('QHI');await btn('quality',300)
    try:await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000)
    except Exception:pass
    await pg.wait_for_timeout(1000);q1=await E('QHI')
    if q0==q1:F.append(f'quality toggle did not switch {q0}')
    if q1:await btn('quality',300);await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000)
    R['quality']=f'{q0}->{q1}'
    # 10 fps на быстрой графике, в ходьбе
    await to_world(3,False);await E("G.mute=true;talk=null;G.look(Math.PI/2,-.2)");await walk(4000);R['fps fast']=round(await E('G.fps()'),1);R['QHI']=await E('QHI')
    R['errors']=errs;F.extend(f'JS: {e}' for e in errs)
    await b.close()
  print(json.dumps(R,ensure_ascii=False,indent=0));print('FAILS',json.dumps(F,ensure_ascii=False,indent=0));print('PASS' if not F else 'FAIL')
asyncio.run(main())
