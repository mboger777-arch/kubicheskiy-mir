// Воксельные модели героев (единица = 1 «пиксель» скина, как в майнкрафте). Каждая часть — коробка с нарисованными гранями.
import * as THREE from './vendor/three.module.js';
let SEED=1;const rnd=()=>{SEED=(SEED*16807)%2147483647;return SEED/2147483647};
const hex=c=>{c=c.replace('#','');return[0,2,4].map(i=>parseInt(c.substr(i,2),16))};
const jc=(c,a=10)=>{const v=hex(c).map(x=>Math.max(0,Math.min(255,Math.round(x+(rnd()*2-1)*a))));return`rgb(${v})`};
// холст w×h пикселей; p(x,y,c) рисует пиксель с лёгким шумом
export function tex(w,h,fn){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
 const p=(x,y,c,a)=>{if(x<0||y<0||x>=w||y>=h||!c)return;g.fillStyle=jc(c,a==null?9:a);g.fillRect(x,y,1,1)};
 const f=(x0,y0,x1,y1,c,a)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)p(x,y,Array.isArray(c)?c[Math.floor(rnd()*c.length)]:c,a)};
 fn({p,f,w,h,g});const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t}
const solidF=c=>({w,h,f})=>f(0,0,w-1,h-1,c);
// коробка: s=[w,h,d], faces {front,back,left,right,top,bottom, all}; каждая — функция рисования или цвет
export function box(s,faces,pos,rot){const[w,h,d]=s;const get=k=>faces[k]||faces.side&&(k==='left'||k==='right'||k==='back')&&faces.side||faces.all;
 const dims={right:[d,h],left:[d,h],top:[w,d],bottom:[w,d],front:[w,h],back:[w,h]};
 const mats=['right','left','top','bottom','front','back'].map(k=>{let v=get(k);if(typeof v==='string'||Array.isArray(v))v=solidF(v);const[tw,th]=dims[k];
  return new THREE.MeshLambertMaterial({map:tex(Math.max(1,Math.round(tw)),Math.max(1,Math.round(th)),v||solidF('#ff00ff'))})});
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats);if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot.map(a=>a*Math.PI/180));return m}
const grp=(...a)=>{const g=new THREE.Group();a.forEach(x=>g.add(x));return g};
// метка для анимации ходьбы: s — знак качания, arm — рука
const sw=(g,s,arm)=>{g.userData.sw=s;g.userData.arm=!!arm;g.userData.r0=g.rotation.x;return g};
const at=(o,pos,rot)=>{const g=new THREE.Group();g.add(o);g.position.set(...pos);if(rot)g.rotation.set(...rot.map(a=>a*Math.PI/180));return g};
// ---------- общие части ----------
function face(skin,eyes,o={}){return({p,f,w,h})=>{f(0,0,w-1,h-1,skin,7);
 if(o.hair)o.hair({p,f,w,h});
 const ey=o.ey||4;f(1,ey,2,ey,'#ffffff',0);f(5,ey,6,ey,'#ffffff',0);p(o.look?1:2,ey,eyes,0);p(o.look?5:6,ey,eyes,0);
 if(o.brow){f(1,ey-1,2,ey-1,o.brow,4);f(5,ey-1,6,ey-1,o.brow,4)}
 if(o.mouth!==false){f(3,6,4,6,o.mouthC||'#9a4a3a',4);if(o.smile){p(2,5+1-1,null);p(2,6,null)}}
 if(o.blush){p(1,5,o.blush,4);p(6,5,o.blush,4)}}}
