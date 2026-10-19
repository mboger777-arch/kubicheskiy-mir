'use strict';
// ===== Задания зон в 3D-мире, встречи с монстрами, сундуки (панели и транспортир поверх 3D) =====
let TASK=null;const TD={};
function openTask(id,arg){if(TASK)closeTask(true);EPOCH++;stopTalk();for(const k in HOLD)delete HOLD[k];DIGS=null;JOY.on=false;
 TASK={id,def:TD[id],r:0,mist:0,lock:false,done:false,ep:EPOCH,t0:T,wob:{},arg};TASK.def.enter(TASK,arg);return TASK}
function closeTask(quiet){if(!TASK)return;const t=TASK;t.done=true;TASK=null;EPOCH++;CAMS.focus=null;if(t.def.leave)t.def.leave(t,quiet)}
function win(t,fn){t.lock=true;const c={ep:t.ep};run(async()=>{try{await fn(c)}finally{t.lock=false}})}
function mistake(t,id,hk){t.mist++;t.wob[id]=T;SFX.bad();shake=5;if(hk)sayNow(hk)}
const TYPEN={ac:'ОСТРЫЙ',rt:'ПРЯМОЙ',ob:'ТУПОЙ'},HINT={ac:'h_ac',rt:'h_rt',ob:'h_ob'};
const typeOf=a=>a<90?'ac':a>90?'ob':'rt';
function layout(){const s=safeV();const top=s.y0+128,bot=s.y1-166;const pw=Math.min(1120,s.x1-s.x0-40);return{s,cx:(s.x0+s.x1)/2,top,bot,pw,ph:bot-top,optY:s.y1-92}}
function panel(n,o){o=o||{};const L=layout();const w=o.w?Math.min(L.pw,o.w):L.pw;const x=o.x!=null?o.x:L.cx-w/2;return nine(n||'tab_grey',x,L.top,w,L.ph,o.alpha)}
function optRow(t,opts,fn,o){o=o||{};const L=layout();const n=opts.length,gap=26,w=Math.min(o.w||360,(L.s.x1-L.s.x0-80-gap*(n-1))/n),h=o.h||128;
 const inW=w*.8-8,inH=h*.62;const fs=Math.min(o.fs||48,...opts.filter(op=>op.label!=null).map(op=>oneSize(op.label,inW,inH,o.fs||48)));
 const cx0=o.cx!=null?o.cx:L.cx;opts.forEach((op,i)=>{const cx=cx0+(i-(n-1)/2)*(w+gap);tabBtn(op.id,cx,L.optY,w,h,op.label,()=>fn(op.id),{tab:o.tab,wob:t.wob[op.id],draw:op.draw,fs,one:1,sel:op.sel})})}
function backBtn(){const s=safeV();drawBtn('b_left',s.x0+58,s.y0+58,104);btn('back',s.x0+58,s.y0+58,104,104,()=>{closeTask()})}
// камера смотрит на место задания: t — точка, yaw/pitch — направление, dist — расстояние
// паук виден даже сквозь стену туннеля (во время задания)
function xray(e,on){e.obj.traverse(c=>{if(!c.material)return;if(on&&!c._xr){c._xr=1;c.material=Array.isArray(c.material)?c.material.map(q=>q.clone()):c.material.clone()}if(c._xr)(Array.isArray(c.material)?c.material:[c.material]).forEach(m=>{m.depthTest=!on;m.needsUpdate=true});c.renderOrder=on?10:0})}
function focusAt(x,y,z,yaw,pitch,dist,alts){let best=null;for(const yw of[yaw].concat(alts||[])){const dir=new T3.Vector3(-Math.sin(yw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yw)*Math.cos(pitch));const h=rayVox(new T3.Vector3(x,y,z),dir,dist,b=>opaqueT(b));const d=h?h.t:dist;if(!best||d>best.d+.4)best={yw,d};if(d>=dist*.85)break}
 CAMS.focus={t:[x,y,z],yaw:best.yw,pitch,dist}}
// экранная точка (дизайн-координаты) для точки мира
function scr(x,y,z){const v=new T3.Vector3(x,y,z).project(CAM);return[((v.x+1)/2*W-OX)/S,((1-v.y)/2*H-OY)/S,v.z<1]}
// простые 3D-предметы
const MATC={};function texMat(n,o){const k=n+(o&&o.op||'');if(MATC[k])return MATC[k];const im=IM['t_'+n]||IM[n];const t=new T3.Texture(im);t.needsUpdate=true;t.magFilter=t.minFilter=T3.NearestFilter;t.generateMipmaps=false;t.colorSpace=T3.SRGBColorSpace;t.wrapS=t.wrapT=T3.RepeatWrapping;
 return MATC[k]=new T3.MeshLambertMaterial({map:t,transparent:!!(o&&o.op),opacity:o&&o.op||1})}
