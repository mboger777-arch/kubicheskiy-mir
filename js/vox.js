'use strict';
// ===== Кубический мир 3D: воксельный мир (генерация, чанки, освещение), физика, камера, прицел =====
const T3=window.THREE;
const WX=176,WY=40,WZ=48,CH=16,GY=12;// размер мира в блоках; GY — верх земли (стоим на y=13)
const VOX=new Uint8Array(WX*WY*WZ);
const vi=(x,y,z)=>(y*WZ+z)*WX+x;
function vget(x,y,z){if(y<0)return B.bed;if(y>=WY)return 0;if(x<0||x>=WX||z<0||z>=WZ)return B.bed;return VOX[vi(x,y,z)]}
function vset(x,y,z,t){if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ)return;VOX[vi(x,y,z)]=t;markDirty(x,z)}
function vsetRaw(x,y,z,t){if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ)return;VOX[vi(x,y,z)]=t}
// ---- блоки: текстуры в атласе (бок, верх, низ), твёрдость (время копания), непробиваемые ----
const B={air:0,grass:1,dirt:2,cobble:3,stone:4,dia:5,gold:6,bed:7,sand:8,sst:9,plank:10,log:11,leaf:12,castle:13,brick:14,water:15,iron:16,crystal:17,rock:18,hcastle:19,hcob:20,deck:21,pyr:22,roof:23,cactus:24,ghost:25};
const TEXN=['grass','grass_top','dirt','cobble','stone','diamond_ore','gold_ore','bedrock','sand','sandstone','planks','log','log_top','leaves','castle','brick','water','iron','crystal','cactus','cactus_top'];
const TI=n=>TEXN.indexOf(n);
const BT=[{n:'air'},
 {n:'grass',t:['grass','grass_top','dirt'],d:.45,drop:2},{n:'dirt',t:['dirt'],d:.4},{n:'cobble',t:['cobble'],d:.7},{n:'stone',t:['stone'],d:.7,drop:3},
 {n:'dia',t:['diamond_ore'],d:.8,drop:'dia'},{n:'gold',t:['gold_ore'],d:.8},{n:'bed',t:['bedrock'],hard:1},{n:'sand',t:['sand'],d:.35},{n:'sst',t:['sandstone'],d:.6},
 {n:'plank',t:['planks'],d:.5},{n:'log',t:['log','log_top'],d:.6},{n:'leaf',t:['leaves'],d:.15},{n:'castle',t:['castle'],d:.8},{n:'brick',t:['brick'],d:.7},
 {n:'water',t:['water'],fluid:1,hard:1},{n:'iron',t:['iron'],hard:1},{n:'crystal',t:['crystal'],hard:1,cw:1},{n:'rock',t:['stone'],hard:1},{n:'hcastle',t:['castle'],hard:1},
 {n:'hcob',t:['cobble'],hard:1},{n:'deck',t:['planks'],hard:1},{n:'pyr',t:['sandstone'],hard:1},{n:'roof',t:['castle'],hard:1},{n:'cactus',t:['cactus','cactus_top'],d:.3},{n:'ghost',t:['castle'],ghost:1}];
const solidT=t=>t!==0&&!BT[t].fluid&&!BT[t].ghost;
const opaqueT=t=>t!==0&&!BT[t].fluid&&!BT[t].ghost;
// ---- атлас 8×4 клеток по 16 пикселей (точно, без размытия) ----
let ATLAS=null,ATC=null;
function buildAtlas(){const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 TEXN.forEach((n,i)=>{const x=(i%8)*16,y=Math.floor(i/8)*16;const im=IM['t_'+n];if(ok(im))g.drawImage(im,x,y,16,16);else{g.fillStyle='#f0f';g.fillRect(x,y,16,16)}});
 // верх травы, торец бревна, кристалл, кактус — дорисовываем пиксели сами
 const px=(i,f)=>{const x0=(i%8)*16,y0=Math.floor(i/8)*16;let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let y=0;y<16;y++)for(let x=0;x<16;x++){const c=f(x,y,r);if(c){g.fillStyle=c;g.fillRect(x0+x,y0+y,1,1)}}};
 const sh=(c,r,a)=>{const v=c.map(k=>Math.max(0,Math.min(255,Math.round(k+(r()*2-1)*a))));return`rgb(${v})`};
 px(TI('grass_top'),(x,y,r)=>sh([96,176,58],r,22));
 px(TI('log_top'),(x,y,r)=>{const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));return d>6.5?sh([90,62,34],r,10):(Math.floor(d)%2?sh([176,136,80],r,8):sh([196,156,96],r,8))});
 px(TI('crystal'),(x,y,r)=>{const e=x===0||y===0||x===15||y===15;const d=(x+y)%6===0||(x-y+16)%7===0;return e?'#1a6a80':d?sh([200,255,255],r,10):sh([80,210,230],r,18)});
 px(TI('cactus'),(x,y,r)=>x%4===0?sh([30,110,40],r,8):(y%5===2&&x%4===2?'#e8e0a0':sh([60,150,60],r,12)));
 px(TI('cactus_top'),(x,y,r)=>sh([70,160,70],r,14));
 const t=new T3.CanvasTexture(c);t.magFilter=T3.NearestFilter;t.minFilter=T3.NearestFilter;t.generateMipmaps=false;t.colorSpace=T3.SRGBColorSpace;ATLAS=t;ATC=c}
