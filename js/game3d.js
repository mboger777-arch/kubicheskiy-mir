'use strict';
// ===== Игра: герои, управление (джойстик, взгляд, кнопки), HUD, станции заданий, день/ночь, сцены =====
const WHO={bloki:'Блоки',gran:'Грань',pixel:'Пиксель',krivo:'Криволом',narrator:''};
['grass','dirt','cobble','stone','diamond_ore','gold_ore','bedrock','sand','sandstone','planks','log','leaves','castle','brick','water','iron'].forEach(n=>img('t_'+n,'assets/tiles/'+n+'.png'));
['b_eye','b_undo'].forEach(n=>img(n,'assets/ui/'+n+'.png'));img('bg_forest','assets/bg_forest.jpg');
const TS=96;
function drawTalk(){if(!talk||scene==='load')return;const s=safeV();const inW=scene==='world'&&!TASK;const left=inW?s.x0+300:s.x0+(TASK?130:20),right=inW?s.x1-260:s.x1-20;const w=Math.min(1180,right-left),h=120;const x=left+((right-left)-w)/2,y=s.y0;
 const box=nine('board',x,y,w,h);talk.box=[x,y,w,h];if(!box)return;const nm=WHO[talk.who];const t=(nm?nm+': ':'')+talk.text;fitText(t,box,40,'#fff',{min:20})}
let PL=null,GRN=null,DOG=null,KR=null,MON=[];
const JOY={on:false,id:null,bx:0,by:0,x:0,y:0,vx:0,vy:0},LOOK={id:null,x:0,y:0,t0:0,moved:0};
let DIGS=null,AIM=null,PIN=null;
const DAY={t:0,night:false,spawn:10,next:'spider',kills:0};const DAYLEN=80,NIGHTLEN=50;
function inv(t){return SV.inv[t]||0}
function invAdd(t,n){SV.inv[t]=(SV.inv[t]||0)+n;if(SV.inv[t]<=0)delete SV.inv[t];if(SV.sel==null||!SV.inv[SV.sel])SV.sel=SV.inv[t]>0?t:(Object.keys(SV.inv).map(Number)[0]??null);save()}
let HINTT=0;function hint(k){if(T-HINTT<3)return;HINTT=T;sayNow(k)}
// ---- мир и герои ----
let WORLD_READY=false;
function setupWorld(){genWorld();if(!WORLD_READY){init3d();WORLD_READY=true}rebuildAll();buildTrusses();
 ENTS.slice().forEach(rmEnt);MON=[];const st=SV.px||SPOTS.start;PL=mkEnt('bloki',st[0],st[1],{yaw:Math.PI/2});PL.speed=4.4;
 GRN=mkEnt('gran',st[0]+3,st[1]-1.5);GRN.speed=4.8;DOG=mkEnt('pixel',st[0]-1,st[1]+1.2,{hw:.3,h:1});DOG.speed=5.2;
 KR=mkEnt('krivo',SPOTS.krivo[0],SPOTS.krivo[1],{yaw:-Math.PI/2,h:2.4});KR.still=1;
 CHESTM.forEach(m=>SCENE.remove(m));CHESTM=CHESTS.map((c,i)=>{const m=chestMesh();m.position.set(c.x+.5,c.y,c.z+.5);SCENE.add(m);return m});
 if(!ANV){ANV=anvilMesh();ANV.position.set(93.5,GY+1,29.5);SCENE.add(ANV)}
 CAMS.yaw=Math.PI/2;CAMS.pitch=-.22;CAMS.focus=null;stepCam(0,true)}
let CHESTM=[],ANV=null;
function chestMesh(){const g=new T3.Group();const m=new T3.Mesh(new T3.BoxGeometry(.8,.7,.6),[texMat('planks'),texMat('planks'),texMat('planks'),texMat('planks'),texMat('planks'),texMat('planks')]);m.position.y=.35;g.add(m);
 const lid=new T3.Mesh(new T3.BoxGeometry(.84,.08,.64),texMat('log'));lid.position.y=.72;g.add(lid);const lock=new T3.Mesh(new T3.BoxGeometry(.14,.18,.05),texMat('gold_ore'));lock.position.set(0,.55,.31);g.add(lock);g.userData.lid=lid;return g}
