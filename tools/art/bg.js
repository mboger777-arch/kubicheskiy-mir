// Воксельные фоны зон (рендер three.js): блоки с нарисованными текстурами, туман для глубины.
import * as THREE from './vendor/three.module.js';
let S=7;const rnd=()=>{S=(S*16807)%2147483647;return S/2147483647};
const L=new THREE.TextureLoader();const TX={};
const names=['grass','dirt','cobble','stone','diamond_ore','gold_ore','bedrock','sand','sandstone','planks','log','leaves','castle','brick','water','iron'];
export async function loadTex(){await Promise.all(names.map(n=>new Promise(r=>L.load('../../assets/tiles/'+n+'.png',t=>{t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;TX[n]=t;r()}))));
 const cv=document.createElement('canvas');cv.width=cv.height=16;const g=cv.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=[95,174,58].map(c=>c+(rnd()*24-12));g.fillStyle=`rgb(${v})`;g.fillRect(x,y,1,1)}
 const t=new THREE.CanvasTexture(cv);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;TX.grass_top=t}
class World{constructor(){this.b={}}add(t,x,y,z){(this.b[t]=this.b[t]||[]).push([x,y,z])}
 col(t,x,y0,y1,z,top){for(let y=y0;y<=y1;y++)this.add(y===y1&&top?top:t,x,y,z)}
 build(sc,em){const geo=new THREE.BoxGeometry(1,1,1);for(const t in this.b){const a=this.b[t];let mat;
  if(t==='grass'){mat=['grass','grass','grass_top','dirt','grass','grass'].map(n=>new THREE.MeshLambertMaterial({map:TX[n]}))}
  else if(t.startsWith('#'))mat=new THREE.MeshLambertMaterial({color:t,emissive:em&&em[t]?t:0x000000,emissiveIntensity:em&&em[t]?em[t]:0});
  else mat=new THREE.MeshLambertMaterial({map:TX[t],transparent:t==='water',opacity:t==='water'?.92:1});
  const m=new THREE.InstancedMesh(geo,mat,a.length);const o=new THREE.Object3D();a.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();m.setMatrixAt(i,o.matrix)});sc.add(m)}}}
const hills=(w,z,x0,x1,base,amp,fq,ph,top='grass',fill='dirt',deep=-40,D=8)=>{for(let x=x0;x<=x1;x++)for(let k=0;k<D;k++){const h=Math.round(base+amp*(Math.sin(x*fq+ph+k*.13)*.6+Math.sin(x*fq*2.3+ph*1.7)*.4));if(k===0)w.col(fill,x,deep,h,z,top);else{w.add(top,x,h,z-k);w.add(fill,x,h-1,z-k)}}};
const tree=(w,x,y,z,h=4)=>{for(let i=1;i<=h;i++)w.add('log',x,y+i,z);for(let dx=-2;dx<=2;dx++)for(let dz=-1;dz<=1;dz++)for(let dy=0;dy<2;dy++)if(Math.abs(dx)+Math.abs(dz)<4&&rnd()>.08)w.add('leaves',x+dx,y+h-1+dy,z+dz);w.add('leaves',x,y+h+1,z);w.add('leaves',x-1,y+h+1,z);w.add('leaves',x+1,y+h+1,z)};
const hAt=(base,amp,fq,ph,x)=>Math.round(base+amp*(Math.sin(x*fq+ph)*.6+Math.sin(x*fq*2.3+ph*1.7)*.4));
const cloud=(w,x,y,z)=>{const n=4+Math.floor(rnd()*5);for(let i=0;i<n;i++)for(let j=0;j<2;j++)w.add('#ffffff',x+i,y+(j&&i>0&&i<n-1?1:0)*j,z)};
const house=(w,x,y,z,wd=6,ht=4,roof='brick')=>{for(let i=0;i<wd;i++)for(let j=1;j<=ht;j++){const c=i===0||i===wd-1;const win=!c&&j===2&&(i===1||i===wd-2);const door=!c&&j<=2&&i===Math.floor(wd/2);w.add(c?'log':win?'#9fd8ff':door?'#5a3a1e':'planks',x+i,y+j,z)}
 for(let k=0;k<=Math.ceil(wd/2);k++)for(let i=k-1;i<=wd-k;i++)w.add(roof,x+i,y+ht+1+k,z+.01*k)};
