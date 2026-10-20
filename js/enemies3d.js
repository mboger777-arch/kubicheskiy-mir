'use strict';
// ===== Новые враги по зонам: каждый — маленькая задачка про углы и треугольники. Ошибка не наказывает: подсказка и сразу новая попытка =====
// лес — Слизень-Кубик (сколько треугольников), шахта — Тупик (сколько градусов на циферблате), река — Водяной (из каких палок выйдет треугольник),
// пустыня — Скелет-лучник (смежные углы, вместе 180°), замок — Фантом (вид треугольника по углам)
const FOES={
 slime:{zone:'forest',when:p=>SV.f.tut&&p.x>26&&p.x<31,at:p=>[p.x+5.5,TZ+.5],n:2,inL:'sl_in',q2:'sl_q2',okL:'sl_ok',tab:'tab_grey',
  q(t){const k=t.r===0?pick(['d1','fan']):'d2';const n={d1:2,fan:3,d2:4}[k];return{k,ok:n,opts:shuffle([2,3,4]),hint:'sl_bad',lab:v=>String(v)}},
  draw(t,b){const[x,y,w,h]=b;const s=Math.min(w*.6,h*.78),cx=x+w/2,cy=y+h*.5;const x0=cx-s/2,y0=cy-s/2,x1=cx+s/2,y1=cy+s/2;let P;
   if(t.q.k==='d1')P=[[[x0,y0],[x1,y0],[x1,y1]],[[x0,y0],[x1,y1],[x0,y1]]];
   else if(t.q.k==='d2')P=[[[x0,y0],[x1,y0],[cx,cy]],[[x1,y0],[x1,y1],[cx,cy]],[[x1,y1],[x0,y1],[cx,cy]],[[x0,y1],[x0,y0],[cx,cy]]];
   else{const a=[cx,y0],q1=[x0+s/3,y1],q2=[x0+2*s/3,y1];P=[[a,[x0,y1],q1],[a,q1,q2],[a,q2,[x1,y1]]]}
   const col=['#7ad85a','#5cbc44','#94e874','#6ccc4e'];const wob=t.won?Math.sin(T*8)*6:0;
   P.forEach((tri,i)=>{const c=[(tri[0][0]+tri[1][0]+tri[2][0])/3,(tri[0][1]+tri[1][1]+tri[2][1])/3];const sp=t.won?ease(Math.min(1,(T-t.won)*1.5))*40:0;
    X.save();X.translate((c[0]-cx)/s*sp*2,(c[1]-cy)/s*sp*2+wob);X.beginPath();X.moveTo(...tri[0]);X.lineTo(...tri[1]);X.lineTo(...tri[2]);X.closePath();X.fillStyle=col[i%4];X.globalAlpha=.92;X.fill();X.globalAlpha=1;X.lineWidth=8;X.lineJoin='round';X.strokeStyle='#2a6a1e';X.stroke();X.restore()});
   const fx=cx-s*.12,fy=cy-s*.05;X.fillStyle='#1d3a14';X.fillRect(fx-s*.12,fy-s*.08,s*.07,s*.1);X.fillRect(fx+s*.17,fy-s*.08,s*.07,s*.1)}},
 tupik:{zone:'mine',when:p=>SV.mw>=2&&p.x>50.5&&p.x<54.5&&Math.abs(p.z-TZ-.5)<2,at:p=>[Math.min(p.x+3.8,54.6),TZ+.5],n:2,inL:'tp_in',q2:'tp_q2',okL:'tp_ok',tab:'tab_grey',
  q(t){let a;do{a=pick([30,40,50,60,70,110,120,130,140,150])}while(t.q&&t.q.ok===a);const o=[a,180-a,a+(a<90?20:-20)];return{a,ok:a,opts:shuffle(o),hint:'tp_bad',lab:v=>v+'°'}},
  draw(t,b){const[x,y,w,h]=b;const R=Math.min(w*.4,h*.7),cx=x+w/2,cy=y+h*.86;protractor(cx,cy,R,{alpha:.95});
   const a=t.won?t.q.a+Math.sin(T*20)*3:t.q.a;angleRays(cx,cy,R*1.02,0,a,{rod:'iron',th:20,arc:true,ar:R*.3});
   X.save();X.fillStyle='#ffb020';X.beginPath();X.arc(cx,cy,14,0,6.28);X.fill();X.restore()}},
 drowned:{zone:'river',when:p=>SV.z>=2&&p.x>74.6&&p.x<78.5,at:p=>[p.x+4.5,TZ+.5],n:2,inL:'dr_in',q2:'dr_in',okL:'dr_ok',tab:'tab_grey',
  q(t){const good=pick([[3,4,5],[2,3,4],[4,4,5],[3,3,3],[2,4,5]]),bad=shuffle([[1,2,5],[2,2,6],[1,3,6],[2,3,6],[1,1,4]]).slice(0,2);const opts=shuffle([good,...bad].map(s=>shuffle(s.slice())));
   return{ok:opts.find(s=>{const q=s.slice().sort((a,b)=>a-b);return q[0]+q[1]>q[2]}).join('-'),opts:opts.map(s=>s.join('-')),hint:'dr_bad',sticks:1,lab:v=>null,drawOpt:(v,bx)=>{const[x,y,w,h]=bx;const L=v.split('-').map(Number);const u=Math.min(w*.8/6,h*.26);
    L.forEach((l,i)=>{const yy=y+h*(.24+i*.27),x0=x+w*.12;rod('stick',x0,yy,x0+l*u,yy,Math.max(10,h*.1));txt(String(l),x0+l*u+u*.55,yy,Math.max(26,h*.2),'#fff')})}}},
  draw(t,b){const[x,y,w,h]=b;const cx=x+w/2,cy=y+h*.6,s=Math.min(w*.32,h*.42);const p=[[cx-s,cy+s*.5],[cx+s,cy+s*.5],[cx+s*.1,cy-s*.75]];
   X.save();X.fillStyle='rgba(60,140,220,.5)';X.fillRect(x+w*.04,cy+s*.35,w*.92,h*.3);X.restore();
   if(t.won){triFill(p,'planks',{lw:10,st:'#ffe066'})}else{rod('stick',p[0][0],p[0][1],p[1][0],p[1][1],18);rod('stick',p[1][0],p[1][1],p[1][0]-s*.35,p[1][1]-s*.6,18);rod('stick',p[0][0]+s*.2,p[0][1]-s*.3,p[2][0]-s*.2,p[2][1]+s*.1,18);txt('?',cx,cy-s*.1,Math.max(60,h*.22),'#ffe066')}}},
 skeleton:{zone:'desert',when:p=>SV.z>=3&&p.x>113.4&&p.x<117,at:p=>[p.x+5,TZ+.5],n:2,inL:'sk_in',q2:'sk_in',okL:'sk_ok',tab:'tab_sand',
  q(t){let a;do{a=pick([30,40,50,60,70,80,110,120,130,140])}while(t.q&&t.q.a===a);const o=[180-a,a,Math.abs(90-a)||10];return{a,ok:180-a,opts:shuffle([...new Set(o)].concat(o.length>new Set(o).size?[180-a+10]:[])),hint:'sk_bad',lab:v=>v+'°'}},
  draw(t,b){const[x,y,w,h]=b;const gy=y+h*.84,cx=x+w*.5,L=Math.min(w*.42,h*.52);rod('sandstone',x+w*.04,gy+12,x+w*.96,gy+12,26);
   const a=t.q.a*R2D,R=L*.36;X.save();X.globalAlpha=.6;X.fillStyle='#ff7a3a';X.beginPath();X.moveTo(cx,gy);X.arc(cx,gy,R,-Math.PI,-Math.PI+(Math.PI-a),false);X.closePath();X.fill();
   X.fillStyle='#3ab0ff';X.beginPath();X.moveTo(cx,gy);X.arc(cx,gy,R*.8,-a,0);X.closePath();X.fill();X.restore();
   rod('stick',cx,gy,cx+Math.cos(-a)*L,gy+Math.sin(-a)*L,16);drawImg('arrow',cx+Math.cos(-a)*L*.5,gy+Math.sin(-a)*L*.5,Math.min(140,L*.6),{rot:-a+Math.PI});
   const fs=Math.max(36,h*.14),ml=-(a+Math.PI)/2,mr=-a/2;txt(t.won?(180-t.q.a)+'°':'?',cx+Math.cos(ml)*R*1.45,gy+Math.sin(ml)*R*1.2,fs,'#ffe066');txt(t.q.a+'°',cx+Math.cos(mr)*R*1.4,gy+Math.sin(mr)*R*1.1,fs,'#fff');
   plate(t.won?(180-t.q.a)+'° + '+t.q.a+'° = 180°':'? + '+t.q.a+'° = 180°',x+w*.04,y+h*.0,w*.92,h*.27)}},
 phantom:{zone:'castle',when:p=>SV.z>=4&&p.x>146.5&&p.x<151,at:p=>[p.x+5,TZ+.5],n:2,inL:'ph_in',q2:'ph_in',okL:'ph_ok',tab:'tab_purple',
  q(t){let ty;do{ty=pick(['ac','rt','ob'])}while(t.q&&t.q.ty===ty);const S={ac:[[60,70],[60,60],[55,80]],rt:[[60,90],[45,90],[30,90]],ob:[[35,120],[30,110],[25,130]]}[ty];const[a,bb]=pick(S);
   return{ty,a,b:bb,ok:ty,opts:['ac','rt','ob'],hint:'ph_'+ty,lab:v=>({ac:'ОСТРОУГОЛЬНЫЙ',rt:'ПРЯМОУГОЛЬНЫЙ',ob:'ТУПОУГОЛЬНЫЙ'})[v]}},
  draw(t,b){const[x,y,w,h]=b;const q=t.q;const p=triPts(q.a,q.b,[x+w*.06,y+h*.04,w*.88,h*.9]);triFill(p,'castle',{lw:10,st:'#7ae0ff'});
   const fs=Math.max(32,h*.11),rr=Math.min(h*.12,54);arcAt(p[0],p[1],p[2],rr,'#ff7a3a',q.a+'°',fs);arcAt(p[1],p[2],p[0],rr,'#3ab0ff',q.b+'°',fs);arcAt(p[2],p[0],p[1],rr*.85,'#7ad04a',(180-q.a-q.b)+'°',fs);
   const k=(T*.35)%1,i=Math.floor(k*3),f=(k*3)%1,A=p[i],Bp=p[(i+1)%3];drawImg('star',A[0]+(Bp[0]-A[0])*f,A[1]+(Bp[1]-A[1])*f,44,{glow:'#7ae0ff'})}}};
