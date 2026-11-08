import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './helpers/readPng.js';

const names=['office','student','teleperforman','gymbro','magolita',...Array.from({length:8},(_,i)=>`hiker-${i}`)];
test('rear-view run/walk sheets contain the required distinct frames, clean alpha and stable feet without clipping',()=>{
  for(const name of names){
    const count=name.startsWith('hiker')?4:8;
    const png=readPng(new URL(`../src/scenes/monserrate/game/${name}.png`,import.meta.url));
    assert.equal(png.width,192*count);assert.equal(png.height,256);
    const signatures=new Set();
    for(let frame=0;frame<count;frame++){
      let left=192,right=0,top=256,bottom=0,opaque=0,hash=2166136261;
      for(let y=0;y<256;y++)for(let x=0;x<192;x++){
        const [r,g,b,a]=png.pixel(frame*192+x,y);assert.ok(a===0 || a===255,`${name}: partial alpha`);
        if(!a)continue;
        assert.ok(!(g>150 && g>r*1.5 && g>b*1.5),`${name}: chroma fringe`);
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);opaque++;
        hash=Math.imul(hash^(r+g*257+b*65537+x+y*193),16777619)>>>0;
      }
      assert.ok(opaque>3000);assert.ok(left>=8 && right<184,`${name}: side clipping`);
      assert.ok(top>=32 && top<75,`${name}: height drift`);assert.equal(bottom,239,`${name}: foot baseline`);
      signatures.add(hash);
    }
    assert.ok(signatures.size>=3,`${name}: motion must have distinct poses`);
  }
});

test('Monserrate background and moving stone texture are production-sized, opaque artwork',()=>{
  for(const [name,w,h] of [['background-v3',960,540],['background-v4',960,540],['stone',256,128]]){
    const png=readPng(new URL(`../src/scenes/monserrate/game/${name}.png`,import.meta.url));
    assert.equal(png.width,w);assert.equal(png.height,h);assert.equal(png.pixel(0,0)[3],255);
  }
});

test('moving forest has six separate cutouts with transparent margins and grounded trunks',()=>{
  const png=readPng(new URL('../src/scenes/monserrate/game/foliage.png',import.meta.url));
  assert.equal(png.width,256*6);assert.equal(png.height,384);
  for(let frame=0;frame<6;frame++){
    let count=0,bottom=0;
    for(let y=0;y<384;y++)for(let x=0;x<256;x++){
      const a=png.pixel(frame*256+x,y)[3];assert.ok(a===0 || a===255);
      if(!a)continue;count++;bottom=Math.max(bottom,y);assert.ok(x>=8 && x<248);
    }
    assert.ok(count>3000);assert.equal(bottom,383);
  }
});

test('candle vendors and cliff cutouts have clean alpha, full silhouettes and stable ground anchors',()=>{
  for(const [name,w,h,baseline] of [['vendors',192,256,239],['rocks',256,384,383]]){
    const png=readPng(new URL(`../src/scenes/monserrate/game/${name}.png`,import.meta.url));
    assert.equal(png.width,w*4);assert.equal(png.height,h);
    for(let frame=0;frame<4;frame++){
      let opaque=0,bottom=0,top=h;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const a=png.pixel(frame*w+x,y)[3];assert.ok(a===0 || a===255);
        if(!a)continue;opaque++;bottom=Math.max(bottom,y);top=Math.min(top,y);
        assert.ok(x>=10 && x<w-10,`${name}: clipped silhouette`);
      }
      assert.ok(opaque>2500);assert.ok(top>=30);assert.equal(bottom,baseline);
    }
  }
  const stone=readPng(new URL('../src/scenes/monserrate/game/rough-stone.png',import.meta.url));
  assert.equal(stone.width,256);assert.equal(stone.height,128);assert.equal(stone.pixel(0,0)[3],255);
});

test('railings are drawn on the moving trail: kerb and posts sit between the vendors and the forest',async()=>{
  const {RAILING}=await import('../src/monserrate/MonserrateTrail.js');
  const {TRAIL_VENDORS}=await import('../src/monserrate/MonserrateTrail.js');
  const {forestObjects}=await import('../src/monserrate/MonserrateScenery.js');
  const vendorEdge=Math.max(...TRAIL_VENDORS.map(v=>Math.abs(v.lane)));
  const forestEdge=Math.min(...forestObjects().map(o=>Math.abs(o.lane)));
  assert.ok(vendorEdge<RAILING.inner && RAILING.inner<RAILING.lane && RAILING.lane<RAILING.outer && RAILING.outer<forestEdge);
  assert.ok(RAILING.post>1 && RAILING.post<5,'posts every few metres stream past at running speed');
  // the painted railing is gone from the backdrop, so nothing static is left on screen
  const dark=name=>{const png=readPng(new URL(`../src/scenes/monserrate/game/${name}.png`,import.meta.url));let n=0;
    for(let x=82;x<107;x++)for(let y=380;y<490;y++)if(Math.max(...png.pixel(x,y).slice(0,3))<60)n++;return n;};
  assert.ok(dark('background-v3')<dark('background-v2')*.5,'front post removed from the background');
});

test('the landscape backdrop has no painted stairs: only the trail layer draws (and bends) them',()=>{
  const png=readPng(new URL('../src/scenes/monserrate/game/background-v4.png',import.meta.url));
  // the centre of the old staircase is foliage now: mostly green, not grey stone
  let green=0,total=0;
  for(let y=250;y<520;y+=6)for(let x=420;x<540;x+=6){const [r,g,b]=png.pixel(x,y);total++;if(g>r+8 && g>b+8)green++;}
  assert.ok(green/total>.6,`${green}/${total}`);
});
test('kneeling pilgrims have eight distinct low poses, hard alpha and a shared ground baseline',()=>{
  for(let variant=0;variant<4;variant++){
    const png=readPng(new URL(`../src/scenes/monserrate/game/kneeler-${variant}.png`,import.meta.url));
    assert.equal(png.width,192*8);assert.equal(png.height,256);
    const signatures=new Set();
    for(let frame=0;frame<8;frame++){
      let top=256,bottom=0,opaque=0,hash=2166136261;
      for(let y=0;y<256;y++)for(let x=0;x<192;x++){
        const [r,g,b,a]=png.pixel(frame*192+x,y);assert.ok(a===0 || a===255);
        if(!a)continue;opaque++;top=Math.min(top,y);bottom=Math.max(bottom,y);
        assert.ok(x>=8 && x<184);hash=Math.imul(hash^(r+g*257+b*65537+x+y*193),16777619)>>>0;
      }
      assert.ok(opaque>1500);assert.ok(top>=104 && top<130,'kneeling stature stays below standing hikers');
      assert.equal(bottom,239);signatures.add(hash);
    }
    assert.ok(signatures.size>=4);
  }
});
