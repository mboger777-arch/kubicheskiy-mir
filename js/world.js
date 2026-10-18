'use strict';
// ===== Мир из блоков: тайлы, физика, камера, копание/стройка =====
const TS=96,WT=192,HT=16,GR=10; // размер блока (дизайн-пиксели), ширина/высота мира в блоках, ряд поверхности
// типы блоков (картинки — нарисованные текстуры assets/tiles)
const TT=[{n:null},{n:'grass',drop:2},{n:'dirt'},{n:'cobble'},{n:'stone',drop:3},{n:'diamond_ore',drop:'dia'},{n:'gold_ore'},{n:'bedrock',hard:1},{n:'sand'},{n:'sandstone'},{n:'planks'},{n:'log'},{n:'leaves'},{n:'castle'},{n:'brick'},{n:'water',fluid:1,hard:1},{n:'iron',hard:1},
 {n:'diamond_ore',hard:1,cw:1},{n:'stone',hard:1},{n:'castle',hard:1},{n:'cobble',hard:1},{n:'planks',hard:1},{n:'sandstone',hard:1},{n:'castle',hard:1,roof:1},{n:'log',pass:1,drop:11},{n:'leaves',pass:1,drop:12}];
const B={air:0,grass:1,dirt:2,cobble:3,stone:4,dia:5,gold:6,bed:7,sand:8,sst:9,plank:10,log:11,leaf:12,castle:13,brick:14,water:15,iron:16,cwall:17,rock:18,hcastle:19,hcob:20,deck:21,pyr:22,roof:23,tlog:24,tleaf:25};
['grass','dirt','cobble','stone','diamond_ore','gold_ore','bedrock','sand','sandstone','planks','log','leaves','castle','brick','water','iron'].forEach(n=>img('t_'+n,'assets/tiles/'+n+'.png'));
const TCOL={};// средний цвет текстуры для крошек
let WORLD=new Uint8Array(WT*HT);
const tget=(c,r)=>(c<0||c>=WT||r<0||r>=HT)?B.bed:WORLD[r*WT+c];
const tset=(c,r,v)=>{if(c>=0&&c<WT&&r>=0&&r<HT)WORLD[r*WT+c]=v};
const solid=t=>t!==0&&!TT[t].fluid&&!TT[t].pass; // деревья — сквозные (можно рубить, но они не загораживают дорогу)
// ---- зоны ----
const ZONES=[{n:'forest',x0:0,x1:21},{n:'mine',x0:21,x1:56},{n:'river',x0:56,x1:86},{n:'village',x0:86,x1:120},{n:'desert',x0:120,x1:156},{n:'castle',x0:156,x1:WT}];
const RX0=66,RX1=75;// река: 9 блоков = 3 пролёта по 3
const PLOT=[99,111];// участок для домика
const PYR={x0:136,gaps:[[139,8],[142,6],[145,8]]};// пирамида и 3 выбитых блока
const ROOF=[[178,5],[179,5],[180,5],[181,5],[182,5],[179,4],[180,4],[181,4],[180,3]];
const CHESTS=[{c:13,r:11,z:0},{c:118,r:5,z:3},{c:128,r:11,z:4},{c:163,r:9,z:5}];// клад: клетка сначала закрыта блоком, выкопал — нашёл
const MWALLS=[29,40,50];// кристальные стены шахты (x), ряды 10-12
function genWorld(){WORLD=new Uint8Array(WT*HT);const F=(c0,c1,r0,r1,t)=>{for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++)tset(c,r,t)};
 // базовая земля
 for(let c=0;c<WT;c++){const z=zoneOf(c);let top=GR;
  const surf=z==='desert'?B.sand:z==='castle'?B.hcastle:B.grass,sub=z==='desert'?B.sst:z==='castle'?B.castle:B.dirt;
  tset(c,top,surf);F(c,c,top+1,top+2,sub);F(c,c,top+3,HT-2,z==='desert'?B.sst:B.stone);tset(c,HT-1,B.bed)}
 F(0,0,0,HT-1,B.bed);F(WT-1,WT-1,0,HT-1,B.bed);
 // лес: деревья, золото глубоко под землёй
 const tree=(c,h)=>{F(c,c,GR-h,GR-1,B.tlog);F(c-1,c+1,GR-h-2,GR-h,B.tleaf);tset(c,GR-h-3,B.tleaf)};tree(5,3);tree(16,4);
 F(10,11,GR+3,GR+4,B.gold);
 // гора над шахтой (непробиваемая скала), туннель рядов 10-12 (3 блока высотой), спуск и подъём ступеньками
 F(23,51,1,GR-1,B.rock);F(23,51,1,1,B.grass);
 F(20,22,GR,GR+2,B.air);F(23,52,GR,GR+2,B.air);F(20,20,GR+1,GR+2,B.stone);F(21,21,GR+2,GR+2,B.stone);
 F(53,53,GR,GR+1,B.air);F(53,53,GR+2,GR+2,B.stone);F(54,54,GR,GR,B.air);F(54,54,GR+1,GR+2,B.stone);F(55,55,GR,GR,B.grass);
 // в туннеле — завалы, которые надо прокопать, и высокая пещера
 F(25,26,GR,GR+2,B.dirt);F(34,38,GR-3,GR-1,B.air);F(45,46,GR,GR+2,B.stone);tset(46,GR+1,B.gold);tset(45,GR,B.dirt);
 MWALLS.forEach(c=>F(c,c,GR,GR+2,B.cwall));
 // река
 F(RX0,RX1-1,GR,GR,B.air);F(RX0,RX1-1,GR+1,HT-2,B.water);
 // деревня: полка у стены с сундуком (надо построить лесенку), под ней проход к воротам
 F(118,118,GR-4,GR-3,B.hcob);F(119,119,0,GR-1,B.hcob);F(119,119,GR-2,GR-1,B.iron);
 // пустыня: пирамида
 for(let k=0;k<7;k++)F(PYR.x0+k,PYR.x0+12-k,GR-1-k,GR-1-k,B.pyr);
 PYR.gaps.forEach(([c,r])=>tset(c,r,B.air));F(155,155,0,GR-1,B.hcastle);F(155,155,GR-2,GR-1,B.iron);
 // замок: башня, лестница, тайник за кирпичами
 F(178,182,6,GR-1,B.hcastle);F(175,175,GR-1,GR-1,B.castle);F(176,176,GR-2,GR-1,B.castle);F(177,177,GR-3,GR-1,B.castle);
 F(162,164,9,9,B.brick);
 // кактусы
 [124,131,151].forEach(c=>F(c,c,GR-2,GR-1,B.tleaf));
 applyState()}
