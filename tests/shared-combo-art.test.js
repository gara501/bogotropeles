import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';
import {COMBO_ART_LAYOUT} from '../src/data/comboArtLayout.js';
import {directionalStrike,matchingRoutes,sequenceOptions} from '../src/data/comboRoutes.js';

test('directional modifiers are captured when the button is pressed',()=>{
  assert.equal(directionalStrike('punch',-1),'upperPunch');
  assert.equal(directionalStrike('kick',1),'lowKick');
  assert.equal(directionalStrike('kick',-1),'kick');
  assert.equal(directionalStrike('punch',1),'punch');
  assert.equal(directionalStrike('parry',-1),'parry');
  assert.deepEqual(sequenceOptions({path:['punch','punch']}),['punch','kick']);
  assert.deepEqual(sequenceOptions({path:['kick','kick','kick']}),['lowKick']);
  assert.equal(matchingRoutes(['punch','kick']).length,0);
  assert.deepEqual(sequenceOptions({path:['punch'],combo:false}),[],'weapon overrides cannot continue the unarmed route');
});
for(const hero of Object.keys(COMBO_ART_LAYOUT))test(`${hero}: 32 nonempty RGBA poses fit their cells with transparent padding`,()=>{
  const png=readPng(new URL(`../src/data/players/${hero}_combos_v1.png`,import.meta.url));
  assert.equal(png.width,1024);assert.equal(png.height,2048);
  for(let row=0;row<8;row++)for(let col=0;col<4;col++){
    let count=0,seed=-1;
    const opaque=new Uint8Array(256*256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const a=png.pixel(col*256+x,row*256+y)[3];
      if(a){count++;opaque[y*256+x]=1;seed=y*256+x;assert.ok(x>0 && x<255 && y>0 && y<255,'no clipping at cell borders');}
    }
    assert.ok(count>1500,`${row},${col} has full-body artwork`);
    const queue=[seed];opaque[seed]=0;let visited=0;
    while(queue.length){
      const n=queue.pop(),x=n%256,y=Math.floor(n/256);visited++;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;if(nx<0||nx>=256||ny<0||ny>=256)continue;
        const next=ny*256+nx;if(opaque[next]){opaque[next]=0;queue.push(next);}
      }
    }
    assert.equal(visited,count,`${row},${col} contains no detached pieces from another pose`);
  }
});
