import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';
import {AURA_PLAYER_ART as POSE,AURA_WALK_ART as WALK} from '../src/aura/spriteLayout.js';
import {AURA_RIVAL_ART as RIVAL,AURA_CROWD_ART as CROWD} from '../src/aura/spriteLayout.js';

const players=['office','student','teleperforman','gymbro','magolita'];
const moves=['six-seven','boat-paddle-dance','mewing','chen-chupas','sigma-finish'];
const load=(character,move)=>readPng(new URL(`../src/scenes/aura/game/players-v2/${character}-${move}.png`,import.meta.url));
const cast=name=>readPng(new URL(`../src/scenes/aura/game/cast-v2/${name}.png`,import.meta.url));
function bounds(png,start,width){
  let top=png.height,bottom=-1,left=width,right=-1;
  for(let y=0;y<png.height;y++)for(let x=0;x<width;x++)if(png.pixel(start+x,y)[3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
  return {top,bottom,left,right,height:bottom-top+1};
}
test('aura players retain source color detail, transparent margins and a fixed foot anchor in every pose',()=>{
  for(const character of players){
    const neutral=load(character,'idle');assert.equal(neutral.width,POSE.frameWidth);assert.equal(neutral.height,POSE.frameHeight);
    assert.equal(bounds(neutral,0,POSE.frameWidth).height,POSE.referenceHeight);
    for(const move of moves){
      const png=load(character,move);assert.equal(png.width,POSE.frameWidth*3);assert.equal(png.height,POSE.frameHeight);
      const colors=new Set();
      for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){
        const [r,g,b,a]=png.pixel(x,y);if(a>128){colors.add(`${r},${g},${b}`);assert.ok(!(g>r*1.5 && g>b*1.5 && g>100),'no chroma key residue');}
      }
      assert.ok(colors.size>48,`${character}/${move}: avoid the old flattened palette`);
      for(let i=0;i<3;i++){const b=bounds(png,i*POSE.frameWidth,POSE.frameWidth);assert.equal(b.bottom,POSE.baseline-1);assert.ok(b.left>0 && b.right<POSE.frameWidth-1);}
    }
  }
});
test('all five entrance cycles contain eight distinct poses at the same displayed body scale as the emotes',()=>{
  for(const character of players){
    const png=load(character,'walk');assert.equal(png.width,WALK.frames*WALK.frameWidth);assert.equal(png.height,WALK.frameHeight);
    const fingerprints=[];
    for(let i=0;i<WALK.frames;i++){
      const b=bounds(png,i*WALK.frameWidth,WALK.frameWidth);
      assert.equal(b.bottom,WALK.baseline-1);
      assert.ok(Math.abs(b.height-WALK.referenceHeight)<=14,`${character} walking frame ${i} changed body scale`);
      const pixels=[];for(let y=b.top;y<=b.bottom;y++)for(let x=0;x<WALK.frameWidth;x++)pixels.push(png.pixel(i*WALK.frameWidth+x,y).join(','));
      fingerprints.push(pixels.join(';'));
    }
    assert.ok(new Set(fingerprints).size>=6,`${character}: gait must alternate, not repeat two stills`);
  }
});

test('the rival retains source colors, a stable hip axis and planted feet through all nine expressions',()=>{
  for(const move of ['idle-taunt','crowd-hype','defeat']){
    const png=cast('gordo-'+move);assert.equal(png.width,RIVAL.frameWidth*3);assert.equal(png.height,RIVAL.frameHeight);
    const colors=new Set();
    for(let i=0;i<3;i++){
      const b=bounds(png,i*RIVAL.frameWidth,RIVAL.frameWidth);assert.equal(b.bottom,RIVAL.baseline-1);
      assert.ok(b.left>0 && b.right<RIVAL.frameWidth-1);
      let min=256,max=-1;
      for(let y=0;y<png.height;y++)for(let x=0;x<RIVAL.frameWidth;x++){
        const [r,g,blue,a]=png.pixel(i*RIVAL.frameWidth+x,y);if(a<=128)continue;
        colors.add(`${r},${g},${blue}`);
        // Read the thigh band below the hands; warm finger shadows can look red too.
        if(y>=365 && y<390 && r>75 && r>g*2.6 && r>blue*1.5 && g-blue<(r-blue)*.18){min=Math.min(min,x);max=Math.max(max,x);}
      }
      assert.ok(Math.abs((min+max+1)/2-128)<=2,`${move}/${i}: gesture moved the hips`);
    }
    assert.ok(colors.size>48,`${move}: no flat 17-color replacement`);
  }
});

test('the eight audience NPCs keep distinct detailed silhouettes, transparency and the same floor anchor',()=>{
  const png=cast('crowd');assert.equal(png.width,CROWD.frameWidth*4);assert.equal(png.height,CROWD.frameHeight*2);
  for(let i=0;i<8;i++){
    const colors=new Set();let bottom=-1,pixels=0,left=CROWD.frameWidth,right=-1;
    for(let y=0;y<CROWD.frameHeight;y++)for(let x=0;x<CROWD.frameWidth;x++){
      const [r,g,b,a]=png.pixel((i%4)*CROWD.frameWidth+x,Math.floor(i/4)*CROWD.frameHeight+y);
      if(a<=128)continue;pixels++;bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);colors.add(`${r},${g},${b}`);
      assert.ok(!(g>r*1.5 && g>b*1.5 && g>100),'green chroma fringe');
    }
    assert.equal(bottom,CROWD.baseline-1);assert.ok(left>0 && right<CROWD.frameWidth-1);
    assert.ok(pixels>4000 && colors.size>48,`spectator ${i} lost face/costume detail`);
  }
});
