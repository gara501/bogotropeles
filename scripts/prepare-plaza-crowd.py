"""Normalize the three-photo Plaza de Bolivar crowd generated with ImageGen."""
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
# The umbrella extends past its nominal column. Keep it in one complete cutout.
regions = [(0, 0, 480, 444), (480, 0, 970, 444), (980, 0, 1320, 444), (1330, 0, 1774, 444),
           (0, 444, 444, 887), (444, 444, 887, 887), (887, 444, 1330, 887), (1330, 444, 1774, 887)]
assert source.size == (1774, 887), 'Reinspect source regions if generation size changes'
atlas = Image.new('RGBA', (1024, 1024))
rects = []
for index, region in enumerate(regions):
    cell = source.crop(region)
    cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a > 32 else 0))
    # Remove neon generation spill only at the outside alpha edge, preserving costume interiors.
    for _ in range(4):
        pixels = cell.load()
        remove = []
        for y in range(cell.height):
            for x in range(cell.width):
                r, g, b, a = pixels[x, y]
                neon = ((r > 225 and g < 70 and b < 110) or (r > 190 and g > 165 and b < 45)
                        or (b > 220 and r < 90 and g < 100) or (r > 180 and b > 160 and g < 80))
                if not a or not neon:
                    continue
                if any(nx < 0 or ny < 0 or nx >= cell.width or ny >= cell.height or not pixels[nx, ny][3]
                       for nx, ny in [(x-1,y), (x+1,y), (x,y-1), (x,y+1)]):
                    remove.append((x, y))
        for x, y in remove:
            pixels[x, y] = (0, 0, 0, 0)
    person = cell.crop(cell.getbbox())
    ratio = min(224 / person.width, 448 / person.height)
    person = person.resize((round(person.width * ratio), round(person.height * ratio)), Image.Resampling.NEAREST)
    x, y = index % 4 * 256 + (256 - person.width) // 2, index // 4 * 512 + 480 - person.height
    atlas.alpha_composite(person, (x, y))
    rects.append([x, y, person.width, person.height])
atlas.save(root / 'src/data/NPC/npc_plaza_fotos.png')
print(rects)
