"""Match running and carried locomotion to Gymbro's combat model."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageOps
from held_art_utils import isolate

ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'prompts/gymbro-consistency/generation.json').read_text(encoding='utf8'))
loops={}
for asset in spec['assets']:
    kind=asset['kind'];image=Image.open(ROOT/asset['source']).convert('RGBA');w,h=image.size
    cells=[isolate(image.crop((round(i%4*w/4),round(i//4*h/2),round((i%4+1)*w/4),round((i//4+1)*h/2)))) for i in range(8)]
    target=206 if kind=='run' else 198
    b=cells[0].getbbox();scale=target/(b[3]-b[1]);sheet=Image.new('RGBA',(2048,256));poses=[]
    for i,cell in enumerate(cells):
        cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST);cell=isolate(cell)
        b=cell.getbbox();frame=Image.new('RGBA',(256,256));frame.alpha_composite(cell,(128-cell.width//2,248-b[3]))
        b=frame.getbbox();assert b[0]>0 and b[1]>0 and b[2]<256 and b[3]<256,(kind,i,b)
        sheet.alpha_composite(frame,(i*256,0));poses.append(frame)
    filename='player_4_run_consistent.png' if kind=='run' else f'gymbro_{kind}_motion_v3.png'
    sheet.save(ROOT/'src/data/players'/filename);loops[kind]=poses

before=Image.open(ROOT/'src/data/players/player_4_run.png').convert('RGBA')
combat=Image.open(ROOT/'src/data/players/gymbro_combos_v1.png').convert('RGBA')
pages=[]
for tick in range(48):
    page=Image.new('RGB',(1000,320),'#25313b');draw=ImageDraw.Draw(page)
    i=tick//3%8
    entries=[('Carrera anterior',before.crop((i*256,0,(i+1)*256,256)),.96),('Carrera corregida',loops['run'][i],.96),
             ('Golpe / guardia',combat.crop((0,0,256,256)) if tick%24<12 else combat.crop((512,0,768,256)),1),
             ('Con vuvuzela',loops['vuvuzela'][i],1),('Con panela',loops['panela'][i],1)]
    for col,(label,pose,scale) in enumerate(entries):
        draw.text((col*200+10,15),label,fill='white');pose=pose.resize((round(256*scale),round(256*scale)),Image.Resampling.NEAREST)
        if tick>=24:pose=ImageOps.mirror(pose)
        page.paste(pose,(col*200+100-pose.width//2,290-pose.height),pose)
    pages.append(page)
pages[0].save(ROOT/'docs/gymbro-consistency.gif',save_all=True,append_images=pages[1:],duration=50,loop=0)
pages[0].save(ROOT/'docs/gymbro-consistency.png')
