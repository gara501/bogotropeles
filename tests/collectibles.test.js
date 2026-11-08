import test from 'node:test';
import assert from 'node:assert/strict';
import {MONSERRATE_CARD,COLLECTIBLE_CARDS,LEVEL_CARDS,cardForPerfectLevel,loadCards,unlockCard} from '../src/game/Collectibles.js';
import {RunState} from '../src/game/RunState.js';
import {CAMPAIGN} from '../src/data/campaign.js';
import {readFileSync} from 'node:fs';
import {MonserrateRun,MONSERRATE} from '../src/monserrate/MonserrateRun.js';

function memory(){const entries=new Map();return {getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};}

test('all six requested cards map to their stable campaign identity, independent of stage order',()=>{
  const expected=[['las-damas-de-la-montana','Transmilleno · Exterior'],['boda-en-transmilleno','Ciclovía'],
    ['el-2x1','Plaza de Palomojao'],['toreto','Plaza de Bolívar'],['tapabocas','Transmilleno · Estación'],['semaforo','Calles del centro']];
  assert.equal(COLLECTIBLE_CARDS.length,7);
  for(const [id,name] of expected){
    const level=CAMPAIGN.find(l=>l.name===name);assert.ok(level,name);
    assert.equal(cardForPerfectLevel(level,{won:true})?.id,id);
    assert.equal(cardForPerfectLevel(level,{won:false}),null);
    assert.equal(cardForPerfectLevel(level,{won:true,deaths:1}),null);
    assert.equal(cardForPerfectLevel(level,{won:true,bonus:true}),null);
  }
  assert.equal(cardForPerfectLevel(CAMPAIGN.find(l=>l.mode==='monserrate'),{won:true}),null,'Monserrate retains its separate no-contact rule');
});

test('a recovered life or a continue cannot restore a deathless collectible attempt',()=>{
  const run=new RunState(),level=CAMPAIGN[0],start=run.deaths;
  run.loseLife();run.addLife();assert.equal(run.lives,3);
  assert.equal(cardForPerfectLevel(level,{won:true,deaths:run.deaths-start}),null);
  run.continue();assert.equal(run.lives,3);
  assert.equal(cardForPerfectLevel(level,{won:true,deaths:run.deaths-start}),null);
  assert.equal(cardForPerfectLevel(level,{won:true,eligible:false}),null,'unverified boss-only entry never qualifies');
});

test('existing Monserrate saves migrate unchanged into the seven-card collection; all unlocks persist once',()=>{
  const storage=memory();unlockCard(MONSERRATE_CARD.id,storage,undefined,()=> 'old-date');
  for(const card of LEVEL_CARDS)unlockCard(card.id,storage,undefined,()=> 'new-date');
  for(const card of COLLECTIBLE_CARDS)unlockCard(card.id,storage,undefined,()=> 'duplicate-date');
  const saved=loadCards(storage);assert.equal(saved.length,7);assert.equal(saved[0].unlockedAt,'old-date');
  assert.deepEqual(new Set(saved.map(c=>c.id)),new Set(COLLECTIBLE_CARDS.map(c=>c.id)));
  assert.deepEqual(loadCards(storage,'qa-cards'),[]);
  const duplicated={getItem:()=>JSON.stringify([...saved,saved[0],{id:'fake',unlockedAt:'now'}])};
  assert.equal(loadCards(duplicated).length,7);
});

test('all collectible paintings share the original 512x288 format and record PixelLab provenance',()=>{
  for(const card of COLLECTIBLE_CARDS){
    const file=new URL(`../src/data/collectibles/${card.art}.png`,import.meta.url),png=readFileSync(file);
    assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),288);
    const info=JSON.parse(readFileSync(new URL(`../src/data/collectibles/${card.art}.json`,import.meta.url),'utf8'));
    assert.equal(info.provider,'PixelLab');assert.equal(info.tool,'image_to_pixelart');
  }
});
test('the Peña-Lisa card persists once and can be reopened after a new collection session',()=>{
  const storage=memory();assert.deepEqual(loadCards(storage),[]);
  unlockCard(MONSERRATE_CARD.id,storage,undefined,()=> '2026-11-03T12:00:00Z');
  unlockCard(MONSERRATE_CARD.id,storage,undefined,()=> '2026-11-04T12:00:00Z');
  assert.deepEqual(loadCards(storage),[{id:MONSERRATE_CARD.id,unlockedAt:'2026-11-03T12:00:00Z'}]);
  assert.equal(MONSERRATE_CARD.points,5000);assert.equal(MONSERRATE_CARD.name,'El perdido de la Peña-Lisa');
  assert.deepEqual(loadCards(storage,'qa-cards'),[],'QA collection cannot overwrite real collection');
});

test('corrupt or unavailable local storage cannot break a reward screen',()=>{
  const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.deepEqual(loadCards(broken),[]);assert.equal(unlockCard(MONSERRATE_CARD.id,broken).length,1);
  assert.deepEqual(loadCards({getItem:()=>'{bad json'}),[]);
  assert.deepEqual(unlockCard('unknown',memory()),[]);
});

test('only a completed course with zero contacts qualifies for the collectible',()=>{
  const run=new MonserrateRun();assert.equal(run.flawless,false);
  run.distance=MONSERRATE.length-.1;run.nextWave=Infinity;run.step(50);
  assert.equal(run.flawless,true);
  run.crashes=1;assert.equal(run.flawless,false);
});

test('the dash HUD remains bounded at the finish so a perfect victory can reach its reward modal',()=>{
  const run=new MonserrateRun();run.elapsed=60000;run.distance=MONSERRATE.length;
  assert.equal(run.dashReady,false);assert.equal(run.dashCharge,1);
  run.dashReadyAt=run.elapsed+2000;assert.ok(run.dashCharge>=0 && run.dashCharge<=1);
});

test('contacts during invulnerability still invalidate the perfect ascent, including stationary vendors',()=>{
  for(const kind of ['walker','vendor']){
    const run=new MonserrateRun();run.nextWave=Infinity;run.invulnerableUntil=99999;
    if(kind==='walker')run.npcs=[{id:1,lane:0,z:.01,passed:false}];
    else{run.distance=run.vendors[0].at-.01;run.x=-1;}
    assert.equal(run.step(50).hits.length,0,'protection still prevents HP damage');
    assert.equal(run.crashes,1);run.respawn();assert.equal(run.crashes,1,'respawning cannot erase a crash');
    run.distance=MONSERRATE.length;assert.equal(run.flawless,false);
  }
});