const FOEK=Object.keys(FOES);
// появление: один раз в своей зоне, днём, когда Блоки дошёл до места встречи
function stepFoes(){if(TASK||!PL)return;const p=PL.p;for(const k of FOEK){const F=FOES[k];if(SV.f['fo_'+k]||MON.some(m=>m.kind===k))continue;
 if(zoneAt(Math.floor(p.x))!==F.zone&&!(k==='drowned'&&p.x>73))continue;if(!F.when(p))continue;const[x,z]=F.at(p);
 const sx=Math.min(x,barrierX()-1);const e=spawnMonster(k,sx,z,groundAt(sx,z,p.y+1.5));e.fixed=1;e.foe=1;if(k==='slime'||k==='tupik'){e.hw=.45;e.h=1.1}}}
// крупная контрастная табличка с формулой
function plate(tx,x,y,w,h){X.save();X.fillStyle='rgba(16,16,26,.94)';X.strokeStyle='#ffe066';X.lineWidth=6;X.beginPath();if(X.roundRect)X.roundRect(x,y,w,h,14);else X.rect(x,y,w,h);X.fill();X.stroke();X.restore();
 fitText(tx,[x+14,y+6,w-28,h-12],Math.min(96,h*.78),'#ffe066',{one:1,min:24})}
// камера встречи: герои и враг целиком (ноги видны) в левой части экрана, табло справа; перебираем ракурсы без стен между камерой и героями
function foeStage(t){const e=t.ent;for(const x of[PL,e])if(x){x.p.y=groundAt(x.p.x,x.p.z,x.p.y+.6);x.v.set(0,0,0);x.onG=true}const d=new T3.Vector3(e.p.x-PL.p.x,0,e.p.z-PL.p.z);if(d.length()<.5)d.set(1,0,0);d.normalize();t.dir=d;const sd=new T3.Vector3(-d.z,0,d.x);
 [[PL,-.55],[e,.55]].forEach(([x,o])=>{const nx=x.p.x+sd.x*o,nz=x.p.z+sd.z*o;if(!collides(nx,x.p.y,nz,x.hw||.3,x.h||1.6)){x.p.x=nx;x.p.z=nz}});
 [[GRN,-1.25,.95],[DOG,-.95,-.95]].forEach(([f,a,b])=>{if(!f)return;for(const k of[1,.6,.3]){const nx=PL.p.x+d.x*a*k+sd.x*b,nz=PL.p.z+d.z*a*k+sd.z*b;const ny=groundAt(nx,nz,PL.p.y+1.2);
  if(Math.abs(ny-PL.p.y)<1.1&&!collides(nx,ny,nz,f.hw||.3,f.h||1.6)){f.p.set(nx,ny,nz);f.v.set(0,0,0);f.hide=false;placeEnt(f);break}}})}
