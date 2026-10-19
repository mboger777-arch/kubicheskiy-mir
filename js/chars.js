// Воксельные модели v2: скины в двойном разрешении (16×16 на грань головы), объём пикселей (свет сверху, тень снизу,
// тонкий тёмный контур граней), выразительные лица с глазами на зрителя. Единица = 1 «пиксель» старого скина.
import * as THREE from './vendor/three.module.js';
let SEED=7;const rnd=()=>{SEED=(SEED*16807)%2147483647;return SEED/2147483647};
const hex=c=>{c=c.replace('#','');return[0,2,4].map(i=>parseInt(c.substr(i,2),16))};
const K=2;// пикселей текстуры на единицу
// холст (w·K)×(h·K); p/f рисуют с лёгким шумом цвета; после рисования — объём: свет сверху, тень снизу, контур
export function tex(w,h,fn,o={}){const W=Math.max(1,Math.round(w*K)),H=Math.max(1,Math.round(h*K));const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 const p=(x,y,c,a)=>{if(x<0||y<0||x>=W||y>=H||!c)return;const v=hex(c).map(q=>Math.max(0,Math.min(255,Math.round(q+(rnd()*2-1)*(a==null?7:a)))));g.fillStyle=`rgb(${v})`;g.fillRect(x,y,1,1)};
 const f=(x0,y0,x1,y1,c,a)=>{for(let y=Math.round(y0);y<=y1;y++)for(let x=Math.round(x0);x<=x1;x++)p(x,y,Array.isArray(c)?c[Math.floor(rnd()*c.length)]:c,a)};
 const clr=(x,y)=>g.clearRect(x,y,1,1);
 fn({p,f,w:W,h:H,g,clr});
 if(!o.flat){const d=g.getImageData(0,0,W,H),a=d.data;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(!a[i+3])continue;
  let k=1+(.5-y/(H-1||1))*(o.grad==null?.16:o.grad);if(!o.noEdge&&(x===0||y===0||x===W-1||y===H-1))k*=.8;if(y===0&&!o.noEdge)k*=1.12;
  for(let c=0;c<3;c++)a[i+c]=Math.max(0,Math.min(255,a[i+c]*k))}g.putImageData(d,0,0)}
 const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;return t}
const fill=c=>({w,h,f})=>f(0,0,w-1,h-1,c);
// коробка: s=[w,h,d]; faces {front,back,left,right,top,bottom,side,all}: функция рисования, цвет или массив цветов
// o: {emis:цвет свечения, flat:без объёма, alpha:полупрозрачная, op}
export function box(s,faces,pos,rot,o={}){const[w,h,d]=s;const get=k=>faces[k]||faces.side&&(k==='left'||k==='right'||k==='back')&&faces.side||faces.all;
 const dims={right:[d,h],left:[d,h],top:[w,d],bottom:[w,d],front:[w,h],back:[w,h]};
 const mats=['right','left','top','bottom','front','back'].map(k=>{let v=get(k);if(typeof v==='string'||Array.isArray(v))v=fill(v);const[tw,th]=dims[k];
  const m=new THREE.MeshLambertMaterial({map:tex(tw,th,v||fill('#ff00ff'),{flat:o.flat,grad:o.grad})});if(o.emis){m.emissive=new THREE.Color(o.emis);m.emissiveIntensity=o.ei||.9;m.emissiveMap=m.map}
  if(o.alpha){m.transparent=true;m.opacity=o.op||.6;m.depthWrite=false}return m});
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats);m.castShadow=true;if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot.map(a=>a*Math.PI/180));return m}
const grp=(...a)=>{const g=new THREE.Group();a.forEach(x=>g.add(x));return g};
const sw=(g,s,arm)=>{g.userData.sw=s;g.userData.arm=!!arm;g.userData.r0=g.rotation.x;return g};
const at=(o,pos,rot)=>{const g=new THREE.Group();g.add(o);g.position.set(...pos);if(rot)g.rotation.set(...rot.map(a=>a*Math.PI/180));return g};
// ---------- общие части лица (16×16) ----------
// глаза смотрят прямо на зрителя: белок 4×3, радужка 2×3, зрачок 2×2, блик
function eyes(p,f,o){const y=o.ey||7,iris=o.iris||'#3a6ab0',L=[3,9];L.forEach((x,i)=>{f(x,y,x+3,y+2,'#fbfbff',2);f(x+1,y,x+2,y+2,iris,6);f(x+1,y+1,x+2,y+2,'#14141e',2);p(i?x+1:x+2,y,'#ffffff',0);
  if(o.lash){p(i?x+3:x,y-1,'#2a1a2a',0);p(i?x+4:x-1,y,'#2a1a2a',0)}});
 if(o.brow){f(3,y-2,6,y-2,o.brow,3);f(9,y-2,12,y-2,o.brow,3);if(o.browUp){p(3,y-1,null);p(12,y-1,null)}else{p(6,y-1,o.brow,3);p(9,y-1,o.brow,3)}}}
