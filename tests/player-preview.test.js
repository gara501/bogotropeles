import test from 'node:test';
import assert from 'node:assert/strict';
import {previewPlacement,drawPlayerPreview} from '../src/ui/playerPreviewSheet.js';

const sheet={canvas:{},bounds:{
  0:{x:20,y:50,width:100,height:178,left:-50,top:178},
  1:{x:400,y:50,width:160,height:205,left:-60,top:205},
  2:{x:800,y:120,width:150,height:110,left:-70,top:110},
},envelopes:{selection:{left:-70,right:100,height:205}}};

test('preview fits the whole sequence without clipping or changing scale on crouches and raised arms',()=>{
  for(const [width,height] of [[320,320],[200,200],[360,360]]){
    const poses=[0,1,2].map(f=>previewPlacement(sheet,f,width,height));
    assert.ok(poses.every(p=>p.scale===poses[0].scale));
    for(const p of poses){assert.ok(p.x>=12 && p.y>=12);assert.ok(p.x+p.width<=width-12+1e-9);assert.ok(p.y+p.height<=height-12+1e-9);}
    assert.ok(poses[2].height<poses[0].height,'a crouch must not be stretched to standing height');
  }
});

test('preview copies the prepared pixels with their shared foot line and nearest-neighbour filtering',()=>{
  const draws=[],ctx={canvas:{width:320,height:320},clearRect(){},drawImage(...args){draws.push(args);}};
  drawPlayerPreview(ctx,sheet,0);
  assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(draws.length,1);
  assert.deepEqual(draws[0].slice(0,5),[sheet.canvas,20,50,100,178]);
  assert.equal(ctx.globalCompositeOperation,'source-over');
});
