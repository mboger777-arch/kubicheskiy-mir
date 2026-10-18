'use strict';
// ===== Сцены: заставка, знакомство, мир, финал =====
const WHO={bloki:'Блоки',gran:'Грань',pixel:'Пиксель',krivo:'Криволом',narrator:''};
// табличка с репликой (наверху; текст всегда внутри нарисованной доски)
function drawTalk(){if(!talk||scene==='load')return;const s=safeV();const left=(scene==='world')?s.x0+(TASK?130:320):s.x0+20;const w=Math.min(1180,s.x1-left-20),h=120;const x=left+((s.x1-left-20)-w)/2,y=s.y0;
 const box=nine('board',x,y,w,h);talk.box=[x,y,w,h];if(!box)return;const nm=WHO[talk.who];const t=(nm?nm+': ':'')+talk.text;fitText(t,box,40,'#fff',{min:20})}
// земля для сцен-картинок: два ряда блоков внизу экрана, герои стоят ступнями на верхней грани
function groundStrip(top,sub){const v=vis();const y=v.y0+v.h-TS*1.6;const c0=Math.floor(v.x0/TS)-1,c1=Math.ceil((v.x0+v.w)/TS)+1;for(let c=c0;c<=c1;c++){const a=IM['t_'+top],b=IM['t_'+sub];if(ok(a))X.drawImage(a,c*TS,y,TS+.6,TS+.6);if(ok(b))X.drawImage(b,c*TS,y+TS,TS+.6,TS+.6)}return y}
function sceneBg(n){const i=IM['bg_'+n];const v=vis();if(!ok(i)){X.fillStyle='#234';X.fillRect(v.x0,v.y0,v.w,v.h);return}const s=Math.max(v.w/1600,v.h/900);X.drawImage(i,v.x0+v.w/2-800*s,v.y0+v.h/2-450*s,1600*s,900*s)}
function castRow(names,gy,hk){const v=vis(),s=safeV();const H0=Math.min(v.h*.52,330)*(hk||1);const items=names.map(n=>({n,h:HGT[n]/1.95*H0}));
 const ws=items.map(it=>{const i=IM[it.n];return ok(i)?it.h*i.naturalWidth/i.naturalHeight:it.h*.6});const gap=40;const tot=ws.reduce((a,b)=>a+b,0)+gap*(items.length-1);
 let k=1;if(tot>s.x1-s.x0-40)k=(s.x1-s.x0-40)/tot;let x=(s.x0+s.x1)/2-tot*k/2;
 items.forEach((it,i)=>{const w=ws[i]*k;const sp=talk&&talk.who===it.n;drawSpr(it.n,x+w/2,gy,it.h*k,{gnd:true,hero:true,rot:sp?Math.sin(T*6)*.02:0});x+=w+gap*k})}
// ---- заставка ----
SC.title={enter(){},draw(){sceneBg('forest');const gy=groundStrip('grass','dirt');const s=safeV();
  const lw=Math.min(860,s.x1-s.x0-40),lh=Math.min(200,lw*.24);const lb=nine('board',(s.x0+s.x1)/2-lw/2,s.y0,lw,lh);if(lb){fitText('Кубический мир',[lb[0],lb[1],lb[2],lb[3]*.6],80,'#ffe066',{one:1});fitText('тайна треугольников',[lb[0],lb[1]+lb[3]*.6,lb[2],lb[3]*.4],46,'#fff',{one:1})}
  castRow(['bloki','gran','pixel'],gy,.95)},
 ui(){const s=safeV();const cx=s.x1-130,cy=s.y1-TS*1.6-120;drawBtn('b_ok',cx,cy,180,{pulse:1});btn('play',cx,cy,180,180,()=>{go(SV.f.intro?'world':'intro')});
  const tb=nine('board',cx-140,cy+96,280,86);if(tb)fitText(SV.z||SV.f.intro?'Дальше':'Играть',tb,44,'#fff',{one:1});
  if(SV.f.intro){const rx=s.x0+110,ry=s.y1-TS*1.6-70;tabBtn('reset',rx,ry,200,90,'Заново',()=>{SV=freshSV();save(1);go('intro')},{fs:36,one:1})}}};