function smile(p,f,o){const y=o.my||12,c=o.lip||'#7a3028';p(5,y-1,c,3);p(10,y-1,c,3);f(6,y,9,y,c,3);if(o.teeth)f(7,y,8,y,'#fff6ee',2);if(o.tongue)f(7,y+1,8,y+1,'#d8606a',4)}
function nose(p,f,skin){f(7,10,8,10,shade(skin,-.12),3);p(7,9,shade(skin,.06),2)}
function shade(c,k){const v=hex(c).map(q=>Math.max(0,Math.min(255,Math.round(q*(1+k)))));return'#'+v.map(q=>q.toString(16).padStart(2,'0')).join('')}
// рука/нога 4×12×4
function limb(paint,top,bottom){return box([4,12,4],{all:paint,top:top||paint,bottom:bottom||top||paint},[0,-6,0])}
// ---------- Блоки: шахтёр в оранжевой каске с фонарём, синяя рубашка, ремень с пряжкой, кирка ----------
export function bloki(){const skin='#e9b48a',hair=['#5a3a1e','#664424','#4e3218'],shirt=['#2f5fc4','#3567cc','#2c58b8'],pants=['#6b4426','#744a2a','#62401f'];
 const head=box([8,8,8],{
  front:({p,f})=>{f(0,0,15,15,skin,5);f(0,0,15,3,hair);f(0,4,1,7,hair);f(14,4,15,7,hair);p(4,4,hair[0]);p(11,4,hair[0]);f(2,3,4,3,'#7a5432',4);
   eyes(p,f,{ey:7,iris:'#4a7ac0',brow:'#4a2e16'});nose(p,f,skin);smile(p,f,{my:12,teeth:1});f(2,11,3,11,'#f19c8c',3);f(12,11,13,11,'#f19c8c',3);p(4,10,'#c98a62');p(11,10,'#c98a62');p(12,10,'#c98a62');f(0,15,15,15,shade(skin,-.1),3)},
  side:({p,f})=>{f(0,0,15,15,skin,5);f(0,0,15,5,hair);f(0,6,6,9,hair);f(9,8,11,11,shade(skin,-.08),3);p(10,9,shade(skin,-.18))},
  back:({f})=>{f(0,0,15,15,hair);f(0,13,15,15,shade(skin,-.05))},top:hair,bottom:skin},[0,28,0]);
 const helmO=['#f07a1c','#f58a2a','#e86e14'];
 const helm=box([9,3.4,9],{all:({p,f,w,h})=>{f(0,0,w-1,h-1,helmO);f(0,h-2,w-1,h-1,'#c85a0e');f(0,1,w-1,1,'#ffa040',4);for(let x=2;x<w;x+=5)p(x,h-3,'#9a4a0a',0)},
  top:({f,w,h})=>{f(0,0,w-1,h-1,helmO);f(Math.floor(w/2)-2,0,Math.floor(w/2)+1,h-1,'#ff9a3a');f(Math.floor(w/2)-1,0,Math.floor(w/2),h-1,'#ffb860',3)}},[0,33.1,0]);
 const brim=box([10.4,1,10.4],{all:['#d0620f','#c85c0c']},[0,31.3,0.3]);
 const lampB=box([3.6,3,1.4],{all:'#6e6e76',front:({f,p,w,h})=>{f(0,0,w-1,h-1,'#5a5a62');}},[0,33.2,4.9]);
 const lamp=box([2.4,2,.6],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,'#fff2a0',4);f(1,1,2,2,'#ffffff',0)}},[0,33.2,5.75],null,{emis:'#ffe680',ei:1,flat:1});
 const body=box([8,12,4],{front:({p,f})=>{f(0,0,15,23,shirt);f(0,0,15,1,'#24499a');f(6,0,9,3,skin,4);p(6,3,null);f(6,4,9,4,'#24499a');
   for(const y of[6,10,14])f(7,y,8,y+1,'#d8d8e0',2);f(1,5,6,10,'#2a54ae');f(1,5,6,6,'#24499a');p(5,3,'#ffd84a',0);p(5,4,'#ffd84a',0);p(5,2,'#e86060',0);
   f(1,12,2,17,'#2a50a8');f(13,12,14,17,'#2a50a8');f(0,18,15,20,['#5a3820','#62401f']);f(6,18,9,20,'#e8c040',3);f(7,19,8,19,'#7a5a10',0);f(0,21,15,23,pants)},
  back:({f})=>{f(0,0,15,23,shirt);f(0,0,15,1,'#24499a');f(0,18,15,20,'#5a3820');f(0,21,15,23,pants)},
  side:({f})=>{f(0,0,7,23,shirt);f(0,18,7,20,'#5a3820');f(0,21,7,23,pants)},top:shirt,bottom:pants},[0,18,0]);
 const armP=({p,f})=>{f(0,0,7,23,shirt);f(0,0,7,1,'#24499a');f(0,9,7,11,'#5a86e0',4);f(0,12,7,23,skin,5);f(0,20,7,23,shade(skin,-.08),3);p(1,22,shade(skin,-.18));p(5,22,shade(skin,-.18))};
 const legP=({p,f})=>{f(0,0,7,23,pants);f(1,9,6,13,'#5a3a1e');f(1,9,6,9,'#7a5234',3);p(2,11,'#e0c080',0);p(5,11,'#e0c080',0);f(0,16,7,23,['#5c5c5c','#666666','#565656']);f(0,16,7,16,'#7a7a7a');f(2,18,5,18,'#e8e0d0',2);f(2,20,5,20,'#e8e0d0',2);f(0,23,7,23,'#2e2e2e')};
 const L=at(limb(legP,pants[0],'#2e2e2e'),[-2,12,0]),R=at(limb(legP,pants[0],'#2e2e2e'),[2,12,0]);
 const metal=['#b4b4be','#c8c8d2','#a0a0aa'];
 const pick=grp(box([1.3,15,1.3],{all:({f,w,h})=>{f(0,0,w-1,h-1,['#7a5230','#6a4526','#845a36']);for(let y=4;y<h;y+=6)f(0,y,w-1,y,'#4a2e16')}},[0,0,0]),
  box([1.8,2.2,1.8],{all:'#5a5a62'},[0,7.4,0]),
  ...[[-4.4,6.5],[-3.2,7.4],[-1.8,7.9],[1.8,7.9],[3.2,7.4],[4.4,6.5]].map(([x,y])=>box([1.7,1.7,1.5],{all:metal,top:'#e0e0ea'},[x,y,0],[0,0,-x*8])));
 const armR=at(grp(limb(armP,shirt[0],skin),at(pick,[0,-10.5,1.6],[90,0,0])),[-6,24,0],[-35,0,8]);
 const armL=at(limb(armP,shirt[0],skin),[6,24,0],[0,0,-6]);
 sw(L,1);sw(R,-1);sw(armR,-1,1);sw(armL,1,1);return grp(head,helm,brim,lampB,lamp,body,L,R,armR,armL)}