function anvilMesh(){const g=new T3.Group();const iron=texMat('iron');const b=(w,h,d,y)=>{const q=new T3.Mesh(new T3.BoxGeometry(w,h,d),iron);q.position.y=y;g.add(q)};b(.8,.2,.5,.1);b(.35,.35,.3,.37);b(1,.25,.5,.66);return g}
// ---- ограничители порядка зон (дальше нельзя, пока не пройдено) ----
function barrierX(){if(SV.mw<3)return MW[SV.mw]-.36;const sp=SV.z>=2?3:(SV.tr.river||0);if(SV.z<2)return RIV.x0+3*sp-.36;if(SV.z<3)return 112-.36;if(SV.z<4)return 145-.36;return WX-.5}
// ---- ввод ----
const KM3={KeyW:'fw',ArrowUp:'fw',KeyS:'bk',ArrowDown:'bk',KeyA:'lf',ArrowLeft:'lf',KeyD:'rt',ArrowRight:'rt',Space:'jump',KeyF:'view',KeyZ:'undo'};
for(const k in KMAP)delete KMAP[k];Object.assign(KMAP,KM3);
addEventListener('keydown',e=>{if(scene!=='world'||TASK)return;if(e.code==='KeyF')toggleView();if(e.code==='KeyZ')undoBlock();if(/^Digit[1-9]$/.test(e.code)){const ks=hotKeys();const k=ks[+e.code.slice(5)-1];if(k!=null)SV.sel=k}});
let PLOCK=false;document.addEventListener('pointerlockchange',()=>{PLOCK=document.pointerLockElement===C});
C.addEventListener('mousedown',e=>{if(TOUCH||scene!=='world'||TASK)return;if(!PLOCK&&e.button===0){const[x,y]=toD(e);if(!hitBtn(x,y))try{C.requestPointerLock()}catch(_){}}if(PLOCK){if(e.button===0)KEYS.dig=1;if(e.button===2)doPlace()}});
addEventListener('mouseup',e=>{if(e.button===0)KEYS.dig=0});
addEventListener('mousemove',e=>{if(PLOCK&&!TASK){CAMS.yaw-=e.movementX*.0042;CAMS.pitch=clamp(CAMS.pitch-e.movementY*.0042,-1.35,1.25)}});
function hotKeys(){return Object.keys(SV.inv).filter(k=>SV.inv[k]>0).map(Number).slice(0,8)}
function toggleView(){CAMS.fp=!CAMS.fp;SFX.click();if(CAMS.fp&&CAMS.pitch<-.5)CAMS.pitch=-.2}
// касание мира: прицел на блок (или блок крыши в задании)
function tapWorld(x,y){const sx=OX+x*S,sy=OY+y*S;const d=screenRay(sx,sy);
 if(TASK&&TASK.id==='castle'&&TASK.r>=3){const roofHit=rayVox(CAM.position,d,40,(b,X_,Y_,Z_)=>ROOF.some(([a,bb,c])=>a===X_&&bb===Y_&&c===Z_)||solidT(b));if(roofHit)TD.castle.tapCell(TASK,roofHit.x,roofHit.y,roofHit.z);return}
 if(TASK)return;const h=rayVox(CAM.position,d,CAMS.fp?7:CAMS.cur+7);if(h&&reachOK(h)){PIN={h,t:T}}}
function reachOK(h){const e=new T3.Vector3(PL.p.x,PL.p.y+1.5,PL.p.z);return e.distanceTo(new T3.Vector3(h.x+.5,h.y+.5,h.z+.5))<=6}
// ---- копать / ставить / отменить ----
function curAim(){if(PIN&&T-PIN.t<4){const b=vget(PIN.h.x,PIN.h.y,PIN.h.z);if(b&&!BT[b].fluid)return PIN.h}PIN=null;
 const d=new T3.Vector3();CAM.getWorldDirection(d);const h=rayVox(CAM.position,d,CAMS.fp?6:CAMS.cur+6);if(h&&reachOK(h))return h;return null}
function stepDig(dt){const want=held('dig');const h=AIM;if(!want||!h){DIGS=null;CRACK.visible=false;return}
 const b=vget(h.x,h.y,h.z);if(BT[b].hard){if(!BT[b].cw)hint(b===B.iron?'t_gate':'t_hard');else hint('m_q');DIGS=null;CRACK.visible=false;return}
 if(!DIGS||DIGS.x!==h.x||DIGS.y!==h.y||DIGS.z!==h.z)DIGS={x:h.x,y:h.y,z:h.z,t:0,d:(BT[b].d||.5)*(SV.armor?.8:1),snd:0};
 DIGS.t+=G.fast?dt*6:dt;if(T-DIGS.snd>.22){DIGS.snd=T;SFX.dig()}CRACK.visible=true;CRACK.position.set(h.x+.5,h.y+.5,h.z+.5);CRACK.material.map=CRT[Math.min(4,Math.floor(DIGS.t/DIGS.d*5))];
 if(DIGS.t>=DIGS.d){CRACK.visible=false;breakBlock(h.x,h.y,h.z);DIGS=null}}
function breakBlock(x,y,z){const b=vget(x,y,z);if(!b||BT[b].hard)return;cubeBurst(x,y,z,b,12);setBlock(x,y,z,0);
 const dr=BT[b].drop;if(dr==='dia'){SV.dia++;SFX.gem();if(Math.abs(z-TZ)<=1&&MW.includes(x)){SV.f['cd'+x]=1}EV('dia')}else invAdd(dr||b,1);
 const pi=SV.placed.findIndex(q=>q[0]===x&&q[1]===y&&q[2]===z);if(pi>=0)SV.placed.splice(pi,1);EV('dig')}
