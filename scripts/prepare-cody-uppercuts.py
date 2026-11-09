"""Normalize the generated five-fighter uppercut atlas, keeping feet and body scale stable."""
import argparse
from pathlib import Path
from PIL import Image

def isolate(cell):
    w,h=cell.size
    alpha=cell.getchannel('A').point(lambda a:255 if a>=210 else 0)
    pixels=alpha.tobytes();seen=set();parts=[]
    for seed,value in enumerate(pixels):
        if not value or seed in seen:continue
        pending=[seed];seen.add(seed);part=[]
        while pending:
            n=pending.pop();part.append(n);x,y=n%w,n//w
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    nx,ny=x+dx,y+dy;j=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and pixels[j] and j not in seen:
                        seen.add(j);pending.append(j)
        parts.append(part)
    body=max(parts,key=len);assert len(body)>1500
    mask=bytearray(w*h)
    for n in body:mask[n]=255
    cell.putalpha(Image.frombytes('L',(w,h),bytes(mask)))
    return cell

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--gymbro-kicks', action='store_true')
args = parser.parse_args()
source = Image.open(args.source).convert('RGBA')
keys=['gymbro']*3 if args.gymbro_kicks else ['office','student','teleperforman','gymbro','magolita']
result = Image.new('RGBA', (1024, len(keys)*256))
# The generator spaces rows visually; equal-height crops would cut off shoes.
alpha=source.getchannel('A');bands=[];start=None
for y in range(source.height+1):
    count=0 if y==source.height else sum(a>=210 for a in alpha.crop((0,y,source.width,y+1)).tobytes())
    if count>8 and start is None:start=y
    if count<=8 and start is not None:
        if y-start>20:bands.append((max(0,start-2),min(source.height,y+2)))
        start=None
assert len(bands)==len(keys),bands
kick_scale=None
for row, key in enumerate(keys):
    top,bottom=bands[row]
    cells = [isolate(source.crop((round(col*source.width/4), top,
                                  round((col+1)*source.width/4), bottom))) for col in range(4)]
    original = Image.open(ROOT / f'src/data/players/{key}_combos_v1.png')
    guard = original.crop((0, 0, 256, 256)).getbbox()
    # Recovery is standing with bent elbow, so use its body height rather than the raised-fist extent.
    recovery = cells[3].getbbox()
    scale = (guard[3]-guard[1]) / (recovery[3]-recovery[1])
    if args.gymbro_kicks:
        if kick_scale is None:
            contact=cells[2].getbbox()
            kick_scale=(guard[3]-guard[1])/(contact[3]-contact[1])
        scale=kick_scale
    for col, cell in enumerate(cells):
        cell = cell.resize((round(cell.width*scale), round(cell.height*scale)), Image.Resampling.NEAREST)
        bounds = cell.getbbox()
        assert bounds[3]-bounds[1] < 246
        result.alpha_composite(cell, (col*256+128-cell.width//2, row*256+248-bounds[3]))
if args.gymbro_kicks:
    result.save(ROOT / 'src/data/players/gymbro_mobile_kicks_v1.png')
else:
    result.save(ROOT / 'docs/cody-uppercuts-preview.png')
    for row,key in enumerate(keys):
        result.crop((0,row*256,1024,(row+1)*256)).save(ROOT / f'src/data/players/{key}_uppercut_v1.png')
