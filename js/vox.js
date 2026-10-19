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
const B={air:0,grass:1,dirt:2,cobble:3,stone:4,dia:5,gold:6,bed:7,sand:8,sst:9,plank:10,log:11,leaf:12,castle:13,brick:14,water:15,iron:16,crystal:17,rock:18,hcastle:19,hcob:20,deck:21,pyr:22,roof:23,cactus:24,ghost:25,tgrass:26,flower:27,torch:28,glass:29,banner:30,goldb:31,rail:32,lily:33,mush:34,lava:35,fence:36,door:37,bush:38};
const BT=[{n:'air'},
 {n:'grass',t:['grass','grass_top','dirt'],d:.45,drop:2},{n:'dirt',t:['dirt'],d:.4},{n:'cobble',t:['cobble'],d:.7},{n:'stone',t:['stone'],d:.7,drop:3},
 {n:'dia',t:['diamond_ore'],d:.8,drop:'dia'},{n:'gold',t:['gold_ore'],d:.8},{n:'bed',t:['bedrock'],hard:1},{n:'sand',t:['sand'],d:.35},{n:'sst',t:['sandstone'],d:.6},
 {n:'plank',t:['planks'],d:.5},{n:'log',t:['log','log_top'],d:.6},{n:'leaf',t:['leaves'],d:.15,cut:1},{n:'castle',t:['castle'],d:.8},{n:'brick',t:['brick'],d:.7},
 {n:'water',t:['water'],fluid:1,hard:1},{n:'iron',t:['iron'],hard:1},{n:'crystal',t:['crystal'],hard:1,cw:1},{n:'rock',t:['stone'],hard:1},{n:'hcastle',t:['castle'],hard:1},
 {n:'hcob',t:['cobble'],hard:1},{n:'deck',t:['planks'],hard:1},{n:'pyr',t:['sandstone'],hard:1},{n:'roof',t:['brick'],hard:1},{n:'cactus',t:['cactus','cactus_top'],d:.3},{n:'ghost',t:['castle'],ghost:1},
 {n:'tgrass',t:['tallgrass'],deco:1},{n:'flower',t:['flower_red','flower_yel','flower_blu'],deco:1},{n:'torch',t:['torch'],deco:1,lit:1},{n:'glass',t:['glass'],cut:1,hard:1},{n:'banner',t:['banner'],deco:2},{n:'goldb',t:['gold_block'],hard:1},{n:'rail',t:['rail'],deco:3},{n:'lily',t:['lily'],deco:3},{n:'mush',t:['mush_red','mush_brown'],deco:1},{n:'lava',t:['lava'],hard:1,lit:1},{n:'fence',t:['planks'],fence:1,cut:1,hard:1},{n:'door',t:['door_top','door_bot'],deco:4},{n:'bush',t:['deadbush'],deco:1}];