function beam(a,b,th,mat){const d=new T3.Vector3().subVectors(b,a);const L=d.length();const g=new T3.BoxGeometry(th,L+th,th);const m=new T3.Mesh(g,mat||texMat('log'));m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),d.clone().normalize());return m}
// ===================== 1. ШАХТА: угол поворота туннеля =====================
TD.mw={enter(t,i){t.i=i;t.type=['ac','ob','rt'][i];t.a=t.type==='ac'?pick([40,50,60,70]):t.type==='ob'?pick([110,120,130,140]):90;t.a0=pick([0,10,20]);focusAt(MW[i]-.2,GY+2.2,TZ+.5,Math.PI/2,-.12,4.2);say('m_q').catch(()=>{})},
 draw(t){const L=layout();const b=panel('tab_grey',{w:820,alpha:.93});if(!b)return;const[x,y,w,h]=b;const R=Math.min(h*.62,w*.26),cx=x+w*.36,cy=y+h*.84;
  angleRays(cx,cy,R*1.55,t.a0,t.a0+t.a,{tex:'stone',th:Math.max(34,R*.28),ar:R*.42});protractor(cx,cy,R,{alpha:.8});
  const bx=x+w*.8,bw=Math.min(w*.3,280),bh=Math.min(h*.5,170);const ib=nine('tab_sand',bx-bw/2,y+h/2-bh/2,bw,bh);if(ib)fitText(t.a+'°',ib,110,'#fff',{one:1})},
 ui(t){backBtn();optRow(t,['ac','rt','ob'].map(k=>({id:k,label:TYPEN[k]})),id=>TD.mw.pick(t,id))},
 pick(t,id){if(id!==t.type)return mistake(t,id,HINT[t.type]);SFX.ok();
  win(t,async c=>{const wx_=MW[t.i];for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)cubeBurst(wx_,y,z,B.crystal,4);await wait(500,c);
   SV.mw=Math.max(SV.mw,t.i+1);for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)vset(wx_,y,z,0);vset(wx_,GY+1,TZ,B.dia);if(SV.mw>=3)SV.z=Math.max(SV.z,1);save(1);closeTask();say('m_ok').catch(()=>{});say('b_yes').catch(()=>{})})},
 ans(t,good){return[good?t.type:['ac','rt','ob'].find(k=>k!==t.type)]}};
// ===================== НОЧЬ: паук «острый угол» — лук и транспортир =====================
// паук висит в плоскости экрана под углом a от Блоки; лук поворачивается шагами по 15°
TD.spider={enter(t,ent){const first=!SV.f.sp1;SV.f.sp1=1;save();t.a=first?pick([45,60]):pick([30,45,60,120,135,150]);t.aim=90;t.arrow=null;t.D=3.0;
  t.ent=ent||spawnMonster('spider',PL.p.x+3,PL.p.z);t.ent.task=1;xray(t.ent,true);const o=TD.spider.org(t);let fy=o.y+.7;for(let y=Math.floor(PL.p.y)+1;y<=Math.floor(fy);y++)if(solidT(vget(Math.floor(o.x),y,Math.floor(o.z)))){fy=y-.35;break}focusAt(o.x,fy,o.z,CAMS.yaw,-.05,8.5,[CAMS.yaw+Math.PI,CAMS.yaw+Math.PI/2,CAMS.yaw-Math.PI/2]);t.yaw=CAMS.focus.yaw;
  if(!t.thread){t.thread=new T3.Line(new T3.BufferGeometry().setFromPoints([new T3.Vector3(),new T3.Vector3(0,20,0)]),new T3.LineBasicMaterial({color:0xe8e8ff}));SCENE.add(t.thread)}
  if(first)say('sp_in').catch(()=>{});say('sp_'+t.a).catch(()=>{})},
 org(t){return new T3.Vector3(PL.p.x,PL.p.y+2.35,PL.p.z)},
 right(t){return new T3.Vector3(Math.cos(t.yaw),0,-Math.sin(t.yaw))},
 spPos(t){const o=TD.spider.org(t),r=TD.spider.right(t);const a=t.a*R2D;return o.addScaledVector(r,-Math.cos(a)*t.D).add(new T3.Vector3(0,Math.sin(a)*t.D-.4,0))},
 update(t,dt){const p=TD.spider.spPos(t);const e=t.ent;if(!t.dead){e.p.lerp(p,Math.min(1,dt*4));e.v.set(0,0,0);e.ty=e.yaw=t.yaw+Math.PI;e.walk=.6;placeEnt(e);animEnt(e,dt)}
  t.thread.position.copy(e.p).add(new T3.Vector3(0,.6,0));t.thread.visible=!t.dead},
 draw(t){const o=TD.spider.org(t);const[ox,oy]=scr(o.x,o.y,o.z);const R=150;
  protractor(ox,oy,R,{alpha:.85});const a=t.aim*R2D;rod('stick',ox,oy,ox+Math.cos(-a)*R*1.25,oy+Math.sin(-a)*R*1.25,14);drawImg('arrow',ox+Math.cos(-a)*R*1.3,oy+Math.sin(-a)*R*1.3,96,{rot:-a});
  X.save();X.fillStyle='rgba(255,214,64,.4)';X.beginPath();X.moveTo(ox,oy);X.arc(ox,oy,R*.4,-a,0);X.closePath();X.fill();X.restore();
  if(t.arrow){const k=(T-t.arrow.t0)/.45;const d=k*560;const aa=t.arrow.a*R2D;drawImg('arrow',ox+Math.cos(-aa)*d,oy+Math.sin(-aa)*d,96,{rot:-aa})}
  const L=layout(),s=L.s;const bw=210,bh=120;const ib=nine('tab_sand',s.x0+20,s.y1-190-bh,bw,bh);if(ib)fitText(t.aim+'°',ib,90,'#fff',{one:1})},
 ui(t){const L=layout(),s=L.s;drawBtn('b_left',s.x0+90,s.y1-90,160);btn('rl',s.x0+90,s.y1-90,160,160,()=>TD.spider.rot(t,15));drawBtn('b_right',s.x0+270,s.y1-90,160);btn('rr',s.x0+270,s.y1-90,160,160,()=>TD.spider.rot(t,-15));
  drawBtn('b_bow',s.x1-100,s.y1-100,180,{pulse:!t.arrow});btn('fire',s.x1-100,s.y1-100,180,180,()=>TD.spider.fire(t))},
 rot(t,d){if(t.dead)return;t.aim=clamp(t.aim+d,0,180);SFX.click()},
 drag(t,x,y){const o=TD.spider.org(t);const[ox,oy]=scr(o.x,o.y,o.z);const dx=x-ox,dy=oy-y;if(Math.hypot(dx,dy)>330||dy<-30)return;let a=Math.atan2(Math.max(0,dy),dx)/R2D;a=clamp(Math.round(a/15)*15,0,180);if(a!==t.aim){t.aim=a;SFX.click()}},
 fire(t){if(t.arrow&&T-t.arrow.t0<.45)return;SFX.bow();t.arrow={t0:T,a:t.aim};const c={ep:t.ep};
  if(t.aim===t.a){win(t,async c=>{await wait(320,c);t.dead=1;SFX.pop();const p=t.ent.p;cubeBurst(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z),B.bed,16);rmEnt(t.ent);
    await say(t.a<90?'sp_ac':'sp_ob',c).catch(()=>{});await wait(300,c);closeTask();monsterDone()})}
  else{const up=t.aim<t.a;t.mist++;setTimeout(()=>{if(!alive(c))return;t.D=Math.min(t.D+.25,3.8);SFX.bad();sayNow(up?'sp_up':'sp_dn')},250)}},
 leave(t){if(t.thread)SCENE.remove(t.thread);if(!t.dead&&t.ent){xray(t.ent,false);t.ent.task=0;t.ent.flee=4}},
 ans(t,good){if(!good)return['fire'];const n=Math.round((t.a-t.aim)/15);const r=[];for(let i=0;i<Math.abs(n);i++)r.push(n>0?'rl':'rr');r.push('fire');return r}};