function uvOf(i){const u0=(i%8)/8,v1=1-Math.floor(i/8)/4;const e=.0008;return[u0+e,v1-.25+e,u0+.125-e,v1-e]}
// ---- шум (детерминированный) ----
function hsh(x,z,s){let h=(x*374761393+z*668265263+(s||0)*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
function vnoise(x,z,sc,s){const fx=x/sc,fz=z/sc,x0=Math.floor(fx),z0=Math.floor(fz),tx=fx-x0,tz=fz-z0;const sm=t=>t*t*(3-2*t);const a=hsh(x0,z0,s),b=hsh(x0+1,z0,s),c=hsh(x0,z0+1,s),d=hsh(x0+1,z0+1,s);const u=sm(tx),v=sm(tz);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
let RS=12345;const rr=()=>{RS=(RS*16807)%2147483647;return RS/2147483647};
// ---- раскладка зон по оси X ----
const ZN=[{n:'forest',x0:0,x1:33},{n:'mine',x0:33,x1:62},{n:'river',x0:62,x1:77},{n:'village',x0:77,x1:113},{n:'desert',x0:113,x1:145},{n:'castle',x0:145,x1:WX}];
function zoneAt(x){for(const z of ZN)if(x>=z.x0&&x<z.x1)return z.n;return 'castle'}
const TZ=23;// ось главной тропы (z)
const MW=[40,48,56];// кристальные стены в туннеле
const RIV={x0:65,x1:74};// река (включительно)
const PYR={cx:129,cz:23,gaps:[[124,13,23],[126,15,23],[128,17,23]]};
const TOWER={x0:162,x1:166,z0:21,z1:25,top:16};
const ROOF=[];for(let k=0;k<3;k++)for(let z=TOWER.z0+k;z<=TOWER.z1-k;z++)ROOF.push([164,TOWER.top+1+k,z]);
const CHESTS=[{x:14,y:9,z:31,z_:0},{x:104,y:18,z:36,z_:3},{x:120,y:11,z:12,z_:4},{x:150,y:13,z:40,z_:5}];
const HOUSEP={x0:82,x1:89,z0:29,z1:37};
const SPOTS={start:[6.5,TZ+.5],gran0:[10.5,TZ+.5],river:[63,TZ+.5],forge:[93.5,26.5],desert:[121,TZ+.5],castle:[157,TZ+.5],krivo:[171.5,TZ+.5]};
function surfH(x,z){const zn=zoneAt(x);let h=GY;
 if(zn==='forest'||zn==='village')h=GY+Math.round((vnoise(x,z,9,1)-.5)*3*(Math.abs(z-TZ)>4?1.6:.4));
 if(zn==='desert')h=GY+Math.round((vnoise(x,z,7,3)-.5)*2.4*(Math.abs(z-TZ)>3?1.4:.3));
 if(zn==='river')h=GY;if(zn==='castle')h=GY;
 return h}
function genWorld(){VOX.fill(0);RS=12345;
 for(let x=0;x<WX;x++)for(let z=0;z<WZ;z++){const zn=zoneAt(x);const h=surfH(x,z);
  for(let y=0;y<=h;y++){let t=B.stone;if(y===0)t=B.bed;else if(y>=h-2){t=zn==='desert'?B.sand:zn==='castle'?B.cobble:B.dirt;if(y===h&&(zn==='forest'||zn==='village'||zn==='river'||zn==='mine'))t=B.grass}
   if(t===B.stone&&y<h-3){const r=hsh(x*3+y,z*7+y,9);if(r<.012)t=B.dia;else if(r<.03)t=B.gold;else if(r<.12)t=B.cobble}
   vsetRaw(x,y,z,t)}}
 // пещеры-червяки под лесом и шахтой
 for(let k=0;k<5;k++){let x=4+rr()*55,y=5+rr()*4,z=8+rr()*32,a=rr()*6.28,b=0;for(let i=0;i<70;i++){a+=(rr()-.5)*.6;b=(rr()-.5)*.4;x+=Math.cos(a);z+=Math.sin(a)*.7;y=Math.max(3,Math.min(9,y+b));
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const X_=Math.round(x+dx),Y_=Math.round(y+dy),Z_=Math.round(z+dz);if(X_>1&&X_<62&&Z_>1&&Z_<WZ-2&&vget(X_,Y_,Z_)!==B.bed)vsetRaw(X_,Y_,Z_,0)}}}
 // спуск в пещеру (яма со ступеньками) возле старта
 for(let i=0;i<5;i++)for(let dz=0;dz<2;dz++)for(let y=GY-i;y<=GY+1;y++)vsetRaw(18+i,y,30+dz,0);
 // гора над шахтой
 for(let x=33;x<62;x++)for(let z=0;z<WZ;z++){const d=Math.min(x-33,61-x);const top=GY+Math.min(12,Math.round(d*1.3+vnoise(x,z,6,5)*3));for(let y=GY+1;y<=top;y++)vsetRaw(x,y,z,y===top?B.grass:y>top-2?B.dirt:B.rock)}
 // туннель 3×3 внутри горы, вход у x=33, выход у x=61
 for(let x=31;x<=63;x++)for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)vsetRaw(x,y,z,0);
 for(let x=34;x<=60;x++)for(let z=TZ-2;z<=TZ+2;z+=4)for(let y=GY+1;y<=GY+3;y++){const r=hsh(x,y,z+77);vsetRaw(x,y,z,r<.08?B.dia:r<.18?B.gold:r<.5?B.stone:B.cobble)}
 for(let x=34;x<=60;x++)for(let z=TZ-1;z<=TZ+1;z++){vsetRaw(x,GY,z,B.stone);vsetRaw(x,GY+4,z,B.stone)}
 // пещера-зал для первого паука
 for(let x=43;x<=46;x++)for(let z=TZ-3;z<=TZ+3;z++)for(let y=GY+1;y<=GY+6;y++)vsetRaw(x,y,z,0);
 for(const x of MW)for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)vsetRaw(x,y,z,B.crystal);
 // река
 for(let x=RIV.x0;x<=RIV.x1;x++)for(let z=0;z<WZ;z++){for(let y=GY-4;y<=GY;y++)vsetRaw(x,y,z,y<=GY-1?B.water:0);vsetRaw(x,GY-5,z,B.sand)}
 for(let z=0;z<WZ;z++){vsetRaw(RIV.x0-1,GY,z,B.sand);vsetRaw(RIV.x1+1,GY,z,B.sand)}
 // деревья в лесу и деревне
 const tree=(x,z)=>{const h=surfH(x,z);if(vget(x,h,z)!==B.grass)return;const th=4+Math.floor(hsh(x,z,4)*2);for(let i=1;i<=th;i++)vsetRaw(x,h+i,z,B.log);
  for(let dy=th-1;dy<=th+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const r=Math.abs(dx)+Math.abs(dz);if(r<=(dy===th+1?1:3)&&!(dx===0&&dz===0&&dy<=th)&&vget(x+dx,h+dy,z+dz)===0)vsetRaw(x+dx,h+dy,z+dz,B.leaf)}};
 for(let x=2;x<31;x+=1)for(let z=2;z<WZ-2;z+=1)if(Math.abs(z-TZ)>5&&hsh(x,z,11)<.035)tree(x,z);
 for(let x=78;x<111;x++)for(let z=2;z<WZ-2;z++)if(Math.abs(z-TZ)>4&&!(x>=HOUSEP.x0-1&&x<=HOUSEP.x1+1&&z>=HOUSEP.z0-1&&z<=HOUSEP.z1+1)&&(z<18||z>40)&&hsh(x,z,12)<.03)tree(x,z);
 // деревня: домики, тропа, кузница
 for(let x=77;x<113;x++)for(let z=TZ-1;z<=TZ+1;z++)vsetRaw(x,surfH(x,z),z,B.cobble);
 const house=(x0,z0,w,d,wall,roof)=>{const y0=GY+1;for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+d;z++){for(let y=GY-1;y<=GY;y++)vsetRaw(x,y,z,B.cobble);for(let y=y0;y<y0+4;y++)vsetRaw(x,y,z,0)}
  for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+d;z++){const edge=x===x0||x===x0+w-1||z===z0||z===z0+d-1;if(!edge)continue;const corner=(x===x0||x===x0+w-1)&&(z===z0||z===z0+d-1);for(let y=y0;y<y0+3;y++){const door=z===z0&&x===x0+Math.floor(w/2)&&y<y0+2;const win=y===y0+1&&!corner&&((z===z0||z===z0+d-1)&&(x-x0)%2===1&&x!==x0+Math.floor(w/2));if(!door&&!win)vsetRaw(x,y,z,corner?B.log:wall)}}
  for(let k=0;k<=Math.ceil(d/2);k++)for(let x=x0-1;x<=x0+w;x++)for(const z of[z0-1+k,z0+d-k])vsetRaw(x,y0+3+k,z,roof)};
 house(96,12,6,5,B.plank,B.brick);house(104,12,5,5,B.cobble,B.plank);house(80,12,5,5,B.plank,B.brick);house(100,32,6,5,B.cobble,B.brick);
 // кузница: навес над наковальней
 for(let x=91;x<=96;x++)for(let z=27;z<=31;z++)vsetRaw(x,GY,z,B.cobble);[[91,27],[96,27],[91,31],[96,31]].forEach(([x,z])=>{for(let y=GY+1;y<=GY+3;y++)vsetRaw(x,y,z,B.log)});for(let x=91;x<=96;x++)for(let z=27;z<=31;z++)vsetRaw(x,GY+4,z,B.plank);
 // участок для своего дома — ровная трава
 for(let x=HOUSEP.x0;x<=HOUSEP.x1;x++)for(let z=HOUSEP.z0;z<=HOUSEP.z1;z++){for(let y=GY+1;y<GY+8;y++)vsetRaw(x,y,z,0);vsetRaw(x,GY,z,B.grass)}
 // стена с воротами в пустыню и в замок
 const wall=(x,t)=>{for(let z=0;z<WZ;z++)for(let y=GY+1;y<=GY+7;y++)vsetRaw(x,y,z,t);for(let z=TZ-2;z<=TZ+2;z++)for(let y=GY+1;y<=GY+3;y++)vsetRaw(x,y,z,B.iron)};wall(112,B.hcob);wall(145,B.hcastle);
 // столб с сундуком у стены (лесенку строит ребёнок)
 for(let y=GY+1;y<=GY+5;y++)vsetRaw(104,y,36,B.hcob);
 // пустыня: кактусы и пирамида (3 выпавших блока на западной грани)
 for(let x=114;x<144;x++)for(let z=3;z<WZ-3;z++)if(Math.abs(z-TZ)>4&&hsh(x,z,13)<.02&&!(Math.abs(x-PYR.cx)<9&&Math.abs(z-PYR.cz)<9)){const h=surfH(x,z);for(let i=1;i<=3;i++)vsetRaw(x,h+i,z,B.cactus)}
 for(let k=0;k<6;k++)for(let x=PYR.cx-5+k;x<=PYR.cx+5-k;x++)for(let z=PYR.cz-5+k;z<=PYR.cz+5-k;z++)vsetRaw(x,GY+1+k,z,B.pyr);
 for(let k=0;k<6;k++)for(let z=PYR.cz-5+k;z<=PYR.cz+5-k;z++)if(vget(PYR.cx-5+k,GY+2+k,z)===0)vsetRaw(PYR.cx-6+k,GY+1+k,z,0);
 PYR.gaps=[[PYR.cx-5,GY+1,PYR.cz],[PYR.cx-3,GY+3,PYR.cz],[PYR.cx-1,GY+5,PYR.cz]];PYR.gaps.forEach(([x,y,z])=>vsetRaw(x,y,z,0));
 // замок: двор, стены по краям, башня; кирпичный тайник
 for(let x=146;x<WX;x++)for(let z=0;z<WZ;z++){if(z<3||z>WZ-4||x>WX-3){for(let y=GY+1;y<=GY+6;y++)vsetRaw(x,y,z,B.hcastle);if((x+z)%2===0)vsetRaw(x,GY+7,z,B.hcastle)}}
 for(let x=TOWER.x0;x<=TOWER.x1;x++)for(let z=TOWER.z0;z<=TOWER.z1;z++)for(let y=GY+1;y<=TOWER.top;y++)vsetRaw(x,y,z,B.hcastle);
 for(let i=0;i<3;i++)for(let z=TOWER.z0;z<=TOWER.z1;z++)for(let y=GY+1;y<=GY+1+i;y++)vsetRaw(TOWER.x0-3+i,y,z,B.castle);
 for(let x=149;x<=151;x++)for(let y=GY+1;y<=GY+2;y++)vsetRaw(x,y,39,B.brick);for(let x=149;x<=151;x++)for(let y=GY+1;y<=GY+2;y++)vsetRaw(x,y,41,B.brick);vsetRaw(149,GY+1,40,B.brick);vsetRaw(151,GY+1,40,B.brick);vsetRaw(150,GY+2,40,B.brick);
 // сундуки: клетка под блоком (выкопал — нашёл)
 CHESTS.forEach(c=>{vsetRaw(c.x,c.y,c.z,0)});vsetRaw(14,10,31,B.dirt);vsetRaw(14,GY,31,B.dirt);for(let y=10;y<GY;y++)vsetRaw(14,y,31,B.dirt);vsetRaw(14,9,31,0);
 vsetRaw(120,GY,12,B.sand);vsetRaw(120,11,12,0);
 applyState()}
