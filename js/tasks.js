'use strict';
// ===== Задания зон, встречи с монстрами, сундуки =====
let TASK=null;const TD={};
function openTask(id,arg){if(TASK)closeTask(true);EPOCH++;stopTalk();for(const k in HOLD)delete HOLD[k];DIG=null;
 TASK={id,def:TD[id],r:0,mist:0,lock:false,done:false,ep:EPOCH,t0:T,wob:{},arg};TASK.def.enter(TASK,arg);return TASK}
function closeTask(quiet){if(!TASK)return;const t=TASK;t.done=true;TASK=null;EPOCH++;if(!quiet&&t.def.leave)t.def.leave(t)}
// победная сцена раунда: ввод закрыт только на это время
function win(t,fn){t.lock=true;const c={ep:t.ep};run(async()=>{try{await fn(c)}finally{t.lock=false}})}
function mistake(t,id,hk){t.mist++;t.wob[id]=T;SFX.bad();shake=5;if(hk)sayNow(hk)}
const TYPEN={ac:'ОСТРЫЙ',rt:'ПРЯМОЙ',ob:'ТУПОЙ'},HINT={ac:'h_ac',rt:'h_rt',ob:'h_ob'};
const typeOf=a=>a<90?'ac':a>90?'ob':'rt';
// ---- раскладка: панель по центру, ряд ответов внизу ----
function layout(){const s=safeV();const top=s.y0+128,bot=s.y1-166;const pw=Math.min(1120,s.x1-s.x0-40);return{s,cx:(s.x0+s.x1)/2,top,bot,pw,ph:bot-top,optY:s.y1-92}}
function panel(n){const L=layout();return nine(n||'tab_grey',L.cx-L.pw/2,L.top,L.pw,L.ph)}
function optRow(t,opts,fn,o){o=o||{};const L=layout();const n=opts.length,gap=26,w=Math.min(o.w||360,(L.s.x1-L.s.x0-80-gap*(n-1))/n),h=o.h||128;
 const inW=w*.8-8,inH=h*.62;const fs=Math.min(o.fs||48,...opts.filter(op=>op.label!=null).map(op=>oneSize(op.label,inW,inH,o.fs||48)));
 opts.forEach((op,i)=>{const cx=L.cx+(i-(n-1)/2)*(w+gap);tabBtn(op.id,cx,L.optY,w,h,op.label,()=>fn(op.id),{tab:o.tab,wob:t.wob[op.id],draw:op.draw,fs,one:1,sel:op.sel})})}
function backBtn(){const s=safeV();drawBtn('b_left',s.x0+58,s.y0+58,104);btn('back',s.x0+58,s.y0+58,104,104,()=>{closeTask()})}
// ===================== 1. ШАХТА: угол поворота туннеля =====================
TD.mw={enter(t,i){t.i=i;t.type=['ac','ob','rt'][i];t.a=t.type==='ac'?pick([40,50,60,70]):t.type==='ob'?pick([110,120,130,140]):90;t.a0=pick([0,10,20]);say('m_q').catch(()=>{})},
 focus(t){return[MWALLS[t.i]*TS-TS*1.5,GR*TS+TS*.2]},
 draw(t){const b=panel('tab_grey');if(!b)return;const[x,y,w,h]=b;const R=Math.min(h*.62,w*.24),cx=x+w*.38,cy=y+h*.84;
  angleRays(cx,cy,R*1.55,t.a0,t.a0+t.a,{tex:'stone',th:Math.max(34,R*.28),ar:R*.42});protractor(cx,cy,R,{alpha:.78});
  const bx=x+w*.8,bw=Math.min(w*.3,300),bh=Math.min(h*.5,170);const ib=nine('tab_sand',bx-bw/2,y+h/2-bh/2,bw,bh);if(ib)fitText(t.a+'°',ib,110,'#fff',{one:1})},
 ui(t){backBtn();optRow(t,['ac','rt','ob'].map(k=>({id:k,label:TYPEN[k]})),id=>TD.mw.pick(t,id))},
 pick(t,id){if(id!==t.type)return mistake(t,id,HINT[t.type]);SFX.ok();
  win(t,async c=>{sparks(MWALLS[t.i]*TS+TS/2,(GR+1)*TS,30,'#8ff0ff');await wait(900,c);
   SV.mw=Math.max(SV.mw,t.i+1);for(const r of[GR,GR+1,GR+2])setT(MWALLS[t.i],r,B.dia);save(1);closeTask();burst(MWALLS[t.i]*TS+TS/2,(GR+1)*TS,20,['#8ff0ff','#3ab0e0','#fff'],1);say('m_ok').catch(()=>{});say('b_yes').catch(()=>{})})},
 ans(t,good){return[good?t.type:['ac','rt','ob'].find(k=>k!==t.type)]}};
