from pathlib import Path
from PIL import Image,ImageDraw
import shutil

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'src/scenes/aura/game/players-v2'
DOCS=ROOT/'docs'
frames=[];durations=[]
characters=['office','student','teleperforman','gymbro','magolita']
names=['GOMELO','UNIVERSITARIA','TELEPERFORMAN','GYMBRO','MAGOLITA']
def draw_pose(canvas,character,move,index,x,baseline):
    im=Image.open(ART/(character+'-'+move+'.png')).convert('RGBA')
    if move=='walk':
        pose=im.crop((index*224,0,(index+1)*224,256));origin=240
    else:
        pose=im.crop((index*256,0,(index+1)*256,512)).resize((168,336),Image.Resampling.NEAREST);origin=round(450*184/280)
    canvas.alpha_composite(pose,(x-pose.width//2,baseline-origin))
for tick in range(16):
    im=Image.new('RGBA',(1000,320),'#263744');d=ImageDraw.Draw(im)
    for i,(c,name) in enumerate(zip(characters,names)):
        draw_pose(im,c,'walk',tick%8,i*200+100,285);d.text((i*200+10,20),name,fill='#fff3d8')
    d.text((15,306),'CAMINAR',fill='#d6ed64');frames.append(im.convert('RGB'));durations.append(110)
for move in ['idle','six-seven','boat-paddle-dance','mewing','chen-chupas','sigma-finish']:
    for index in ([0] if move=='idle' else [0,1,2]):
        im=Image.new('RGBA',(1000,320),'#263744');d=ImageDraw.Draw(im)
        for i,(c,name) in enumerate(zip(characters,names)):
            draw_pose(im,c,move,index,i*200+100,285);d.text((i*200+10,20),name,fill='#fff3d8')
        d.text((15,306),move.upper(),fill='#d6ed64');frames.append(im.convert('RGB'));durations.append(600 if move=='idle' else 350)
frames[0].save(DOCS/'aura-players-v2-preview.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
for c in characters:
    source=ROOT/'output/imagegen/aura-quality'/(c+'-native-guard.png')
    if source.exists():shutil.copyfile(source,ROOT/'src/scenes/aura/source/players-v2'/(c+'-original-guard.png'))
print('Saved docs/aura-players-v2-preview.gif')