// ---- состояние прохождения → мир ----
function applyState(){
 for(let i=0;i<SV.mw;i++)for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)vsetRaw(MW[i],y,z,0);
 for(let i=0;i<SV.mw;i++){const k=MW[i]+','+(GY+1)+','+TZ;if(SV.diff[k]==null)vsetRaw(MW[i],GY+1,TZ,B.dia)}
 const spans=SV.z>=2?3:(SV.tr.river||0);for(let s=0;s<spans;s++)deckSpan(s,true);
 if(SV.z>=3)openGate(112,true);if(SV.z>=4)openGate(145,true);
 const pg=SV.z>=4?3:(SV.tr.desert||0);for(let i=0;i<pg;i++){const[x,y,z]=PYR.gaps[i];vsetRaw(x,y,z,B.pyr)}
 for(const k in SV.diff){const[x,y,z]=k.split(',').map(Number);const t=vget(x,y,z);if(!BT[t].hard||t===B.dia||t===0)vsetRaw(x,y,z,SV.diff[k])}
 if(SV.z>=5)ROOF.forEach(([x,y,z])=>vsetRaw(x,y,z,B.roof))}
function deckSpan(s,raw){const x0=RIV.x0+s*3;const xe=s>=2?RIV.x1:x0+2;for(let x=x0;x<=xe&&x<=RIV.x1;x++)for(let z=TZ-2;z<=TZ+2;z++)(raw?vsetRaw:vset)(x,GY,z,B.deck)}
function openGate(x,raw){for(let z=TZ-2;z<=TZ+2;z++)for(let y=GY+1;y<=GY+3;y++)(raw?vsetRaw:vset)(x,y,z,0)}
function setBlock(x,y,z,t){vset(x,y,z,t);SV.diff[x+','+y+','+z]=t;save()}
// ---- чанки: только видимые грани, мягкие тени в углах (AO), освещение граней ----
const NCX=Math.ceil(WX/CH),NCZ=Math.ceil(WZ/CH);const CHUNK=[];let DIRTY=new Set();
function markDirty(x,z){const cx=Math.floor(x/CH),cz=Math.floor(z/CH);DIRTY.add(cx+','+cz);const lx=x%CH,lz=z%CH;if(lx===0&&cx>0)DIRTY.add((cx-1)+','+cz);if(lx===CH-1&&cx<NCX-1)DIRTY.add((cx+1)+','+cz);if(lz===0&&cz>0)DIRTY.add(cx+','+(cz-1));if(lz===CH-1&&cz<NCZ-1)DIRTY.add(cx+','+(cz+1))}
const FACES=[// нормаль, 4 угла (против часовой снаружи), яркость, индекс текстуры: 0 бок 1 верх 2 низ
 {n:[1,0,0],c:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],l:.8,t:0},{n:[-1,0,0],c:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],l:.8,t:0},
 {n:[0,1,0],c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],l:1,t:1},{n:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],l:.55,t:2},
 {n:[0,0,1],c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],l:.68,t:0},{n:[0,0,-1],c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],l:.68,t:0}];