// ===================== НОЧЬ: паук «острый угол» — лук и транспортир =====================
TD.spider={enter(t){const first=!SV.f.sp1;SV.f.sp1=1;save();t.a=first?pick([45,60]):pick([30,45,60,120,135,150]);t.aim=90;t.D=3.9*TS;t.arrow=null;t.ox=P.x;t.oy=P.y-TS*1.15;
  if(first)say('sp_in').catch(()=>{});say('sp_'+t.a).catch(()=>{})},
 focus(t){return[t.ox+Math.cos(t.a*R2D)*TS*1.2,t.oy-TS*1.1]},
 sp(t){return[t.ox+Math.cos(-t.a*R2D)*t.D,t.oy+Math.sin(-t.a*R2D)*t.D]},
 draw(t){const[sx,sy]=TD.spider.sp(t);const ox=wx(t.ox),oy=wy(t.oy);const R=TS*1.75;
  X.save();X.strokeStyle='rgba(235,235,255,.8)';X.lineWidth=3;X.beginPath();X.moveTo(wx(sx),wy(sy)-TS*1.1);X.lineTo(wx(sx),vis().y0);X.stroke();X.restore();
  if(!t.dead)drawSpr('spider',wx(sx),wy(sy)+TS*.15,HGT.spider*TS,{shadow:0,rot:Math.sin(T*2)*.06,flash:t.hitT&&T-t.hitT<.15});
  protractor(ox,oy,R,{alpha:.85});
  // прицел: стрела по направлению лука
  const a=t.aim*R2D;rod('stick',ox,oy,ox+Math.cos(-a)*R*1.25,oy+Math.sin(-a)*R*1.25,14);drawImg('arrow',ox+Math.cos(-a)*R*1.3,oy+Math.sin(-a)*R*1.3,96,{rot:-a});
  X.save();X.fillStyle='rgba(255,214,64,.4)';X.beginPath();X.moveTo(ox,oy);X.arc(ox,oy,R*.4,-a,0);X.closePath();X.fill();X.restore();
  if(t.arrow){const k=(T-t.arrow.t0)/.45;const d=k*TS*7;const aa=t.arrow.a*R2D;drawImg('arrow',ox+Math.cos(-aa)*d,oy+Math.sin(-aa)*d,96,{rot:-aa})}
  const L=layout();const bw=250,bh=130;const ib=nine('tab_sand',L.cx-bw/2,L.optY-bh/2,bw,bh);if(ib)fitText(t.aim+'°',ib,90,'#fff',{one:1})},
 ui(t){const L=layout(),s=L.s;drawBtn('b_left',s.x0+90,s.y1-90,160);btn('rl',s.x0+90,s.y1-90,160,160,()=>TD.spider.rot(t,15));drawBtn('b_right',s.x0+270,s.y1-90,160);btn('rr',s.x0+270,s.y1-90,160,160,()=>TD.spider.rot(t,-15));
  drawBtn('b_bow',s.x1-100,s.y1-100,180,{pulse:!t.arrow});btn('fire',s.x1-100,s.y1-100,180,180,()=>TD.spider.fire(t))},
 rot(t,d){if(t.dead)return;t.aim=clamp(t.aim+d,0,180);SFX.click()},
 drag(t,x,y){const ox=wx(t.ox),oy=wy(t.oy);const dx=x-ox,dy=oy-y;if(Math.hypot(dx,dy)>TS*3.2||dy<-TS*.3)return;let a=Math.atan2(Math.max(0,dy),dx)/R2D;a=clamp(Math.round(a/15)*15,0,180);if(a!==t.aim){t.aim=a;SFX.click()}},
 fire(t){if(t.arrow&&T-t.arrow.t0<.45)return;SFX.bow();t.arrow={t0:T,a:t.aim};const c={ep:t.ep};
  if(t.aim===t.a){win(t,async c=>{await wait(320,c);const[sx,sy]=TD.spider.sp(t);t.dead=1;SFX.pop();burst(sx,sy,26,['#3a2a4a','#6a4a8a','#ff4040'],1.1);sparks(sx,sy,20);
    await say(t.a<90?'sp_ac':'sp_ob',c).catch(()=>{});await wait(300,c);closeTask();monsterDone()})}
  else{const up=t.aim<t.a;t.mist++;setTimeout(()=>{if(!alive(c))return;t.hitT=0;t.D=Math.min(t.D+.3*TS,4.8*TS);SFX.bad();sayNow(up?'sp_up':'sp_dn')},250)}},
 ans(t,good){if(!good)return['fire'];const n=Math.round((t.a-t.aim)/15);const r=[];for(let i=0;i<Math.abs(n);i++)r.push(n>0?'rl':'rr');r.push('fire');return r}};
