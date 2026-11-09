"""Normalize the two generated weapon families without clipping cords or motion arcs."""
from pathlib import Path
import json,sys
import numpy as np
from scipy.ndimage import label,find_objects
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
reference=Image.open(ROOT/'src/data/players/teleperforman_combos_v1.png').crop((0,0,256,256))
rb=reference.getbbox();body_height=rb[3]-rb[1]
frames=[];report=[]
for family,path in enumerate(sys.argv[1:3]):
    source=Image.open(path).convert('RGBA');pixels=np.array(source)
    assert (pixels[:,:,3]==0).mean()>.3,'true alpha required'
    ids,_=label(pixels[:,:,3]>32,structure=np.ones((3,3)))
    sizes=np.bincount(ids.ravel());parts=[]
    for index,box in enumerate(find_objects(ids),1):
        if box is None or sizes[index]<1500:continue
        ys,xs=box;data=pixels[box].copy();data[:,:,3]=np.where(ids[box]==index,data[:,:,3],0)
        parts.append((xs.start,ys.start,Image.fromarray(data)))
    assert len(parts)==18,(path,len(parts))
    parts.sort(key=lambda p:p[1]+p[2].height)
    ordered=[]
    for row in range(3):ordered.extend(sorted(parts[row*6:row*6+6],key=lambda p:p[0]))
    # The generated PPP guard had a face about 25% larger in area than the native
    # idle. A shared 0.9 correction keeps all eighteen bodies and cables coherent.
    scale=body_height/ordered[0][2].height*(.9 if family==0 else 1)
    for i,(left,top,pose) in enumerate(ordered):
        data=np.array(pose);rgb=data[:,:,:3].astype(int)
        # A blue floor arc can extend below the sole; align the shoes instead.
        dark=(data[:,:,3]>32)&(rgb.max(axis=2)<105)
        dark[:int(pose.height*.7)]=False
        ys,_=np.where(dark);foot=int(ys.max()+1) if len(ys) else pose.height
        axis=(i%6+.5)*source.width/6
        x=round(192-(axis-left)*scale);y=368-round(foot*scale)
        if family==1 and i==7:y-=14
        pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST)
        assert x>0 and y>0 and x+pose.width<384 and y+pose.height<384,(family,i,x,y,pose.size)
        frame=Image.new('RGBA',(384,384));frame.alpha_composite(pose,(x,y));frames.append(frame)
        report.append({'family':'PPP' if family==0 else 'KKK','pose':i,'scale':round(scale,5),'bounds':frame.getbbox(),'shoeBaseline':368-(14 if family==1 and i==7 else 0)})
atlas=Image.new('RGBA',(2304,2304))
for i,frame in enumerate(frames):atlas.alpha_composite(frame,(i%6*384,i//6*384))
atlas.save(ROOT/'src/data/players/teleperforman_weapon_combos_v1.png')
preview=Image.new('RGB',(1152,820),'#25313b');draw=ImageDraw.Draw(preview)
for family,names in enumerate([['Latigazo recto','Latigazo bajo','Remate en zancada'],['Telefono ascendente','Giro en tirabuzon','Telefono contra el suelo']]):
    for row,title in enumerate(names):
        frame=frames[family*18+row*6+2];preview.paste(frame,(row*384,family*410),frame)
        draw.text((row*384+12,family*410+390),title,fill='white')
preview.save(ROOT/'docs/teleperforman-weapon-combos-preview.png')
for family,name in enumerate(['ppp','kkk']):
    pages=[]
    for frame in frames[family*18:family*18+18]:
        page=Image.new('RGB',(384,384),'#25313b');page.paste(frame,(0,0),frame);pages.append(page)
    pages[0].save(ROOT/f'docs/teleperforman-{name}-combo.gif',save_all=True,append_images=pages[1:],duration=130 if family==0 else 100,loop=0)
(ROOT/'docs/teleperforman-weapon-art-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('36 complete poses; shared body height',body_height,'; transparent margins and preserved arcs')
