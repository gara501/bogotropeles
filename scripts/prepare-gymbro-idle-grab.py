"""Match Gymbro's grab art to the canonical punch guard without changing atlas offsets."""
from pathlib import Path
import json
from statistics import median
import numpy as np
from scipy.ndimage import label, find_objects
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'docs/gymbro-idle-grab-generation.json').read_text(encoding='utf8'))
source=Image.open(spec['source']).convert('RGBA')
labels,count=label(np.array(source.getchannel('A'))>=210,structure=np.ones((3,3)))
poses=[]
for index,box in enumerate(find_objects(labels),1):
    if box is None:continue
    mask=labels[box]==index
    if mask.sum()<1500:continue
    ys,xs=box;cell=source.crop((xs.start,ys.start,xs.stop,ys.stop))
    cell.putalpha(Image.fromarray((mask*255).astype('uint8')))
    poses.append((xs.start,ys.start,cell))
assert len(poses)==12,len(poses)
poses.sort(key=lambda p:p[1]);ordered=[]
for row in range(3):ordered.extend(sorted(poses[row*4:row*4+4],key=lambda p:p[0]))
combat=Image.open(ROOT/'src/data/players/gymbro_combos_v1.png').convert('RGBA')
guard=combat.crop((0,0,256,256));bounds=guard.getbbox();height=bounds[3]-bounds[1]
scale=height/median(p.height for _,_,p in ordered[:4])
atlas=Image.new('RGBA',(1536,1024));normalized=[]
for i,(left,top,person) in enumerate(ordered):
    person=person.resize((round(person.width*scale),round(person.height*scale)),Image.Resampling.NEAREST)
    # Keep the source cell's body axis stable while hands reach out to the right.
    axis=(i%4+.5)*source.width/4
    x=round(192-(axis-left)*scale);y=330-person.height
    assert x>0 and y>0 and x+person.width<384,(i,person.size,x,y)
    cell=Image.new('RGBA',(384,340));cell.alpha_composite(person,(x,y));normalized.append(cell)
    atlas.alpha_composite(cell,((i%4)*384,(i//4)*342))
atlas.save(ROOT/spec['output'])

# Same-scale comparison: idle is literally the punch guard, grabs use one 198px body scale.
old=Image.open(ROOT/'src/data/players/player_4.png').convert('RGBA').crop((58,239,226,437))
old_grab=Image.open(ROOT/'src/data/players/player_4_agarre.png').convert('RGBA').crop((816,39,1108,345))
old_grab=old_grab.resize((round(old_grab.width*198/305*.88),round(old_grab.height*198/305*.88)),Image.Resampling.NEAREST)
preview=Image.new('RGB',(1200,700),'#25313b');draw=ImageDraw.Draw(preview)
entries=[('Reposo anterior',old),('Reposo = guardia del combo',guard),('Contacto del puno',combat.crop((512,0,768,256))),
         ('Agarre anterior (reducido)',old_grab),('Agarre corregido',normalized[2]),('Rodillazo corregido',normalized[6])]
for i,(title,pose) in enumerate(entries):
    b=pose.getbbox();pose=pose.crop(b);x=i%3*400;y=i//3*350
    draw.text((x+12,y+15),title,fill='white');draw.line((x+10,y+310,x+390,y+310),fill='#55717e')
    preview.paste(pose,(x+200-pose.width//2,y+310-pose.height),pose)
preview.save(ROOT/'docs/gymbro-idle-grab-comparison.png')
print(f'12 poses; canonical height={height}; uniform scale={scale:.4f}; stack remains 1536x1024')
