from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path.cwd();configs=json.loads((ROOT/'docs/player-scale-config.json').read_text());report={}
for key,c in configs.items():
 imgs=[Image.open(p).convert('RGBA') for p in c['sources']];stack=Image.new('RGBA',(max(im.width for im in imgs),sum(im.height for im in imgs)));off=0
 for im in imgs:stack.paste(im,(0,off));off+=im.height
 a=np.array(stack)
 if c.get('cleanFringes'):
  rgb=a[:,:,:3];hi=rgb.max(axis=2);lo=rgb.min(axis=2);a[(hi>=180)&(lo<=25)&((hi.astype(float)-lo)/np.maximum(hi,1)>=.9),3]=0
 mask=a[:,:,3]>32;labels,n=label(mask);poses=[];metrics=[]
 for i,r in enumerate(c['frameRects']):
  x,y,w,h=[r[n] for n in ('x','y','width','height')];cut=a[y:y+h,x:x+w].copy();ids=labels[y:y+h,x:x+w]
  if c.get('isolateFrames') and i not in c.get('keepDetachedFrames',[]):
   valid=ids[ids>0];largest=np.bincount(valid).argmax() if valid.size else -1;cut[ids!=largest,3]=0
  clip=c.get('frameClips',{}).get(str(i))
  if clip:
   yy,xx=np.indices((h,w));cut[(yy+y<clip['bottom']) & ((xx+x<clip['left'])|(xx+x>clip['right'])),3]=0
  ys,xs=np.where(cut[:,:,3]>32);bbox=(xs.min(),ys.min(),xs.max()+1,ys.max()+1) if len(xs) else (0,0,w,h)
  sc=c.get('frameScales',{}).get(str(i),1);im=Image.fromarray(cut).crop(bbox);im=im.resize((max(1,round(im.width*sc)),max(1,round(im.height*sc))),Image.Resampling.NEAREST);poses.append(im)
  b=np.array(im);skin=(b[:,:,0]>100)&(b[:,:,1]>40)&(b[:,:,0]>b[:,:,1]*1.2)&(b[:,:,0]>b[:,:,2]*1.5)&(b[:,:,3]>32);skin[55:]=False
  lab,_=label(skin);counts=np.bincount(lab.ravel());counts[0]=0;yy,xx=np.where(lab==counts.argmax())
  metrics.append({'frame':i,'width':im.width,'height':im.height,'scale':sc,'upperSkinArea':int(max(counts)),'upperSkinWidth':int(xx.max()-xx.min()+1) if len(xx) else 0,'upperSkinHeight':int(yy.max()-yy.min()+1) if len(yy) else 0})
 groups={'guard':[c['idle']],**c['animations'],**({n:v for n,v in c.get('grab',{}).items() if isinstance(v,list)})}
 chosen=list(dict.fromkeys([c['idle']]+[f for fs in groups.values() for f in [fs[0],fs[-1]]]))
 contact=Image.new('RGB',(1560,280*((len(chosen)+5)//6)),'#23303a');draw=ImageDraw.Draw(contact)
 for j,f in enumerate(chosen):
  im=poses[f];ox=(j%6)*260;oy=(j//6)*280
  contact.paste(im,(ox+130-im.width//2,oy+250-im.height),im);draw.text((ox+8,oy+258),str(f),fill='white')
 contact.save(ROOT/f'docs/{key}-scale-review.png')
 report[key]={'frames':metrics,'groups':groups}
 print(key, {k:[min(metrics[f]['height'] for f in v),max(metrics[f]['height'] for f in v)] for k,v in groups.items()})
(ROOT/'docs/player-scale-audit.json').write_text(json.dumps(report,indent=2))