const solidT=t=>t!==0&&!BT[t].fluid&&!BT[t].ghost&&!BT[t].deco;// стоим/упираемся
const opaqueT=t=>solidT(t)&&!BT[t].cut;// закрывает соседнюю грань (листья и стекло — сквозные)
const aoT=t=>opaqueT(t)||t===B.leaf;
const decoT=t=>t!==0&&!!BT[t].deco;
// ---- качество графики: hi (тени от солнца, дальше видно) / lo (для телефонов) ----
const Q=(()=>{try{const u=new URLSearchParams(location.search).get('q');if(u==='hi'||u==='lo')return u;const s=localStorage.getItem('kubq');if(s==='hi'||s==='lo')return s}catch(_){}return(('ontouchstart' in window)||navigator.maxTouchPoints>0)?'lo':'hi'})();
const QHI=Q==='hi';function setQuality(q){try{localStorage.setItem('kubq',q)}catch(_){}location.reload()}
// ---- атлас 8×8 клеток по 32 пикселя (рисуется кодом в tex32.js), у многих блоков 2–3 варианта ----
let ATLAS=null,ATC=null,AT32=null;
function buildAtlas(){AT32=buildAtlas32();ATC=AT32.c;const t=new T3.CanvasTexture(ATC);t.magFilter=T3.NearestFilter;t.minFilter=T3.NearestFilter;t.generateMipmaps=false;t.colorSpace=T3.SRGBColorSpace;ATLAS=t}
const TI=n=>AT32.IDX[n];
function uvOf(i){const u0=(i%8)/8,v1=1-Math.floor(i/8)/8;const e=.0004;return[u0+e,v1-.125+e,u0+.125-e,v1-e]}
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
const SPOTS={start:[6.5,TZ+.5],gran0:[10.5,TZ+.5],river:[63,TZ+.5],forge:[93.5,26.5],desert:[121,TZ+.5],castle:[155,TZ+.5],krivo:[157.8,TZ+3.6]};
function surfH(x,z){const zn=zoneAt(x);let h=GY;
 if(zn==='forest'||zn==='village')h=GY+Math.round((vnoise(x,z,9,1)-.5)*3*(Math.abs(z-TZ)>4?1.6:.4));
 if(zn==='desert'){const calm=Math.abs(z-TZ)<=4||(Math.abs(x-129)<9&&Math.abs(z-23)<9)||(Math.abs(x-120)<4&&Math.abs(z-12)<4)||x>138;
  h=GY+Math.round((vnoise(x,z,7,3)-.5)*2.4*(Math.abs(z-TZ)>3?1.4:.3));if(!calm){const dn=Math.max(0,Math.sin(x*.32+z*.12+vnoise(x,z,11,4)*3))*Math.min(1,(Math.abs(z-TZ)-4)/4);h=Math.max(h,GY+Math.round(dn*4))}}
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
 // берега: каменные стенки, песок с камнями, камыш; в воде — валуны на дне и кувшинки
 for(let z=0;z<WZ;z++)for(const x of[RIV.x0-1,RIV.x1+1]){for(let y=GY-4;y<GY;y++)vsetRaw(x,y,z,hsh(x+y,z,61)<.5?B.stone:B.cobble);if(Math.abs(z-TZ)>2&&hsh(x,z,62)<.3)vsetRaw(x,GY,z,B.stone)}
 for(let x=RIV.x0;x<=RIV.x1;x++)for(let z=1;z<WZ-1;z++){if(Math.abs(z-TZ)<=3)continue;const r=hsh(x,z,63);if(r<.05){vsetRaw(x,GY-4,z,B.stone);if(r<.02)vsetRaw(x,GY-3,z,B.cobble)}else if(r>.93&&x>RIV.x0&&x<RIV.x1)vsetRaw(x,GY,z,B.lily)}
 // деревья в лесу и деревне
 const tree=(x,z)=>{const h=surfH(x,z);if(vget(x,h,z)!==B.grass)return;const th=4+Math.floor(hsh(x,z,4)*2);for(let i=1;i<=th;i++)vsetRaw(x,h+i,z,B.log);
  for(let dy=th-1;dy<=th+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const r=Math.abs(dx)+Math.abs(dz);if(r<=(dy===th+1?1:3)&&!(dx===0&&dz===0&&dy<=th)&&vget(x+dx,h+dy,z+dz)===0)vsetRaw(x+dx,h+dy,z+dz,B.leaf)}};
 for(let x=2;x<31;x+=1)for(let z=2;z<WZ-2;z+=1)if(Math.abs(z-TZ)>5&&hsh(x,z,11)<.035)tree(x,z);
 for(let x=78;x<111;x++)for(let z=2;z<WZ-2;z++)if(Math.abs(z-TZ)>4&&!(x>=HOUSEP.x0-1&&x<=HOUSEP.x1+1&&z>=HOUSEP.z0-1&&z<=HOUSEP.z1+1)&&(z<18||z>40)&&hsh(x,z,12)<.03)tree(x,z);
 // деревня: домики, тропа, кузница
 for(let x=77;x<113;x++)for(let z=TZ-1;z<=TZ+1;z++)vsetRaw(x,surfH(x,z),z,B.cobble);
 const house=(x0,z0,w,d,wall,roof)=>{const y0=GY+1;for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+d;z++){for(let y=GY-1;y<=GY;y++)vsetRaw(x,y,z,B.cobble);for(let y=y0;y<y0+4;y++)vsetRaw(x,y,z,0)}
  for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+d;z++){const edge=x===x0||x===x0+w-1||z===z0||z===z0+d-1;if(!edge)continue;const corner=(x===x0||x===x0+w-1)&&(z===z0||z===z0+d-1);for(let y=y0;y<y0+3;y++){const door=z===z0&&x===x0+Math.floor(w/2)&&y<y0+2;const win=y===y0+1&&!corner&&((z===z0||z===z0+d-1)&&(x-x0)%2===1&&x!==x0+Math.floor(w/2));if(!door)vsetRaw(x,y,z,win?B.glass:corner?B.log:wall)}}
  for(let k=0;k<=Math.ceil(d/2);k++)for(let x=x0-1;x<=x0+w;x++)for(const z of[z0-1+k,z0+d-k])vsetRaw(x,y0+3+k,z,roof);
  // труба, подоконные цветы, факелы у двери
  for(let y=y0+3;y<=y0+4+Math.ceil(d/2);y++)vsetRaw(x0+w-2,y,z0+1,B.cobble);vsetRaw(x0+Math.floor(w/2),y0,z0,B.door);vsetRaw(x0+Math.floor(w/2),y0+1,z0,B.door);
  for(let x=x0;x<x0+w;x++)for(const z of[z0-1,z0+d]){if(x===x0+Math.floor(w/2))continue;if(vget(x,y0,z)===0&&solidT(vget(x,y0-1,z))&&hsh(x,z,41)<.6)vsetRaw(x,y0,z,B.flower)}
  for(const dx of[-1,1]){const x=x0+Math.floor(w/2)+dx;if(vget(x,y0+2,z0-1)===0)vsetRaw(x,y0+2,z0-1,B.banner)}};
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
 for(let x=114;x<139;x++)for(let z=3;z<WZ-3;z++)if(Math.abs(z-TZ)>4&&hsh(x,z,13)<.032&&!(Math.abs(x-PYR.cx)<9&&Math.abs(z-PYR.cz)<9)){const h=surfH(x,z);const ch=2+Math.floor(hsh(z,x,14)*3);for(let i=1;i<=ch;i++)vsetRaw(x,h+i,z,B.cactus)}
 for(let k=0;k<6;k++)for(let x=PYR.cx-5+k;x<=PYR.cx+5-k;x++)for(let z=PYR.cz-5+k;z<=PYR.cz+5-k;z++)vsetRaw(x,GY+1+k,z,B.pyr);
 for(let k=0;k<6;k++)for(let z=PYR.cz-5+k;z<=PYR.cz+5-k;z++)if(vget(PYR.cx-5+k,GY+2+k,z)===0)vsetRaw(PYR.cx-6+k,GY+1+k,z,0);
 PYR.gaps=[[PYR.cx-5,GY+1,PYR.cz],[PYR.cx-3,GY+3,PYR.cz],[PYR.cx-1,GY+5,PYR.cz]];PYR.gaps.forEach(([x,y,z])=>vsetRaw(x,y,z,0));
 // замок: двор, стены по краям, башня; кирпичный тайник
 for(let x=146;x<WX;x++)for(let z=0;z<WZ;z++){if(z<3||z>WZ-4||x>WX-3){for(let y=GY+1;y<=GY+6;y++)vsetRaw(x,y,z,B.hcastle);if((x+z)%2===0)vsetRaw(x,GY+7,z,B.hcastle)}}
 for(let x=TOWER.x0;x<=TOWER.x1;x++)for(let z=TOWER.z0;z<=TOWER.z1;z++)for(let y=GY+1;y<=TOWER.top;y++)vsetRaw(x,y,z,B.hcastle);
 for(let i=0;i<3;i++)for(let z=TOWER.z0;z<=TOWER.z1;z++)for(let y=GY+1;y<=GY+1+i;y++)vsetRaw(TOWER.x0-3+i,y,z,B.castle);
 for(let x=149;x<=151;x++)for(let y=GY+1;y<=GY+2;y++)vsetRaw(x,y,39,B.brick);for(let x=149;x<=151;x++)for(let y=GY+1;y<=GY+2;y++)vsetRaw(x,y,41,B.brick);vsetRaw(149,GY+1,40,B.brick);vsetRaw(151,GY+1,40,B.brick);vsetRaw(150,GY+2,40,B.brick);
 // ---- детали: фонари в деревне, шахта с крепью и факелами, пирамида, замок ----
 const post=(x,z,h,t)=>{const g=surfH(x,z);for(let y=g+1;y<=g+h;y++)vsetRaw(x,y,z,t||B.log);vsetRaw(x,g+h+1,z,B.torch)};
 for(const x of[79,86,99,108])for(const z of[TZ-3,TZ+3])post(x,z,2,B.log);
 for(let x=34;x<=60;x++){if(MW.some(m=>Math.abs(m-x)<=1)||(x>=42&&x<=47))continue;
  if(x%6===1){for(let y=GY+1;y<=GY+3;y++){vsetRaw(x,y,TZ-2,B.log);vsetRaw(x,y,TZ+2,B.log)}for(let z=TZ-1;z<=TZ+1;z++)vsetRaw(x,GY+4,z,B.plank)}
  else if(x%6===4){const z=Math.floor(x/6)%2?TZ-2:TZ+2;vsetRaw(x,GY+2,z,B.torch);vsetRaw(x,GY+1,z,B.cobble)}
  if(vget(x,GY+1,TZ)===0)vsetRaw(x,GY+1,TZ,B.rail)}
 for(const z of[TZ-2,TZ+2])post(32,z,1,B.log);
 for(const[x,z]of[[43,TZ-3],[46,TZ+3],[43,TZ+3],[46,TZ-3]])vsetRaw(x,GY+1,z,B.torch);
 vsetRaw(PYR.cx,GY+7,PYR.cz,B.goldb);for(const z of[TZ-3,TZ+3])post(PYR.cx-8,z,2,B.sst);
 const tower=(x0,z0)=>{for(let x=x0;x<x0+4;x++)for(let z=z0;z<z0+4;z++){for(let y=GY+1;y<=GY+10;y++)vsetRaw(x,y,z,B.hcastle);const e=x===x0||x===x0+3||z===z0||z===z0+3;if(e&&(x+z)%2===0)vsetRaw(x,GY+11,z,B.hcastle)}};
 tower(145,0);tower(145,WZ-4);tower(WX-4,0);tower(WX-4,WZ-4);
 for(const z of[TZ-6,TZ+6,TZ-12,TZ+12])vsetRaw(144,GY+5,z,B.banner);
 for(const x of[151,157,169])for(const z of[3,WZ-4])vsetRaw(x,GY+4,z,B.banner);
 for(const z of[TZ-3,TZ+3])post(144,z,2,B.castle);
 for(let x=150;x<WX-4;x+=6)for(const z of[0,WZ-1])if(vget(x,GY+7,z)===B.hcastle&&vget(x,GY+8,z)===0)vsetRaw(x,GY+8,z,B.torch);
 // ров с лавой перед замком: мост на тропе, забор по краям (а если всё же попасть в ров — лава мягко выталкивает на мост)
 for(let x=141;x<=143;x++)for(let z=0;z<WZ;z++){for(let y=GY-2;y<=GY+5;y++)vsetRaw(x,y,z,0);vsetRaw(x,GY-2,z,B.stone);vsetRaw(x,GY-1,z,B.lava);if(Math.abs(z-TZ)<=2)vsetRaw(x,GY,z,B.deck)}
 for(let z=0;z<WZ;z++){if(Math.abs(z-TZ)<=2)continue;for(const x of[140,144]){const g=x===144?GY:surfH(x,z);for(let y=GY-2;y<=g;y++)vsetRaw(x,y,z,y<g?B.stone:B.sand);for(let y=g+1;y<=GY+5;y++)vsetRaw(x,y,z,0);vsetRaw(x,g+1,z,B.fence)}}
 for(const z of[TZ-3,TZ+3])post(144,z,2,B.castle);
 for(const z of[TZ-6,TZ+6,TZ-12,TZ+12])vsetRaw(144,GY+5,z,B.banner);
 // огород с забором и тыквами-цветами в деревне
 for(let x=106;x<=111;x++)for(let z=26;z<=31;z++){const e=x===106||x===111||z===26||z===31;const g=surfH(x,z);for(let y=g+1;y<g+5;y++)vsetRaw(x,y,z,0);if(e&&!(z===26&&x===108))vsetRaw(x,g+1,z,B.fence);else if(!e){vsetRaw(x,g,z,B.dirt);if((x+z)%2)vsetRaw(x,g+1,z,B.flower)}}
 for(let x=78;x<=84;x++)if(x!==81){const z=TZ+2,g=surfH(x,z);if(vget(x,g+1,z)===0)vsetRaw(x,g+1,z,B.fence)}
 // пустыня: сухие кусты; лес: грибы под деревьями
 for(let x=114;x<140;x++)for(let z=2;z<WZ-2;z++){if(Math.abs(z-TZ)<=2)continue;let y=WY-1;while(y>0&&VOX[vi(x,y,z)]===0)y--;if(VOX[vi(x,y,z)]===B.sand&&hsh(x,z,81)<.03)vsetRaw(x,y+1,z,B.bush)}
 // сундуки: клетка под блоком (выкопал — нашёл)
 CHESTS.forEach(c=>{for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let y=GY+1;y<WY;y++){const b=vget(c.x+dx,y,c.z+dz);if(b===B.leaf||b===B.log)vsetRaw(c.x+dx,y,c.z+dz,0)}});// над сундуками — без деревьев
 CHESTS.forEach(c=>{vsetRaw(c.x,c.y,c.z,0)});vsetRaw(14,10,31,B.dirt);vsetRaw(14,GY,31,B.dirt);for(let y=10;y<GY;y++)vsetRaw(14,y,31,B.dirt);vsetRaw(14,9,31,0);
 vsetRaw(120,GY,12,B.sand);vsetRaw(120,11,12,0);
 // трава и цветы на лугах (не на тропе, не на участке для дома, не у сундуков)
 DECOL=[];for(let x=0;x<WX;x++)for(let z=1;z<WZ-1;z++){const zn=zoneAt(x);if(zn==='river'||zn==='desert'||zn==='castle')continue;if(Math.abs(z-TZ)<=1&&zn!=='mine')continue;
  if(x>=HOUSEP.x0-1&&x<=HOUSEP.x1+1&&z>=HOUSEP.z0-1&&z<=HOUSEP.z1+1)continue;if(CHESTS.some(c=>Math.abs(c.x-x)<=2&&Math.abs(c.z-z)<=2))continue;
  let y=WY-1;while(y>0&&VOX[vi(x,y,z)]===0)y--;if(VOX[vi(x,y,z)]!==B.grass||y+1>=WY)continue;const r=hsh(x,z,31),near=Math.abs(z-TZ)<=3?.5:1;
  const shade=vget(x,y+3,z)===B.leaf||vget(x,y+4,z)===B.leaf||vget(x,y+5,z)===B.leaf;if(shade&&zn==='forest'&&hsh(z,x,33)<.25){vsetRaw(x,y+1,z,B.mush);continue}
  if(r<.2*near)vsetRaw(x,y+1,z,B.tgrass);else if(r<.245*near)vsetRaw(x,y+1,z,B.flower)}
 for(let y=1;y<WY;y++)for(let z=0;z<WZ;z++)for(let x=0;x<WX;x++){const t=VOX[vi(x,y,z)];if(t===B.tgrass||t===B.flower||t===B.rail||t===B.torch||t===B.mush||t===B.bush)DECOL.push([x,y,z])}
 applyState()}