// ---------- Грань: фиолетовые волосы с прядями, очки на лбу, бирюзовая куртка, золотой транспортир с делениями ----------
function protractorMesh(r){const cv=document.createElement('canvas');cv.width=256;cv.height=136;const g=cv.getContext('2d');const cx=128,cy=128,R=124;
 g.fillStyle='#e8b224';g.beginPath();g.moveTo(cx-R,cy);g.arc(cx,cy,R,Math.PI,0);g.closePath();g.fill();
 const gr=g.createLinearGradient(0,0,0,136);gr.addColorStop(0,'rgba(255,240,170,.55)');gr.addColorStop(1,'rgba(150,90,0,.25)');g.fillStyle=gr;g.fill();
 g.globalCompositeOperation='destination-out';g.beginPath();g.moveTo(cx-R*.56,cy);g.arc(cx,cy,R*.56,Math.PI,0);g.closePath();g.fill();g.globalCompositeOperation='source-over';
 g.fillStyle='rgba(255,226,120,.35)';g.beginPath();g.moveTo(cx-R*.56,cy);g.arc(cx,cy,R*.56,Math.PI,0);g.closePath();g.fill();
 g.strokeStyle='#6a4400';for(let a=0;a<=180;a+=5){const t=a*Math.PI/180,l=a%30===0?22:a%10===0?14:8;g.lineWidth=a%30===0?4:2;g.beginPath();g.moveTo(cx+Math.cos(Math.PI+t)*R*.97,cy+Math.sin(Math.PI+t)*R*.97);g.lineTo(cx+Math.cos(Math.PI+t)*(R*.97-l),cy+Math.sin(Math.PI+t)*(R*.97-l));g.stroke()}
 g.fillStyle='#5a3800';g.font='bold 18px sans-serif';g.textAlign='center';g.textBaseline='middle';[[0,'0'],[90,'90'],[180,'180'],[45,'45'],[135,'135']].forEach(([a,s])=>{const t=Math.PI+a*Math.PI/180;g.fillText(s,cx+Math.cos(t)*R*.7,cy+Math.sin(t)*R*.7)});
 g.fillStyle='#6a4400';g.fillRect(cx-R,cy-6,2*R,6);g.beginPath();g.arc(cx,cy-3,7,0,7);g.fill();
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 const geo=new THREE.CircleGeometry(r,48,0,Math.PI);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){const x=geo.attributes.position.getX(i),y=geo.attributes.position.getY(i);uv.setXY(i,(x/r+1)/2,y/r*(124/136)+(8/136))}
 const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide,alphaTest:.05}));
 const rim=new THREE.Group();for(let a=0;a<=180;a+=10){const x=Math.cos(a*Math.PI/180)*r,y=Math.sin(a*Math.PI/180)*r;rim.add(box([1.3,1.1,1.2],{all:['#f0c030','#ffd24a']},[x,y,0],[0,0,a-90],{grad:0}))}
 rim.add(box([2*r+1.2,1.1,1.2],{all:['#e8b224','#f0c030']},[0,0,0]));return grp(m,rim)}
export function gran(){const skin='#f2c39c',hair=['#7a3fc4','#8a4ad4','#6a34ac','#9454e0'],hl='#b07af0',jacket=['#1f8f8a','#22999a','#1c8682'];
 const head=box([8,8,8],{front:({p,f})=>{f(0,0,15,15,skin,5);f(0,0,15,2,hair);eyes(p,f,{ey:7,iris:'#8a4ad4',brow:'#5a2a8a',lash:1});nose(p,f,skin);smile(p,f,{my:12,lip:'#c0506a',teeth:1});
   f(2,11,3,11,'#f5a0a0',3);f(12,11,13,11,'#f5a0a0',3);f(0,15,15,15,shade(skin,-.08))},side:skin,back:skin,top:skin,bottom:skin},[0,28,0]);
 const hp=({p,f,w,h})=>{f(0,0,w-1,h-1,hair);for(let x=1;x<w;x+=3)f(x,0,x,h-1,['#6a34ac','#8a4ad4'],4);for(let i=0;i<w;i+=4)f(i,Math.floor(h*.2),i,Math.floor(h*.55),hl,6)};
 const hairTop=box([9,2.2,9],{all:hp},[0,32.4,-0.2]),hairBack=box([9,12,1.8],{all:hp},[0,26.2,-4.3]);
 const hairSides=[-4.65,4.65].map(x=>box([1.3,10,8.6],{all:hp},[x,27.4,-0.3]));
 const fringe=box([9,2.4,1],{front:({p,f,w,h})=>{f(0,0,w-1,h-1,hair);for(let x=0;x<w;x+=4){p(x+2,h-1,null);p(x+3,h-1,null)}f(3,0,4,h-2,hl,6)},all:hair},[0,30.8,4.3]);
 const strap=box([9.5,1.1,9.5],{all:['#4a4a52','#55555e']},[0,31.6,0]);
 const lens=x=>grp(box([3.2,3,1.3],{all:'#5a5a64',front:({f,w,h})=>{f(0,0,w-1,h-1,'#3e3e46')}},[x,31.6,4.9]),
  box([2.2,2,.5],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,['#8fe0ff','#7ad4f8'],3);p(0,0,'#ffffff',0);p(1,0,'#ffffff',0);p(0,1,'#ffffff',0)}},[x,31.6,5.6],null,{emis:'#3aa0d0',ei:.35,flat:1}));
 const body=box([8,12,4],{front:({p,f})=>{f(0,0,15,23,jacket);f(5,0,10,23,'#f2f2f4',3);f(5,0,10,0,'#ffffff');
   f(6,5,9,5,'#f0c030',0);p(6,4,'#f0c030',0);p(9,4,'#f0c030',0);p(7,3,'#f0c030',0);p(8,3,'#f0c030',0);p(7,4,'#f2f2f4');p(8,4,'#f2f2f4');
   f(4,0,4,23,'#147a76',2);f(11,0,11,23,'#147a76',2);for(let y=2;y<22;y+=3)p(11,y,'#c0c0c8',0);f(1,14,3,17,'#178a86');f(12,14,14,17,'#178a86');f(1,14,3,14,'#127470');f(12,14,14,14,'#127470');f(0,22,15,23,'#127470')},
  side:({f})=>{f(0,0,7,23,jacket);f(0,22,7,23,'#127470')},back:({f,p})=>{f(0,0,15,23,jacket);f(0,22,15,23,'#127470');f(6,6,9,9,'#f0c030',0);f(7,7,8,8,jacket)},top:jacket,bottom:jacket},[0,18,0]);
 const armP=({p,f})=>{f(0,0,7,23,jacket);f(0,17,7,19,'#f2f2f4',3);f(0,20,7,23,skin,5)};
 const legP=({p,f})=>{f(0,0,7,23,['#4a4f5a','#52576a','#454a54']);f(0,0,0,23,'#3e434c');f(3,6,4,7,'#5a6070')};
 const L=at(limb(legP,'#4a4f5a'),[-2,12,0]),R=at(limb(legP,'#4a4f5a'),[2,12,0]);
 const shoe=x=>box([4.3,2.6,4.8],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,['#1f9f9a','#22a8a2']);f(0,h-2,w-1,h-1,'#f4f4f4');p(3,1,'#ffffff');p(5,1,'#ffffff')},top:({f,w,h})=>{f(0,0,w-1,h-1,'#1f9f9a');for(let y=3;y<h-1;y+=2)f(2,y,w-3,y,'#ffffff',2)},bottom:'#e8e8e8'},[x,1.3,0.3]);
 const armR=at(limb(armP,jacket[0],skin),[-6,24,0],[-48,0,14]),armL=at(limb(armP,jacket[0],skin),[6,24,0],[-48,0,-14]);
 sw(L,1);sw(R,-1);sw(armR,-1,1);sw(armL,1,1);L.add(at(shoe(-2),[2,-12,0]));R.add(at(shoe(2),[-2,-12,0]));
 return grp(head,hairTop,hairBack,...hairSides,fringe,strap,lens(-2),lens(2),body,L,R,armR,armL,at(protractorMesh(6.4),[0,14.6,8.8],[-8,0,0]))}