export const ZONES={
forest(sc,w){sky(sc,'#6ab8f5','#d7f0ff');sc.fog=new THREE.Fog('#cfeaff',100,310);
 hills(w,-150,-110,110,10,7,.05,1,'grass','dirt',-10);hills(w,-95,-90,90,4,5,.08,2);hills(w,-50,-60,60,0,3,.12,0.5);hills(w,-30,-50,50,-4,1,.2,0,'grass','dirt',-40);
 for(let x=-56;x<56;x+=5+Math.floor(rnd()*6)){tree(w,x,hAt(0,3,.12,.5,x),-50,4+Math.floor(rnd()*2))}
 for(let x=-85;x<85;x+=6+Math.floor(rnd()*8))tree(w,x,hAt(4,5,.08,2,x),-95,4);
 for(let i=0;i<9;i++)cloud(w,-80+i*20+rnd()*8,26+rnd()*10,-120);sun(w,52,34,-160,'#fff3a0')},
mine(sc,w){sky(sc,'#16141c','#2a2632');sc.fog=new THREE.Fog('#1c1a22',70,240);
 for(let x=-60;x<=60;x++)for(let y=-12;y<=40;y++){const hole=Math.sin(x*.21)+Math.cos(y*.33+x*.07)>1.2;if(hole){w.add(rnd()<.06?'diamond_ore':'stone',x,y,-60);continue}
  const r=rnd();w.add(r<.025?'diamond_ore':r<.05?'gold_ore':r<.3?'cobble':'stone',x,y,-28)}
 for(let x=-60;x<=60;x++)w.add('stone',x,-3,-27);
 for(let x=-48;x<=48;x+=16){for(let y=-2;y<=6;y++){w.add('log',x,y,-26);w.add('log',x+6,y,-26)}for(let i=-1;i<=7;i++)w.add('planks',x+i,7,-26);w.add('#ffd060',x+3,6,-25.6)}
 for(let x=-60;x<=60;x++){w.add('#6a5a4a',x,-2.45,-24.5)}},
river(sc,w){sky(sc,'#5aa8f0','#d0ecff');sc.fog=new THREE.Fog('#cde9ff',100,340);
 for(let x=-130;x<=130;x++){const h=hAt(22,12,.045,3,x);const z=-190;w.col('stone',x,0,h,z,h>28?'#f4f8ff':'stone')}
 hills(w,-110,-100,100,6,6,.07,1.3);
 for(let z=-100;z<=-14;z+=1)for(let x=-100;x<=100;x++){const rc=Math.sin(z*.05)*10;if(Math.abs(x-rc)<7+(-z)*.03)w.add('water',x,-.5,z);else{const h=hAt(0,1.5,.1,z,x);w.add('grass',x,h-.5,z);if(z>-40)w.add('dirt',x,h-1.5,z)}}
 for(let i=0;i<8;i++)cloud(w,-90+i*24+rnd()*8,30+rnd()*10,-150);
 for(let x=-70;x<70;x+=7+Math.floor(rnd()*7))if(Math.abs(x-Math.sin(-40*.05)*10)>12)tree(w,x,hAt(0,2,.1,-40,x)-.5,-40,4)},
village(sc,w){sky(sc,'#78c0f5','#e2f4ff');sc.fog=new THREE.Fog('#dcf0ff',100,310);
 hills(w,-140,-110,110,8,6,.06,4);hills(w,-60,-70,70,0,1,.1,0);hills(w,-34,-50,50,-5,1,.2,0,'grass','dirt',-40);
 [-44,-26,-8,12,30].forEach((x,i)=>house(w,x,hAt(0,1,.1,0,x),-58,6+(i%2)*2,4+(i%3===0?1:0),i%2?'brick':'cobble'));
 for(let x=-60;x<60;x++)if(rnd()<.5&&Math.abs(x)%18>8)w.add('#c8a040',x,hAt(0,1,.1,0,x)+1,-52);
 for(let x=-60;x<60;x+=2)w.add('planks',x,hAt(0,1,.1,0,x)+1,-46);
 for(let x=-70;x<70;x+=13)tree(w,x+3,hAt(8,6,.06,4,x),-140,5);for(let i=0;i<7;i++)cloud(w,-80+i*25,30+rnd()*8,-130);sun(w,-50,36,-170,'#fff3a0')},
desert(sc,w){sky(sc,'#f5a85a','#ffe8b8');sc.fog=new THREE.Fog('#ffe2b0',100,340);
 hills(w,-170,-140,140,6,4,.04,1,'sand','sand',-10);
 const pyr=(cx,z,n)=>{for(let k=0;k<n;k++)for(let x=cx-n+k;x<=cx+n-k;x++)w.add(k%4===3?'sandstone':'sand',x,k,z)};pyr(-30,-150,16);pyr(10,-160,22);pyr(52,-140,12);
 hills(w,-70,-80,80,1,2,.09,2,'sand','sand');hills(w,-36,-50,50,-4,1,.2,0,'sand','sand',-40);
 for(let x=-60;x<60;x+=9+Math.floor(rnd()*9)){const h=hAt(1,2,.09,2,x);for(let i=1;i<=3+Math.floor(rnd()*2);i++)w.add('leaves',x,h+i,-66);w.add('leaves',x-1,h+3,-66);w.add('leaves',x+1,h+2,-66)}
 sun(w,46,30,-200,'#fff0c0')},
castle(sc,w){sky(sc,'#221a48','#b05a8a');sc.fog=new THREE.Fog('#5a3a6a',100,340);
 for(let i=0;i<120;i++)w.add('#ffffff',-130+rnd()*260,22+rnd()*40,-200);sun(w,-48,40,-190,'#f4f0d8');
 hills(w,-120,-110,110,3,3,.06,1,'stone','stone');
 const tower=(x,z,wd,h)=>{for(let i=0;i<wd;i++)for(let y=0;y<=h;y++)w.add('castle',x+i,y,z);for(let i=0;i<wd;i+=2)w.add('castle',x+i,h+1,z);w.add('#ffb040',x+Math.floor(wd/2),h-3,z+.6)};
 for(let x=-30;x<=30;x++)for(let y=0;y<=12;y++){const gate=Math.abs(x)<3&&y<7;if(!gate)w.add('castle',x,y,-100)}for(let x=-30;x<=30;x+=2)w.add('castle',x,13,-100);
 [-38,-12,8,32].forEach((x,i)=>tower(x,-99,6,i%3?24:18));tower(-4,-101,8,32);
 [-6,6].forEach(x=>w.add('#ff9a30',x,9,-99));hills(w,-60,-70,70,-1,2,.1,0,'stone','stone');hills(w,-34,-50,50,-5,1,.2,0,'stone','stone',-40)}};
