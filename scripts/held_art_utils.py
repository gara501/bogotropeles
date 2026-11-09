"""Deterministic alpha cleanup shared by held-motion asset pipelines."""
from PIL import Image

def isolate(cell):
    w,h=cell.size
    data=cell.tobytes()
    mask=bytearray(255 if data[i+3]>=210 else 0 for i in range(0,len(data),4))
    # One generated sheet has a pale matte: remove only exterior neutral pixels.
    pending=list(range(w))+list(range((h-1)*w,h*w))+[y*w for y in range(h)]+[y*w+w-1 for y in range(h)]
    seen=set(pending)
    while pending:
        n=pending.pop();r,g,b,_=data[n*4:n*4+4]
        if mask[n] and not (min(r,g,b)>200 and max(r,g,b)-min(r,g,b)<35):
            continue
        mask[n]=0;x,y=n%w,n//w
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            j=ny*w+nx
            if 0<=nx<w and 0<=ny<h and j not in seen:
                seen.add(j);pending.append(j)
    seen=set();parts=[]
    for seed,value in enumerate(mask):
        if not value or seed in seen:continue
        pending=[seed];seen.add(seed);part=[]
        while pending:
            n=pending.pop();part.append(n);x,y=n%w,n//w
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    nx,ny=x+dx,y+dy;j=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and mask[j] and j not in seen:
                        seen.add(j);pending.append(j)
        parts.append(part)
    body=max(parts,key=len);assert len(body)>1500
    result=bytearray(w*h)
    for n in body:result[n]=255
    cell.putalpha(Image.frombytes('L',(w,h),bytes(result)))
    return cell

