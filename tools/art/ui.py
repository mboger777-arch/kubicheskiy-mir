# Пиксельные кнопки, предметы, таблички и подсказка «поверни телефон» в стиле майнкрафта → assets/ui
import random,math
from PIL import Image,ImageDraw
OUT='/workspace/kub-game/assets/ui/'
def C(h):h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))+(255,)
R=random.Random(5)
def jit(c,a=8):return tuple(max(0,min(255,int(v+R.uniform(-a,a)))) for v in c[:3])+(c[3],)
PAL={'k':'#1a1414','w':'#ffffff','g':'#d8d8d8','G':'#8a8a8a','d':'#5a5a5a','b':'#7a5230','B':'#5a3a1e','n':'#a07040','s':'#c4c4cc','S':'#8a8a94',
 'c':'#5ff0f0','C':'#1fa0b0','x':'#c8ffff','r':'#e03030','R':'#a01818','p':'#ff9090','y':'#ffd84a','Y':'#c89a10','o':'#ff9a2a','O':'#e06010',
 'l':'#6cbf43','L':'#3f8f2e','e':'#8a5a34','E':'#6b4325','m':'#2fb84a','M':'#1a7a2a','t':'#f0f0f0','u':'#3a7ae0','U':'#2a52a8','v':'#a0a0a8','h':'#d4a050'}
def icon(rows,scale,a=6):
  h=len(rows);w=max(len(r) for r in rows);im=Image.new('RGBA',(w,h),(0,0,0,0));px=im.load()
  for y,r in enumerate(rows):
    for x,ch in enumerate(r):
      if ch in PAL:px[x,y]=jit(C(PAL[ch]),a)
  return im.resize((w*scale,h*scale),Image.NEAREST)
