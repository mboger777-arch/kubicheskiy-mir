// Текстуры блоков v2: 32×32 пикселя, свои у каждого блока, по 2–3 варианта (чтобы не было повторяющегося узора).
// Рисуются кодом при запуске (бесшовно), складываются в атлас 8×8 клеток по 32 пикселя.
const TX=32;
function tseed(s){let v=s|0||1;return()=>{v=(v*16807)%2147483647;return v/2147483647}}
// бесшовный шум значения (период 32)
function tn(x,y,sc,seed){const p=TX/sc;const fx=x/sc,fy=y/sc,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;const h=(a,b)=>{a=((a%p)+p)%p;b=((b%p)+p)%p;let q=(a*374761393+b*668265263+seed*982451653)|0;q=(q^(q>>>13))*1274126177|0;return((q^(q>>>16))>>>0)/4294967295};
 const s=t=>t*t*(3-2*t),u=s(tx),v=s(ty);const A=h(x0,y0),Bq=h(x0+1,y0),C=h(x0,y0+1),D=h(x0+1,y0+1);return A+(Bq-A)*u+(C-A)*v+(A-Bq-C+D)*u*v}
const cl=v=>Math.max(0,Math.min(255,Math.round(v)));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const mul=(c,k)=>c.map(v=>v*k);
// камни-ячейки (булыжник, кирпичи) — расстояние до ближайшей и второй точки (Вороной, бесшовно)
function voro(x,y,pts){let d1=1e9,d2=1e9,id=0;for(let i=0;i<pts.length;i++){for(let ox=-TX;ox<=TX;ox+=TX)for(let oy=-TX;oy<=TX;oy+=TX){const dx=x-pts[i][0]-ox,dy=y-pts[i][1]-oy,d=Math.sqrt(dx*dx+dy*dy);if(d<d1){d2=d1;d1=d;id=i}else if(d<d2)d2=d}}return[d1,d2,id]}
const PAINT={};
const def=(n,fn,vars)=>{PAINT[n]={fn,vars:vars||1}};
const GRASS=[96,170,56],DIRT=[134,96,62],STONE=[128,128,132];
def('grass_top',(x,y,R,v)=>{const n=tn(x,y,8,3+v),m=tn(x,y,4,9+v);let c=mix([70,140,40],[118,190,70],n*.7+m*.3);if(R()<.18)c=mul(c,1.12);if(R()<.08)c=mul(c,.82);
 if(v===2&&((x===9&&y===12)||(x===22&&y===24)))c=[250,220,80];return c},3);
def('grass',(x,y,R,v)=>{const edge=6+Math.round(tn(x,0,4,5+v)*4);if(y<edge){let c=mix([72,142,42],[116,186,66],tn(x,y,4,3));if(y===edge-1)c=mul(c,.78);return R()<.12?mul(c,1.1):c}
 return PAINT.dirt.fn(x,y,R,v)},2);
def('dirt',(x,y,R,v)=>{let c=mix([112,78,48],[150,108,70],tn(x,y,6,11+v));const p=tn(x,y,3,21+v);if(p>.78)c=mul(c,1.25);else if(p<.18)c=mul(c,.72);return R()<.1?mul(c,.9):c},2);
def('stone',(x,y,R,v)=>{let c=mix([108,108,112],[146,146,150],tn(x,y,8,31+v)*.6+tn(x,y,4,32+v)*.4);const k=tn(x,y,16,33+v);if(Math.abs(k-.5)<.018)c=mul(c,.68);if(Math.abs(tn(x,y,8,34+v)-.5)<.012)c=mul(c,.75);return R()<.1?mul(c,1.07):c},2);
const cobPts=v=>{const R=tseed(91+v);const a=[];for(let i=0;i<9;i++)a.push([R()*TX,R()*TX]);return a};const CP=[cobPts(0),cobPts(1)];
def('cobble',(x,y,R,v)=>{const[d1,d2,id]=voro(x+.5,y+.5,CP[v]);const e=d2-d1;const tone=.82+((id*37)%9)/30;let c=mul([128,128,130],tone);
 if(e<1.6)return mul([68,68,72],1+R()*.1);if(e<3)c=mul(c,.88);const lx=tn(x,y,4,40+v);c=mul(c,.9+lx*.2);return c},2);
