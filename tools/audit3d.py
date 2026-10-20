# Аудит 3D-версии на 3 телефонах: каждая надпись внутри своей таблички, не меньше 13 css px, не налезает на другую,
# не уходит за экран; герои и монстры стоят на земле, масштаб единый; нет ошибок JS.
import asyncio,os,json
from playwright.async_api import async_playwright
URL=os.environ.get('URL','http://127.0.0.1:18640/index.html')
VPS=[(844,390),(667,375),(932,430)]
GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
STATES=[('title',"G.go('title')"),('intro',"G.fast=false;G.go('intro')"),('world',"G.fast=true;G.zone(1);talk=null"),('world_talk',"say('t1')"),
 ('mw',"G.open('mw',0)"),('mw_hint',"G.ans(false).forEach(i=>G.tapId(i))"),('spider',"G.close();G.open('spider')"),('zombie',"G.close();G.open('zombie')"),
 ('river',"G.zone(2);G.close();G.open('river')"),('forge',"G.zone(3);G.close();G.open('forge')"),('desert',"G.zone(4);G.close();G.open('desert')"),
 ('chest0',"G.close();G.open('chest',0)"),('chest2',"G.close();G.open('chest',2)"),('castle',"G.zone(5);G.close();G.open('castle')"),('fin',"G.go('fin')"),
 ('house',"G.zone(3);G.close();talk=null;G.tp(85.5,26.5);G.look(Math.PI,-.25)"),('night',"G.zone(2);G.close();talk=null;DAY.night=true;DAY.t=10")]
def inside(a,b,t=1.5):return a[0]>=b[0]-t and a[1]>=b[1]-t and a[2]<=b[2]+t and a[3]<=b[3]+t
def ov(a,b):return max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
async def main():
  F=[];N=0
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL)
    for W,H in VPS:
      tag=f'{W}x{H}';ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True);pg=await ctx.new_page()
      errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(URL);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function('typeof G!=="undefined"&&G.scene==="title"',timeout=60000);await pg.evaluate('G.mute=true')
      for name,js in STATES:
        await pg.evaluate(js);await pg.wait_for_timeout(900 if name!='intro' else 500)
        await pg.evaluate('G.auditReq=1');await pg.wait_for_timeout(150);a=await pg.evaluate('G._aud')
        os.makedirs('shots/audit3d',exist_ok=True);await pg.screenshot(path=f'shots/audit3d/{tag}_{name}.png')
        for t in a['t']:
          N+=1
          if not inside(t['b'],t['c']):F.append(f'{tag} {name}: «{t["t"]}» out of its board {[round(v) for v in t["b"]]} vs {[round(v) for v in t["c"]]}')
          if t['size']<13:F.append(f'{tag} {name}: «{t["t"]}» font {t["size"]:.1f}css too small')
          cb=t['c'];board_on=cb[0]>=0 and cb[1]>=0 and cb[2]<=W and cb[3]<=H
          if board_on and (t['b'][0]<0 or t['b'][1]<0 or t['b'][2]>W or t['b'][3]>H):F.append(f'{tag} {name}: «{t["t"]}» off screen')
        for i,x in enumerate(a['t']):
          for y in a['t'][i+1:]:
            if ov(x['b'],y['b'])>4:F.append(f'{tag} {name}: «{x["t"]}» overlaps «{y["t"]}»')
        if name not in('intro','title','fin'):
          for e in await pg.evaluate('G.ents()'):
            if e['hide']:continue
            if abs(e['y']-e['gnd'])>.06 and e['onG']:F.append(f'{tag} {name}: {e["k"]} y {e["y"]:.2f} vs ground {e["gnd"]}')
            if e['k']!='slime' and len(set(round(v,6) for v in e['sc']))!=1:F.append(f'{tag} {name}: {e["k"]} stretched')
        else:
          for e in await pg.evaluate('G.ents()'):
            if not e['hide'] and abs(e['y']-e['gnd'])>.06:F.append(f'{tag} {name}: {e["k"]} y {e["y"]:.2f} vs ground {e["gnd"]}')
      F.extend(f'{tag} JSERR {e}' for e in errs);await ctx.close()
    await b.close()
  print('texts checked',N);print(json.dumps(F,ensure_ascii=False,indent=0));print('PASS' if not F else 'FAIL')
asyncio.run(main())
