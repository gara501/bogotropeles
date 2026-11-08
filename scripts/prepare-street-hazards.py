"""Normalize ImageGen street decals; keep a common floor pivot and pothole rim.

Source PNGs with provenance: prompts/street-hazards/{pothole,manhole}.png.
Runtime cells are 256x192, with floor/collision center at (128,140), rendered at .5x.
"""
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'prompts/street-hazards'
DEST=ROOT/'src/data/hazards'

def hard_alpha(image):
    image=image.copy();image.putalpha(image.getchannel('A').point(lambda a:255 if a>=160 else 0))
    return image

def row_cells(name,count=3):
    im=Image.open(SOURCE/f'{name}.png').convert('RGBA')
    return [hard_alpha(im.crop((round(i*im.width/count),0,round((i+1)*im.width/count),im.height))) for i in range(count)]

def at_pivot(im,pivot,ratio):
    # Keep coordinates shared instead of fitting each pose's visible bounds.
    width,height=round(im.width*ratio),round(im.height*ratio)
    scaled=im.resize((width,height),Image.Resampling.NEAREST)
    box=scaled.getbbox();assert box
    pose=scaled.crop(box)
    x=128+box[0]-round(pivot[0]*width/im.width);y=140+box[1]-round(pivot[1]*height/im.height)
    assert x>=2 and y>=2 and x+pose.width<=254 and y+pose.height<=190,(box,x,y,pose.size)
    out=Image.new('RGBA',(256,192));out.alpha_composite(pose,(x,y));return out

def save_strip(name,poses,colors=40):
    strip=Image.new('RGBA',(256*len(poses),192))
    # Shared limited palette, nearest-neighbor, hard alpha: no chroma/AA fringe.
    opaque=np.concatenate([np.asarray(p)[np.asarray(p)[:,:,3]>0,:3] for p in poses])
    palette=Image.fromarray(opaque.reshape(1,-1,3)).quantize(colors=colors,dither=Image.Dither.NONE)
    for i,pose in enumerate(poses):
        alpha=pose.getchannel('A');pose=pose.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');pose.putalpha(alpha)
        strip.alpha_composite(pose,(i*256,0))
    strip.save(DEST/f'{name}.png')

def pothole():
    dry,wet,splash=row_cells('pothole')
    # Copy the exact original rim/outline, only replace its puddle interior.
    interior=Image.new('L',dry.size);ImageDraw.Draw(interior).polygon([(169,532),(233,516),(490,518),(573,546),(537,581),(448,594),(255,593),(143,566)],fill=255)
    wet=Image.composite(wet,dry,interior)
    arr=np.asarray(splash);yy=np.indices(arr.shape[:2])[0]
    blue=(arr[:,:,2].astype(float)>arr[:,:,0]*1.08)&(arr[:,:,2]>=arr[:,:,1]*.95)&(arr[:,:,2]>80)&(arr[:,:,3]>=160)&(yy<554)
    mask=Image.fromarray(np.maximum(np.asarray(interior),blue.astype('uint8')*255))
    splash=Image.composite(splash,wet,mask)
    save_strip('pothole',[at_pivot(p,(355,540),.39) for p in [dry,wet,splash]])

def manhole():
    poses=row_cells('manhole');out=[]
    # Hole, detached lid and upright cone are separate sprites, not animation states.
    for i,im in enumerate(poses):
        box=im.getbbox();assert box
        if i==0:
            pivot=((box[0]+box[2])/2,(box[1]+box[3])/2)
            ratio=156/(box[2]-box[0])
        else:
            pivot=((box[0]+box[2])/2,box[3]-1 if i==2 else (box[1]+box[3])/2)
            ratio=(52/(box[3]-box[1])) if i==2 else 68/(box[2]-box[0])
        out.append(at_pivot(im,pivot,ratio))
    save_strip('manhole',out)

def manhole_v2():
    base,impact,lid,cone=row_cells('manhole-v2',4)
    # Keep the worn safety paint yellow rather than merging it into cone/rust orange.
    arr=np.array(base);yy,xx=np.indices(arr.shape[:2]);rgb=arr[:,:,:3].astype(float)
    paint=(xx>180)&(xx<360)&(yy>500)&(arr[:,:,3]>0)&(rgb[:,:,0]>120)&(rgb[:,:,1]>75)&(rgb[:,:,0]>rgb[:,:,1]*1.3)&(rgb[:,:,2]<90)
    arr[:,:,1][paint]=(rgb[:,:,0][paint]*.8).astype('uint8');arr[:,:,2][paint]=(rgb[:,:,0][paint]*.25).astype('uint8')
    base=Image.fromarray(arr)
    # Correct the draft's five-pixel drift before extracting the rising effect.
    aligned=Image.new('RGBA',base.size);aligned.alpha_composite(impact,(5,0))
    arr=np.asarray(aligned);yy,xx=np.indices(arr.shape[:2])
    mask=Image.fromarray(((xx>=111)&(xx<=460)&(yy<500)&(arr[:,:,3]>0)).astype('uint8')*255)
    impact=Image.composite(aligned,base,mask)
    box=base.getbbox();pivot=((box[0]+box[2])/2,(box[1]+box[3])/2);ratio=156/(box[2]-box[0])
    out=[at_pivot(im,pivot,ratio) for im in [base,impact]]
    box=lid.getbbox();out.append(at_pivot(lid,((box[0]+box[2])/2,(box[1]+box[3])/2),68/(box[2]-box[0])))
    arr=np.asarray(cone);rgb=arr[:,:,:3].astype(float)
    orange=(rgb[:,:,0]>100)&(rgb[:,:,0]>rgb[:,:,1]*1.4)&(rgb[:,:,0]>rgb[:,:,2]*1.8)&(arr[:,:,3]>0)
    xs=np.nonzero(orange)[1];box=cone.getbbox()
    # Anchor on the rubber base under the cone, not the detached tape to its side.
    out.append(at_pivot(cone,((xs.min()+xs.max())/2,box[3]-1),52/(box[3]-box[1])))
    save_strip('manhole-v2',out,colors=64)

if __name__=='__main__':
    DEST.mkdir(exist_ok=True)
    pothole();manhole();manhole_v2()