function doPlace(){if(TASK)return;const h=AIM;if(!h){hint('t_far');return}const t=SV.sel;if(t==null||!inv(t)){hint('t_noblk');return}
 const x=h.x+h.n[0],y=h.y+h.n[1],z=h.z+h.n[2];const c=vget(x,y,z);if(c!==0&&!BT[c].fluid)return;
 if(x>=RIV.x0&&x<=RIV.x1&&SV.z<2){hint('t_water');return}if(BT[c].fluid&&SV.z<2){hint('t_water');return}
 if(x>barrierX()+.4){hint('lock');return}
 for(const e of ENTS){if(e.hide&&e!==PL)continue;if(e===GRN||e===DOG)continue;if(x+1>e.p.x-e.hw&&x<e.p.x+e.hw&&z+1>e.p.z-e.hw&&z<e.p.z+e.hw&&y+1>e.p.y&&y<e.p.y+e.h){return}}
 setBlock(x,y,z,t);for(const e of[GRN,DOG])if(x+1>e.p.x-e.hw&&x<e.p.x+e.hw&&z+1>e.p.z-e.hw&&z<e.p.z+e.hw&&y+1>e.p.y&&y<e.p.y+e.h)e.p.y=y+1;invAdd(t,-1);SFX.place();SV.placed.push([x,y,z,t]);if(SV.placed.length>200)SV.placed.shift();EV('place',{x,y,z})}
function undoBlock(){if(TASK)return;const q=SV.placed.pop();if(!q){SFX.bad();return}const[x,y,z,t]=q;if(vget(x,y,z)===t){cubeBurst(x,y,z,t,6);setBlock(x,y,z,0);invAdd(t,1);SFX.dig()}save();EV('undo')}
const EVL={};function EV(k,a){(EVL[k]||[]).forEach(f=>f(a))}function onEV(k,f){(EVL[k]=EVL[k]||[]).push(f)}
// ---- монстры ночью ----
function spawnMonster(kind,x,z,y){const e=mkEnt(kind,x,z,{h:kind==='spider'?.9:1.8,hw:kind==='spider'?.45:.3});if(y!=null){e.p.y=y;placeEnt(e)}e.speed=1.7;MON.push(e);return e}
function monsterDone(){DAY.kills++;DAY.spawn=10}
function stepMonsters(dt){for(const e of MON.slice()){if(!ENTS.includes(e)){MON.splice(MON.indexOf(e),1);continue}if(e.task)continue;
  const dx=PL.p.x-e.p.x,dz=PL.p.z-e.p.z,d=Math.hypot(dx,dz)||1;let mx=dx/d,mz=dz/d;if(e.flee>0){e.flee-=dt;mx=-mx;mz=-mz}
  if(!DAY.night&&!e.fixed){mx=-mx;mz=-mz;e.gone=(e.gone||0)+dt;if(e.gone>3){rmEnt(e);continue}}
  physEnt(e,dt,d>2.6||e.flee>0?mx:0,d>2.6||e.flee>0?mz:0,false);animEnt(e,dt);
  if(d<3.2&&!TASK&&!(e.flee>0)&&(DAY.night||e.fixed)&&Math.abs(PL.p.y-e.p.y)<2.5)openTask(e.kind,e)}}
// место для монстра: на том же уровне, что и Блоки (в туннеле — по туннелю), 6–10 блоков, есть место над головой, не в воде
function spawnSpot(){const py=Math.round(PL.p.y);let roof=false;for(let k=2;k<6;k++)if(solidT(vget(Math.floor(PL.p.x),Math.floor(PL.p.y)+k,Math.floor(PL.p.z))))roof=true;
 for(let i=0;i<40;i++){const a=roof?(i%2?1:-1)*Math.PI/2:i<8?(i%2?1:-1)*Math.PI/2+(Math.random()-.5)*.3:Math.random()*6.28,r=roof?5+Math.random()*3:6+Math.random()*4;
  const x=clamp(PL.p.x+Math.sin(a)*r,1,barrierX()-1),z=roof?PL.p.z:clamp(PL.p.z+Math.cos(a)*r,2,WZ-3);if(x>RIV.x0-1&&x<RIV.x1+1)continue;
  const y=groundAt(x,z,py+1.5);if(Math.abs(y-PL.p.y)>1.01)continue;const X_=Math.floor(x),Z_=Math.floor(z);if(vget(X_,y,Z_)||vget(X_,y+1,Z_)||BT[vget(X_,y-1,Z_)].fluid)continue;
  let ok=true;const n=Math.ceil(r);for(let k=1;k<n;k++){const qx=Math.floor(PL.p.x+(x-PL.p.x)*k/n),qz=Math.floor(PL.p.z+(z-PL.p.z)*k/n);const gy=groundAt(qx+.5,qz+.5,py+1.5);if(Math.abs(gy-PL.p.y)>1.01||vget(qx,gy+1,qz)){ok=false;break}}if(ok)return[x+0,y,z]}return null}
function stepDay(dt){if(SV.mw<1){DAY.night=false;return}DAY.t+=dt;const L=DAY.night?NIGHTLEN:DAYLEN;if(DAY.t>L){DAY.t=0;DAY.night=!DAY.night;if(DAY.night)say('n1').catch(()=>{});else say('n2').catch(()=>{})}
 if(DAY.night&&!TASK){DAY.spawn-=dt;if(DAY.spawn<=0&&MON.filter(m=>!m.fixed).length<1){const sp=spawnSpot();if(sp){DAY.spawn=18;spawnMonster(DAY.next,sp[0],sp[2],sp[1]);DAY.next=DAY.next==='spider'?'zombie':'spider'}else DAY.spawn=1}}}
