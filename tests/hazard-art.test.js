import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

test('street hazard sheets have isolated hard-alpha sprites with transparent margins',()=>{
  for(const [name,count] of [['pothole',3],['manhole-v2',4]]){
    const png=readPng(new URL(`../src/data/hazards/${name}.png`,import.meta.url));
    assert.equal(png.width,256*count);assert.equal(png.height,192);
    for(let cell=0;cell<count;cell++){
      let count=0;
      for(let y=0;y<192;y++)for(let x=0;x<256;x++){
        const alpha=png.pixel(cell*256+x,y)[3];assert.ok(alpha===0 || alpha===255,'no chroma or soft fringe');
        if(x===0 || x===255 || y===0 || y===191)assert.equal(alpha,0,'no cell clipping');
        if(alpha)count++;
      }
      assert.ok(count>500,`${name} frame ${cell} is not blank`);
    }
  }
});

test('manhole fall keeps the collar and floor footprint fixed while dark splash and dust rise',()=>{
  const png=readPng(new URL('../src/data/hazards/manhole-v2.png',import.meta.url));let effect=0;
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){
    const base=png.pixel(x,y),impact=png.pixel(256+x,y);
    if(y>=156 || x<73 || x>186)assert.deepEqual(impact,base,'outer collar and front lip stay fixed');
    if(y<105 && impact[3])effect++;
  }
  assert.ok(effect>200,'rising effect is visible above the back of the opening');
});

test('pothole variants share their floor silhouette and rim pixels; splash rises above it',()=>{
  const png=readPng(new URL('../src/data/hazards/pothole.png',import.meta.url));
  let splash=0;
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){
    const dry=png.pixel(x,y),wet=png.pixel(256+x,y),impact=png.pixel(512+x,y);
    assert.equal(wet[3],dry[3],'switching to puddle keeps the floor outline');
    if(y>=163)assert.deepEqual(impact,dry,'front rim and baseline never shift');
    if(y<96 && impact[3])splash++;
  }
  assert.ok(splash>40,'visible splash rises above the fixed floor footprint');
});
