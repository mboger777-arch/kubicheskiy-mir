# Нарезка нарисованных листов refs/*.jpg -> assets (birefnet-general + снятие каймы). Запуск: /home/box/rbvenv/bin/python tools/cut.py
from rembg import remove,new_session
from PIL import Image,ImageFilter
import numpy as np,json,os,sys
from scipy import ndimage
import onnxruntime as ort
SO=ort.SessionOptions();SO.enable_cpu_mem_arena=False;SO.intra_op_num_threads=4
S=new_session('birefnet-general',sess_opts=SO)
ONLY=os.environ.get('ONLY')
os.makedirs('assets/sprites',exist_ok=True);os.makedirs('assets/ui',exist_ok=True);os.makedirs('assets/tiles',exist_ok=True)
INFO={}
def clean(a,keep_all=False):
    al=a[...,3].copy()
    lab,n=ndimage.label(al>40)
    if n>=1 and not keep_all:
        sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1));big=[i+1 for i,v in enumerate(sz) if v>=0.03*sz.max()]
        m=ndimage.binary_dilation(np.isin(lab,big),iterations=3);al=(al*m).astype(np.uint8)
    al[al<12]=0
    # кайма: полупрозрачные края берут цвет ближайшего непрозрачного пикселя (без белого ореола)
    edge=(al>0)&(al<245);solid=al>=245
    if edge.any() and solid.any():
        idx=ndimage.distance_transform_edt(~solid,return_distances=False,return_indices=True)
        rgb=a[...,:3].copy();rgb[edge]=a[...,:3][idx[0][edge],idx[1][edge]];a[...,:3]=rgb
    # ещё один шаг: края с белёсым цветом слегка затемнить к цвету соседей
    a[...,3]=al;return a
def seg(img,box,name,dst,maxh=None,keep_all=False,pad=30):
    if ONLY and name!=ONLY:return
    W,H=img.size;sx,sy=W/1024,H/576
    x0,y0,x1,y1=[int(v) for v in (box[0]*sx,box[1]*sy,box[2]*sx,box[3]*sy)]
    P=Image.new('RGB',(x1-x0+2*pad,y1-y0+2*pad),(255,255,255));P.paste(img.crop((x0,y0,x1,y1)),(pad,pad))
    if P.width<900:  # birefnet лучше режет крупнее
        k=900/P.width;P=P.resize((int(P.width*k),int(P.height*k)),Image.LANCZOS)
    o=np.array(remove(P,session=S,post_process_mask=True));o=clean(o,keep_all)
    im=Image.fromarray(o);bb=im.getbbox();im=im.crop(bb)
    if maxh and im.height>maxh:im=im.resize((round(im.width*maxh/im.height),maxh),Image.LANCZOS)
    elif im.width>900:im=im.resize((900,round(im.height*900/im.width)),Image.LANCZOS)
    # проверка обрезки: объект не должен касаться края исходного кропа
    al=o[...,3];touch=bool(al[:2].max()>40 or al[-2:].max()>40 or al[:,:2].max()>40 or al[:,-2:].max()>40)
    im.save(f'{dst}/{name}.png');INFO[name]={'w':im.width,'h':im.height,'touch_edge':touch};print(name,im.size,'EDGE!' if touch else '',flush=True)
def L(n):return Image.open(f'refs/{n}.jpg').convert('RGB')
J=sys.argv[1] if len(sys.argv)>1 else 'all'
if J in('all','heroes'):
    im=L('heroes')
    seg(im,(0,0,357,576),'bloki','assets/sprites',560);seg(im,(357,0,708,576),'gran','assets/sprites',560);seg(im,(708,0,1024,576),'pixel','assets/sprites',420)
    seg(L('krivolom'),(200,0,800,576),'krivo','assets/sprites',600)
    im=L('monsters');seg(im,(0,0,490,576),'zombie','assets/sprites',520);seg(im,(490,0,1024,576),'spider','assets/sprites',420)
if J in('all','ui'):
    im=L('ui_buttons');names=['b_left','b_right','b_up','b_dig','b_place','b_bow','b_home','b_ok']
    for i,n in enumerate(names):
        c,r=i%4,i//4;xs=[0,260,510,758,1024];seg(im,(xs[c],0 if r==0 else 268,xs[c+1],268 if r==0 else 576),n,'assets/ui',300)
    im=L('ui_items');names=['chest','chest_open','diamond','heart','armor','prot_small','torch','arrow','cart','star']
    for i,n in enumerate(names):
        c,r=i%5,i//5;xs=[0,215,420,615,812,1024];seg(im,(xs[c],0 if r==0 else 265,xs[c+1],265 if r==0 else 576),n,'assets/ui',300)
    im=L('ui_boards');seg(im,(0,0,1024,282),'board','assets/ui',None)
    for n,b in [('tab_grey',(0,282,385,576)),('tab_sand',(385,282,640,576)),('tab_purple',(640,282,1024,576))]:seg(im,b,n,'assets/ui',300)
    im=L('ui_items2');seg(im,(0,0,540,345),'protractor','assets/ui',None);seg(im,(540,0,1024,345),'anvil','assets/ui',300)
    for n,b in [('stick',(0,345,270,576)),('iron',(270,345,500,576)),('beam',(500,345,727,576)),('sword',(727,345,1024,576))]:seg(im,b,n,'assets/ui',None)
    seg(L('rotate'),(0,0,1024,576),'rotate','assets/ui',None,keep_all=True)
if J in('all','tiles'):
    im=L('tiles');W,H=im.size;cw,ch=W/4,H/4;s=int(min(cw,ch)*.94)
    N=['grass','dirt','cobble','stone','diamond_ore','gold_ore','bedrock','sand','sandstone','planks','log','leaves','castle','brick','water','iron']
    for i,n in enumerate(N):
        c,r=i%4,i//4;x0=int(c*cw+(cw-s)/2) if n!='grass' else int(c*cw+(cw-s)/2);y0=int(r*ch+(ch-s)*(0 if n=='grass' else .5))+(2 if r==0 else 0)
        t=im.crop((x0,y0,x0+s,y0+s)).resize((128,128),Image.LANCZOS);t.save(f'assets/tiles/{n}.png')
    print('tiles ok')
if J in('all','bg'):
    for n in ['forest','mine','river','village','desert','castle']:
        b=L('bg_'+n).resize((1600,900),Image.LANCZOS);b.save(f'assets/bg_{n}.jpg',quality=84)
    print('bg ok')
if os.path.exists('tools/cut_info.json'):
    old=json.load(open('tools/cut_info.json'));old.update(INFO);INFO=old
json.dump(INFO,open('tools/cut_info.json','w'),indent=1)