// ---- знакомство ----
const INTRO=['i1','i2','i3','i4','i5','i6'];
SC.intro={skipOnTalk:1,enter(){const c=ctxNow();this.k=0;run(async()=>{for(let i=0;i<INTRO.length;i++){this.k=i;await say(INTRO[i],c)}await wait(300,c);SV.f.intro=1;save(1);go('world')})},
 draw(){sceneBg(this.k>=4?'castle':'forest');const gy=groundStrip(this.k>=4?'castle':'grass',this.k>=4?'castle':'dirt');castRow(this.k===4?['bloki','gran','pixel','krivo']:['bloki','gran','pixel'],gy,.9)},
 ui(){const s=safeV();drawBtn('b_right',s.x1-80,s.y1-TS*1.6-80,130);btn('skip',s.x1-80,s.y1-TS*1.6-80,130,130,()=>{SV.f.intro=1;save(1);go('world')})}};
// ---- финал ----
SC.fin={skipOnTalk:1,enter(){const c=ctxNow();run(async()=>{for(const k of['f1','f2','f3','f4'])await say(k,c)})},
 update(){if(Math.random()<.06){const v=vis();sparks(rnd(v.x0+100,v.x0+v.w-100),rnd(v.y0+100,v.y0+v.h*.45),18,pick(['#ffe066','#ff7a3a','#7ad04a','#5fd0ff','#ff6ad0']))}},
 draw(){sceneBg('castle');const gy=groundStrip('castle','castle');castRow(['bloki','gran','pixel','krivo'],gy,.78);drawParticles(0,0);
  const s=safeV();const w=Math.min(760,s.x1-s.x0-40),h=96;const b=nine('board',(s.x0+s.x1)/2-w/2,s.y0+140,w,h);if(b){const n=SV.st.reduce((a,b)=>a+b,0)+(SV.house?1:0);fitText('Победа!  Звёзды: '+n+' из 5   Алмазы: '+SV.dia,b,44,'#ffe066',{one:1})}},
 ui(){const s=safeV();drawBtn('b_home',s.x0+80,s.y1-TS*1.6-80,130);btn('home',s.x0+80,s.y1-TS*1.6-80,130,130,()=>go('title'));
  drawBtn('b_ok',s.x1-80,s.y1-TS*1.6-80,130);btn('world',s.x1-80,s.y1-TS*1.6-80,130,130,()=>go('world'))}};
// ---- мир ----
function granSpot(){if(SV.z===0&&!SV.f.tut)return 9.5;if(SV.z===0)return SV.mw>=3?47.5:[27.5,37.5,48.5][SV.mw];return[0,63.5,92.5,133.5,172.5,172.5][SV.z]}
let GRAN={x:9.5*TS,y:GR*TS},STIN={};
function stations(){const L=[];if(SV.z===0&&SV.f.tut&&SV.mw<3){const c=MWALLS[SV.mw];L.push({id:'mw',arg:SV.mw,near:P.x>(c-1.5)*TS&&P.x<(c+.2)*TS&&P.y>GR*TS})}
 if(SV.z===1)L.push({id:'river',near:Math.abs(P.x-64.5*TS)<1.6*TS});if(SV.z===2)L.push({id:'forge',near:Math.abs(P.x-93*TS)<1.8*TS&&P.y<=GR*TS+2});
 if(SV.z===3)L.push({id:'desert',near:Math.abs(P.x-133.5*TS)<1.6*TS});if(SV.z===4)L.push({id:'castle',near:Math.abs(P.x-172.5*TS)<1.8*TS});
 CHESTS.forEach((ch,i)=>{if(!SV.st[i]&&!tget(ch.c,ch.r))L.push({id:'chest',arg:i,key:'chest'+i,near:Math.hypot((ch.c+.5)*TS-P.x,(ch.r+.5)*TS-(P.y-TS*.9))<1.7*TS})});return L}