// ---------- Пиксель: песочный пёс с пятнами, светлой мордочкой, красным ошейником и жетоном-треугольником ----------
export function pixel(){const fur=['#e2c07a','#d8b46a','#e8c886','#dcb872'],dark=['#b88a48','#c0924e'],light='#f6e2b4';
 const furP=({p,f,w,h})=>{f(0,0,w-1,h-1,fur);for(let i=0;i<w*h/10;i++)p(Math.floor(rnd()*w),Math.floor(rnd()*h),rnd()<.5?'#cfa860':'#f0d496',3)};
 const body=box([7,9,7],{all:furP,back:({p,f,w,h})=>{furP({p,f,w,h});f(2,3,8,9,dark)},left:({p,f,w,h})=>{furP({p,f,w,h});f(4,2,9,7,dark);f(5,3,8,6,'#a87a3a')},front:({p,f,w,h})=>{furP({p,f,w,h});f(3,1,10,14,light,4)}},[0,6.5,-0.5],[-12,0,0]);
 const haunch=x=>box([3,4,6],{all:furP},[x,2,-1]);
 const legD=x=>box([2,7,2],{all:({p,f,w,h})=>{f(0,0,w-1,h-1,fur);f(0,h-3,w-1,h-1,light);p(1,h-1,'#b89060')}},[x,3.5,2.6]);
 const head=box([7,6,6],{front:({p,f,w,h})=>{furP({p,f,w,h});f(1,0,4,3,dark);
   const ey=4;[[2,ey],[9,ey]].forEach(([x,y],i)=>{f(x,y,x+2,y+2,'#2a1a10',0);p(i?x+1:x+1,y,'#ffffff',0);f(x,y+2,x+2,y+2,'#1a1008',0)});f(2,ey-2,4,ey-2,'#a07040',2);f(9,ey-2,11,ey-2,'#a07040',2);
   f(4,9,9,11,light)},all:furP,top:({p,f,w,h})=>{furP({p,f,w,h});f(2,0,5,4,dark)}},[0,13.2,0.8]);
 const snout=box([3.6,2.6,2.6],{front:({p,f,w,h})=>{f(0,0,w-1,h-1,light,4);f(2,0,4,1,'#1a1a1a',0);p(2,0,'#6a6a6a',0);f(3,2,3,3,'#5a3a2a',0);p(2,4,'#5a3a2a',0);p(4,4,'#5a3a2a',0)},all:light,top:({f,w,h})=>{f(0,0,w-1,h-1,light);f(2,h-2,4,h-1,'#1a1a1a',0)}},[0,11.9,4.9]);
 const tongue=box([1.4,.5,1.2],{all:'#e06878'},[0.4,10.6,5.6],[20,0,0]);
 const ear=x=>box([1.7,4.6,2.6],{all:dark,front:({f,w,h})=>{f(0,0,w-1,h-1,dark);f(1,1,w-2,h-2,'#d89080')}},[x,12.9,0.7],[0,0,x>0?-12:12]);
 const collar=box([7.5,1.3,6.5],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,['#d42a2a','#c02020','#dc3434']);for(let x=0;x<w;x+=3)p(x,1,'#f6d0d0',2)}},[0,10.1,0.6]);
 const tag=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.5,3),new THREE.MeshLambertMaterial({color:0xffd24a,emissive:0x4a3000}));tag.rotation.set(Math.PI/2,0,Math.PI/6);tag.position.set(0,8.9,4);
 const tail=box([1.5,1.5,4.2],{all:furP,back:light},[2.4,3.2,-5.2],[35,30,0]);
 return grp(body,haunch(-2.6),haunch(2.6),legD(-1.6),legD(1.6),head,snout,tongue,ear(-4),ear(4),collar,tag,tail)}