// ===================== НОЧЬ: зомби-тупоугольник — стена под прямым углом =====================
TD.zombie={enter(t){const first=!SV.f.zb1;SV.f.zb1=1;save();const sets=[[60,90,120],[45,90,135],[75,90,105]];t.set=shuffle(sets[Math.floor(Math.random()*3)].slice());
  t.dir=boxHits(P.x+4.5*TS,P.y-TS*.2,.3*TS,TS*1.5)?-1:1;t.zx=P.x+t.dir*6*TS;t.stop=P.x+t.dir*3.4*TS;t.wall=null;t.dead=0;
  if(first)say('zb_in').catch(()=>{});else say('zb_in').catch(()=>{})},
 focus(t){return[(P.x+t.zx)/2,P.y-TS*1.2]},
 update(t,dt){const tgt=t.wall&&t.wall.a===90?P.x+t.dir*2.1*TS:t.stop;const d=tgt-t.zx;if(Math.abs(d)>2)t.zx+=Math.sign(d)*Math.min(Math.abs(d),(t.back?2.4:1.3)*TS*dt);t.walk=Math.abs(d)>2},
 wallPts(t){const bx=P.x+t.dir*1.6*TS,by=groundY(bx,P.y-TS*.5);return[bx,by]},
 draw(t){const zy=groundY(t.zx,P.y-TS*.6);if(!t.dead)drawSpr('zombie',wx(t.zx),wy(zy),HGT.zombie*TS,{rot:t.walk?Math.sin(T*8)*.05:0,gnd:wy(zy)});
  if(t.wall){const[bx,by]=TD.zombie.wallPts(t);let a=t.wall.a;const k=T-t.wall.t0;if(a!==90&&k>.35){const fall=ease((k-.35)/.6);a=lerp(a,a<90?0:180,fall)}
   const ang=(t.dir>0?a:180-a)*R2D;for(let i=0;i<3;i++){const cx=bx+Math.cos(-ang)*TS*(i+.5),cy=by+Math.sin(-ang)*TS*(i+.5);const im=IM.t_cobble;if(ok(im)){X.save();X.translate(wx(cx),wy(cy));X.rotate(-ang+Math.PI/2);X.drawImage(im,-TS/2,-TS/2,TS,TS);X.restore()}}
   if(t.wall.a===90||k<.35){X.save();X.translate(wx(bx),wy(by));angleRays(0,0,TS*1.2,t.dir>0?0:180-t.wall.a,t.dir>0?t.wall.a:180,{rod:'iron',th:0.01,ar:TS*.7});X.restore()}}},
 ui(t){optRow(t,t.set.map(a=>({id:'w'+a,label:null,draw:b=>{const[x,y,w,h]=b;const gy=y+h*.92,vx=x+w*.3;rod('stick',x-4,gy,x+w+4,gy,14);const L=h*.95;
   X.save();X.fillStyle='rgba(255,214,64,.55)';X.beginPath();X.moveTo(vx,gy);X.arc(vx,gy,L*.42,-a*R2D,0);X.closePath();X.fill();X.restore();rod('iron',vx,gy,vx+Math.cos(-a*R2D)*L,gy+Math.sin(-a*R2D)*L,24);
   const lb=[x+w*.52,y,w*.48,h*.62];fitText(a+'°',lb,58,'#fff',{one:1})}})),id=>TD.zombie.pick(t,+id.slice(1)),{w:300,h:150})},
 pick(t,a){if(t.dead)return;SFX.place();t.wall={a,t0:T};const c={ep:t.ep};
  if(a===90){win(t,async c=>{await wait(1100,c);SFX.crash();shake=8;t.dead=1;const zy=groundY(t.zx,P.y-TS*.6);burst(t.zx,zy-TS,26,['#4a8a3a','#2a5a9a','#9ad06a'],1.1);
    await say('zb_ok',c).catch(()=>{});await wait(300,c);closeTask();monsterDone()})}
  else{t.mist++;t.wob['w'+a]=T;setTimeout(()=>{if(!alive(c)||!t.wall||t.wall.a!==a)return;SFX.crash();const[bx,by]=TD.zombie.wallPts(t);burst(bx+t.dir*TS,by-TS*.3,14,tileCol(B.cobble),.8);t.back=1;t.stop=P.x+t.dir*4.6*TS;sayNow('zb_bad');
    setTimeout(()=>{if(!alive(c))return;if(t.wall&&t.wall.a===a)t.wall=null;t.back=0;t.stop=P.x+t.dir*3.4*TS},900)},900)}},
 ans(t,good){return[good?'w90':'w'+t.set.find(a=>a!==90)]}};
