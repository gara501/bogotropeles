"""Normalize six canonical-model dash poses while preserving the existing source stack."""
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
    pose.putalpha(Image.fromarray((mask*255).astype('uint8')))
    poses.append((xs.start,pose))
assert len(poses)==6,len(poses)
poses.sort(key=lambda p:p[0])
combat=Image.open(ROOT/'src/data/players/gymbro_combos_v1.png').convert('RGBA')
guard=combat.crop((0,0,256,256));b=guard.getbbox();scale=(b[3]-b[1])/poses[-1][1].height
atlas=Image.new('RGBA',(1920,320));frames=[]
for i,(left,pose) in enumerate(poses):
    axis=(i+.5)*source.width/6
    pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST)
    x=round(160-(axis-left)*scale);y=304-pose.height
    assert x>0 and y>0 and x+pose.width<320,(i,x,y,pose.size)
    cell=Image.new('RGBA',(320,320));cell.alpha_composite(pose,(x,y))
    if i==5:
        # Recover into the exact idle pixels, avoiding another model change at the end.
        cell=Image.new('RGBA',(320,320));cell.alpha_composite(guard,(32,56))
    frames.append(cell)
    atlas.alpha_composite(cell,(i*320,0))
atlas.save(ROOT/'src/data/players/player_4_dash_consistent.png')
preview=Image.new('RGB',(1200,640),'#25313b');draw=ImageDraw.Draw(preview)
old=Image.open(ROOT/'src/data/players/player_4.png').convert('RGBA').crop((283,811,500,975))
entries=[('Guardia del combo',guard),('Dash anterior',old),('Dash nuevo: impulso',frames[1]),
         ('Hombrazo nuevo',frames[2]),('Segundo apoyo',frames[3]),('Vuelta a guardia',frames[5])]
for i,(title,pose) in enumerate(entries):
    b=pose.getbbox();pose=pose.crop(b);x=i%3*400;y=i//3*320
    draw.text((x+12,y+12),title,fill='white');draw.line((x+10,y+285,x+390,y+285),fill='#55717e')
    preview.paste(pose,(x+200-pose.width//2,y+285-pose.height),pose)
preview.save(ROOT/'docs/gymbro-dash-comparison.png')
print(f'Six 320x320 poses, common scale={scale:.4f}, final guard height=198, foot baseline=304')