function zoneOf(c){for(const z of ZONES)if(c>=z.x0&&c<z.x1)return z.n;return 'castle'}
// состояние прохождения → мир (стены открыты, мост, ворота) + изменения игрока
function applyState(){
 for(let i=0;i<SV.mw;i++)for(const r of[GR,GR+1,GR+2]){const k=MWALLS[i]+','+r;tset(MWALLS[i],r,SV.diff[k]!=null?SV.diff[k]:B.dia)}
 if(SV.z>=2){}
 const spans=SV.z>=2?3:(SV.tr.river||0);for(let s=0;s<spans;s++)for(let c=RX0+s*3;c<RX0+s*3+3;c++)tset(c,GR,B.deck);
 if(SV.z>=3)for(const r of[GR-2,GR-1])tset(119,r,B.air);
 const pg=SV.z>=4?3:(SV.tr.desert||0);for(let i=0;i<pg;i++)tset(PYR.gaps[i][0],PYR.gaps[i][1],B.pyr);
 if(SV.z>=4)for(const r of[GR-2,GR-1])tset(155,r,B.air);
 for(const k in SV.diff){const[c,r]=k.split(',').map(Number);const t=tget(c,r);if(!TT[t].hard||t===B.dia)tset(c,r,SV.diff[k])}
 if(SV.z>=5)ROOF.forEach(([c,r])=>tset(c,r,B.roof));}