function stepStations(){for(const s of stations()){const k=s.key||s.id;const was=STIN[k];STIN[k]=s.near;if(s.near&&!was&&!TASK)openTask(s.id,s.arg)}}
function stepStory(dt){const f=SV.f;
 if(!f.t1){f.t1=1;say('t1').catch(()=>{})}
 if(!f.t2&&Math.abs(P.x-GRAN.x)<2.2*TS){f.t2=1;MODE='dig';say('t2').catch(()=>{})}
 if(!f.m0&&P.x>22.5*TS&&P.y>GR*TS){f.m0=1;say('m0').catch(()=>{})}
 if(SV.z===0&&SV.mw>=3&&!MWALLS.some(c=>[GR,GR+1,GR+2].some(r=>tget(c,r)===B.dia))){SV.z=1;save(1);say('m_done').catch(()=>{})}
 // первый паук — в высокой пещере шахты; первый зомби — у реки
 if(SV.mw>=1&&!f.sp1&&!TASK&&P.x>35*TS&&P.x<39*TS&&P.y>GR*TS&&P.onG)openTask('spider');
 if(SV.z>=1&&!f.zb1&&!TASK&&P.x>58*TS&&P.onG){DAY.night=true;DAY.t=0;sayNow('n1');openTask('zombie')}
 if(SV.z>=2&&!f.house&&P.x>PLOT[0]*TS&&P.x<PLOT[1]*TS){f.house=1;say('house').catch(()=>{})}
 // день и ночь
 if(SV.z>=1&&!TASK){DAY.t+=dt;if(!DAY.night&&DAY.t>DAYLEN){DAY.night=true;DAY.t=0;DAY.spawn=3;sayNow('n1')}else if(DAY.night&&DAY.t>NIGHTLEN){DAY.night=false;DAY.t=0;sayNow('n2')}
  if(DAY.night){DAY.spawn-=dt;const surf=P.y<=GR*TS+2&&P.x>56*TS&&P.onG&&!(P.x>RX0*TS-TS&&P.x<RX1*TS+TS);if(DAY.spawn<=0&&surf){DAY.spawn=9;const k=DAY.next;DAY.next=k==='spider'?'zombie':'spider';openTask(k)}}}
 NIGHT+=((DAY.night?1:0)-NIGHT)*Math.min(1,dt*1.5)}
EV.on('dig',()=>{if(!SV.f.t3&&SV.f.t2){SV.f.t3=1;MODE='place';say('t3').catch(()=>{})}});
EV.on('place',(c,r)=>{if(!SV.f.tut&&SV.f.t3){SV.f.tut=1;save(1);say('t4').catch(()=>{})}
 if(SV.z>=2&&!SV.house&&c>=PLOT[0]&&c<PLOT[1]){let n=0;for(const k in SV.diff){const[a,b]=k.split(',').map(Number);if(a>=PLOT[0]&&a<PLOT[1]&&b<GR&&SV.diff[k])n++}if(n>=6){SV.house=1;save(1);sparks(P.x,P.y-TS*2,30);SFX.star();sayNow('house_ok')}}});
EV.on('dia',()=>{if(SV.dia%2===1)hint('m_dia')});
function drawChests(){CHESTS.forEach((ch,i)=>{const t=tget(ch.c,ch.r);const x=wx((ch.c+.5)*TS),y=wy((ch.r+1)*TS);
  if(!t){const i2=IM[SV.st[i]?'chest_open':'chest'];if(ok(i2)){const w=TS*.95,h=w*i2.naturalHeight/i2.naturalWidth;X.drawImage(i2,x-w/2,y-h,w,h)}}
  else if(!SV.st[i]&&Math.sin(T*3+i)>.6){X.save();X.globalCompositeOperation='lighter';X.fillStyle='rgba(255,240,150,.5)';const k=4+Math.sin(T*9)*3;X.fillRect(x-k+Math.sin(T*2)*20,y-TS*.5-k,k*2,k*2);X.restore()}})}