// ===================== НОЧЬ: зомби-тупоугольник — стена под прямым углом =====================
TD.zombie={enter(t,ent){const first=!SV.f.zb1;SV.f.zb1=1;save();const sets=[[60,90,120],[45,90,135],[75,90,105]];t.set=shuffle(sets[Math.floor(Math.random()*3)].slice());
  t.ent=ent||spawnMonster('zombie',PL.p.x+5,PL.p.z);t.ent.task=1;const d=new T3.Vector3(t.ent.p.x-PL.p.x,0,t.ent.p.z-PL.p.z);if(d.length()<.5)d.set(1,0,0);d.normalize();t.dir=d;
  t.wallAt=PL.p.clone().addScaledVector(d,1.7);t.wallAt.y=groundAt(t.wallAt.x,t.wallAt.z,PL.p.y+2);t.stop=3.4;t.dist=Math.max(3.6,Math.min(6,Math.hypot(t.ent.p.x-PL.p.x,t.ent.p.z-PL.p.z)));
  const yaw=Math.atan2(d.x,d.z)+Math.PI/2;const mid=PL.p.clone().addScaledVector(d,1.8);const by=Math.atan2(d.x,d.z);focusAt(mid.x,PL.p.y+1.2,mid.z,yaw,-.12,7,[yaw-Math.PI,by-.5,by+.5,by]);t.wall=null;t.dead=0;say('zb_in').catch(()=>{})},
 update(t,dt){const e=t.ent;if(t.dead)return;const tgt=t.wall&&t.wall.a===90?2.4:t.stop;t.dist+=(clamp(tgt-t.dist,-1,1))*(t.back?2.4:1.2)*dt*(Math.abs(tgt-t.dist)>.02?1:0);
  const p=PL.p.clone().addScaledVector(t.dir,t.dist);e.p.x=p.x;e.p.z=p.z;e.v.x=e.v.z=0;e.walk=Math.abs(tgt-t.dist)>.05?1:0;e.ty=Math.atan2(-t.dir.x,-t.dir.z);physEnt(e,dt,0,0,false);animEnt(e,dt);
  if(t.wm){const k=T-t.wall.t0;let a=t.wall.a;if(a!==90&&k>.35){const f=ease((k-.35)/.6);a=lerp(a,a<90?0:180,f)}t.wm.rotation.set(0,0,0);t.wm.rotateOnAxis(t.axis,(90-a)*R2D)}},
 mkWall(t,a){if(t.wm)SCENE.remove(t.wm);const g=new T3.Group();for(let i=0;i<3;i++)for(let j=-1;j<=1;j++){const m=new T3.Mesh(new T3.BoxGeometry(.98,.98,.98),texMat('cobble'));m.position.set(0,i+.5,0);g.add(m);const side=new T3.Vector3(-t.dir.z,0,t.dir.x);m.position.addScaledVector(side,j)}
  const piv=new T3.Group();piv.position.copy(t.wallAt).sub(new T3.Vector3(.5*t.dir.x,0,.5*t.dir.z));g.position.set(.5*t.dir.x,0,.5*t.dir.z);piv.add(g);t.axis=new T3.Vector3(-t.dir.z,0,t.dir.x).normalize();SCENE.add(piv);t.wm=piv},
 draw(t){if(t.wall&&(t.wall.a===90||T-t.wall.t0<.4)){const p=t.wallAt;const[x,y]=scr(p.x,p.y,p.z);X.save();angleRays(x,y,110,0,t.wall.a,{rod:'iron',th:.01,ar:70});X.restore();txt(t.wall.a+'°',x+60,y-120,56,'#fff')}},
 ui(t){optRow(t,t.set.map(a=>({id:'w'+a,label:null,draw:b=>{const[x,y,w,h]=b;const gy=y+h*.92,vx=x+w*.3;rod('stick',x-4,gy,x+w+4,gy,14);const L=h*.95;
   X.save();X.fillStyle='rgba(255,214,64,.55)';X.beginPath();X.moveTo(vx,gy);X.arc(vx,gy,L*.42,-a*R2D,0);X.closePath();X.fill();X.restore();rod('iron',vx,gy,vx+Math.cos(-a*R2D)*L,gy+Math.sin(-a*R2D)*L,24);
   const lb=[x+w*.52,y,w*.48,h*.62];fitText(a+'°',lb,58,'#fff',{one:1})}})),id=>TD.zombie.pick(t,+id.slice(1)),{w:300,h:150})},
 pick(t,a){if(t.dead)return;SFX.place();t.wall={a,t0:T};TD.zombie.mkWall(t,a);const c={ep:t.ep};
  if(a===90){win(t,async c=>{await wait(1100,c);SFX.crash();shake=8;t.dead=1;const p=t.ent.p;cubeBurst(Math.floor(p.x),Math.floor(p.y)+1,Math.floor(p.z),B.leaf,18);rmEnt(t.ent);
    await say('zb_ok',c).catch(()=>{});await wait(300,c);closeTask();monsterDone()})}
  else{t.mist++;t.wob['w'+a]=T;setTimeout(()=>{if(!alive(c)||!t.wall||t.wall.a!==a)return;SFX.crash();const p=t.wallAt;cubeBurst(Math.floor(p.x+t.dir.x),Math.floor(p.y),Math.floor(p.z+t.dir.z),B.cobble,10);t.back=1;t.stop=4.8;sayNow('zb_bad');
    setTimeout(()=>{if(!alive(c))return;if(t.wall&&t.wall.a===a){t.wall=null;if(t.wm){SCENE.remove(t.wm);t.wm=null}}t.back=0;t.stop=3.4},900)},900)}},
 leave(t){if(t.wm)SCENE.remove(t.wm);if(!t.dead&&t.ent){t.ent.task=0;t.ent.flee=4}},
 ans(t,good){return[good?'w90':'w'+t.set.find(a=>a!==90)]}};
