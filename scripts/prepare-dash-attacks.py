"""Normalize six ImageGen poses to each fighter's native guard, palette and hip axis.

Raw generated PNGs (with provenance) live in prompts/dash-attacks/player_N.png.
No individual frame is stretched to fill a cell. All five moving poses share one
scale; the sixth is the actual original guard to guarantee a matching exit.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'src/data/players'
CONFIG=[
    ('office',1,4,'player_1_slide.png',[.51,.40,.35,.35,.44]),
    ('student',2,4,'player_2_slide.png',[.51,.40,.35,.35,.44]),
    ('teleperforman',3,6,'player_3_slide_clean.png',[.51,.40,.35,.35,.44]),
    ('gymbro',4,4,'player_4_shoulder.png',[.49,.50,.51,.51,.50]),
    ('magolita',5,0,'player_5_slide_clean.png',[.51,.40,.35,.35,.44]),
]

def cut(im):
    im=im.copy();im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0))
    box=im.getbbox()
    assert box,'Empty pose'
    return im.crop(box),box

def build(atlas):
    report={}
    for key,num,idle,dest,hips in CONFIG:
        raw=Image.open(ROOT/f'prompts/dash-attacks/player_{num}.png').convert('RGBA')
        poses=[cut(raw.crop((i%3*raw.width//3,i//3*raw.height//2,(i%3+1)*raw.width//3,(i//3+1)*raw.height//2)))[0] for i in range(6)]
        rect=atlas[key][idle]
        base=Image.open(ART/f'player_{num}.png').convert('RGBA')
        guard,box=cut(base.crop((rect['x'],rect['y'],rect['x']+rect['width'],rect['y']+rect['height'])))
        ratio=guard.height/poses[5].height
        # Use only native guard colors; preserve transparency separately.
        colors=np.asarray(guard);rgb=colors[colors[:,:,3]>0,:3]
        palette=Image.fromarray(rgb.reshape(1,-1,3)).quantize(colors=64,dither=Image.Dither.NONE)
        strip=Image.new('RGBA',(1920,320))
        for i,pose in enumerate(poses):
            if i==5:
                pose=guard
                axis=(rect.get('anchor',None) or NATIVE_ANCHORS[key])-rect['x']-box[0]
            else:
                pose=pose.resize((round(pose.width*ratio),round(pose.height*ratio)),Image.Resampling.NEAREST)
                alpha=pose.getchannel('A')
                pose=pose.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');pose.putalpha(alpha)
                axis=pose.width*hips[i]
            x=round(160-axis);y=280-pose.height
            assert x>1 and y>1 and x+pose.width<319,(key,i,pose.size,x,y)
            strip.alpha_composite(pose,(i*320+x,y))
        strip.save(ART/dest)
        report[key]={'source':f'prompts/dash-attacks/player_{num}.png','output':dest,'scale':ratio,'guardHeight':guard.height,'cell':[320,320],'baseline':279,'anchor':160}
    (ROOT/'docs/dash-attacks-normalization.json').write_text(json.dumps(report,indent=2)+'\n')

NATIVE_ANCHORS={'office':120,'student':94,'teleperforman':85,'gymbro':140,'magolita':160}
if __name__=='__main__':
    # Dump PLAYER_ATLASES with node to avoid duplicating native sprite cuts.
    import subprocess
    result=subprocess.run(['node','--input-type=module','-e',"import {PLAYER_ATLASES as a} from './src/data/playerAtlases.js';console.log(JSON.stringify(a))"],cwd=ROOT,check=True,capture_output=True,text=True)
    build(json.loads(result.stdout))
