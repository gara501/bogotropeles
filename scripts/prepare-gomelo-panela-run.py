"""Normalize the image_gen edit of Gomelo's existing armed ten-pose run."""
from pathlib import Path
from statistics import median
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'prompts/gomelo-panela-run-source.png').convert('RGBA')
cells = []
for i in range(10):
    w, h = source.size
    cell = source.crop((round(i%5*w/5), round(i//5*h/2), round((i%5+1)*w/5), round((i//5+1)*h/2)))
    cw, ch = cell.size
    pixels = cell.getchannel('A').point(lambda a: 255 if a >= 180 else 0).tobytes()
    seen, parts = set(), []
    for seed, value in enumerate(pixels):
        if not value or seed in seen:
            continue
        pending, part = [seed], []
        seen.add(seed)
        while pending:
            n = pending.pop()
            part.append(n)
            x, y = n % cw, n // cw
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < cw and 0 <= ny < ch:
                        j = ny*cw+nx
                        if pixels[j] and j not in seen:
                            seen.add(j)
                            pending.append(j)
        parts.append(part)
    mask = bytearray(cw*ch)
    for n in max(parts, key=len):
        mask[n] = 255
    cell.putalpha(Image.frombytes('L', (cw,ch), bytes(mask)))
    cells.append(cell)

# Match the 107 px native body in the existing vuvuzela run, with one scale.
scale = 107 / median(cell.getbbox()[3]-cell.getbbox()[1] for cell in cells)
sheet = Image.new('RGBA', (1280,128))
frames = []
for i, cell in enumerate(cells):
    cell = cell.resize((round(cell.width*scale), round(cell.height*scale)), Image.Resampling.NEAREST)
    frame = Image.new('RGBA', (128,128))
    frame.alpha_composite(cell, (64-cell.width//2,124-cell.getbbox()[3]))
    sheet.alpha_composite(frame, (i*128,0))
    frames.append(frame)
sheet.save(ROOT / 'src/data/players/player_1_panela_run.png')

preview = []
horn = Image.open(ROOT / 'src/data/players/player_1_vuvuzela_run.png').convert('RGBA')
for i, frame in enumerate(frames):
    page = Image.new('RGB', (512,300), '#25313b')
    draw = ImageDraw.Draw(page)
    draw.text((18,8), 'Vuvuzela', fill='white')
    draw.text((274,8), 'Panela', fill='white')
    for x, sprite in [(0,horn.crop((i*128,0,(i+1)*128,128))), (256,frame)]:
        sprite = sprite.resize((256,256), Image.Resampling.NEAREST)
        page.paste(sprite,(x,28),sprite)
    preview.append(page)
preview[0].save(ROOT / 'docs/gomelo-held-run.gif',save_all=True,append_images=preview[1:],duration=50,loop=0)
