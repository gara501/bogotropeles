from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import json,sys

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/aura/source/players-v2'
DEST=ROOT/'src/scenes/aura/game/players-v2'
jobs=json.loads((SOURCE/'walk-jobs.json').read_text())['jobs']
selected=sys.argv[1:]
def download(item):
    character,job,index=item
    path=SOURCE/character/f'walk-{index:02}.png';path.parent.mkdir(exist_ok=True)
    if not path.exists():
        with urlopen(f'https://api.pixellab.ai/mcp/images/{job}/download?index={index}',timeout=45) as r:path.write_bytes(r.read())
    return path
items=[(j['character'],j['id'],i) for j in jobs if j['character'] in selected for i in range(1,9)]
with ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(download,items))
for character in selected:
    sheet=Image.new('RGBA',(224*8,256))
    for i in range(8):
        im=Image.open(SOURCE/character/f'walk-{i+1:02}.png').convert('RGBA')
        assert im.size==(224,256),im.size
        box=im.getbbox();assert box
        ground=240-box[3]
        frame=Image.new('RGBA',(224,256));frame.paste(im,(0,ground))
        sheet.paste(frame,(i*224,0))
    sheet.save(DEST/(character+'-walk.png'))
    sheet.save(SOURCE/(character+'-walk.png'))
    print(character,'8-frame gait aligned to baseline 240')