function drawWorld(){drawBgAll();drawBridge();drawTiles();
 // кузница, табличка участка
 const an=IM.anvil;if(ok(an)){const w=TS*1.3,h=w*an.naturalHeight/an.naturalWidth;X.drawImage(an,wx(94.3*TS)-w/2,wy(GR*TS)-h,w,h)}
 {const sx=wx(PLOT[0]*TS-TS*.5),sy=wy(GR*TS);rod('stick',sx,sy,sx,sy-TS*1.2,16);const b=nine('board',sx-TS*1.2,sy-TS*1.95,TS*2.4,TS*.95);if(b)fitText(SV.house?'Мой дом ★':'Твой дом',b,34,'#fff',{one:1})}
 drawChests();
 if(scene==='world'&&TASK&&TASK.def.drawWorld)TASK.def.drawWorld(TASK);
 // Криволом в замке
 if(SV.z<5&&P.x>150*TS){drawSpr('krivo',wx(185*TS),wy(GR*TS),HGT.krivo*TS,{gnd:wy(groundY(185*TS,GR*TS-TS*.5)),rot:Math.sin(T*1.5)*.02})}
 // Грань
 const gx=granSpot()*TS;if(Math.abs(gx-GRAN.x)>1){sparks(GRAN.x,GRAN.y-TS,8);GRAN.x=gx;GRAN.y=groundY(gx,(SV.z===0&&SV.f.tut?GR:GR-1)*TS);sparks(GRAN.x,GRAN.y-TS,12,'#d8a0ff')}else GRAN.y=groundY(GRAN.x,(SV.z===0&&SV.f.tut?GR:GR-1)*TS);
 drawSpr('gran',wx(GRAN.x),wy(GRAN.y),HGT.gran*TS,{gnd:wy(groundY(GRAN.x,GRAN.y-TS*.5)),rot:talk&&talk.who==='gran'?Math.sin(T*6)*.02:0});
 const avail=stations().find(s=>s.id!=='chest');if(avail&&!TASK){drawImg('star',wx(GRAN.x),wy(GRAN.y-HGT.gran*TS)-34+Math.sin(T*4)*6,58,{glow:'#ffe066'})}
 // Пиксель и Блоки
 drawSpr('pixel',wx(DOG.x),wy(DOG.y),HGT.pixel*TS,{gnd:wy(groundY(DOG.x,DOG.y-TS*.5)),rot:DOG.walk?Math.sin(DOG.walk)*.05:0});
 drawSpr('bloki',wx(P.x),wy(P.y),HGT.bloki*TS,{gnd:P.onG?wy(groundY(P.x,P.y-TS*.5)):null,rot:P.walk?Math.sin(P.walk)*.05:(DIG?Math.sin(T*30)*.03:0)});
 if(scene==='world'&&TASK&&TASK.def.draw&&!TASK.def.overlay){}
 drawParticles(CAM.x-vis().x0,CAM.y-vis().y0);
 // ночь / подземелье: темнее, вокруг Блоки светит фонарь на каске
 const v=vis();const under=P.y>GR*TS+2&&P.x>20*TS&&P.x<56*TS;const dark=Math.max(NIGHT*.5,under?.34:0);
 if(dark>.01){const lx=wx(P.x),ly=wy(P.y-TS*1.6);const g=X.createRadialGradient(lx,ly,TS*2.2,lx,ly,TS*8);g.addColorStop(0,'rgba(8,10,30,0)');g.addColorStop(1,`rgba(8,10,30,${dark})`);X.fillStyle=g;X.fillRect(v.x0,v.y0,v.w,v.h)}}
