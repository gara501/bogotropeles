import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

// Measure actual face pixels rather than equating a crouch to a standing height.
function faceArea(png,x,y,w,h){
  const pixels=new Set();
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    const [r,g,b,a]=png.pixel(x+xx,y+yy);
    if(a>32 && r>100 && g>40 && r>g*1.2 && r>b*1.5)pixels.add(yy*w+xx);
  }
  let largest=0;
  while(pixels.size){
    const seed=pixels.values().next().value,queue=[seed];pixels.delete(seed);
    for(let i=0;i<queue.length;i++){
      const point=queue[i],xx=point%w,yy=Math.floor(point/w),next=[];
      if(xx)next.push(point-1);if(xx<w-1)next.push(point+1);if(yy)next.push(point-w);if(yy<h-1)next.push(point+w);
      for(const n of next)if(pixels.delete(n))queue.push(n);
    }
    largest=Math.max(largest,queue.length);
  }
  return largest;
}

test('Teleperforman grab art preserves face size and padding across hold, knees and throw',()=>{
  const base=readPng(new URL('../src/data/players/player_3.png',import.meta.url));
  const grab=readPng(new URL('../src/data/players/player_3_agarre_consistent.png',import.meta.url));
  const face=faceArea(base,12+71,215+12,29,38);
  assert.equal(grab.width,1448);assert.equal(grab.height,1086);
  for(let i=0;i<12;i++){
    const x=(i%4)*362,y=Math.floor(i/4)*362,area=faceArea(grab,x+145,y+150,90,80);
    assert.ok(Math.abs(area/face-1)<.26,`pose ${53+i}: face area ${area} must match guard ${face}`);
    for(let xx=0;xx<362;xx++)assert.equal(grab.pixel(x+xx,y)[3],0,`pose ${53+i} head padding`);
  }
});

test('Teleperforman grab contact still visibly raises a knee',()=>{
  const png=readPng(new URL('../src/data/players/player_3_agarre_consistent.png',import.meta.url));
  const footWidth=cell=>{
    const x0=(cell%4)*362,y0=Math.floor(cell/4)*362;let left=362,right=-1;
    for(let y=335;y<340;y++)for(let x=0;x<362;x++)if(png.pixel(x0+x,y0+y)[3]>32){left=Math.min(left,x);right=Math.max(right,x);}
    return right-left+1;
  };
  assert.ok(footWidth(6)<footWidth(2)*.7,'knee contact (59) has one support foot; hold (55) has both feet on the ground');
});
