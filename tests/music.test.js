import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { LevelMusic, MUSIC_VOLUME } from '../src/audio/LevelMusic.js';

function bufferSource(){
  const events=new EventEmitter();
  return {addEventListener:(event,handler)=>events.once(event,handler),end:()=>events.emit('ended')};
}

test('WebAudio recovers when both loop buffers end despite Phaser reporting playing',()=>{
  const {music,scene,track,calls}=setup();track.audioBuffer={};track.duration=72;track.seek=10;
  const first=bufferSource(),next=bufferSource();track.source=first;track.loopSource=next;
  music.sync();first.end();scene.events.emit('update',0);
  assert.deepEqual(calls,['play'],'the next scheduled buffer is still alive');
  track.play=function(){calls.push('play');this.source=bufferSource();this.loopSource=bufferSource();this.seek=0;return true;};
  next.end();scene.events.emit('update',1000);assert.deepEqual(calls,['play','play']);
  scene.events.emit('update',2000);assert.equal(calls.length,2,'recovered music is not restarted again');
});

test('WebAudio recovers overdue loops and missing sources while respecting pause and stop',()=>{
  const {music,scene,track,calls}=setup();track.audioBuffer={};track.duration=100;track.source=bufferSource();track.seek=40;
  scene.events.emit('update',0);assert.equal(calls.length,1);
  track.seek=102;scene.events.emit('update',1000);assert.equal(calls.length,2);
  track.seek=2;track.source=null;scene.events.emit('update',2000);assert.equal(calls.length,3);
  music.setPaused(true);scene.events.emit('update',3000);assert.deepEqual(calls,['play','play','play','pause']);
  music.stop();scene.events.emit('update',4000);assert.equal(calls.at(-1),'stop');
});

function setup({locked=false,exists=true,failures=0,context}={}) {
  const manager=new EventEmitter();manager.locked=locked;
  manager.context=context;
  const calls=[];
  const track={isPlaying:false,isPaused:false,
    play(){calls.push('play');if(failures-->0)return false;this.isPlaying=true;this.isPaused=false;return true;},
    pause(){calls.push('pause');this.isPlaying=false;this.isPaused=true;},
    resume(){calls.push('resume');this.isPlaying=true;this.isPaused=false;},
    stop(){calls.push('stop');this.isPlaying=false;this.isPaused=false;},
    destroy(){calls.push('destroy');},
  };
  manager.add=(key,config)=>{assert.equal(key,'music-6');assert.deepEqual(config,{loop:true,volume:MUSIC_VOLUME});return track;};
  const scene={sound:manager,events:new EventEmitter(),game:{events:new EventEmitter()},cache:{audio:{events:new EventEmitter(),exists:()=>exists}}};
  const music=new LevelMusic(scene,'music-6');
  const unlock=()=>{manager.locked=false;manager.emit('unlocked');};
  return {music,manager,track,calls,unlock,scene,setAvailable:value=>{exists=value;}};
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

test('transient play failure retries at most once per second until playback succeeds',()=>{
  const {scene,track,calls}=setup({failures:2});assert.equal(track.isPlaying,false);
  scene.events.emit('update',0);assert.deepEqual(calls,['play','play']);
  for(let t=1;t<1000;t+=20)scene.events.emit('update',t);assert.equal(calls.length,2);
  scene.events.emit('update',1000);assert.equal(track.isPlaying,true);assert.equal(calls.length,3);
  scene.events.emit('update',2000);assert.equal(calls.length,3,'healthy playback is never restarted');
});

test('unexpectedly stopped music recovers, but deliberate pause and victory remain silent',()=>{
  const {scene,music,track,calls}=setup();track.isPlaying=false;
  scene.events.emit('update',0);assert.equal(track.isPlaying,true);
  music.setPaused(true);const count=calls.length;scene.events.emit('update',1000);assert.equal(calls.length,count);
  music.stop();scene.events.emit('update',2000);scene.game.events.emit('focus');assert.equal(calls.at(-1),'stop');
});

test('late decoded track is created when it reaches the cache without reloading the level',()=>{
  const {music,scene,setAvailable,calls}=setup({exists:false});assert.equal(music.track,null);
  setAvailable(true);scene.cache.audio.events.emit('add',scene.cache.audio,'music-6');
  assert.deepEqual(calls,['play']);assert.ok(music.track);
});

test('context recovery and scene resume preserve paused playback position and clean up listeners',()=>{
  const states=new EventEmitter(),context={state:'suspended',addEventListener:(...a)=>states.on(...a),removeEventListener:(...a)=>states.off(...a)};
  const {music,scene,track,calls}=setup({context});assert.deepEqual(calls,[]);
  context.state='running';states.emit('statechange');assert.deepEqual(calls,['play']);
  track.isPlaying=false;track.isPaused=true;scene.events.emit('resume');assert.deepEqual(calls,['play','resume']);
  context.state='interrupted';states.emit('statechange');context.state='running';states.emit('statechange');
  assert.deepEqual(calls,['play','resume']);
  music.destroy();assert.equal(states.listenerCount('statechange'),0);assert.equal(scene.events.listenerCount('update'),0);
  assert.equal(scene.game.events.listenerCount('focus'),0);assert.equal(scene.cache.audio.events.listenerCount('add'),0);
});

test('HTML audio rejected by the browser recovers on a gesture without restarting its position',()=>{
  const {music,manager,track,calls}=setup();let attempts=0;
  track.audio={paused:true,currentTime:37,play(){attempts++;this.paused=false;return Promise.resolve();}};
  manager.emit('audio-gesture');assert.equal(attempts,1);assert.equal(track.audio.currentTime,37);
  assert.deepEqual(calls,['play'],'Phaser already reports playing, so restarting it would lose its position');
  track.audio.paused=true;music.setPaused(true);manager.emit('audio-gesture');assert.equal(attempts,1);
  music.destroy();manager.emit('audio-gesture');assert.equal(attempts,1);assert.equal(manager.listenerCount('audio-gesture'),0);
});
