"""Normalize generated rear-view reference families. No authored sprite pixels."""
from pathlib import Path
import argparse, shutil, json
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/monserrate/source'
GAME=SOURCE.parent/'game'
PLAYERS=['office','student','teleperforman','gymbro','magolita']

def cutout(im):
    a=np.array(im.convert('RGBA'))
    green=(a[:,:,1]>a[:,:,0]*1.25)&(a[:,:,1]>a[:,:,2]*1.25)&(a[:,:,1]>85)
    a[:,:,3]=np.where(green,0,255)
    labels,n=ndimage.label(a[:,:,3]>0)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    keep=sizes>max(20,sizes.max()*.002)
    a[:,:,3]=np.where(keep[labels],a[:,:,3],0)
    im=Image.fromarray(a);return im.crop(im.getbbox())

def normalize(im,height=208):
    im=cutout(im);scale=min(height/im.height,176/im.width)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    out=Image.new('RGBA',(192,256));out.alpha_composite(im,((192-im.width)//2,240-im.height));return out

def main():
    p=argparse.ArgumentParser();p.add_argument('--background');p.add_argument('--players');p.add_argument('--hikers');args=p.parse_args()
    SOURCE.mkdir(parents=True,exist_ok=True);GAME.mkdir(parents=True,exist_ok=True)
    refs=SOURCE/'references';refs.mkdir(exist_ok=True)
    for name in ['background','players','hikers']:
        if getattr(args,name):shutil.copy2(getattr(args,name),SOURCE/f'{name}.png')
    bg=Image.open(SOURCE/'background.png').convert('RGB').resize((960,540),Image.Resampling.NEAREST)
    bg.save(GAME/'background.png')
    # A real stone crop from the generated source drives the moving floor.
    bg.crop((350,462,610,530)).resize((256,128),Image.Resampling.NEAREST).save(GAME/'stone.png')
    sheet=Image.open(SOURCE/'players.png')
    for i,name in enumerate(PLAYERS):
        frame=normalize(sheet.crop((round(i*sheet.width/5),0,round((i+1)*sheet.width/5),sheet.height)))
        frame.save(refs/f'{name}.png')
    sheet=Image.open(SOURCE/'hikers.png')
    for i in range(8):
        x,y=i%4,i//4
        frame=normalize(sheet.crop((round(x*sheet.width/4),y*sheet.height//2,round((x+1)*sheet.width/4),(y+1)*sheet.height//2)))
        frame.save(refs/f'hiker-{i}.png')
    board=Image.new('RGBA',(192*7,256*2),(35,48,43,255))
    for i,path in enumerate(refs.glob('*.png')):board.alpha_composite(Image.open(path),(i%7*192,i//7*256))
    board.save(SOURCE/'references.png')
    (SOURCE/'manifest.json').write_text(json.dumps({'stage':'Monserrate · Ascenso','art':'AI generated with image_gen from user Monserrate photo and existing player identity references; rear-view motion with PixelLab PixMiniMax','frameSize':[192,256],'bodyHeight':208,'baseline':240,'players':PLAYERS,'playerFrames':8,'npcVariants':8,'npcFrames':4,'campaignLevel':5},ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':main()
