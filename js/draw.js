'use strict';
// ===== Нарисованные персонажи и предметы + точная геометрия углов поверх картинок =====
['bloki','gran','pixel','krivo','zombie','spider'].forEach(n=>img(n,'assets/sprites/'+n+'.png'));
['b_left','b_right','b_up','b_dig','b_place','b_bow','b_home','b_ok','chest','chest_open','diamond','heart','armor','torch','arrow','cart','star','board','tab_grey','tab_sand','tab_purple','protractor','anvil','stick','iron','beam','sword','rotate'].forEach(n=>img(n,'assets/ui/'+n+'.png'));
const HGT={bloki:1.95,gran:1.95,pixel:1.12,krivo:2.45,zombie:1.95,spider:1.2};// рост в блоках
// спрайт: ступни в (x,y), единый масштаб (никогда не растягиваем), без зеркала — герои смотрят на ребёнка
function drawSpr(n,x,y,h,o){o=o||{};const i=IM[n];if(!ok(i))return null;const w=h*i.naturalWidth/i.naturalHeight;
 X.save();X.translate(x,y);if(o.rot)X.rotate(o.rot);const k=o.k||1;if(k!==1)X.scale(k,k);if(o.alpha!=null)X.globalAlpha=o.alpha;
 if(o.shadow!==0){X.save();X.globalAlpha=(o.alpha!=null?o.alpha:1)*.28;X.fillStyle='#000';X.beginPath();X.ellipse(0,0,w*.42,h*.035+4,0,0,6.283);X.fill();X.restore()}
 if(o.flash){X.filter='brightness(1.8)'}X.drawImage(i,-w/2,-h,w,h);X.restore();
 if(o.gnd!=null&&o.gnd!==false)GND.push({n,x,feet:y,w,h:h,nr:i.naturalWidth/i.naturalHeight,gls:[o.gnd===true?y:o.gnd],k:o.k||1});
 if(AUD&&o.hero)AUD.h.push({n,b:[OX+(x-w/2)*S,OY+(y-h)*S,OX+(x+w/2)*S,OY+y*S]});
 return[x-w/2,y-h,w,h]}
function drawImg(n,cx,cy,w,o){o=o||{};const i=IM[n];if(!ok(i))return;const h=w*i.naturalHeight/i.naturalWidth;X.save();X.translate(cx,cy);if(o.rot)X.rotate(o.rot);if(o.alpha!=null)X.globalAlpha=o.alpha;if(o.glow){X.shadowColor=o.glow;X.shadowBlur=24}X.drawImage(i,-w/2,-h/2,w,h);X.restore();return h}
// длинный предмет (балка, ручка, брусок) между двумя точками: картинка повторяется по длине, толщина постоянная — без растяжения
function rod(n,x1,y1,x2,y2,th){const i=IM[n];const L=Math.hypot(x2-x1,y2-y1);X.save();X.translate(x1,y1);X.rotate(Math.atan2(y2-y1,x2-x1));
 if(ok(i)){const k=th/i.naturalHeight,seg=i.naturalWidth*k;let d=0;while(d<L-.5){const len=Math.min(seg,L-d);X.drawImage(i,0,0,len/k,i.naturalHeight,d-.5,-th/2,len+1,th);d+=len}}else{X.fillStyle='#8a5a2a';X.fillRect(0,-th/2,L,th)}X.restore()}
const PAT={};function pat(n){if(PAT[n])return PAT[n];const i=IM['t_'+n];if(!ok(i))return '#999';const c=document.createElement('canvas');c.width=c.height=64;c.getContext('2d').drawImage(i,0,0,64,64);return PAT[n]=X.createPattern(c,'repeat')}
const R2D=Math.PI/180;
// транспортир: нарисованный золотой полукруг + точные деления и числа кодом
function protractor(cx,cy,R,o){o=o||{};const i=IM.protractor;if(ok(i)){const w=R*2.04,h=w*i.naturalHeight/i.naturalWidth;X.save();X.globalAlpha=o.alpha!=null?o.alpha:.92;X.drawImage(i,cx-w/2,cy-h+R*.04,w,h);X.restore()}
 X.save();X.strokeStyle='rgba(60,30,0,.9)';for(let a=0;a<=180;a+=10){const big=a%30===0;const r1=R*.97,r0=R*(big?.8:.88);X.lineWidth=big?4:2.5;X.beginPath();X.moveTo(cx+Math.cos(-a*R2D)*r0,cy+Math.sin(-a*R2D)*r0);X.lineTo(cx+Math.cos(-a*R2D)*r1,cy+Math.sin(-a*R2D)*r1);X.stroke()}X.restore();
 if(o.nums!==false)for(let a=0;a<=180;a+=30){const r=R*1.13;txt(String(a),cx+Math.cos(-a*R2D)*r,cy+Math.sin(-a*R2D)*r-4,Math.max(20,R*.13),'#fff6c8',{lw:5})}}
