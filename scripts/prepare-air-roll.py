"""Normalize generated air-roll art without per-pose zoom or digital rotation."""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label,binary_erosion
ROOT=Path(__file__).resolve().parent.parent
HEIGHTS={'office':157,'student':181,'teleperforman':178,'gymbro':198,'magolita':153}
loops={};report={}
for key,target in HEIGHTS.items():
 raw=Image.open(ROOT/f'prompts/air-roll/{key}-source.png').convert('RGBA');cells=[]
 for i in range(12):
  x0=round(i%4*raw.width/4);x1=round((i%4+1)*raw.width/4);y0=round(i//4*raw.height/3);y1=round((i//4+1)*raw.height/3)
  a=np.array(raw.crop((x0,y0,x1,y1)));mask=a[:,:,3]>=210
  rgb=a[:,:,:3];high=rgb.max(axis=2);low=rgb.min(axis=2);fringe=(high>=180)&(low<=25)&((high.astype(float)-low)/np.maximum(high,1)>.9)
  for _ in range(3):mask &= ~(fringe & ~binary_erosion(mask,structure=np.ones((3,3))))
  ids,_=label(mask,structure=np.ones((3,3)));counts=np.bincount(ids.ravel());counts[0]=0;mask=ids==counts.argmax();assert mask.sum()>1500
  a[:,:,3]=np.where(mask,255,0);im=Image.fromarray(a);cells.append(im.crop(im.getbbox()))
 factor=target/cells[0].height;strip=Image.new('RGBA',(3072,256));poses=[];sizes=[]
 pivot=248-target/2
 for i,im in enumerate(cells):
  im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
  left=128-im.width//2;top=round(pivot-im.height/2)
  assert left>=6 and top>=6 and left+im.width<=250 and top+im.height<=249,(key,i,im.size,left,top)
  cell=Image.new('RGBA',(256,256));cell.alpha_composite(im,(left,top));poses.append(cell);strip.alpha_composite(cell,(i*256,0));sizes.append({'pose':i,'width':im.width,'height':im.height,'left':left,'top':top})
 strip.save(ROOT/f'src/data/players/{key}_air_roll_v1.png');loops[key]=poses;report[key]={'scale':factor,'nativeGuardHeight':target,'pivotY':pivot,'baseline':248,'poses':sizes}
 print(key,'12 poses',round(factor,3))
(ROOT/'docs/air-roll-validation.json').write_text(json.dumps(report,indent=2)+'\n')
frames=[]
for tick in range(48):
 page=Image.new('RGB',(1100,750),'#23303a');d=ImageDraw.Draw(page)
 for col,(key,poses) in enumerate(loops.items()):
  d.text((col*220+12,12),key,fill='white')
  for row,order in enumerate([list(range(8)),[0,6,5,4,3,2,1,7],[8,9,10,11]]):
   progress=(tick%24)/24;i=min(len(order)-1,int(progress*len(order)));pose=poses[order[i]]
   # All cells use the same baseline. The parabola is just a preview of world z.
   lift=round(math.sin(progress*math.pi)*38) if row<2 else 30
   d.line((col*220,row*240+245,(col+1)*220,row*240+245),fill='#43525e');small=pose.resize((210,210),Image.Resampling.NEAREST)
   page.paste(small,(col*220+5,row*240+40-lift),small)
   d.text((col*220+8,row*240+24),['Rollo adelante','Rollo atras','Patada aerea'][row],fill='#e5dba0')
 frames.append(page)
frames[0].save(ROOT/'docs/all-players-air-roll.gif',save_all=True,append_images=frames[1:],duration=50,loop=0)
frames[7].save(ROOT/'docs/all-players-air-roll.png')
