# Пиксельные текстуры блоков 16×16 (как в майнкрафте), увеличенные до 128 без размытия → assets/tiles/*.png
import random
from PIL import Image
OUT='/workspace/kub-game/assets/tiles/'
def C(h):h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))
def jit(c,a,r):return tuple(max(0,min(255,int(v+r.uniform(-a,a)))) for v in c)
def mix(c,d,t):return tuple(int(a+(b-a)*t) for a,b in zip(c,d))
def noise(pal,seed,a=10):
  r=random.Random(seed);im=Image.new('RGB',(16,16));px=im.load()
  for y in range(16):
    for x in range(16):px[x,y]=jit(C(r.choice(pal)),a,r)
  return im,px,r
def save(im,n):im.resize((128,128),Image.NEAREST).save(OUT+n+'.png')
def dirt(seed=1):return noise(['#8a5a34','#7a4e2c','#94633b','#6b4325','#87583a'],seed)
im,px,r=dirt(1);save(im,'dirt')
# трава: зелёный верх с подтёками
im,px,r=dirt(2)
for x in range(16):
  d=3+r.choice([0,0,1,1,2])
  for y in range(d):px[x,y]=jit(C(r.choice(['#5fae3a','#6cbf43','#4f9a30','#64b33d'])),8,r)
save(im,'grass')
def stone(seed,base=('#8d8d8d','#7f7f7f','#999999','#868686','#757575')):
  im,px,r=noise(list(base),seed,6)
  for k in range(7):
    x,y=r.randrange(16),r.randrange(16)
    for i in range(r.randrange(2,4)):
      if 0<=x+i<16:px[x+i,y]=jit(C('#6c6c6c'),5,r)
  return im,px,r
im,px,r=stone(3);save(im,'stone')
def ore(seed,cols,n=5):
  im,px,r=stone(seed)
  spots=[(2,2),(9,1),(5,6),(11,8),(2,11),(8,12),(13,13)][:n]
  for x,y in spots:
    for dx,dy in [(0,0),(1,0),(0,1),(1,1),(2,1),(1,2)]:
      if x+dx<16 and y+dy<16:px[x+dx,y+dy]=jit(C(r.choice(cols[:3])),10,r)
    px[x,min(15,y+2)]=jit(C(cols[-1]),5,r)
  return im
save(ore(4,['#6ff0f0','#3fd8e0','#b8ffff','#1fa0b0'],6),'diamond_ore')
save(ore(5,['#ffd84a','#f0b820','#fff0a0','#b8820c'],6),'gold_ore')
im,px,r=noise(['#2a2a2a','#3a3a3a','#1c1c1c','#4a4a4a','#555555'],6,8);save(im,'bedrock')
im,px,r=noise(['#e8d79a','#dccb8a','#f0e0a8','#d4c07c'],7,6);save(im,'sand')
im,px,r=noise(['#dcc78a','#d2bc7c','#e2cf94'],8,4)
for y in (3,4,9,13):
  for x in range(16):px[x,y]=jit(C('#bfa565' if y in(4,13) else '#ead9a2'),5,r)
save(im,'sandstone')
# булыжник: камешки с тёмными швами
im=Image.new('RGB',(16,16));px=im.load();r=random.Random(9)
cells=[(r.uniform(0,16),r.uniform(0,16),r.choice(['#9a9a9a','#8a8a8a','#a8a8a8','#7c7c7c'])) for _ in range(11)]
for y in range(16):
  for x in range(16):
    ds=sorted(((min(abs(x-cx),16-abs(x-cx))**2+min(abs(y-cy),16-abs(y-cy))**2),c) for cx,cy,c in cells)
    edge=ds[1][0]**.5-ds[0][0]**.5<1.0
    px[x,y]=jit(C('#555555') if edge else C(ds[0][1]),7,r)
save(im,'cobble')
# доски
im,px,r=noise(['#b88a50','#a87c46','#c4955a'],10,6)
for y in range(16):
  for x in range(16):
    if y%4==3:px[x,y]=jit(C('#7a5530'),5,r)
    elif (x==(5 if (y//4)%2 else 12)):px[x,y]=jit(C('#8a6238'),5,r)
save(im,'planks')
# бревно: вертикальная кора
im=Image.new('RGB',(16,16));px=im.load();r=random.Random(11)
for x in range(16):
  base=C(['#6b4a2a','#5a3d22','#7a5632','#4e351d'][(x*7+3)%4])
  for y in range(16):px[x,y]=jit(base,10,r)
for k in range(8):
  x,y=r.randrange(16),r.randrange(15);px[x,y]=C('#3a2814');px[x,y+1]=C('#3a2814')
save(im,'log')
im,px,r=noise(['#3f8f2e','#4fa337','#357a26','#5cb341','#2e6b20'],12,10)
for k in range(14):px[r.randrange(16),r.randrange(16)]=jit(C('#244f19'),5,r)
save(im,'leaves')
# каменный кирпич замка
im,px,r=noise(['#8c8c94','#80808a','#96969e'],13,6)
for y in range(16):
  for x in range(16):
    if y in (7,15) or (x in (7,15) and y<7) or (x in (3,11) and 7<y<15):px[x,y]=jit(C('#55555c'),4,r)
    elif y in (0,8) or (x in (0,8) and y<7) or (x in (4,12) and 7<y<15):px[x,y]=jit(C('#a8a8b0'),4,r)
save(im,'castle')
im,px,r=noise(['#a44a36','#b85440','#963f2e'],14,8)
for y in range(16):
  for x in range(16):
    if y%4==3 or (x==(3 if (y//4)%2 else 11) and y%4!=3) or (x==(11+8)%16 if False else False):px[x,y]=jit(C('#cfc2b0'),6,r)
    if y%4!=3 and x==((3 if (y//4)%2 else 11)+8)%16:px[x,y]=jit(C('#cfc2b0'),6,r)
save(im,'brick')
im,px,r=noise(['#2f6fd8','#3a7ae0','#2a62c8','#3f84e8'],15,6)
for k in range(6):
  x,y=r.randrange(12),r.randrange(16)
  for i in range(4):px[x+i,y]=jit(C('#7fb4ff'),8,r)
save(im,'water')
im,px,r=noise(['#c8c8cc','#d4d4d8','#bcbcc2'],16,4)
for y in range(16):
  for x in range(16):
    if x in (0,15) or y in (0,15):px[x,y]=C('#8a8a90')
    elif x in (1,) or y in (1,):px[x,y]=C('#ececf0')
for x,y in [(3,3),(12,3),(3,12),(12,12)]:px[x,y]=C('#6a6a70');px[x+1,y+1]=C('#f4f4f6')
save(im,'iron')
print('tiles ok')