// ===================== 2. РЕКА: мост из ферм =====================
const SPAN=s=>{const x0=(RX0+3*s)*TS,x1=x0+3*TS,y=GR*TS,m=(x0+x1)/2;return{x0,x1,y,m}};
const SHAPES={
 sq:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-3*TS],[s.x0,s.y-3*TS]],e:[[0,1],[1,2],[2,3],[3,0]],rig:0}),
 tri:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.m,s.y-2.6*TS]],e:[[0,1],[1,2],[2,0]],rig:1}),
 rect:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-1.5*TS],[s.x0,s.y-1.5*TS]],e:[[0,1],[1,2],[2,3],[3,0]],rig:0}),
 pent:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-1.6*TS],[s.m,s.y-2.8*TS],[s.x0,s.y-1.6*TS]],e:[[0,1],[1,2],[2,3],[3,4],[4,0]],rig:0}),
 diag:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-3*TS],[s.x0,s.y-3*TS]],e:[[0,1],[1,2],[2,3],[3,0],[0,2]],rig:1}),
 hmid:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-3*TS],[s.x0,s.y-3*TS],[s.x1,s.y-1.5*TS],[s.x0,s.y-1.5*TS]],e:[[0,1],[1,2],[2,3],[3,0],[4,5]],rig:0}),
 vmid:s=>({p:[[s.x0,s.y],[s.x1,s.y],[s.x1,s.y-3*TS],[s.x0,s.y-3*TS],[s.m,s.y],[s.m,s.y-3*TS]],e:[[0,1],[1,2],[2,3],[3,0],[4,5]],rig:0})};
const RQ=[{o:['sq','tri'],ok:'tri',q:'r1q',bad:'r_sq',good:'r_tri'},{o:['diag','hmid','vmid'],ok:'diag',q:'r2q',bad:'r2_bad',good:'r2_ok'},{o:['tri','rect','pent'],ok:'tri',q:'r3q',bad:'r3_bad',good:'r_tri'}];
// складывание шарнирной рамы: стойки поворачиваются вокруг нижних шарниров, длины балок не меняются
function shear(p,y,phi){return[p[0]+(y-p[1])*Math.sin(phi),y-(y-p[1])*Math.cos(phi)]}
function drawSpanShape(kind,s,o){o=o||{};const sh=SHAPES[kind](s);let pts=sh.p;if(o.phi)pts=pts.map(q=>shear(q,s.y,o.phi));
 X.save();if(o.dy||o.rot){X.translate(wx(s.m),wy(s.y));X.rotate(o.rot||0);X.translate(-wx(s.m),-wy(s.y)+(o.dy||0))}
 rod('planks'in IM?'beam':'beam',wx(s.x0),wy(s.y)+8,wx(s.x1),wy(s.y)+8,22);frame(pts.map(q=>[wx(q[0]),wy(q[1])]),sh.e,20);X.restore()}
function drawBridge(){// опоры и готовые пролёты (видны всегда)
 for(const c of[RX0+3,RX0+6]){rod('log'in IM?'beam':'beam',wx(c*TS),wy((HT-1)*TS),wx(c*TS),wy(GR*TS+TS*.2),34)}
 const built=SV.z>=2?3:(SV.tr.river||0);for(let s=0;s<built;s++){if(TASK&&TASK.id==='river'&&TASK.b&&TASK.r===s)continue;drawSpanShape(RQ[s].ok,SPAN(s))}}