let DECOL=[];
// ---- состояние прохождения → мир ----
function applyState(){
 for(let i=0;i<SV.mw;i++)for(let z=TZ-1;z<=TZ+1;z++)for(let y=GY+1;y<=GY+3;y++)vsetRaw(MW[i],y,z,0);
 for(let i=0;i<SV.mw;i++){const k=MW[i]+','+(GY+1)+','+TZ;if(SV.diff[k]==null)vsetRaw(MW[i],GY+1,TZ,B.dia)}
 const spans=SV.z>=2?3:(SV.tr.river||0);for(let s=0;s<spans;s++)deckSpan(s,true);
 if(SV.z>=3)openGate(112,true);if(SV.z>=4)openGate(145,true);
 const pg=SV.z>=4?3:(SV.tr.desert||0);for(let i=0;i<pg;i++){const[x,y,z]=PYR.gaps[i];vsetRaw(x,y,z,B.pyr)}
 for(const k in SV.diff){const[x,y,z]=k.split(',').map(Number);const t=vget(x,y,z);if(!BT[t].hard||t===B.dia||t===0||BT[t].deco)vsetRaw(x,y,z,SV.diff[k])}
 for(const[x,y,z]of DECOL){const t=vget(x,y,z);if((t===B.tgrass||t===B.flower||t===B.rail||t===B.torch||t===B.mush||t===B.bush)&&!solidT(vget(x,y-1,z)))vsetRaw(x,y,z,0)}
 if(SV.z>=5)ROOF.forEach(([x,y,z])=>vsetRaw(x,y,z,B.roof))}
function deckSpan(s,raw){const x0=RIV.x0+s*3;const xe=s>=2?RIV.x1:x0+2;for(let x=x0;x<=xe&&x<=RIV.x1;x++)for(let z=TZ-2;z<=TZ+2;z++)(raw?vsetRaw:vset)(x,GY,z,B.deck)}
function openGate(x,raw){for(let z=TZ-2;z<=TZ+2;z++)for(let y=GY+1;y<=GY+3;y++)(raw?vsetRaw:vset)(x,y,z,0)}
function setBlock(x,y,z,t){vset(x,y,z,t);SV.diff[x+','+y+','+z]=t;
 if(!solidT(t)){const a=vget(x,y+1,z);if(a===B.tgrass||a===B.flower||a===B.torch||a===B.rail||a===B.mush||a===B.bush){vset(x,y+1,z,0);SV.diff[x+','+(y+1)+','+z]=0;if(a===B.torch){scanTorches();torchFx();for(let dx=-8;dx<=8;dx+=8)for(let dz=-8;dz<=8;dz+=8)markDirty(clamp(x+dx,0,WX-1),clamp(z+dz,0,WZ-1))}}}
 save()}
