"""Compile coherent aura families without the old 4px grid / hard-coded 16-color palette."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, shutil
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
STAGE=ROOT/'src/scenes/aura'
SOURCE=STAGE/'source/players-v2'
DEST=STAGE/'game/players-v2'
SOURCE.mkdir(parents=True,exist_ok=True);DEST.mkdir(parents=True,exist_ok=True)
jobsfile=ROOT/'output/imagegen/aura-quality/jobs.json'
jobs=json.loads(jobsfile.read_text()) if jobsfile.exists() else json.loads((STAGE/'player-quality.json').read_text())['prompts']
moves=['walk','six-seven','boat-paddle-dance','mewing','chen-chupas','sigma-finish']
def foreground(a):
    rgb=a[:,:,:3].astype(np.int32)
    return ~((rgb[:,:,1]>45)&(rgb[:,:,1]>rgb[:,:,0]*1.45)&(rgb[:,:,1]>rgb[:,:,2]*1.45))

imports=[];entries=[];report=[]
for job in jobs:
    character=job['character'];source=SOURCE/(character+'.png')
    if not source.exists():shutil.copyfile(job['path'],source)
    im=Image.open(source).convert('RGB');w,h=im.size
    poses=[]
    for row in range(6):
        for col in range(3):
            cell=im.crop((round(col*w/3),round(row*h/6),round((col+1)*w/3),round((row+1)*h/6)))
            a=np.array(cell.convert('RGBA'));mask=foreground(a)
            labels,n=ndimage.label(mask)
            sizes=np.bincount(labels.ravel());sizes[0]=0
            mask=labels==sizes.argmax()
            y,x=np.where(mask)
            a[~mask]=(0,0,0,0)
            crop=Image.fromarray(a).crop((x.min(),y.min(),x.max()+1,y.max()+1))
            poses.append(crop)
    # One scale for the WHOLE character. A leaning/crouching pose keeps its anatomy.
    scale=280/poses[2].height
    shared=Image.new('RGBA',(768,512*6))
    for i,pose in enumerate(poses):
        size=(round(pose.width*scale),round(pose.height*scale))
        assert size[0]<=248 and size[1]<=440,(character,i,size)
        pose=pose.resize(size,Image.Resampling.NEAREST)
        shared.alpha_composite(pose,((i%3)*256+(256-size[0])//2,(i//3)*512+450-size[1]))
    # A shared adaptive palette preserves the source's actual skin and clothing colors.
    alpha=shared.getchannel('A')
    shared=shared.convert('RGB').quantize(colors=192,dither=Image.Dither.NONE).convert('RGBA')
    shared.putalpha(alpha)
    for row,move in enumerate(moves):
        path=DEST/(character+'-'+move+'.png')
        strip=shared.crop((0,row*512,768,(row+1)*512));strip.save(path)
        var='quality'+str(len(entries));imports.append(f"import {var} from '../scenes/aura/game/players-v2/{character}-{move}.png?url';")
        entries.append(f"  'aura-{character}-{move}':{var},")
    if (SOURCE/(character+'-walk.png')).exists():shutil.copyfile(SOURCE/(character+'-walk.png'),DEST/(character+'-walk.png'))
    # Neutral first frame for a proper eight-pose PixelLab entrance gait.
    neutral=shared.crop((512,0,768,512))
    box=neutral.getbbox();neutral=neutral.crop(box)
    neutral=neutral.resize((round(neutral.width*184/280),184),Image.Resampling.NEAREST)
    start=Image.new('RGBA',(224,256));start.alpha_composite(neutral,((224-neutral.width)//2,240-neutral.height))
    start.save(SOURCE/(character+'-walk-reference.png'))
    walkstrip=DEST/(character+'-walk.png')
    idle=DEST/(character+'-idle.png');shared.crop((512,0,768,512)).save(idle)
    var='quality'+str(len(entries));imports.append(f"import {var} from '../scenes/aura/game/players-v2/{character}-idle.png?url';");entries.append(f"  'aura-{character}-idle':{var},")
    report.append({'character':character,'source':str(source.relative_to(ROOT)),'referenceHeight':280,'scale':scale,'neutralBounds':list(shared.crop((512,0,768,512)).getbbox())})
(ROOT/'src/data/auraPlayerAssets.js').write_text('\n'.join(imports)+'\nexport const AURA_PLAYER_ASSETS={\n'+'\n'.join(entries)+'\n};\n')
(STAGE/'player-quality.json').write_text(json.dumps({'mode':'built-in image_gen','grid':[3,6],'runtimeFrame':[256,512],'baseline':450,'referenceHeight':280,'characters':report,'prompts':[{'character':j['character'],'prompt':j['prompt']} for j in jobs]},indent=2))
manifest=STAGE/'asset-manifest.json'
if manifest.exists():
    metadata=json.loads(manifest.read_text())
    metadata['fighters']={'players':{'runtimeCell':[256,512],'baseline':450,'referenceHeight':280},'entranceWalk':{'runtimeCell':[224,256],'baseline':240,'referenceHeight':184,'frames':8},'rival':{'runtimeCell':[128,256],'baseline':225,'referenceHeight':140}}
    manifest.write_text(json.dumps(metadata,indent=2))
print(json.dumps(report,indent=2))
if (STAGE/'cast-quality.json').exists():
    import subprocess,sys
    subprocess.run([sys.executable,str(ROOT/'scripts/prepare-aura-cast-quality.py')],check=True)
