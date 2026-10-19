# Сравнение «было / стало» для мира: world_compare_<место>.png (сверху было, снизу стало) + общий лист world_compare_all.png
import os
from PIL import Image,ImageDraw,ImageFont
D='/workspace/kub-game/shots/approval/';F='/workspace/kub-game/fonts/'
fp=[f for f in os.listdir(F) if f.endswith('.ttf')];fnt=ImageFont.truetype(F+fp[0],44) if fp else ImageFont.load_default()
def lab(im,t):
  d=ImageDraw.Draw(im);w=d.textlength(t,font=fnt);d.rounded_rectangle([16,14,16+w+36,14+66],14,fill=(20,24,34));d.text((34,20),t,font=fnt,fill=(255,224,102))
tiles=[]
for n in['forest','mine2','village','desert','castle']:
  a=Image.open(D+f'world_v1_{n}.png').convert('RGB');b=Image.open(D+f'world_v2_{n}.png').convert('RGB')
  lab(a,'было');lab(b,'стало')
  c=Image.new('RGB',(a.width,a.height*2+8),(20,24,34));c.paste(a,(0,0));c.paste(b,(0,a.height+8));c.save(D+f'world_compare_{n}.png');tiles.append(c)
w=tiles[0].width//2;h=tiles[0].height//2
al=Image.new('RGB',(w*len(tiles)+8*(len(tiles)-1),h),(20,24,34))
for i,t in enumerate(tiles):al.paste(t.resize((w,h)),(i*(w+8),0))
al.save(D+'world_compare_all.png');print('ok',al.size)