// ---------- Криволом: тёмные латы с заклёпками, светящееся забрало, кривая корона, плащ с золотой каймой ----------
export function krivo(){const arm_=['#2b2433','#352c40','#241d2b','#30283a'],cr=['#b04ce0','#c060f0','#9038c0'],edge='#5a4a6e';
 const plate=({p,f,w,h})=>{f(0,0,w-1,h-1,arm_);for(let y=5;y<h;y+=7)f(0,y,w-1,y,'#18121e',2);for(let y=2;y<h;y+=7){p(1,y,'#8a7aa0',0);p(w-2,y,'#8a7aa0',0)}f(0,0,w-1,0,edge,3)};
 const head=box([9,9,9],{front:({p,f})=>{f(0,0,17,17,arm_);f(0,0,17,0,edge);f(2,6,15,9,'#0a060c',0);f(3,7,5,8,'#ff3030',0);f(12,7,14,8,'#ff3030',0);p(4,7,'#ffb0b0',0);p(13,7,'#ffb0b0',0);
   f(2,4,6,4,'#5a4a6e');f(11,4,15,4,'#5a4a6e');p(6,5,'#5a4a6e');p(11,5,'#5a4a6e');for(let x=4;x<14;x+=2)f(x,12,x,15,'#120c16',0);f(8,10,9,16,'#3e3450')},all:plate},[0,33,0]);
 const visorGlow=box([2.6,.9,.3],{all:'#ff4040'},[-2.9,34.1,4.6],null,{emis:'#ff2020',ei:1,flat:1}),visorGlow2=visorGlow.clone();visorGlow2.position.x=2.9;
 const crown=new THREE.Group();crown.add(box([9.6,1.6,9.6],{all:({p,f,w,h})=>{f(0,0,w-1,h-1,['#d0a020','#e0b030']);for(let x=1;x<w;x+=4)p(x,1,'#ff4a6a',0)}},[0,38.3,0]));
 [[-3.5,3,-14],[-1.2,4.6,9],[1.4,3.4,-20],[3.6,4.2,16],[0,2.6,30]].forEach(([x,h,a],i)=>crown.add(box([1.4,h,1.4],{all:cr},[x,39+h/2,i===4?-3.5:3.6],[0,0,a],{emis:'#7020a0',ei:.5})));
 const body=box([10,13,5],{front:({p,f})=>{f(0,0,19,25,arm_);f(0,0,19,1,edge);const z=[[2,8],[4,6],[6,8],[8,10],[10,8],[12,6],[14,8],[16,10]];z.forEach(([x,y])=>{f(x,y,x+1,y+1,'#e02a4a',0);f(x,y+2,x+1,y+2,'#a01a30',0)});
   for(const[x,y]of[[2,3],[17,3],[2,18],[17,18]])p(x,y,'#9a8ab0',0);f(0,20,19,22,'#5a2a6a');f(8,20,11,22,'#d0a020',2)},all:plate},[0,22.5,0]);
 const shoulder=x=>box([5,3.2,6],{all:plate,top:({f,w,h})=>{f(0,0,w-1,h-1,['#4a3a58','#3e3050']);f(0,0,w-1,1,'#6a5a80')}},[x,28.6,0]);
 const cape=box([10,24,1],{all:({p,f,w,h})=>{f(0,0,w-1,h-1,['#6a1020','#7a1428','#5a0c1a']);f(0,0,1,h-1,'#d0a020',3);f(w-2,0,w-1,h-1,'#d0a020',3);f(0,h-2,w-1,h-1,'#d0a020',3);for(let y=4;y<h-3;y+=6)f(Math.floor(w/2),y,Math.floor(w/2),y+3,'#4a0812',2)}},[0,19,-3.2],[6,0,0]);
 const legK=x=>box([4.5,14,4.5],{all:({p,f,w,h})=>{plate({p,f,w,h});f(0,h-6,w-1,h-1,'#120c16');f(0,Math.floor(h*.45),w-1,Math.floor(h*.45)+1,'#4a3a58')},top:arm_[0],bottom:'#120c16'},[x,7,0]);
 const armK=(x,r)=>at(box([4,13,4],{all:({p,f,w,h})=>{plate({p,f,w,h});f(0,h-6,w-1,h-1,'#4a3a58');f(0,h-6,w-1,h-6,'#6a5a80')}},[0,-6.5,0]),[x,28,0],r);
 const staff=new THREE.Group();let y=0,x=0;[[0,8],[25,5],[-30,5],[20,5]].forEach(([a,l])=>{staff.add(box([1.3,l+.6,1.3],{all:['#3a2a1a','#4a3622']},[x,y+l/2,0],[0,0,a]));x-=Math.sin(a*Math.PI/180)*l;y+=Math.cos(a*Math.PI/180)*l});
 staff.add(box([2.6,3.4,2.6],{all:cr},[x,y+1.5,0],[0,45,20],{emis:'#9030d0',ei:.8}));
 const lL=sw(at(legK(0),[-2.5,14,0]),1),lR=sw(at(legK(0),[2.5,14,0]),-1);lL.children[0].position.y=-7;lR.children[0].position.y=-7;const aR=sw(armK(-7.5,[-20,0,6]),-1,1),aL=sw(armK(7.5,[0,0,-6]),1,1);
 return grp(head,visorGlow,visorGlow2,crown,body,shoulder(-7),shoulder(7),cape,lL,lR,aR,at(staff,[-7.5,10,4],[0,0,8]),aL)}
