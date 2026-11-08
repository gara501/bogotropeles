import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

test('Gymbro piledriver has twelve separate poses with a shared ground line and full transparent margins',()=>{
  const png=readPng(new URL('../src/data/players/player_4_piledriver.png',import.meta.url));
  assert.equal(png.width,1024);assert.equal(png.height,768);const signatures=[];
  for(let cell=0;cell<12;cell++){
    let bottom=-1,count=0,signature='';const x0=cell%4*256,y0=Math.floor(cell/4)*256;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const alpha=png.pixel(x0+x,y0+y)[3];
      if(x===0 || x===255 || y===0 || y===255)assert.equal(alpha,0,`cell ${cell} padding`);
      if(alpha){bottom=Math.max(bottom,y);count++;}signature+=alpha?'1':'0';
    }
    assert.equal(bottom,231);assert.ok(count>5000);signatures.push(signature);
  }
  assert.equal(new Set(signatures).size,12,'lift, vertical turn, seated impact and recovery are distinct');
});
