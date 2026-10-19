// Generated sheets are not regular grids: isolate connected poses by alpha,
// order them by ground line and pack equal-size frames without changing the PNGs.
import { isStudentFringe } from './books.js';
export function prepareSheet(scene, key, config) {
  if (scene.textures.exists(key)) return;
  const image = scene.textures.get(`${key}-source`).getSourceImage();
  // appendUrl: a second sheet (e.g. player_3_combo.png) stacked under the first; its frameRects use y + image.height.
  const extra = config.appendUrl ? scene.textures.get(`${key}-append-source`).getSourceImage() : null;
  const source = document.createElement('canvas');
  source.width = Math.max(image.width, extra?.width ?? 0); source.height = image.height + (extra?.height ?? 0);
  const context = source.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  if (extra) context.drawImage(extra, 0, image.height);
  const { width, height, data } = context.getImageData(0, 0, source.width, source.height);
  if(config.cleanFringes)for(let i=0;i<data.length;i+=4) {
    if(isStudentFringe(data[i],data[i+1],data[i+2]))data[i+3]=0;
  }
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  let label = 0;
  for (let seed = 0; (!config.frameRects || config.isolateFrames) && seed < labels.length; seed++) {
    if (labels[seed] || data[seed * 4 + 3] <= 32) continue;
    label++;
    let head = 0, tail = 1;
    queue[0] = seed; labels[seed] = label;
    let left = width, top = height, right = 0, bottom = 0;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
      for (const next of [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1, y < height - 1 ? index + width : -1]) {
        if (next < 0 || labels[next] || data[next * 4 + 3] <= 32) continue;
        labels[next] = label; queue[tail++] = next;
      }
    }
    // Ignores detached knife art and nearly transparent background remnants.
    if (tail > 1000) components.push({ label, left, top, right, bottom });
  }
  const expected = config.rows.reduce((sum, count) => sum + count, 0);
  if (!config.frameRects && components.length !== expected) throw new Error(`${key}: se esperaban ${expected} poses; se encontraron ${components.length}. Revisa la transparencia.`);
  components.sort((a, b) => a.bottom - b.bottom);
  const poses = [];
  let offset = 0;
  for (const count of config.frameRects?[]:config.rows) {
    poses.push(...components.slice(offset, offset + count).sort((a, b) => a.left - b.left));
    offset += count;
  }
  if (config.frameRects) poses.push(...config.frameRects.map(rect => ({ left:rect.x, top:rect.y, right:rect.x+rect.width-1, bottom:rect.y+rect.height-1, anchor:rect.anchor })));
  if(config.isolateFrames)poses.forEach((pose,index)=>{
    if(config.keepDetachedFrames?.includes(index))return;
    const counts=new Map();
    for(let y=pose.top;y<=pose.bottom;y++)for(let x=pose.left;x<=pose.right;x++) {
      const id=labels[y*width+x];if(id)counts.set(id,(counts.get(id)??0)+1);
    }
    pose.label=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0];
  });
  // The trim and the final copy must use the same mask, otherwise a neighbouring
  // head/shoe that was removed still changes the frame's baseline and scale.
  const includesPixel=(pose,index,x,y)=>{
    const src=y*width+x;
    if(data[src*4+3]<=32)return false;
    if((!config.frameRects || config.isolateFrames) && pose.label && labels[src]!==pose.label)return false;
    const clip=config.frameClips?.[index];
    return !(clip && y<clip.bottom && (x<clip.left || x>clip.right));
  };
  if(config.trimFrames) for(const [index,pose] of poses.entries()) {
    let left=width,top=height,right=-1,bottom=-1;
    for(let y=pose.top;y<=pose.bottom;y++)for(let x=pose.left;x<=pose.right;x++) {
      if(!includesPixel(pose,index,x,y))continue;
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(right>=left)Object.assign(pose,{left,top,right,bottom});
  }
  const anchors = poses.map((p, index) => p.anchor ?? config.frameAnchors?.[index] ?? (p.left + p.right + 1) / 2);
  const scales=poses.map((_,index)=>config.frameScales?.[index]??1);
  const frameWidth = Math.ceil(Math.max(...poses.map((p, index) => Math.max(anchors[index] - p.left, p.right + 1 - anchors[index])*scales[index])) * 2) + 8;
  const frameHeight = Math.ceil(Math.max(...poses.map((p,index) => (p.bottom - p.top + 1)*scales[index]))) + 8;
  const texture = scene.textures.createCanvas(key, frameWidth * 6, frameHeight * Math.ceil(expected / 6));
  const cutout=document.createElement('canvas');
  texture.context.imageSmoothingEnabled=false;
  poses.forEach((pose, index) => {
    const w = pose.right - pose.left + 1, h = pose.bottom - pose.top + 1;
    const cellX = index % 6 * frameWidth, cellY = Math.floor(index / 6) * frameHeight;
    const output = texture.context.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const src = (pose.top + y) * width + pose.left + x;
      if (!includesPixel(pose,index,pose.left+x,pose.top+y)) continue;
      const dst = (y * w + x) * 4;
      output.data.set(data.subarray(src * 4, src * 4 + 4), dst);
    }
    const scale=scales[index],drawWidth=Math.round(w*scale),drawHeight=Math.round(h*scale);
    const drawX=cellX+Math.round(frameWidth/2-(anchors[index]-pose.left)*scale);
    const drawY=cellY+frameHeight-drawHeight-4;
    if(scale===1)texture.context.putImageData(output,drawX,drawY);
    else {
      cutout.width=w;cutout.height=h;cutout.getContext('2d').putImageData(output,0,0);
      texture.context.drawImage(cutout,drawX,drawY,drawWidth,drawHeight);
    }
    texture.add(index, 0, cellX, cellY, frameWidth, frameHeight);
  });
  texture.refresh();
  texture.referenceHeight = poses[0].bottom - poses[0].top + 1;
}

export function registerAnimations(scene, key, config) {
  prepareSheet(scene, key, config);
  for (const [state, frames] of Object.entries(config.animations)) {
    const animationKey = `${key}-${state}`;
    if (scene.anims.exists(animationKey)) continue;
    scene.anims.create({ key: animationKey,
      frames: frames.map(frame => ({ key, frame })),
      frameRate: state === 'walk' ? (config.walkRate ?? 10) : 12,
      repeat: state === 'walk' ? -1 : 0,
    });
  }
}

export const sequence = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export function prepareEffects(scene, key, config) {
  if (scene.textures.exists(key)) return;
  const image = scene.textures.get(`${key}-source`).getSourceImage();
  const texture = scene.textures.createCanvas(key, image.width, image.height);
  texture.context.drawImage(image, 0, 0);
  const pixels = texture.context.getImageData(0, 0, image.width, image.height);
  for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] <= 32) pixels.data[i] = 0;
  texture.context.putImageData(pixels, 0, 0);
  for (const [name, rect] of Object.entries(config.frames)) texture.add(name, 0, ...rect);
  texture.refresh();
}

export function prepareCutout(scene,key,sourceKey,rect) {
  if(scene.textures.exists(key))return;
  const texture=scene.textures.createCanvas(key,rect.width,rect.height);
  texture.context.drawImage(scene.textures.get(sourceKey).getSourceImage(),rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
  const pixels=texture.context.getImageData(0,0,rect.width,rect.height);
  for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<=32)pixels.data[i]=0;
  texture.context.putImageData(pixels,0,0);texture.refresh();
}
