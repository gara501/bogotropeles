import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

test('Gomelo panela run has ten complete poses with a stable body size and changing leg silhouettes',()=>{
  const png=readPng(new URL('../src/data/players/player_1_panela_run.png',import.meta.url));
  assert.equal(png.width,1280);assert.equal(png.height,128);
  const legs=new Set(),heights=[];
  for(let i=0;i<10;i++){
    let count=0,top=128,bottom=-1,signature='';
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const a=png.pixel(i*128+x,y)[3];
      if(a){count++;top=Math.min(top,y);bottom=Math.max(bottom,y);assert.ok(x>0 && x<127 && y>0 && y<127,'full body fits its own cell');}
      if(y>=80)signature+=a?'1':'0';
    }
    assert.ok(count>2000,'each frame has a complete fighter');
    assert.ok(bottom-top+1>=100 && bottom-top+1<=114,'body matches the existing native run scale');
    assert.equal(bottom,123,'feet share a stable ground line');
    heights.push(bottom-top+1);legs.add(signature);
  }
  assert.equal(legs.size,10,'the loop has ten different leg poses, not repeated copies');
  assert.ok(Math.max(...heights)-Math.min(...heights)<=12,'stride compression stays within the native run height budget');
});