// ---- чанки: только видимые грани, мягкие тени в углах (AO), освещение граней ----
const NCX=Math.ceil(WX/CH),NCZ=Math.ceil(WZ/CH);const CHUNK=[];let DIRTY=new Set();
function markDirty(x,z){const cx=Math.floor(x/CH),cz=Math.floor(z/CH);DIRTY.add(cx+','+cz);const lx=x%CH,lz=z%CH;if(lx===0&&cx>0)DIRTY.add((cx-1)+','+cz);if(lx===CH-1&&cx<NCX-1)DIRTY.add((cx+1)+','+cz);if(lz===0&&cz>0)DIRTY.add(cx+','+(cz-1));if(lz===CH-1&&cz<NCZ-1)DIRTY.add(cx+','+(cz+1))}
const FACES=[// нормаль, 4 угла (против часовой снаружи), яркость, индекс текстуры: 0 бок 1 верх 2 низ
 {n:[1,0,0],c:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],l:.8,t:0},{n:[-1,0,0],c:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],l:.8,t:0},
 {n:[0,1,0],c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],l:1,t:1},{n:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],l:.55,t:2},
 {n:[0,0,1],c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],l:.68,t:0},{n:[0,0,-1],c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],l:.68,t:0}];
const AOL=[.42,.62,.82,1];
function texFor(t,f,x,y,z){const tt=BT[t].t;let n=f===1?(tt[1]||tt[0]):f===2?(tt[2]||(t===B.log||t===B.cactus?tt[1]:tt[0])):tt[0];
 if(x==null)return TI(n);
 if((t===B.castle||t===B.hcastle)&&f!==1&&hsh(x*3+y,z*5+y,77)<.13)n='castle_moss';// мох на старых стенах
 else if(t===B.pyr&&f===0&&(y-GY)%2===0)n='sandstone_ch';// узорные ряды пирамиды
 if(BT[t].deco&&tt.length>1)n=tt[Math.floor(hsh(x,z,y+5)*tt.length)];
 const vn=AT32.VARN[n]||1;const v=vn>1?Math.floor(hsh(x*7+y*3+f,z*11+y*5,91)*vn):0;return AT32.IDX[n+'#'+v]}
let TORCH=[];// факелы: свет в вершинах (тёплое свечение), огоньки
function scanTorches(){TORCH=[];for(let y=0;y<WY;y++)for(let z=0;z<WZ;z++)for(let x=0;x<WX;x++)if(VOX[vi(x,y,z)]===B.torch)TORCH.push([x+.5,y+.6,z+.5]);else if(VOX[vi(x,y,z)]===B.lava&&(x+z*3)%5===0&&VOX[vi(x,y+1,z)]===0)TORCH.push([x+.5,y+1.2,z+.5,1])}
const TL_R=6.5;
function torchAt(px,py,pz,n,L){let g=0;for(const t of L){const dx=t[0]-px,dy=t[1]-py,dz=t[2]-pz;const d=Math.sqrt(dx*dx+dy*dy+dz*dz);if(d>=TL_R)continue;if(n&&(dx*n[0]+dy*n[1]+dz*n[2])<-.3)continue;const k=1-d/TL_R;g+=k*k}return Math.min(1.1,g)}
function meshChunk(cx,cz){const P=[],N=[],U=[],Cc=[],Gl=[],I=[],WP=[],WN=[],WU=[],WC=[],WI=[],DP=[],DN=[],DU=[],DC=[],DG=[],DI=[],SP=[],SPh=[];
 const X0=cx*CH,Z0=cz*CH;const TL=TORCH.filter(t=>t[0]>X0-TL_R&&t[0]<X0+CH+TL_R&&t[2]>Z0-TL_R&&t[2]<Z0+CH+TL_R);
 const quad=(pts,nrm,tx,col,gl)=>{const b=DP.length/3;pts.forEach(q=>{DP.push(...q);DN.push(...nrm);DC.push(col,col,col);DG.push(gl,gl,gl)});DU.push(tx[0],tx[1],tx[2],tx[1],tx[2],tx[3],tx[0],tx[3]);DI.push(b,b+1,b+2,b,b+2,b+3)};
 for(let x=X0;x<Math.min(WX,X0+CH);x++)for(let z=Z0;z<Math.min(WZ,Z0+CH);z++)for(let y=0;y<WY;y++){const t=VOX[vi(x,y,z)];if(!t||BT[t].ghost)continue;const bt=BT[t];
  if(bt.deco){// трава, цветы, факел — крест из двух плоскостей; флаг — на стене; рельсы — на полу
   const tx=uvOf(texFor(t,0,x,y,z));const lt=bt.lit?1.5:0;const gl=lt||torchAt(x+.5,y+.5,z+.5,null,TL);
   if(bt.deco===1){const j=(hsh(x,z,y+3)-.5)*.3,k=(hsh(z,x,y+4)-.5)*.3,h=t===B.torch?1:.75+hsh(x,z,y+9)*.35,ww=t===B.torch?.36:.5;const mx=x+.5+(t===B.torch?0:j),mz=z+.5+(t===B.torch?0:k);
    const s1=[[mx-ww,y,mz-ww],[mx+ww,y,mz+ww],[mx+ww,y+h,mz+ww],[mx-ww,y+h,mz-ww]],s2=[[mx-ww,y,mz+ww],[mx+ww,y,mz-ww],[mx+ww,y+h,mz-ww],[mx-ww,y+h,mz+ww]];
    const tw=t===B.torch?[tx[0]+(tx[2]-tx[0])*.14,tx[1],tx[2]-(tx[2]-tx[0])*.14,tx[3]]:tx;quad(s1,[0,1,0],tw,.95,gl);quad(s2,[0,1,0],tw,.95,gl)}
   else if(bt.deco===2){let pts=null,n=null;const y0=y-.9,y1=y+1;
    if(solidT(vget(x+1,y,z))){pts=[[x+.94,y0,z+.92],[x+.94,y0,z+.08],[x+.94,y1,z+.08],[x+.94,y1,z+.92]];n=[-1,0,0]}else if(solidT(vget(x-1,y,z))){pts=[[x+.06,y0,z+.08],[x+.06,y0,z+.92],[x+.06,y1,z+.92],[x+.06,y1,z+.08]];n=[1,0,0]}
    else if(solidT(vget(x,y,z+1))){pts=[[x+.08,y0,z+.94],[x+.92,y0,z+.94],[x+.92,y1,z+.94],[x+.08,y1,z+.94]];n=[0,0,-1]}else{pts=[[x+.92,y0,z+.06],[x+.08,y0,z+.06],[x+.08,y1,z+.06],[x+.92,y1,z+.06]];n=[0,0,1]}
    quad(pts,n,tx,.9,gl)}
   else if(bt.deco===4){const tx=uvOf(TI(vget(x,y-1,z)===B.door?'door_top':'door_bot'));const y1=y+1;
    if(solidT(vget(x-1,y,z))&&solidT(vget(x+1,y,z)))quad([[x+.1,y,z],[x+.1,y,z+1],[x+.1,y1,z+1],[x+.1,y1,z]],[1,0,0],tx,.9,gl);else quad([[x,y,z+.1],[x+1,y,z+.1],[x+1,y1,z+.1],[x,y1,z+.1]],[0,0,1],tx,.9,gl)}
   else{const yy=y+.03;quad([[x,yy,z+1],[x+1,yy,z+1],[x+1,yy,z],[x,yy,z]],[0,1,0],tx,.85,gl)}
   continue}
  if(bt.fence){const tx=uvOf(texFor(t,0,x,y,z));const bx=(a,b,c,d,e,g)=>{for(let f=0;f<6;f++){const F=FACES[f];const bi=P.length/3;for(let k=0;k<4;k++){const q=F.c[k];P.push(q[0]?d:a,q[1]?e:b,q[2]?g:c);N.push(...F.n);Cc.push(F.l,F.l,F.l);Gl.push(0,0,0)}
     U.push(tx[0],tx[1],tx[2],tx[1],tx[2],tx[3],tx[0],tx[3]);I.push(bi,bi+1,bi+2,bi,bi+2,bi+3)}};
   bx(x+.38,y,z+.38,x+.62,y+1.15,z+.62);const nb=(dx,dz)=>{const q=vget(x+dx,y,z+dz);return q===B.fence||opaqueT(q)};
   for(const yy of[.38,.8]){if(nb(1,0))bx(x+.6,y+yy,z+.44,x+1,y+yy+.15,z+.56);if(nb(-1,0))bx(x,y+yy,z+.44,x+.4,y+yy+.15,z+.56);if(nb(0,1))bx(x+.44,y+yy,z+.6,x+.56,y+yy+.15,z+1);if(nb(0,-1))bx(x+.44,y+yy,z,x+.56,y+yy+.15,z+.4)}continue}
  const fl=bt.fluid;
  for(let f=0;f<6;f++){const F=FACES[f],nx=x+F.n[0],ny=y+F.n[1],nz=z+F.n[2];const nt=vget(nx,ny,nz);
   if(fl){if(nt!==0&&!(BT[nt].ghost)&&!BT[nt].deco)continue;if(f!==2&&nt!==0&&!BT[nt].deco)continue}
   else{if(opaqueT(nt))continue;if(nt===t&&bt.cut&&(t!==B.leaf||!QHI))continue}
   const p=fl?WP:P,nn=fl?WN:N,u=fl?WU:U,cc=fl?WC:Cc,ii=fl?WI:I;const b=p.length/3;
   const ax=F.n[0]?0:F.n[1]?1:2;const ta=[0,1,2].filter(a=>a!==ax);const ao=[];
   for(let k=0;k<4;k++){const c=F.c[k];let yy=y+c[1];if(fl&&f===2&&nt!==B.water)yy-=.12;const vx=x+c[0],vz=z+c[2];p.push(vx,yy,vz);nn.push(...F.n);
    let l=F.l;if(!fl){const o1=[0,0,0],o2=[0,0,0];o1[ta[0]]=c[ta[0]]?1:-1;o2[ta[1]]=c[ta[1]]?1:-1;
     const q=(o)=>aoT(vget(nx+o[0],ny+o[1],nz+o[2]))?1:0;const s1=q(o1),s2=q(o2),s3=q([o1[0]+o2[0],o1[1]+o2[1],o1[2]+o2[2]]);const a=s1&&s2?0:3-(s1+s2+s3);ao.push(a);l*=AOL[a];
     const g=bt.lit?1.5:TL.length?torchAt(vx+F.n[0]*.3,yy+F.n[1]*.3,vz+F.n[2]*.3,F.n,TL):0;Gl.push(g,g*.62,g*.3)}
    cc.push(l,l,l);
    if(fl){if(f===2)u.push(vx*.25,vz*.25);else u.push((vx+vz)*.25,yy*.25)}}
   if(!fl){const tx=uvOf(texFor(t,F.t,x,y,z));[[tx[0],tx[1]],[tx[2],tx[1]],[tx[2],tx[3]],[tx[0],tx[3]]].forEach(v=>u.push(...v))}
   // искорки на руде и кристаллах
   if((t===B.dia||t===B.gold||t===B.crystal||(t===B.lava&&f===2&&hsh(x,z,71)<.5))&&!opaqueT(nt)){const ns=t===B.crystal?1:2;for(let k=0;k<ns;k++){const r1=hsh(x*5+f,y*7+k,z+13)-.5,r2=hsh(z*3+k,x+f,y+17)-.5;const q=[x+.5+F.n[0]*.53,y+.5+F.n[1]*.53,z+.5+F.n[2]*.53];q[ta[0]]+=r1*.8;q[ta[1]]+=r2*.8;SP.push(...q);SPh.push(hsh(x+k,z,y)*6.28,t===B.gold||t===B.lava?1:0)}}
   if(!fl&&ao[0]+ao[2]<ao[1]+ao[3])ii.push(b+1,b+2,b+3,b+1,b+3,b);else ii.push(b,b+1,b+2,b,b+2,b+3)}}
 const mk=(p,n,u,c,i,g)=>{const G_=new T3.BufferGeometry();G_.setAttribute('position',new T3.Float32BufferAttribute(p,3));G_.setAttribute('normal',new T3.Float32BufferAttribute(n,3));G_.setAttribute('uv',new T3.Float32BufferAttribute(u,2));G_.setAttribute('color',new T3.Float32BufferAttribute(c,3));if(g)G_.setAttribute('glow',new T3.Float32BufferAttribute(g,3));G_.setIndex(i);G_.computeBoundingSphere();return G_};
 let sg=null;if(SP.length){sg=new T3.BufferGeometry();sg.setAttribute('position',new T3.Float32BufferAttribute(SP,3));const ph=[],kd=[];for(let i=0;i<SPh.length;i+=2){ph.push(SPh[i]);kd.push(SPh[i+1])}sg.setAttribute('ph',new T3.Float32BufferAttribute(ph,1));sg.setAttribute('kd',new T3.Float32BufferAttribute(kd,1));sg.computeBoundingSphere()}
 const dg3=[];for(let i=0;i<DG.length;i+=3)dg3.push(DG[i],DG[i]*.62,DG[i]*.3);
 return[mk(P,N,U,Cc,I,Gl),WI.length?mk(WP,WN,WU,WC,WI):null,DI.length?mk(DP,DN,DU,DC,DI,dg3):null,sg]}
