import test from 'node:test';
import assert from 'node:assert/strict';
import {SURVIVAL,survivalLevel,waveCount,rampFor,saveSurvivalRecord,loadSurvivalRecord,Survival} from '../src/game/Survival.js';
import {RunState} from '../src/game/RunState.js';
import {applyDifficulty,difficultyFor} from '../src/data/difficulty.js';
import {stageLayout} from '../src/stage/scroll.js';

test('survival level: one locked arena, mixed pool without riders or bosses',()=>{
  const level=survivalLevel({name:'Calles del centro',enemies:['walker'],boss:'brayatan',taxiRush:{arena:1},hazards:{taxi:true}},()=>.3);
  assert.equal(level.boss,null);assert.equal(level.taxiRush,null);assert.ok(level.hazards,'keeps the street hazards');
  assert.deepEqual([...level.enemies].sort(),[...SURVIVAL.pool].sort());assert.ok(!level.enemies.includes('rider'));
  assert.equal(stageLayout(level).arenas,1);
});
test('waves grow and the street ramps up, within caps',()=>{
  assert.deepEqual([0,2,3,6,9,30].map(waveCount),[2,2,3,4,5,6]);
  const base={hp:1,damage:1,speed:1,pressure:1,gap:1000},w0=rampFor(base,0),w10=rampFor(base,10),w999=rampFor(base,999);
  assert.deepEqual(w0,{...base});assert.ok(w10.hp>1 && w10.gap<1000);
  assert.equal(w999.hp,SURVIVAL.ramp.maxHp);assert.equal(w999.gap,SURVIVAL.ramp.minGap);
});
test('difficulty survives the ramp (it scales the base too)',()=>{
  const level=applyDifficulty(survivalLevel({name:'x'}),difficultyFor('hora_pico'));
  assert.ok(level.base.hp>survivalLevel({name:'x'}).base.hp);
  const scene={level,health:50,addScore(p){this.score=(this.score??0)+p;}};new Survival(scene).onWave(0);
  assert.equal(scene.level.hp,level.base.hp);
});
test('every fifth wave heals and pays a wave bonus',()=>{
  const level=survivalLevel({name:'x'}),scene={level,health:40,score:0,addScore(p){this.score+=p;}},s=new Survival(scene);
  s.onWave(4);assert.equal(scene.health,40);assert.equal(s.wave,5);
  s.onWave(5);assert.equal(scene.health,40+SURVIVAL.heal);assert.ok(scene.score>0);
});
test('survival runs have one life and no continues; story runs are unchanged',()=>{
  const run=new RunState();run.startSurvival(1);assert.equal(run.lives,1);assert.equal(run.canContinue,false);
  run.reset();assert.equal(run.mode,'story');assert.equal(run.canContinue,true);
});
test('survival record keeps the best wave',()=>{
  const data={},storage={getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;}};
  assert.equal(saveSurvivalRecord({wave:7,score:900,character:'A'},storage).isNew,true);
  assert.equal(saveSurvivalRecord({wave:5,score:5000,character:'B'},storage).isNew,false);
  assert.equal(saveSurvivalRecord({wave:7,score:1200,character:'C'},storage).isNew,true);
  assert.deepEqual(loadSurvivalRecord(storage),{wave:7,score:1200,character:'C'});
});
