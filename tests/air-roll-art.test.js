import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

for(const [key,height] of Object.entries({office:157,student:181,teleperforman:178,gymbro:198,magolita:153})){
  test(`${key}: twelve aerial poses fit their cells, retain scale and visibly invert`,()=>{
    const png=readPng(new URL(`../src/data/players/${key}_air_roll_v1.png`,import.meta.url));
    assert.equal(png.width,3072);assert.equal(png.height,256);
    const metrics=[];
    for(let frame=0;frame<12;frame++){
      let top=256,bottom=0,left=256,right=0,skinY=0,skin=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const [r,g,b,a]=png.pixel(frame*256+x,y);if(!a)continue;
        top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
        if(r>100 && g>40 && r>g*1.2 && r>b*1.5){skinY+=y;skin++;}
      }
      assert.ok(left>=6 && right<250 && top>=6 && bottom<249,`no clipping or neighbouring pixels in pose ${frame}`);
      metrics.push({height:bottom-top+1,width:right-left+1,skinY:skinY/skin});
    }
    assert.ok(Math.abs(metrics[0].height-height)<=1,'guard scale, allowing one pixel of nearest-neighbour rounding');
    assert.ok(metrics[4].skinY>metrics[0].skinY+30,'inverted face is below the hips rather than an upright crouch');
    assert.ok(metrics[9].width>metrics[8].width*1.2,'flying side kick extends beyond the chambered knee');
  });
}
