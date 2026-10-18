'use strict';
// ===== Кубический мир: движок (экран, ввод, звук, голос, текст) =====
const LOADQ=[];{const _I=window.Image;window.Image=function(w,h){const i=new _I(w,h);LOADQ.push(i);return i};window.Image.prototype=_I.prototype}
let LOADT0=performance.now(),FONTOK=false;
const C=document.getElementById('c'),X=C.getContext('2d');
let W=0,H=0,S=1,OX=0,OY=0,DPR=1,T=0,DT=0.016,shake=0,PX=640,PY=360,fade=1;
const SAFE={l:0,t:0,r:0,b:0};let VVX=0,VVY=0;const _sp=document.createElement('div');_sp.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.documentElement.appendChild(_sp);
function vpWH(){const v=window.visualViewport;let w=innerWidth,h=innerHeight;VVX=0;VVY=0;if(v&&v.width>0){w=Math.round(v.width);h=Math.round(v.height);VVX=v.offsetLeft||0;VVY=v.offsetTop||0}const e=document.documentElement;return[w||e.clientWidth,h||e.clientHeight]}
// весь экран = сцена (без полос); дизайн 1280x720 вписан по меньшей стороне, мир/фон рисуются на всю видимую область
function rs(){DPR=Math.min(2,window.devicePixelRatio||1);if(window.scrollX||window.scrollY)window.scrollTo(0,0);[W,H]=vpWH();C.style.left=VVX+'px';C.style.top=VVY+'px';C.style.width=W+'px';C.style.height=H+'px';C.width=Math.round(W*DPR);C.height=Math.round(H*DPR);
 const cs=getComputedStyle(_sp);SAFE.t=parseFloat(cs.paddingTop)||0;SAFE.r=parseFloat(cs.paddingRight)||0;SAFE.b=parseFloat(cs.paddingBottom)||0;SAFE.l=parseFloat(cs.paddingLeft)||0;
 S=Math.min(W/1280,H/720);OX=(W-1280*S)/2;OY=(H-720*S)/2}
