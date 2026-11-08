"""Normalize the ImageGen photo-based crowd into eight padded, foot-aligned cells."""
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
atlas = Image.new('RGBA', (1024, 1024))
rects = []
for index in range(8):
    col, row = index % 4, index // 4
    cell = source.crop((round(col * source.width / 4), round(row * source.height / 2),
                        round((col + 1) * source.width / 4), round((row + 1) * source.height / 2)))
    cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a > 32 else 0))
    person = cell.crop(cell.getbbox())
    # Shared scale preserves children's size; never stretch each figure to adult height.
    person = person.resize((round(person.width * .9), round(person.height * .9)), Image.Resampling.NEAREST)
    x, y = col * 256 + (256 - person.width) // 2, row * 512 + 472 - person.height
    atlas.alpha_composite(person, (x, y))
    rects.append([x, y, person.width, person.height])
atlas.save(root / 'src/data/NPC/npc_chorro_foto.png')
print(rects)