function arm(s,sleeve,skin,sleeveLen,glove){return box([4,12,4],{all:({f})=>{f(0,0,3,sleeveLen-1,sleeve);f(0,sleeveLen,3,11,skin,7);if(glove)f(0,10,3,11,glove)},top:sleeve,bottom:glove||skin},[0,-6,0])}
function leg(pants,boot,bootH=3){return box([4,12,4],{all:({f})=>{f(0,0,3,11-bootH,pants);f(0,12-bootH,3,11,boot)},top:pants,bottom:boot},[0,-6,0])}
// ---------- Блоки: шахтёр в оранжевой каске с киркой ----------
export function bloki(){const skin='#e9b48a',hair='#5a3a1e';
 const head=box([8,8,8],{front:face(skin,'#2a2a3a',{hair:({f})=>{f(0,0,7,1,hair);f(0,2,0,2,hair);f(7,2,7,2,hair)},brow:'#4a2e16',blush:'#f09a8a'}),side:({f})=>{f(0,0,7,7,skin);f(0,0,7,3,hair);f(5,4,7,5,hair)},back:({f})=>f(0,0,7,7,hair),top:hair,bottom:skin},[0,28,0]);
 const helm=box([9,3,9],{all:({f,w})=>{f(0,0,w-1,2,['#f07a1c','#f58a2a','#e06a12']);f(0,2,w-1,2,'#c85a0e')},top:({f,w,h})=>{f(0,0,w-1,h-1,['#f58a2a','#f07a1c']);f(3,0,5,h-1,'#ff9a3a')}},[0,32,0]);
 const brim=box([10,1,10],{all:'#d0620f'},[0,30.6,0.4]);
 const lamp=box([3,2.4,1.2],{front:({f,p})=>{f(0,0,2,1,'#fff6b0',4);p(1,0,'#ffffff',0)},all:'#8a8a8a'},[0,32.2,4.9]);
 const body=box([8,12,4],{front:({f,p})=>{f(0,0,7,11,['#2f5fc4','#3567cc','#2a56b4']);f(2,0,5,1,'#24499a');f(0,10,7,10,'#6b4426');f(3,10,4,10,'#c0c0c0',0);p(1,4,'#ffd84a',0)},side:({f})=>{f(0,0,3,11,'#2f5fc4');f(0,10,3,10,'#6b4426')},top:'#2f5fc4',bottom:'#2f5fc4'},[0,18,0]);
 const L=at(leg('#6b4426','#5c5c5c'),[-2,12,0]),R=at(leg('#6b4426','#5c5c5c'),[2,12,0]);
 // кирка в руке
 const pick=grp(box([1.2,15,1.2],{all:['#7a5230','#6a4526']},[0,0,0]),
  ...[[-4,7.2],[-2.6,7.9],[-1,8.2],[0,8.3],[1,8.2],[2.6,7.9],[4,7.2]].map(([x,y],i)=>box([1.8,1.8,1.6],{all:i%2?'#a0a0a8':'#c4c4cc'},[x,y,0],[0,0,-x*7])));
 const armR=at(grp(arm(0,'#2f5fc4',skin,4),at(pick,[0,-10,1.5],[90,0,0])),[-6,24,0],[-35,0,8]);
 const armL=at(arm(0,'#2f5fc4',skin,4),[6,24,0],[0,0,-6]);
 sw(L,1);sw(R,-1);sw(armR,-1,1);sw(armL,1,1);return grp(head,helm,brim,lamp,body,L,R,armR,armL)}
