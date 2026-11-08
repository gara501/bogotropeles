"""Extract the existing metal railing pixels for foreground occlusion.

No new artwork: retain source RGB and isolate neutral, blue-gray metal only
inside the two railing corridors of the original background.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'src/scenes/monserrate/game'
im=Image.open(GAME/'background-v2.png').convert('RGBA')
a=np.array(im);rgb=a[:,:,:3].astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
y,x=np.mgrid[:540,:960];depth=np.maximum(0,(y-140)/400)
outer=480-720*depth;inner=480-405*depth
left=(x>=outer-20)&(x<=inner+20)
right=(x<=960-outer+20)&(x>=960-inner-20)
corridor=(y>=140)&(left|right)
neutral=(b>=r*.9)&(b>=g*.88)&(g>=r*.92)&((rgb.max(2)-rgb.min(2))<45)&(rgb.max(2)<210)
mask=corridor&neutral
# Recover the dark, stepped exterior contour immediately around the metal.
edge=ndimage.binary_dilation(mask,iterations=1)&corridor&(rgb.max(2)<65)
labels,_=ndimage.label(mask|edge,np.ones((3,3)))
sizes=np.bincount(labels.ravel());sizes[0]=0
# Both railings meet at the vanishing point. Discard disconnected forest/stone flecks.
a[:,:,3]=np.where(labels==sizes.argmax(),255,0)
Image.fromarray(a).save(GAME/'fence.png')
print('Foreground railing pixels:',int(np.count_nonzero(a[:,:,3])))
