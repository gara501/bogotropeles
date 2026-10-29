import test from 'node:test';
import assert from 'node:assert/strict';
import {RunState,ContinueCountdown,saveRecord} from '../src/game/RunState.js';
import {MUSIC_TRACKS,chooseMusic} from '../src/audio/musicTracks.js';
import {existsSync} from 'node:fs';

test('three lives persist across levels, continuing preserves points and a new game clears progress',()=>{
  const run=new RunState();assert.equal(run.lives,3);
  run.award(100);run.loseLife();run.advance(3);assert.equal(run.lives,2);assert.equal(run.score,100);
  run.loseLife();run.loseLife();run.loseLife();assert.equal(run.lives,0);
  run.continue();assert.equal(run.lives,3);assert.equal(run.level,3);assert.equal(run.score,100);
  run.reset();assert.equal(run.level,0);assert.equal(run.score,0);assert.equal(run.lives,3);
});
test('continue counts 10 to 0 against a deadline; a background delay cannot extend it',()=>{
  let now=0;const countdown=new ContinueCountdown(()=>now);
  for(let second=0;second<=10;second++){now=second*1000;assert.equal(countdown.remaining,10-second);}
  assert.equal(countdown.accept(),false);now=90000;assert.equal(countdown.remaining,0);
});
test('continue can be accepted once before zero and never at the exact expiry boundary',()=>{
  let now=0;const accepted=new ContinueCountdown(()=>now);now=9999;
  assert.equal(accepted.accept(),true);assert.equal(accepted.accept(),false);
  const expired=new ContinueCountdown(()=>now);now+=10000;assert.equal(expired.accept(),false);
});
test('record preserves the best score and character across runs; malformed or unavailable storage is safe',()=>{
  let value=null;const storage={getItem:()=>value,setItem:(key,v)=>value=v};
  assert.deepEqual(saveRecord(1000,'GYMBRO',storage),{score:1000,character:'GYMBRO'});
  assert.deepEqual(saveRecord(500,'GOMELO',storage),{score:1000,character:'GYMBRO'});
  assert.deepEqual(saveRecord(2000,'UNIVERSITARIA',storage),{score:2000,character:'UNIVERSITARIA'});
  value='{broken';assert.equal(saveRecord(250,'GOMELO',storage).score,250);
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(saveRecord(500,'TELEPERFORMAN',blocked).character,'TELEPERFORMAN');
});
test('all ten music choices reference existing audio files and random selection avoids an immediate repeat',()=>{
  assert.equal(MUSIC_TRACKS.length,10);
  MUSIC_TRACKS.forEach((track,i)=>assert.ok(existsSync(new URL(`../public/assets/music${i+1}.${i<7?'ogg':'mp3'}`,import.meta.url))));
  assert.ok(MUSIC_TRACKS.slice(7).every(t=>t.url.endsWith('.mp3')));
  const results=new Set();for(let i=0;i<10;i++)results.add(chooseMusic(null,()=>i/10).key);assert.equal(results.size,10);
  for(const track of MUSIC_TRACKS)for(const random of [0,.5,.999])assert.notEqual(chooseMusic(track.key,()=>random).key,track.key);
});

test('five continues per game; a new game restores them',async()=>{
  const {MAX_CONTINUES}=await import('../src/game/RunState.js');
  const run=new RunState();assert.equal(MAX_CONTINUES,5);
  for(let i=0;i<5;i++){assert.equal(run.canContinue,true);assert.equal(run.continuesLeft,5-i);assert.equal(run.continue(),true);}
  assert.equal(run.canContinue,false);assert.equal(run.continuesLeft,0);run.lives=0;assert.equal(run.continue(),false);assert.equal(run.lives,0);
  run.reset();assert.equal(run.continuesLeft,5);
});

test('local ranking keeps the top 10 with clean 3-letter initials',async()=>{
  const {loadRanking,addToRanking,qualifiesForRanking,cleanInitials,RANKING_SIZE}=await import('../src/game/RunState.js');
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.equal(cleanInitials(' a-b c d '),'ABC');assert.deepEqual(loadRanking(storage),[]);
  assert.equal(qualifiesForRanking(0,[]),false);assert.equal(qualifiesForRanking(10,[]),true);
  for(let i=1;i<=12;i++)addToRanking({initials:'p'+i,score:i*100,character:'GYMBRO',level:1},storage);
  const ranking=loadRanking(storage);assert.equal(ranking.length,RANKING_SIZE);assert.equal(ranking[0].score,1200);assert.equal(ranking.at(-1).score,300);
  assert.equal(qualifiesForRanking(300,ranking),false);assert.equal(qualifiesForRanking(301,ranking),true);
  const {position,ranking:after}=addToRanking({initials:'zz',score:650},storage);assert.equal(position,6);assert.equal(after[6].initials,'ZZ');
  assert.equal(addToRanking({initials:'low',score:1},storage).position,-1);
  data.set('street-bogota-ranking-v1','{broken');assert.deepEqual(loadRanking(storage),[]);
});
