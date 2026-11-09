import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';
import {OFFICE_PUNCH_ROUTE,routesFor,routeAnimations,sequenceOptions} from '../src/data/comboRoutes.js';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');
const {controlsFor}=await import('../src/ui/ControlsScreen.js');

test('Gomelo branches from the shared two punches into PPP or PPKKK and alone gets grab shake controls',()=>{
  for(const [key,c] of Object.entries(characters)){
    assert.equal(routesFor(c).includes(OFFICE_PUNCH_ROUTE),key==='office');
    assert.equal(controlsFor(key).combos.some(r=>r.label.includes('SACUDIDA')),key==='office');
  }
  const c=characters.office,shared=routesFor(c).find(r=>r.id==='ppkkk');
  assert.deepEqual(routeAnimations(c,shared).slice(0,2),OFFICE_PUNCH_ROUTE.animations.slice(0,2));
  assert.deepEqual(sequenceOptions({path:['punch','punch']},c),['kick','punch']);
  assert.deepEqual(sequenceOptions({path:OFFICE_PUNCH_ROUTE.inputs},c),[]);
  assert.deepEqual(c.grabShake.poses,Array.from({length:6},(_,i)=>c.punchShakeArtStart+18+i));
  assert.ok(c.grabShake.start<c.grabShake.release && c.grabShake.release<c.grabShake.total);
});

test('Gomelo punch/shake atlas keeps twenty-four complete transparent poses aligned to the floor',()=>{
  const c=characters.office,png=readPng(new URL('../src/data/players/office_punch_shake_v1.png',import.meta.url));
  assert.equal(png.width,1920);assert.equal(png.height,1280);
  for(let i=0;i<24;i++){
    const x0=i%6*320,y0=Math.floor(i/6)*320,frame=c.punchShakeArtStart+i;
    assert.deepEqual(c.frameRects[frame],{x:x0,y:6678+y0,width:320,height:320});
    assert.equal(c.frameBaselines[frame],6678+y0+304);
    let count=0,bottom=-1;
    for(let y=0;y<320;y++)for(let x=0;x<320;x++){
      if(png.pixel(x0+x,y0+y)[3]<=32)continue;
      count++;bottom=Math.max(bottom,y);
      assert.ok(x>0 && x<319 && y>0 && y<319,'hands and feet remain inside their cell');
    }
    assert.ok(count>3000);assert.equal(bottom,303);
  }
});