TD.river={enter(t){t.r=SV.tr.river||0;t.b=null;t.opts=shuffle(RQ[t.r].o.slice());if(!SV.f.r0){SV.f.r0=1;say('r0').catch(()=>{})}say(RQ[t.r].q).catch(()=>{})},
 focus(t){const s=SPAN(t.r);return[s.m,s.y-TS*1.0]},
 draw(t){const s=SPAN(t.r);const b=t.b;
  if(!b){if(t.r===1)drawSpanShape('sq',s,{alpha:1});return}
  const k=T-b.t0;let phi=0,dy=0,rot=0;
  if(!b.rig&&k>1.0)phi=Math.min(40*R2D,(k-1.0)*1.3);if(!b.rig&&k>1.6){const f=k-1.6;dy=f*f*900;rot=f*.7*(b.kind==='tri'?0:1)}
  if(!b.rig&&k>1.9&&!b.spl){b.spl=1;SFX.splash();burst(s.m,(GR+1)*TS,30,['#3a7bd5','#7fb4f0','#ffffff'],1.2,10)}
  if(k<2.6||b.rig){if(dy<TS*5)drawSpanShape(b.kind,s,{phi,dy,rot});}
  // вагонетка с грузом проверяет пролёт
  const cx=b.rig?lerp(s.x0-TS,s.x1+TS*.6,clamp((k-.4)/1.6,0,1)):lerp(s.x0-TS,s.m,clamp((k-.4)/.6,0,1));const cy=s.y+(b.rig?0:dy);
  if(k>.3&&dy<TS*5)drawImg('cart',wx(cx),wy(cy)-TS*.42,TS*1.15)},
 ui(t){backBtn();optRow(t,t.opts.map(k=>({id:k,label:null,draw:bx=>{const[x,y,w,h]=bx;const S0={x0:0,x1:3*TS,y:0,m:1.5*TS};const sh=SHAPES[k](S0);const sc=Math.min(w*.95/(3*TS),h*1.0/(3*TS));
   X.save();X.translate(x+w/2-1.5*TS*sc,y+h*.98);X.scale(sc,sc);for(const[a,c]of sh.e){X.strokeStyle='#7a4a1a';X.lineWidth=26;X.lineCap='round';X.beginPath();X.moveTo(...sh.p[a]);X.lineTo(...sh.p[c]);X.stroke();X.strokeStyle='#c08a4a';X.lineWidth=14;X.stroke()}X.restore()}})),id=>TD.river.pick(t,id),{w:300,h:150})},
 pick(t,id){const q=RQ[t.r];t.b={kind:id,t0:T,rig:SHAPES[id](SPAN(0)).rig};SFX.place();
  if(id!==q.ok){t.mist++;t.wob[id]=T;const c={ep:t.ep},b=t.b;setTimeout(()=>{if(alive(c)&&t.b===b){SFX.crash();sayNow(q.bad)}},1100);setTimeout(()=>{if(alive(c)&&t.b===b)t.b=null},2700);return}
  win(t,async c=>{await say(q.good,c).catch(()=>{});await wait(Math.max(0,2300-(T-t.b.t0)*1000),c);SFX.ok();const s=SPAN(t.r);for(let cc=RX0+3*t.r;cc<RX0+3*t.r+3;cc++)tset(cc,GR,B.deck);
   SV.tr.river=t.r+1;save(1);t.b=null;
   if(t.r+1>=3){SV.z=Math.max(SV.z,2);save(1);closeTask();sparks(s.m,s.y-TS,30);say('r_done').catch(()=>{});return}
   t.r++;t.opts=shuffle(RQ[t.r].o.slice());say(RQ[t.r].q,c).catch(()=>{})})},
 ans(t,good){const q=RQ[t.r];return[good?q.ok:t.opts.find(k=>k!==q.ok)]}};
// ===================== 3. КУЗНИЦА: кирки по типам углов =====================
TD.forge={enter(t){t.r=SV.tr.forge||0;TD.forge.deal(t);if(!SV.f.v0){SV.f.v0=1;say('v0').catch(()=>{})}say(t.r?'v_r2':'v_q').catch(()=>{})},
 deal(t){const ty=shuffle(['ac','rt','ob']);t.items=ty.map((k,i)=>({id:'it'+i,type:k,a:k==='ac'?pick([30,45,60,70]):k==='ob'?pick([110,120,135,150]):90,loc:null}));t.sel=null},
 focus(){return[94*TS,GR*TS-TS*1.2]},
 draw(t){const b=panel('board');if(!b)return;const[x,y,w,h]=b;const n=t.items.length;
  t.items.forEach((it,i)=>{if(it.loc)return;const cx=x+w*(i+.5)/n,cy=y+h*.78-(t.sel===it.id?16+Math.sin(T*6)*4:0);const L=Math.min(w/n*.42,h*.62);
   const a0=it.a>100?-10:0;X.save();if(t.sel===it.id){X.shadowColor='#ffe066';X.shadowBlur=30}
   angleRays(cx-L*.25,cy,L,a0,a0+it.a,{rod:'stick',th:22,arc:true,ar:L*.36});X.restore();
   const hx=cx-L*.25+Math.cos(-(a0+it.a)*R2D)*L,hy=cy+Math.sin(-(a0+it.a)*R2D)*L;rod('iron',cx-L*.25,cy,hx,hy,30);
   if(t.r===0)txt(it.a+'°',cx-L*.25+Math.cos(-(a0+it.a/2)*R2D)*L*.62,cy+Math.sin(-(a0+it.a/2)*R2D)*L*.62,Math.max(34,L*.3),'#fff');
   btn(it.id,cx,y+h*.5,w/n*.9,h*.9,()=>TD.forge.tapItem(t,it.id))})},
 ui(t){backBtn();const L=layout();const gap=26,w=Math.min(380,(L.s.x1-L.s.x0-80-gap*2)/3),h=128;const fs=Math.min(...['ac','rt','ob'].map(k=>oneSize(TYPEN[k],w*.56,h*.5,44)));
  ['ac','rt','ob'].forEach((k,i)=>{const cx=L.cx+(i-1)*(w+gap),cy=L.optY;const inn=t.items.filter(it=>it.loc===k).length;
   const wob=t.wob['ch_'+k]?Math.sin((T-t.wob['ch_'+k])*40)*Math.max(0,1-(T-t.wob['ch_'+k])*2.5)*10:0;
   X.save();if(t.sel){X.shadowColor='rgba(255,230,120,.9)';X.shadowBlur=26}const tb=nine('tab_grey',cx-w/2+wob,cy-h/2,w,h);X.restore();
   if(tb){const cw=Math.min(tb[3]*1.25,tb[2]*.36);drawImg(inn?'chest_open':'chest',tb[0]+cw/2,cy,cw);if(inn)txt('×'+inn,tb[0]+cw*.8,cy+tb[3]*.36,30,'#ffe066');fitText(TYPEN[k],[tb[0]+cw+6,tb[1],tb[2]-cw-6,tb[3]],fs,'#fff',{one:1})}
   btn('ch_'+k,cx,cy,w,h,()=>TD.forge.tapChest(t,k))})},
 tapItem(t,id){t.sel=t.sel===id?null:id},
 tapChest(t,k){if(!t.sel){const it=t.items.slice().reverse().find(it=>it.loc===k);if(it){it.loc=null;SFX.click()}return}// исправить: забрать кирку обратно
  const it=t.items.find(q=>q.id===t.sel);t.sel=null;if(it.type!==k)return mistake(t,'ch_'+k,HINT[it.type]);it.loc=k;SFX.ok();sparks(layout().cx,layout().optY,8);
  if(t.items.every(q=>q.loc))win(t,async c=>{SFX.star();await wait(900,c);t.r++;SV.tr.forge=t.r;save(1);
   if(t.r>=2){SV.z=Math.max(SV.z,3);SV.armor=1;save(1);for(const r of[GR-2,GR-1])tset(119,r,B.air);burst(119.5*TS,(GR-1)*TS,30,['#ccc','#888','#fff'],1);closeTask();say('v_done').catch(()=>{});return}
   TD.forge.deal(t);say('v_r2',c).catch(()=>{})})},
 ans(t,good){const it=t.items.find(q=>!q.loc);if(!it)return[];return[it.id,'ch_'+(good?it.type:['ac','rt','ob'].find(k=>k!==it.type))]}};
