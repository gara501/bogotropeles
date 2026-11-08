"""Export the in-game piledriver recording plus a native asset preview."""
from pathlib import Path
from io import BytesIO
import base64
import json
import sys
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
atlas=Image.open(root/'src/data/players/player_4_piledriver.png').convert('RGBA')
frames=[]
for i in range(12):
    frame=Image.new('RGBA',(256,256),(20,33,39,255))
    ImageDraw.Draw(frame).line((24,233,232,233),fill=(70,87,95,255))
    frame.alpha_composite(atlas.crop((i%4*256,i//4*256,(i%4+1)*256,(i//4+1)*256)))
    frames.append(frame.convert('RGB'))
frames[0].save(root/'docs/gymbro-piledriver-art.gif',save_all=True,append_images=frames[1:],duration=110,loop=0)
if len(sys.argv)>1:
    recording=json.loads(Path(sys.argv[1]).read_text())
    assert recording['inverted'] and recording['rotationRestored'] and recording['grounded']
    assert recording['hp']==890 and recording['stunFrames']==90 and len(recording['hits'])==1
    frames=[Image.open(BytesIO(base64.b64decode(f))).convert('RGB') for f in recording['frames']]
    frames[0].save(root/'docs/gymbro-piledriver-preview.gif',save_all=True,append_images=frames[1:],
                   duration=[34]*(len(frames)-1)+[650],loop=0)
    contact=Image.new('RGB',(1200,720))
    for i,n in enumerate([3,8,12,17,21,26]):contact.paste(frames[n],(i%3*400,i//3*360))
    contact.save(root/'docs/gymbro-piledriver-contact.jpg')
print('Saved Gymbro piledriver previews')