// ---------- Грань: фиолетовые волосы, очки, золотой транспортир ----------
export function gran(){const skin='#f2c39c',hair=['#7a3fc4','#8a4ad4','#6a34ac'];
 const head=box([8,8,8],{front:face(skin,'#3a2a5a',{ey:4,blush:'#f5a0a0',mouthC:'#c0506a'}),side:skin,back:skin,top:skin,bottom:skin},[0,28,0]);
 const hairTop=box([9,2,9],{all:hair},[0,32.4,-0.2]),hairBack=box([9,11,1.6],{all:hair},[0,26.6,-4.3]);
 const hairSides=[-4.6,4.6].map(x=>box([1.2,9,8.6],{all:hair},[x,27.8,-0.3]));
 const fringe=box([9,2,1],{front:({f,p})=>{f(0,0,8,0,hair);f(0,1,1,1,hair);f(4,1,5,1,hair);f(8,1,8,1,hair)},all:hair},[0,30.9,4.3]);
 const strap=box([9.4,1.1,9.4],{all:'#4a4a52'},[0,30.4,0]);
 const lens=x=>grp(box([3,3,1.2],{all:'#5a5a64'},[x,30.4,4.9]),box([1.8,1.8,1.3],{front:({f,p})=>{f(0,0,1,1,'#8fe0ff',4);p(0,0,'#ffffff',0)},all:'#6ab8e0'},[x,30.4,5.0]));
 const body=box([8,12,4],{front:({f,p})=>{f(0,0,7,11,['#1f8f8a','#22999a','#1a807c']);f(3,0,4,11,'#f0f0f0');f(3,0,4,1,'#ffffff');p(3,4,'#c0c0c0',0);p(3,7,'#c0c0c0',0);f(0,11,7,11,'#16706c')},side:'#1f8f8a',top:'#1f8f8a',bottom:'#1f8f8a'},[0,18,0]);
 const L=at(leg('#4a4f5a',null),[-2,12,0]),R=at(leg('#4a4f5a',null),[2,12,0]);
 const shoe=x=>box([4.3,2.6,4.6],{all:({f,w,h})=>{f(0,0,w-1,h-1,'#1f9f9a');f(0,h-1,w-1,h-1,'#f4f4f4')},top:'#1f9f9a',bottom:'#f4f4f4'},[x,1.3,0.3]);
 // транспортир из золотых вокселей
 const prot=new THREE.Group();const gold=['#f0c030','#e8b224','#ffd24a'];
 for(let a=0;a<=180;a+=7.5){const r=6.2,x=Math.cos(a*Math.PI/180)*r,y=Math.sin(a*Math.PI/180)*r;prot.add(box([1.5,1.5,1],{all:gold,front:(a%30===0)?'#8a5a08':gold},[x,y,0],[0,0,a-90]))}
 for(let a=0;a<=180;a+=15){const r=4.6,x=Math.cos(a*Math.PI/180)*r,y=Math.sin(a*Math.PI/180)*r;prot.add(box([.6,.9,1],{all:'#9a6a10'},[x,y,.1],[0,0,a-90]))}
 prot.add(box([14,1.3,1],{all:gold},[0,-.2,0]));prot.add(box([.7,4.6,.8],{all:'#9a6a10'},[0,2.3,.15]));
 const armR=at(arm(0,'#1f8f8a',skin,10),[-6,24,0],[-48,0,14]),armL=at(arm(0,'#1f8f8a',skin,10),[6,24,0],[-48,0,-14]);
 sw(L,1);sw(R,-1);sw(armR,-1,1);sw(armL,1,1);const sL=shoe(-2),sR=shoe(2);L.add(at(sL,[2,-12,0]));R.add(at(sR,[-2,-12,0]));return grp(head,hairTop,hairBack,...hairSides,fringe,strap,lens(-2),lens(2),body,L,R,armR,armL,at(prot,[0,14.5,8.6],[-8,0,0]))}
