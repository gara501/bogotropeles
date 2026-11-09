import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';
import {TELEPERFORMAN_PUNCH_ROUTE,TELEPERFORMAN_KICK_ROUTE,routesFor,routeAnimations,sequenceOptions} from '../src/data/comboRoutes.js';
import {EFFECT_FILES} from '../src/audio/SoundEffects.js';
import {playerAttackData} from '../src/data/attacks.js';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');
const {comboRows}=await import('../src/ui/CombosScreen.js');
const {controlsFor}=await import('../src/ui/ControlsScreen.js');

test('Teleperforman ground PPP uses ordinary punches ending in an uppercut; headset poses belong to the hold',()=>{
  const c=characters.teleperforman;
  assert.deepEqual(TELEPERFORMAN_PUNCH_ROUTE.animations,['chainPunch1','chainPunch2','chainPunch3']);
  for(let i=0;i<3;i++){
    const path=TELEPERFORMAN_PUNCH_ROUTE.inputs.slice(0,i+1),data=playerAttackData(c,'punch',i,false,path);
    assert.equal(data.impactType,'punch');assert.equal(data.range,c.attacks.punch.range);
    assert.equal(data.frames.find(f=>f.phase==='active').pose,c.animations[TELEPERFORMAN_PUNCH_ROUTE.animations[i]][2]);
    assert.equal(data.finisher,i===2);
    assert.ok(!c.grabShake.poses.includes(data.frames.find(f=>f.phase==='active').pose));
  }
  assert.equal(c.grabShake.damage*c.attacks.punch.damage,52);
});

test('held headset guard face matches the native idle instead of growing during the combo',()=>{
  const base=readPng(new URL('../src/data/players/player_3.png',import.meta.url));
  const atlas=readPng(new URL('../src/data/players/teleperforman_weapon_combos_v1.png',import.meta.url));
  const area=(png,x0,y0,w,h)=>{
    const pixels=new Set();
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const [r,g,b,a]=png.pixel(x0+x,y0+y);
      if(a>32 && r>100 && g>40 && r>g*1.2 && r>b*1.5)pixels.add(y*w+x);
    }
    let largest=0;
    while(pixels.size){
      const seed=pixels.values().next().value,queue=[seed];pixels.delete(seed);
      for(let i=0;i<queue.length;i++){
        const n=queue[i],x=n%w,y=Math.floor(n/w);
        for(const next of [x>0?n-1:-1,x<w-1?n+1:-1,y>0?n-w:-1,y<h-1?n+w:-1])if(pixels.delete(next))queue.push(next);
      }
      largest=Math.max(largest,queue.length);
    }
    return largest;
  };
  const native=characters.teleperforman.frameRects[characters.teleperforman.idle];
  const idleFace=area(base,native.x,native.y,native.width,55),comboFace=area(atlas,100,208,160,55);
  assert.ok(comboFace/idleFace>.85 && comboFace/idleFace<1.15,`${comboFace} vs ${idleFace} face pixels`);
});

test('Teleperforman gets two exclusive weapon animations and keeps a consistent shared opening',()=>{
  const c=characters.teleperforman;
  for(const [key,character] of Object.entries(characters))for(const route of [TELEPERFORMAN_PUNCH_ROUTE,TELEPERFORMAN_KICK_ROUTE])assert.equal(routesFor(character).includes(route),key==='teleperforman');
  assert.deepEqual(comboRows('teleperforman').map(r=>r.notation),['PPKKK','PPP','KKK']);
  assert.match(comboRows('teleperforman')[1].about,/puños/);assert.match(comboRows('teleperforman')[2].about,/suelo/);
  assert.ok(controlsFor('teleperforman').combos.some(r=>r.label.includes('CARNET')));
  assert.deepEqual(routeAnimations(c,routesFor(c)[0]).slice(0,2),TELEPERFORMAN_PUNCH_ROUTE.animations.slice(0,2));
  assert.deepEqual(sequenceOptions({path:['punch','punch']},c),['kick','punch']);
  for(const route of [TELEPERFORMAN_PUNCH_ROUTE,TELEPERFORMAN_KICK_ROUTE])assert.deepEqual(sequenceOptions({path:route.inputs},c),[]);
  assert.equal(EFFECT_FILES.shake,'shaking.wav');
});

test('weapon atlas keeps thirty-six complete transparent poses, cords and phone arcs with existing indices intact',()=>{
  const c=characters.teleperforman,png=readPng(new URL('../src/data/players/teleperforman_weapon_combos_v1.png',import.meta.url));
  assert.equal(png.width,2304);assert.equal(png.height,2304);assert.equal(c.weaponComboArtStart,149);
  for(let i=0;i<36;i++){
    const x0=i%6*384,y0=Math.floor(i/6)*384,frame=c.weaponComboArtStart+i;
    assert.deepEqual(c.frameRects[frame],{x:x0,y:8036+y0,width:384,height:384});
    assert.equal(c.frameBaselines[frame],8036+y0+368);
    assert.ok(c.keepDetachedFrames.includes(frame));
    let count=0,blue=0;
    for(let y=0;y<384;y++)for(let x=0;x<384;x++){
      const [r,g,b,a]=png.pixel(x0+x,y0+y);if(a<=32)continue;
      count++;assert.ok(x>0 && x<383 && y>0 && y<383,'weapons remain inside their cell');
      if(b>r+25 && b>g+5)blue++;
    }
    assert.ok(count>5000);
    if([20,26,32].includes(i))assert.ok(blue>500,'phone contact keeps its curved motion trail');
  }
});
