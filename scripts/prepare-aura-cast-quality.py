"""Recover the approved rival/crowd source art at the player-v2 rendering density."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json,shutil

ROOT=Path(__file__).resolve().parents[1]
STAGE=ROOT/'src/scenes/aura'
SOURCE=STAGE/'source/cast-v2'
DEST=STAGE/'game/cast-v2'
SOURCE.mkdir(parents=True,exist_ok=True);DEST.mkdir(parents=True,exist_ok=True)

def extract(cell):
    a=np.array(cell.convert('RGBA'));rgb=a[:,:,:3].astype(np.int32)
    fg=~((rgb[:,:,1]>45)&(rgb[:,:,1]>rgb[:,:,0]*1.45)&(rgb[:,:,1]>rgb[:,:,2]*1.45))
    labels,_=ndimage.label(fg);sizes=np.bincount(labels.ravel());sizes[0]=0
    fg=labels==sizes.argmax();a[~fg]=(0,0,0,0)
    y,x=np.where(fg);box=(int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1))
    return Image.fromarray(a),box

def palette(im,colors=256):
    alpha=im.getchannel('A')
    result=im.convert('RGB').quantize(colors=colors,dither=Image.Dither.NONE).convert('RGBA')
    result.putalpha(alpha);return result

jobfile=ROOT/'output/imagegen/gordo-aura-jobs.json'
if jobfile.exists():
    original=json.loads(jobfile.read_text())
    for job in original['jobs']:
        path=SOURCE/(job['slug']+'.png')
        if not path.exists():shutil.copyfile(job['path'],path)
    (SOURCE/'rival-provenance.json').write_text(json.dumps({'mode':original['mode'],'jobs':[{'slug':j['slug'],'prompt':j['prompt']} for j in original['jobs']]},indent=2))
crowd_path=SOURCE/'crowd.png'
if not crowd_path.exists():
    job=json.loads((ROOT/'output/imagegen/aura-stage-jobs.json').read_text())['crowd']
    shutil.copyfile(job['path'],crowd_path)
    (SOURCE/'crowd-provenance.json').write_text(json.dumps({'mode':'built-in image_gen','prompt':job['prompt']},indent=2))

names=['rival-idle-taunt','rival-crowd-hype','rival-defeat']
family=Image.new('RGBA',(768,512*3))
records=[]
for row,name in enumerate(names):
    im=Image.open(SOURCE/(name+'.png')).convert('RGBA')
    for col in range(3):
        cell=im.crop((round(col*im.width/3),0,round((col+1)*im.width/3),im.height))
        clean,box=extract(cell)
        if row==0 and col==0:scale=280/(box[3]-box[1])
        a=np.array(clean);rgb=a[:,:,:3].astype(np.int32)
        red=(a[:,:,3]>128)&(rgb[:,:,0]>75)&(rgb[:,:,0]>rgb[:,:,1]*2.6)&(rgb[:,:,0]>rgb[:,:,2]*1.5)
        red&=(rgb[:,:,1]-rgb[:,:,2])<(rgb[:,:,0]-rgb[:,:,2])*.18
        red[:int(cell.height*.4)]=False
        # Socks/toes and tiny warm skin highlights can share a red hue.
        # Keep the large cloth regions, not those detached color fragments.
        red_labels,_=ndimage.label(red);red_sizes=np.bincount(red_labels.ravel());red_sizes[0]=0
        red=red_sizes[red_labels]>=max(200,red_sizes.max()*.1)
        ry,rx=np.where(red);assert len(rx)>100
        hip=(int(rx.min())+int(rx.max())+1)/2
        crop=clean.crop(box);w,h=round(crop.width*scale),round(crop.height*scale)
        x=128+round((box[0]-hip)*scale);y=450-h
        assert x>=4 and x+w<=252 and y>=8,(name,col,x,y,w,h)
        family.alpha_composite(crop.resize((w,h),Image.Resampling.NEAREST),(col*256+x,row*512+y))
        records.append({'animation':name,'frame':col,'hip':hip,'height':h})
family=palette(family)
for row,name in enumerate(names):family.crop((0,row*512,768,(row+1)*512)).save(DEST/('gordo-'+name.replace('rival-','')+'.png'))

im=Image.open(crowd_path).convert('RGBA');crowd=Image.new('RGBA',(192*4,256*2))
for i in range(8):
    col,row=i%4,i//4
    cell=im.crop((round(col*im.width/4),round(row*im.height/2),round((col+1)*im.width/4),round((row+1)*im.height/2)))
    clean,box=extract(cell);crop=clean.crop(box)
    if i==0:crowd_scale=200/crop.height
    w,h=round(crop.width*crowd_scale),round(crop.height*crowd_scale)
    assert w<=184 and h<=236,(i,w,h)
    crowd.alpha_composite(crop.resize((w,h),Image.Resampling.NEAREST),(col*192+(192-w)//2,row*256+240-h))
palette(crowd).save(DEST/'crowd.png')

metadata={'source':'approved original image_gen art','rival':{'runtimeCell':[256,512],'referenceHeight':280,'baseline':450,'anchor':'red shorts center','poses':records},'crowd':{'runtimeCell':[192,256],'referenceHeight':200,'baseline':240,'count':8}}
(STAGE/'cast-quality.json').write_text(json.dumps(metadata,indent=2))
manifest=STAGE/'asset-manifest.json'
if manifest.exists():
    data=json.loads(manifest.read_text());data['crowd']=metadata['crowd'];data['fighters']['rival']={k:v for k,v in metadata['rival'].items() if k!='poses'}
    manifest.write_text(json.dumps(data,indent=2))
print('Compiled 9 rival poses and 8 spectator NPCs with full source detail and fixed anchors.')