const FS_OK=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);const isFS=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function goFS(){if(!FS_OK||isFS())return;const e=document.documentElement;try{const p=(e.requestFullscreen||e.webkitRequestFullscreen).call(e,{navigationUI:'hide'});const lk=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(_){}};if(p&&p.then)p.then(lk).catch(()=>{});else lk()}catch(_){}}
const TOUCHDEV=('ontouchstart' in window)||navigator.maxTouchPoints>0;
addEventListener('pointerdown',()=>{if(TOUCHDEV&&!PORTRAIT())goFS()},true);
document.addEventListener('fullscreenchange',()=>onOrient());document.addEventListener('webkitfullscreenchange',()=>onOrient());
let _lastW=-1,_lastH=-1,_wasP=null;function relayout(){rs();_lastW=W;_lastH=H;const p=PORTRAIT();if(_wasP!==p){_wasP=p;if(!p){last=performance.now();if(AC&&AC.state==='suspended')AC.resume().catch(()=>{})}}}
function onOrient(){relayout();[100,300,600].forEach(t=>setTimeout(relayout,t))}
addEventListener('resize',onOrient);addEventListener('orientationchange',onOrient);addEventListener('pageshow',onOrient);addEventListener('scroll',()=>{if(scrollX||scrollY)scrollTo(0,0)});document.addEventListener('visibilitychange',()=>{if(!document.hidden)onOrient()});
if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',onOrient);
if(window.visualViewport){visualViewport.addEventListener('resize',onOrient);visualViewport.addEventListener('scroll',onOrient)}
setInterval(()=>{const[w,h]=vpWH();if(w!==_lastW||h!==_lastH||PORTRAIT()!==_wasP)relayout()},500);rs();
const IM={};function img(n,src){const i=new Image();i.src=src;IM[n]=i;return i}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
const FONT='Kub, "Russo One", "Arial Black", sans-serif';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3),lerp=(a,b,t)=>a+(b-a)*t;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
// ---- видимая область в координатах дизайна и безопасные поля (чёлка) ----
function vis(){return{x0:-OX/S,y0:-OY/S,w:W/S,h:H/S}}
function safeV(){const v=vis();const l=SAFE.l/S,r=SAFE.r/S,t=SAFE.t/S,b=SAFE.b/S;return{x0:v.x0+l+14,y0:v.y0+t+10,x1:v.x0+v.w-r-14,y1:v.y0+v.h-b-10}}
// ---- сохранение ----
const SKEY='kubmir1';let SV;try{SV=JSON.parse(localStorage.getItem(SKEY))}catch(e){}
function freshSV(){return{z:0,mw:0,dia:0,armor:0,st:[0,0,0,0],house:0,inv:{},f:{},diff:{},tr:{},px:null}}
if(!SV||typeof SV.z!=='number')SV=freshSV();
let _svT=0;function save(now){if(!now&&performance.now()-_svT<1500){clearTimeout(save._t);save._t=setTimeout(()=>save(1),1600);return}_svT=performance.now();try{localStorage.setItem(SKEY,JSON.stringify(SV))}catch(e){}}
// ---- звук ----
var AC=null;function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type,v,when,slide){const a=ac();if(!a||G.mute)return;const t=a.currentTime+(when||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.1,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.05)}
function noise(d,v,fq,when){const a=ac();if(!a||G.mute)return;const b=a.createBuffer(1,Math.floor(a.sampleRate*d),a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;const g=a.createGain();g.gain.value=v;s.connect(f).connect(g).connect(a.destination);s.start(a.currentTime+(when||0))}
const SFX={ok(){[784,988,1175,1568].forEach((f,i)=>tone(f,.4,'square',.04,i*.07))},bad(){tone(220,.25,'square',.05,0,150);tone(180,.3,'square',.04,.12,120)},
 click(){tone(900,.04,'square',.03)},dig(){noise(.18,.5,500);tone(140,.12,'square',.05,0,90)},place(){noise(.1,.35,900);tone(320,.08,'square',.04)},
 jump(){tone(420,.12,'square',.03,0,640)},pop(){noise(.35,.5,1400);tone(500,.2,'triangle',.06,0,160)},bow(){noise(.15,.3,2400);tone(700,.1,'triangle',.04,0,300)},
 splash(){noise(.5,.4,800)},crash(){noise(.6,.7,300);tone(90,.4,'square',.06,0,40)},star(){[1046,1318,1568,2093].forEach((f,i)=>tone(f,.5,'sine',.07,i*.1))},gem(){[1568,2093,2637].forEach((f,i)=>tone(f,.35,'sine',.06,i*.06))}};
// ---- корутины и голос: всё, что начато в старой сцене/задании, тихо обрывается (STALE) ----
const G={_busy:0,fast:false,mute:false};let talk=null,skipTalk=null,EPOCH=1;
const STALE={stale:1};
function ctxNow(){return{ep:EPOCH}}
function alive(c){return c.ep===EPOCH}
function wait(ms,c){c=c||ctxNow();return new Promise((r,j)=>setTimeout(()=>alive(c)?r():j(STALE),G.fast?Math.min(ms,40):ms))}
let SAYID=0,SAYQ=Promise.resolve(),SAYEP=0;
function stopTalk(){SAYEP++;if(skipTalk)skipTalk();talk=null}
// say(k): в очередь; ввод НЕ блокируется, ребёнок играет, пока звучит голос
function say(k,c){const ep=SAYEP;c=c||ctxNow();const p=SAYQ.then(()=>ep===SAYEP&&alive(c)?say1(k):null);SAYQ=p.catch(()=>{});return p.then(v=>{if(!alive(c))throw STALE;return v})}
// sayNow: сбросить очередь и сказать сразу (подсказки после ошибки)
function sayNow(k){stopTalk();return say(k).catch(()=>{})}
async function say1(k){const l=LINES[k];if(!l)return;const id=++SAYID;talk={who:l.who,text:l.t,k,t0:T,id};
 if(G.fast){await new Promise(r=>setTimeout(r,60));if(talk&&talk.id===id)talk=null;return}
 const v=typeof VOICE!=='undefined'&&VOICE[k];const dur=Math.max(2200,l.t.length*70);
 await new Promise(async res=>{let done=false,a=null;const fin=()=>{if(!done){done=true;if(a){try{a.pause()}catch(e){}}if(skipTalk===sk)skipTalk=null;res()}};const sk=()=>fin();skipTalk=sk;setTimeout(fin,((v&&v[1])||0)*1000+dur+4000);
  if(v&&!G.mute){a=new Audio('assets/voice/'+v[0]);a.onended=()=>setTimeout(fin,300);a.onerror=()=>setTimeout(fin,dur);let okp=true;try{await a.play()}catch(e){okp=false}
   if(done)return;if(okp)setTimeout(fin,(v[1]+2.5)*1000);else setTimeout(fin,dur)}else setTimeout(fin,dur)});
 if(talk&&talk.id===id)talk=null}
async function run(fn){G._busy++;try{await fn()}catch(e){if(e!==STALE)console.error(e)}finally{G._busy--}}
// ---- частицы (кубики) ----
const PS=[];
function burst(x,y,n,col,sp,sz){sp=sp||1;for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(80,380)*sp;PS.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-200,life:1,dec:rnd(.7,1.3),col:Array.isArray(col)?pick(col):col,s:sz||rnd(8,16),g:1,rot:rnd(0,6),vr:rnd(-8,8)})}}
function sparks(x,y,n,col){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(40,260);PS.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,dec:rnd(.8,1.6),col:col||'#fff3a0',s:rnd(5,10),g:0,rot:0,vr:0,star:1})}}
function stepParticles(){for(let i=PS.length-1;i>=0;i--){const p=PS[i];p.life-=p.dec*DT;if(p.life<=0){PS.splice(i,1);continue}if(p.g)p.vy+=1100*DT;else{p.vx*=.95;p.vy*=.95}p.x+=p.vx*DT;p.y+=p.vy*DT;p.rot+=p.vr*DT}}
function drawParticles(ox,oy){for(const p of PS){X.globalAlpha=clamp(p.life*1.5,0,1);X.fillStyle=p.col;X.save();X.translate(p.x-ox,p.y-oy);X.rotate(p.rot);const s=p.s*(p.star?p.life:1);X.fillRect(-s/2,-s/2,s,s);X.restore()}X.globalAlpha=1}
// ---- нарисованные доски: 9-срез (углы рамки не растягиваются), внутренний светлый прямоугольник для текста ----
const NINE={board:{c:.26,ins:.95},tab_grey:{c:.17,ins:.85},tab_sand:{c:.17,ins:.85},tab_purple:{c:.17,ins:.85}};
function nine(n,x,y,w,h,alpha){const i=IM[n],d=NINE[n];if(!ok(i)){return[x+w*.1,y+h*.15,w*.8,h*.7]}
 const iw=i.naturalWidth,ih=i.naturalHeight,cs=Math.min(iw,ih)*d.c,cd=Math.min(cs*Math.min(w/iw,h/ih)*2.2,Math.min(w,h)*.3,cs*1.4);
 const sx=[0,cs,iw-cs,iw],sy=[0,cs,ih-cs,ih],dx=[x,x+cd,x+w-cd,x+w],dy=[y,y+cd,y+h-cd,y+h];if(alpha!=null)X.globalAlpha=alpha;
 for(let a=0;a<3;a++)for(let b=0;b<3;b++){const sw=sx[a+1]-sx[a],sh=sy[b+1]-sy[b],dw=dx[a+1]-dx[a],dh=dy[b+1]-dy[b];if(sw>0&&sh>0&&dw>0&&dh>0)X.drawImage(i,sx[a],sy[b],sw,sh,dx[a],dy[b],dw+.6,dh+.6)}
 X.globalAlpha=1;const ix=x+cd*d.ins+4,iy=y+cd*d.ins+2;return[ix,iy,w-(ix-x)*2,h-(iy-y)*2]}