const ore=(base,col,hi,seed)=>(x,y,R,v)=>{let c=PAINT.stone.fn(x,y,R,0);const n=tn(x,y,4,seed);if(n>.66){c=n>.74?col:mul(col,.72);if(n>.82)c=hi}else if(n>.62)c=mul(c,.6);return c};
def('diamond_ore',ore(0,[70,210,220],[230,255,255],51));def('gold_ore',ore(0,[230,190,50],[255,245,170],52));
def('bedrock',(x,y,R)=>{const n=tn(x,y,4,61);return mul([70,70,76],.55+n*.7)});
def('sand',(x,y,R,v)=>{let c=mix([214,196,140],[236,220,166],tn(x,y,8,71+v));if(Math.abs(((y+tn(x,y,16,72)*8)%8)-4)<.6)c=mul(c,.94);return R()<.15?mul(c,R()<.5?1.05:.94):c},2);
def('sandstone',(x,y,R)=>{let c=mix([212,190,130],[230,212,154],tn(x,y,8,81));if(y<3||y>28)c=mul(c,.9);if(y===3||y===28)c=mul(c,.82);if((y===12||y===20)&&tn(x,y,4,82)>.3)c=mul(c,.92);return R()<.1?mul(c,.95):c});
def('sandstone_ch',(x,y,R)=>{let c=PAINT.sandstone.fn(x,y,R,0);const cx=Math.abs(x-15.5),cy=Math.abs(y-15.5);if(Math.abs(cx+cy-9)<1)c=mul(c,.78);if(Math.abs(cx+cy-4)<.8)c=[230,180,70];if(y===2||y===29)c=mul(c,.75);return c});
def('planks',(x,y,R,v)=>{const b=Math.floor(y/8),seam=((b*13+v*7)%3+1)*11%TX;let c=mix([150,110,64],[184,140,86],tn(x*.3,y*2,4,90+b));c=mul(c,.92+((b*5)%3)*.05);
 if(y%8===7)return mul(c,.62);if(x===seam)return mul(c,.7);if((x===seam+2||x===seam-3)&&y%8===3)return[90,80,70];if(tn(x,y*4,8,92+b)>.7)c=mul(c,.9);return c},2);
def('log',(x,y,R)=>{let c=mix([86,60,34],[120,86,50],tn(x*3,y*.4,8,101));if(tn(x*2,y*.3,4,102)>.68)c=mul(c,.72);if(x%7===0)c=mul(c,.85);return c});
def('log_top',(x,y,R)=>{const d=Math.hypot(x-15.5,y-15.5);if(d>14.5)return PAINT.log.fn(x,y,R);let c=mix([170,130,78],[200,160,100],tn(x,y,8,111));if(Math.floor(d+tn(x,y,8,112)*1.5)%3===0)c=mul(c,.84);return c});
def('leaves',(x,y,R,v)=>{const n=tn(x,y,4,121+v),m=tn(x,y,2,123+v);if(m<.2)return null;let c=mix([40,112,36],[86,166,60],n);if(m>.8)c=mul(c,1.15);if(m<.32)c=mul(c,.72);return c},2);
const brickTile=(col,mort,bh,bw,var_)=>(x,y,R,v)=>{const row=Math.floor(y/bh),off=(row%2)*(bw/2);const xx=(x+off)%bw;if(y%bh===bh-1||xx===bw-1)return mul(mort,1+R()*.06);
 const id=row*7+Math.floor((x+off)/bw);let c=mul(col,.86+((id*29+v*11)%7)/26);c=mul(c,.92+tn(x,y,4,130+v)*.16);if(y%bh===0||xx===0)c=mul(c,1.1);if(y%bh===bh-2||xx===bw-2)c=mul(c,.9);return c};