// ---------- Пиксель: песочный пёс с красным ошейником (сидит) ----------
export function pixel(){const fur=['#e2c07a','#d8b46a','#e8c886'],dark='#c79f55';
 const body=box([7,9,7],{all:({f,p})=>{f(0,0,6,8,fur);p(1,2,dark);p(5,5,dark)},front:({f})=>{f(0,0,6,8,fur);f(2,1,4,6,'#f0d8a0')}},[0,6.5,-0.5],[-12,0,0]);
 const haunch=x=>box([3,4,6],{all:fur},[x,2,-1]);
 const leg=x=>box([2,7,2],{all:fur,front:({f})=>{f(0,0,1,6,fur);f(0,6,1,6,'#f0e0b8')}},[x,3.5,2.6]);
 const head=box([7,6,6],{front:({f,p})=>{f(0,0,6,5,fur);f(1,2,1,2,'#ffffff',0);f(5,2,5,2,'#ffffff',0);p(1,2,'#1a1a1a',0);p(5,2,'#1a1a1a',0);p(2,2,'#ffffff',0);p(4,2,'#ffffff',0);p(2,2,'#1a1a1a',0);p(4,2,'#1a1a1a',0);p(1,2,'#ffffff',0);p(5,2,'#ffffff',0)},all:fur},[0,13.2,0.8]);
 const snout=box([3.4,2.4,2.4],{front:({f,p})=>{f(0,0,2,1,'#f0dca8');f(1,0,1,0,'#1a1a1a',0);p(1,1,'#b05a5a',0)},all:'#f0dca8',top:({f})=>{f(0,0,2,1,'#f0dca8');f(1,1,1,1,'#1a1a1a',0)}},[0,11.9,4.8]);
 const ear=x=>box([1.6,4.2,2.4],{all:dark},[x,13,0.6],[0,0,x>0?-10:10]);
 const collar=box([7.4,1.2,6.4],{all:({f,w})=>f(0,0,w-1,0,['#d42a2a','#c02020'])},[0,10.1,0.6]);
 const tag=box([1.4,1.4,.6],{all:'#ffd24a'},[0,9.1,3.9]);
 const tail=box([1.4,1.4,4],{all:fur},[2.4,3,-5.2],[30,30,0]);
 return grp(body,haunch(-2.6),haunch(2.6),leg(-1.6),leg(1.6),head,snout,ear(-4),ear(4),collar,tag,tail)}
// ---------- Криволом: тёмный рыцарь с кривой короной и посохом-зигзагом ----------
export function krivo(){const arm_=['#2b2433','#352c40','#241d2b'],cr=['#b04ce0','#c060f0','#9038c0'];
 const head=box([9,9,9],{front:({f,p})=>{f(0,0,8,8,arm_);f(1,3,7,4,'#120c16',0);f(2,3,2,4,'#ff3030',0);f(6,3,6,4,'#ff3030',0);p(1,3,'#ff8080',0);p(5,3,'#ff8080',0);f(3,6,5,6,'#5a2a6a');f(1,7,2,7,'#5a2a6a');f(6,7,7,7,'#5a2a6a')},all:arm_},[0,33,0]);
 const crown=new THREE.Group();crown.add(box([9.4,1.4,9.4],{all:['#d0a020','#e0b030']},[0,38.2,0]));
 [[-3.5,3,-14],[-1.2,4.6,9],[1.4,3.4,-20],[3.6,4.2,16],[0,2.6,30]].forEach(([x,h,a],i)=>crown.add(box([1.4,h,1.4],{all:cr},[x,38.9+h/2,i===4?-3.5:3.6],[0,0,a])));
 const body=box([10,13,5],{front:({f,p})=>{f(0,0,9,12,arm_);const z=[[1,3],[2,2],[3,3],[4,4],[5,3],[6,2],[7,3],[8,4]];z.forEach(([x,y])=>{p(x,y+2,'#e02a4a',0);p(x,y+3,'#a01a30',0)});f(0,11,9,11,'#5a2a6a')},all:arm_},[0,22.5,0]);
 const shoulder=x=>box([5,3,6],{all:['#4a3a58','#3e3050'],top:'#5a4a6a'},[x,28.5,0]);
 const cape=box([10,24,1],{all:['#6a1020','#7a1428','#5a0c1a']},[0,19,-3.2],[6,0,0]);
 const legK=x=>box([4.5,14,4.5],{all:({f,w,h})=>{f(0,0,w-1,h-1,arm_);f(0,h-3,w-1,h-1,'#120c16')},top:arm_[0],bottom:'#120c16'},[x,7,0]);
 const armK=(x,r)=>at(box([4,13,4],{all:({f,w,h})=>{f(0,0,w-1,h-1,arm_);f(0,h-3,w-1,h-1,'#4a3a58')}},[0,-6.5,0]),[x,28,0],r);
 // посох: ломаный зигзаг с кристаллом
 const staff=new THREE.Group();let y=0,x=0;[[0,8],[25,5],[-30,5],[20,5]].forEach(([a,l])=>{staff.add(box([1.3,l+.6,1.3],{all:['#3a2a1a','#4a3622']},[x,y+l/2,0],[0,0,a]));x-=Math.sin(a*Math.PI/180)*l;y+=Math.cos(a*Math.PI/180)*l});
 staff.add(box([2.6,3.4,2.6],{all:cr},[x,y+1.5,0],[0,45,20]));
 const lL=sw(at(legK(0),[-2.5,14,0]),1),lR=sw(at(legK(0),[2.5,14,0]),-1);lL.children[0].position.y=-7;lR.children[0].position.y=-7;const aR=sw(armK(-7.5,[-20,0,6]),-1,1),aL=sw(armK(7.5,[0,0,-6]),1,1);
 return grp(head,crown,body,shoulder(-7),shoulder(7),cape,lL,lR,aR,at(staff,[-7.5,10,4],[0,0,8]),aL)}