// =================== ВРАГИ (добрые на вид, не страшные) ===================
// Зомби-«тупоугольник»: заплатки, рваная футболка, сонный взгляд; руки вперёд-вверх под тупым углом к телу
export function zombie(){const skin=['#5e9e4a','#6aac54','#548c42','#64a450'];
 const head=box([8,8,8],{front:({p,f})=>{f(0,0,15,15,skin);f(1,1,4,3,'#4a8a3a');f(11,12,13,14,'#4a8a3a');
   f(3,6,6,8,'#f4f4e8',2);f(9,6,12,8,'#f4f4e8',2);f(4,7,5,8,'#1a2a1a',0);f(10,7,11,8,'#1a2a1a',0);f(3,6,6,6,'#3e7a32');f(9,5,12,5,'#3e7a32');p(5,7,'#ffffff',0);p(11,7,'#ffffff',0);
   f(5,12,10,12,'#2e5a24',0);p(6,13,'#f4f4e8',0);p(9,13,'#f4f4e8',0);f(7,10,8,10,'#4a8a3a')},all:({f,p,w,h})=>{f(0,0,w-1,h-1,skin);f(0,0,w-1,2,'#3a5a2a')},top:({f,w,h})=>f(0,0,w-1,h-1,['#3a5a2a','#44682f'])},[0,28,0]);
 const shirt=['#2aa8a8','#249c9c','#30b4b4'];
 const body=box([8,12,4],{front:({p,f})=>{f(0,0,15,23,shirt);for(let x=0;x<16;x+=3){p(x,17,null);p(x+1,18,null)}f(0,18,15,23,'#3b4fa0');f(0,17,15,17,'#3b4fa0');f(4,4,7,7,'#1e8a8a');f(10,10,12,11,'#5e9e4a');
   f(3,10,12,10,'#ffffff',0);p(3,9,'#ffffff',0);p(4,8,'#ffffff',0);p(5,7,'#ffffff',0);p(6,6,'#ffffff',0);f(3,9,4,9,'#ffe060',0)},side:shirt,back:shirt,top:shirt,bottom:'#3b4fa0'},[0,18,0]);
 const legP=({f})=>{f(0,0,7,23,['#3b4fa0','#34489a','#4256a8']);f(0,20,7,23,'#4a4a6a')};
 const L=at(limb(legP,'#3b4fa0','#4a4a6a'),[-2,12,0]),R=at(limb(legP,'#3b4fa0','#4a4a6a'),[2,12,0]);
 const armZ=(x,ry)=>at(box([4,12,4],{all:({f,p,w,h})=>{f(0,0,w-1,7,shirt);f(0,8,w-1,h-1,skin);p(2,14,'#4a8a3a');f(0,h-2,w-1,h-1,'#4a8a3a')}},[0,-6,0]),[x,24,0],[-84,ry,x>0?-10:10]);
 sw(L,1);sw(R,-1);return grp(head,body,L,R,armZ(-6.2,0),armZ(6.2,0))}
// Паук-«острые углы»: пушистое тело в полоску, 8 блестящих глаз, лапы с суставами под острым углом
export function spider(){const blk=['#2a2230','#342a3c','#221a28','#3a3044'];
 const fuzz=({p,f,w,h})=>{f(0,0,w-1,h-1,blk);for(let i=0;i<w*h/6;i++)p(Math.floor(rnd()*w),Math.floor(rnd()*h),'#4a3e58',4);for(let y=3;y<h;y+=6)f(0,y,w-1,y,'#5a2a40',3)};
 const body=box([10,7,11],{all:fuzz},[0,7,-4]);
 const head=box([8,7,6],{front:({p,f,w,h})=>{f(0,0,w-1,h-1,blk);[[2,4],[12,4],[4,6],[10,6],[6,3],[9,3]].forEach(([x,y],i)=>{const s=i<2?2:1;f(x,y,x+s,y+s,'#ff3a4a',0);p(x,y,'#ffd0d8',0)});
   f(3,1,6,1,'#5a4a68');f(9,1,12,1,'#5a4a68');f(5,10,6,13,'#f0e8d8',0);f(9,10,10,13,'#f0e8d8',0);f(6,9,9,9,'#8a2a3a',0)},all:fuzz},[0,7,3.2]);
 const legs=new THREE.Group();[-1,1].forEach(sd=>[3.5,1,-2,-5].forEach((z,i)=>{const up=box([9,1.7,1.7],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,blk);p(Math.floor(w/2),1,'#6a5a7a')}},[4.5,0,0]);
  const lo=box([1.6,10,1.6],{all:({f,w,h})=>{f(0,0,w-1,h-1,blk);f(0,h-3,w-1,h-1,'#5a2a40')}},[0,-5,0]);const knee=at(lo,[9,0,0],[0,0,-28]);
  const g=grp(up,knee,box([2.2,2.2,2.2],{all:'#4a3a58'},[9,0,0]));g.userData.sp=i%2?1:-1;g.userData.rz=38*Math.PI/180;g.position.set(sd*4.2,8.5,z);
  g.rotation.set(0,sd>0?(i-1.5)*-14*Math.PI/180:Math.PI+(i-1.5)*14*Math.PI/180,38*Math.PI/180);legs.add(g)}));
 return grp(body,head,legs)}
// Слизень-Кубик (лес): полупрозрачный куб с ядром-мордочкой; по диагоналям видно, как он распадётся на треугольники
export function slime(){const outer=box([15,15,15],{all:({p,f,w,h})=>{f(0,0,w-1,h-1,['#7ad85a','#6ccc4e','#86e064'],4);for(let i=0;i<w;i++){p(i,i,'#c8ffb0',0);p(w-1-i,i,'#c8ffb0',0)}f(1,1,4,2,'#e6ffd8',2)}},[0,7.5,0],null,{alpha:1,op:.55,grad:.2});
 const core=box([9,8,9],{front:({p,f,w,h})=>{f(0,0,w-1,h-1,['#3e9a2a','#46a632']);f(3,4,6,7,'#123a0a',0);f(11,4,14,7,'#123a0a',0);f(3,4,4,5,'#ffffff',0);f(11,4,12,5,'#ffffff',0);f(7,11,10,11,'#123a0a',0);p(6,10,'#123a0a',0);p(11,10,'#123a0a',0);f(1,9,3,10,'#ff9aa0',3);f(14,9,16,10,'#ff9aa0',3)},all:['#3e9a2a','#46a632']},[0,5.6,2.2]);
 const g=grp(outer,core);g.userData.hop=1;return g}