// ---- игрок и спутники ----
const P={x:3.5*TS,y:GR*TS,vx:0,vy:0,onG:true,face:1,walk:0,safe:[3.5*TS,GR*TS],hw:.34*TS,h:1.85*TS};
const DOG={x:2*TS,y:GR*TS,sit:1,walk:0};
let CAM={x:0,y:0},NIGHT=0,MODE='dig',SEL=null,ZSEEN='forest';
const RUN=4.3*TS,GRAV=32*TS,JUMPV=Math.sqrt(2*32*1.32)*TS;
function boxHits(x,y,hw,h){const c0=Math.floor((x-hw)/TS),c1=Math.floor((x+hw-.01)/TS),r0=Math.floor((y-h)/TS),r1=Math.floor((y-.01)/TS);for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++)if(solid(tget(c,r)))return true;return false}
function inWater(x,y){const t=tget(Math.floor(x/TS),Math.floor((y-TS*.3)/TS));return TT[t].fluid}
function physics(dt,mx,jump){P.vx=mx*RUN;if(mx)P.face=mx;
 if(jump&&P.onG){P.vy=-JUMPV;P.onG=false;SFX.jump()}
 P.vy=Math.min(P.vy+GRAV*dt,20*TS);
 // по X (ступенька в полблока — заходит сама)
 let nx=P.x+P.vx*dt;if(boxHits(nx,P.y,P.hw,P.h)){if(P.onG&&!boxHits(nx,P.y-TS*.52,P.hw,P.h)&&false){}else{nx=P.vx>0?Math.floor((P.x+P.hw)/TS+1)*TS-P.hw-.01:Math.floor((P.x-P.hw)/TS)*TS+P.hw+.01;if(boxHits(nx,P.y,P.hw,P.h))nx=P.x}P.vx=0}
 P.x=clamp(nx,TS+P.hw,(WT-1)*TS-P.hw);
 let ny=P.y+P.vy*dt;P.onG=false;
 if(boxHits(P.x,ny,P.hw,P.h)){if(P.vy>0){ny=Math.floor(ny/TS)*TS;P.onG=true;if(boxHits(P.x,ny,P.hw,P.h))ny=P.y}else{ny=Math.floor((ny-P.h)/TS+1)*TS+P.h+.01;if(boxHits(P.x,ny,P.hw,P.h))ny=P.y}P.vy=0}
 P.y=ny;if(!P.onG&&!boxHits(P.x,P.y+1,P.hw,P.h)){}else if(P.vy>=0&&boxHits(P.x,P.y+1,P.hw,P.h)){P.onG=true}
 if(P.onG&&!inWater(P.x,P.y))P.safe=[P.x,P.y];
 if(inWater(P.x,P.y)){SFX.splash();burst(P.x,P.y-TS*.4,14,['#3a7bd5','#7fb4f0','#ffffff'],.8,8);P.x=P.safe[0]-P.face*TS*.6;P.y=P.safe[1];P.vy=0;if(boxHits(P.x,P.y,P.hw,P.h))P.x=P.safe[0];hint('t_water')}
 P.walk=mx&&P.onG?P.walk+dt*9:0}
// стоит ли что-то на земле: верх ближайшего твёрдого блока под точкой (начиная с ряда r0)
function groundY(x,y0){const c=Math.floor(x/TS);for(let r=Math.max(0,Math.floor((y0)/TS));r<HT;r++)if(solid(tget(c,r)))return r*TS;return HT*TS}
function stepDog(dt){const tx=P.x-P.face*1.25*TS;const d=tx-DOG.x;const far=Math.abs(P.x-DOG.x)>8*TS||Math.abs(P.y-DOG.y)>3*TS;
 if(P.onG&&far){DOG.x=P.x-P.face*1.25*TS;if(boxHits(DOG.x,P.y,.3*TS,TS))DOG.x=P.x;DOG.y=groundY(DOG.x,P.y-TS*.5);sparks(DOG.x,DOG.y-TS*.5,8);return}
 if(Math.abs(d)>TS*.3){const nx=DOG.x+Math.sign(d)*Math.min(Math.abs(d),6*TS*dt);const gy=groundY(nx,DOG.y-TS*1.05);if(!boxHits(nx,gy,.3*TS,TS*.95)&&Math.abs(gy-DOG.y)<=TS*1.05){DOG.x=nx;DOG.y=gy;DOG.walk+=dt*10}}
 else DOG.walk=0;const gy=groundY(DOG.x,DOG.y-TS*.5);if(Math.abs(gy-DOG.y)<TS*1.1)DOG.y=gy;
 // не стоять внутри Блоки
 if(Math.abs(DOG.x-P.x)<TS*.85&&P.onG&&Math.abs(DOG.y-P.y)<TS){const nx=P.x-P.face*TS*.95;const g2=groundY(nx,P.y-TS*.5);if(!boxHits(nx,g2,.3*TS,TS*.95)&&Math.abs(g2-P.y)<TS*1.05){DOG.x=nx;DOG.y=g2}}}