// ---- текст: перенос и подбор размера так, чтобы ВСЁ влезло в нарисованный предмет ----
function wrapT(t,maxW){const ws=t.split(' '),out=[];let cur='';for(const w of ws){const s=cur?cur+' '+w:w;if(X.measureText(s).width>maxW&&cur){out.push(cur);cur=w}else cur=s}if(cur)out.push(cur);return out}
let AUD=null;
function fitText(t,box,maxSize,col,o){o=o||{};const[bx,by,bw,bh]=box;let size=maxSize,lines,lh;const minS=o.min||14;
 for(;;){X.font=size+'px '+FONT;lines=o.one?[t]:wrapT(t,bw);lh=size*1.16;const mw=Math.max(...lines.map(l=>X.measureText(l).width));if((mw<=bw&&lines.length*lh<=bh)||size<=minS)break;size=Math.max(minS,size-2)}
 X.textAlign='center';X.textBaseline='middle';const cy=by+bh/2-(lines.length-1)*lh/2;X.lineJoin='round';
 lines.forEach((l,i)=>{const y=cy+i*lh;if(o.st!==0){X.lineWidth=o.lw||Math.max(3,size*.18);X.strokeStyle=o.st||'rgba(20,12,4,.92)';X.strokeText(l,bx+bw/2,y)}X.fillStyle=col||'#fff';X.fillText(l,bx+bw/2,y)});
 if(AUD){const mw=Math.max(...lines.map(l=>X.measureText(l).width));const tb=[bx+bw/2-mw/2,cy-lh/2,bx+bw/2+mw/2,cy+(lines.length-.5)*lh];AUD.t.push({t,b:tb.map((v,i)=>i%2?OY+v*S:OX+v*S),c:[bx,by,bx+bw,by+bh].map((v,i)=>i%2?OY+v*S:OX+v*S),size:size*S})}
 return size}
