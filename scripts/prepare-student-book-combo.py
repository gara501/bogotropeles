"""Normalize the book swings and select only poses that retain a held book."""
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
assert len(poses)==18,len(poses)
poses.sort(key=lambda p:p[1]);ordered=[]
for row in range(3):ordered.extend(sorted(poses[row*6:row*6+6],key=lambda p:p[0]))
# Two generated follow-throughs opened the hand; omit them instead of showing a disappearing book.
selection=[[0,1,2,4,5],[6,7,8,10,11],[12,13,14,15,17]]
reference=Image.open(ROOT/'src/data/players/student_combos_v1.png').crop((0,0,256,256));b=reference.getbbox()
scale=(b[3]-b[1])/ordered[0][2].height
atlas=Image.new('RGBA',(1600,960));frames=[]
for row,indices in enumerate(selection):
    for col,index in enumerate(indices):
        left,top,pose=ordered[index];axis=(index%6+.5)*source.width/6
        pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST)
        x=round(160-(axis-left)*scale);y=304-pose.height
        assert x>0 and y>0 and x+pose.width<320,(index,x,y,pose.size)
        cell=Image.new('RGBA',(320,320));cell.alpha_composite(pose,(x,y));frames.append(cell)
        atlas.alpha_composite(cell,(col*320,row*320))
atlas.save(ROOT/'src/data/players/student_book_combo_v1.png')
preview=Image.new('RGB',(960,360),'#25313b');draw=ImageDraw.Draw(preview)
for row,title in enumerate(['Giro horizontal','Librazo ascendente','Remate a dos manos']):
    preview.paste(frames[row*5+2],(row*320,20),frames[row*5+2]);draw.text((row*320+12,342),title,fill='white')
preview.save(ROOT/'docs/student-book-combo-preview.png')
pages=[]
for pose in frames:
    page=Image.new('RGB',(320,340),'#25313b');page.paste(pose,(0,0),pose);pages.append(page)
pages[0].save(ROOT/'docs/student-book-combo.gif',save_all=True,append_images=pages[1:],duration=100,loop=0)
print(f'15 complete book poses, one body scale={scale:.4f}, native guard height={b[3]-b[1]}')