// ===================== 2. РЕКА: мост из ферм (3D-балки) =====================
const SHAPES={sq:{p:[[0,0],[3,0],[3,3],[0,3]],e:[[0,1],[1,2],[2,3],[3,0]],rig:0},tri:{p:[[0,0],[3,0],[1.5,2.6]],e:[[0,1],[1,2],[2,0]],rig:1},
 rect:{p:[[0,0],[3,0],[3,1.5],[0,1.5]],e:[[0,1],[1,2],[2,3],[3,0]],rig:0},pent:{p:[[0,0],[3,0],[3,1.6],[1.5,2.8],[0,1.6]],e:[[0,1],[1,2],[2,3],[3,4],[4,0]],rig:0},
 diag:{p:[[0,0],[3,0],[3,3],[0,3]],e:[[0,1],[1,2],[2,3],[3,0],[0,2]],rig:1},hmid:{p:[[0,0],[3,0],[3,3],[0,3],[3,1.5],[0,1.5]],e:[[0,1],[1,2],[2,3],[3,0],[4,5]],rig:0},
 vmid:{p:[[0,0],[3,0],[3,3],[0,3],[1.5,0],[1.5,3]],e:[[0,1],[1,2],[2,3],[3,0],[4,5]],rig:0}};
const RQ=[{o:['sq','tri'],ok:'tri',q:'r1q',bad:'r_sq',good:'r_tri'},{o:['diag','hmid','vmid'],ok:'diag',q:'r2q',bad:'r2_bad',good:'r2_ok'},{o:['tri','rect','pent'],ok:'tri',q:'r3q',bad:'r3_bad',good:'r_tri'}];
function shear(p,phi){return[p[0]+p[1]*Math.sin(phi),p[1]*Math.cos(phi)]}
// ферма из балок по обеим сторонам пролёта s
function trussMesh(kind,s,phi,dy){const sh=SHAPES[kind];const g=new T3.Group();const x0=RIV.x0+s*3;const pts=sh.p.map(q=>phi?shear(q,phi):q);
 for(const zz of[TZ-2.45,TZ+3.45]){for(const[a,b]of sh.e){const A=new T3.Vector3(x0+pts[a][0],GY+1+pts[a][1]+(dy||0),zz),Bv=new T3.Vector3(x0+pts[b][0],GY+1+pts[b][1]+(dy||0),zz);g.add(beam(A,Bv,.22,texMat('planks')))}}
 if(dy==null){}return g}