// Скелет-лучник (пустыня): кости, песочный платок от солнца, добрые круглые глазницы, лук со стрелой
export function skeleton(){const bone=['#e8e4d6','#f0ecdf','#dcd8c8'],gap='#4a4640',scarf=['#d8a850','#e0b25a','#c99a44'];
 const head=box([8,8,8],{front:({p,f})=>{f(0,0,15,15,bone);f(2,5,6,9,gap,0);f(9,5,13,9,gap,0);f(3,6,5,8,'#141210',0);f(10,6,12,8,'#141210',0);p(4,6,'#ffe070',0);p(11,6,'#ffe070',0);
   f(7,10,8,11,gap,0);f(4,13,11,13,gap,0);for(let x=4;x<12;x+=2)p(x,12,'#c8c4b4',0);f(0,0,15,2,scarf)},all:({f,w,h})=>{f(0,0,w-1,h-1,bone);f(0,0,w-1,4,scarf)},top:scarf},[0,28,0]);
 const tail=box([3,6,1],{all:scarf},[1.5,27,-4.4],[10,0,-12]);
 const body=box([8,12,3],{front:({p,f})=>{f(7,0,8,23,bone);for(let y=2;y<14;y+=3)f(2,y,13,y+1,bone);f(3,18,12,20,bone);f(0,0,15,1,scarf)},all:({f,w,h})=>{f(Math.floor(w/2)-1,0,Math.floor(w/2),h-1,bone)}},[0,18,0]);
 body.material.forEach(m=>{m.transparent=false;m.alphaTest=.5});
 const thin=({f,w,h})=>f(0,0,w-1,h-1,bone);
 const L=at(box([2,12,2],{all:thin},[0,-6,0]),[-2,12,0]),R=at(box([2,12,2],{all:thin},[0,-6,0]),[2,12,0]);
 const bow=new THREE.Group();for(let i=-5;i<=5;i++){const a=i/5;bow.add(box([1.1,1.6,1.1],{all:['#8a5a2a','#7a4e22']},[Math.abs(a)*-2.2+2.2,i*1.4,0]))}
 const str=new THREE.Mesh(new THREE.BoxGeometry(.25,15.4,.25),new THREE.MeshBasicMaterial({color:0xf0f0f0}));str.position.x=-1.2;bow.add(str);
 const arrow=grp(box([10,.5,.5],{all:'#a0784a'},[0,0,0]),box([1.6,1.2,.5],{all:'#c8c8d0'},[5.4,0,0]),box([1.6,1.4,.3],{all:'#e05040'},[-5,0,0]));arrow.position.set(-1.4,0,0);arrow.rotation.y=Math.PI/2;bow.add(arrow);
 arrow.rotation.y=0;arrow.position.set(-3,0,0);
 const armR=at(box([2,12,2],{all:thin},[0,-6,0]),[-5,24,0],[0,0,-62]),armL=at(box([2,12,2],{all:thin},[0,-6,0]),[5,24,0],[0,0,40]);
 sw(L,1);sw(R,-1);return grp(head,tail,body,L,R,armR,armL,at(bow,[-15.5,19,1.5]))}
// Водяной (река): чешуйчатый, водоросли вместо волос, большие рыбьи глаза; трезубец с наконечником-треугольником
export function drowned(){const sk=['#3aa0a8','#46acb4','#3296a0'],weed=['#3a8a3a','#4a9a42','#2e7a30'];
 const scales=({p,f,w,h})=>{f(0,0,w-1,h-1,sk);for(let y=1;y<h;y+=3)for(let x=(y%2)*2;x<w;x+=4){p(x,y,'#7ad0d8',3);p(x+1,y+1,'#2a8088',3)}};
 const head=box([8,8,8],{front:({p,f})=>{scales({p,f,w:16,h:16});f(2,5,6,9,'#fdfdf0',0);f(9,5,13,9,'#fdfdf0',0);f(3,6,5,8,'#1a3a5a',0);f(10,6,12,8,'#1a3a5a',0);p(3,6,'#ffffff',0);p(10,6,'#ffffff',0);
   f(5,12,10,12,'#1a5a5a',0);p(4,11,'#1a5a5a',0);p(11,11,'#1a5a5a',0);f(1,10,2,10,'#8ae0e8');f(13,10,14,10,'#8ae0e8');f(0,0,15,2,weed)},all:({p,f,w,h})=>{scales({p,f,w,h});f(0,0,w-1,3,weed)}},[0,28,0]);
 const strands=[-3.4,-1.2,1.2,3.4].map((x,i)=>box([1.2,5+i%2*2,1.2],{all:weed},[x,29.5-(i%2),-4.2]));
 const fins=[-4.6,4.6].map(x=>box([.8,3.4,3],{all:({f,w,h})=>{f(0,0,w-1,h-1,['#7ad0d8','#5ac0c8']);for(let y=0;y<h;y+=2)f(0,y,w-1,y,'#2a8088')}},[x,28.5,-1],[0,0,x>0?-20:20]));
 const body=box([8,12,4],{front:({p,f})=>{scales({p,f,w:16,h:24});f(3,4,12,15,'#9ad8c8',3);for(let y=6;y<15;y+=3)f(4,y,11,y,'#6ab8a8',2);f(0,17,15,23,['#2a5aa0','#3264b0']);for(let x=0;x<16;x+=4)p(x+1,17,'#3a8a3a')},all:scales,bottom:'#2a5aa0'},[0,18,0]);
 const legP=({f,p,w,h})=>{f(0,0,w-1,h-1,['#2a5aa0','#3264b0']);f(0,h-6,w-1,h-1,sk);f(0,h-2,w-1,h-1,'#7ad0d8')};
 const L=at(limb(legP,'#2a5aa0',sk[0]),[-2,12,0]),R=at(limb(legP,'#2a5aa0',sk[0]),[2,12,0]);
 const tri=new THREE.Group();tri.add(box([1,20,1],{all:['#c8a040','#b89030']},[0,0,0]));
 const head3=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,.8,3),new THREE.MeshLambertMaterial({color:0x8ae0f0,emissive:0x1a4a5a}));head3.rotation.set(Math.PI/2,0,Math.PI/2);head3.position.y=11.3;tri.add(head3);
 const armR=at(grp(limb(scales,sk[0]),at(tri,[0,-11,1.5],[90,0,0])),[-6,24,0],[-40,0,8]),armL=at(limb(scales,sk[0]),[6,24,0],[-10,0,-6]);
 sw(L,1);sw(R,-1);sw(armR,-1,1);sw(armL,1,1);return grp(head,...strands,...fins,body,L,R,armR,armL)}