// ---- интерфейс мира ----
function hud(){const s=safeV();
 if(!TASK){drawBtn('b_home',s.x0+58,s.y0+58,104);btn('home',s.x0+58,s.y0+58,104,104,()=>go('title'))}
 // счётчики
 let cx=s.x0+(TASK?140:130);const cy=s.y0+40;const item=(n,v)=>{drawImg(n,cx+24,cy,48);txt(String(v),cx+56,cy+2,40,'#fff',{al:'left'});cx+=120};
 if(!TASK||TASK.id==='mw'){item('diamond',SV.dia);item('star',SV.st.reduce((a,b)=>a+b,0)+(SV.house?1:0));if(SV.armor){drawImg('armor',cx+24,cy,48);cx+=70}}
 if(TASK)return;
 // ходьба: держать кнопку; прыжок
 const by=s.y1-82;drawBtn('b_left',s.x0+82,by,150,{on:held('left')});btn('left',s.x0+82,by,150,150,null,{hold:1});
 drawBtn('b_right',s.x0+250,by,150,{on:held('right')});btn('right',s.x0+250,by,150,150,null,{hold:1});
 drawBtn('b_up',s.x1-82,by,150,{on:held('up')});btn('up',s.x1-82,by,150,150,null,{hold:1});
 drawBtn('b_place',s.x1-232,by+8,124,{sel:MODE==='place'});btn('place',s.x1-232,by+8,124,124,()=>{MODE='place';if(SEL==null||!SV.inv[SEL])invAdd(-1,0)});
 if(MODE==='place'&&SEL!=null&&SV.inv[SEL]){const ti=IM['t_'+TT[SEL].n];if(ok(ti))X.drawImage(ti,s.x1-232-22,by+8-82,44,44)}
 drawBtn('b_dig',s.x1-372,by+8,124,{sel:MODE==='dig'});btn('dig',s.x1-372,by+8,124,124,()=>{MODE='dig'});
 // сумка с блоками
 const keys=Object.keys(SV.inv).filter(k=>SV.inv[k]>0&&TT[k]&&TT[k].n).map(Number);const x0=s.x0+340,x1=s.x1-440;const nmax=Math.max(0,Math.floor((x1-x0)/118));const ks=keys.slice(0,nmax);
 ks.forEach((k,i)=>{const sx=(x0+x1)/2+(i-(ks.length-1)/2)*118,sy=by+10;nine('tab_grey',sx-54,sy-54,108,108);const ti=IM['t_'+TT[k].n];if(ok(ti))X.drawImage(ti,sx-34,sy-38,68,68);txt(String(SV.inv[k]),sx+28,sy+30,32,'#fff');
  if(MODE==='place'&&SEL===k){X.save();X.strokeStyle='#ffe066';X.lineWidth=7;X.strokeRect(sx-56,sy-56,112,112);X.restore()}btn('inv'+k,sx,sy,108,108,()=>{SEL=k;MODE='place'})})}