let TRUSS=[];function buildTrusses(){TRUSS.forEach(m=>SCENE.remove(m));TRUSS=[];const n=SV.z>=2?3:(SV.tr.river||0);for(let s=0;s<n;s++){const m=trussMesh(RQ[s].ok,s);SCENE.add(m);TRUSS.push(m)}}
TD.river={enter(t){t.r=SV.tr.river||0;t.b=null;t.opts=shuffle(RQ[t.r].o.slice());if(!SV.f.r0){SV.f.r0=1;say('r0').catch(()=>{})}say(RQ[t.r].q).catch(()=>{});TD.river.cam(t);if(t.r===1)TD.river.show(t,'sq')},
 cam(t){focusAt(RIV.x0+t.r*3+1.5,GY+2.3,TZ+.5,Math.PI*.82,-.18,9.5)},
 show(t,kind,phi,dy){if(t.mesh)SCENE.remove(t.mesh);t.mesh=trussMesh(kind,t.r,phi,dy);SCENE.add(t.mesh)},
 update(t,dt){const b=t.b;if(!b)return;const k=T-b.t0;let phi=0,dy=0;
  if(!b.rig&&k>1.0)phi=Math.min(40*R2D,(k-1.0)*1.3);if(!b.rig&&k>1.6){const f=k-1.6;dy=-f*f*9}
  if(!b.rig&&k>1.9&&!b.spl){b.spl=1;SFX.splash();cubeBurst(RIV.x0+t.r*3+1,GY-1,TZ,B.water,16)}
  if(k<2.6||b.rig)TD.river.show(t,b.kind,phi,dy);else if(t.mesh){SCENE.remove(t.mesh);t.mesh=null}
  if(!t.cart){t.cart=cartMesh();SCENE.add(t.cart)}const x0=RIV.x0+t.r*3;const cx=b.rig?lerp(x0-1,x0+3.6,clamp((k-.4)/1.6,0,1)):lerp(x0-1,x0+1.5,clamp((k-.4)/.6,0,1));
  t.cart.position.set(cx,GY+1+(b.rig?0:Math.min(0,dy)),TZ+.5);t.cart.visible=k>.3&&dy>-6},
 draw(t){},
 ui(t){backBtn();optRow(t,t.opts.map(k=>({id:k,label:null,draw:bx=>{const[x,y,w,h]=bx;const sh=SHAPES[k];const sc=Math.min(w*.95/3,h*1.0/3);
   X.save();X.translate(x+w/2-1.5*sc,y+h*.98);X.scale(sc,-sc);for(const[a,c]of sh.e){X.strokeStyle='#7a4a1a';X.lineWidth=26/sc*1.0;X.lineCap='round';X.beginPath();X.moveTo(...sh.p[a]);X.lineTo(...sh.p[c]);X.stroke();X.strokeStyle='#c08a4a';X.lineWidth=14/sc;X.stroke()}X.restore()}})),id=>TD.river.pick(t,id),{w:300,h:150})},
 pick(t,id){const q=RQ[t.r];t.b={kind:id,t0:T,rig:SHAPES[id].rig};SFX.place();
  if(id!==q.ok){t.mist++;t.wob[id]=T;const c={ep:t.ep},b=t.b;setTimeout(()=>{if(alive(c)&&t.b===b){SFX.crash();sayNow(q.bad)}},1100);setTimeout(()=>{if(alive(c)&&t.b===b){t.b=null;if(t.cart)t.cart.visible=false;if(t.r===1)TD.river.show(t,'sq');else if(t.mesh){SCENE.remove(t.mesh);t.mesh=null}}},2700);return}
  win(t,async c=>{await say(q.good,c).catch(()=>{});await wait(Math.max(0,2300-(T-t.b.t0)*1000),c);SFX.ok();deckSpan(t.r,false);
   SV.tr.river=t.r+1;save(1);t.b=null;if(t.mesh){SCENE.remove(t.mesh);t.mesh=null}if(t.cart)t.cart.visible=false;buildTrusses();
   if(t.r+1>=3){SV.z=Math.max(SV.z,2);save(1);closeTask();say('r_done').catch(()=>{});return}
   t.r++;t.opts=shuffle(RQ[t.r].o.slice());TD.river.cam(t);if(t.r===1)TD.river.show(t,'sq');say(RQ[t.r].q,c).catch(()=>{})})},
 leave(t){if(t.mesh)SCENE.remove(t.mesh);if(t.cart)SCENE.remove(t.cart)},
 ans(t,good){const q=RQ[t.r];return[good?q.ok:t.opts.find(k=>k!==q.ok)]}};
function cartMesh(){const g=new T3.Group();const iron=texMat('iron');const b=(w,h,d,x,y,z,m)=>{const q=new T3.Mesh(new T3.BoxGeometry(w,h,d),m||iron);q.position.set(x,y,z);g.add(q)};
 b(1,.12,.8,0,.32,0);b(1,.5,.1,0,.6,.4);b(1,.5,.1,0,.6,-.4);b(.1,.5,.8,.5,.6,0);b(.1,.5,.8,-.5,.6,0);b(.7,.4,.6,0,.55,0,texMat('gold_ore'));
 for(const x of[-.3,.3])for(const z of[-.42,.42])b(.24,.24,.06,x,.14,z,texMat('bedrock'));return g}