function foeCam(t){const e=t.ent;const d=t.dir;const ents=[PL,GRN,DOG,e].filter(x=>x&&!x.hide);const EP=[];
 for(const x of ents){placeEnt(x);x.obj.updateMatrixWorld(true);const bb=new T3.Box3().setFromObject(x.m);const hgt=clamp(isFinite(bb.max.y)?bb.max.y-x.p.y:1.8,.8,3);const hw=clamp(isFinite(bb.max.x)?Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)/2:.4,.3,.9);
  const by0=Math.min(x.p.y,isFinite(bb.min.y)?Math.max(bb.min.y,x.p.y-.2):x.p.y);const q=[];for(const a of[-hw,hw])for(const b of[-hw,hw])for(const yy of[by0,x.p.y+hgt])q.push(new T3.Vector3(x.p.x+a,yy,x.p.z+b));EP.push(q)}
 const pts=EP.flat();const P=foePanel(),v=vis(),s=P.L.s;const rx0=-1+2*((s.x0+20-v.x0)/v.w),rx1=-1+2*((P.x-24-v.x0)/v.w),ry1=1-2*((s.y0+132-v.y0)/v.h),ry0=1-2*((s.y1-176-v.y0)/v.h);
 const C=new T3.PerspectiveCamera(CAM.fov,CAM.aspect||W/H,.08,110);const ctr=new T3.Vector3();pts.forEach(q=>ctr.add(q));ctr.multiplyScalar(1/pts.length);const Y=new T3.Vector3(0,1,0);
 const sd=new T3.Vector3(-d.z,0,d.x);const cands=[];for(const sg of[1,-1])for(const a of[0,.45,-.45,.8])cands.push([sd.clone().multiplyScalar(sg).applyAxisAngle(Y,a*sg),2]);
 for(const a of[.12,-.12,.35,-.35,.6,-.6]){cands.push([d.clone().negate().applyAxisAngle(Y,a),1]);cands.push([d.clone().applyAxisAngle(Y,a),0])}
 let best=null;cands.forEach(([cd,bon],ci)=>{for(const pitch of[-.12,-.3]){const yaw=Math.atan2(cd.x,cd.z);const dir=new T3.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  let tgt=ctr.clone(),dist=7,boxes=null;for(let it=0;it<7;it++){C.position.copy(tgt).addScaledVector(dir,-dist);C.lookAt(tgt);C.updateMatrixWorld(true);let x0=9,x1=-9,y0=9,y1=-9;boxes=[];
   for(const q of EP){let a0=9,a1=-9,b0=9,b1=-9;for(const p of q){const n=p.clone().project(C);a0=Math.min(a0,n.x);a1=Math.max(a1,n.x);b0=Math.min(b0,n.y);b1=Math.max(b1,n.y)}boxes.push([a0,a1,b0,b1,q[0].distanceTo(C.position)]);x0=Math.min(x0,a0);x1=Math.max(x1,a1);y0=Math.min(y0,b0);y1=Math.max(y1,b1)}
   const sc=Math.max((x1-x0)/((rx1-rx0)*.9),(y1-y0)/((ry1-ry0)*.9));dist=clamp(dist*sc,3,12);
   const hx=(rx0+rx1)/2-(x0+x1)/2,hy=(ry0+ry1)/2-(y0+y1)/2;const th=Math.tan(CAM.fov*Math.PI/360)*dist;const right=new T3.Vector3(-Math.cos(yaw),0,Math.sin(yaw)),up=new T3.Vector3().crossVectors(right,dir);
   tgt.addScaledVector(right,-hx*th*C.aspect).addScaledVector(up,-hy*th)}
  const back=dir.clone().negate();const h=rayVox(tgt,back,dist+.3,b=>opaqueT(b));const clear=h?h.t:dist+.3;const cam=tgt.clone().addScaledVector(back,dist);
  // стена между камерой и героями срезается ближней плоскостью (вид «в разрезе»), если все герои дальше среза
  const near=clear>=dist?0:dist-clear+.12;const nearest=Math.min(...boxes.map(b=>b[4]))-1.1;const cutOK=!near||near<nearest;
  let vs=0;for(const x of ents)for(const hy of[.9,.15]){const c=new T3.Vector3(x.p.x,x.p.y+hy,x.p.z);const r=cam.clone().sub(c);const L=r.length();if(!rayVox(c,r.normalize(),Math.max(.1,L-near-.25),b=>opaqueT(b)))vs+=.5}
  let occ=0;boxes.forEach((A,ia)=>{const ar=(A[1]-A[0])*(A[3]-A[2])||1e-6;boxes.forEach((B,ib)=>{if(ib===ia||B[4]>=A[4])return;const ox=Math.max(0,Math.min(A[1],B[1])-Math.max(A[0],B[0])),oy=Math.max(0,Math.min(A[3],B[3])-Math.max(A[2],B[2]));if(ox*oy/ar>.4)occ+=(ia===boxes.length-1||ia===0)?2:1})});
  const score=vs*10-occ*3+bon+(clear>=dist?3:0)-(cutOK?0:30)-dist*.25-(pitch<-.2?.4:0);if(!best||score>best.score)best={score,tgt,yaw,pitch,dist,near,occ}}});
 CAMS.focus={t:[best.tgt.x,best.tgt.y,best.tgt.z],yaw:best.yaw,pitch:best.pitch,dist:best.dist,near:best.near||0};t.cam=best;stepCam(0,true)}
