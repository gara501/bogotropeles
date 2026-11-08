"""Normalize image_gen's 4x8 sheets. Source paths and prompts live in the manifest."""
import json
from pathlib import Path
from statistics import median
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'docs/combo-art-generation.json').read_text(encoding='utf8'))
cleanup = {}

def isolate_pose(cell):
    """All eight actions hold their props: isolated islands are neighbouring art."""
    w, h = cell.size
    alpha = cell.getchannel('A').point(lambda a: 255 if a >= 180 else 0)
    pixels = alpha.tobytes()
    seen, parts = set(), []
    for seed, value in enumerate(pixels):
        if not value or seed in seen:
            continue
        pending, part = [seed], []
        seen.add(seed)
        while pending:
            i = pending.pop()
            part.append(i)
            x, y = i % w, i // w
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x+dx, y+dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    j = ny*w+nx
                    if pixels[j] and j not in seen:
                        seen.add(j)
                        pending.append(j)
        parts.append(part)
    body = max(parts, key=len)
    assert len(body) > 1500
    mask = bytearray(w*h)
    for i in body:
        mask[i] = 255
    cell.putalpha(Image.frombytes('L', (w,h), bytes(mask)))
    return cell, sum(map(len, parts))-len(body)

for key, spec in manifest['assets'].items():
    image = Image.open(spec['source']).convert('RGBA')
    w, h = image.size
    # The generator's visual rows aren't exact fractions of its output height.
    # Detect the eight opaque bands so raised props never leak into the sweep.
    alpha = image.getchannel('A')
    bands, start = [], None
    for y in range(h+1):
        count = 0 if y == h else sum(a >= 180 for a in alpha.crop((0,y,w,y+1)).tobytes())
        if count > 8 and start is None:
            start = y
        if count <= 8 and start is not None:
            if y-start > 20:
                bands.append((max(0,start-2), min(h,y+2)))
            start = None
    assert len(bands) == 8, (key, bands)
    cells = [image.crop((round(c*w/4), top, round((c+1)*w/4), bottom))
             for top,bottom in bands for c in range(4)]
    isolated = [isolate_pose(cell) for cell in cells]
    cells = [cell for cell, _ in isolated]
    cleanup[key] = {str(i): removed for i, (_, removed) in enumerate(isolated) if removed}
    native = dict(office=153, student=181, teleperforman=178, gymbro=198, magolita=153)[key]
    scale = native / median(c.getbbox()[3]-c.getbbox()[1] for c in cells[:4])
    sheet = Image.new('RGBA', (1024, 2048))
    for i, cell in enumerate(cells):
        cell = cell.resize((round(cell.width*scale), round(cell.height*scale)), Image.Resampling.NEAREST)
        cell, _ = isolate_pose(cell)
        sheet.alpha_composite(cell, ((i%4)*256+128-cell.width//2, (i//4)*256+248-cell.getbbox()[3]))
    sheet.save(ROOT / spec['file'])
(ROOT / 'docs/combo-art-cleanup.json').write_text(json.dumps(cleanup, indent=2), encoding='utf8')

preview = Image.new('RGB', (900, 410), '#243038')
for col, key in enumerate(manifest['assets']):
    image = Image.open(ROOT / manifest['assets'][key]['file'])
    for row, index in enumerate([26, 30]):
        pose = image.crop(((index%4)*256, (index//4)*256, (index%4+1)*256, (index//4+1)*256))
        pose.thumbnail((180, 200), Image.Resampling.NEAREST)
        preview.paste(pose, (col*180, row*200), pose)
preview.save(ROOT / 'docs/shared-combos-preview.png')
