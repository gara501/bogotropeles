"""Normalize all carried-object loops against each fighter's unarmed locomotion."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageOps

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'prompts/held-motion/generation.json').read_text(encoding='utf8'))
reference=json.loads((ROOT/'prompts/held-motion/reference-layout.json').read_text(encoding='utf8'))

def isolate(cell):
    w,h=cell.size
    data=cell.tobytes()
    mask=bytearray(255 if data[i+3]>=210 else 0 for i in range(0,len(data),4))
    # One generated sheet has a pale matte: remove only exterior neutral pixels.
    pending=list(range(w))+list(range((h-1)*w,h*w))+[y*w for y in range(h)]+[y*w+w-1 for y in range(h)]
    seen=set(pending)
    while pending:
        n=pending.pop();r,g,b,_=data[n*4:n*4+4]
        if mask[n] and not (min(r,g,b)>200 and max(r,g,b)-min(r,g,b)<35):
            continue
        mask[n]=0;x,y=n%w,n//w
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            j=ny*w+nx
            if 0<=nx<w and 0<=ny<h and j not in seen:
                seen.add(j);pending.append(j)
    seen=set();parts=[]
    for seed,value in enumerate(mask):
        if not value or seed in seen:continue
        pending=[seed];seen.add(seed);part=[]
        while pending:
            n=pending.pop();part.append(n);x,y=n%w,n//w
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    nx,ny=x+dx,y+dy;j=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and mask[j] and j not in seen:
                        seen.add(j);pending.append(j)
        parts.append(part)
    body=max(parts,key=len);assert len(body)>1500
    result=bytearray(w*h)
    for n in body:result[n]=255
    cell.putalpha(Image.frombytes('L',(w,h),bytes(result)))
    return cell

report={}
for asset in manifest['assets']:
    key,item=asset['character'],asset['item'];cfg=reference[key]
    source=asset['source']
    if key=='magolita' and item=='panela':source='prompts/held-motion/magolita-panela-clean-source.png'
    image=Image.open(ROOT/source).convert('RGBA');w,h=image.size;cols=cfg['cols']
    cells=[isolate(image.crop((round(i%cols*w/cols),round(i//cols*h/2),round((i%cols+1)*w/cols),round((i//cols+1)*h/2)))) for i in range(cfg['count'])]
    b=cells[0].getbbox();scale=cfg['height']/(b[3]-b[1])
    sheet=Image.new('RGBA',(cfg['count']*256,256));bounds=[]
    for i,cell in enumerate(cells):
        cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST)
        cell=isolate(cell);b=cell.getbbox()
        frame=Image.new('RGBA',(256,256));frame.alpha_composite(cell,(128-cell.width//2,248-b[3]))
        bb=frame.getbbox();assert bb[0]>0 and bb[1]>0 and bb[2]<256 and bb[3]<256,(key,item,i,bb)
        sheet.alpha_composite(frame,(i*256,0));bounds.append(bb)
    sheet.save(ROOT/asset['file'])
    report[f'{key}-{item}']={'source':source,'poses':cfg['count'],'scale':scale,'bounds':bounds}
(ROOT/'docs/held-motion-validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')

# All five bodies side by side: unarmed, horn, panela at actual game size.
keys=list(reference);body_scales={'office':106/153,'student':93/181,'teleperforman':116/195,'gymbro':117/218,'magolita':98/153}
loops={}
for key,cfg in reference.items():
    base=Image.open(ROOT/f'prompts/held-motion/{key}-reference.png').convert('RGBA')
    loops[key,'base']=[base.crop((i%cfg['cols']*256,i//cfg['cols']*256,(i%cfg['cols']+1)*256,(i//cfg['cols']+1)*256)) for i in range(cfg['count'])]
    for item in ('vuvuzela','panela'):
        im=Image.open(ROOT/f'src/data/players/{key}_{item}_motion_v2.png').convert('RGBA')
        loops[key,item]=[im.crop((i*256,0,(i+1)*256,256)) for i in range(cfg['count'])]
pages=[]
for tick in range(0,120,2):
    page=Image.new('RGB',(850,500),'#25313b');draw=ImageDraw.Draw(page)
    for col,key in enumerate(keys):
        draw.text((col*170+15,10),key,fill='white');cadence=3 if key in ('office','gymbro') else 4
        phase=tick//cadence%reference[key]['count']
        for row,item in enumerate(('base','vuvuzela','panela')):
            sprite=loops[key,item][phase];size=round(256*body_scales[key]);sprite=sprite.resize((size,size),Image.Resampling.NEAREST)
            if tick>=60:sprite=ImageOps.mirror(sprite)
            page.paste(sprite,(col*170+85-size//2,30+row*150+130-size),sprite)
            draw.text((col*170+15,30+row*150),item,fill='#a7d6e8')
    pages.append(page)
pages[0].save(ROOT/'docs/all-players-held-motion.gif',save_all=True,append_images=pages[1:],duration=33,loop=0)
pages[5].save(ROOT/'docs/all-players-held-motion.png')