function nightK(){if(!DAY.night){const k=DAY.t>DAYLEN-6?(DAY.t-(DAYLEN-6))/6:0;return clamp(k,0,1)*.9}const k=DAY.t<4?DAY.t/4:DAY.t>NIGHTLEN-5?(NIGHTLEN-DAY.t)/5:1;return .9*clamp(k,0,1)+.0}
// ---- спутники: идут следом, при разговоре поворачиваются к ребёнку ----
// место спутника — сбоку от Блоки и чуть дальше от камеры (никогда между камерой и Блоки)
function followSpot(off){const ty=CAMS.yaw,fx=Math.sin(ty),fz=Math.cos(ty),rx=-Math.cos(ty),rz=Math.sin(ty);let tx=PL.p.x+fx*off[0]+rx*off[1],tz=PL.p.z+fz*off[0]+rz*off[1];
 const gy=groundAt(tx,tz,PL.p.y+1.5);if(Math.abs(gy-PL.p.y)>1.2||solidT(vget(Math.floor(tx),gy+1,Math.floor(tz)))){tx=PL.p.x+fx*off[0]*2.2+rx*off[1]*.35;tz=PL.p.z+fz*off[0]*2.2+rz*off[1]*.35}return[tx,tz]}
function follow(e,off,dt){const[tx,tz]=followSpot(off);
 const dx=tx-e.p.x,dz=tz-e.p.z,d=Math.hypot(dx,dz);const far=Math.hypot(PL.p.x-e.p.x,PL.p.z-e.p.z)>11||Math.abs(PL.p.y-e.p.y)>5;
 if(far&&PL.onG){e.p.set(clamp(tx,.6,barrierX()),groundAt(tx,tz,PL.p.y+2),tz);e.v.set(0,0,0);e.stuck=0}
 let mx=0,mz=0;if(d>.9&&!TASK){mx=dx/d*Math.min(1,d/2);mz=dz/d*Math.min(1,d/2)}const x0=e.p.x,z0=e.p.z;physEnt(e,dt,mx,mz,false);
 if((mx||mz)&&Math.hypot(e.p.x-x0,e.p.z-z0)<.004)e.stuck=(e.stuck||0)+dt;else e.stuck=0;if(e.stuck>1.5){e.p.set(tx,groundAt(tx,tz,PL.p.y+1.5),tz);e.stuck=0}
 if(TASK||(talk&&WHO[talk.who]!=null&&e===({gran:GRN,pixel:DOG})[talk.who])||d<.95){if(!(mx||mz))e.ty=Math.atan2(CAM.position.x-e.p.x,CAM.position.z-e.p.z)}animEnt(e,dt)}
// ---- станции: подошёл — открылось задание ----
const STIN={};
function stations(){const L=[],p=PL.p;const near=(x,z,r)=>Math.hypot(p.x-x,p.z-z)<r&&Math.abs(p.y-(GY+1))<2.2;
 if(SV.z===0&&SV.f.tut&&SV.mw<3){const c=MW[SV.mw];L.push({id:'mw',arg:SV.mw,near:p.x>c-2.4&&p.x<c&&Math.abs(p.z-TZ-.5)<1.6&&p.y<GY+3})}
 if(SV.z===1&&SV.mw>=3)L.push({id:'river',near:near(SPOTS.river[0],SPOTS.river[1],2.6)});if(SV.z===2)L.push({id:'forge',near:near(SPOTS.forge[0],SPOTS.forge[1],2.4)});
 if(SV.z===3)L.push({id:'desert',near:near(SPOTS.desert[0],SPOTS.desert[1],2.6)});if(SV.z===4)L.push({id:'castle',near:near(SPOTS.castle[0],SPOTS.castle[1],2.8)});
 CHESTS.forEach((c,i)=>{if(SV.st[i])return;const open=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].some(([a,b,d])=>!opaqueT(vget(c.x+a,c.y+b,c.z+d)))&&vget(c.x,c.y,c.z)===0;
  L.push({id:'chest',arg:i,key:'chest'+i,near:open&&Math.hypot(c.x+.5-p.x,c.z+.5-p.z)<2.2&&Math.abs(c.y-p.y)<3.5})});return L}
