"""Separate the sixteen ImageGen poses, preserving one body scale and floor pivot."""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
source=Image.open(ROOT/'prompts/cuidacarros/source.png').convert('RGBA')
w,h=source.size
alpha=bytearray(source.getchannel('A').point(lambda a:255 if a>=160 else 0).tobytes())
poses=[]
for seed in range(w*h):
    if not alpha[seed]:continue
    queue=[seed];alpha[seed]=0;left=right=seed%w;top=bottom=seed//w
    for p in queue:
        x,y=p%w,p//w;left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
        for n in ([p-1] if x else [])+([p+1] if x<w-1 else [])+([p-w] if y else [])+([p+w] if y<h-1 else []):
            if alpha[n]:alpha[n]=0;queue.append(n)
    if len(queue)<1000:continue
    mask=Image.new('L',(right-left+1,bottom-top+1));pixels=mask.load()
    for p in queue:pixels[p%w-left,p//w-top]=255
    person=source.crop((left,top,right+1,bottom+1));person.putalpha(mask);poses.append((left,top,person))
assert len(poses)==16,len(poses)
poses.sort(key=lambda p:p[1]+p[2].height);ordered=[]
for row in range(4):ordered.extend(sorted(poses[row*4:row*4+4],key=lambda p:p[0]))
ratio=min(198/ordered[0][2].height,220/max(p.height for _,_,p in ordered),230/max(p.width for _,_,p in ordered))
hips=[155,459,778,1094,150,450,764,1083,154,459,782,1099,158,468,773,1084]
opaque=np.concatenate([np.asarray(p)[np.asarray(p)[:,:,3]>0,:3] for _,_,p in ordered])
palette=Image.fromarray(opaque.reshape(1,-1,3)).quantize(colors=48,dither=Image.Dither.NONE)
atlas=Image.new('RGBA',(1024,1024))
for i,(left,top,person) in enumerate(ordered):
    person=person.resize((round(person.width*ratio),round(person.height*ratio)),Image.Resampling.NEAREST)
    a=person.getchannel('A');person=person.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');person.putalpha(a)
    x=round(128-(hips[i]-left)*ratio);y=232-person.height
    assert x>1 and y>1 and x+person.width<255,(i,x,y,person.size)
    atlas.alpha_composite(person,(i%4*256+x,i//4*256+y))
atlas.save(ROOT/'src/data/enemies/cuidacarros.png')
print(f'16 complete poses, shared scale {ratio:.4f}, baseline232, hard alpha,48colors')