// ===================== 4. ПУСТЫНЯ: сумма углов 180° =====================
const DQ=[{a:50,b:70,o:[60,70,80]},{a:90,b:40,o:[50,40,90]},{a:30,b:110,o:[40,50,70]}];
function triPts(a,b,box){const[x,y,w,h]=box;const A=a*R2D,Bb=b*R2D;// основание 1, вершина по углам
 const cx=Math.tan(Bb)/(Math.tan(A)+Math.tan(Bb));let px=cx,py=cx*Math.tan(A);if(b===90){px=1;py=Math.tan(A)}if(a===90){px=0;py=Math.tan(Bb)}
 const minx=Math.min(0,px),maxx=Math.max(1,px),sc=Math.min(w*.86/(maxx-minx),h*.78/py);const ox=x+w/2-(minx+maxx)/2*sc,oy=y+h*.9;return[[ox,oy],[ox+sc,oy],[ox+px*sc,oy-py*sc]]}
TD.desert={enter(t){t.r=SV.tr.desert||0;t.opts=shuffle(DQ[t.r].o.slice());if(!SV.f.d0){SV.f.d0=1;say('d0').catch(()=>{})}say('d_q').catch(()=>{})},
 focus(){return[140*TS,GR*TS-TS*2.4]},
 draw(t){const b=panel('tab_sand');if(!b)return;const[x,y,w,h]=b;const q=DQ[t.r],c=180-q.a-q.b;const tb=[x+w*.02,y+h*.02,w*.6,h*.96];const p=triPts(q.a,q.b,tb);
  triFill(p,'sandstone',{lw:10});const fs=Math.max(32,h*.12),rr=Math.min(h*.13,60);
  arcAt(p[0],p[1],p[2],rr,'#ff7a3a',q.a+'°',fs);arcAt(p[1],p[2],p[0],rr,'#3ab0ff',q.b+'°',fs);
  const done=t.win;arcAt(p[2],p[0],p[1],rr*.85,'#7ad04a',done?c+'°':'?',fs*1.1);
  // справа: углы складываются в развёрнутый угол 180° (ровная линия) и равенство на табличке
  const cw=w*.34,lx=x+w*.82,R=Math.min(cw*.42,h*.3),ly=y+h*.5;rod('stick',lx-R*1.18,ly,lx+R*1.18,ly,12);
  const k=done?ease((T-t.win)/1.1):0;const segs=[[q.a,'#ff7a3a'],[q.b,'#3ab0ff'],[c,'#7ad04a']];let st=0;
  for(const[s0,col]of segs){const show=done||st+s0<=q.a+q.b;if(show||done){X.save();X.globalAlpha=done?.85:.5;X.fillStyle=col;X.beginPath();X.moveTo(lx,ly);X.arc(lx,ly,R,-(st+s0)*R2D,-st*R2D);X.closePath();X.fill();X.restore()}else{X.save();X.setLineDash([10,8]);X.strokeStyle='#7ad04a';X.lineWidth=5;X.beginPath();X.moveTo(lx,ly);X.arc(lx,ly,R,-(st+s0)*R2D,-st*R2D);X.closePath();X.stroke();X.restore()}st+=s0}
  const eb=nine('tab_grey',lx-cw/2,ly+h*.06,cw,h*.4);if(eb)fitText(q.a+'° + '+q.b+'° + '+(done?c+'°':'?')+' = 180°',eb,44,'#fff')},
 ui(t){backBtn();optRow(t,t.opts.map(v=>({id:'o'+v,label:v+'°'})),id=>TD.desert.pick(t,+id.slice(1)),{tab:'tab_sand',w:280,fs:60})},
 pick(t,v){const q=DQ[t.r];if(v!==180-q.a-q.b)return mistake(t,'o'+v,'d_bad');SFX.ok();t.win=T;
  win(t,async c=>{say('d_ok',c).catch(()=>{});await wait(2300,c);const[gc,gr]=PYR.gaps[t.r];tset(gc,gr,B.pyr);burst((gc+.5)*TS,(gr+.5)*TS,16,tileCol(B.sst),.8);
   t.r++;SV.tr.desert=t.r;save(1);t.win=0;
   if(t.r>=3){SV.z=Math.max(SV.z,4);save(1);for(const r of[GR-2,GR-1])tset(155,r,B.air);closeTask();say('d_done').catch(()=>{});return}
   t.opts=shuffle(DQ[t.r].o.slice());say('d_q',c).catch(()=>{})})},
 ans(t,good){const q=DQ[t.r],c=180-q.a-q.b;return['o'+(good?c:t.opts.find(v=>v!==c))]}};
