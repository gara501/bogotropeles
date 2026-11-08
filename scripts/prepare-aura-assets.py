"""Normalize imagegen art and compile compact keyed sheets for the aura stage."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

root=Path(__file__).resolve().parents[1]
stage=root/'src/scenes/aura'
game=stage/'game'
(game/'players').mkdir(parents=True,exist_ok=True)
jobs=json.loads((root/'output/imagegen/aura-stage-jobs.json').read_text())
background=Image.open(jobs['background']['path']).convert('RGB').resize((384,216),Image.Resampling.NEAREST).resize((1536,864),Image.Resampling.NEAREST)
background.save(stage/'background.png')
raw=Image.open(jobs['crowd']['path']).convert('RGB')
crowd=Image.new('RGB',(384,256),(0,255,0))
for i in range(8):
    cell=raw.crop(((i%4)*384,(i//4)*512,(i%4+1)*384,(i//4+1)*512))
    a=np.asarray(cell)
    mask=~((a[:,:,1]>150)&(a[:,:,0]<115)&(a[:,:,2]<115))
    y,x=np.where(mask)
    crop=cell.crop((x.min(),y.min(),x.max()+1,y.max()+1))
    width=min(88,round(crop.width/crop.height*100))
    small=crop.resize((width,100),Image.Resampling.NEAREST)
    crowd.paste(small,((i%4)*96+(96-width)//2,(i//4)*128+20))
crowd=crowd.quantize(colors=48,dither=Image.Dither.NONE).convert('RGB')
def alpha(im):
    a=np.array(im.convert('RGBA'))
    key=(a[:,:,1]>150)&(a[:,:,0]<115)&(a[:,:,2]<115)
    a[key]=(0,0,0,0)
    return Image.fromarray(a)
alpha(crowd).save(game/'crowd.png')
crowd.resize((1536,1024),Image.Resampling.NEAREST).save(stage/'npc_aura.png')
moves=['six-seven','boat-paddle-dance','mewing','chen-chupas','sigma-finish']
characters=['office','student','teleperforman','gymbro','magolita']
imports=[]
entries=[]
for c in characters:
    for m in moves:
        source=root/'output/imagegen'/('gomelo-'+m+'.png') if c=='office' else root/'output/imagegen/other-players'/('universitaria' if c=='student' else c)/(m+'.png')
        target=game/'players'/(c+'-'+m+'.png')
        alpha(Image.open(source).resize((384,256),Image.Resampling.NEAREST)).save(target)
        name='asset'+str(len(entries))
        imports.append(f"import {name} from '../scenes/aura/game/players/{c}-{m}.png?url';")
        entries.append(f"  'aura-{c}-{m}':{name},")
for m in ['idle-taunt','crowd-hype','defeat']:
    source=root/'src/data/enemies'/('gordo_aura_'+m.replace('-','_')+'.png')
    alpha(Image.open(source).resize((384,256),Image.Resampling.NEAREST)).save(game/('gordo-'+m+'.png'))
(root/'src/data/auraPlayerAssets.js').write_text('\n'.join(imports)+'\nexport const AURA_PLAYER_ASSETS={\n'+'\n'.join(entries)+'\n};\n')
(stage/'asset-manifest.json').write_text(json.dumps({'generator':'built-in image_gen','references':['ejemplos/granestacion.jpg','ejemplos/aura2.jpg'],'prompts':'output/imagegen/aura-stage-jobs.json','background':[1536,864],'crowd':{'count':8,'runtimeCell':[96,128],'baseline':120},'fighters':{'runtimeCell':[128,256],'baseline':225,'standingBody':140},'rival':'El Gordo del Aura'},indent=2))
print('Aura assets ready: plaza, 8 NPCs, 25 player emotes, 3 rival animations.')
if (stage/'player-quality.json').exists():
    import subprocess,sys
    subprocess.run([sys.executable,str(root/'scripts/prepare-aura-quality.py')],check=True)
