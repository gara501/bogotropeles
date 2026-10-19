import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { LevelMusic, MUSIC_VOLUME } from '../src/audio/LevelMusic.js';

function setup({locked=false,exists=true}={}) {
  const manager=new EventEmitter();manager.locked=locked;
  const calls=[];
  const track={isPlaying:false,isPaused:false,
    play(){calls.push('play');this.isPlaying=true;this.isPaused=false;},
    pause(){calls.push('pause');this.isPlaying=false;this.isPaused=true;},
    resume(){calls.push('resume');this.isPlaying=true;this.isPaused=false;},
    stop(){calls.push('stop');this.isPlaying=false;this.isPaused=false;},
    destroy(){calls.push('destroy');},
  };
  manager.add=(key,config)=>{assert.equal(key,'music-6');assert.deepEqual(config,{loop:true,volume:MUSIC_VOLUME});return track;};
  const music=new LevelMusic({sound:manager,cache:{audio:{exists:()=>exists}}},'music-6');
  const unlock=()=>{manager.locked=false;manager.emit('unlocked');};
  return {music,manager,track,calls,unlock};
}

test('level music loops and resumes its paused position instead of starting another sound',()=>{
  const {music,calls}=setup();music.setPaused(true);music.setPaused(true);music.setPaused(false);music.setPaused(false);
  assert.deepEqual(calls,['play','pause','resume']);
  music.stop();music.setPaused(false);assert.deepEqual(calls,['play','pause','resume','stop']);
});

test('audio unlock while paused waits until the player resumes',()=>{
  const {music,calls,unlock}=setup({locked:true});music.setPaused(true);unlock();
  assert.deepEqual(calls,[]);music.setPaused(false);assert.deepEqual(calls,['play']);
});

test('scene shutdown removes pending unlock and destroys the old track before another level',()=>{
  const {music,calls,unlock,manager}=setup({locked:true});
  assert.equal(manager.listenerCount('unlocked'),1);music.destroy();unlock();
  assert.equal(manager.listenerCount('unlocked'),0);assert.deepEqual(calls,['stop','destroy']);assert.equal(music.track,null);
  const next=setup();assert.deepEqual(next.calls,['play']);assert.deepEqual(calls,['stop','destroy']);
});

test('victory before audio unlock prevents playback starting after the encounter',()=>{
  const {music,calls,unlock}=setup({locked:true});music.stop();unlock();music.setPaused(false);
  assert.deepEqual(calls,['stop']);
});

test('failed audio loading leaves gameplay functional',()=>{
  const {music,calls,unlock}=setup({locked:true,exists:false});unlock();music.setPaused(true);music.setPaused(false);music.destroy();
  assert.deepEqual(calls,[]);
});
