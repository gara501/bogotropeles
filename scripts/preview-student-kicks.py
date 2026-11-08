"""Build the ground animation preview and optionally a recording captured from the game."""
from pathlib import Path
from io import BytesIO
import base64
import json
import sys
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
atlas=Image.open(root/'src/data/players/player_2_kicks_air.png').convert('RGBA')
frames=[]
for i in range(12):
    frame=Image.new('RGBA',(384,256),(20,33,39,255))
    ImageDraw.Draw(frame).line((32,233,352,233),fill=(70,87,95,255))
    frame.alpha_composite(atlas.crop((i%4*384,i//4*256,(i%4+1)*384,(i//4+1)*256)))
    frames.append(frame.convert('RGB'))
frames[0].save(root/'docs/student-kicks-preview.gif',save_all=True,append_images=frames[1:],
               duration=[110,80,130,100]*3,loop=0)
if len(sys.argv)>1:
    recording=json.loads(Path(sys.argv[1]).read_text())
    frames=[Image.open(BytesIO(base64.b64decode(data))).convert('RGB') for data in recording['frames']]
    assert recording['bounces']==2 and recording['hp']==[974,974] and recording['landed']
    frames[0].save(root/'docs/student-airdash-preview.gif',save_all=True,append_images=frames[1:],
                   duration=[34]*(len(frames)-1)+[500],loop=0)
print('Saved student kick previews')