const AOL=[.42,.62,.82,1];
function texFor(t,f){const tt=BT[t].t;const n=f===1?(tt[1]||tt[0]):f===2?(tt[2]||(t===B.log||t===B.cactus?tt[1]:tt[0])):tt[0];return TI(n)}
function meshChunk(cx,cz){const P=[],N=[],U=[],Cc=[],I=[],WP=[],WN=[],WU=[],WC=[],WI=[];
 for(let x=cx*CH;x<Math.min(WX,cx*CH+CH);x++)for(let z=cz*CH;z<Math.min(WZ,cz*CH+CH);z++)for(let y=0;y<WY;y++){const t=VOX[vi(x,y,z)];if(!t||BT[t].ghost)continue;const fl=BT[t].fluid;
  for(let f=0;f<6;f++){const F=FACES[f],nx=x+F.n[0],ny=y+F.n[1],nz=z+F.n[2];const nt=vget(nx,ny,nz);
   if(fl){if(nt!==0&&!(BT[nt].ghost))continue}else if(opaqueT(nt))continue;if(fl&&f!==2&&nt!==0)continue;
   const tx=uvOf(texFor(t,F.t));const p=fl?WP:P,nn=fl?WN:N,u=fl?WU:U,cc=fl?WC:Cc,ii=fl?WI:I;const b=p.length/3;
   const ax=F.n[0]?0:F.n[1]?1:2;const ta=[0,1,2].filter(a=>a!==ax);const ao=[];
   for(let k=0;k<4;k++){const c=F.c[k];let yy=y+c[1];if(fl&&f===2)yy-=.12;p.push(x+c[0],yy,z+c[2]);nn.push(...F.n);
    let l=F.l;if(!fl){const s=[0,0,0];const o1=[0,0,0],o2=[0,0,0];o1[ta[0]]=c[ta[0]]?1:-1;o2[ta[1]]=c[ta[1]]?1:-1;
     const q=(o)=>opaqueT(vget(nx+o[0],ny+o[1],nz+o[2]))?1:0;const s1=q(o1),s2=q(o2),s3=q([o1[0]+o2[0],o1[1]+o2[1],o1[2]+o2[2]]);const a=s1&&s2?0:3-(s1+s2+s3);ao.push(a);l*=AOL[a]}
    cc.push(l,l,l)}
   // UV: для боковых граней низ текстуры внизу блока
   const uv=f===2||f===3?[[tx[0],tx[1]],[tx[2],tx[1]],[tx[2],tx[3]],[tx[0],tx[3]]]:[[tx[0],tx[1]],[tx[2],tx[1]],[tx[2],tx[3]],[tx[0],tx[3]]];uv.forEach(v=>u.push(...v));
   if(!fl&&ao[0]+ao[2]<ao[1]+ao[3])ii.push(b+1,b+2,b+3,b+1,b+3,b);else ii.push(b,b+1,b+2,b,b+2,b+3)}}
 const mk=(p,n,u,c,i)=>{const g=new T3.BufferGeometry();g.setAttribute('position',new T3.Float32BufferAttribute(p,3));g.setAttribute('normal',new T3.Float32BufferAttribute(n,3));g.setAttribute('uv',new T3.Float32BufferAttribute(u,2));g.setAttribute('color',new T3.Float32BufferAttribute(c,3));g.setIndex(i);g.computeBoundingSphere();return g};
 return[mk(P,N,U,Cc,I),WI.length?mk(WP,WN,WU,WC,WI):null]}