SC.world={enter(){genWorld();if(SV.px){P.x=SV.px[0];P.y=SV.px[1]}else{P.x=3.5*TS;P.y=GR*TS}if(boxHits(P.x,P.y,P.hw,P.h)){P.x=3.5*TS;P.y=GR*TS}P.vx=P.vy=0;DOG.x=P.x-1.2*TS;DOG.y=groundY(DOG.x,P.y-TS*.5);
  GRAN.x=granSpot()*TS;GRAN.y=groundY(GRAN.x,(SV.z===0&&SV.f.tut?GR:GR-1)*TS);STIN={};stations().forEach(s=>{STIN[s.key||s.id]=s.near});stepCam(0,true);BGA=zoneHere();BGB=null;
  const k=Object.keys(SV.inv).find(k=>SV.inv[k]>0);SEL=k!=null?+k:null},
 update(dt){if(TASK){if(TASK.def.update)TASK.def.update(TASK,dt);P.vx=0;P.walk=0;physics(dt,0,false)}else{const mx=(held('right')?1:0)-(held('left')?1:0);physics(dt,mx,held('up'));stepStations()}
  stepDig(dt);stepDog(dt);if(scene==='world')stepStory(dt);bgUpdate(dt);stepCam(dt);if(Math.random()<.02){SV.px=[P.x,P.y];save()}},
 draw(){drawWorld();if(TASK&&TASK.def.draw)TASK.def.draw(TASK)},
 ui(){hud();if(TASK&&TASK.def.ui)TASK.def.ui(TASK)},
 tap(x,y){const wx0=sxw(x),wy0=syw(y);
  if(TASK){if(TASK.def.tapTile){const c=Math.floor(wx0/TS),r=Math.floor(wy0/TS);TASK.def.tapTile(TASK,c,r)}if(TASK.def.drag)TASK.def.drag(TASK,x,y);this.dn=TASK.def.drag?1:0;return}
  // Грань: нажать — открыть её задание
  if(Math.abs(wx0-GRAN.x)<TS*.6&&wy0<GRAN.y&&wy0>GRAN.y-HGT.gran*TS){const st=stations().find(s=>s.id!=='chest');if(st){openTask(st.id,st.arg);return}}
  for(let i=0;i<CHESTS.length;i++){const ch=CHESTS[i];if(!SV.st[i]&&!tget(ch.c,ch.r)&&Math.floor(wx0/TS)===ch.c&&Math.floor(wy0/TS)===ch.r){if(reachOK(ch.c,ch.r))openTask('chest',i);else hint('t_far');return}}
  tapTile(Math.floor(wx0/TS),Math.floor(wy0/TS))},
 move(x,y){if(TASK&&TASK.def.drag&&this.dn)TASK.def.drag(TASK,x,y)},up(){this.dn=0}};
// ---- тестовый интерфейс ----
G.go=n=>go(n);G.SV=()=>SV;G.task=()=>TASK?{id:TASK.id,r:TASK.r,mist:TASK.mist,lock:TASK.lock,aim:TASK.aim,a:TASK.a}:null;G.ans=good=>TASK&&TASK.def.ans?TASK.def.ans(TASK,good):[];
G.P=()=>({x:P.x/TS,y:P.y/TS,onG:P.onG,mode:MODE,sel:SEL,inv:{...SV.inv},z:SV.z,dia:SV.dia});
G.tile=(c,r)=>tget(c,r);G.tileXY=(c,r)=>G.pg(wx((c+.5)*TS),wy((r+.5)*TS));
G.zone=k=>{// перейти к зоне k (1..5) с пройденными предыдущими
 SV=freshSV();SV.f={intro:1,t1:1,t2:1,t3:1,tut:1,m0:1};if(k>=2){SV.mw=3;SV.dia=6;SV.z=1;SV.f.sp1=1}if(k>=3){SV.z=2;SV.f.zb1=1;SV.f.r0=1}if(k>=4){SV.z=3;SV.armor=1}if(k>=5)SV.z=4;
 SV.px=[[0,24.5,60.5,90.5,130.5,170.5][k]*TS,(k===1?GR+3:GR)*TS];SV.inv={2:4,3:3};save(1);go('world')};
G.open=(id,arg)=>{openTask(id,arg);return G.task()};G.close=()=>closeTask();G.tp=(x,y)=>{P.x=x*TS;P.y=(y==null?GR:y)*TS;P.vy=0;stepCam(0,true)};
G.roof=()=>ROOF.map(([c,r])=>G.tileXY(c,r));G.night=k=>{DAY.night=true;openTask(k);return G.task()};
G.selftest=()=>{const out=[];for(const q of DQ){const c=180-q.a-q.b;if(!q.o.includes(c)||new Set(q.o).size!==3)out.push('desert '+q.a)}for(const k in CQ){const[a,b,c]=CQ[k];const t=a===b&&b===c?'eq':(a===b||b===c||a===c)?'iso':'sc';if(t!==k)out.push('castle '+k)}return out.length?out:'ok'};