// ===================== 3. КУЗНИЦА: кирки и мечи по типам углов =====================
TD.forge={enter(t){t.r=SV.tr.forge||0;TD.forge.deal(t);focusAt(93.5,GY+2,29,Math.PI*.6,-.25,5.5);if(!SV.f.v0){SV.f.v0=1;say('v0').catch(()=>{})}say(t.r?'v_r2':'v_q').catch(()=>{})},
 deal(t){const ty=shuffle(['ac','rt','ob']);t.items=ty.map((k,i)=>({id:'it'+i,type:k,a:k==='ac'?pick([30,45,60,70]):k==='ob'?pick([110,120,135,150]):90,loc:null,sw:i%2}));t.sel=null},
 draw(t){const b=panel('board');if(!b)return;const[x,y,w,h]=b;const n=t.items.length;
  t.items.forEach((it,i)=>{if(it.loc)return;const cx=x+w*(i+.5)/n,cy=y+h*.78-(t.sel===it.id?16+Math.sin(T*6)*4:0);const L=Math.min(w/n*.42,h*.62);
   const a0=it.a>100?-10:0;X.save();if(t.sel===it.id){X.shadowColor='#ffe066';X.shadowBlur=30}
   angleRays(cx-L*.25,cy,L,a0,a0+it.a,{rod:'stick',th:22,arc:true,ar:L*.36});X.restore();
   const hx=cx-L*.25+Math.cos(-(a0+it.a)*R2D)*L,hy=cy+Math.sin(-(a0+it.a)*R2D)*L;rod(it.sw?'sword':'iron',cx-L*.25,cy,hx,hy,it.sw?34:30);
   if(t.r===0)txt(it.a+'°',cx-L*.25+Math.cos(-(a0+it.a/2)*R2D)*L*.62,cy+Math.sin(-(a0+it.a/2)*R2D)*L*.62,Math.max(34,L*.3),'#fff');
   btn(it.id,cx,y+h*.5,w/n*.9,h*.9,()=>TD.forge.tapItem(t,it.id))})},
 ui(t){backBtn();const L=layout();const gap=26,w=Math.min(380,(L.s.x1-L.s.x0-80-gap*2)/3),h=128;const fs=Math.min(...['ac','rt','ob'].map(k=>oneSize(TYPEN[k],w*.56,h*.5,44)));
  ['ac','rt','ob'].forEach((k,i)=>{const cx=L.cx+(i-1)*(w+gap),cy=L.optY;const inn=t.items.filter(it=>it.loc===k).length;
   const wob=t.wob['ch_'+k]?Math.sin((T-t.wob['ch_'+k])*40)*Math.max(0,1-(T-t.wob['ch_'+k])*2.5)*10:0;
   X.save();if(t.sel){X.shadowColor='rgba(255,230,120,.9)';X.shadowBlur=26}const tb=nine('tab_grey',cx-w/2+wob,cy-h/2,w,h);X.restore();
   if(tb){const cw=Math.min(tb[3]*1.25,tb[2]*.36);drawImg(inn?'chest_open':'chest',tb[0]+cw/2,cy,cw);if(inn)txt('×'+inn,tb[0]+cw*.8,cy+tb[3]*.36,30,'#ffe066');fitText(TYPEN[k],[tb[0]+cw+6,tb[1],tb[2]-cw-6,tb[3]],fs,'#fff',{one:1})}
   btn('ch_'+k,cx,cy,w,h,()=>TD.forge.tapChest(t,k))})},
 tapItem(t,id){t.sel=t.sel===id?null:id},
 tapChest(t,k){if(!t.sel){const it=t.items.slice().reverse().find(it=>it.loc===k);if(it){it.loc=null;SFX.click()}return}
  const it=t.items.find(q=>q.id===t.sel);t.sel=null;if(it.type!==k)return mistake(t,'ch_'+k,HINT[it.type]);it.loc=k;SFX.ok();sparks(layout().cx,layout().optY,8);
  if(t.items.every(q=>q.loc))win(t,async c=>{SFX.star();await wait(900,c);t.r++;SV.tr.forge=t.r;save(1);
   if(t.r>=2){SV.z=Math.max(SV.z,3);SV.armor=1;save(1);openGate(112,false);for(let z=TZ-2;z<=TZ+2;z++)cubeBurst(112,GY+2,z,B.iron,4);closeTask();say('v_done').catch(()=>{});return}
   TD.forge.deal(t);say('v_r2',c).catch(()=>{})})},
 ans(t,good){const it=t.items.find(q=>!q.loc);if(!it)return[];return[it.id,'ch_'+(good?it.type:['ac','rt','ob'].find(k=>k!==it.type))]}};
// ===================== 4. ПУСТЫНЯ: сумма углов 180° =====================
const DQ=[{a:50,b:70,o:[60,70,80]},{a:90,b:40,o:[50,40,90]},{a:30,b:110,o:[40,50,70]}];
function triPts(a,b,box){const[x,y,w,h]=box;const A=a*R2D,Bb=b*R2D;const cx=Math.tan(Bb)/(Math.tan(A)+Math.tan(Bb));let px=cx,py=cx*Math.tan(A);if(b===90){px=1;py=Math.tan(A)}if(a===90){px=0;py=Math.tan(Bb)}
 const minx=Math.min(0,px),maxx=Math.max(1,px),sc=Math.min(w*.86/(maxx-minx),h*.78/py);const ox=x+w/2-(minx+maxx)/2*sc,oy=y+h*.9;return[[ox,oy],[ox+sc,oy],[ox+px*sc,oy-py*sc]]}
