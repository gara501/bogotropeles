"""Foot-align the 4x4 ImageGen kicks without independently scaling each pose."""
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
atlas = Image.new('RGBA', (1024, 768))
for index in range(16):
    col, row = index % 4, index // 4
    cell = source.crop((round(col*source.width/4), round(row*source.height/4),
                        round((col+1)*source.width/4), round((row+1)*source.height/4)))
    cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a > 32 else 0))
    for _ in range(3):
        pixels = cell.load()
        remove = []
        for y in range(cell.height):
            for x in range(cell.width):
                r, g, b, a = pixels[x, y]
                spill = ((r > 225 and g < 70 and b < 110) or (b > 220 and r < 90 and g < 100)
                         or (r > 180 and b > 160 and g < 80))
                if a and spill and any(nx < 0 or ny < 0 or nx >= cell.width or ny >= cell.height or not pixels[nx, ny][3]
                                      for nx, ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]):
                    remove.append((x,y))
        for x,y in remove:
            pixels[x,y] = (0,0,0,0)
    bounds = cell.getbbox()
    left, top, right, bottom = bounds
    # Supporting foot is the leftmost solid run on the lowest shoe scanline.
    xs = [x for x in range(left, right) if cell.getpixel((x, bottom-3))[3]]
    assert xs, index
    foot = [xs[0]]
    for x in xs[1:]:
        if x-foot[-1] > 4:
            break
        foot.append(x)
    support = (foot[0]+foot[-1])/2
    person = cell.crop(bounds)
    person = person.resize((round(person.width*.6), round(person.height*.6)), Image.Resampling.NEAREST)
    x = round(96-(support-left)*.6)
    y = 176-person.height
    assert x > 0 and y > 0 and x+person.width < 256, (index, x, y, person.size)
    atlas.alpha_composite(person, (col*256+x, row*192+y))
atlas.save(root/'src/data/players/player_5_kicks.png')
print('Saved player_5_kicks.png: 16 cells, 256x192, support foot x=96, ground y=176')
