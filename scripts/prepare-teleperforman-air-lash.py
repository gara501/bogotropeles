import sys
from PIL import Image
import numpy as np
import pathlib
P=str(pathlib.Path(__file__).resolve().parents[1]/'src/data/players')+'/'
air=Image.open(P+'teleperforman_air_roll_v1.png');w=Image.open(P+'teleperforman_weapon_combos_v1.png')
S=0.92; LCUT=291; ACUT=159; AIR=7; ROW=0
def cell(im,c,r,size):return im.crop((c*size,r*size,c*size+size,r*size+size))
def waist(im,y):
    a=np.array(im)[...,3][y]>128;xs=np.where(a)[0];return (xs.min()+xs.max())/2
lower=cell(air,AIR,0,256)
lo=np.array(lower);lo[:ACUT,...,3]=0
reg=lo[ACUT:ACUT+14].astype(int);skin=(reg[...,0]>150)&(reg[...,0]-reg[...,2]>50)&(reg[...,1]>70)
lo[ACUT:ACUT+14][skin,3]=0
print('skin removed',skin.sum());lower=Image.fromarray(lo)
lx=waist(cell(air,AIR,0,256),ACUT+1)
frames=[]
for c in [1,2,3,4]:
    up=cell(w,c,ROW,384);ux=waist(up,LCUT-1)
    a=np.array(up);a[LCUT:,...,3]=0;up=Image.fromarray(a)
    up=up.resize((round(384*S),)*2,Image.Resampling.NEAREST)
    out=Image.new('RGBA',(384,384))
    # lower body: air cell placed so its centre column 128 lands at 192, its foot baseline (248) at 368
    ox,oy=192-128,368-248
    out.alpha_composite(lower,(ox,oy))
    # upper: waist centre and cut row meet the lower body's
    tx=round(ox+lx-ux*S);ty=round(oy+ACUT-LCUT*S)
    tmp=Image.new('RGBA',(384,384));tmp.alpha_composite(up,(max(tx,0),max(ty,0)) if tx>=0 and ty>=0 else (0,0))
    if tx<0 or ty<0:tmp=Image.new('RGBA',(384,384));tmp.paste(up,(tx,ty),up)
    out.alpha_composite(tmp)
    frames.append(out)
sheet=Image.new('RGBA',(384*4,384))
for i,f in enumerate(frames):sheet.alpha_composite(f,(i*384,0))
sheet.save(P+'teleperforman_air_lash_v1.png')
bg=Image.new('RGBA',sheet.size,'#25313b');bg.alpha_composite(sheet);bg=bg.convert('RGB')
# side by side with original air kick at same scale for comparison
ref=Image.new('RGBA',(384*4,384),'#25313b')
for i in range(4):ref.alpha_composite(cell(air,8+i,0,256),(i*384+64,120))
comp=Image.new('RGB',(384*4,768));comp.paste(bg,(0,0));comp.paste(ref.convert('RGB'),(0,384));comp.save(str(pathlib.Path(P).parents[2]/'docs/teleperforman-air-lash-preview.png'))
