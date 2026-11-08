import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

const asset=name=>new URL(`../src/data/players/${name}`,import.meta.url);
test('separated Magolita grab cells retain the hair caps cut off by the old knee and throw rectangles',()=>{
  const original=readPng(asset('player_5_agarre.png')),clean=readPng(asset('player_5_agarre_clean.png'));
  assert.equal(clean.width,2048);assert.equal(clean.height,864);
  // Source head caps above the old cuts, mapped to each cell's hip and ground.
  for(const [frame,left,right,top,oldTop,hip,bottom] of [[44,717,860,255,263,811,518],[45,1200,1370,256,263,1311,518],
    [46,1700,1830,258,263,1752,518],[50,1690,1850,512,518,1740,761]]){
    const cell=frame-39;let checked=0;
    for(let y=top;y<oldTop+5;y++)for(let x=left;x<right;x++){
      const [r,g,b,a]=original.pixel(x,y);
      if(a<=32 || r<=25 || r<=g*1.15 || g<=b*1.05)continue;
      const actual=clean.pixel((cell%4)*512+256+x-hip,Math.floor(cell/4)*288+276+y-bottom);
      assert.deepEqual(actual,[r,g,b,a],`frame ${frame}: original hair pixel ${x},${y} must survive`);checked++;
    }
    assert.ok(checked>20,`frame ${frame}: check a complete cap, not one stray pixel`);
  }
});

test('Magolita grab poses have transparent space above their heads and separate cell boundaries',()=>{
  const clean=readPng(asset('player_5_agarre_clean.png'));
  for(let cell=0;cell<12;cell++){
    const x0=(cell%4)*512,y0=Math.floor(cell/4)*288;
    for(let x=0;x<512;x++)assert.equal(clean.pixel(x0+x,y0)[3],0,`cell ${cell} top padding`);
    for(let y=0;y<288;y++)for(const x of [0,511])assert.equal(clean.pixel(x0+x,y0+y)[3],0,`cell ${cell} side padding`);
  }
});

test('Magolita four kick animations have separate cells, transparent margins and a stable ground baseline',()=>{
  const png=readPng(asset('player_5_kicks.png'));
  assert.equal(png.width,1024);assert.equal(png.height,768);
  const contacts=[];
  for(let cell=0;cell<16;cell++){
    const x0=(cell%4)*256,y0=Math.floor(cell/4)*192;let bottom=-1,count=0,signature='';
    for(let y=0;y<192;y++)for(let x=0;x<256;x++){
      const alpha=png.pixel(x0+x,y0+y)[3];
      if(x===0 || x===255 || y===0 || y===191)assert.equal(alpha,0,`cell ${cell} padding`);
      if(alpha){bottom=Math.max(bottom,y);count++;}
      if(cell%4===2)signature+=alpha?'1':'0';
    }
    assert.equal(bottom,175,`cell ${cell} planted shoe`);assert.ok(count>4000);
    if(cell%4===2)contacts.push(signature);
  }
  assert.equal(new Set(contacts).size,4,'four distinct contact silhouettes');
});
