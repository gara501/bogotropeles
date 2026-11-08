"""Slice generated forest cutouts; preserve sources and enforce clean pixel alpha."""
from pathlib import Path
from PIL import Image
import numpy as np
import argparse, shutil

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/monserrate/source'
GAME=SOURCE.parent/'game'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--foliage');parser.add_argument('--background');args=parser.parse_args()
    if args.foliage:shutil.copy2(args.foliage,SOURCE/'foliage-v2.png')
    if args.background:shutil.copy2(args.background,SOURCE/'background-v2.png')
    if (SOURCE/'background-v2.png').exists():
        Image.open(SOURCE/'background-v2.png').convert('RGB').resize((960,540),Image.Resampling.NEAREST).save(GAME/'background-v2.png')
    source=Image.open(SOURCE/'foliage-v2.png').convert('RGBA')
    sheet=Image.new('RGBA',(256*6,384))
    for i in range(6):
        x=i%3;top,bottom=(0,620) if i<3 else (620,1024)
        image=source.crop((x*512,top,(x+1)*512,bottom))
        a=np.array(image);a[:,:,3]=np.where(a[:,:,3]>=128,255,0);image=Image.fromarray(a)
        image=image.crop(image.getbbox());scale=min((340 if i<3 else 130)/image.height,232/image.width)
        image=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.NEAREST)
        sheet.alpha_composite(image,(256*i+(256-image.width)//2,384-image.height))
    sheet.save(GAME/'foliage.png')

if __name__=='__main__':main()