let SCENE=null,CAM=null,REN=null,MAT=null,WMAT=null,DMAT=null,SPMAT=null,HEMI=null,SUN=null,WROOT=null;const UNI={uT:{value:0},uGK:{value:.4}};
function rebuildChunk(cx,cz){const key=cx+','+cz;let c=CHUNK[cz*NCX+cx];const[g,wg,dg,sg]=meshChunk(cx,cz);
 if(!c){c={m:new T3.Mesh(g,MAT),w:null,d:null,s:null,cx,cz};c.m.matrixAutoUpdate=false;c.m.castShadow=c.m.receiveShadow=QHI;WROOT.add(c.m);CHUNK[cz*NCX+cx]=c}else{c.m.geometry.dispose();c.m.geometry=g}
 const sub=(k,geo,mat,ro,ctor)=>{if(c[k]){WROOT.remove(c[k]);c[k].geometry.dispose();c[k]=null}if(geo){const m=new(ctor||T3.Mesh)(geo,mat);m.renderOrder=ro;m.matrixAutoUpdate=false;if(k==='d'){m.receiveShadow=QHI;m.castShadow=false}WROOT.add(m);c[k]=m}};
 sub('w',wg,WMAT,2);sub('d',dg,DMAT,1);sub('s',sg,SPMAT,3,T3.Points);DIRTY.delete(key)}
