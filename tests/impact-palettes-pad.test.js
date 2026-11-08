import test from 'node:test';
import assert from 'node:assert/strict';
import {impactWord,IMPACT,ImpactText} from '../src/fx/ImpactText.js';
import {PALETTES,loadPaletteState,unlockPalette,paletteFor,cyclePalette,applyPalette,savePaletteState} from '../src/data/palettes.js';
import {PAD,padDirection,arrowFor,GamepadBridge} from '../src/input/GamepadBridge.js';
import {TouchInput} from '../src/input/TouchInput.js';

test('comic words only on strong hits, KO words on the last hit, nothing for hole falls',()=>{
  assert.equal(impactWord({type:'punch',damage:10},10,false),null);
  assert.ok(IMPACT.words.punch.includes(impactWord({type:'punch',finisher:true},20,false)));
  assert.ok(IMPACT.words.kick.includes(impactWord({type:'kick'},IMPACT.minDamage,false)));
  assert.ok(IMPACT.words.heavy.includes(impactWord({type:'stomp',knockdown:true},40,false)));
  assert.ok(IMPACT.words.ko.includes(impactWord({type:'punch'},5,true)));
  assert.equal(impactWord({type:'hole'},80,true),null);
});
test('boss finale slows the game clock and restores it',()=>{
  let later;const s={cameras:{main:{zoomTo(z){this.z=z;},flash(){},shake(){}}},tweens:{timeScale:1},time:{delayedCall:(ms,fn)=>{later=fn;}},events:{once(){}}};
  const t=new ImpactText(s);t.finale();assert.equal(s.timeScale,IMPACT.finale.slow);assert.equal(s.cameras.main.z,IMPACT.finale.zoom);
  t.finale();later();assert.equal(s.timeScale,1);assert.equal(s.tweens.timeScale,1);assert.equal(s.cameras.main.z,1);
});
const memory=()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;}};};
test('palettes: free ones cycle, locked ones need their unlock, state survives storage',()=>{
  const storage=memory(),state=loadPaletteState(storage);
  assert.equal(paletteFor('office',state).id,'original');
  assert.equal(cyclePalette('office',state).id,'noche');assert.equal(cyclePalette('office',state).id,'original','neón y dorado bloqueados');
  state.selected.office='dorado';assert.equal(paletteFor('office',state).id,'original');
  assert.equal(unlockPalette(state,'campaign'),true);assert.equal(unlockPalette(state,'campaign'),false);
  assert.equal(paletteFor('office',state).id,'dorado');savePaletteState(state,storage);
  assert.deepEqual(loadPaletteState(storage).unlocked,['campaign']);
  assert.deepEqual(loadPaletteState({getItem(){throw new Error('blocked');}}),{selected:{},unlocked:[]});
});
test('palette tint survives a hit flash: clearTint puts it back',()=>{
  const sprite={tint:null,setTint(t){this.tint=t;return this;},clearTint(){this.tint=null;return this;},setTintFill(t){this.tint=t;}};
  applyPalette(sprite,PALETTES[1]);assert.equal(sprite.tint,PALETTES[1].tint);
  sprite.setTintFill(0xffffff);sprite.clearTint();assert.equal(sprite.tint,PALETTES[1].tint);
  applyPalette(sprite,PALETTES[0]);assert.equal(sprite.tint,null);
});
const fakePad=(buttons=[],axes=[0,0])=>({connected:true,axes,buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i)}))});
test('gamepad direction: stick with dead zone, d-pad wins; arrows pick the dominant axis',()=>{
  assert.deepEqual(padDirection(fakePad([],[.1,-.1])),{x:0,y:0});
  assert.deepEqual(padDirection(fakePad([],[.8,0])),{x:.8,y:0});
  assert.deepEqual(padDirection(fakePad([14],[.8,0])),{x:-1,y:0});
  assert.equal(arrowFor({x:.2,y:-.9}),'ArrowUp');assert.equal(arrowFor({x:0,y:0}),null);
});
test('in play the pad presses and holds the same actions as the touch buttons',()=>{
  const input=new TouchInput(),game={touchControls:{input}};
  const bridge=Object.assign(Object.create(GamepadBridge.prototype),{game,menuActive:()=>false,prev:new Map(),driving:false,held:new Set(),arrow:null});
  globalThis.navigator??={};const pads=[fakePad([2],[0,.9])];Object.defineProperty(globalThis.navigator,'getGamepads',{value:()=>pads,configurable:true});
  bridge.poll(0);
  assert.equal(input.isDown('H'),true);assert.equal(input.justDown('H'),true);assert.equal(input.y,.9);
  pads[0]=fakePad([0]);bridge.poll(16);
  assert.equal(input.isDown('H'),false);assert.equal(input.justDown('SPACE'),true);assert.equal(input.justDown('ENTER'),true);assert.equal(input.y,0);
  assert.deepEqual(PAD.game[4],['U']);
});