ARROW=['................','.......k........','......kwk.......','.....kwwk.......','....kwwwkkkkkkk.','...kwwwwwwwwwwk.','..kwwwwwwwwwwwk.','.kwwwwwwwwwwwwk.','..kwwwwwwwwwwwk.','...kwwwwwwwwwwk.','....kwwwkkkkkkk.','.....kwwk.......','......kwk.......','.......k........','................','................']
ARROW=['..............','......k.......','.....kwk......','....kwwk......','...kwwwkkkkkk.','..kwwwwwwwwwwk','.kwwwwwwwwwwwk','kwwwwwwwwwwwwk','.kwwwwwwwwwwwk','..kwwwwwwwwwwk','...kwwwkkkkkk.','....kwwk......','.....kwk......','......k.......']
PICK=['................','....kkkkkkk.....','...kssssssskk...','..kssvvvvvsssk..','..kkkk.kkbkssk..','.......kbBk.ssk.','......kbBk..ksk.','.....kbBk....kk.','....kbBk........','...kbBk.........','..kbBk..........','.kbBk...........','kbBk............','kBk.............','.k..............','................']
GRASSB=['................','.......kk.......','.....kklLkk.....','...kklllllLkk...','.kklllLllllllkk.','kLlllllllLlllllk','kkllllllllllLkkk','kEkklllllLlkkeek','kEEekklLlkkeeeek','kEeEeekkkeeeeeek','kEEeEeekeeeeeEek','kEeEEeekeeeEeeek','.kkEeEekeeeeekk.','...kkEekeEekk...','.....kkkkkk.....','................']
BOW=['................','.........kkkk...','........kbbBk...','.......kbk.gk...','......kbk..gk...','.....kbk...gk...','....kbk....gk...','...kbk.....gk...','..kbBk.....gk...','..kbk......gk...','..kbBk....gk....','...kbBkkkgk.....','....kkbbbBk.....','.......kkk......','................','................']
BOW=['..............kk','...........kkbBk','.........kkbBk.k','........kbBk..gk','.......kbk...g.k','......kbk...g..k','.....kbk...g...k','....kbk...g....k','....kBk..g.....k','...kbk..g......k','...kBk.g.......k','..kbk.g.......k.','..kBkg.......k..','.kbkg.......k...','.kBgkkkkkkkk....','..kk............']
HOUSE=['................','.......kk.......','......kRRk......','.....kRrrRk.....','....kRrrrrRk....','...kRrrrrrrRk...','..kRrrrrrrrrRk..','.kkkkkkkkkkkkkk.','..knnnnnnnnnnk..','..knkkknnkkknk..','..knkukn bkknk..','..knkkknBbbknk..','..knnnnnBbbnnk..','..knnnnnBbbnnk..','..kkkkkkkkkkkk..','................']
HOUSE=[r.replace(' ','n') for r in HOUSE]
CHECK=['................','..............k.','.............kmk','............kmMk','...........kmMk.','..........kmMk..','.k.......kmMk...','kmk.....kmMk....','kMmk...kmMk.....','.kMmk.kmMk......','..kMmkmMk.......','...kMmMk........','....kMk.........','.....k..........','................','................']
CHEST=['................','.kkkkkkkkkkkkkk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.knnnnnnnnnnnnk.','.kkkkkkyykkkkkk.','.knnnnnyYnnnnnk.','.knbbbbkkbbbbnk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.knnnnnnnnnnnnk.','.kkkkkkkkkkkkkk.','................','................']
CHESTO=['.kkkkkkkkkkkkkk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.kkkkkkkkkkkkkk.','..kyyyccyyxyyk..','..kyxycyycyyyk..','.kkkkkkkkkkkkkk.','.knnnnnyYnnnnnk.','.knbbbbkkbbbbnk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.knnnnnnnnnnnnk.','.knbbbbbbbbbbnk.','.knnnnnnnnnnnnk.','.kkkkkkkkkkkkkk.','................']
DIA=['................','.....kkkkkk.....','....kxxccccck...','...kxxcccccCCk..','..kxccccccccCCk.','.kkkkkkkkkkkkkkk','.kxcccccccccCCk.','..kxcccccccCCk..','...kxccccccCk...','....kxcccCCk....','.....kxccCk.....','......kxCk......','.......kk.......','................','................','................']
HEART=['................','..kkkk...kkkk...','.kpprrk.kprrRk..','kpprrrrkrrrrRRk.','kprrrrrrrrrrrRk.','krrrrrrrrrrrrRk.','krrrrrrrrrrrRRk.','.krrrrrrrrrrRk..','..krrrrrrrrRk...','...krrrrrrRk....','....krrrrRk.....','.....krrRk......','......kRk.......','.......k........','................','................']
ARMOR=['................','..kkkk....kkkk..','.kssssk..kssssk.','.ksvsssk.kssvSk.','.ksssssskssssSk.','..ksvsssssssSk..','...kssssssssk...','...ksvssssssk...','...kssssssSSk...','...ksssssssSk...','...ksvssssssk...','...kssssssSSk...','...kssssssSSk...','...kkkkkkkkkk...','................','................']
TORCH=['................','.......kk.......','......kyok......','......koOk......','.......kk.......','.......bk.......','......kbBk......','......kbBk......','......kbBk......','......kbBk......','......kbBk......','......kbBk......','......kbBk......','.......kk.......','................','................']
ARROWI=['................','............kkk.','...........kssk.','..........kssk..','.........kSsk...','........kbbk....','.......kbbk.....','......kbbk......','.....kbbk.......','....kbbk........','.kkkbbk.........','.kgkbk..........','.kgggk..........','..kkkk..........','................','................']
CART=['................','................','................','.kkkkkkkkkkkkkk.','.kssssssssssssk.','.ksvvvvvvvvvvSk.','.ksv........vSk.','.ksvvvvvvvvvvSk.','.kssssssssssssk.','..kSSSSSSSSSSk..','..kkkkkkkkkkkk..','...kddk..kddk...','...kdgk..kdgk...','....kk....kk....','................','................']
STAR=['................','.......kk.......','......kyyk......','......kyyk......','.....kyyyyk.....','kkkkkyyyyyykkkkk','kyyyyyyyyyyyyyyk','.kyyyyyyyyyyyyk.','..kyyyyyyyyyyk..','...kyyyyyyyyk...','...kyyyYYyyyk...','..kyyyYkkYyyyk..','..kyyYk..kYyyk..','.kyyYk....kYyyk.','.kkkk......kkkk.','................']
PROT=['................','................','.....kkkkkk.....','...kkyyyyyykk...','..kyyykkkkyyyk..','.kyykk....kkyyk.','.kyk...kk...kyk.','kyyk...kk...kyyk','kyk....kk....kyk','kykkkkkkkkkkkkyk','kyyyyyyyyyyyyyyk','kkkkkkkkkkkkkkkk','................','................','................','................']
ANVIL=['....................','.kkkkkkkkkkkkkkkkk..','kSssssssssssssssssk.','kSssvvvvvvvvvvvvssSk','.kSSSSSSSSSSSSSSSSk.','..kkkkksssssskkkkk..','......kssssSk.......','......kssssSk.......','.....kksssssSkk.....','....kssssssssssk....','...kSsssssssssSSk...','...kkkkkkkkkkkkkk...']
SWORD=['....................................','kk..............................kk..','kgkk..........................kkxk..','kggsskkkkkkkkkkkkkkkkkkkkkkkkkksssxk.','kgkk..........................kkxk..','kk..............................kk..']
SWORD=['......................','..kk..............kkk.','.kbBk.kk.......kkkxxk.','kbbBkkSSkkkkkkkcccccxk','kbBBkSccccccccccccccCk','.kbBk.kkkkkkkkkkCCCCk.','..kk..............kk..']
def btn(icon_im,n):
  W=300;im=Image.new('RGBA',(W,W),(0,0,0,0));d=ImageDraw.Draw(im)
  # каменная кнопка с фаской
  t=Image.new('RGBA',(30,30));px=t.load()
  for y in range(30):
    for x in range(30):
      e=min(x,y,29-x,29-y)
      if e==0:c=C('#141414')
      elif e<=2 and (x<=2 or y<=2) and x+y<55:c=C('#d0d0d0')
      elif e<=2:c=C('#4a4a4a')
      else:c=C(R.choice(['#8d8d8d','#858585','#959595','#7f7f7f']))
      px[x,y]=jit(c,5) if e>0 else c
  # закруглённые уголки
  for x,y in [(0,0),(29,0),(0,29),(29,29)]:px[x,y]=(0,0,0,0)
  t=t.resize((W,W),Image.NEAREST);im.alpha_composite(t)
  ic=icon_im;s=min(200/ic.width,200/ic.height);ic=ic.resize((round(ic.width*s),round(ic.height*s)),Image.NEAREST)
  sh=Image.new('RGBA',ic.size,(0,0,0,0));sh.putalpha(ic.getchannel('A').point(lambda v:110 if v else 0))
  im.alpha_composite(sh,((W-ic.width)//2+8,(W-ic.height)//2+8));im.alpha_composite(ic,((W-ic.width)//2,(W-ic.height)//2))
  im.save(OUT+n+'.png')
a=icon(ARROW,1)
btn(a,'b_left');btn(a.transpose(Image.FLIP_LEFT_RIGHT),'b_right');btn(a.rotate(-90,expand=True),'b_up')
btn(icon(PICK,1),'b_dig');btn(icon(GRASSB,1),'b_place');btn(icon(BOW,1),'b_bow');btn(icon(HOUSE,1),'b_home');btn(icon(CHECK,1),'b_ok')
def item(rows,n,size=256):ic=icon(rows,1);s=size//max(ic.width,ic.height);ic=ic.resize((ic.width*s,ic.height*s),Image.NEAREST);bb=ic.getbbox();ic.crop(bb).save(OUT+n+'.png')
for rows,n in [(CHEST,'chest'),(CHESTO,'chest_open'),(DIA,'diamond'),(HEART,'heart'),(ARMOR,'armor'),(TORCH,'torch'),(ARROWI,'arrow'),(CART,'cart'),(STAR,'star'),(PROT,'prot_small'),(ANVIL,'anvil')]:item(rows,n)
ic=icon(SWORD,1);ic.resize((ic.width*30,ic.height*30),Image.NEAREST).crop(ic.resize((ic.width*30,ic.height*30)).getbbox()).save(OUT+'sword.png')
# стержни для ферм: повторяемые по длине текстуры
def rod(n,cols,h,L=80,edge='#1a1414'):
  im=Image.new('RGBA',(L,h));px=im.load()
  for y in range(h):
    for x in range(L):
      if y==0 or y==h-1:px[x,y]=C(edge)
      else:px[x,y]=jit(C(cols[(y*3+x//7)%len(cols)] if n!='beam' else (cols[0] if x%20 and y!=h//2 else cols[1])),8)
  im.resize((L*8,h*8),Image.NEAREST).save(OUT+n+'.png')
rod('stick',['#7a5230','#8a6238','#6a4526'],10);rod('iron',['#d4d4d8','#c0c0c6','#e8e8ec','#a8a8b0'],15);rod('beam',['#b88a50','#7a5530'],20)
# таблички: доска и каменные плитки (рамка внутри угловой доли 9-slice)
def plate(n,W,H,fill,light,dark,frame=3,u=8,plank=False):
  w,h=W//u,H//u;im=Image.new('RGBA',(w,h));px=im.load()
  for y in range(h):
    for x in range(w):
      e=min(x,y,w-1-x,h-1-y)
      if e==0:c=C('#141010')
      elif e<frame:c=C(light) if (x<frame or y<frame) and not (x>w-1-frame or y>h-1-frame) else C(dark)
      else:c=C(R.choice(fill));
      if plank and e>=frame and (y-frame)%5==4:c=C(dark)
      px[x,y]=jit(c,6) if e>0 else c
  for x,y in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]:px[x,y]=(0,0,0,0)
  im.resize((w*u,h*u),Image.NEAREST).save(OUT+n+'.png')
plate('board',712,208,['#b88a50','#ae8048','#c4955a'],'#d8ac70','#6a4526',frame=3,plank=True)
plate('tab_grey',288,288,['#8d8d8d','#858585','#959595'],'#cfcfcf','#4a4a4a',frame=3)
plate('tab_sand',288,288,['#e2cf94','#dcc78a','#e8d8a2'],'#fff0c0','#a88a50',frame=3)
plate('tab_purple',288,288,['#7a4ab8','#7044ac','#8452c4'],'#b890f0','#40206a',frame=3)
# большой транспортир: золотое полукольцо, центр — середина низа, внешний радиус = ширина/2.04
u=8;W=616;w=W//u;h=w//2+3;im=Image.new('RGBA',(w,h),(0,0,0,0));px=im.load();cx=w/2;cy=h-2.5;Ro=w/2.04/1;Ri=Ro*.62
for y in range(h):
  for x in range(w):
    dx=x+.5-cx;dy=cy-(y+.5);r=math.hypot(dx,dy)
    if dy>=-1.5 and r<=Ro:
      if r>=Ro-1 or (Ri-1<r<Ri) or (dy<-0.5):c=C('#7a4a08')
      elif r>=Ri:c=jit(C(R.choice(['#f0c030','#e8b224','#ffd24a'])),6)
      elif dy<1.2:c=jit(C('#e8b224'),6)
      else:continue
      px[x,y]=c
im.resize((w*u,h*u),Image.NEAREST).save(OUT+'protractor.png')
# поверни телефон: телефон боком + стрелка
w,h=112,56;im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im)
d.rectangle([10,14,58,42],fill=C('#141414'));d.rectangle([12,16,56,40],fill=C('#2a2a32'));d.rectangle([14,18,54,38],fill=C('#6ab8f5'));d.rectangle([14,32,54,38],fill=C('#6cbf43'));d.rectangle([20,26,23,31],fill=C('#ff9a2a'))
d.rectangle([74,6,94,50],fill=C('#141414'));d.rectangle([76,8,92,48],fill=C('#2a2a32'));d.rectangle([78,10,90,46],fill=C('#6ab8f5'))
for i in range(0,60,3):
  a=math.radians(200+i*2.3);x=66+22*math.cos(a);y=30+18*math.sin(a)
d.arc([42,4,90,40],200,330,fill=C('#ffffff'),width=3);d.polygon([(84,12),(92,20),(80,22)],fill=C('#ffffff'))
im=im.transpose(Image.FLIP_LEFT_RIGHT).resize((w*8,h*8),Image.NEAREST);im.save(OUT+'rotate.png')
print('ui ok')