function chunkVis(maxD){for(const c of CHUNK){if(!c)continue;const d=Math.hypot(c.cx*CH+8-CAM.position.x,c.cz*CH+8-CAM.position.z);const v=d<maxD;c.m.visible=v;if(c.w)c.w.visible=v;if(c.d)c.d.visible=v&&d<maxD-6;if(c.s)c.s.visible=d<34}}
function stepChunks(n){let k=0;for(const key of DIRTY){if(k++>=n)break;const[a,b]=key.split(',').map(Number);rebuildChunk(a,b)}}
function rebuildAll(){scanTorches();DIRTY.clear();for(let cz=0;cz<NCZ;cz++)for(let cx=0;cx<NCX;cx++)rebuildChunk(cx,cz);torchFx();makeLife()}
// ---- рендер ----
const GLC=document.getElementById('g');let PR=1;
// материал блоков: обычное освещение + тёплый свет факелов (атрибут glow) + лёгкое покачивание травы (sway)
function litMat(o,sway){const m=new T3.MeshLambertMaterial(o);m.onBeforeCompile=sh=>{sh.uniforms.uGK=UNI.uGK;sh.uniforms.uT=UNI.uT;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 glow;varying vec3 vGlow;uniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGlow=glow;'+(sway?'if(glow.r<1.45){vec3 wp=(modelMatrix*vec4(position,1.)).xyz;float hgt=fract(uv.y*8.);transformed.x+=sin(uT*1.7+wp.x*.9+wp.z*.6)*.06*hgt;transformed.z+=cos(uT*1.3+wp.z*.8)*.05*hgt;}':''));
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGlow;uniform float uGK;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vGlow*(vGlow.r>1.45?0.9:uGK);')};
 m.customProgramCacheKey=()=>'lit'+(sway?1:0);return m}
// вода: своя бесшовная текстура, течёт и колышется, полупрозрачная, с бликом солнца
function waterMat(){const t=new T3.CanvasTexture(waterCanvas());t.wrapS=t.wrapT=T3.RepeatWrapping;t.magFilter=T3.NearestFilter;t.minFilter=T3.LinearFilter;t.colorSpace=T3.SRGBColorSpace;
 const m=new T3.MeshPhongMaterial({map:t,vertexColors:true,transparent:true,opacity:.74,depthWrite:false,shininess:90,specular:0x99bbdd});m.userData.tex=t;
 m.onBeforeCompile=sh=>{sh.uniforms.uT=UNI.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\nif(normal.y>.5){transformed.y+=(sin(position.x*1.7+uT*1.8)+cos(position.z*1.3+uT*1.4))*.035-.03;}')};return m}
// искорки на руде: мигающие точки
function sparkMat(){return new T3.ShaderMaterial({uniforms:{uT:UNI.uT,uS:{value:1}},transparent:true,depthWrite:false,blending:T3.AdditiveBlending,
 vertexShader:'attribute float ph;attribute float kd;uniform float uT;uniform float uS;varying float vA;varying float vK;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float a=sin(uT*2.2+ph*3.);vA=pow(max(0.,a),5.);vK=kd;gl_PointSize=uS*(10.+vA*14.)/max(1.,-mv.z*.35);}',
 fragmentShader:'varying float vA;varying float vK;void main(){vec2 d=gl_PointCoord-.5;float r=length(d);float c=max(0.,1.-r*2.);float x=max(0.,1.-abs(d.x)*9.)*max(0.,1.-abs(d.y)*2.)+max(0.,1.-abs(d.y)*9.)*max(0.,1.-abs(d.x)*2.);float a=(c*c*.6+x)*vA;vec3 col=vK>.5?vec3(1.,.9,.45):vec3(.75,1.,1.);gl_FragColor=vec4(col*a,a);}'})}

function init3d(){REN=new T3.WebGLRenderer({canvas:GLC,antialias:false,powerPreference:'high-performance'});REN.outputColorSpace=T3.SRGBColorSpace;
 PR=Math.min(QHI?1.5:1.25,window.devicePixelRatio||1);REN.setPixelRatio(PR);
 if(QHI){REN.shadowMap.enabled=true;REN.shadowMap.type=T3.PCFShadowMap}
 SCENE=new T3.Scene();CAM=new T3.PerspectiveCamera(62,1,.08,110);SCENE.fog=QHI?new T3.Fog(0xbfe3ff,34,80):new T3.Fog(0xbfe3ff,26,60);
 buildAtlas();MAT=litMat({map:ATLAS,vertexColors:true,alphaTest:.5});DMAT=litMat({map:ATLAS,vertexColors:true,alphaTest:.5,side:T3.DoubleSide},1);
 MAT.shadowSide=T3.FrontSide;DMAT.shadowSide=T3.DoubleSide;WMAT=waterMat();SPMAT=sparkMat();
 HEMI=new T3.HemisphereLight(0xffffff,0x9aa0b0,1.6);SUN=new T3.DirectionalLight(0xfff2dc,1.4);SUN.position.set(-.5,1,.35);SCENE.add(HEMI,SUN,SUN.target);
 if(QHI){SUN.castShadow=true;SUN.shadow.mapSize.set(2048,2048);const sc=SUN.shadow.camera;sc.left=sc.bottom=-26;sc.right=sc.top=26;sc.near=1;sc.far=120;SUN.shadow.bias=-.0006;SUN.shadow.normalBias=.04;SUN.shadow.radius=3;sc.updateProjectionMatrix()}
 WROOT=new T3.Group();SCENE.add(WROOT);makeSky();SPMAT.uniforms.uS.value=PR;makeOutline();makeCrack();resize3d()}
function resize3d(){if(!REN)return;REN.setPixelRatio(PR);REN.setSize(W,H,false);GLC.style.width=W+'px';GLC.style.height=H+'px';GLC.style.left=VVX+'px';GLC.style.top=VVY+'px';CAM.aspect=W/Math.max(1,H);CAM.updateProjectionMatrix()}
// небо: солнце, луна, звёзды, облака
let SKY={};
const glowTex=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);t=new T3.CanvasTexture(c);return t}})();
function makeSky(){const sq=(c,s)=>{const m=new T3.Mesh(new T3.PlaneGeometry(s,s),new T3.MeshBasicMaterial({color:c,fog:false,transparent:true}));return m};
 // купол неба: плавный переход от горизонта к зениту, свечение вокруг солнца
 SKY.dome=new T3.Mesh(new T3.SphereGeometry(95,32,16),new T3.ShaderMaterial({side:T3.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T3.Color(0x4a9be8)},hor:{value:new T3.Color(0xcfe9ff)},sd:{value:new T3.Vector3(-.6,.5,-.4)},sk:{value:1}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 hor;uniform vec3 sd;uniform float sk;varying vec3 vD;void main(){float h=vD.y;vec3 c=mix(hor,top,smoothstep(-.02,.55,h));float s=max(0.,dot(normalize(vD),normalize(sd)));c+=vec3(1.,.85,.6)*(pow(s,24.)*.55+pow(s,4.)*.12)*sk;gl_FragColor=vec4(c,1.);}'}));
 SKY.dome.renderOrder=-10;SKY.dome.frustumCulled=false;SCENE.add(SKY.dome);
 SKY.sun=sq(0xfff3a0,9);SKY.moon=sq(0xeef0ff,6);SCENE.add(SKY.sun,SKY.moon);
 SKY.halo=new T3.Sprite(new T3.SpriteMaterial({map:glowTex(),color:0xfff0b0,transparent:true,opacity:.7,blending:T3.AdditiveBlending,depthWrite:false,fog:false}));SKY.halo.scale.set(30,30,1);SCENE.add(SKY.halo);
 const sp=[];for(let i=0;i<260;i++){const a=Math.random()*6.28,b=Math.random()*1.2+.15;sp.push(Math.cos(a)*Math.cos(b)*80,Math.sin(b)*80,Math.sin(a)*Math.cos(b)*80)}
 const sg=new T3.BufferGeometry();sg.setAttribute('position',new T3.Float32BufferAttribute(sp,3));SKY.stars=new T3.Points(sg,new T3.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true}));SCENE.add(SKY.stars);
 // два слоя облаков: низкие плотные «кубические» и высокие лёгкие
 const mkC=(y,step,sc,thr,seed,op,th)=>{const cg=new T3.BoxGeometry(1,1,1),cm=new T3.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:op,fog:false,emissive:0x8a8a90});const pos=[];
  for(let x=-40;x<WX+60;x+=step)for(let z=-50;z<WZ+50;z+=step)if(vnoise(x,z,10*step/2,seed)>thr)pos.push([x,z]);
  const m=new T3.InstancedMesh(cg,cm,pos.length);const o=new T3.Object3D();pos.forEach(([x,z],i)=>{o.position.set(x,y,z);o.scale.set(step,th,step);o.updateMatrix();m.setMatrixAt(i,o.matrix)});m.userData.op=op;m.renderOrder=-5;SCENE.add(m);return m};
 SKY.clouds=mkC(WY+6,2,2,.66,21,.9,1.2);SKY.clouds2=mkC(WY+18,4,4,.7,23,.5,.6)}
