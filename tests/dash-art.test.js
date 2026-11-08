import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';
import {PLAYER_ATLASES} from '../src/data/playerAtlases.js';

for(const [key,num,idle,anchor,file] of [
  ['office',1,4,120,'player_1_slide.png'],['student',2,4,94,'player_2_slide.png'],
  ['teleperforman',3,6,85,'player_3_slide_clean.png'],['gymbro',4,4,140,'player_4_shoulder.png'],
  ['magolita',5,0,160,'player_5_slide_clean.png'],
])test(`${key}: dash attack has clean margins, planted feet and the exact native guard on recovery`,()=>{
  const base=readPng(new URL(`../src/data/players/player_${num}.png`,import.meta.url));
  const strip=readPng(new URL(`../src/data/players/${file}`,import.meta.url));
  assert.equal(strip.width,1920);assert.equal(strip.height,320);
  const signatures=[];
  for(let cell=0;cell<6;cell++){
    let bottom=-1,count=0,signature='';
    for(let y=0;y<320;y++)for(let x=0;x<320;x++){
      const alpha=strip.pixel(cell*320+x,y)[3];
      if(x===0 || x===319 || y===0 || y===319)assert.equal(alpha,0,`cell ${cell} padding`);
      assert.ok(alpha===0 || alpha===255,`cell ${cell} has hard alpha`);
      if(alpha){bottom=Math.max(bottom,y);count++;}signature+=alpha?'1':'0';
    }
    assert.equal(bottom,279,`cell ${cell} baseline`);assert.ok(count>2500,`cell ${cell} full silhouette`);
    signatures.push(signature);
  }
  assert.equal(new Set(signatures).size,6,'all six poses differ');
  const r=PLAYER_ATLASES[key][idle],left=5*320+160-(anchor-r.x);
  let bottom=-1;
  for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)if(base.pixel(r.x+x,r.y+y)[3]>=128)bottom=Math.max(bottom,y);
  const top=279-bottom;
  let checked=0;
  for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
    const pixel=base.pixel(r.x+x,r.y+y);
    if(pixel[3]<128)continue;
    assert.deepEqual(strip.pixel(left+x,top+y),[...pixel.slice(0,3),255],'native guard identity and scale');checked++;
  }
  assert.ok(checked>4000);
});