// ---------- Зомби-«тупоугольник»: руки вытянуты под тупым углом ----------
export function zombie(){const skin=['#5e9e4a','#6aac54','#548c42'];
 const head=box([8,8,8],{front:({f,p})=>{f(0,0,7,7,skin);f(1,3,2,4,'#1a1a1a',0);f(5,3,6,4,'#1a1a1a',0);f(2,6,5,6,'#2e5a24');p(3,1,'#3e7a32')},all:skin},[0,28,0]);
 const body=box([8,12,4],{front:({f,p,g})=>{f(0,0,7,11,['#2aa8a8','#249c9c','#30b4b4']);f(0,9,7,11,'#3b4fa0');p(1,7,null);
  g.fillStyle='#ffffff';g.fillRect(1,6,6,1);g.fillRect(1,5,1,1);g.fillRect(2,4,1,1);g.fillRect(3,3,1,1);g.fillStyle='#ffe060';g.fillRect(1,5,1,1)},side:'#2aa8a8',top:'#2aa8a8',bottom:'#3b4fa0'},[0,18,0]);
 const L=at(leg('#3b4fa0','#4a4a6a',2),[-2,12,0]),R=at(leg('#3b4fa0','#4a4a6a',2),[2,12,0]);
 const armZ=(x,ry)=>at(box([4,12,4],{all:({f,w,h})=>{f(0,0,w-1,3,'#2aa8a8');f(0,4,w-1,h-1,skin)}},[0,-6,0]),[x,24,0],[-80,ry,0]);
 sw(L,1);sw(R,-1);return grp(head,body,L,R,armZ(-6,8),armZ(6,-8))}
// ---------- Паук-«острые углы»: лапы согнуты острым углом ----------
export function spider(){const blk=['#2a2230','#342a3c','#221a28'];
 const body=box([10,7,11],{all:({f,p,w,h})=>{f(0,0,w-1,h-1,blk);for(let i=0;i<6;i++)p(Math.floor(rnd()*w),Math.floor(rnd()*h),'#4a3a58')}},[0,7,-4]);
 const head=box([8,7,6],{front:({f,p})=>{f(0,0,7,6,blk);[[1,2],[6,2],[2,3],[5,3]].forEach(([x,y])=>{p(x,y,'#ff2a2a',0)});p(1,1,'#ff9090',0);p(6,1,'#ff9090',0);f(2,5,2,6,'#d8d0c0',0);f(5,5,5,6,'#d8d0c0',0)},all:blk},[0,7,3.2]);
 const legs=new THREE.Group();[-1,1].forEach(sd=>[3.5,1,-2,-5].forEach((z,i)=>{const up=box([9,1.6,1.6],{all:blk},[4.5,0,0]);const lo=box([1.6,10,1.6],{all:blk},[0,-5,0]);
  const knee=at(lo,[9,0,0],[0,0,sd*0+ (-28)]);const g=grp(up,knee);g.userData.sp=i%2?1:-1;g.userData.rz=38*Math.PI/180;g.position.set(sd*4.2,8.5,z);g.rotation.set(0,sd>0?(i-1.5)*-14*Math.PI/180:Math.PI+(i-1.5)*14*Math.PI/180,38*Math.PI/180);legs.add(g)}));
 return grp(body,head,legs)}
export {THREE};
export const ALL={bloki,gran,pixel,krivo,zombie,spider};