let SCENE=null,CAM=null,REN=null,MAT=null,WMAT=null,HEMI=null,SUN=null,WROOT=null;
function rebuildChunk(cx,cz){const key=cx+','+cz;let c=CHUNK[cz*NCX+cx];const[g,wg]=meshChunk(cx,cz);
 if(!c){c={m:new T3.Mesh(g,MAT),w:null,cx,cz};c.m.matrixAutoUpdate=false;WROOT.add(c.m);CHUNK[cz*NCX+cx]=c}else{c.m.geometry.dispose();c.m.geometry=g}
 if(c.w){WROOT.remove(c.w);c.w.geometry.dispose();c.w=null}if(wg){c.w=new T3.Mesh(wg,WMAT);c.w.renderOrder=2;c.w.matrixAutoUpdate=false;WROOT.add(c.w)}DIRTY.delete(key)}
function stepChunks(n){let k=0;for(const key of DIRTY){if(k++>=n)break;const[a,b]=key.split(',').map(Number);rebuildChunk(a,b)}}
function rebuildAll(){DIRTY.clear();for(let cz=0;cz<NCZ;cz++)for(let cx=0;cx<NCX;cx++)rebuildChunk(cx,cz)}
// ---- рендер ----
const GLC=document.getElementById('g');let PR=1;
function init3d(){REN=new T3.WebGLRenderer({canvas:GLC,antialias:false,powerPreference:'high-performance'});REN.outputColorSpace=T3.SRGBColorSpace;
 PR=Math.min(1.5,window.devicePixelRatio||1);REN.setPixelRatio(PR);
 SCENE=new T3.Scene();CAM=new T3.PerspectiveCamera(62,1,.08,90);SCENE.fog=new T3.Fog(0xbfe3ff,28,70);
 buildAtlas();MAT=new T3.MeshLambertMaterial({map:ATLAS,vertexColors:true});WMAT=new T3.MeshLambertMaterial({map:ATLAS,vertexColors:true,transparent:true,opacity:.78,depthWrite:false});
 HEMI=new T3.HemisphereLight(0xffffff,0x9aa0b0,1.6);SUN=new T3.DirectionalLight(0xfff2dc,1.4);SUN.position.set(-.5,1,.35);SCENE.add(HEMI,SUN);
 WROOT=new T3.Group();SCENE.add(WROOT);makeSky();makeOutline();makeCrack();resize3d()}