def('castle',brickTile([132,132,136],[78,78,84],8,16),2);
def('castle_moss',(x,y,R,v)=>{let c=PAINT.castle.fn(x,y,R,1);if(tn(x,y,8,141)>.58&&c[0]>90)c=mix(c,[80,120,60],.6);return c});
def('brick',brickTile([168,72,56],[200,190,176],8,16));
def('iron',(x,y,R)=>{const bar=x%8<3;let c=bar?mix([150,150,160],[200,200,210],x%8/3):[46,46,52];if(y%16<2)c=[120,120,130];if(bar&&x%8===0)c=mul(c,.8);if(bar&&y%16===3&&x%8===1)c=[230,230,240];return c});
def('crystal',(x,y,R)=>{const e=x===0||y===0||x===31||y===31;if(e)return[26,106,128];const f=Math.floor((x+y)/8)%2,g=Math.floor((x-y+32)/9)%2;let c=f^g?[90,214,234]:[70,190,216];if((x+y)%11===0||(x-y+64)%13===0)c=[210,255,255];return c});
def('cactus',(x,y,R)=>{let c=x%8===0?[30,110,40]:mix([50,140,52],[76,166,70],tn(x,y,4,151));if(x%8===4&&y%6===2)c=[236,226,160];return c});
def('cactus_top',(x,y,R)=>{const d=Math.max(Math.abs(x-15.5),Math.abs(y-15.5));return d>13?[40,120,44]:mix([70,160,70],[96,182,86],tn(x,y,4,161))});
// декор (вырезанные по альфе): трава, цветы, факел, стекло, флаг
def('tallgrass',(x,y,R)=>{for(let k=0;k<7;k++){const bx=3+k*4+Math.round(tn(k*5,0,8,171)*3),top=3+((k*11)%10);const lean=(31-y)*(((k%3)-1)*.12);if(Math.abs(x-bx-lean)<1&&y>=top)return mix([60,140,40],[120,196,72],(31-y)/26*.6+tn(x,y,4,172)*.4)}return null});
const flower=(pet,ctr)=>(x,y,R)=>{if(Math.abs(x-15.5)<1&&y>=14)return[54,130,40];if((x===13||x===18)&&(y===22||y===21))return[70,150,50];const d=Math.hypot(x-15.5,y-9.5);if(d<2)return ctr;if(d<7&&(Math.abs(Math.atan2(y-9.5,x-15.5)*5/Math.PI)%2)<1.45)return mul(pet,1.05-d/16);return null};
def('flower_red',flower([230,60,60],[255,220,80]));def('flower_yel',flower([250,210,50],[200,120,30]));def('flower_blu',flower([90,140,240],[255,250,200]));
def('torch',(x,y,R)=>{if(x>=14&&x<=17&&y>=12)return x===14?[90,60,30]:[130,92,48];if(x>=13&&x<=18&&y>=6&&y<12){const d=Math.hypot(x-15.5,y-9);return d<1.6?[255,255,220]:d<2.6?[255,210,90]:[240,130,40]}return null});
def('glass',(x,y,R)=>{if(x<2||y<2||x>29||y>29||x===15||x===16||y===15||y===16)return mix([90,62,34],[120,86,50],tn(x,y,4,181));if((x-y===6&&x<12)||(x-y===7&&x<12))return[230,250,255];return null});
def('banner',(x,y,R)=>{let c=mix([170,30,40],[200,44,52],tn(x,y,4,191));const yy=31-y;if(yy>4&&yy<22&&Math.abs(x-15.5)<(yy-4)*.55&&Math.abs(x-15.5)>(yy-4)*.55-2.2)c=[240,200,60];if(yy>4&&yy<6&&Math.abs(x-15.5)<9)c=[240,200,60];if(x<2||x>29)c=mul(c,.75);return c});
def('rail',(x,y,R)=>{if(y===7||y===8||y===23||y===24)return y%2?[150,150,160]:[205,205,215];if(x%8<3&&y>3&&y<28)return x%8===0?[90,62,36]:[124,88,52];return null});
// ---- сборка атласа ----
function buildAtlas32(){const c=document.createElement('canvas');c.width=TX*8;c.height=TX*8;const g=c.getContext('2d');const img=g.createImageData(TX*8,TX*8);const IDX={},VARN={};let slot=0;
 for(const n in PAINT){const P=PAINT[n];VARN[n]=P.vars;for(let v=0;v<P.vars;v++){const sx=(slot%8)*TX,sy=Math.floor(slot/8)*TX;const R=tseed(1000+slot*31);
  for(let y=0;y<TX;y++)for(let x=0;x<TX;x++){const col=P.fn(x,y,R,v);const i=((sy+y)*TX*8+sx+x)*4;if(!col){img.data[i+3]=0;continue}img.data[i]=cl(col[0]);img.data[i+1]=cl(col[1]);img.data[i+2]=cl(col[2]);img.data[i+3]=255}
  IDX[n+'#'+v]=slot;if(v===0)IDX[n]=slot;slot++}}
 g.putImageData(img,0,0);return{c,IDX,VARN,slots:slot}}
// вода: отдельная бесшовная текстура, сдвигается во времени (течение), рябь и блики
function waterCanvas(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const img=g.createImageData(64,64);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=tn(x/2,y/2,4,201)*.5+tn(x/2,y/2,8,202)*.5;let col=mix([30,96,190],[70,150,230],n);const w=Math.sin((x+y*.5)*.4+n*5);if(w>.92)col=[200,232,255];const i=(y*64+x)*4;img.data[i]=cl(col[0]);img.data[i+1]=cl(col[1]);img.data[i+2]=cl(col[2]);img.data[i+3]=255}
 g.putImageData(img,0,0);return c}
def('water',(x,y,R)=>mix([36,104,200],[70,150,230],tn(x,y,8,211)));
def('gold_block',(x,y,R)=>{let c=mix([236,186,40],[255,222,90],tn(x,y,8,221));if(x<2||y<2)c=[255,240,160];if(x>29||y>29)c=[176,120,20];if((x+y)%13===0&&x>3&&y>3)c=[255,250,200];return c});