const DAYC={day:new T3.Color(0x8fcfff),dusk:new T3.Color(0xf0a070),night:new T3.Color(0x141a3a),cave:new T3.Color(0x1a1820)};
const SKYT={day:new T3.Color(0x3f8fe4),night:new T3.Color(0x070a1c),cave:new T3.Color(0x121014)};const HORD=new T3.Color(0xd4ecff);
let NIGHTK=0,UNDER=0;
function stepSky(dt,nightK){NIGHTK=nightK;const px=PL?PL.p.x:0,py=PL?PL.p.y:GY,pz=PL?PL.p.z:TZ;UNI.uT.value=T;
 UNDER+=((py<GY-1||(PL&&isCovered(PL.p)))?1:0-UNDER)*Math.min(1,dt*2);UNDER=clamp(UNDER,0,1);
 const c=HORD.clone().lerp(DAYC.night,nightK);c.lerp(DAYC.cave,UNDER*.85);SCENE.background=c;SCENE.fog.color.copy(c);
 const tc=SKYT.day.clone().lerp(SKYT.night,nightK);tc.lerp(SKYT.cave,UNDER*.85);SKY.dome.material.uniforms.top.value.copy(tc);SKY.dome.material.uniforms.hor.value.copy(c);SKY.dome.position.copy(CAM.position);
 const light=1-nightK*.55;HEMI.intensity=((QHI?1.3:1.65)*light)*(1-UNDER*.5);SUN.intensity=(QHI?1.9:1.4)*(1-nightK*.8)*(1-UNDER*.6);
 UNI.uGK.value=.2+.5*Math.max(UNDER,nightK);
 const ang=nightK*Math.PI;SKY.sun.position.set(CAM.position.x-50*Math.cos(ang*.5+.4),CAM.position.y+38*(1-nightK)+2,CAM.position.z-28);SKY.sun.lookAt(CAM.position);
 SKY.halo.position.copy(SKY.sun.position);SKY.halo.material.opacity=.7*(1-nightK)*(1-UNDER*.8);
 const sd=SKY.sun.position.clone().sub(CAM.position).normalize();SKY.dome.material.uniforms.sd.value.copy(sd);SKY.dome.material.uniforms.sk.value=(1-nightK)*(1-UNDER);
 SKY.moon.position.set(CAM.position.x+40,CAM.position.y+34*nightK-4,CAM.position.z-30);SKY.moon.lookAt(CAM.position);SKY.moon.material.opacity=nightK;SKY.sun.material.opacity=1-nightK;
 SKY.stars.position.copy(CAM.position);SKY.stars.material.opacity=nightK;SKY.clouds.position.x=(T*.6)%2;SKY.clouds.material.opacity=.9*(1-nightK*.6);SKY.clouds2.position.x=(T*.25)%4;SKY.clouds2.material.opacity=.5*(1-nightK*.7);
 if(WMAT&&WMAT.userData.tex){WMAT.userData.tex.offset.set(T*.03,T*.05)}
 // тени от солнца следуют за игроком (сетка, чтобы не мерцали)
 if(QHI){const sx=Math.round(px*2)/2,sz=Math.round(pz*2)/2;SUN.target.position.set(sx,GY,sz);SUN.position.set(sx-30,GY+60,sz+21)}
 // огоньки факелов мерцают
 for(const f of TFX){const k=1+Math.sin(T*9+f.userData.ph)*.06+Math.sin(T*23+f.userData.ph*2)*.04;f.scale.set(f.userData.s*k,f.userData.s*k,1);f.material.opacity=f.userData.o*(.6+.4*UNI.uGK.value)}
 stepPuffs(dt);stepLife(dt)}
let TFX=[];function torchFx(){if(!SCENE)return;TFX.forEach(f=>SCENE.remove(f));TFX=[];
 for(const t of TORCH){if(t[3])continue;const sp=new T3.Sprite(new T3.SpriteMaterial({map:glowTex(),color:0xffb050,transparent:true,blending:T3.AdditiveBlending,depthWrite:false}));sp.position.set(t[0],t[1]+.1,t[2]);sp.userData={s:1.5,o:.42,ph:Math.random()*6};SCENE.add(sp);TFX.push(sp);
  const core=new T3.Sprite(new T3.SpriteMaterial({map:glowTex(),color:0xfff0b0,transparent:true,blending:T3.AdditiveBlending,depthWrite:false}));core.position.copy(sp.position);core.userData={s:.42,o:.7,ph:Math.random()*6};SCENE.add(core);TFX.push(core)}}
// жизнь вокруг: бабочки над цветами, птицы в небе, вагонетки в шахте
let LIFE=[];function makeLife(){if(!SCENE)return;LIFE.forEach(o=>SCENE.remove(o));LIFE=[];
 const fl=DECOL.filter(([x,y,z])=>vget(x,y,z)===B.flower&&x<112);const cols=[0xffd84a,0xff7ab0,0x7ad0ff,0xffffff,0xff9a3a];
 for(let i=0;i<Math.min(18,fl.length);i++){const[x,y,z]=fl[Math.floor(hsh(i,7,3)*fl.length)];const g=new T3.Group();const m=new T3.MeshBasicMaterial({color:cols[i%5],side:T3.DoubleSide});
  for(const s of[-1,1]){const w=new T3.Mesh(new T3.PlaneGeometry(.2,.16),m);w.position.x=s*.1;const p=new T3.Group();p.add(w);p.userData.s=s;g.add(p)}
  g.userData={kind:'bf',h:[x+.5,y+.6,z+.5],a:.5+hsh(i,1,2),b:.7+hsh(i,2,2),ph:i*1.7};SCENE.add(g);LIFE.push(g)}
 for(let i=0;i<7;i++){const g=new T3.Group();const m=new T3.MeshLambertMaterial({color:0x2a2a34});for(const s of[-1,1]){const w=new T3.Mesh(new T3.BoxGeometry(.5,.05,.18),m);w.position.x=s*.25;const p=new T3.Group();p.add(w);p.userData.s=s;g.add(p)}
  g.add(new T3.Mesh(new T3.BoxGeometry(.14,.12,.36),m));g.userData={kind:'bird',c:[20+i*22,WY-6+i%3*2,10+hsh(i,4,5)*28],r:6+hsh(i,5,5)*8,sp:.25+hsh(i,6,5)*.2,ph:i};SCENE.add(g);LIFE.push(g)}
 if(typeof cartMesh==='function')for(const[x,z,r]of[[44.5,TZ-2.5,.3],[31.4,TZ+3.6,-.5],[58.6,TZ+.5,0]]){if(x===58.6)continue;const c=cartMesh();c.position.set(x,GY+1,z);c.rotation.y=r;SCENE.add(c);LIFE.push(c)}}
function stepLife(dt){const night=NIGHTK>.5;for(const g of LIFE){const u=g.userData;if(u.kind==='bf'){g.visible=!night&&Math.hypot(u.h[0]-CAM.position.x,u.h[2]-CAM.position.z)<36;if(!g.visible)continue;
  const t=T*u.a+u.ph;g.position.set(u.h[0]+Math.sin(t)*1.4,u.h[1]+.4+Math.sin(T*u.b*2+u.ph)*.35,u.h[2]+Math.cos(t*1.3)*1.2);g.rotation.y=-t;g.children.forEach(p=>p.rotation.y=p.userData.s*Math.sin(T*16+u.ph)*1.1)}
 else if(u.kind==='bird'){const t=T*u.sp+u.ph;g.position.set(u.c[0]+Math.cos(t)*u.r,u.c[1]+Math.sin(t*2)*.6,u.c[2]+Math.sin(t)*u.r);g.rotation.y=-t;g.visible=UNDER<.5;g.children.forEach(p=>{if(p.userData.s)p.rotation.z=p.userData.s*Math.sin(T*7+u.ph)*.5})}}}