const EM={'#ffd060':1.2,'#ffb040':1.4,'#ff9a30':1.4,'#fff3a0':1,'#fff0c0':1,'#f4f0d8':.9,'#ffffff':.5,'#9fd8ff':.3};
function sky(sc,top,bot){const cv=document.createElement('canvas');cv.width=2;cv.height=256;const g=cv.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,2,256);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;sc.background=t}
function sun(w,x,y,z,c){for(let i=0;i<5;i++)for(let j=0;j<5;j++)w.add(c,x+i,y+j,z)}
export function renderBg(R,zone,W,H){S=11+zone.length*7;const sc=new THREE.Scene();const w=new World();ZONES[zone](sc,w);w.build(sc,EM);
 const dark=zone==='mine'||zone==='castle';sc.add(new THREE.HemisphereLight(0xffffff,0x667788,dark?1.1:2.0));const d=new THREE.DirectionalLight(zone==='desert'?0xffe0b0:0xffffff,dark?1.2:2.4);d.position.set(-40,80,60);sc.add(d);
 const cam=new THREE.PerspectiveCamera(50,W/H,.5,600);cam.position.set(0,zone==='mine'?6:16,zone==='mine'?8:10);cam.lookAt(0,zone==='mine'?8:9,-60);R.setSize(W,H);R.render(sc,cam);return R.domElement.toDataURL('image/jpeg',.9)}
