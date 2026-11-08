"""Normalize generated candle sellers, rock cutouts and rough stair material."""
from pathlib import Path
from PIL import Image
import numpy as np
import argparse, shutil

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/monserrate/source'
GAME=SOURCE.parent/'game'

def sprite(image,size,height,baseline):
    a=np.array(image.convert('RGBA'));a[:,:,3]=np.where(a[:,:,3]>=128,255,0)
    image=Image.fromarray(a);image=image.crop(image.getbbox())
    scale=min(height/image.height,(size[0]-24)/image.width)
    image=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.NEAREST)
    out=Image.new('RGBA',size);out.alpha_composite(image,((size[0]-image.width)//2,baseline-image.height));return out

def main():
    parser=argparse.ArgumentParser()
    for kind in ['vendors','rocks','roughstone']:parser.add_argument('--'+kind)
    args=parser.parse_args()
    for kind in ['vendors','rocks','roughstone']:
        if getattr(args,kind):shutil.copy2(getattr(args,kind),SOURCE/f'{kind}-v3.png')
    for kind in ['vendors','rocks']:
        path=SOURCE/f'{kind}-v3.png'
        if not path.exists():continue
        image=Image.open(path);size=(192,256) if kind=='vendors' else (256,384)
        sheet=Image.new('RGBA',(size[0]*4,size[1]))
        cuts=[0,384,768,1152,1536] if kind=='vendors' else [0,370,728,1110,1536]
        for i in range(4):
            crop=image.crop((cuts[i],0,cuts[i+1],image.height))
            height=208 if kind=='vendors' else 340 if i<2 else 180
            frame=sprite(crop,size,height,240 if kind=='vendors' else 384)
            sheet.alpha_composite(frame,(size[0]*i,0))
        sheet.save(GAME/f'{kind}.png')
    if (SOURCE/'roughstone-v3.png').exists():
        Image.open(SOURCE/'roughstone-v3.png').convert('RGB').resize((256,128),Image.Resampling.NEAREST).save(GAME/'rough-stone.png')

if __name__=='__main__':main()
