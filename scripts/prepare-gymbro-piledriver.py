"""Separate the twelve ImageGen wrestler poses with a single body scale and hip axis."""
from pathlib import Path
import sys
from PIL import Image

root=Path(__file__).resolve().parents[1]
source=Image.open(sys.argv[1]).convert('RGBA')
w,h=source.size
alpha=bytearray(source.getchannel('A').point(lambda a:255 if a>64 else 0).tobytes())
poses=[]
for seed in range(w*h):
    if not alpha[seed]:continue
    queue=[seed];alpha[seed]=0
    left=right=seed%w;top=bottom=seed//w
    for p in queue:
        x,y=p%w,p//w
        left,right,top,bottom=min(left,x),max(right,x),min(top,y),max(bottom,y)
        for n in ([p-1] if x else [])+([p+1] if x<w-1 else [])+([p-w] if y else [])+([p+w] if y<h-1 else []):
            if alpha[n]:alpha[n]=0;queue.append(n)
    if len(queue)>2000:
        mask=Image.new('L',(right-left+1,bottom-top+1));pixels=mask.load()
        for p in queue:pixels[p%w-left,p//w-top]=255
        person=source.crop((left,top,right+1,bottom+1));person.putalpha(mask)
        poses.append((left,top,person))
assert len(poses)==12,len(poses)
poses.sort(key=lambda p:p[1]);ordered=[]
for row in range(3):ordered.extend(sorted(poses[row*4:row*4+4],key=lambda p:p[0]))
ratio=198/ordered[11][2].height
atlas=Image.new('RGBA',(1024,768))
for index,(left,top,person) in enumerate(ordered):
    person=person.resize((round(person.width*ratio),round(person.height*ratio)),Image.Resampling.NEAREST)
    axis=index%4*w/4+w/8
    x=round(128-(axis-left)*ratio);y=232-person.height
    assert x>0 and y>0 and x+person.width<256,(index,x,y,person.size)
    atlas.alpha_composite(person,(index%4*256+x,index//4*256+y))
atlas.save(root/'src/data/players/player_4_piledriver.png')
print('Saved 12 cells at 256x256, common guard height 198 and ground y=232')
