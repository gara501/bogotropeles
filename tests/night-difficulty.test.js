import test from 'node:test';
import assert from 'node:assert/strict';
import {DIFFICULTIES,applyDifficulty,difficultyFor,loadDifficulty,saveDifficulty} from '../src/data/difficulty.js';
import {RunState} from '../src/game/RunState.js';
import {ZONA_ROSA_NIGHT} from '../src/data/night.js';
import {NightMode} from '../src/stage/NightMode.js';
import {COMBAT_CAMPAIGN} from '../src/data/campaign.js';

test('difficulty multiplies the level ladder; normal leaves it untouched',()=>{
  const level={name:'X',hp:1.2,speed:1.1,damage:1.3,pressure:1.2,gap:700};
  assert.equal(applyDifficulty(level,difficultyFor('normal')),level);
  const easy=applyDifficulty(level,difficultyFor('facil')),hard=applyDifficulty(level,difficultyFor('hora_pico'));
  assert.ok(easy.hp<level.hp && easy.damage<level.damage && easy.gap>level.gap);
  assert.ok(hard.hp>level.hp && hard.speed>level.speed && hard.pressure>level.pressure && hard.gap<level.gap);
  assert.equal(difficultyFor('???').id,'normal');assert.equal(DIFFICULTIES.length,3);
});
test('difficulty sets lives before the run starts and on every continue, not mid-run',()=>{
  const run=new RunState();assert.equal(run.lives,3);
  run.setDifficulty('facil');assert.equal(run.lives,5);
  run.loseLife();run.setDifficulty('normal');assert.equal(run.lives,4,'a started run keeps its lives');
  run.setDifficulty('facil');run.lives=0;run.continue();assert.equal(run.lives,5);
  run.reset();assert.equal(run.lives,5);
});
test('difficulty survives storage and fails safe',()=>{
  const data={},storage={getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;}};
  saveDifficulty('hora_pico',storage);assert.equal(loadDifficulty(storage),'hora_pico');
  assert.equal(loadDifficulty({getItem(){throw new Error('blocked');}}),'normal');
});
test('Zona Rosa plays at night; glows follow the panorama as the camera pans',()=>{
  assert.equal(COMBAT_CAMPAIGN.find(l=>l.name==='Zona Rosa').night,ZONA_ROSA_NIGHT);
  const made=[];const sprite=()=>{const o={x:0,y:0,visible:true,setBlendMode(){return o;},setScrollFactor(){return o;},setDepth(){return o;},setTint(...t){o.tint=t;return o;},
    setVisible(v){o.visible=v;return o;},setPosition(x,y){o.x=x;o.y=y;return o;},setScale(){return o;},setAlpha(a){o.alpha=a;return o;},destroy(){}};made.push(o);return o;};
  const panorama={file:'panorama',sprite:{x:0,y:0,scaleX:.5,scaleY:.5,setTint(...t){this.tint=t;}}},floor={file:'floor',sprite:{setTint(t){this.tint=t;}}};
  const scene={textures:{exists:()=>true},add:{image:()=>sprite()}};
  const night=new NightMode(scene,ZONA_ROSA_NIGHT,{layers:[panorama,floor]});
  assert.deepEqual(panorama.sprite.tint,ZONA_ROSA_NIGHT.tint);assert.equal(floor.sprite.tint,ZONA_ROSA_NIGHT.floorTint);
  night.update();const sign=night.lights[3];assert.equal(sign.sprite.x,Math.round(sign.x*.5));
  panorama.sprite.x=-300;night.update();assert.equal(sign.sprite.x,Math.round(sign.x*.5-300));
  assert.ok(night.lights.some(l=>!l.sprite.visible),'off-screen glows are hidden');
  const none=new NightMode(scene,ZONA_ROSA_NIGHT,{layers:[floor]});none.update();assert.equal(none.lights.length,0);
});