// ===================== 5. ЗАМОК: виды треугольников + треугольная крыша =====================
const CQ={eq:[5,5,5],iso:[6,6,4],sc:[4,5,6]},CN={eq:'РАВНОСТОРОННИЙ',iso:'РАВНОБЕДРЕННЫЙ',sc:'РАЗНОСТОРОННИЙ'},CH={eq:'c_eq',iso:'c_iso',sc:'c_sc'};
function triSides(a,b,c,box){// стороны: основание c, боковые a (слева), b (справа)
 const[x,y,w,h]=box;const px=(a*a-b*b+c*c)/(2*c),py=Math.sqrt(Math.max(0,a*a-px*px));const sc=Math.min(w*.84/c,h*.76/py);const ox=x+w/2-c*sc/2,oy=y+h*.84;return[[ox,oy],[ox+c*sc,oy],[ox+px*sc,oy-py*sc]]}
TD.castle={enter(t){t.r=SV.tr.castle||0;if(!SV.f.ord){SV.f.ord=shuffle(['eq','iso','sc'])}t.ord=SV.f.ord;if(!SV.f.c0){SV.f.c0=1;say('c0').catch(()=>{})}say(t.r<3?'c_q':'c_roof').catch(()=>{})},
 focus(t){return t.r<3?[179.5*TS,GR*TS-TS*1.6]:[180*TS,5*TS]},
 draw(t){if(t.r>=3){for(const[c,r]of ROOF)if(!tget(c,r)){X.save();X.globalAlpha=.35+.25*Math.sin(T*5);const i=IM.t_castle;if(ok(i))X.drawImage(i,wx(c*TS),wy(r*TS),TS,TS);X.strokeStyle='#ffe066';X.lineWidth=5;X.strokeRect(wx(c*TS)+3,wy(r*TS)+3,TS-6,TS-6);X.restore()}return}
  const L=layout();const pw=Math.min(L.pw*.62,760);const b=nine('tab_purple',L.s.x0+20+(L.cx-L.pw/2-L.s.x0-20)*.5,L.top,pw,L.ph);if(!b)return;const[x,y,w,h]=b;const k=t.ord[t.r],sd=CQ[k];const p=triSides(sd[0],sd[1],sd[2],[x+w*.1,y+h*.06,w*.8,h*.94]);
  if(t.brk&&T-t.brk<1)X.globalAlpha=1-(T-t.brk);triFill(p,'castle',{lw:12,st:'#ffe066'});X.globalAlpha=1;
  const lab=(a,b2,v)=>{const mx=(a[0]+b2[0])/2,my=(a[1]+b2[1])/2,cx=(p[0][0]+p[1][0]+p[2][0])/3,cy=(p[0][1]+p[1][1]+p[2][1])/3;const d=Math.hypot(mx-cx,my-cy)||1;const fs=Math.max(40,h*.15);txt(String(v),mx+(mx-cx)/d*fs*.95,my+(my-cy)/d*fs*.85,fs,'#fff')};
  lab(p[0],p[2],sd[0]);lab(p[1],p[2],sd[1]);lab(p[0],p[1],sd[2]);
  const eq=(u,v)=>u===v;const tk=[[p[0],p[2],sd[0]],[p[1],p[2],sd[1]],[p[0],p[1],sd[2]]];tk.forEach(([a,b2,v])=>{const same=sd.filter(s=>s===v).length;if(same>1)ticks(a,b2,same===3?1:2)})},
 ui(t){if(t.r>=3){backBtn();return}backBtn();optRow(t,['eq','iso','sc'].map(k=>({id:k,label:CN[k]})),id=>TD.castle.pick(t,id),{tab:'tab_purple',w:380,fs:40,one:1})},
 pick(t,id){const k=t.ord[t.r];if(id!==k)return mistake(t,id,CH[k]);SFX.ok();t.brk=T;
  win(t,async c=>{SFX.crash();shake=10;burst(180*TS,GR*TS-TS*2,30,tileCol(B.castle),1.2);await say('c_ok',c).catch(()=>{});await wait(500,c);t.brk=0;t.r++;SV.tr.castle=t.r;save(1);say(t.r<3?'c_q':'c_roof',c).catch(()=>{})})},
 tapTile(t,c,r){if(t.r<3)return true;const inR=ROOF.some(([a,b])=>a===c&&b===r);if(!inR)return false;
  if(tget(c,r)===B.roof){tset(c,r,0);SFX.dig();burst((c+.5)*TS,(r+.5)*TS,8,tileCol(B.castle),.6);return true}// исправить: убрать блок крыши
  if(tget(c,r))return true;const cx=(c+.5)*TS;if(Math.abs(cx-P.x)<P.hw+TS/2&&r*TS<P.y&&(r+1)*TS>P.y-P.h)return true;
  tset(c,r,B.roof);SFX.place();burst(cx,(r+.5)*TS,8,tileCol(B.castle),.5);
  if(ROOF.every(([a,b])=>tget(a,b)===B.roof))win(t,async c2=>{SFX.star();sparks(180.5*TS,4*TS,40);await wait(600,c2);await say('c_win',c2).catch(()=>{});await wait(600,c2);SV.z=5;SV.tr.castle=4;save(1);go('fin')});return true},
 ans(t,good){if(t.r>=3)return['roof'];const k=t.ord[t.r];return[good?k:['eq','iso','sc'].find(q=>q!==k)]}};
