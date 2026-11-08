import test from 'node:test';
import assert from 'node:assert/strict';
import {AuraDuel,AURA_RULES as R,AURA_SEQUENCES,AURA_MOVE_IDS} from '../src/aura/AuraDuel.js';
import {readPng} from './helpers/readPng.js';

// Deterministic picks: cycles through the five emotes in order.
const cycle=()=>{let i=0;return ()=>((i++)%AURA_MOVE_IDS.length+.5)/AURA_MOVE_IDS.length;};
const ready=()=>{const d=new AuraDuel({random:cycle()});d.start();d.step(R.intro);return d;};
const toInput=d=>{d.step(d.phaseLength());assert.equal(d.phase,'input');return d;};
const finish=d=>{let guard=0;while(guard++<20 && !['input','won','emptied'].includes(d.phase))d.step(d.phaseLength());return d;};

test('the rival shows the sequence first: presses before the input phase are ignored',()=>{
  const d=new AuraDuel({random:cycle()});
  assert.equal(d.press('UP'),null,'waiting');d.start();assert.equal(d.press('UP'),null,'intro');
  d.step(R.intro);assert.equal(d.phase,'demo');assert.equal(d.round,0);
  assert.deepEqual(d.moves,['six-seven','boat-paddle-dance']);assert.deepEqual(d.sequence,['UP','DOWN','LEFT','RIGHT']);
  assert.equal(d.showing,0);d.step(R.demoStep);assert.equal(d.showing,1);assert.equal(d.press('UP'),null,'demo');
  toInput(d);assert.equal(d.inputLeft,R.inputBase+4*R.inputPerKey);
});

test('a clean sequence fills the aura, completes one emote every two inputs and plays the performance',()=>{
  const d=toInput(ready());
  assert.deepEqual(d.sequence.map(k=>d.press(k)),['ok','move','ok','clean']);
  assert.equal(d.meter,R.start+R.gain);assert.equal(d.phase,'perform');assert.equal(d.press('UP'),null,'performing');
  d.step(d.phaseLength());assert.equal(d.phase,'demo');assert.equal(d.round,1);
  assert.ok(d.takeEvents().some(e=>e.type==='success'));
});

test('a wrong key or the timer running out drains the aura and the rival replays the sequence',()=>{
  const wrong=toInput(ready());wrong.press('UP');assert.equal(wrong.press('KICK'),'fail');
  assert.equal(wrong.meter,R.start-R.loss);assert.equal(wrong.phase,'replay');assert.deepEqual(wrong.failure,{reason:'wrong',at:1,input:'KICK'});
  assert.equal(wrong.press('DOWN'),null,'no answers while the rival replays');
  assert.equal(wrong.showing,0);wrong.step(wrong.phaseLength());assert.equal(wrong.phase,'demo');assert.equal(wrong.round,1);
  const late=toInput(ready());late.step(late.inputLimit-1);assert.equal(late.phase,'input');late.step(1);
  assert.equal(late.phase,'replay');assert.equal(late.failure.reason,'time');
});

test('three clean rounds from the starting aura win the battle; the finished battle ignores input',()=>{
  const d=ready();let rounds=0;
  while(!d.won && rounds<10){toInput(d);for(const k of d.sequence)d.press(k);d.step(d.phaseLength());rounds++;}
  assert.equal(rounds,Math.ceil((R.goal-R.start)/R.gain));assert.equal(d.meter,R.goal);
  assert.equal(d.press('UP'),null);d.step(99999);assert.equal(d.phase,'won');
});

test('an empty aura bar waits for the stage, then refill restarts from the starting aura with a new round',()=>{
  const d=ready();
  while(d.phase!=='emptied'){toInput(d);d.press(d.sequence[0]==='UP'?'KICK':'UP');d.step(d.phaseLength());}
  assert.equal(d.meter,0);assert.equal(d.refill(),true,'the stage may refill before the pause ends too');
  assert.equal(d.meter,R.start);assert.equal(d.phase,'demo');assert.equal(d.refill(),false);
  const e=ready();while(e.phase!=='emptied'){toInput(e);e.press(e.sequence[0]==='UP'?'KICK':'UP');e.step(e.phaseLength());}
  e.takeEvents();e.step(R.emptiedMs);assert.ok(e.takeEvents().some(ev=>ev.type==='emptied-ready'));assert.equal(e.phase,'emptied');
});

test('rounds grow longer, never repeat an emote twice in a row, and every emote maps to two inputs',()=>{
  const same=new AuraDuel({random:()=>0});same.start();same.step(R.intro);
  for(let i=1;i<same.moves.length;i++)assert.notEqual(same.moves[i],same.moves[i-1]);
  const d=ready(),lengths=[];
  for(let i=0;i<6;i++){lengths.push(d.moves.length);toInput(d);for(const k of d.sequence)d.press(k);d.step(d.phaseLength());if(d.won)break;}
  assert.deepEqual(lengths.slice(0,3),R.moves.slice(0,3));
  for(const keys of Object.values(AURA_SEQUENCES))assert.equal(keys.length,2);
});

test('aura production background, NPC sheet and fighter sheets match the stage geometry',()=>{
  const bg=readPng(new URL('../src/scenes/aura/background.png',import.meta.url));
  const crowd=readPng(new URL('../src/scenes/aura/game/cast-v2/crowd.png',import.meta.url));
  assert.equal(bg.width,1536);assert.equal(bg.height,864);
  assert.equal(crowd.width,768);assert.equal(crowd.height,512);
  for(const hero of ['office','student','teleperforman','gymbro','magolita'])for(const move of AURA_MOVE_IDS){
    const png=readPng(new URL(`../src/scenes/aura/game/players/${hero}-${move}.png`,import.meta.url));
    assert.equal(png.width,384,`${hero} ${move}`);assert.equal(png.height,256,`${hero} ${move}`);
  }
});