function stepStations(){for(const s of stations()){const k=s.key||s.id;if(TASK)continue;const was=STIN[k];STIN[k]=s.near;if(s.near&&!was)openTask(s.id,s.arg)}}
// сюжетные подсказки
function stepStory(){const f=SV.f;
 if(!f.t1){f.t1=1;say('t1').catch(()=>{});setTimeout(()=>{if(!SV.f.tl&&scene==='world'){SV.f.tl=1;say('t_look').catch(()=>{})}},9000)}
 if(!f.t2&&Math.hypot(PL.p.x-GRN.p.x,PL.p.z-GRN.p.z)<2.6){f.t2=1;say('t2').catch(()=>{})}
 if(!f.m0&&PL.p.x>31&&PL.p.x<36&&Math.abs(PL.p.z-TZ-.5)<2){f.m0=1;f.tut=1;save();say('m0').catch(()=>{})}
 if(SV.mw>=3&&!f.mdone&&(MW.every(x=>f['cd'+x])||PL.p.x>61)){f.mdone=1;save();say('m_done').catch(()=>{})}
 if(!f.sp1&&SV.mw>=1&&PL.p.x>42&&PL.p.x<47&&!TASK&&!MON.some(m=>m.fixed&&m.kind==='spider')){const e=spawnMonster('spider',46.5,TZ+.5);e.fixed=1;f.sp1q=1}
 if(!f.zb1&&SV.mw>=3&&PL.p.x>62&&PL.p.x<64.5&&!TASK&&!MON.some(m=>m.kind==='zombie')){const e=spawnMonster('zombie',PL.p.x-6,TZ+3.5);e.fixed=1}
 const inPlot=PL.p.x>HOUSEP.x0-2&&PL.p.x<HOUSEP.x1+2&&PL.p.z>HOUSEP.z0-2&&PL.p.z<HOUSEP.z1+2;if(inPlot&&!f.house){f.house=1;save();say('house').catch(()=>{})}
 if(!SV.house){let n=0;for(const q of SV.placed)if(q[0]>=HOUSEP.x0&&q[0]<=HOUSEP.x1&&q[2]>=HOUSEP.z0&&q[2]<=HOUSEP.z1)n++;if(n>=12){SV.house=1;save(1);SFX.star();say('house_ok').catch(()=>{})}}}
onEV('dig',()=>{if(!SV.f.t3){SV.f.t3=1;save();say('t3').catch(()=>{})}});
onEV('place',()=>{if(!SV.f.tv){SV.f.tv=1;say('t_view').catch(()=>{});say('t_undo').catch(()=>{});setTimeout(()=>{if(!SV.f.t4){SV.f.t4=1;SV.f.tut=1;save();say('t4').catch(()=>{})}},200)}});
// ---- рендер мира + HUD ----
function render3d(dt){if(!REN)return;for(const e of ENTS){if(e.hide)continue;const dx=e.p.x-CAM.position.x,dy=e.p.y+e.h*.5-CAM.position.y,dz=e.p.z-CAM.position.z;e.obj.visible=Math.hypot(dx,dy,dz)>1.5}stepSky(dt,nightK());stepChunks(2);stepCubes(dt);
 for(const c of CHUNK){if(!c)continue;const cx=c.cx*CH+8,cz=c.cz*CH+8;const d=Math.hypot(cx-CAM.position.x,cz-CAM.position.z);const v=d<62;c.m.visible=v;if(c.w)c.w.visible=v}
 OUTL.visible=!!AIM&&scene==='world'&&!TASK;if(AIM)OUTL.position.set(AIM.x+.5,AIM.y+.5,AIM.z+.5);
 CHESTM.forEach((m,i)=>{m.visible=!SV.st[i];m.userData.lid.rotation.x=0});
 // слабый компьютер: меньше пикселей
 if(fpsA<24&&PR>1&&T>4){PR=1;resize3d()}
 REN.render(SCENE,CAM)}
function counters(){const s=safeV();let x=s.x0+130;const y=s.y0+44;drawImg('diamond',x+22,y,44);txt(String(SV.dia),x+62,y+2,40,'#fff',{al:'left'});x+=120;drawImg('star',x+22,y,46);txt(String(SV.st.reduce((a,b)=>a+b,0)+(SV.house?1:0)),x+62,y+2,40,'#fff',{al:'left'});if(SV.armor){drawImg('armor',x+140,y,46)}}
function hud(){const s=safeV();drawBtn('b_home',s.x0+58,s.y0+58,104);btn('home',s.x0+58,s.y0+58,104,104,()=>go('title'));counters();
 drawBtn('b_eye',s.x1-58,s.y0+58,104,{sel:CAMS.fp});btn('view',s.x1-58,s.y0+58,104,104,toggleView);
 drawBtn('b_undo',s.x1-178,s.y0+58,104,{alpha:SV.placed.length?1:.5});btn('undo',s.x1-178,s.y0+58,104,104,undoBlock);
 // джойстик
 const jx=JOY.on?JOY.bx:s.x0+175,jy=JOY.on?JOY.by:s.y1-175;X.save();X.globalAlpha=.5;X.fillStyle='#1a1414';X.beginPath();X.arc(jx,jy,128,0,6.283);X.fill();X.globalAlpha=.75;X.strokeStyle='#d0d0d0';X.lineWidth=8;X.stroke();X.globalAlpha=.95;
 const kx=jx+JOY.vx*84,ky=jy+JOY.vy*84;const ti=IM.t_cobble;X.beginPath();X.arc(kx,ky,62,0,6.283);X.fillStyle=ok(ti)?pat('cobble'):'#888';X.fill();X.lineWidth=6;X.strokeStyle='#141414';X.stroke();X.restore();
 drawBtn('b_up',s.x1-100,s.y1-100,170,{on:held('jump')});btn('jump',s.x1-100,s.y1-100,170,170,null,{hold:1});
 drawBtn('b_dig',s.x1-285,s.y1-88,150,{on:held('dig')});btn('dig',s.x1-285,s.y1-88,150,150,null,{hold:1});
 drawBtn('b_place',s.x1-100,s.y1-282,150);btn('place',s.x1-100,s.y1-282,150,150,doPlace);
 // сумка с блоками
 const ks=hotKeys();const x0=s.x0+340,x1=s.x1-370;const nmax=Math.max(1,Math.floor((x1-x0)/112));const show=ks.slice(0,nmax);
 show.forEach((k,i)=>{const cx=(x0+x1)/2+(i-(show.length-1)/2)*112,cy=s.y1-70;nine('tab_grey',cx-52,cy-52,104,104);const ti=IM['t_'+(BT[k].t[0]==='grass'?'grass':BT[k].t[0])];if(ok(ti)){X.imageSmoothingEnabled=false;X.drawImage(ti,cx-32,cy-36,64,64);X.imageSmoothingEnabled=true}
  txt(String(inv(k)),cx+28,cy+30,30,'#fff');if(SV.sel===k){X.save();X.strokeStyle='#ffe066';X.lineWidth=7;X.strokeRect(cx-56,cy-56,112,112);X.restore()}btn('inv'+k,cx,cy,104,104,()=>{SV.sel=k;SFX.click()})});
 // прицел
 if(CAMS.fp){X.save();X.strokeStyle='#fff';X.lineWidth=5;X.shadowColor='#000';X.shadowBlur=4;X.beginPath();X.moveTo(640-18,360);X.lineTo(640+18,360);X.moveTo(640,342);X.lineTo(640,378);X.stroke();X.restore()}
 // табличка «Твой дом» над участком
 const sp=scr((HOUSEP.x0+HOUSEP.x1)/2+.5,GY+3.2,HOUSEP.z0);if(sp[2]){const v=vis();const d=Math.hypot(PL.p.x-HOUSEP.x0,PL.p.z-HOUSEP.z0);if(d<22&&sp[0]>v.x0+150&&sp[0]<v.x0+v.w-150&&sp[1]>v.y0+150&&sp[1]<v.y0+v.h-220){const bw=230,bh=80;const b=nine('board',sp[0]-bw/2,sp[1]-bh/2,bw,bh);if(b)fitText('Твой дом',b,40,'#fff',{one:1})}}}