// «Тупик» (шахта/деревня): ворчливый блок на 4 ножках; на морде — шкала-угломер со стрелкой; фитиль с искрой.
// Обезвредить — назвать угол на шкале.
export function tupik(){const rust=['#c8743a','#d07e42','#bc6a32','#d88a4a'];
 const rp=({p,f,w,h})=>{f(0,0,w-1,h-1,rust);for(let i=0;i<w*h/8;i++)p(Math.floor(rnd()*w),Math.floor(rnd()*h),rnd()<.5?'#a85a28':'#e09a5a',3)};
 const head=box([8,8,8],{front:({p,f})=>{rp({p,f,w:16,h:16});f(2,2,5,2,'#5a2a10',0);f(10,2,13,2,'#5a2a10',0);p(5,3,'#5a2a10',0);p(10,3,'#5a2a10',0);
   f(2,4,5,6,'#1a1008',0);f(10,4,13,6,'#1a1008',0);p(3,4,'#ffd060',0);p(11,4,'#ffd060',0);
   for(let a=0;a<=180;a+=15){const t=Math.PI+a*Math.PI/180;p(Math.round(7.5+Math.cos(t)*5.5),Math.round(14+Math.sin(t)*5.5),'#f4e8c0',0)}
   const ang=130*Math.PI/180;for(let r=0;r<5;r++)p(Math.round(7.5+Math.cos(Math.PI+ang)*r*-1),Math.round(14-Math.sin(ang)*r),'#e02a2a',0);f(2,14,13,14,'#f4e8c0',0)},all:rp},[0,10,0]);
 const body=box([7,6,6],{all:rp,front:({p,f,w,h})=>{rp({p,f,w,h});f(2,2,w-3,h-3,'#a85a28')}},[0,3.5,-.5]);
 const leg=(x,z)=>at(box([2.6,3,2.6],{all:({f,w,h})=>{f(0,0,w-1,h-1,'#8a4a20');f(0,h-1,w-1,h-1,'#4a2a10')}},[0,-1.5,0]),[x,3,z]);
 const lFL=sw(leg(-2.3,2),1),lFR=sw(leg(2.3,2),-1),lBL=sw(leg(-2.3,-2.6),-1),lBR=sw(leg(2.3,-2.6),1);
 const fuse=box([.9,3,.9],{all:'#3a3030'},[1.5,15.2,0],[0,0,-15]);
 const spark=box([1.6,1.6,1.6],{all:'#ffe060'},[2.3,16.9,0],[0,45,45],{emis:'#ffb020',ei:1,flat:1});spark.userData.spark=1;
 const g=grp(head,body,lFL,lFR,lBL,lBR,fuse,spark);g.scale.setScalar(1.45);return g}
// Фантом-летун (замок, ночью): треугольные крылья со светящейся каймой, большие добрые глаза, хвост
export function phantom(){const ind=['#3a3a7a','#44448a','#34346e'];
 const bodyP=({p,f,w,h})=>{f(0,0,w-1,h-1,ind);for(let x=0;x<w;x+=3)f(x,0,x,h-1,'#2e2e66',2)};
 const body=box([6,4,12],{all:bodyP,top:({p,f,w,h})=>{bodyP({p,f,w,h});f(Math.floor(w/2)-1,0,Math.floor(w/2),h-1,'#6af0ff',0)}},[0,0,0]);
 const head=box([6,5,5],{front:({p,f,w,h})=>{f(0,0,w-1,h-1,ind);f(1,2,4,5,'#f0fbff',0);f(7,2,10,5,'#f0fbff',0);f(2,3,3,5,'#1a2a6a',0);f(8,3,9,5,'#1a2a6a',0);p(2,3,'#ffffff',0);p(8,3,'#ffffff',0);f(4,8,7,8,'#1a1a3a',0);p(5,9,'#ff9aa0',0)},all:bodyP},[0,.6,8.2]);
 const wingGeo=s=>{const g=new THREE.BufferGeometry();const v=new Float32Array([0,0,4, 0,0,-5, s*14,0,-3]);g.setAttribute('position',new THREE.BufferAttribute(v,3));g.computeVertexNormals();return g};
 const wing=s=>{const cv=document.createElement('canvas');cv.width=32;cv.height=32;const g=cv.getContext('2d');g.fillStyle='#4a4a9a';g.fillRect(0,0,32,32);for(let i=0;i<40;i++){g.fillStyle=i%2?'#3a3a80':'#5656a8';g.fillRect(Math.random()*32|0,Math.random()*32|0,2,2)}
  const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;const m=new THREE.Mesh(wingGeo(s),new THREE.MeshLambertMaterial({map:t,side:THREE.DoubleSide}));
  const ed=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.1,4),new THREE.Vector3(s*14,.1,-3),new THREE.Vector3(0,.1,-5)]),new THREE.LineBasicMaterial({color:0x6af0ff}));
  const gw=grp(m,ed);gw.position.x=s*3;gw.userData.flap=s;return gw};
 const tail=box([2,1.4,7],{all:bodyP},[0,0,-9],[8,0,0]),tip=box([3.4,.8,2.4],{all:'#6af0ff'},[0,-.4,-12.6],null,{emis:'#30a0c0',ei:.8,flat:1});
 const g=grp(body,head,wing(1),wing(-1),tail,tip);g.userData.fly=1;g.scale.setScalar(1.5);return g}
export {THREE};
export const ALL={bloki,gran,pixel,krivo,zombie,spider,slime,skeleton,drowned,tupik,phantom};
