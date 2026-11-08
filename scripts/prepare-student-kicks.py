"""Separate ImageGen's twenty poses and preserve a shared body scale and support-foot pivot."""
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
# Match the student's runtime chroma-spill cleanup in spriteSheets.js.
rgba=bytearray(source.tobytes())
for i in range(0,len(rgba),4):
    high,low=max(rgba[i:i+3]),min(rgba[i:i+3])
    if high>=180 and low<=25 and (high-low)/high>=.9:
        rgba[i+3]=0
source=Image.frombytes('RGBA',source.size,bytes(rgba))
w,h = source.size
alpha = bytearray(source.getchannel('A').point(lambda a:255 if a>64 else 0).tobytes())
poses = []
for seed in range(w*h):
    if not alpha[seed]:
        continue
    queue = [seed]
    alpha[seed] = 0
    left=right=seed%w
    top=bottom=seed//w
    for p in queue:
        x,y=p%w,p//w
        left,right,top,bottom=min(left,x),max(right,x),min(top,y),max(bottom,y)
        for n in ([p-1] if x else [])+([p+1] if x<w-1 else [])+([p-w] if y else [])+([p+w] if y<h-1 else []):
            if alpha[n]:
                alpha[n]=0
                queue.append(n)
    if len(queue)>2000:
        mask=Image.new('L',(right-left+1,bottom-top+1))
        pixels=mask.load()
        for p in queue:
            pixels[p%w-left,p//w-top]=255
        person=source.crop((left,top,right+1,bottom+1))
        person.putalpha(mask)
        poses.append((left,top,person))
assert len(poses)==20, f'Expected 20 isolated poses, got {len(poses)}'
poses.sort(key=lambda p:p[1])
ordered=[]
for row in range(5):
    ordered.extend(sorted(poses[row*4:row*4+4],key=lambda p:p[0]))
atlas=Image.new('RGBA',(1536,1280))
for index,(left,top,person) in enumerate(ordered):
    if index<12:
        xs=[x for x in range(person.width) if person.getpixel((x,person.height-3))[3]]
        foot=[xs[0]]
        for x in xs[1:]:
            if x-foot[-1]>4:break
            foot.append(x)
        x=round(142-(foot[0]+foot[-1])/2)
    else:
        hip=index%4*w/4+240
        x=round(192-(hip-left))
    y=232-person.height
    assert x>0 and y>0 and x+person.width<384,(index,x,y,person.size)
    atlas.alpha_composite(person,(index%4*384+x,index//4*256+y))
atlas.save(root/'src/data/players/player_2_kicks_air.png')
print('Saved 20 poses in 384x256 cells, common ground 232 and hip anchor 192')