// ---- сцена мира ----
SC.world={skipOnTalk:0,enter(){setupWorld();for(const k in STIN)delete STIN[k];stations().forEach(s=>{STIN[s.key||s.id]=s.near});DAY.t=0;DAY.night=false},
 update(dt){if(!PL)return;
  if(TASK){if(TASK.def.update)TASK.def.update(TASK,dt);physEnt(PL,dt,0,0,false);animEnt(PL,dt)}
  else{let jx=JOY.vx,jy=JOY.vy;const kf=(KEYS.fw?1:0)-(KEYS.bk?1:0),kr=(KEYS.rt?1:0)-(KEYS.lf?1:0);if(kf||kr){jx=kr;jy=-kf}
   const m=Math.min(1,Math.hypot(jx,jy));let mx=0,mz=0;if(m>.12){const f=-jy,r=jx;const yw=CAMS.yaw;mx=(Math.sin(yw)*f-Math.cos(yw)*r);mz=(Math.cos(yw)*f+Math.sin(yw)*r);const n=Math.hypot(mx,mz)||1;mx=mx/n*m;mz=mz/n*m}
   const bx=barrierX();if(PL.p.x>bx-.05&&mx>0){mx=0;hint(SV.mw>=3&&SV.z<2?'t_water':'lock')}
   physEnt(PL,dt,mx,mz,held('jump'));if(PL.p.x>bx)PL.p.x=bx;if(CAMS.fp)PL.ty=CAMS.yaw;animEnt(PL,dt);
   // вода — выталкивает на берег
   if(BT[vget(Math.floor(PL.p.x),Math.floor(PL.p.y+.2),Math.floor(PL.p.z))].fluid&&SV.z<2){PL.p.x-=dt*3;hint('t_water')}
   stepStations();stepStory();stepDay(dt)}
  follow(GRN,[.6,-1.7],dt);follow(DOG,[.5,1.6],dt);KR.ty=Math.atan2(PL.p.x-KR.p.x,PL.p.z-KR.p.z);physEnt(KR,dt,0,0,false);animEnt(KR,dt);KR.hide=SV.z>=5;
  stepMonsters(dt);stepCam(dt);AIM=TASK?null:curAim();stepDig(dt);
  if(!TASK){SV.px=[PL.p.x,PL.p.z];}},
 draw(){render3d(DT);if(TASK&&TASK.def.draw)TASK.def.draw(TASK)},
 ui(){if(TASK){TASK.def.ui&&TASK.def.ui(TASK);return}hud()},
 down(x,y,id){if(TASK){if(TASK.id==='spider'){TD.spider.drag(TASK,x,y)}return false}
  const v=vis();if(x<v.x0+v.w*.42&&y>v.y0+v.h*.35){JOY.on=true;JOY.id=id;JOY.bx=x;JOY.by=y;JOY.vx=JOY.vy=0;return true}
  LOOK.id=id;LOOK.x=x;LOOK.y=y;LOOK.t0=T;LOOK.moved=0;return true},
 move(x,y,id){if(TASK&&TASK.id==='spider'&&id!==JOY.id){return}
  if(id===JOY.id&&JOY.on){const dx=x-JOY.bx,dy=y-JOY.by,d=Math.hypot(dx,dy),r=100;const k=d>r?r/d:1;JOY.vx=dx*k/r;JOY.vy=dy*k/r;return}
  if(id===LOOK.id){const dx=x-LOOK.x,dy=y-LOOK.y;LOOK.moved+=Math.abs(dx)+Math.abs(dy);LOOK.x=x;LOOK.y=y;CAMS.yaw-=dx*.0062;CAMS.pitch=clamp(CAMS.pitch-dy*.0052,-1.3,CAMS.fp?1.3:.6)}},
 up(id){if(id===JOY.id){JOY.on=false;JOY.id=null;JOY.vx=JOY.vy=0}if(id===LOOK.id){if(LOOK.moved<14&&T-LOOK.t0<.4)tapWorld(LOOK.x,LOOK.y);LOOK.id=null}},
 tap(x,y){if(TASK&&TASK.id==='spider')TD.spider.drag(TASK,x,y);else if(TASK)tapWorld(x,y)}};