function resize3d(){if(!REN)return;REN.setPixelRatio(PR);REN.setSize(W,H,false);GLC.style.width=W+'px';GLC.style.height=H+'px';GLC.style.left=VVX+'px';GLC.style.top=VVY+'px';CAM.aspect=W/Math.max(1,H);CAM.updateProjectionMatrix()}
// небо: солнце, луна, звёзды, облака
let SKY={};function makeSky(){const sq=(c,s)=>{const m=new T3.Mesh(new T3.PlaneGeometry(s,s),new T3.MeshBasicMaterial({color:c,fog:false,transparent:true}));return m};
 SKY.sun=sq(0xfff3a0,9);SKY.moon=sq(0xeef0ff,6);SCENE.add(SKY.sun,SKY.moon);
 const sp=[];for(let i=0;i<260;i++){const a=Math.random()*6.28,b=Math.random()*1.2+.15;sp.push(Math.cos(a)*Math.cos(b)*80,Math.sin(b)*80,Math.sin(a)*Math.cos(b)*80)}
 const sg=new T3.BufferGeometry();sg.setAttribute('position',new T3.Float32BufferAttribute(sp,3));SKY.stars=new T3.Points(sg,new T3.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true}));SCENE.add(SKY.stars);
 const cg=new T3.BoxGeometry(1,1,1),cm=new T3.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.88,fog:false,emissive:0x777777});let n=0;const pos=[];
 for(let x=-20;x<WX+40;x+=2)for(let z=-30;z<WZ+30;z+=2)if(vnoise(x,z,10,21)>.68)pos.push([x,z]);
 SKY.clouds=new T3.InstancedMesh(cg,cm,pos.length);const o=new T3.Object3D();pos.forEach(([x,z],i)=>{o.position.set(x,WY+6,z);o.scale.set(2,1,2);o.updateMatrix();SKY.clouds.setMatrixAt(i,o.matrix)});SCENE.add(SKY.clouds)}
const DAYC={day:new T3.Color(0x8fcfff),dusk:new T3.Color(0xf0a070),night:new T3.Color(0x141a3a),cave:new T3.Color(0x1a1820)};
let NIGHTK=0,UNDER=0;
function stepSky(dt,nightK){NIGHTK=nightK;const px=PL?PL.p.x:0,py=PL?PL.p.y:GY,pz=PL?PL.p.z:TZ;
 UNDER+=((py<GY-1||(PL&&isCovered(PL.p)))?1:0-UNDER)*Math.min(1,dt*2);UNDER=clamp(UNDER,0,1);
 const c=DAYC.day.clone().lerp(DAYC.night,nightK);c.lerp(DAYC.cave,UNDER*.85);SCENE.background=c;SCENE.fog.color.copy(c);
 const light=1-nightK*.55;HEMI.intensity=(1.65*light)*(1-UNDER*.35);SUN.intensity=1.4*(1-nightK*.8)*(1-UNDER*.6);
 const ang=nightK*Math.PI;SKY.sun.position.set(CAM.position.x-50*Math.cos(ang*.5+.4),CAM.position.y+38*(1-nightK)+2,CAM.position.z-28);SKY.sun.lookAt(CAM.position);
 SKY.moon.position.set(CAM.position.x+40,CAM.position.y+34*nightK-4,CAM.position.z-30);SKY.moon.lookAt(CAM.position);SKY.moon.material.opacity=nightK;SKY.sun.material.opacity=1-nightK;
 SKY.stars.position.copy(CAM.position);SKY.stars.material.opacity=nightK;SKY.clouds.position.x=(T*.6)%2;SKY.clouds.material.opacity=.88*(1-nightK*.6)}
function isCovered(p){const x=Math.floor(p.x),z=Math.floor(p.z);for(let y=Math.floor(p.y)+2;y<Math.min(WY,Math.floor(p.y)+9);y++)if(opaqueT(vget(x,y,z)))return true;return false}
// ---- прицел: рамка выбранного блока и трещины ----
let OUTL=null,CRACK=null,CRT=[];
function makeOutline(){const g=new T3.EdgesGeometry(new T3.BoxGeometry(1.004,1.004,1.004));OUTL=new T3.LineSegments(g,new T3.LineBasicMaterial({color:0x111111,transparent:true,opacity:.9}));OUTL.visible=false;SCENE.add(OUTL);
 const g2=new T3.EdgesGeometry(new T3.BoxGeometry(1.03,1.03,1.03));const o2=new T3.LineSegments(g2,new T3.LineBasicMaterial({color:0xffffff}));OUTL.add(o2)}