// одиночная надпись (числа на транспортире и т.п.)
function txt(t,x,y,size,col,o){o=o||{};X.font=size+'px '+FONT;X.textAlign=o.al||'center';X.textBaseline='middle';if(o.st!==0){X.lineJoin='round';X.lineWidth=o.lw||Math.max(3,size*.2);X.strokeStyle=o.st||'rgba(20,12,4,.92)';X.strokeText(t,x,y)}X.fillStyle=col||'#fff';X.fillText(t,x,y)}
// ---- кнопки и касания (несколько пальцев: держать «вправо» и жать «прыжок») ----
let UI=[],PUI=[];const HOLD={};
function btn(id,x,y,w,h,fn,o){o=o||{};const b={id,x,y,w,h,fn,hold:o.hold,dis:o.dis,always:o.always};UI.push(b);return b}
function drawBtn(n,x,y,s,o){o=o||{};const i=IM[n];if(!ok(i))return;const pressed=o.on;const k=(pressed?.93:1)*(o.pulse?1+Math.sin(T*5)*.04:1);const w=s*k,h=s*k*i.naturalHeight/i.naturalWidth;
 X.save();if(o.alpha!=null)X.globalAlpha=o.alpha;if(o.glow){X.shadowColor=o.glow;X.shadowBlur=26}else{X.shadowColor='rgba(0,0,0,.45)';X.shadowBlur=10;X.shadowOffsetY=5}X.drawImage(i,x-w/2,y-h/2,w,h);X.restore();
 if(o.sel){X.save();X.strokeStyle='#ffe066';X.lineWidth=7;X.shadowColor='#ffe066';X.shadowBlur=16;X.strokeRect(x-w/2-4,y-h/2-4,w+8,h+8);X.restore()}}
