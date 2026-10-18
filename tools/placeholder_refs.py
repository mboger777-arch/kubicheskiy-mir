# ТОЛЬКО для разработки: заглушки refs/*.jpg той же раскладки, что и нарисованные листы (создаёт лишь отсутствующие файлы).
from PIL import Image,ImageDraw
import os,random
os.makedirs('refs',exist_ok=True);W,H=1024,576
def new():im=Image.new('RGB',(W,H),(255,255,255));return im,ImageDraw.Draw(im)
def save(n,im):
    p=f'refs/{n}.jpg'
    if not os.path.exists(p):im.save(p,quality=92);print('placeholder',p)
def fig(d,b,c):x0,y0,x1,y1=b;d.rectangle([x0+(x1-x0)*.25,y0,x1-(x1-x0)*.25,y0+(y1-y0)*.3],fill=c);d.rectangle([x0,y0+(y1-y0)*.3,x1,y1-(y1-y0)*.3],fill=c);d.rectangle([x0+(x1-x0)*.2,y1-(y1-y0)*.3,x1-(x1-x0)*.2,y1],fill=tuple(int(v*.7) for v in c))
im,d=new();fig(d,(40,25,320,525),(230,120,40));fig(d,(390,30,690,525),(130,70,190));fig(d,(725,180,945,530),(220,190,110));save('heroes',im)
im,d=new();fig(d,(300,10,660,555),(90,50,120));save('krivolom',im)
im,d=new();fig(d,(130,35,450,515),(80,170,70));fig(d,(515,140,1000,495),(60,40,70));save('monsters',im)
im,d=new();cols=[(110,170,60),(130,90,50),(120,120,120),(150,150,150),(130,160,190),(170,150,90),(40,40,40),(230,215,160),(210,190,140),(170,130,80),(100,70,40),(60,120,40),(60,40,80),(170,80,60),(40,90,180),(200,200,200)]
for i,c in enumerate(cols):
    x,y=(i%4)*256,(i//4)*144;d.rectangle([x,y,x+255,y+143],fill=c)
    for k in range(40):px,py=x+random.randint(0,240),y+random.randint(0,130);d.rectangle([px,py,px+14,py+12],fill=tuple(max(0,v-25) for v in c))
save('tiles',im)
for n,c in [('bg_forest',(110,170,230)),('bg_mine',(40,35,40)),('bg_river',(100,170,230)),('bg_village',(120,180,230)),('bg_desert',(240,220,170)),('bg_castle',(90,50,110))]:
    im,d=new();[d.rectangle([0,y,W,y+8],fill=tuple(int(v*(1-y/H*.5)) for v in c)) for y in range(0,H,8)];d.polygon([(0,H),(200,330),(450,400),(700,300),(1024,420),(1024,H)],fill=tuple(int(v*.6) for v in c));save(n,im)
im,d=new()
for r in range(2):
    for cI,x in enumerate([35,283,530,780]):d.rectangle([x,45+r*250,x+203,235+r*260],fill=(128,128,128));d.rectangle([x+60,100+r*250,x+140,180+r*255],fill=(240,240,240))
save('ui_buttons',im)
im,d=new()
for r in range(2):
    for x in [30,235,445,630,830]:d.ellipse([x,40+r*240,x+170,250+r*240],fill=random.choice([(150,100,50),(60,150,230),(220,40,40),(200,200,200),(230,180,40)]))
save('ui_items',im)
im,d=new();d.rectangle([160,50,870,260],fill=(120,80,40));d.rectangle([200,85,830,225],fill=(220,190,140))
for x,c in [(158,(190,190,190)),(415,(220,200,150)),(667,(90,70,110))]:d.rectangle([x,295,x+200,500],fill=c)
save('ui_boards',im)
im,d=new();d.pieslice([90,45,500,455],180,360,fill=(220,170,40));d.pieslice([170,125,420,375],180,360,fill=(255,255,255));d.rectangle([570,60,895,310],fill=(70,70,70))
d.rectangle([20,405,260,437],fill=(110,70,30));d.rectangle([280,398,480,445],fill=(200,200,200));d.rectangle([512,392,718,445],fill=(130,80,40));d.rectangle([735,400,1005,440],fill=(170,170,170))
save('ui_items2',im)
im,d=new();d.rectangle([80,40,320,490],fill=(40,40,40));d.rectangle([370,90,640,410],fill=(240,120,30));d.rectangle([560,230,990,480],fill=(40,40,40));save('rotate',im)