function makeCrack(){for(let s=0;s<5;s++){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');let sd=3+s*7;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};g.fillStyle='rgba(0,0,0,.85)';
  for(let k=0;k<(s+1)*5;k++){let x=7,y=7;const a=r()*6.28;for(let i=0;i<3+s;i++){x+=Math.round(Math.cos(a+(r()-.5)));y+=Math.round(Math.sin(a+(r()-.5)));g.fillRect(x&15,y&15,1,1)}}
  const t=new T3.CanvasTexture(c);t.magFilter=t.minFilter=T3.NearestFilter;t.generateMipmaps=false;CRT.push(t)}
 CRACK=new T3.Mesh(new T3.BoxGeometry(1.01,1.01,1.01),new T3.MeshBasicMaterial({map:CRT[0],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));CRACK.visible=false;SCENE.add(CRACK)}
// луч по вокселям (DDA): первый твёрдый блок + грань
function rayVox(o,d,maxD,pred){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const sx=Math.sign(d.x),sy=Math.sign(d.y),sz=Math.sign(d.z);
 const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);let tx=(sx>0?x+1-o.x:o.x-x)*tdx,ty=(sy>0?y+1-o.y:o.y-y)*tdy,tz=(sz>0?z+1-o.z:o.z-z)*tdz;let n=[0,0,0],t=0;
 for(let i=0;i<200&&t<=maxD;i++){const b=vget(x,y,z);if(i>0&&(pred?pred(b,x,y,z):(b!==0&&!BT[b].fluid)))return{x,y,z,n,t,b};
  if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;n=[-sx,0,0]}else if(ty<tz){y+=sy;t=ty;ty+=tdy;n=[0,-sy,0]}else{z+=sz;t=tz;tz+=tdz;n=[0,0,-sz]}}return null}
// ---- существа: модель из блоков + физика (гравитация, прыжок, столкновения, автопрыжок на 1 блок) ----
const K3=1.85/32;// единый масштаб всех моделей
const ENTS=[];
function mkEnt(kind,x,z,o){o=o||{};const m=CHARS[kind]();m.scale.setScalar(K3);const root=new T3.Group();root.add(m);SCENE.add(root);
 const parts=[];m.traverse(c=>{if(c.userData&&(c.userData.sw||c.userData.sp))parts.push(c)});
 const e={kind,obj:root,m,parts,p:new T3.Vector3(x,groundTop(x,z),z),v:new T3.Vector3(),yaw:o.yaw||0,ty:o.yaw||0,onG:false,hw:o.hw||.3,h:o.h||1.8,walk:0,ph:Math.random()*6,face:null,hide:false};
 ENTS.push(e);placeEnt(e);return e}
function rmEnt(e){SCENE.remove(e.obj);const i=ENTS.indexOf(e);if(i>=0)ENTS.splice(i,1)}
function groundTop(x,z){const X_=Math.floor(x),Z_=Math.floor(z);for(let y=WY-1;y>=0;y--){const b=vget(X_,y,Z_);if(solidT(b)&&b!==B.leaf&&b!==B.log&&b!==B.cactus)return y+1}return GY+1}
function groundAt(x,z,fromY){const X_=Math.floor(x),Z_=Math.floor(z);for(let y=Math.min(WY-1,Math.floor(fromY));y>=0;y--)if(solidT(vget(X_,y,Z_)))return y+1;return GY+1}
function collides(px,py,pz,hw,h){for(let x=Math.floor(px-hw);x<=Math.floor(px+hw-1e-4);x++)for(let z=Math.floor(pz-hw);z<=Math.floor(pz+hw-1e-4);z++)for(let y=Math.floor(py);y<=Math.floor(py+h-1e-4);y++)if(solidT(vget(x,y,z)))return true;return false}
const GRAV=28,JUMPV=8.6;
function physEnt(e,dt,mx,mz,jump){const sp=e.speed||4.3;e.v.x=mx*sp;e.v.z=mz*sp;e.v.y-=GRAV*dt;if(e.v.y<-30)e.v.y=-30;
 // в воде — медленно и выталкивает
 const inW=BT[vget(Math.floor(e.p.x),Math.floor(e.p.y+.3),Math.floor(e.p.z))].fluid;if(inW){e.v.x*=.5;e.v.z*=.5;e.v.y=Math.max(e.v.y,-2);if(jump||e.swimUp)e.v.y=3.2}
 if(jump&&e.onG){e.v.y=JUMPV;e.onG=false;if(e===PL)SFX.jump()}
 // автопрыжок: впереди ступенька в 1 блок, над ней свободно
 if(e.onG&&(mx||mz)){const ax=e.p.x+Math.sign(mx)*(e.hw+.12),az=e.p.z+Math.sign(mz)*(e.hw+.12);const by=Math.floor(e.p.y+.05);
  const blockAhead=(mx&&collides(ax,e.p.y+.05,e.p.z,.05,.9))||(mz&&collides(e.p.x,e.p.y+.05,az,.05,.9));
  if(blockAhead){const fx=mx?ax:e.p.x,fz=mz?az:e.p.z;if(!collides(fx,by+1.02,fz,.05,e.h)&&!collides(e.p.x,e.p.y+.05,e.p.z,e.hw,e.h+1.05)){e.v.y=JUMPV*.92;e.onG=false}}}
 const step=(ax,d)=>{if(!d)return;const n=Math.ceil(Math.abs(d)/.2);const s=d/n;for(let i=0;i<n;i++){const q=e.p.clone();q[ax]+=s;if(collides(q.x,q.y,q.z,e.hw,e.h)){if(ax==='y'){if(s<0)e.onG=true;e.v.y=0}return}e.p[ax]=q[ax]}};
 e.onG=false;step('x',e.v.x*dt);step('z',e.v.z*dt);step('y',e.v.y*dt);
 if(!e.onG&&collides(e.p.x,e.p.y-.03,e.p.z,e.hw,.02))e.onG=true;
 e.p.x=clamp(e.p.x,.5,WX-.5);e.p.z=clamp(e.p.z,.5,WZ-.5);if(e.p.y<-5){const g=groundAt(e.p.x,e.p.z,WY-1);e.p.y=g;e.v.y=0}
 const mv=Math.hypot(mx,mz);if(mv>.05){e.ty=Math.atan2(mx,mz)}e.walk=mv>.05&&e.onG?Math.min(1,e.walk+dt*6):Math.max(0,e.walk-dt*6)}
