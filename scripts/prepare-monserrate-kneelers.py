"""Normalize the generated rear-view kneeling family for PixelLab animation."""
from pathlib import Path
from PIL import Image
import numpy as np
import argparse, shutil

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/monserrate/source'
parser=argparse.ArgumentParser();parser.add_argument('--source');args=parser.parse_args()
if args.source:shutil.copy2(args.source,SOURCE/'kneelers-reference.png')
sheet=Image.open(SOURCE/'kneelers-reference.png').convert('RGBA')
folder=SOURCE/'references';folder.mkdir(exist_ok=True)
for i in range(4):
    frame=sheet.crop((i*sheet.width//4,0,(i+1)*sheet.width//4,sheet.height))
    a=np.array(frame);a[:,:,3]=np.where(a[:,:,3]>=128,255,0);frame=Image.fromarray(a);frame=frame.crop(frame.getbbox())
    scale=min(136/frame.height,176/frame.width)
    frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.NEAREST)
    out=Image.new('RGBA',(192,256));out.alpha_composite(frame,((192-frame.width)//2,240-frame.height))
    out.save(folder/f'kneeler-{i}.png')