let GHOSTS=[];
TD.desert={enter(t){t.r=SV.tr.desert||0;t.opts=shuffle(DQ[t.r].o.slice());focusAt(PYR.cx-4,GY+3.2,PYR.cz+.5,Math.PI/2,-.2,9);if(!SV.f.d0){SV.f.d0=1;say('d0').catch(()=>{})}say('d_q').catch(()=>{})},
 draw(t){const s=safeV();const L=layout();const pw=Math.min(L.pw*.7,820);const b=nine('tab_sand',s.x1-20-pw,L.top,pw,L.ph,.95);if(!b)return;const[x,y,w,h]=b;const q=DQ[t.r],c=180-q.a-q.b;const tb=[x+w*.02,y+h*.02,w*.6,h*.96];const p=triPts(q.a,q.b,tb);
  triFill(p,'sandstone',{lw:10});const fs=Math.max(32,h*.12),rr=Math.min(h*.13,60);
  arcAt(p[0],p[1],p[2],rr,'#ff7a3a',q.a+'°',fs);arcAt(p[1],p[2],p[0],rr,'#3ab0ff',q.b+'°',fs);
  const done=t.win;arcAt(p[2],p[0],p[1],rr*.85,'#7ad04a',done?c+'°':'?',fs*1.1);
  const cw=w*.34,lx=x+w*.82,R=Math.min(cw*.42,h*.3),ly=y+h*.5;rod('stick',lx-R*1.18,ly,lx+R*1.18,ly,12);
  const segs=[[q.a,'#ff7a3a'],[q.b,'#3ab0ff'],[c,'#7ad04a']];let st=0;
  for(const[s0,col]of segs){const show=done||st+s0<=q.a+q.b;if(show){X.save();X.globalAlpha=done?.85:.5;X.fillStyle=col;X.beginPath();X.moveTo(lx,ly);X.arc(lx,ly,R,-(st+s0)*R2D,-st*R2D);X.closePath();X.fill();X.restore()}else{X.save();X.setLineDash([10,8]);X.strokeStyle='#7ad04a';X.lineWidth=5;X.beginPath();X.moveTo(lx,ly);X.arc(lx,ly,R,-(st+s0)*R2D,-st*R2D);X.closePath();X.stroke();X.restore()}st+=s0}
  const eb=nine('tab_grey',lx-cw/2,ly+h*.06,cw,h*.4);if(eb)fitText(q.a+'° + '+q.b+'° + '+(done?c+'°':'?')+' = 180°',eb,44,'#fff')},
 ui(t){backBtn();const s=safeV(),L=layout();const pw=Math.min(L.pw*.7,820);optRow(t,t.opts.map(v=>({id:'o'+v,label:v+'°'})),id=>TD.desert.pick(t,+id.slice(1)),{tab:'tab_sand',w:240,fs:60,cx:s.x1-20-pw/2})},
 pick(t,v){const q=DQ[t.r];if(v!==180-q.a-q.b)return mistake(t,'o'+v,'d_bad');SFX.ok();t.win=T;
  win(t,async c=>{say('d_ok',c).catch(()=>{});await wait(2300,c);const[gx,gy,gz]=PYR.gaps[t.r];vset(gx,gy,gz,B.pyr);cubeBurst(gx,gy,gz,B.sst,12);
   t.r++;SV.tr.desert=t.r;save(1);t.win=0;
   if(t.r>=3){SV.z=Math.max(SV.z,4);save(1);openGate(145,false);closeTask();say('d_done').catch(()=>{});return}
   t.opts=shuffle(DQ[t.r].o.slice());say('d_q',c).catch(()=>{})})},
 ans(t,good){const q=DQ[t.r],c=180-q.a-q.b;return['o'+(good?c:t.opts.find(v=>v!==c))]}};