// ---- камера ----
function camTarget(){const v=vis();let fx=P.x,fy=P.y-TS*.9;if(TASK&&TASK.def.focus){const f=TASK.def.focus(TASK);if(f){fx=f[0];fy=f[1]}}
 return[clamp(fx-v.w/2,TS*.5,WT*TS-v.w-TS*.5),clamp(fy-v.h*.5,0,HT*TS-v.h)]}
function stepCam(dt,snap){const[tx,ty]=camTarget();if(snap){CAM.x=tx;CAM.y=ty}else{CAM.x+=(tx-CAM.x)*Math.min(1,dt*6);CAM.y+=(ty-CAM.y)*Math.min(1,dt*5)}}
// мир -> экран (дизайн)
const wx=x=>x-CAM.x+vis().x0,wy=y=>y-CAM.y+vis().y0;
const sxw=x=>x+CAM.x-vis().x0,syw=y=>y+CAM.y-vis().y0;
// ---- фон: нарисованный пейзаж зоны (cover), лёгкий параллакс, плавная смена ----
['forest','mine','river','village','desert','castle'].forEach(n=>img('bg_'+n,'assets/bg_'+n+'.jpg'));
let BGA='forest',BGB=null,BGT=1;
function zoneHere(){const c=Math.floor(P.x/TS);let z=zoneOf(c);if(c>=20&&c<56&&P.y>GR*TS+TS*.5)z='mine';if(z==='mine'&&P.y<=GR*TS+TS*.5)z=c<38?'forest':'river';return z}
function drawBg(n,a){const i=IM['bg_'+n];if(!ok(i))return;const v=vis(),s=Math.max(v.w/1600,v.h/900)*1.12;const w=1600*s,h=900*s;const px=(CAM.x/(WT*TS-v.w+1));const x=v.x0-(w-v.w)*clamp(px*3%1,0,1)*0+(-(w-v.w)/2)+((.5-((CAM.x/TS)%40)/40)*(w-v.w)*.0);
 X.globalAlpha=a;X.drawImage(i,v.x0+(v.w-w)/2-((CAM.x*.04)%((w-v.w)/2+1)),v.y0+(v.h-h)/2-(CAM.y-(HT*TS-v.h)/2)*.03,w,h);X.globalAlpha=1}
function bgUpdate(dt){const z=zoneHere();if(z!==BGA&&z!==BGB){BGB=z;BGT=0}if(BGB){BGT+=dt*1.4;if(BGT>=1){BGA=BGB;BGB=null;BGT=1}}}
function drawBgAll(){const v=vis();X.fillStyle='#1b2433';X.fillRect(v.x0,v.y0,v.w,v.h);drawBg(BGA,1);if(BGB)drawBg(BGB,ease(BGT))}
// ---- тайлы ----
function drawTiles(){const v=vis();const c0=Math.max(0,Math.floor(CAM.x/TS)),c1=Math.min(WT-1,Math.floor((CAM.x+v.w)/TS)+1),r0=Math.max(0,Math.floor(CAM.y/TS)),r1=Math.min(HT-1,Math.floor((CAM.y+v.h)/TS)+1);
 for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const t=WORLD[r*WT+c];if(!t)continue;const d=TT[t];const i=IM['t_'+d.n];const x=wx(c*TS),y=wy(r*TS);
  let k=1,ox=0,oy=0;if(DIG&&DIG.c===c&&DIG.r===r){const p=DIG.t/DIG.d;ox=Math.sin(T*70)*4*p;k=1-.08*p}
  if(ok(i)){if(d.fluid){X.globalAlpha=.88;X.drawImage(i,0,(T*20)%10,i.naturalWidth,i.naturalHeight-10,x,y,TS+.6,TS+.6);X.globalAlpha=1}else X.drawImage(i,x+ox+TS*(1-k)/2,y+oy+TS*(1-k)/2,TS*k+.6,TS*k+.6)}
  else{X.fillStyle='#777';X.fillRect(x,y,TS,TS)}
  if(d.cw){X.save();X.globalCompositeOperation='lighter';X.globalAlpha=.25+.15*Math.sin(T*3+c);X.fillStyle='#5fd0ff';X.fillRect(x,y,TS,TS);X.restore()}
  // мягкая тень под нависающим блоком и в глубине — объём, как в кубическом мире
  if(!d.fluid){const up=tget(c,r-1);if(solid(up)){X.fillStyle='rgba(0,0,0,.16)';X.fillRect(x,y,TS+.6,TS+.6)}}}}
