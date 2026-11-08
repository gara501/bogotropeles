import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

test('cuidacarros has sixteen complete poses with hard alpha, stable baseline and distinct rag signals',()=>{
  const png=readPng(new URL('../src/data/enemies/cuidacarros.png',import.meta.url));
  assert.equal(png.width,1024);assert.equal(png.height,1024);const signals=[];
  for(let cell=0;cell<16;cell++){
    let bottom=-1,count=0,signature='';
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const a=png.pixel(cell%4*256+x,Math.floor(cell/4)*256+y)[3];
      assert.ok(a===0 || a===255);if(x===0 || x===255 || y===0 || y===255)assert.equal(a,0,'no clipped rag, cap or shoes');
      if(a){bottom=Math.max(bottom,y);count++;}if(cell>=4 && cell<=7)signature+=a?'1':'0';
    }
    assert.equal(bottom,231);assert.ok(count>4000);if(signature)signals.push(signature);
  }
  assert.equal(new Set(signals).size,4,'cloth visibly changes pose across the four signal frames');
});