// угол: две стороны-луча, дуга; a0,a1 в градусах (против часовой, 0 = вправо)
function angleRays(cx,cy,L,a0,a1,o){o=o||{};const th=o.th||18;const draw=a=>{const x=cx+Math.cos(-a*R2D)*L,y=cy+Math.sin(-a*R2D)*L;
  if(o.tex){X.save();X.lineCap='round';X.strokeStyle='rgba(0,0,0,.55)';X.lineWidth=th+8;X.beginPath();X.moveTo(cx,cy);X.lineTo(x,y);X.stroke();X.strokeStyle=pat(o.tex);X.lineWidth=th;X.beginPath();X.moveTo(cx,cy);X.lineTo(x,y);X.stroke();X.restore()}
  else rod(o.rod||'iron',cx,cy,x,y,th)};
 draw(a0);draw(a1);
 if(o.arc!==false){const r=o.ar||L*.32;X.save();X.fillStyle=o.fill||'rgba(255,214,64,.55)';X.strokeStyle=o.col||'#ffd640';X.lineWidth=6;X.beginPath();X.moveTo(cx,cy);X.arc(cx,cy,r,-a1*R2D,-a0*R2D);X.closePath();X.fill();X.beginPath();X.arc(cx,cy,r,-a1*R2D,-a0*R2D);X.stroke();
  if(Math.abs(Math.abs(a1-a0)-90)<.5){X.fillStyle='#fff';const m=(a0+45)*R2D,q=r*.42;X.strokeStyle='#fff';X.lineWidth=5;X.beginPath();X.moveTo(cx+Math.cos(-a0*R2D)*q,cy+Math.sin(-a0*R2D)*q);X.lineTo(cx+Math.cos(-m)*q*1.41,cy+Math.sin(-m)*q*1.41);X.lineTo(cx+Math.cos(-a1*R2D)*q,cy+Math.sin(-a1*R2D)*q);X.stroke()}X.restore()}
 X.fillStyle='#3a2a10';X.beginPath();X.arc(cx,cy,th*.45,0,6.283);X.fill()}
// фигура из балок (мост)
function frame(pts,edges,th){for(const[a,b]of edges)rod('beam',pts[a][0],pts[a][1],pts[b][0],pts[b][1],th);X.fillStyle='#4a4a52';for(const p of pts){X.fillRect(p[0]-th*.55,p[1]-th*.55,th*1.1,th*1.1)}}
// треугольник с текстурой блока
function triFill(pts,tex,o){o=o||{};X.save();X.beginPath();X.moveTo(...pts[0]);X.lineTo(...pts[1]);X.lineTo(...pts[2]);X.closePath();X.fillStyle=pat(tex);X.fill();X.lineJoin='round';X.lineWidth=o.lw||10;X.strokeStyle=o.st||'#2a1a0a';X.stroke();X.restore()}
function arcAt(p,q,r,rad,col,lbl,fs){// угол при вершине p между направлениями на q и r
 const a1=Math.atan2(q[1]-p[1],q[0]-p[0]),a2=Math.atan2(r[1]-p[1],r[0]-p[0]);let s=a1,e=a2;let d=e-s;while(d<-Math.PI)d+=2*Math.PI;while(d>Math.PI)d-=2*Math.PI;
 X.save();X.fillStyle=col;X.globalAlpha=.75;X.beginPath();X.moveTo(...p);X.arc(p[0],p[1],rad,s,s+d,d<0);X.closePath();X.fill();X.restore();
 if(lbl!=null){const m=s+d/2;const lx=p[0]+Math.cos(m)*(rad+fs*.95),ly=p[1]+Math.sin(m)*(rad+fs*.8);txt(lbl,lx,ly,fs,'#fff',{lw:fs*.22})}}
function ticks(a,b,n){const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI/2;X.save();X.strokeStyle='#ffe066';X.lineWidth=6;for(let k=0;k<n;k++){const o=(k-(n-1)/2)*12;const cx=mx+Math.cos(ang-Math.PI/2)*o,cy=my+Math.sin(ang-Math.PI/2)*o;X.beginPath();X.moveTo(cx+Math.cos(ang)*16,cy+Math.sin(ang)*16);X.lineTo(cx-Math.cos(ang)*16,cy-Math.sin(ang)*16);X.stroke()}X.restore()}
// табличка-кнопка с надписью (нарисованная каменная плита, 9-срез)
function tabBtn(id,cx,cy,w,h,label,fn,o){o=o||{};const pr=o.sel?1.05:1;const n=o.tab||'tab_grey';X.save();if(o.glow){X.shadowColor=o.glow;X.shadowBlur=24}else{X.shadowColor='rgba(0,0,0,.45)';X.shadowBlur=10;X.shadowOffsetY=5}
 const wob=o.wob?Math.sin((T-o.wob)*40)*Math.max(0,1-(T-o.wob)*2.5)*10:0;
 const box=nine(n,cx-w*pr/2+wob,cy-h*pr/2,w*pr,h*pr);X.restore();if(o.draw)o.draw(box);
 if(label!=null&&box)fitText(label,box,o.fs||46,o.col||'#fff',{one:o.one,min:16});btn(id,cx,cy,w,h,fn,{dis:o.dis});return box}