function locked(){return typeof TASK!=='undefined'&&TASK&&TASK.lock}
G.locked=locked;let _lastTap={t:0,x:-99,y:-99};
function hitBtn(x,y){const mh=28/S;let best=null,bd=1e9;
 for(let i=PUI.length-1;i>=0;i--){const b=PUI[i];const dx=Math.abs(x-b.x),dy=Math.abs(y-b.y);if(dx<Math.max(b.w/2+6,mh)&&dy<Math.max(b.h/2+6,mh)){const inside=dx<b.w/2+6&&dy<b.h/2+6;const d=(inside?0:1e5)+Math.hypot(dx,dy);if(d<bd){bd=d;best=b}}}return best}
const toD=e=>[(e.clientX-VVX-OX)/S,(e.clientY-VVY-OY)/S];
C.addEventListener('pointerdown',e=>{if(PORTRAIT())return;e.preventDefault();ac();const[x,y]=toD(e);PX=x;PY=y;
 const b=hitBtn(x,y);
 if(b&&b.hold){if(b.dis)return;HOLD[e.pointerId]=b.id;if(b.fn)b.fn(true);return}
 const now=performance.now();if(now-_lastTap.t<170&&Math.hypot(e.clientX-_lastTap.x,e.clientY-_lastTap.y)<24)return;_lastTap={t:now,x:e.clientX,y:e.clientY};
 if(b){if(b.dis)return;if(locked()&&!b.always)return;SFX.click();b.fn();return}
 if(talk&&talk.box&&skipTalk&&SCN&&SCN.skipOnTalk){const[bx,by,bw,bh]=talk.box;if(x>bx&&x<bx+bw&&y>by&&y<by+bh){skipTalk();return}}
 if(locked())return;
 if(SCN&&SCN.tap)SCN.tap(x,y,e.pointerId)},{passive:false});
