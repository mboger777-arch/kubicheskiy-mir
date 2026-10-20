# Физика 3D-мира: гравитация, прыжок, ступеньки, стены/потолок/углы, ямы, вода, лава, мост, спутники, враги, камера,
# джойстик (отпускание, мультитач настоящими касаниями CDP), независимость от fps (60 / 20 / 15 / рывки), возврат со вкладки.
# python tools/physics_test.py   (env URL, VPS=844x390,..., FPS=native,20,15,spike)
import asyncio,os,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
VPS=[tuple(map(int,v.split('x'))) for v in os.environ.get('VPS','844x390,667x375,932x430').split(',')]
FPSL=os.environ.get('FPS','native,20,15,spike').split(',')
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
INIT="""(()=>{const nraf=window.requestAnimationFrame.bind(window);window.__FPS=0;window.__SPIKE=0;
window.requestAnimationFrame=cb=>{if(!window.__FPS&&!window.__SPIKE)return nraf(cb);const f=window.__FPS||30;let iv=1000/f;if(window.__SPIKE&&Math.random()<.1)iv=150+Math.random()*250;return setTimeout(()=>cb(performance.now()),iv)}})()"""
H=r"""
window.PT={};const P_=PT;
P_.waitT=s=>new Promise(r=>{const t0=T,w0=performance.now();const f=()=>(T-t0>=s||performance.now()-w0>s*1000*8+4000)?r():setTimeout(f,10);f()});
P_.arena=()=>{for(let x=14;x<=34;x++)for(let z=30;z<=47;z++){for(let y=1;y<WY;y++)vsetRaw(x,y,z,y<GY?B.stone:y===GY?B.grass:0)}
 for(let cz=1;cz<3;cz++)for(let cx=0;cx<3;cx++)rebuildChunk(cx,cz);if(typeof scanTorches==='function'){}};
P_.put=(x,y,z,t)=>{vsetRaw(x,y,z,t==null?B.stone:t);rebuildChunk(Math.floor(x/CH),Math.floor(z/CH))};
P_.reset=(x,z,y)=>{if(TASK)G.close();talk=null;DAY.night=false;MON.slice().forEach(m=>{rmEnt(m)});MON.length=0;JOY.on=false;JOY.vx=JOY.vy=0;for(const k in KEYS)KEYS[k]=0;G.tp(x,z,y);PL.v.set(0,0,0)};
P_.move=(yaw,vx,vy)=>{CAMS.yaw=yaw;JOY.on=!!(vx||vy);JOY.vx=vx;JOY.vy=vy};
P_.stop=()=>{JOY.on=false;JOY.vx=JOY.vy=0;KEYS.jump=0};
P_.inBlock=e=>collides(e.p.x,e.p.y+.02,e.p.z,e.hw*.9,e.h*.95);
P_.st=()=>({x:+PL.p.x.toFixed(3),y:+PL.p.y.toFixed(3),z:+PL.p.z.toFixed(3),onG:PL.onG,inB:P_.inBlock(PL)});
"""
TESTS=r"""
async(n)=>{const R={};const ok=(k,c,info)=>{R[k]={ok:!!c,info}};const E=PT;const X=20.5,Z=38.5,G0=GY+1;
 SV.f.intro=1;SV.f.tut=1;Object.keys(FOES).forEach(k=>SV.f['fo_'+k]=1);SV.f.zb1=1;SV.f.sp1=1;
 E.arena();
 // 1 гравитация и приземление
 E.reset(X,Z,G0+6);await E.waitT(1.6);ok('gravity_land',Math.abs(PL.p.y-G0)<.01&&PL.onG,E.st());
 // 2 высота прыжка
 E.reset(X,Z);await E.waitT(.3);let y0=PL.p.y,my=y0;KEYS.jump=1;const t0=T;while(T-t0<1.0){my=Math.max(my,PL.p.y);await E.waitT(0)}KEYS.jump=0;await E.waitT(.6);
 ok('jump_height',my-y0>1.15&&my-y0<1.6,{h:+(my-y0).toFixed(3)});
 // 3 прыжок на ступеньку и автоподъём
 for(const mode of['jump','auto']){E.arena();for(let z=30;z<=47;z++)E.put(23,G0,z);E.reset(X,Z);await E.waitT(.2);E.move(Math.PI/2,0,-1);if(mode==='jump')KEYS.jump=1;await E.waitT(2.2);E.stop();await E.waitT(.4);
  ok('step_'+mode,Math.abs(PL.p.y-(G0+1))<.02&&PL.p.x>23.3&&!E.inBlock(PL),E.st())}
 // 4 стена в 2 блока — не пройти, не застрять
 E.arena();for(let z=30;z<=47;z++){E.put(23,G0,z);E.put(23,G0+1,z)}E.reset(X,Z);E.move(Math.PI/2,0,-1);KEYS.jump=1;await E.waitT(2.5);E.stop();await E.waitT(.3);
 ok('wall2_block',PL.p.x<23-PL.hw+.01&&!E.inBlock(PL),E.st());
 // 5 стены во всех направлениях
 E.arena();for(let i=-3;i<=3;i++){E.put(X+3+i*0,G0,Z+i);E.put(X+3,G0+1,Z+i);E.put(X-3,G0,Z+i);E.put(X-3,G0+1,Z+i);E.put(X+i,G0,Z+3);E.put(X+i,G0+1,Z+3);E.put(X+i,G0,Z-3);E.put(X+i,G0+1,Z-3)}
 let wb=[];for(const[yw,nm]of[[Math.PI/2,'+x'],[-Math.PI/2,'-x'],[0,'+z'],[Math.PI,'-z'],[Math.PI/4,'diag']]){E.reset(X,Z);E.move(yw,0,-1);await E.waitT(1.6);E.stop();await E.waitT(.2);if(E.inBlock(PL)||Math.abs(PL.p.x-X)>2.6||Math.abs(PL.p.z-Z)>2.6)wb.push(nm+JSON.stringify(E.st()))}
 ok('walls_all_dirs',!wb.length,wb);
 // 6 угол: уйти из угла
 E.reset(X,Z);E.move(Math.PI/4,0,-1);await E.waitT(1.5);E.move(Math.PI/4+Math.PI,0,-1);await E.waitT(1);E.stop();ok('corner_escape',Math.hypot(PL.p.x-X,PL.p.z-Z)>.8&&!E.inBlock(PL),E.st());
 // 7 скольжение вдоль стены
 E.arena();for(let x=14;x<=34;x++){E.put(x,G0,Z+1);E.put(x,G0+1,Z+1)}E.reset(X,Z);E.move(Math.PI/4,0,-1);await E.waitT(1.2);E.stop();ok('slide_wall',PL.p.x-X>2.5&&!E.inBlock(PL),E.st());
 // 8 потолок
 E.arena();E.put(20,G0+2,38);E.reset(X,Z);await E.waitT(.3);KEYS.jump=1;let my2=0;const t1=T;while(T-t1<.8){my2=Math.max(my2,PL.p.y);await E.waitT(0)}KEYS.jump=0;await E.waitT(.5);
 ok('ceiling',my2<=G0+2-PL.h+.01&&Math.abs(PL.p.y-G0)<.02&&!E.inBlock(PL),{my:my2,h:PL.h,...E.st()});
 // 9 яма в 1 блок — выйти; яма в 2 — выйти прыжком нельзя, но не застрять внутри блока
 E.arena();vsetRaw(22,GY,38,0);rebuildChunk(1,2);E.reset(X,Z);E.move(Math.PI/2,0,-1);await E.waitT(2.4);E.stop();await E.waitT(.3);ok('hole1_out',PL.p.x>23&&Math.abs(PL.p.y-G0)<.02,E.st());
 E.arena();for(let x=21;x<=23;x++)for(let y=GY-1;y<=GY;y++)vsetRaw(x,y,38,0);rebuildChunk(1,2);E.reset(22.5,38.5);await E.waitT(.8);const inHole=PL.p.y;E.move(Math.PI/2,0,-1);KEYS.jump=1;await E.waitT(2.5);E.stop();
 ok('hole2_fall',Math.abs(inHole-(GY-1))<.02&&!E.inBlock(PL),{inHole,...E.st()});
 // 10 копаем блок под собой — падаем
 E.arena();E.reset(X,Z);await E.waitT(.3);setBlock(20,GY,38,0);await E.waitT(.8);ok('dig_under_fall',Math.abs(PL.p.y-GY)<.02&&PL.onG,E.st());
 // 11 ходьба по поставленным блокам (мост из блоков над ямой)
 E.arena();for(let x=21;x<=28;x++){for(let y=1;y<=GY;y++)vsetRaw(x,y,38,0);vsetRaw(x,GY,38,0)}for(let x=21;x<=28;x++)setBlock(x,GY,38,B.cobble);E.reset(X,Z);E.move(Math.PI/2,0,-1);await E.waitT(2.2);E.stop();
 ok('walk_placed',PL.p.x>27&&Math.abs(PL.p.y-G0)<.02,E.st());
 // 12 поставить блок туда, где стоишь — запрещено, не затягивает внутрь
 E.arena();E.reset(X,Z);await E.waitT(.3);AIM={x:20,y:GY,z:38,n:[0,1,0]};SV.sel=B.dirt;SV.inv[B.dirt]=5;const pl0=vget(20,G0,38);doPlace();await E.waitT(.3);
 ok('place_on_self',vget(20,G0,38)===pl0&&!E.inBlock(PL),{b:vget(20,G0,38),...E.st()});
 // 13 отпустили джойстик — стоим, без дрейфа
 E.arena();E.reset(X,Z);E.move(Math.PI/2,0,-1);await E.waitT(.8);E.stop();await E.waitT(.15);const sx=PL.p.x;await E.waitT(1);ok('joy_release_stop',Math.abs(PL.p.x-sx)<.02,{dx:PL.p.x-sx});
 // 14 скорость ходьбы не зависит от fps (≈ 4.4 блока/с)
 E.arena();E.reset(16.5,Z);await E.waitT(.2);const wx0=PL.p.x,tt0=T,pw0=performance.now();E.move(Math.PI/2,0,-1);await E.waitT(2);E.stop();const sp=(PL.p.x-wx0)/(T-tt0),wall=(PL.p.x-wx0)/((performance.now()-pw0)/1000);
 ok('walk_speed',sp>3.9&&sp<4.8,{sp:+sp.toFixed(2),wallclock:+wall.toFixed(2)});
 // 15 спутники: после прогулки рядом, на земле, не в блоках
 E.arena();for(let z=30;z<=47;z++)E.put(26,G0,z);E.reset(16.5,Z);E.move(Math.PI/2,0,-1);await E.waitT(3.5);E.stop();await E.waitT(2);
 const fl=[GRN,DOG].map(f=>({k:f.kind,d:+Math.hypot(f.p.x-PL.p.x,f.p.z-PL.p.z).toFixed(2),inB:E.inBlock(f),fly:+(f.p.y-groundAt(f.p.x,f.p.z,f.p.y+.3)).toFixed(2)}));
 ok('followers',fl.every(f=>f.d<4.5&&!f.inB&&Math.abs(f.fly)<.05),fl);
 // 16 враг: идёт к игроку, на земле, не в стене, перешагивает ступеньку
 E.arena();for(let z=30;z<=47;z++)E.put(24,G0,z);E.reset(X,Z);const m=spawnMonster('zombie',29.5,38.5);m.fixed=1;m.task=1;let mon=[];for(let i=0;i<25;i++){m.task=0;await E.waitT(.12);m.task=1;if(TASK)G.close();mon.push(E.inBlock(m))}
 const mg=m.p.y-groundAt(m.p.x,m.p.z,m.p.y+.3);ok('enemy_ground',!mon.some(Boolean)&&Math.abs(mg)<.05,{x:m.p.x,y:m.p.y,mg});rmEnt(m);MON.length=0;
 // 17 камера не внутри блока (тоннель в 3 блока)
 E.arena();for(let x=14;x<=34;x++)for(let y=G0;y<=G0+5;y++)for(const z of[36,37,40,41])vsetRaw(x,y,z,B.stone);for(let x=14;x<=34;x++)for(let z=36;z<=41;z++)vsetRaw(x,G0+3,z,B.stone);for(let cx=0;cx<3;cx++)rebuildChunk(cx,2);
 let cin=[];CAMS.fp=false;for(const yw of[0,Math.PI/2,Math.PI,-Math.PI/2,.8]){E.reset(X,Z);CAMS.yaw=yw;CAMS.pitch=-.3;await E.waitT(.6);const c=CAM.position;if(opaqueT(vget(Math.floor(c.x),Math.floor(c.y),Math.floor(c.z))))cin.push(yw)}
 CAMS.pitch=-.22;ok('camera_not_in_block',!cin.length,cin);
 // 18 вода: в реке не тонем и не застреваем, выходим на берег, держа джойстик к берегу
 SV.z=Math.max(SV.z,2);E.reset(RIV.x0+3.5,TZ+6.5,GY);await E.waitT(.5);const wy=PL.p.y;E.move(-Math.PI/2,0,-1);await E.waitT(5);E.stop();await E.waitT(.3);
 ok('water_exit',PL.p.x<RIV.x0&&PL.onG&&!E.inBlock(PL),{wy,...E.st()});
 // 19 лава — мягко возвращает на мост
 SV.z=Math.max(SV.z,4);E.reset(142.5,TZ+6.5,GY+1);await E.waitT(1);ok('lava_back',Math.abs(PL.p.x-139.5)<.6&&!E.inBlock(PL),E.st());
 // 20 мост через реку проходим
 E.reset(RIV.x0-1.5,TZ+.5);await E.waitT(.3);E.move(Math.PI/2,0,-1);await E.waitT(3.6);E.stop();ok('bridge_walk',PL.p.x>RIV.x1+1&&!E.inBlock(PL),{deck:vget(RIV.x0+2,GY,TZ),...E.st()});
 // 21 возврат со вкладки: пауза 3 с — без телепорта
 E.arena();E.reset(X,Z);await E.waitT(.3);const pv=PL.p.clone();window.__STALL=1;await new Promise(r=>setTimeout(r,3000));window.__STALL=0;await E.waitT(.5);
 ok('tab_resume',PL.p.distanceTo(pv)<.05,{d:PL.p.distanceTo(pv)});
 return R}
"""
async def run(b,W,Hh,fps):
  tag=f'{W}x{Hh}@{fps}'
  ctx=await b.new_context(viewport={'width':W,'height':Hh},has_touch=True,is_mobile=True,device_scale_factor=2,
     user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
  await ctx.add_init_script(INIT+";(()=>{const o=window.requestAnimationFrame;window.requestAnimationFrame=cb=>window.__STALL?setTimeout(()=>window.requestAnimationFrame(cb),50):o(cb)})()")
  pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=90000)
  await pg.evaluate("G.mute=true;SV.f.intro=1;G.go('world')");await pg.wait_for_timeout(1500)
  if fps=='spike':await pg.evaluate('window.__SPIKE=1')
  elif fps!='native':await pg.evaluate(f'window.__FPS={fps}')
  await pg.evaluate(H)
  R=await pg.evaluate(TESTS,1)
  # мультитач: джойстик и обзор одновременно (настоящие касания)
  cdp=await ctx.new_cdp_session(pg)
  await pg.evaluate("PT.arena();PT.reset(20.5,38.5);CAMS.yaw=Math.PI/2")
  await pg.wait_for_timeout(400)
  st0=await pg.evaluate("[PL.p.x,PL.p.z,CAMS.yaw]")
  jx,jy=int(W*.17),int(Hh*.75);lx,ly=int(W*.62),int(Hh*.45)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':jx,'y':jy,'id':1}]})
  await pg.wait_for_timeout(80)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':jx,'y':jy-45,'id':1}]})
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':jx,'y':jy-45,'id':1},{'x':lx,'y':ly,'id':2}]})
  for i in range(10):
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':jx,'y':jy-45,'id':1},{'x':lx+i*6,'y':ly,'id':2}]});await pg.wait_for_timeout(60)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[{'x':jx,'y':jy-45,'id':1}]})
  await pg.wait_for_timeout(300)
  st1=await pg.evaluate("[PL.p.x,PL.p.z,CAMS.yaw,JOY.on]")
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  await pg.wait_for_timeout(500);st2=await pg.evaluate("[PL.p.x,PL.p.z,JOY.on]")
  moved=abs(st1[0]-st0[0])+abs(st1[1]-st0[1])
  R['multitouch_joy_look']={'ok':moved>.5 and abs(st1[2]-st0[2])>.05,'info':{'moved':moved,'dyaw':st1[2]-st0[2]}}
  R['touch_release_stop']={'ok':(not st2[2]) and abs(st2[0]-st1[0])+abs(st2[1]-st1[1])<.3,'info':{'after':st2,'at':st1}}
  # потеря касания (свернули приложение): touchcancel / скрытие страницы
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':jx,'y':jy,'id':5}]})
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':jx,'y':jy-50,'id':5}]})
  await pg.wait_for_timeout(200)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
  await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'))")
  await pg.wait_for_timeout(300);c0=await pg.evaluate("[PL.p.x,PL.p.z]");await pg.wait_for_timeout(700);c1=await pg.evaluate("[PL.p.x,PL.p.z,JOY.on]")
  R['touch_cancel_stop']={'ok':abs(c1[0]-c0[0])+abs(c1[1]-c0[1])<.05 and not c1[2],'info':{'c0':c0,'c1':c1}}
  fpsv=await pg.evaluate('G.fps()')
  await ctx.close()
  return tag,R,errs,fpsv
async def main():
  allf=[];rows=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL)
    for W,Hh in VPS:
      for fps in FPSL:
        tag,R,errs,fv=await run(b,W,Hh,fps)
        bad=[k for k,v in R.items() if not v['ok']]
        rows.append((tag,len(R)-len(bad),len(R),round(fv,1)))
        print(tag,'fps',round(fv,1),'pass',len(R)-len(bad),'/',len(R),flush=True)
        for k in bad:print('  FAIL',k,json.dumps(R[k]['info'],ensure_ascii=False)[:300],flush=True);allf.append(f'{tag} {k}')
        for e in errs:print('  JS',e[:200]);allf.append(f'{tag} js {e[:80]}')
    await b.close()
  os.makedirs('shots',exist_ok=True);json.dump(rows,open('shots/physics_results.json','w'))
  print('FAILS',len(allf));print('PASS' if not allf else 'FAIL')
asyncio.run(main())
