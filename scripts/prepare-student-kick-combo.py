"""Keep the complete circular kick arc and normalize all eighteen poses together."""
from pathlib import Path
import sys
import numpy as np
from scipy.ndimage import label
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
source=Image.open(sys.argv[1]).convert('RGBA')
pixels=np.array(source);alpha=pixels[:,:,3]
assert (alpha==0).sum()>source.width*source.height*.3,'source must have a truly transparent background'
rows=(alpha>32).sum(axis=1)>8
bands=[];start=None
for y,occupied in enumerate(list(rows)+[False]):
    if occupied and start is None:start=y
    if not occupied and start is not None:
        if y-start>20:bands.append((max(0,start-2),min(source.height,y+2)))
        start=None
assert len(bands)==3,bands
cells=[];feet=[]
for top,bottom in bands:
    for col in range(6):
        cell=source.crop((round(col*source.width/6),top,round((col+1)*source.width/6),bottom))
        data=np.array(cell);mask=data[:,:,3]>32
        parts,_=label(mask,structure=np.ones((3,3)));sizes=np.bincount(parts.ravel());sizes[0]=0
        # Keep detached blue arc strokes as well as the character; drop only tiny isolated noise.
        data[:,:,3]=np.where(sizes[parts]>8,data[:,:,3],0)
        cell=Image.fromarray(data);b=cell.getbbox();assert b
        rgb=data[:,:,:3].astype(int)
        blue=(rgb[:,:,2]>rgb[:,:,0]+25)&(rgb[:,:,2]>rgb[:,:,1]+5)
        # Include the dark shoe sole, not only its white interior; exclude the blue motion arc.
        shoes=(data[:,:,3]>=210)&~blue
        shoes[:round(b[1]+(b[3]-b[1])*.72)]=False
        ys,_=np.where(shoes);feet.append(int(ys.max()+1) if len(ys) else b[3]);cells.append(cell)
reference=Image.open(ROOT/'src/data/players/student_combos_v1.png').crop((0,0,256,256));b=reference.getbbox()
scale=(b[3]-b[1])/(feet[0]-cells[0].getbbox()[1])
atlas=Image.new('RGBA',(1920,960));frames=[]
for i,cell in enumerate(cells):
    cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST)
    x=160-cell.width//2;y=304-round(feet[i]*scale);b=cell.getbbox()
    assert x+b[0]>0 and y+b[1]>0 and x+b[2]<320 and y+b[3]<320,(i,b,x,y)
    frame=Image.new('RGBA',(320,320));frame.alpha_composite(cell,(x,y));frames.append(frame)
    atlas.alpha_composite(frame,(i%6*320,i//6*320))
atlas.save(ROOT/'src/data/players/student_kick_combo_v1.png')
preview=Image.new('RGB',(960,360),'#25313b');draw=ImageDraw.Draw(preview)
for row,title in enumerate(['Patada frontal','Patada lateral','Remate circular']):
    pose=frames[row*6+2];preview.paste(pose,(row*320,0),pose);draw.text((row*320+12,338),title,fill='white')
preview.save(ROOT/'docs/student-kick-combo-preview.png')
pages=[]
for pose in frames:
    page=Image.new('RGB',(320,340),'#25313b');page.paste(pose,(0,0),pose);pages.append(page)
pages[0].save(ROOT/'docs/student-kick-combo.gif',save_all=True,append_images=pages[1:],duration=100,loop=0)
print(f'18 poses, one scale={scale:.4f}, transparent margin and complete circular arc')
