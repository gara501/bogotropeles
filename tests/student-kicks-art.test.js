import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

test('Maca Demia kick, air dash and rebound atlas has twenty separate full poses and a shared baseline',()=>{
  const png=readPng(new URL('../src/data/players/player_2_kicks_air.png',import.meta.url));
  assert.equal(png.width,1536);assert.equal(png.height,1280);
  const signatures=[];
  for(let cell=0;cell<20;cell++){
    const x0=cell%4*384,y0=Math.floor(cell/4)*256;let bottom=-1,pixels=0,signature='';
    for(let y=0;y<256;y++)for(let x=0;x<384;x++){
      const alpha=png.pixel(x0+x,y0+y)[3];
      if(x===0 || x===383 || y===0 || y===255)assert.equal(alpha,0,`cell ${cell} padding`);
      if(alpha){bottom=Math.max(bottom,y);pixels++;}
      signature+=alpha?'1':'0';
    }
    assert.equal(bottom,231);assert.ok(pixels>10000);signatures.push(signature);
  }
  assert.equal(new Set(signatures).size,20,'each pose has its own silhouette');
});