// ===================== 5. ЗАМОК: виды треугольников + треугольная крыша =====================
const CQ={eq:[5,5,5],iso:[6,6,4],sc:[4,5,6]},CN={eq:'РАВНОСТОРОННИЙ',iso:'РАВНОБЕДРЕННЫЙ',sc:'РАЗНОСТОРОННИЙ'},CHH={eq:'c_eq',iso:'c_iso',sc:'c_sc'};
function triSides(a,b,c,box){const[x,y,w,h]=box;const px=(a*a-b*b+c*c)/(2*c),py=Math.sqrt(Math.max(0,a*a-px*px));const sc=Math.min(w*.84/c,h*.76/py);const ox=x+w/2-c*sc/2,oy=y+h*.84;return[[ox,oy],[ox+c*sc,oy],[ox+px*sc,oy-py*sc]]}
TD.castle={enter(t){t.r=SV.tr.castle||0;if(!SV.f.ord){SV.f.ord=shuffle(['eq','iso','sc'])}t.ord=SV.f.ord;if(!SV.f.c0){SV.f.c0=1;say('c0').catch(()=>{})}say(t.r<3?'c_q':'c_roof').catch(()=>{});TD.castle.cam(t);if(t.r>=3)TD.castle.ghosts(t)},
 cam(t){if(t.r<3)focusAt(158.6,GY+2.6,TZ+1.6,Math.PI/2,-.12,7.5);else focusAt(164.5,TOWER.top+2.2,TZ+.5,Math.PI*.62,-.32,9)},
 ghosts(t){GHOSTS.forEach(m=>SCENE.remove(m));GHOSTS=[];for(const[x,y,z]of ROOF){const m=new T3.Mesh(new T3.BoxGeometry(1,1,1),new T3.MeshBasicMaterial({color:0xffe066,transparent:true,opacity:.35,depthWrite:false}));m.position.set(x+.5,y+.5,z+.5);m.userData.c=[x,y,z];SCENE.add(m);GHOSTS.push(m)}},
 update(t){for(const g of GHOSTS){const[x,y,z]=g.userData.c;g.visible=vget(x,y,z)!==B.roof;g.material.opacity=.25+.2*Math.sin(T*5)}},
 draw(t){if(t.r>=3)return;const L=layout();const pw=Math.min(L.pw*.62,760);const b=nine('tab_purple',L.s.x0+20+(L.cx-L.pw/2-L.s.x0-20)*.5,L.top,pw,L.ph,.95);if(!b)return;const[x,y,w,h]=b;const k=t.ord[t.r],sd=CQ[k];const p=triSides(sd[0],sd[1],sd[2],[x+w*.1,y+h*.06,w*.8,h*.94]);
  if(t.brk&&T-t.brk<1)X.globalAlpha=1-(T-t.brk);triFill(p,'castle',{lw:12,st:'#ffe066'});X.globalAlpha=1;
  const lab=(a,b2,v)=>{const mx=(a[0]+b2[0])/2,my=(a[1]+b2[1])/2,cx=(p[0][0]+p[1][0]+p[2][0])/3,cy=(p[0][1]+p[1][1]+p[2][1])/3;const d=Math.hypot(mx-cx,my-cy)||1;const fs=Math.max(40,h*.15);txt(String(v),mx+(mx-cx)/d*fs*.95,my+(my-cy)/d*fs*.85,fs,'#fff')};
  lab(p[0],p[2],sd[0]);lab(p[1],p[2],sd[1]);lab(p[0],p[1],sd[2]);
  const tk=[[p[0],p[2],sd[0]],[p[1],p[2],sd[1]],[p[0],p[1],sd[2]]];tk.forEach(([a,b2,v])=>{const same=sd.filter(s=>s===v).length;if(same>1)ticks(a,b2,same===3?1:2)})},
 ui(t){backBtn();if(t.r>=3)return;optRow(t,['eq','iso','sc'].map(k=>({id:k,label:CN[k]})),id=>TD.castle.pick(t,id),{tab:'tab_purple',w:380,fs:40,one:1})},
 pick(t,id){const k=t.ord[t.r];if(id!==k)return mistake(t,id,CHH[k]);SFX.ok();t.brk=T;
  win(t,async c=>{SFX.crash();shake=10;if(KR)cubeBurst(Math.floor(KR.p.x),Math.floor(KR.p.y)+1,Math.floor(KR.p.z),B.castle,14);await say('c_ok',c).catch(()=>{});await wait(500,c);t.brk=0;t.r++;SV.tr.castle=t.r;save(1);TD.castle.cam(t);if(t.r>=3)TD.castle.ghosts(t);say(t.r<3?'c_q':'c_roof',c).catch(()=>{})})},
 // касание по светлому месту ставит блок крыши, по поставленному — убирает (исправить ошибку)
 tapCell(t,x,y,z){if(t.r<3)return false;if(!ROOF.some(([a,b,c])=>a===x&&b===y&&c===z))return false;
  if(vget(x,y,z)===B.roof){vset(x,y,z,0);SFX.dig();cubeBurst(x,y,z,B.castle,6);return true}
  if(vget(x,y,z))return true;vset(x,y,z,B.roof);SFX.place();cubeBurst(x,y,z,B.castle,5);
  if(ROOF.every(([a,b,c])=>vget(a,b,c)===B.roof))win(t,async c2=>{SFX.star();await wait(600,c2);await say('c_win',c2).catch(()=>{});await wait(600,c2);SV.z=5;SV.tr.castle=4;save(1);go('fin')});return true},
 leave(){GHOSTS.forEach(m=>SCENE.remove(m));GHOSTS=[]},
 ans(t,good){if(t.r>=3)return['roof'];const k=t.ord[t.r];return[good?k:['eq','iso','sc'].find(q=>q!==k)]}};
// ===================== СУНДУКИ С ЗАГАДКАМИ =====================
const SQ=[{o:['2','3','4'],ok:'4'},{o:['2','3','4'],ok:'3'},{o:['90°','180°','360°'],ok:'180°'},{o:['Да','Нет'],ok:'Нет'}];
TD.chest={enter(t,i){t.i=i;t.opts=SQ[i].o.slice();const c=CHESTS[i];focusAt(c.x+.5,c.y+.8,c.z+.5,CAMS.yaw,-.35,4.5);say('ch').catch(()=>{});say('s'+(i+1)).catch(()=>{})},
 draw(t){const b=panel('board');if(!b)return;const[x,y,w,h]=b;drawImg(t.won?'chest_open':'chest',x+w*.2,y+h*.55,Math.min(h*.7,220));if(t.won)drawImg('star',x+w*.2,y+h*.3-Math.sin(T*3)*8,Math.min(h*.45,140),{glow:'#ffe066'});
  const qb=[x+w*.38,y+h*.08,w*.58,h*.84];fitText(LINES['s'+(t.i+1)].t,qb,56,'#fff')},
 ui(t){backBtn();optRow(t,t.opts.map(v=>({id:'q'+v,label:v})),id=>TD.chest.pick(t,id.slice(1)),{w:280,fs:64})},
 pick(t,v){if(v!==SQ[t.i].ok)return mistake(t,'q'+v,'s_bad');SFX.star();t.won=1;
  win(t,async c=>{SV.st[t.i]=1;save(1);await say('s_ok',c).catch(()=>{});await wait(400,c);closeTask()})},
 ans(t,good){return['q'+(good?SQ[t.i].ok:t.opts.find(v=>v!==SQ[t.i].ok))]}};
