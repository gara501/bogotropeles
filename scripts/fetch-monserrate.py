"""Download completed PixelLab motion frames; retain originals and aligned game sheets."""
from pathlib import Path
import json, urllib.request, concurrent.futures, argparse
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/scenes/monserrate/source'
GAME=SOURCE.parent/'game'

def fetch(job):
    folder=SOURCE/'motion'/job['name'];folder.mkdir(parents=True,exist_ok=True)
    frames=[]
    for i in range(1,job['count']+1):
        path=folder/f'{i:02}.png'
        if not path.exists():
            url=f"https://api.pixellab.ai/mcp/images/{job['id']}/download?index={i}"
            request=urllib.request.Request(url,headers={'User-Agent':'StreetBogotaAssetPipeline/1.0'})
            try:
                with urllib.request.urlopen(request,timeout=35) as response:path.write_bytes(response.read())
            except Exception as error:return f"{job['name']}: pending/error {error}"
        im=Image.open(path).convert('RGBA');a=np.array(im);a[:,:,3]=np.where(a[:,:,3]>=128,255,0);im=Image.fromarray(a)
        frames.append(im)
    # One scale per entire clip, never resize individual limbs/poses independently.
    boxes=[f.getbbox() for f in frames]
    tallest=max(b[3]-b[1] for b in boxes);widest=max(b[2]-b[0] for b in boxes)
    scale=min(job.get('height',208)/tallest,176/widest)
    sheet=Image.new('RGBA',(192*len(frames),256))
    # Align feet, retain natural stride silhouette and the same anatomical scale.
    for i,(frame,box) in enumerate(zip(frames,boxes)):
        frame=frame.crop(box).resize((round((box[2]-box[0])*scale),round((box[3]-box[1])*scale)),Image.Resampling.NEAREST)
        sheet.alpha_composite(frame,(i*192+(192-frame.width)//2,240-frame.height))
    sheet.save(GAME/f"{job['name']}.png")
    return f"{job['name']}: ready {len(frames)} frames"

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--jobs',default=str(SOURCE/'jobs.json'));args=parser.parse_args()
    jobs=json.loads(Path(args.jobs).read_text(encoding='utf-8-sig'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for result in pool.map(fetch,jobs):print(result,flush=True)