function foePanel(){const L=layout(),s=L.s;const pw=Math.min(L.pw*.56,700);return{L,x:s.x1-20-pw,w:pw}}
FOEK.forEach(k=>{const F=FOES[k];TD[k]={
 enter(t,ent){t.k=k;t.ent=ent||spawnMonster(k,PL.p.x+3.4,PL.p.z);t.ent.task=1;t.ent.fixed=1;const e=t.ent;
  const d=new T3.Vector3(e.p.x-PL.p.x,0,e.p.z-PL.p.z);if(d.length()<.5)d.set(1,0,0);d.normalize();const nx=PL.p.x+d.x*3.3,nz=PL.p.z+d.z*3.3;
  if(!collides(nx,PL.p.y,nz,e.hw,e.h)){e.p.set(nx,groundAt(nx,nz,PL.p.y+2),nz)}e.v.set(0,0,0);
  t.q=F.q(t);foeStage(t);placeEnt(e);foeCam(t);say(F.inL).catch(()=>{})},
 update(t,dt){const e=t.ent;if(t.dead||!e)return;e.walk=0;e.ty=Math.atan2(PL.p.x-e.p.x,PL.p.z-e.p.z);physEnt(e,dt,0,0,false);animEnt(e,dt)},
 draw(t){const P=foePanel();const b=nine(F.tab,P.x,P.L.top,P.w,P.L.ph,.95);if(!b)return;F.draw(t,[b[0]+b[2]*.04,b[1]+b[3]*.06,b[2]*.92,b[3]*.88])},
 ui(t){const P=foePanel();const n=t.q.opts.length;optRow(t,t.q.opts.map(v=>({id:'f'+v,label:t.q.drawOpt?null:t.q.lab(v),draw:t.q.drawOpt?(bx=>t.q.drawOpt(String(v),bx)):null})),id=>TD[k].pick(t,id.slice(1)),
  {tab:F.tab,w:k==='phantom'?330:t.q.drawOpt?250:220,h:t.q.drawOpt?150:128,fs:k==='phantom'?34:56,cx:P.x+P.w/2})},
 pick(t,v){if(t.dead||t.won)return;if(String(v)!==String(t.q.ok))return mistake(t,'f'+v,t.q.hint);SFX.ok();t.won=T;
  win(t,async c=>{await wait(900,c);t.won=0;
   if(t.r+1<F.n){t.r++;t.q=F.q(t);say(F.q2,c).catch(()=>{});return}
   t.dead=1;SFX.pop();const p=t.ent.p;cubeBurst(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z),k==='slime'?B.leaf:k==='skeleton'?B.sand:k==='drowned'?B.water:k==='tupik'?B.brick:B.crystal,18);rmEnt(t.ent);
   SV.f['fo_'+k]=1;save(1);await say(F.okL,c).catch(()=>{});await wait(250,c);closeTask()})},
 leave(t){if(!t.dead&&t.ent){t.ent.task=0;t.ent.flee=3}},
 ans(t,good){return['f'+(good?t.q.ok:t.q.opts.find(v=>String(v)!==String(t.q.ok)))]}}});