function upP(e){if(HOLD[e.pointerId]!=null)delete HOLD[e.pointerId];if(SCN&&SCN.up)SCN.up(e.pointerId)}
C.addEventListener('pointerup',upP);C.addEventListener('pointercancel',upP);C.addEventListener('lostpointercapture',upP);
C.addEventListener('pointermove',e=>{const[x,y]=toD(e);PX=x;PY=y;if(SCN&&SCN.move)SCN.move(x,y,e.pointerId)});
const held=id=>Object.values(HOLD).includes(id)||KEYS[id];
const KEYS={};const KMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',Space:'up'};
addEventListener('keydown',e=>{const k=KMAP[e.code];if(k){KEYS[k]=1;e.preventDefault()}});addEventListener('keyup',e=>{const k=KMAP[e.code];if(k)KEYS[k]=0});
['dblclick','contextmenu','gesturestart','gesturechange'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
// ---- сцены ----
const SC={};let scene='load',SCN=null;
function go(n,arg){EPOCH++;for(const k in HOLD)delete HOLD[k];scene=n;SCN=SC[n];fade=1;stopTalk();PS.length=0;if(typeof TASK!=='undefined')TASK=null;SCN.enter&&SCN.enter(arg)}
let last=performance.now(),fpsA=60;
const TOUCH=(('ontouchstart' in window)||navigator.maxTouchPoints>0)&&matchMedia('(pointer:coarse)').matches;const PORTRAIT=()=>TOUCH&&H>W*1.05;
let GND=[];
function loop(now){DT=PORTRAIT()?0:clamp((now-last)/1000,0,.05);last=now;T+=DT;fpsA=fpsA*.95+(1/Math.max(DT,.001))*.05;
 X.setTransform(DPR,0,0,DPR,0,0);X.clearRect(0,0,W,H);
 const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;shake*=Math.pow(.004,DT);if(shake<.3)shake=0;
 X.setTransform(DPR*S,0,0,DPR*S,DPR*(OX+sx),DPR*(OY+sy));PUI=UI;UI=[];GND=[];if(G.auditReq){G.auditReq=0;AUD={t:[],c:[],h:[]};G._aud=AUD}else AUD=null;stepParticles();
 try{SCN&&SCN.update&&!PORTRAIT()&&SCN.update(DT)}catch(e){console.error(e)}
 try{SCN&&SCN.draw()}catch(e){console.error(e)}
 try{SCN&&SCN.ui&&SCN.ui()}catch(e){console.error(e)}
 try{drawTalk()}catch(e){console.error(e)}
 if(fade>0){const v=vis();X.fillStyle=`rgba(6,6,14,${fade})`;X.fillRect(v.x0,v.y0,v.w,v.h);fade=Math.max(0,fade-DT*2.5)}
 if(PORTRAIT())drawRotate();
 requestAnimationFrame(loop)}
// ---- поверни телефон: нарисованная картинка + надпись на деревянной табличке ----
let rotT=0;function drawRotate(){rotT+=1/60;X.setTransform(DPR,0,0,DPR,0,0);const tb=IM.bg_forest;if(ok(tb)){const k=Math.max(W/tb.naturalWidth,H/tb.naturalHeight)*1.08;X.save();X.filter='blur(4px) brightness(.75)';X.drawImage(tb,W/2-tb.naturalWidth*k/2,H/2-tb.naturalHeight*k/2,tb.naturalWidth*k,tb.naturalHeight*k);X.restore()}else{X.fillStyle='#234';X.fillRect(0,0,W,H)}
 const ri=IM.rotate,bw=Math.min(W*.9,520);if(ok(ri)){const h=bw*ri.naturalHeight/ri.naturalWidth;X.save();X.translate(W/2,H*.36);X.rotate(Math.sin(rotT*1.6)*.05);X.drawImage(ri,-bw/2,-h/2,bw,h);X.restore()}
 const bh=bw*.3;const box=nine('board',W/2-bw/2,H*.66-bh/2,bw,bh);if(box){X.font='10px '+FONT;fitText('Поверни телефон',box,Math.round(bh*.36),'#fff',{one:1})}}
// ---- загрузка ----
function loadFrac(){const n=LOADQ.filter(i=>i.src).length||1,d=LOADQ.filter(i=>i.src&&i.complete).length;return Math.min(1,d/n)}
SC.load={draw(){const v=vis();X.fillStyle='#1d2a3a';X.fillRect(v.x0,v.y0,v.w,v.h);const tb=IM.bg_forest;if(ok(tb)){X.globalAlpha=.6;const s=Math.max(v.w/1600,v.h/900);X.drawImage(tb,640-800*s,360-450*s,1600*s,900*s);X.globalAlpha=1}
 const f=loadFrac();txt('Кубический мир',640,290,72,'#fff');const bw=640,bx=640-bw/2,by=380;X.fillStyle='rgba(0,0,0,.5)';X.fillRect(bx-6,by-6,bw+12,44);X.fillStyle='#6fcf3f';X.fillRect(bx,by,Math.max(8,bw*f),32);txt('Загрузка… '+Math.round(f*100)+'%',640,470,34,'#fff')}};
function startGame(){scene='load';SCN=SC.load;fade=0;requestAnimationFrame(loop);
 (document.fonts&&document.fonts.load?Promise.race([document.fonts.load('40px Kub'),new Promise(r=>setTimeout(r,6000))]):Promise.resolve()).then(()=>{FONTOK=true});
 const chk=()=>{const t=performance.now()-LOADT0;if((loadFrac()>=1&&FONTOK&&t>400)||t>25000){go('title')}else setTimeout(chk,100)};chk()}
Object.defineProperty(G,'scene',{get:()=>scene});
G.pg=(x,y)=>({x:OX+x*S,y:OY+y*S});G.btns=()=>PUI.map(b=>({id:b.id,x:b.x,y:b.y,w:b.w,h:b.h,dis:!!b.dis}));G.fps=()=>fpsA;G.gnd=()=>({S,v:vis(),scene,items:GND});
