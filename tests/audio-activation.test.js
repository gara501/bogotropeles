import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {AudioActivation} from '../src/audio/AudioActivation.js';
import {LevelMusic} from '../src/audio/LevelMusic.js';

class Target extends EventTarget{
  constructor(){super();this.hidden=false;this.attributes={};}
  setAttribute(key,value){this.attributes[key]=value;}
  contains(node){return node===this;}
  fire(type){this.dispatchEvent(new Event(type));}
}
function fixture({state='suspended',locked=true,rejectFirst=false}={}){
  const calls=[],context=new Target();context.state=state;context.sampleRate=44100;context.destination={};
  context.resume=()=>{
    calls.push('resume');
    if(rejectFirst){rejectFirst=false;return Promise.reject(new Error('User gesture required'));}
    context.state='running';context.fire('statechange');return Promise.resolve();
  };
  context.createBuffer=(channels,length,rate)=>{assert.deepEqual([channels,length,rate],[1,1,44100]);return {};};
  context.createBufferSource=()=>({connect(){},disconnect(){},start(){calls.push('start');}});
  const manager=new EventEmitter();Object.assign(manager,{context,locked,mute:false,setMute(value){this.mute=value;}});
  const game={sound:manager,events:new EventEmitter()},document=new Target(),window=new Target(),button=new Target(),navigator={audioSession:{type:'auto'}};
  const activation=new AudioActivation(game,{document,window,navigator,button});
  const unlock=()=>{if(manager.unlocked){manager.unlocked=false;manager.locked=false;manager.emit('unlocked');}};
  return {activation,context,manager,game,document,window,button,navigator,calls,unlock};
}

test('audio resumes and primes a silent sample synchronously in the captured touch, then uses Phaser unlock',async()=>{
  const f=fixture();assert.deepEqual(f.calls,[]);assert.equal(f.button.textContent,'ACTIVAR SONIDO');
  f.document.fire('touchend');assert.deepEqual(f.calls,['resume','start']);
  assert.equal(f.navigator.audioSession.type,'playback');await Promise.resolve();f.unlock();
  assert.equal(f.button.textContent,'SONIDO: ON');assert.equal(f.button.attributes['aria-pressed'],'true');
  f.document.fire('click');assert.deepEqual(f.calls,['resume','start'],'a running context is left alone');f.activation.destroy();
});

test('a rejected touch-start attempt can be retried on touch-end instead of leaving sound permanently locked',async()=>{
  const f=fixture({rejectFirst:true});f.document.fire('pointerdown');await Promise.resolve();
  assert.equal(f.button.textContent,'ACTIVAR SONIDO');f.document.fire('touchend');await Promise.resolve();f.unlock();
  assert.equal(f.calls.filter(c=>c==='resume').length,2);assert.equal(f.button.textContent,'SONIDO: ON');f.activation.destroy();
});

test('an interrupted context with Phaser already unlocked starts music on recovery and never duplicates the track',()=>{
  const f=fixture({state:'interrupted',locked:false}),plays=[];
  const track={isPlaying:false,isPaused:false,play(){plays.push('play');this.isPlaying=true;},pause(){this.isPlaying=false;this.isPaused=true;},stop(){},destroy(){}};
  f.manager.add=()=>track;
  const music=new LevelMusic({sound:f.manager,cache:{audio:{exists:()=>true}}},'music-1');assert.deepEqual(plays,[]);
  f.document.fire('touchend');assert.deepEqual(plays,['play']);f.document.fire('click');assert.deepEqual(plays,['play']);
  music.setPaused(true);f.context.state='interrupted';f.context.fire('statechange');f.document.hidden=true;f.document.fire('visibilitychange');
  assert.equal(f.calls.filter(c=>c==='resume').length,1,'backgrounding does not resume audio');
  f.document.hidden=false;f.document.fire('visibilitychange');assert.deepEqual(plays,['play'],'game pause survives audio recovery');
  assert.equal(track.isPaused,true);music.destroy();assert.equal(f.manager.listenerCount('audio-ready'),0);f.activation.destroy();
});

test('the sound button enables sound even if Phaser unlocks between finger-down and click, and respects explicit mute',async()=>{
  const f=fixture();f.activation.onGesture({target:f.button,type:'pointerdown'});
  f.context.state='running';f.manager.locked=false;f.manager.emit('unlocked');f.button.fire('click');
  assert.equal(f.manager.mute,false,'the first enable tap must not turn sound off');
  f.activation.onGesture({target:f.button,type:'pointerdown'});f.button.fire('click');assert.equal(f.manager.mute,true);
  f.context.state='interrupted';f.context.fire('statechange');f.document.fire('touchend');assert.deepEqual(f.calls,[]);
  f.activation.onGesture({target:f.button,type:'pointerdown'});f.button.fire('click');await Promise.resolve();
  assert.equal(f.manager.mute,false);assert.equal(f.button.textContent,'SONIDO: ON');f.activation.destroy();
});

test('unsupported audio-session configuration and rejected resume never break the game; later input still retries',async()=>{
  const f=fixture({rejectFirst:true});Object.defineProperty(f.navigator.audioSession,'type',{set(){throw new Error('Unsupported');}});
  assert.doesNotThrow(()=>f.document.fire('touchend'));await Promise.resolve();
  f.document.fire('touchend');await Promise.resolve();f.unlock();assert.equal(f.button.textContent,'SONIDO: ON');f.activation.destroy();
});

test('destroy removes recovery/input handlers and ignores outstanding resume promises',async()=>{
  const f=fixture();f.document.fire('touchend');f.activation.destroy();await Promise.resolve();
  const count=f.calls.length;f.context.state='interrupted';f.context.fire('statechange');f.document.fire('touchend');f.window.fire('pageshow');
  assert.equal(f.calls.length,count);assert.equal(f.game.events.listenerCount('ready'),0);assert.equal(f.manager.listenerCount('unlocked'),0);
});

test('mute UI uses the requested state even when WebAudio gain.value has not applied the change yet',()=>{
  const f=fixture({state:'running',locked:false});
  f.manager.setMute=value=>f.manager.emit('mute',f.manager,value); // Like an AudioParam with a deferred gain.value.
  f.activation.onGesture({target:f.button,type:'pointerdown'});f.button.fire('click');
  assert.equal(f.button.textContent,'SONIDO: OFF');assert.equal(f.button.attributes['aria-pressed'],'false');
  f.activation.onGesture({target:f.button,type:'pointerdown'});f.button.fire('click');
  assert.equal(f.button.textContent,'SONIDO: ON');f.activation.destroy();assert.equal(f.manager.listenerCount('mute'),0);
});