// ---- заставка / знакомство / финал: 3D-мир, герои стоят и смотрят на ребёнка ----
function lineup(names,x,z,yaw){const ents={bloki:PL,gran:GRN,pixel:DOG,krivo:KR};const n=names.length;names.forEach((nm,i)=>{const e=ents[nm];const off=(i-(n-1)/2)*1.35;e.p.set(x-Math.cos(yaw)*off*0+Math.sin(yaw+Math.PI/2)*off,0,z+Math.cos(yaw+Math.PI/2)*off);e.p.y=groundTop(e.p.x,e.p.z);e.v.set(0,0,0);e.ty=e.yaw=yaw;e.hide=false;placeEnt(e)});
 ['bloki','gran','pixel','krivo'].forEach(nm=>{if(!names.includes(nm))ents[nm].hide=true})}
function showScene(names,x,z,camDist,camH){if(!WORLD_READY||!PL)setupWorld();const yaw=-Math.PI/2;lineup(names,x,z,yaw);CAMS.fp=false;focusAt(x,GY+1+(camH||1.25),z+.5,Math.PI/2,-.06,camDist||6.2);stepCam(0,true)}
function idleScene(dt){for(const e of[PL,GRN,DOG,KR]){if(e.hide)continue;e.walk=0;e.ty=Math.atan2(CAM.position.x-e.p.x,CAM.position.z-e.p.z);if(talk&&({bloki:PL,gran:GRN,pixel:DOG,krivo:KR})[talk.who]===e){e.walk=.25}animEnt(e,dt)}stepCam(dt)}
SC.title={enter(){showScene(['bloki','gran','pixel'],12.5,TZ,6.4,1.3)},update(dt){idleScene(dt);CAMS.focus.yaw=Math.PI/2+Math.sin(T*.25)*.25},draw(){render3d(DT);const s=safeV();
  const lw=Math.min(860,s.x1-s.x0-40),lh=Math.min(170,lw*.2);const lb=nine('board',(s.x0+s.x1)/2-lw/2,s.y0,lw,lh);if(lb){fitText('Кубический мир',[lb[0],lb[1],lb[2],lb[3]*.58],80,'#ffe066',{one:1});fitText('тайна треугольников',[lb[0],lb[1]+lb[3]*.6,lb[2],lb[3]*.38],42,'#fff',{one:1})}},
 ui(){const s=safeV();const cx=s.x1-130,cy=s.y1-190;drawBtn('b_ok',cx,cy,180,{pulse:1});btn('play',cx,cy,180,180,()=>{go(SV.f.intro?'world':'intro')});
  const tb=nine('board',cx-120,cy+96,240,80);if(tb)fitText(SV.z||SV.f.intro?'Дальше':'Играть',tb,44,'#fff',{one:1});
  if(SV.f.intro){const rx=s.x0+120,ry=s.y1-90;tabBtn('reset',rx,ry,220,96,'Заново',()=>{SV=freshSV();save(1);go('intro')},{fs:36,one:1})}}};
const INTRO=['i1','i2','i3','i4','i5','i6'];
SC.intro={skipOnTalk:1,enter(){showScene(['bloki','gran','pixel'],12.5,TZ,6.4,1.3);const c=ctxNow();this.k=0;run(async()=>{for(let i=0;i<INTRO.length;i++){this.k=i;if(INTRO[i]==='i5')showScene(['bloki','gran','pixel','krivo'],12.5,TZ,7.4,1.4);await say(INTRO[i],c)}await wait(300,c);SV.f.intro=1;save(1);go('world')})},
 update(dt){idleScene(dt)},draw(){render3d(DT)},
 ui(){const s=safeV();drawBtn('b_right',s.x1-80,s.y1-80,130);btn('skip',s.x1-80,s.y1-80,130,130,()=>{SV.f.intro=1;save(1);go('world')})}};