// пыль при копании (на каждой стадии трещины)
const PUFF=[];function dustPuff(x,y,z,t,n){if(!SCENE)return;const col=tileColor(t);for(let i=0;i<(n||4);i++){const sp=new T3.Sprite(new T3.SpriteMaterial({map:glowTex(),color:col.clone().lerp(new T3.Color(1,1,1),.25),transparent:true,depthWrite:false,opacity:.75}));
 sp.position.set(x+.5+(Math.random()-.5)*1.05,y+.5+(Math.random()-.5)*1.05,z+.5+(Math.random()-.5)*1.05);const s=.18+Math.random()*.16;sp.scale.set(s,s,1);sp.userData={v:new T3.Vector3((Math.random()-.5)*1.2,.6+Math.random()*.8,(Math.random()-.5)*1.2),l:.55+Math.random()*.3,s};SCENE.add(sp);PUFF.push(sp)}}
function stepPuffs(dt){for(let i=PUFF.length-1;i>=0;i--){const p=PUFF[i],u=p.userData;u.l-=dt;p.position.addScaledVector(u.v,dt);u.v.multiplyScalar(1-dt*2);const s=u.s*(1+(.9-u.l)*1.6);p.scale.set(s,s,1);p.material.opacity=Math.max(0,u.l)*.9;if(u.l<=0){SCENE.remove(p);p.material.dispose();PUFF.splice(i,1)}}}
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
 for(let i=0;i<200&&t<=maxD;i++){const b=vget(x,y,z);if(i>0&&(pred?pred(b,x,y,z):(b!==0&&!BT[b].fluid&&!BT[b].deco)))return{x,y,z,n,t,b};
  if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;n=[-sx,0,0]}else if(ty<tz){y+=sy;t=ty;ty+=tdy;n=[0,-sy,0]}else{z+=sz;t=tz;tz+=tdz;n=[0,0,-sz]}}return null}
// ---- существа: модель из блоков + физика (гравитация, прыжок, столкновения, автопрыжок на 1 блок) ----
const K3=1.85/32;// единый масштаб всех моделей
const ENTS=[];
function mkEnt(kind,x,z,o){o=o||{};const m=CHARS[kind]();m.scale.multiplyScalar(K3);const root=new T3.Group();root.add(m);SCENE.add(root);
 const parts=[];m.traverse(c=>{if(c.userData&&(c.userData.sw||c.userData.sp))parts.push(c)});
 if(!QHI){const bl=new T3.Mesh(new T3.PlaneGeometry(1,1),new T3.MeshBasicMaterial({map:glowTex(),color:0x000000,transparent:true,opacity:.38,depthWrite:false}));bl.rotation.x=-Math.PI/2;bl.position.y=.03;const s=(o.hw||.3)*3.4*(kind==='spider'?1.6:1);bl.scale.set(s,s,1);bl.renderOrder=1;root.add(bl)}
 const e={kind,obj:root,m,parts,p:new T3.Vector3(x,groundTop(x,z),z),v:new T3.Vector3(),yaw:o.yaw||0,ty:o.yaw||0,onG:false,hw:o.hw||.3,h:o.h||1.8,walk:0,ph:Math.random()*6,face:null,hide:false};
 m.traverse(c=>{if(c.userData&&c.userData.tool)e.armR=c});ENTS.push(e);placeEnt(e);return e}
// взмах киркой (как в Майнкрафте): замах вверх → удар вперёд-вниз → назад. k — доля взмаха 0..1, удар около k=.62
const SWD=.34;function swingCurve(k){if(k<=0||k>=1)return 0;if(k<.38)return -1.5*ease(k/.38);if(k<.62)return -1.5+2.1*ease((k-.38)/.24);return .6*(1-ease((k-.62)/.38))}
function swing(e){if(!e)return;if(e.swingT==null||T-e.swingT>SWD*.85)e.swingT=T}
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
 // слизень прыгает и сплющивается, у Тупика искрит фитиль, Фантом машет крыльями и парит
 if(!e.fx){e.fx=[];e.s0=e.m.scale.x;e.m.traverse(c=>{if(c.userData&&(c.userData.flap||c.userData.spark))e.fx.push(c)})}
 if(e.kind==='slime'){const k=Math.abs(Math.sin(T*3.2+e.ph*.1)),q=1-k;e.m.position.y=k*.3;e.m.scale.set(e.s0*(1+.1*q),e.s0*(1-.13*q),e.s0*(1+.1*q))}
 for(const c of e.fx){if(c.userData.flap)c.rotation.z=Math.sin(T*6)*.5*c.userData.flap;if(c.userData.spark)c.scale.setScalar(.6+.6*Math.abs(Math.sin(T*13+e.ph)))}
 if(e.kind==='phantom')e.m.position.y=.9+Math.sin(T*2.2)*.18
 if(e.armR&&e.swingT!=null){const k=(T-e.swingT)/SWD;if(k<1){e.armR.rotation.x=e.armR.userData.r0+swingCurve(k);e.armR.rotation.z=-.15*Math.sin(k*Math.PI)}else e.armR.rotation.z=0}
 placeEnt(e)}
function placeEnt(e){e.obj.position.copy(e.p);e.obj.rotation.y=e.yaw;e.obj.visible=!e.hide}
let HANDS=null,HAND=null;
function makeHand(){HANDS=new T3.Scene();HANDS.add(new T3.HemisphereLight(0xffffff,0x8890a0,1.7));const dl=new T3.DirectionalLight(0xfff2dc,1.2);dl.position.set(-1,2,1);HANDS.add(dl);
 const b=CHARS.bloki();let arm=null;b.traverse(c=>{if(c.userData&&c.userData.tool)arm=c});HAND=new T3.Group();const piv=new T3.Group();arm.position.set(0,0,0);arm.rotation.set(0,0,0);piv.add(arm);
 piv.scale.setScalar(K3*1.1);piv.rotation.set(1.42,.32,.1);HAND.add(piv);HAND.userData.piv=piv;HANDS.add(HAND)}
function renderHand(){if(!CAMS.fp||CAMS.focus||!PL||PL.hide===false)return;if(!HANDS)makeHand();
 const k=PL.swingT!=null?(T-PL.swingT)/SWD:1;const s=swingCurve(k);const bob=Math.sin(PL.ph*.5)*.025*PL.walk;
 HAND.position.set(.5+s*.03,-.46+bob,-.22+s*.04);HAND.rotation.set(-s*.9,0,s*.15);HAND.quaternion.premultiply(CAM.quaternion);HAND.position.applyQuaternion(CAM.quaternion).add(CAM.position);
 const lt=1-UNDER*.4-NIGHTK*.4;HANDS.children[0].intensity=1.7*lt;REN.autoClear=false;REN.clearDepth();REN.render(HANDS,CAM);REN.autoClear=true}
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
const TCOL3={};function tileColor(t){if(TCOL3[t])return TCOL3[t];const i=texFor(t,0);const g=ATC.getContext('2d');const d=g.getImageData((i%8)*32+8,Math.floor(i/8)*32+8,16,16).data;let r=0,gg=0,b=0,n=0;for(let k=0;k<d.length;k+=4){if(d[k+3]<128)continue;r+=d[k];gg+=d[k+1];b+=d[k+2];n++}n=Math.max(1,n);return TCOL3[t]=new T3.Color(`rgb(${Math.round(r/n)},${Math.round(gg/n)},${Math.round(b/n)})`)}