// ===================== СУНДУКИ С ЗАГАДКАМИ =====================
const SQ=[{o:['2','3','4'],ok:'4'},{o:['2','3','4'],ok:'3'},{o:['90°','180°','360°'],ok:'180°'},{o:['Да','Нет'],ok:'Нет'}];
TD.chest={enter(t,i){t.i=i;t.opts=SQ[i].o.slice();say('ch').catch(()=>{});say('s'+(i+1)).catch(()=>{})},
 focus(t){const c=CHESTS[t.i];return[(c.c+.5)*TS,c.r*TS]},
 draw(t){const b=panel('board');if(!b)return;const[x,y,w,h]=b;drawImg(t.won?'chest_open':'chest',x+w*.2,y+h*.55,Math.min(h*.7,220));if(t.won)drawImg('star',x+w*.2,y+h*.3-Math.sin(T*3)*8,Math.min(h*.45,140),{glow:'#ffe066'});
  const qb=[x+w*.38,y+h*.08,w*.58,h*.84];fitText(LINES['s'+(t.i+1)].t,qb,56,'#fff')},
 ui(t){backBtn();optRow(t,t.opts.map(v=>({id:'q'+v,label:v})),id=>TD.chest.pick(t,id.slice(1)),{w:280,fs:64})},
 pick(t,v){if(v!==SQ[t.i].ok)return mistake(t,'q'+v,'s_bad');SFX.star();t.won=1;
  win(t,async c=>{SV.st[t.i]=1;save(1);sparks(P.x,P.y-TS,30);await say('s_ok',c).catch(()=>{});await wait(400,c);closeTask()})},
 ans(t,good){return['q'+(good?SQ[t.i].ok:t.opts.find(v=>v!==SQ[t.i].ok))]}};
// ---- ночь и монстры ----
const DAY={t:0,night:false,spawn:0,next:'spider',kills:0};const DAYLEN=70,NIGHTLEN=45;
function monsterDone(){DAY.kills++;DAY.spawn=8}