function animEnt(e,dt){e.ph+=dt*(e.kind==='spider'?14:9)*(.3+e.walk);let d=e.ty-e.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;e.yaw+=d*Math.min(1,dt*10);
 for(const c of e.parts){if(c.userData.sw){const a=Math.sin(e.ph)*.75*e.walk*c.userData.sw*(c.userData.arm?.8:1);c.rotation.x=c.userData.r0+a}if(c.userData.sp){c.rotation.z=c.userData.rz+Math.sin(e.ph+c.userData.sp)*.25*e.walk*(c.position.x>0?1:-1)}}
 if(e.kind==='pixel'){e.m.position.y=Math.abs(Math.sin(e.ph))*.08*e.walk}
 placeEnt(e)}
function placeEnt(e){e.obj.position.copy(e.p);e.obj.rotation.y=e.yaw;e.obj.visible=!e.hide}
// ---- камера: от третьего лица (за спиной Блоки) или его глазами ----
const CAMS={yaw:Math.PI/2,pitch:-.22,fp:false,dist:5.2,cur:5.2,focus:null,fyaw:null};
function stepCam(dt,snap){if(!PL)return;const eye=new T3.Vector3(PL.p.x,PL.p.y+1.62,PL.p.z);let tgt=eye.clone(),yaw=CAMS.yaw,pitch=CAMS.pitch,dist=CAMS.dist;
 if(CAMS.focus){tgt=new T3.Vector3(...CAMS.focus.t);yaw=CAMS.focus.yaw;pitch=CAMS.focus.pitch;dist=CAMS.focus.dist}
 const fp=CAMS.fp&&!CAMS.focus;PL.hide=fp;
 const dir=new T3.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
 let pos;if(fp){pos=eye}else{const back=dir.clone().multiplyScalar(-1);let d=dist;const h=rayVox(tgt,back,dist,b=>opaqueT(b));if(h)d=Math.max(.6,h.t-.25);CAMS.cur=snap?d:Math.min(d,CAMS.cur+dt*6);if(d<CAMS.cur)CAMS.cur=d;pos=tgt.clone().addScaledVector(back,CAMS.cur)}
 if(snap||!CAM._init){CAM.position.copy(pos);CAM._init=1}else CAM.position.lerp(pos,Math.min(1,dt*(CAMS.focus?3:14)));
 CAM.lookAt(CAM.position.clone().add(dir))}
G.cam=()=>({x:CAM.position.x,y:CAM.position.y,z:CAM.position.z,yaw:CAMS.yaw,pitch:CAMS.pitch,fp:CAMS.fp});
// экранная точка → луч (для касания по блоку)
function screenRay(sx,sy){const v=new T3.Vector3((sx/W)*2-1,-(sy/H)*2+1,.5).unproject(CAM).sub(CAM.position).normalize();return v}
// ---- частицы-кубики при копании ----
const CUBES=[];let CUBEG=null;
function cubeBurst(x,y,z,t,n){if(!CUBEG)CUBEG=new T3.BoxGeometry(.16,.16,.16);const tx=uvOf(texFor(t,0));const col=tileColor(t);for(let i=0;i<(n||10);i++){const m=new T3.Mesh(CUBEG,new T3.MeshLambertMaterial({color:col}));m.position.set(x+.5+(Math.random()-.5)*.6,y+.5+(Math.random()-.5)*.6,z+.5+(Math.random()-.5)*.6);m.userData.v=new T3.Vector3((Math.random()-.5)*4,Math.random()*4+1,(Math.random()-.5)*4);m.userData.l=.8+Math.random()*.4;SCENE.add(m);CUBES.push(m)}}
function stepCubes(dt){for(let i=CUBES.length-1;i>=0;i--){const m=CUBES[i];m.userData.l-=dt;m.userData.v.y-=14*dt;m.position.addScaledVector(m.userData.v,dt);m.rotation.x+=dt*5;if(m.userData.l<=0){SCENE.remove(m);m.material.dispose();CUBES.splice(i,1)}}}
const TCOL3={};function tileColor(t){if(TCOL3[t])return TCOL3[t];const i=texFor(t,0);const g=ATC.getContext('2d');const d=g.getImageData((i%8)*16+4,Math.floor(i/8)*16+4,8,8).data;let r=0,gg=0,b=0;for(let k=0;k<d.length;k+=4){r+=d[k];gg+=d[k+1];b+=d[k+2]}const n=d.length/4;return TCOL3[t]=new T3.Color(`rgb(${Math.round(r/n)},${Math.round(gg/n)},${Math.round(b/n)})`)}
