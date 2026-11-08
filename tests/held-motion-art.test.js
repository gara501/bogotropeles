import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';
import {ARMED_RUN} from '../src/data/armedRun.js';

registerHooks({load(url,context,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,context);}});
const {HELD_LOCOMOTION,preloadHeldLocomotion}=await import('../src/data/heldLocomotion.js');
for(const [hero,items] of Object.entries(HELD_LOCOMOTION))for(const [item,url] of Object.entries(items)){
  test(`${hero} ${item}: all locomotion poses are complete, distinct and free of background fragments`,()=>{
    const png=readPng(new URL(url.replace('?url',''))),poses=ARMED_RUN[hero].poses;
    assert.equal(png.width,poses*256);assert.equal(png.height,256);
    const shapes=new Set();
    for(let i=0;i<poses;i++){
      const alpha=new Uint8Array(256*256);let count=0,seed=-1,bottom=-1,shape='';
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const a=png.pixel(i*256+x,y)[3];
        if(a){assert.ok(x>0 && x<255 && y>0 && y<255,'no clipped hands, prop or shoes');count++;alpha[y*256+x]=1;seed=y*256+x;bottom=Math.max(bottom,y);}
        if(y>160)shape+=a?'1':'0';
      }
      assert.ok(count>3000,'each frame has a full body');assert.equal(bottom,247,'stable foot baseline');shapes.add(shape);
      let visited=0;const pending=[seed];alpha[seed]=0;
      while(pending.length){
        const n=pending.pop(),x=n%256,y=Math.floor(n/256);visited++;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const nx=x+dx,ny=y+dy;if(nx<0||nx>=256||ny<0||ny>=256)continue;
          const j=ny*256+nx;if(alpha[j]){alpha[j]=0;pending.push(j);}
        }
      }
      assert.equal(visited,count,'no detached foreign pieces');
    }
    assert.equal(shapes.size,poses,'all leg phases are distinct');
  });
}
test('each held locomotion texture loads independently and is reused once prepared',()=>{
  const ready=new Set(),loads=[],scene={textures:{exists:key=>ready.has(key)},load:{image:(key,url)=>loads.push({key,url})}};
  for(const hero of Object.keys(HELD_LOCOMOTION))for(const item of ['vuvuzela','panela']){
    const key=`${hero}-${item}-run`;
    preloadHeldLocomotion(scene,hero,item);assert.equal(loads.at(-1).key,`${key}-source`);
    ready.add(key);const n=loads.length;preloadHeldLocomotion(scene,hero,item);assert.equal(loads.length,n);
  }
  assert.equal(loads.length,10);
});