SC.fin={skipOnTalk:1,enter(){showScene(['bloki','gran','pixel','krivo'],158,TZ,7.6,1.4);const c=ctxNow();run(async()=>{for(const k of['f1','f2','f3','f4'])await say(k,c)})},
 update(dt){idleScene(dt);if(Math.random()<.06){const v=vis();sparks(rnd(v.x0+100,v.x0+v.w-100),rnd(v.y0+150,v.y0+v.h*.45),18,pick(['#ffe066','#ff7a3a','#7ad04a','#5fd0ff','#ff6ad0']))}},
 draw(){render3d(DT);drawParticles(0,0);const s=safeV();const w=Math.min(760,s.x1-s.x0-40),h=96;const b=nine('board',(s.x0+s.x1)/2-w/2,s.y0+140,w,h);if(b){const n=SV.st.reduce((a,b)=>a+b,0)+(SV.house?1:0);fitText('Победа!  Звёзды: '+n+' из 5   Алмазы: '+SV.dia,b,44,'#ffe066',{one:1})}},
 ui(){const s=safeV();drawBtn('b_home',s.x0+80,s.y1-80,130);btn('home',s.x0+80,s.y1-80,130,130,()=>go('title'));drawBtn('b_ok',s.x1-80,s.y1-80,130);btn('world',s.x1-80,s.y1-80,130,130,()=>go('world'))}};
// ---- проверочные крючки для тестов ----
G.task=()=>TASK?{id:TASK.id,r:TASK.r,mist:TASK.mist,lock:TASK.lock,aim:TASK.aim,a:TASK.a}:null;G.ans=good=>TASK&&TASK.def.ans?TASK.def.ans(TASK,good):[];
G.open=(id,arg)=>{openTask(id,arg);return G.task()};G.close=()=>closeTask();
G.tp=(x,z,y)=>{PL.p.set(x,y!=null?y:groundTop(x,z),z);PL.v.set(0,0,0);[GRN,DOG].forEach((e,i)=>{e.p.set(x-1-i*.5,groundAt(x-1-i*.5,z+1,PL.p.y+2),z+1)});stepCam(0,true)};
G.P=()=>({x:PL.p.x,y:PL.p.y,z:PL.p.z,onG:PL.onG,inv:SV.inv,sel:SV.sel,z_:SV.z,dia:SV.dia,mw:SV.mw,placed:SV.placed.length,st:SV.st,house:SV.house});
G.vget=(x,y,z)=>vget(x,y,z);G.aim=()=>AIM?{x:AIM.x,y:AIM.y,z:AIM.z,n:AIM.n,b:vget(AIM.x,AIM.y,AIM.z)}:null;
G.look=(yaw,pitch)=>{CAMS.yaw=yaw;CAMS.pitch=pitch;stepCam(0,true)};
G.blockXY=(x,y,z)=>{const c=CAM.position,ctr=[x+.5,y+.5,z+.5],cp=[c.x,c.y,c.z];let best=null,bd=-2;for(let a=0;a<3;a++)for(const sg of[-1,1]){const nb=[x,y,z];nb[a]+=sg;if(solidT(vget(nb[0],nb[1],nb[2])))continue;const f=ctr.slice();f[a]+=sg*.48;const dv=[cp[0]-f[0],cp[1]-f[1],cp[2]-f[2]];const cs=dv[a]*sg/Math.hypot(...dv);if(cs>bd){bd=cs;best=f}}if(!best)best=ctr;const p=new T3.Vector3(best[0],best[1],best[2]).project(CAM);return{x:(p.x+1)/2*W,y:(1-p.y)/2*H,vis:p.z<1}};
G.roof=()=>ROOF.map(([x,y,z])=>{const p=new T3.Vector3(x+.5,y+.5,z+.5).project(CAM);return{x:(p.x+1)/2*W,y:(1-p.y)/2*H}});
G.night=k=>{DAY.night=true;DAY.t=5;openTask(k);return G.task()};G.day=()=>{DAY.night=false;DAY.t=0};
G.zone=k=>{SV=freshSV();SV.f={intro:1,t1:1,t2:1,t3:1,tut:1,m0:1,tl:1,tv:1,t4:1,mdone:1};SV.inv={2:6,3:4};SV.sel=2;if(k>=2){SV.mw=3;SV.dia=3;SV.z=1;SV.f.sp1=1}if(k>=3){SV.z=2;SV.f.zb1=1;SV.f.r0=1}if(k>=4){SV.z=3;SV.armor=1}if(k>=5)SV.z=4;
 const sp={1:[30,TZ+.5],2:[61,TZ+.5],3:[88,TZ+.5],4:[116,TZ+.5],5:[150,TZ+.5]}[k];SV.px=sp;save(1);go('world');G.tp(sp[0],sp[1]);return SV.z};
G.ents=()=>ENTS.map(e=>({k:e.kind,x:e.p.x,y:e.p.y,z:e.p.z,onG:e.onG,hide:e.hide,gnd:Math.max(...[[-1,-1],[-1,1],[1,-1],[1,1],[0,0]].map(([a,b])=>groundAt(e.p.x+a*e.hw*.95,e.p.z+b*e.hw*.95,e.p.y+.5))),sc:[e.m.scale.x,e.m.scale.y,e.m.scale.z]}));
G.chunks=()=>CHUNK.filter(Boolean).length;G.tris=()=>REN?REN.info.render.triangles:0;
G.go=n=>go(n);
