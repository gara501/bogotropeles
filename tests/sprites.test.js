import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSheet,prepareCutout} from '../src/data/spriteSheets.js';

test('NPC cutouts clean chroma only along the silhouette and preserve saturated clothing inside',()=>{
  const data=new Uint8ClampedArray(5*5*4);
  for(let i=0;i<data.length;i+=4)data.set([80,90,100,255],i);
  data.set([255,0,0,255],(2*5)*4);data.set([255,0,0,255],(2*5+2)*4);
  data.set([230,70,35,255],(2*5+4)*4);
  const texture={context:{drawImage(){},getImageData:()=>({data}),putImageData(){}},refresh(){}};
  const scene={textures:{exists:()=>false,createCanvas:()=>texture,get:()=>({getSourceImage(){}})}};
  prepareCutout(scene,'npc','source',{x:0,y:0,width:5,height:5,cleanFringes:true});
  assert.equal(data[(2*5)*4+3],0,'red spill at the silhouette is removed');
  assert.equal(data[(2*5+2)*4+3],255,'red shirt inside the silhouette stays opaque');
  assert.equal(data[(2*5+4)*4+3],255,'muted fabric at the boundary is preserved');
});

// Minimal canvas fixture exercises the production pixel masks and packing,
// without requiring a browser or mirroring the player animation lists.
function fixture(width,height,fill,config) {
  const pixels=new Uint8ClampedArray(width*height*4);
  const paint=(x,y,color=[80,90,100,255])=>pixels.set(color,(y*width+x)*4);
  fill(paint);
  const copies=[],draws=[],frames=[];
  const makeContext=()=>({drawImage(...args){draws.push(args);},getImageData(){return {width,height,data:pixels};},
    createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
    putImageData(...args){copies.push(args);}});
  const original=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>makeContext()})};
  const texture={context:makeContext(),add(...args){frames.push(args);},refresh(){}};
  const scene={textures:{exists:()=>false,get:()=>({getSourceImage:()=>({width,height})}),createCanvas:()=>texture}};
  try {prepareSheet(scene,'fixture',{rows:[1],frameRects:[{x:0,y:0,width,height}],...config});}
  finally {globalThis.document=original;}
  return {texture,copies,draws,frames};
}
test('excluded neighbouring pixels cannot change the trimmed baseline or reference scale',()=>{
  const result=fixture(10,12,paint=>{
    for(let y=4;y<10;y++)for(let x=3;x<7;x++)paint(x,y);
    paint(0,0);paint(9,1); // A neighbouring shoe/head above this fighter.
  },{trimFrames:true,frameClips:{0:{bottom:3,left:3,right:6}},frameAnchors:{0:5}});
  const [image,x,y]=result.copies.at(-1);
  assert.equal(result.texture.referenceHeight,6);
  assert.equal(image.width,4);assert.equal(image.height,6);
  assert.equal(x,4);assert.equal(y,4);
});
test('per-pose scale correction preserves the torso anchor, ground and pixel-art filtering',()=>{
  const result=fixture(10,12,paint=>{
    for(let y=2;y<12;y++)for(let x=2;x<10;x++)paint(x,y);
  },{trimFrames:true,frameAnchors:{0:4},frameScales:{0:.5}});
  const [,x,y,w,h]=result.draws.at(-1);
  assert.equal(w,4);assert.equal(h,5);
  const [, , , ,frameWidth,frameHeight]=result.frames[0];
  assert.equal(x,frameWidth/2-1);assert.equal(y+h,frameHeight-4);
  assert.equal(result.texture.referenceHeight,10);
  assert.equal(result.texture.context.imageSmoothingEnabled,false);
});
test('overlapping pose rectangles retain the fighter without copying a neighbouring fist',()=>{
  const fill=paint=>{
    for(let y=5;y<20;y++)for(let x=5;x<15;x++)paint(x,y);
    for(let y=0;y<4;y++)for(let x=20;x<25;x++)paint(x,y);
  };
  const isolated=fixture(30,25,fill,{isolateFrames:true,trimFrames:true});
  const image=isolated.copies.at(-1)[0];
  assert.equal(image.width,10);assert.equal(image.height,15);
  const effects=fixture(30,25,fill,{isolateFrames:true,keepDetachedFrames:[0],trimFrames:true});
  assert.equal(effects.copies.at(-1)[0].width,20,'detached special effects can be explicitly retained');
});