// крошки цвета текстуры
function tileCol(t){const n=TT[t].n;if(TCOL[n])return TCOL[n];const i=IM['t_'+n];if(!ok(i))return '#888';try{const c=document.createElement('canvas');c.width=c.height=4;const g=c.getContext('2d');g.drawImage(i,0,0,4,4);const d=g.getImageData(0,0,4,4).data;const cols=[];for(let k=0;k<16;k+=5)cols.push(`rgb(${d[k*4]},${d[k*4+1]},${d[k*4+2]})`);TCOL[n]=cols}catch(e){TCOL[n]=['#888']}return TCOL[n]}
// ---- копание и стройка ----
let DIG=null;const REACH=3.6*TS;
function reachOK(c,r){const cx=(c+.5)*TS,cy=(r+.5)*TS;return Math.hypot(cx-P.x,cy-(P.y-TS*.95))<=REACH}
let _hintT={};function hint(k){if(T-(_hintT[k]||-99)<6)return;_hintT[k]=T;sayNow(k)}
function invAdd(t,n){SV.inv[t]=(SV.inv[t]||0)+(n||1);if(SV.inv[t]<=0)delete SV.inv[t];if(SEL==null||!SV.inv[SEL])SEL=SV.inv[t]?+t:(Object.keys(SV.inv)[0]!=null?+Object.keys(SV.inv)[0]:null)}
function setT(c,r,v){tset(c,r,v);SV.diff[c+','+r]=v;save()}
function tapTile(c,r){const t=tget(c,r);
 if(TASK&&TASK.def.tapTile&&TASK.def.tapTile(TASK,c,r))return true;
 if(MODE==='dig'){if(!t||TT[t].fluid)return false;if(TT[t].hard){if(TT[t].cw)return false;hint(t===B.iron?'t_gate':'t_hard');return true}
  if(!reachOK(c,r)){hint('t_far');return true}if(DIG)return true;DIG={c,r,t:0,d:(t===B.leaf||t===B.tleaf)?.12:.22};SFX.dig();return true}
 else{if(t&&!TT[t].fluid)return false;if(!reachOK(c,r)){hint('t_far');return true}
  if(SEL==null||!SV.inv[SEL]){hint('t_noblk');return true}
  if(c>=RX0&&c<RX1&&SV.z<2&&r>=GR-6){hint('t_water');return true}
  const cx=(c+.5)*TS;if(Math.abs(cx-P.x)<P.hw+TS/2&&r*TS<P.y&&(r+1)*TS>P.y-P.h)return true;// не в себя
  if(Math.abs(cx-DOG.x)<TS*.7&&r*TS<DOG.y&&(r+1)*TS>DOG.y-TS)return true;
  setT(c,r,SEL);invAdd(SEL,-1);SFX.place();burst(cx,(r+.5)*TS,6,tileCol(tget(c,r)),.5,8);EV.emit('place',c,r);return true}}
function stepDig(dt){if(!DIG)return;DIG.t+=G.fast?1:dt;if(DIG.t<DIG.d)return;const{c,r}=DIG;DIG=null;const t=tget(c,r);if(!t||TT[t].hard)return;
 const d=TT[t];setT(c,r,0);SFX.pop();burst((c+.5)*TS,(r+.5)*TS,12,tileCol(t),.8);
 if(d.drop==='dia'){SV.dia++;SFX.gem();sparks((c+.5)*TS,(r+.5)*TS,16,'#8ff0ff');EV.emit('dia')}else invAdd(d.drop||t,1);
 EV.emit('dig',c,r,t)}
// простые события для заданий
const EV={h:{},on(n,f){(this.h[n]=this.h[n]||[]).push(f)},emit(n,...a){(this.h[n]||[]).forEach(f=>{try{f(...a)}catch(e){console.error(e)}})}};
