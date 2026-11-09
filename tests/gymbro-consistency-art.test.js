import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';

registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');
const {HELD_LOCOMOTION}=await import('../src/data/heldLocomotion.js');
function silhouette(png,scale){
  let top=256,bottom=0,skin=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const [r,g,b,a]=png.pixel(x,y);if(!a)continue;
    top=Math.min(top,y);bottom=Math.max(bottom,y);
    if(a>=210 && r>100 && r>g*1.15 && g>b*1.15)skin++;
  }
  let upperWidth=0;
  for(let y=top;y<top+Math.round((bottom-top+1)*.23);y++){
    let width=0;for(let x=0;x<256;x++)if(png.pixel(x,y)[3]>=210)width++;
    upperWidth=Math.max(upperWidth,width);
  }
  return {height:(bottom-top+1)*scale,upperWidth:upperWidth*scale,skin:skin*scale*scale};
}
test('Gymbro uses the corrected run in the existing atlas slots and cadence',()=>{
  const c=characters.gymbro;
  assert.match(c.appendUrls[1],/player_4_run_consistent\.png/);
  assert.deepEqual(c.animations.walk,[50,51,52,53,54,55,56,57]);assert.equal(c.walkFramesPerPose,3);
  const png=readPng(new URL(c.appendUrls[1].replace('?url','')));
  assert.equal(png.width,2048);assert.equal(png.height,256);
});

test('Gymbro idle reuses the exact punch guard without a smaller scale',()=>{
  const c=characters.gymbro;
  assert.equal(c.idle,c.animations.chainPunch1[0]);
  assert.equal(c.frameScales[c.idle]??1,1);
});

test('Gymbro dash and shoulder use the canonical-model strip and recover to the exact idle guard',()=>{
  const c=characters.gymbro;
  assert.match(c.appendUrls[2],/player_4_dash_consistent\.png/);
  assert.deepEqual(c.animations.dash,[44,45,46,47,48,49]);
  assert.deepEqual(c.animations.shoulder,c.animations.dash);
  const png=readPng(new URL(c.appendUrls[2].replace('?url','')));
  const combat=readPng(new URL('../src/data/players/gymbro_combos_v1.png',import.meta.url));
  assert.equal(png.width,1920);assert.equal(png.height,320);
  for(let i=0;i<6;i++){
    let top=320,bottom=-1,count=0;
    for(let y=0;y<320;y++)for(let x=0;x<320;x++)if(png.pixel(i*320+x,y)[3]){
      top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
      assert.ok(x>0 && x<319 && y>0 && y<319,'head, hands and shoes stay complete');
    }
    assert.equal(bottom,303);assert.ok(count>5000);
    assert.ok(bottom-top+1>=145 && bottom-top+1<=202,'leaning lowers the body without changing its scale');
    assert.equal(c.frameScales[44+i]??1,1);
  }
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)assert.deepEqual(png.pixel(5*320+32+x,56+y),combat.pixel(x,y));
});

test('Gymbro grab, knee and throw retain the canonical body size and complete silhouettes',()=>{
  const c=characters.gymbro;
  assert.match(c.appendUrls[0],/player_4_agarre_consistent\.png/);
  const png=readPng(new URL(c.appendUrls[0].replace('?url','')));
  assert.equal(png.width,1536);assert.equal(png.height,1024);
  for(let i=0;i<12;i++){
    const frame=32+i,r=c.frameRects[frame],x0=i%4*384,y0=Math.floor(i/4)*342;
    assert.deepEqual(r,{x:x0,y:1536+y0,width:384,height:340});
    assert.equal(c.frameScales[frame]??1,1,'no hidden reduction when grabbing');
    assert.equal(c.frameBaselines[frame],1536+y0+330);
    assert.equal(c.frameAnchors[frame],x0+192);
    let top=340,bottom=-1,count=0;
    for(let y=0;y<340;y++)for(let x=0;x<384;x++)if(png.pixel(x0+x,y0+y)[3]){
      top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
      assert.ok(x>0 && x<383 && y>0 && y<339,'hands, head and shoes stay complete');
    }
    assert.equal(bottom,329);assert.ok(count>10000);
    assert.ok(bottom-top+1>=188 && bottom-top+1<=203,'one body scale for the whole sequence');
    if(i<4)assert.ok(Math.abs(bottom-top+1-198)<=2,'standing hold matches the punch guard height');
  }
});
test('Gymbro running silhouettes retain the combat model height, head/shoulder width and arm volume',()=>{
  const combat=readPng(new URL('../src/data/players/gymbro_combos_v1.png',import.meta.url)),guard=silhouette(combat,1);
  for(const [url,scale] of [[characters.gymbro.appendUrls[1],.96],[HELD_LOCOMOTION.gymbro.vuvuzela,1],[HELD_LOCOMOTION.gymbro.panela,1]]){
    const actual=silhouette(readPng(new URL(url.replace('?url',''))),scale);
    assert.ok(Math.abs(actual.height-guard.height)<2,'same native body height as guard');
    assert.ok(actual.upperWidth/guard.upperWidth>=.8 && actual.upperWidth/guard.upperWidth<=1.15,'consistent head and shoulder silhouette');
    assert.ok(actual.skin/guard.skin>=.75 && actual.skin/guard.skin<=1.25,'running must retain the muscular arm volume');
  }
});
