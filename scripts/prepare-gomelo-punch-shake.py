"""Normalize three lunge punches and grip/shake/release poses to Gomelo's body scale."""
from pathlib import Path
import sys
import numpy as np
from scipy.ndimage import label,find_objects
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
source=Image.open(sys.argv[1]).convert('RGBA')
labels,_=label(np.array(source.getchannel('A'))>=210,structure=np.ones((3,3)))
poses=[]
for index,box in enumerate(find_objects(labels),1):
    if box is None:continue
    mask=labels[box]==index
    if mask.sum()<1500:continue
    ys,xs=box;pose=source.crop((xs.start,ys.start,xs.stop,ys.stop))
    pose.putalpha(Image.fromarray((mask*255).astype('uint8')));poses.append((xs.start,ys.start,pose))
assert len(poses)==24,len(poses)
poses.sort(key=lambda p:p[1]);ordered=[]
for row in range(4):ordered.extend(sorted(poses[row*6:row*6+6],key=lambda p:p[0]))
reference=Image.open(ROOT/'src/data/players/office_combos_v1.png').crop((0,0,256,256));b=reference.getbbox()
scale=(b[3]-b[1])/ordered[0][2].height
atlas=Image.new('RGBA',(1920,1280));frames=[]
for i,(left,top,pose) in enumerate(ordered):
    axis=(i%6+.5)*source.width/6
    pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST)
    x=round(160-(axis-left)*scale);y=304-pose.height
    assert x>0 and y>0 and x+pose.width<320,(i,x,y,pose.size)
    frame=Image.new('RGBA',(320,320));frame.alpha_composite(pose,(x,y));frames.append(frame)
    atlas.alpha_composite(frame,(i%6*320,i//6*320))
atlas.save(ROOT/'src/data/players/office_punch_shake_v1.png')
preview=Image.new('RGB',(960,360),'#25313b');draw=ImageDraw.Draw(preview)
for row,title in enumerate(['Recto con torsion','Cruzado bajo','Remate en zancada']):
    pose=frames[row*6+2];preview.paste(pose,(row*320,0),pose);draw.text((row*320+12,337),title,fill='white')
preview.save(ROOT/'docs/gomelo-punch-combo-preview.png')
pages=[]
for pose in frames[:18]:
    page=Image.new('RGB',(320,340),'#25313b');page.paste(pose,(0,0),pose);pages.append(page)
pages[0].save(ROOT/'docs/gomelo-punch-combo.gif',save_all=True,append_images=pages[1:],duration=100,loop=0)
print(f'24 complete poses at one scale={scale:.4f}, native body height={b[3]-b[1]}')
