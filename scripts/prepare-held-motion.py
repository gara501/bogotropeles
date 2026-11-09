"""Normalize all carried-object loops against each fighter's unarmed locomotion."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageOps

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'prompts/held-motion/generation.json').read_text(encoding='utf8'))
reference=json.loads((ROOT/'prompts/held-motion/reference-layout.json').read_text(encoding='utf8'))

from held_art_utils import isolate

report={}
for asset in manifest['assets']:
    key,item=asset['character'],asset['item'];cfg=reference[key]
    source=asset.get('styleCorrection',{}).get('source',asset.get('cleanup',{}).get('source',asset['source']))
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
        asset=next(a for a in manifest['assets'] if a['character']==key and a['item']==item)
        im=Image.open(ROOT/asset['file']).convert('RGBA')
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
