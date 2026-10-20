import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {TouchInput} from '../src/input/TouchInput.js';
import {registerHooks} from 'node:module';
import {CAMPAIGN,scaledEnemy,crossingHits} from '../src/data/campaign.js';
import {WaveDirector} from '../src/combat/WaveDirector.js';
import {beginEnemyCharge,updateEnemyCharge} from '../src/combat/enemyCharge.js';
import {beginEnemyAttack,updateEnemyAttack} from '../src/combat/enemyAttacks.js';
import {ArcadeRuntime} from '../src/game/ArcadeRuntime.js';
import {ARCADE} from '../src/data/arcade.js';
import {FixedClock} from '../src/game/FixedClock.js';
import {InputBuffer} from '../src/input/InputBuffer.js';
import {Enemy} from '../src/actors/Enemy.js';
import {timeline} from '../src/data/attacks.js';
import {ENEMY_ATTACK_SOUNDS} from '../src/audio/SoundEffects.js';

const hooks=registerHooks({load(url,context,nextLoad){
  if(url.endsWith('/src/data/levels.js'))return {format:'module',source:`export const levels=${JSON.stringify(CAMPAIGN.map((l,i)=>({...l,key:`level-${i+1}`})))};export const levelTextures=()=>[];`,shortCircuit:true};
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  if(url.includes('/node_modules/phaser/'))return {format:'module',source:'export default {Scene:class{},Math:{Clamp:(v,a,b)=>Math.max(a,Math.min(b,v))},Input:{Keyboard:{JustDown:k=>{const down=k.justDown;k.justDown=false;return down;}}}};',shortCircuit:true};
  const result=nextLoad(url,context);
  if(url.endsWith('/scenes/StreetScene.js'))return {...result,source:String(result.source).replaceAll('import.meta.env.DEV','false')};
  return result;
}});
const {StreetScene}=await import('../src/scenes/StreetScene.js');
const {IntroScene}=await import('../src/scenes/IntroScene.js');
const {EnergyPickups}=await import('../src/game/EnergyPickups.js');
const {enemies}=await import('../src/data/enemies.js');hooks.deregister();

class Visual {
  constructor(x=0,y=0){this.x=x;this.y=y;this.scaleY=1;this.width=960;this.height=540;this.anims={isPlaying:true,pause(){},resume(){}};}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setText(v){this.text=v;return this;}
  setVisible(v){this.visible=v;return this;}
  play(key){this.animation=key;this.anims.isPlaying=true;return this;}
  destroy(){this.destroyed=true;}
}
for(const method of ['setOrigin','setScale','setAlpha','setDepth','setFlipX','setFrame','stop'])Visual.prototype[method]=function(){return this;};
function setup(index,character='office') {
  const s=new StreetScene();s.init({level:index,character});
  s.enemies=[];s.player={x:200,y:450,key:character,config:s.character,sprite:new Visual(),shadow:new Visual()};
  s.counter=new Visual();s.dashStatus=new Visual();s.healthBar=new Visual();s.overlay=new Visual();s.overlay.list=[new Visual(),new Visual(),new Visual()];
  s.add={rectangle:(x,y)=>new Visual(x,y),text:(x,y)=>new Visual(x,y)};
  s.makeFighter=(x,y,key,config)=>({x,y,key,config,sprite:new Visual(x,y),shadow:new Visual(x,y)});
  s.tweens={add(){},killTweensOf(){},pauseAll(){},resumeAll(){}};s.cameras={main:{shake(){}}};
  s.game={events:new EventEmitter()};s.music={stop(){this.stopped=true;},setPaused(v){this.paused=v;}};
  s.keys=Object.fromEntries('W,A,S,D,H,J,K,L,SHIFT,SPACE,P,R,ENTER,UP,DOWN,LEFT,RIGHT'.split(',').map(k=>[k,{isDown:false,justDown:false}]));
  s.scene={restart(data){s.restartedWith=data;}};
  s.input={keyboard:{resetKeys(){}}};s.waves=new WaveDirector(s);s.waves.update();return s;
}
const strike={damage:10000,knockback:0,facing:1};
function pickupSetup(){
  const setup=arcadeSetup();
  for(const method of ['setTexture','setDisplaySize'])Visual.prototype[method]=function(value){this[method=== 'setTexture'?'texture':'displayWidth']=value;return this;};
  setup.s.add.image=(x,y)=>new Visual(x,y);
  setup.s.energyPickups=new EnergyPickups(setup.s,()=>1);
  return setup;
}

test('can takes two distinct active punches, plays break poses and drops one item that heals 25 energy once',()=>{
  const {s,press,step}=pickupSetup();s.health=40;
  const can=s.energyPickups.spawn(s.player.x+70,s.player.y),score=s.run.score;
  press('H');step(40);assert.equal(can.hp,1);assert.equal(can.sprite.texture,'can-2');assert.equal(s.energyPickups.items.length,0);
  press('H');step(40);assert.equal(can.hp,0);assert.equal(s.energyPickups.cans.length,0);assert.equal(s.energyPickups.items.length,1);
  s.player.x=can.x;step();assert.equal(s.health,65);assert.equal(s.healthBar.width,130);
  step(30);assert.equal(s.health,65);assert.equal(s.energyPickups.items.length,0);assert.equal(s.run.score,score);
});

test('can on levels 1, 2, 5, 6, taquilla on 3, 4, 5, 6, parking on 1, 3, 5, 6; every 4th drop is the full-energy changua',async()=>{
  const {containersFor,PICKUPS}=await import('../src/data/pickups.js');
  assert.deepEqual([0,1,2,3,4,5].map(containersFor),[['can','parking'],['can'],['taquilla','parking'],['taquilla'],['can','taquilla','parking'],['can','taquilla','parking']]);
  const {s}=pickupSetup();s.levelIndex=2;s.health=10;const system=s.energyPickups;
  const taquilla=system.spawn(s.player.x+300,s.player.y);assert.equal(taquilla.kind,'taquilla');
  const kinds=[1,2,3,4,5,6,7,8].map(()=>system.drop(0,0).kind);
  assert.deepEqual(kinds,['energy','energy','energy','full','energy','energy','energy','full']);assert.equal(PICKUPS.fullEvery,4);
  system.items=[];system.drops=3;const full=system.drop(s.player.x,s.player.y);assert.equal(full.kind,'full');system.rolled.add(0);
  system.update(9);assert.equal(full.sprite.destroyed,true);assert.equal(s.health,100,'the changua refills all energy');
});

test('TuLlave card: +1000 points even at full energy; parking breaks through its 4 poses and drops an item',async()=>{
  const {ITEMS,CONTAINERS}=await import('../src/data/pickups.js');
  const {s,press,step}=pickupSetup();s.health=100;s.addScore=function(points){this.run.score+=points;};const system=s.energyPickups;const score=s.run.score;
  const card=system.drop(s.player.x,s.player.y,'money');system.rolled.add(0);system.update(1);
  assert.equal(s.run.score,score+ITEMS.money.score);assert.equal(card.sprite.destroyed,true);assert.equal(s.health,100);
  assert.deepEqual(CONTAINERS.parking.poses,{hit:1,dented:1,breaking:[2,3]});
  const parking=system.spawn(s.player.x+70,s.player.y,'parking');assert.equal(parking.kind,'parking');
  press('H');step(40);assert.equal(parking.sprite.texture,'parking-1');press('H');step(40);
  assert.equal(system.cans.length,0);assert.equal(system.items.length,1);
});

test('energy pickup requires ground proximity, caps health and stays available at full energy',()=>{
  const {s}=pickupSetup(),p=s.player,system=s.energyPickups;
  const item={x:p.x,y:p.y,sprite:new Visual()};system.items.push(item);system.rolled.add(0);
  system.update(0);assert.equal(system.items.length,1);
  s.health=90;p.z=40;system.update(1);assert.equal(s.health,90);
  p.z=0;p.y+=40;system.update(2);assert.equal(s.health,90);
  p.y=item.y;s.paused=true;system.update(3);assert.equal(s.health,90);
  s.paused=false;system.update(4);assert.equal(s.health,100);assert.equal(s.healthBar.width,200);assert.equal(item.sprite.destroyed,true);
});

test('can spawn rolls once per reached arena and respects scrolling coordinates; shutdown cleans remaining objects',()=>{
  const {s}=pickupSetup();let calls=0;
  s.energyPickups.destroy();s.energyPickups=new EnergyPickups(s,()=>{calls++;return .5;});
  s.waves.arena=1;let reached=false;s.stage={reached:()=>reached,arenaScroll:()=>720};
  const system=s.energyPickups;system.update(0);assert.equal(calls,0);
  reached=true;system.update(1);assert.equal(calls,4,'chance, x, y and which container');assert.equal(system.cans.length,1);
  const can=system.cans[0];assert.ok(can.x>720 && can.x<1680);assert.ok(can.y>=s.floor.top && can.y<=s.floor.bottom);
  for(let frame=2;frame<200;frame++)system.update(frame);assert.equal(calls,4);
  system.destroy();system.destroy();assert.equal(can.sprite.destroyed,true);assert.equal(system.cans.length,0);assert.equal(system.items.length,0);
});
function arcadeSetup(character='gymbro'){
  const s=setup(0,character);s.arcade=new ArcadeRuntime(s);s.debugPreview=true;s.waves.update=()=>{};
  s.player.sprite.setFrame=function(frame){this.frame=frame;return this;};
  const target=s.enemies[0];target.x=s.player.x+55;target.y=s.player.y;target.hp=1000;target.config={...target.config,hp:1000};
  s.enemies=[target];const step=(n=1)=>{for(let i=0;i<n;i++)s.update(0,ARCADE.clock.stepMs);};
  const press=key=>{s.keys[key].justDown=true;s.keys[key].isDown=true;step();s.keys[key].isDown=false;};
  return {s,target,step,press};
}
test('fixed simulation produces the same steps at 30, 60 and 120 Hz and caps stalls',()=>{
  for(const hz of [30,60,120]){const clock=new FixedClock();let steps=0;for(let i=0;i<hz;i++)clock.advance(1000/hz,()=>steps++);assert.equal(steps,60);}
  const clock=new FixedClock();let steps=0;clock.advance(10000,()=>steps++);assert.equal(steps,ARCADE.clock.maxCatchUp);
});

test('rapid next-level input can synchronously shut down the scene without updating a removed runtime',()=>{
  const {s}=arcadeSetup();s.finished=true;const runtime=s.arcade;let updates=0,transitions=0;
  runtime.update=()=>updates++;
  s.game.events.on('level-transition',()=>{transitions++;runtime.destroy();s.arcade=null;});
  s.keys.ENTER.justDown=true;
  assert.doesNotThrow(()=>s.update(0,ARCADE.clock.stepMs));
  assert.equal(transitions,1);assert.equal(updates,0);assert.equal(s.arcade,null);
});

test('restart input never updates the previous runtime if the scene replaces it synchronously',()=>{
  const {s}=arcadeSetup();const runtime=s.arcade;let oldUpdates=0,newUpdates=0;
  runtime.update=()=>oldUpdates++;
  s.scene.restart=()=>{runtime.destroy();s.arcade=new ArcadeRuntime(s);s.arcade.update=()=>newUpdates++;};
  s.keys.R.justDown=true;
  assert.doesNotThrow(()=>s.update(0,ARCADE.clock.stepMs));
  assert.equal(oldUpdates,0);assert.equal(newUpdates,0);assert.notEqual(s.arcade,runtime);
});

test('shutdown during a result event cancels catch-up steps and further calls to the disposed runtime',()=>{
  const {s}=arcadeSetup();const runtime=s.arcade;let results=0;
  s.finished=true;s.pendingResult={won:true};s.victoryRemaining=ARCADE.clock.stepMs;
  s.game.events.on('level-result',()=>{results++;runtime.destroy();s.arcade=null;});
  assert.doesNotThrow(()=>runtime.update(ARCADE.clock.stepMs*ARCADE.clock.maxCatchUp));
  assert.equal(results,1);assert.equal(runtime.clock.frame,1);assert.equal(runtime.clock.accumulator,0);
  runtime.update(100);runtime.capture({restart:true});runtime.step(99);runtime.destroy();
  assert.equal(runtime.clock.frame,1);assert.equal(s.restarting,false);assert.equal(results,1);
});
test('phase data can distribute multiple source poses without moving the active contact frame',()=>{
  const frames=timeline({startup:2,active:1,recovery:2,startupPose:[1,2],activePose:3,recoveryPose:[4,5],cancelFrames:1});
  assert.deepEqual(frames.map(f=>f.pose),[1,2,3,4,5]);assert.deepEqual(frames.map(f=>f.phase),['startup','startup','active','recovery','recovery']);
  assert.deepEqual(frames.map(f=>f.cancel),[false,false,false,false,true]);
});

test('Magolita links three separate punch impacts and uses the broom for kicks',async()=>{
  const {s,target,step,press}=arcadeSetup('magolita');
  press('H');
  for(let stage=0;stage<2;stage++){
    let guard=0;while(!s.arcade.player.action?.data.frames[s.arcade.player.action.index]?.cancel && guard++<80)step();
    assert.ok(guard<80);press('H');assert.equal(s.arcade.player.action.data.stage,stage+1);
  }
  step(70);assert.equal(target.hp,1000-3*s.character.attacks.punch.damage);
  const {playerAttackData}=await import('../src/data/attacks.js');
  const kick=playerAttackData(s.character,'kick');assert.equal(kick.range,170);
  assert.ok(kick.frames.filter(f=>f.phase==='active').every(f=>f.pose===21));
});

test('Magolita mop costs energy once, hits more than three punches, knocks down and throws a water splash',()=>{
  const {s,target,step,press}=arcadeSetup('magolita');const x=target.x;
  press('K');step(70);
  assert.equal(s.health,90);const dealt=1000-target.hp;assert.equal(dealt,s.character.attacks.mop.damage);
  assert.ok(dealt>3*s.character.attacks.punch.damage);assert.ok(s.specialReadyAt>0);
  assert.equal(s.arcade.enemies.get(target)?.state,'down','knocked down (the push plays as its fall slide)');
  s.specialReadyAt=0;s.health=10;const hp=target.hp;press('K');step(70);assert.equal(s.health,10);assert.equal(target.hp,hp,'no energy, no mop');
});

test('Magolita atlas and animation frames fit player_5 and selection has no temporary level picker',()=>{
  const c=setup(0,'magolita').character,png=readFileSync(new URL('../src/data/player_5.png',import.meta.url));
  assert.equal(c.frameRects.length,51,'39 main poses + 12 grab poses (player_5_agarre.png)');
  for(const r of c.frameRects.slice(0,39)){assert.ok(r.x>=0 && r.y>=0 && r.x+r.width<=png.readUInt32BE(16) && r.y+r.height<=png.readUInt32BE(20));}
  for(const frames of Object.values(c.animations))for(const frame of frames)assert.ok(frame>=0 && frame<c.frameRects.length);
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/const LEVEL_SELECT = (true|false);/,'the test level selector is a single switch');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/data-pick="magolita"/);
});
test('input buffer expires at eight frames, consumes once and preserves command order',()=>{
  const b=new InputBuffer();b.push('punch',0);assert.equal(b.consume('punch',7),true);assert.equal(b.consume('punch',7),false);
  b.push('punch',0);assert.equal(b.consume('punch',8),false);b.push('kick',9);b.push('punch',9);assert.equal(b.consume('punch',10),true);assert.equal(b.consume('kick',10),true);
});
test('production arcade runtime starts and stops immediately, has slower depth movement and enforces every lane',()=>{
  const {s,step}=arcadeSetup();const x=s.player.x,y=s.player.y;s.keys.D.isDown=true;step();
  assert.equal(s.player.x-x,s.character.speed/60);s.keys.D.isDown=false;const stopped=s.player.x;step(20);assert.equal(s.player.x,stopped);
  s.keys.S.isDown=true;step();assert.ok(Math.abs(s.player.y-y-s.character.speed*ARCADE.movement.depthRatio/60)<1e-6);
  for(const lane of ARCADE.lanes){Object.assign(s.floor,lane);s.player.y=lane.top; s.keys.S.isDown=false;s.keys.W.isDown=true;step(60);assert.equal(s.player.y,lane.top);s.keys.W.isDown=false;s.keys.S.isDown=true;step(200);assert.equal(s.player.y,lane.bottom);}
});
test('production damage is gated by the displayed active frame, once per target, with independent narrow boxes',()=>{
  const {s,target,step,press}=arcadeSetup();press('H');step(5);assert.equal(target.hp,1000);
  step();assert.equal(s.player.sprite.frame,8);assert.equal(target.hp,962);step(40);assert.equal(target.hp,962);
  target.y=s.player.y+ARCADE.body.lane;press('H');step(40);assert.equal(target.hp,962);
  target.y=s.player.y;target.z=ARCADE.body.airborneAvoidHeight;press('H');step(40);assert.equal(target.hp,962);
});
test('Gymbro cancels only in the late window; three linked active poses deal three separate hits',()=>{
  const {s,target,step,press}=arcadeSetup();press('H');press('H');step(40);assert.equal(target.hp,962,'an early queued strike expires before the cancel window');
  step(21); // past the link window (comboLinkFrames), so the next H starts a fresh combo
  press('H');
  for(let stage=0;stage<2;stage++){
    let guard=0;while(!s.arcade.player.action?.data.frames[s.arcade.player.action.index]?.cancel && guard++<60)step();
    assert.ok(guard<60);press('H');assert.equal(s.arcade.player.action.data.stage,stage+1);
  }
  step(70);assert.equal(target.hp,1000-38*4);assert.equal(s.arcade.player.state,'walk');
});
test('a combo strike pressed shortly after the previous one ends still links (comboLinkFrames)',()=>{
  const {s,step,press}=arcadeSetup();press('H');
  let guard=0;while(s.arcade.player.action && guard++<80)step();
  step(5);press('H');step();assert.equal(s.arcade.player.action.data.stage,1);
});
test('keyboard and mobile holds do not auto-fill the arcade combo and other players have one punch',()=>{
  for(const mobile of [false,true]){
    const {s,target,step}=arcadeSetup();
    if(mobile){const input=new TouchInput();s.game.touchControls={input};input.down('H',1);}else{s.keys.H.isDown=true;s.keys.H.justDown=true;}
    step(100);assert.equal(target.hp,962);
  }
  for(const character of ['office','student','teleperforman']){const {s,target,step,press}=arcadeSetup(character);press('H');step(40);assert.equal(target.hp,1000-s.character.attacks.punch.damage);assert.equal(s.arcade.player.state,'walk');}
});
test('local hitstop freezes only attacker/victim and the finisher has a stronger pause',()=>{
  const {s,target,step,press}=arcadeSetup();press('H');step(6);
  const action=s.arcade.player.action,index=action.index,clock=s.combatTime;
  step(ARCADE.feedback.hitstop);assert.equal(action.index,index);assert.ok(s.combatTime>clock);assert.equal(s.arcade.combat.frozen(target),true);
  step();assert.ok(action.index>index);
  s.arcade.combat.impact(s.player,target,{finisher:true});const until=s.arcade.combat.stops.get(s.player);assert.equal(until-s.arcade.frame,ARCADE.feedback.finisherHitstop);
});
test('arcade jump keeps a ground shadow, Z is separate, and the airborne kick uses its own timeline',()=>{
  const {s,step,press}=arcadeSetup();const y=s.player.y;press('SPACE');step(5);assert.ok(s.player.z>0);assert.equal(s.player.y,y);assert.equal(s.player.shadow.y,y);
  press('J');assert.equal(s.arcade.player.action.data.frames.filter(f=>f.phase==='startup').length,5);
  step(90);assert.equal(s.player.z,0);assert.equal(s.arcade.player.state,'walk');
});
test('arcade special cost occurs once in its active pose and interrupted preparation is free',()=>{
  for(const character of ['gymbro','teleperforman']){
    const {s,step,press}=arcadeSetup(character);press('K');step(ARCADE.input.bufferFrames);assert.equal(s.health,100);
    s.invulnerableUntil=0;s.hitPlayer(1);step(60);assert.equal(s.health,99);
    press('K');step(70);assert.equal(s.health,89);
  }
});
test('attack tokens cap concurrent telegraphs/attacks at two; damage releases ownership and a third waits',()=>{
  const {s,step}=arcadeSetup();s.debugPreview=false;s.player.x=450;s.player.y=450;
  for(let i=0;i<3;i++){if(!s.enemies[i])s.enemies.push(s.makeFighter(450+(i%2?50:-50),450,'brawler',enemies.brawler));
    const a=s.enemies[i];a.x=450+(i%2?50:-50);a.y=450;a.index=i;a.config={...enemies.brawler,speed:0};a.hp=1000;a.tell=new Visual();a.healthBar=new Visual();a.pending=null;}
  step();for(const e of s.arcade.enemies.values())e.ready=0;
  step();assert.equal(s.arcade.combat.tokens.owners.size,2);assert.equal([...s.arcade.enemies.values()].filter(e=>e.state==='windup').length,2);
  assert.equal([...s.arcade.enemies.values()][2].state,'circle');
  s.hitEnemy(s.enemies[0],{damage:1,knockback:0,facing:1});assert.equal(s.arcade.combat.tokens.owners.size,1);
  step();assert.equal(s.arcade.combat.tokens.owners.size,2);
  for(let i=0;i<180;i++){step();assert.ok(s.arcade.combat.tokens.owners.size<=2);}
});
test('arcade knockdown has an explicit wake-up invulnerability and no stale buffered attack',()=>{
  const {s,step}=arcadeSetup();s.arcade.player.request('punch');s.arcade.player.hurt(true);assert.equal(s.arcade.player.state,'knockdown');
  step(ARCADE.player.knockdownFrames+2);assert.equal(s.arcade.player.state,'walk');assert.ok(s.invulnerableUntil>s.combatTime);assert.equal(s.playerAttack,null);
});
test('a third actor keeps moving while the hitstop pair is frozen',()=>{
  const {s,target,step,press}=arcadeSetup();
  const other=s.makeFighter(800,450,'brawler',{...enemies.brawler,speed:120});Object.assign(other,{hp:1000,index:2,tell:new Visual(),healthBar:new Visual()});s.enemies.push(other);
  const model=new Enemy(s.arcade,other);s.arcade.enemies.set(other,model);model.ready=10000;
  s.debugPreview=false;press('H');step(6);assert.equal(s.arcade.combat.frozen(s.player),true);assert.equal(s.arcade.combat.frozen(target),true);
  const x=other.x,age=model.clock;step(ARCADE.feedback.hitstop);assert.notEqual(other.x,x);assert.equal(model.clock-age,ARCADE.feedback.hitstop);
});
test('charge waits for configured startup frames and only contact poses can damage the player',()=>{
  const {s,target,step}=arcadeSetup();s.debugPreview=false;s.invulnerableUntil=0;
  target.key='vendor';target.x=s.player.x+40;target.config={...enemies.vendor,charge:{...enemies.vendor.charge,distance:100,frames:{...enemies.vendor.charge.frames,startup:5,activePoses:[]}}};
  const model=new Enemy(s.arcade,target);s.arcade.enemies.set(target,model);model.begin();const x=target.x;
  step(5);assert.equal(target.x,x);assert.equal(model.state,'attack');step();assert.equal(s.health,100);
  model.action.activePoses=[...target.config.animations.rush];step();assert.ok(s.health<100);assert.equal(s.arcade.player.state,'knockdown');
});
test('a charge never pins the enemy to a screen side: it waits until inside the floor and ends when blocked',()=>{
  const {s,target,step}=arcadeSetup();s.debugPreview=false;s.invulnerableUntil=0;
  target.key='vendor';target.config={...enemies.vendor};target.x=s.floor.right+60;target.y=s.player.y;
  const model=new Enemy(s.arcade,target);s.arcade.enemies.set(target,model);
  assert.equal(model.begin(),false,'no charge from outside the floor');assert.equal(target.pending,null);
  target.x=s.floor.left;target.y=s.player.y;s.player.x=s.floor.left+300;assert.equal(model.begin(),true);
  model.action.remaining=1e6;target.facing=-1; // pushing into the left side: blocked on the first step
  let guard=0;while(model.state!=='recover' && guard++<200)step();
  assert.ok(guard<200,'the charge ends instead of running in place');assert.equal(model.state,'recover');
});

test('a cornered regular enemy leaps over the player after 3 quick hits; bosses keep their own rules',()=>{
  const {s,target,step}=arcadeSetup();s.debugPreview=false;
  target.x=s.floor.left+40;s.player.x=target.x+60;target.config={...target.config,boss:false,minion:false,evade:undefined};
  const model=new Enemy(s.arcade,target);s.arcade.enemies.set(target,model);
  for(let i=0;i<3;i++){s.hitEnemy(target,{damage:1,knockback:0,facing:-1,stun:100});step(2);}
  assert.equal(model.state,'evade');assert.ok(target.invulnerableUntil>s.combatTime);
  let guard=0;while(model.state==='evade' && guard++<120)step();
  assert.ok(target.x>s.player.x+100,`lands on the open side (${target.x} vs player ${s.player.x})`);assert.equal(target.z,0);
  const mid=arcadeSetup();mid.s.debugPreview=false;mid.target.x=(mid.s.floor.left+mid.s.floor.right)/2;mid.s.player.x=mid.target.x-60;
  const free=new Enemy(mid.s.arcade,mid.target);mid.s.arcade.enemies.set(mid.target,free);
  for(let i=0;i<3;i++){mid.s.hitEnemy(mid.target,{damage:1,knockback:0,facing:1,stun:100});mid.step(2);}
  assert.notEqual(free.state,'evade','not cornered: no leap');
});

test('production fixed runtime preserves the battlefield and score through a life loss and clears pending input',()=>{
  const {s,target,step}=arcadeSetup();s.run.score=700;target.hp=333;s.invulnerableUntil=0;
  s.arcade.player.request('punch');s.hitPlayer(100);step();assert.equal(s.run.lives,2);
  let guard=0;while(!s.health && guard++<70)step();
  assert.ok(guard<70);assert.equal(s.health,100);assert.equal(s.enemies[0],target);assert.equal(target.hp,333);assert.equal(s.run.score,700);
  assert.equal(s.arcade.player.state,'walk');assert.equal(s.arcade.player.buffer.entries.length,0);
  assert.equal(Math.round(s.respawnProtectedUntil-s.combatTime),3000);
});
test('late-wave enemies use local spawn staggering, never an accumulated level-long delay',()=>{
  const {s,target}=arcadeSetup();target.index=29;target.slot=2;
  const model=new Enemy(s.arcade,target);
  assert.equal(model.ready,Math.round((ARCADE.ai.initialCooldown+2*ARCADE.ai.spawnStagger)/s.level.pressure));
  assert.ok(model.ready<ARCADE.ai.initialCooldown+29*ARCADE.ai.spawnStagger);
});
function gymPunchScene(facing=1) {
  const s=setup(0,'gymbro'),enemy=s.enemies[0];
  s.debugPreview=true;s.waves.update=()=>{};s.facing=facing;
  enemy.x=s.player.x+60*facing;enemy.y=s.player.y;enemy.hp=500;enemy.config={...enemy.config,hp:500};s.enemies=[enemy];
  const hits=[],poses=[],sounds=[],hit=s.hitEnemy.bind(s),play=s.play.bind(s);
  s.sfx={play:name=>sounds.push(name)};
  s.hitEnemy=(target,attack)=>{hits.push({stage:attack.comboStage,damage:attack.damage});hit(target,attack);};
  s.play=(actor,state,duration)=>{if(actor===s.player)poses.push(state);play(actor,state,duration);};
  const advance=ms=>{for(let left=ms;left>0;left-=10)s.update(0,Math.min(10,left));};
  const press=()=>{s.keys.H.isDown=true;s.keys.H.justDown=true;s.update(0,10);s.keys.H.isDown=false;};
  return {s,enemy,hits,poses,sounds,advance,press};
}
test('Gymbro single press holds only the first punch pose and deals exactly one hit',()=>{
  const {s,enemy,hits,poses,sounds,advance,press}=gymPunchScene();
  press();advance(70);assert.equal(enemy.hp,500);
  advance(20);assert.deepEqual(hits,[{stage:0,damage:38}]);
  assert.equal(s.player.sprite.animation,'gymbro-punch');assert.deepEqual(s.character.animations.punch,[8]);
  advance(1000);assert.equal(enemy.hp,462);assert.equal(s.playerAttack,null);
  assert.deepEqual(poses,['punch']);assert.deepEqual(sounds,['punch']);assert.equal(s.health,100);
});
test('Gymbro buffers two or three quick presses and impacts once per stage in either direction',()=>{
  for(const facing of [-1,1])for(const count of [2,3]) {
    const {s,enemy,hits,poses,sounds,advance,press}=gymPunchScene(facing),x=enemy.x;
    for(let i=0;i<count;i++){press();advance(20);}
    advance(1200);
    assert.deepEqual(hits.map(h=>h.stage),Array.from({length:count},(_,i)=>i));
    assert.deepEqual(poses,['punch','punch2','punch3'].slice(0,count));
    assert.equal(enemy.hp,500-38*count);assert.equal(sounds.length,count);assert.equal(s.health,100);
    assert.equal(enemy.x,x+(count===3?20*facing:0));
    assert.equal(s.playerAttack,null);
  }
});
test('holding keyboard or mobile punch never queues or repeats Gymbro strikes',()=>{
  for(const mobile of [false,true]) {
    const {s,hits,advance}=gymPunchScene();
    if(mobile){const input=new TouchInput();s.game.touchControls={input};input.down('H',1);}
    else {s.keys.H.isDown=true;s.keys.H.justDown=true;}
    advance(1500);assert.equal(hits.length,1);assert.equal(s.playerAttack,null);
  }
});
test('three mobile taps chain all three Gymbro poses; excess presses cannot add a fourth strike',()=>{
  const {s,hits,poses,advance}=gymPunchScene(),input=new TouchInput();s.game.touchControls={input};
  for(let i=0;i<6;i++){input.down('H',i);input.up(i);advance(20);}
  advance(1200);assert.equal(hits.length,3);assert.deepEqual(poses,['punch','punch2','punch3']);
});
test('damage and dash cancel pending Gymbro punches; separated presses start a fresh first pose',()=>{
  for(const cancel of ['damage','dash']) {
    const {s,hits,poses,advance,press}=gymPunchScene();press();press();press();
    if(cancel==='damage'){s.invulnerableUntil=0;s.hitPlayer(5);}else s.startDash(1,0);
    advance(1200);assert.equal(hits.length,0);assert.ok(!poses.includes('punch2'));
    press();assert.equal(s.playerAttack.comboStage,0);assert.equal(s.playerAttack.queued,0);
  }
  const {s,poses,advance,press}=gymPunchScene();press();advance(500);press();
  assert.equal(s.playerAttack.comboStage,0);assert.deepEqual(poses,['punch','punch']);
});
test('Gymbro combo still checks enemy reach and never damages an out-of-range target',()=>{
  const {enemy,hits,advance,press}=gymPunchScene();enemy.x=800;
  press();press();press();advance(1200);assert.equal(hits.length,0);assert.equal(enemy.hp,500);
});
test('changing character preserves the actual battlefield, current level, health, lives and points',()=>{
  const s=setup(3),wave=s.waves,enemiesOnStreet=s.enemies;
  s.run.lives=2;s.run.score=700;s.health=65;s.combatTime=4500;
  s.playerName=new Visual();s.controlsLabel=new Visual();s.healthBar.setFillStyle=()=>{};
  s.textures={get:()=>({referenceHeight:160})};s.player.sprite.setTexture=()=>s.player.sprite;
  assert.equal(s.switchCharacter('gymbro'),true);
  assert.equal(s.levelIndex,3);assert.equal(s.health,65);assert.equal(s.run.lives,2);assert.equal(s.run.score,700);
  assert.equal(s.enemies,enemiesOnStreet);assert.equal(s.waves,wave);assert.equal(s.combatTime,4500);
  assert.equal(s.player.config,s.character);assert.equal(s.characterKey,'gymbro');assert.equal(s.switchCharacter('missing'),false);
});
test('losing a life respawns on the same battlefield with three seconds of blinking invulnerability',()=>{
  const s=setup(2),enemy=s.enemies[0];s.invulnerableUntil=0;s.hitEnemy(enemy,strike);
  const score=s.run.score,spawned=s.waves.spawned,defeated=s.defeated;
  s.hitPlayer(100);s.update(0,16);assert.equal(s.run.lives,2);assert.equal(s.finished,false);
  for(let i=0;i<60 && s.health===0;i++)s.update(0,50);
  assert.equal(s.health,100);assert.equal(s.run.lives,2);assert.equal(s.waves.spawned,spawned);assert.equal(s.defeated,defeated);assert.equal(s.run.score,score);
  assert.equal(s.respawnProtectedUntil-s.combatTime,3000);
  assert.equal(s.hitPlayer(100),false);
  s.combatTime=s.respawnProtectedUntil;assert.equal(s.hitPlayer(10),true);
});
test('third death waits for continue once; continue restores three lives and preserves the level, boss and points',()=>{
  const s=setup(5);s.run.lives=1;s.run.score=1300;s.boss={status:{clear(){}},setPaused(){},finish(){}};
  const boss=s.boss;s.invulnerableUntil=0;s.hitPlayer(100);
  let offers=0;s.game.events.on('continue-needed',()=>offers++);
  s.update(0,16);s.update(0,16);assert.equal(offers,1);assert.equal(s.run.lives,0);assert.equal(s.waitingContinue,true);
  assert.equal(s.restartLevel(),false);assert.equal(s.continueRun(),true);assert.equal(s.continueRun(),false);
  assert.equal(s.run.lives,3);assert.equal(s.health,100);assert.equal(s.levelIndex,5);assert.equal(s.boss,boss);assert.equal(s.run.score,1300);
  s.endRun();assert.equal(s.gameOver,true);assert.equal(s.restartLevel(),false);
});
test('each actual updated player sheet has valid victory frames and Gymbro has a separate dash',()=>{
  for(const [i,key] of ['office','student','teleperforman','gymbro','magolita'].entries()) {
    const c=setup(0,key).character,png=readFileSync(new URL(`../src/data/player_${i+1}.png`,import.meta.url));
    let count=c.rows.reduce((a,b)=>a+b,0),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    for(const url of c.appendUrls??[]){ // combo / grab sheets stacked under the main sheet
      const extra=readFileSync(new URL(String(url).replace('?url','')));width=Math.max(width,extra.readUInt32BE(16));height+=extra.readUInt32BE(20);
    }
    assert.equal(c.frameRects.length,count);
    for(const rect of c.frameRects)assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width && rect.y+rect.height<=height);
    for(const frames of Object.values(c.animations))assert.ok(frames.every(frame=>frame>=0 && frame<count));
    assert.ok(c.animations.victory.length>=4);assert.ok(!c.animations.victory.some(frame=>c.animations.defeat.includes(frame)));
  }
  const s=setup(0,'gymbro');s.startDash(1,0);assert.ok(s.dashUntil>0);assert.equal(s.health,100);
});

test('3-hit combos: Gomelo K,K,K · Universitaria H,H,J · Teleperforman H,H,H; only the last strike pushes back',async()=>{
  const {characters}=await import('../src/data/characters.js');
  const {playerAttackData,comboNext}=await import('../src/data/attacks.js');
  for(const [key,inputs] of Object.entries({office:['kick','kick','kick'],student:['punch','punch','kick'],teleperforman:['punch','punch','punch'],gymbro:['punch','punch','punch']})) {
    const c=characters[key];let data=playerAttackData(c,inputs[0],0);
    for(let stage=0;stage<3;stage++) {
      assert.equal(data.combo,true,`${key} stage ${stage}`);assert.equal(data.stage,stage);assert.equal(data.finisher,stage===2);
      if(stage<2){assert.equal(data.knockback,0);assert.ok(data.frames.some(f=>f.cancel));assert.equal(comboNext(c,data),inputs[stage+1]);data=playerAttackData(c,inputs[stage+1],stage+1);}
      else {assert.ok(data.knockback>=24);assert.equal(comboNext(c,data),null);}
    }
  }
  assert.equal(playerAttackData(characters.student,'kick',0).combo,false,'a lone kick is the normal kick');
  assert.equal(playerAttackData(characters.office,'kick',0,true).combo,false,'the jump kick is never a combo');
  assert.equal(playerAttackData(characters.student,'kick',1).combo,false,'J only links as the third hit');
});
test('victory plays before the result modal; enemies award points once and escaping bikes award none',()=>{
  const s=setup(0);s.level={...s.level,boss:null};finishWaves(s);const expected=1500; // generic flow without a boss
  assert.equal(s.run.score,expected);s.hitEnemy(s.enemies[0],strike);assert.equal(s.run.score,expected);
  const results=[];s.game.events.on('level-result',r=>results.push(r));s.update(0,16);
  assert.equal(s.player.sprite.animation,'office-victory');assert.equal(results.length,0);
  s.nextLevel();assert.equal(s.transitioning,false);
  for(let i=0;i<22;i++)s.update(0,50);assert.equal(results.length,1);assert.equal(results[0].score,1500);
  const bikes=setup(1),bike=bikes.enemies.find(e=>e.key==='rider');bike.x=1101;bikes.updateCrossing(bike,0);assert.equal(bikes.run.score,0);
});

test('arcade counts an escaped motorcycle once and completes level two before advancing to three',()=>{
  const s=setup(1,'gymbro');s.arcade=new ArcadeRuntime(s);s.debugPreview=true;s.invulnerableUntil=Infinity;
  const bike=s.enemies.find(e=>e.crossing);bike.x=bike.facing>0?1101:-141;
  const step=()=>s.update(0,ARCADE.clock.stepMs);
  step();const exitX=bike.x;assert.equal(s.defeated,1);
  for(let i=0;i<120;i++)step();
  assert.equal(s.defeated,1);assert.equal(bike.x,exitX);assert.equal(s.run.score,0);
  s.updateCrossing(bike,1);assert.equal(s.defeated,1);
  const results=[],transitions=[];
  s.game.events.on('level-result',result=>results.push(result));
  s.game.events.on('level-transition',data=>transitions.push(data));
  for(let frame=0;frame<3000 && !s.finished;frame++){
    for(const enemy of s.enemies)if(enemy.hp>0){
      if(enemy.crossing)enemy.x=enemy.facing>0?1101:-141;
      else s.hitEnemy(enemy,strike);
    }
    step();
  }
  assert.equal(s.defeated,s.level.total);assert.equal(s.finished,true);
  assert.equal(s.arcade.player.state,'celebration');s.nextLevel();assert.equal(transitions.length,0);
  for(let i=0;i<ARCADE.flow.resultDelayFrames+5;i++)step();
  assert.equal(results.length,1);assert.equal(results[0].won,true);
  s.nextLevel();s.nextLevel();assert.deepEqual(transitions,[{character:'gymbro',level:2}]);
  assert.equal(s.run.level,2);assert.equal(s.run.levelStartScore,s.run.score);
});
test('new enemies appear from levels two/four onward without changing totals or crossing behavior',()=>{
  for(const [key,first] of [['belly',2],['leash',4]]) {
    assert.deepEqual(CAMPAIGN.flatMap((l,i)=>l.enemies.includes(key)?[i+1]:[]),Array.from({length:7-first},(_,i)=>i+first));
    for(let level=first-1;level<6;level++) {
      const s=setup(level);finishWaves(s);assert.ok(s.enemies.some(e=>e.key===key));
      assert.ok(s.enemies.filter(e=>e.key===key).every(e=>!e.crossing));
    }
  }
});
test('enemy_10 chooses cruceta nearby and belly charge at distance through the real AI',()=>{
  for(const distance of [80,300]) {
    const s=setup(2);s.enemies=[];const e=s.spawnEnemy('belly',0,0,2,0);
    e.x=150;e.y=450;e.nextHit=0;s.invulnerableUntil=0;s.player.x=150+distance;s.nextGroupAttack=0;
    s.updateEnemies(0);assert.equal(e.pending.kind,distance===80?undefined:'charge');
    if(distance===80) {
      s.combatTime=e.pending.release;s.updateEnemies(0);assert.equal(s.health,100-e.config.damage);assert.equal(e.pending,null);
    } else {
      const x=e.x;s.combatTime=e.pending.release-1;s.updateEnemies(.05);assert.equal(e.x,x);
      s.combatTime++;s.updateEnemies(.05);assert.equal(e.pending.phase,'rush');
      s.updateEnemies(.05);assert.equal(e.x,x+25.5);
      s.updateEnemies(.5);assert.equal(s.health,100-e.config.damage);assert.equal(e.pending.hit,true);
      const hp=s.health;s.invulnerableUntil=0;s.updateEnemies(0);assert.equal(s.health,hp);
      s.hitEnemy(e,{damage:1,knockback:0,facing:1});s.updateEnemies(.05);assert.equal(e.pending,null);
    }
  }
});
test('enemy_11 moves faster than every other normal enemy and retreats to keep distance',()=>{
  assert.ok(Object.entries(enemies).filter(([key,e])=>!['leash','yulitza'].includes(key) && !e.boss && !e.minion).every(([,e])=>e.speed<enemies.leash.speed),'bosses (and Yulitza, the fastest of all) excluded');
  const s=setup(3);s.enemies=[];const e=s.spawnEnemy('leash',0,0,2,0);e.x=150;e.y=450;e.nextHit=Infinity;
  s.player.x=600;s.updateEnemies(.1);assert.ok(e.x>150);
  e.x=560;s.player.x=500;s.updateEnemies(.1);assert.ok(e.x>560);
  assert.equal(e.pending,null);
});
test('enemy_11 performs three ranged leash strikes in both directions without throwing knives',()=>{
  for(const facing of [1,-1]) {
    const s=setup(3);s.enemies=[];const e=s.spawnEnemy('leash',0,0,2,0);e.x=450;e.y=450;s.invulnerableUntil=0;
    s.player.x=450+facing*120;s.throwKnife=()=>assert.fail('leash attacks must not throw knives');
    beginEnemyAttack(s,e,facing);
    for(let strike=0;strike<3;strike++){s.combatTime=e.pending.release;updateEnemyAttack(s,e);assert.equal(s.health,100-e.config.damage*(strike+1));}
    assert.equal(e.pending,null);
  }
});
test('leash combo has different reaches; changing lane or jumping avoids all three strikes',()=>{
  for(const evade of ['distance','lane','jump']) {
    const s=setup(3);s.enemies=[];const e=s.spawnEnemy('leash',0,0,2,0);e.x=450;e.y=450;s.invulnerableUntil=0;
    s.player.x=evade==='distance'?650:570;if(evade==='lane')s.player.y=490;if(evade==='jump')s.jumpHeight=72;
    beginEnemyAttack(s,e,1);
    for(let i=0;i<3;i++){s.combatTime=e.pending.release;updateEnemyAttack(s,e);}
    assert.equal(s.health,100-(evade==='distance'?e.config.damage:0));
  }
});
test('both new atlases contain 24 valid poses including detached dogs and extended weapons',()=>{
  for(const [key,file] of [['belly','enemy_10'],['leash','enemy_11']]) {
    const c=enemies[key],png=readFileSync(new URL(`../src/data/${file}.png`,import.meta.url));
    const w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.equal(c.frameRects.length,24);
    for(const r of c.frameRects)assert.ok(r.x>=0 && r.y>=0 && r.x+r.width<=w && r.y+r.height<=h);
    for(const frames of Object.values(c.animations))assert.ok(frames.every(f=>f>=0 && f<24));
  }
  const hurt=enemies.leash.frameRects[18];assert.ok(hurt.x+hurt.width>=1093 && hurt.y+hurt.height>=888);
  assert.equal(enemies.belly.animations.attack[2],6);assert.deepEqual(enemies.belly.animations.chargeImpact,[13,14]);
});
test('real combat accepts simultaneous touch movement and punch, short taps, jump, dash and pause',()=>{
  const s=setup(0),input=new TouchInput();s.enemies=[];s.game.touchControls={input};
  input.x=1;input.y=-1;s.update(0,50);assert.ok(s.player.x>200 && s.player.y<450);
  input.down('H',1);input.up(1);s.update(0,16);assert.equal(s.playerAttack.type,'punch');
  s.playerAttack=null;input.down('SPACE',2);input.up(2);s.update(0,16);assert.equal(s.jumpStart,s.combatTime);
  s.jumpStart=-1000;s.jumpHeight=0;input.down('SHIFT',3);s.update(0,16);assert.ok(s.dashUntil>s.combatTime);
  input.up(3);input.down('P',4);s.update(0,16);assert.equal(s.paused,true);
  const time=s.combatTime;s.update(0,50);assert.equal(s.combatTime,time);
  input.up(4);input.down('P',5);s.update(0,16);assert.equal(s.paused,false);
});
test('touch special activates once while held for all characters, and mobile low kick remains available',()=>{
  for(const character of ['office','student','teleperforman','gymbro']) {
    const s=setup(0,character),input=new TouchInput();s.game.touchControls={input};s.enemies=[];
    const attacks=[];s.startAttack=type=>attacks.push(type);input.down('K',1);
    s.update(0,16);s.update(0,16);assert.deepEqual(attacks,[s.character.special]);
  }
  const s=setup(0,'student'),input=new TouchInput();s.game.touchControls={input};s.enemies=[];
  input.down('L',1);input.up(1);s.update(0,16);assert.equal(s.playerAttack.type,'lowKick');
});
test('updated Gymbro atlas fits the actual PNG and synchronizes contact poses with damage',()=>{
  const c=setup(0,'gymbro').character,png=readFileSync(new URL('../src/data/player_4.png',import.meta.url));
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20),count=c.rows.reduce((sum,n)=>sum+n,0);
  assert.equal(width,1024);assert.equal(height,1536);
  assert.equal(count,44,'32 main poses + 12 grab poses');assert.equal(c.frameRects.length,count);
  for(const r of c.frameRects.slice(0,32))assert.ok(r.x>=0 && r.y>=0 && r.width>0 && r.height>0 && r.x+r.width<=width && r.y+r.height<=height);
  for(const frames of Object.values(c.animations))assert.ok(frames.every(f=>f>=0 && f<count));
  for(const [name,pose] of [['punch',8],['punch2',6],['punch3',10],['kick',22],['stomp',20]]) {
    const a=c.attacks[name.startsWith('punch')?'punch':name],frames=c.animations[name];
    assert.equal(frames[Math.floor(a.hitAt/a.duration*frames.length)],pose);
  }
  assert.equal(c.dash,true);
  assert.deepEqual(c.animations.defeat,[12,13,14,15]);assert.deepEqual(c.animations.dash,[16,17,18,19]);
  assert.deepEqual(c.animations.hurt,[24,25,26,27]);assert.deepEqual(c.animations.victory,[28,29,30,31]);
  assert.ok(c.animations.stomp.every(f=>c.animations.kick.includes(f)),'stomp reuses knee lift and planted foot from the new art');
  for(const name of ['punch','punch2','punch3','kick','stomp','dash','hurt'])assert.ok(!c.animations[name].some(f=>c.animations.defeat.includes(f)));
});
test('headset and stomp spend energy once on impact, even while invulnerable; basic attacks are free',()=>{
  for(const character of ['teleperforman','gymbro']) {
    const s=setup(0,character);s.enemies=[];
    s.add.ellipse=()=>({setStrokeStyle(){return this;},setDepth(){return this;}});
    s.invulnerableUntil=Infinity;
    s.startAttack(s.character.special);const hitAt=s.playerAttack.hitAt;
    assert.equal(s.health,100);s.combatTime=hitAt;s.update(0,10);s.update(0,10);
    assert.equal(s.health,90);assert.equal(s.healthBar.width,180);
    assert.equal(s.hurtUntil,0);assert.equal(s.invulnerableUntil,Infinity);
    s.playerAttack=null;s.specialReadyAt=0;s.startAttack('punch');s.combatTime+=150;s.update(0,10);assert.equal(s.health,90);
    s.playerAttack=null;s.health=10;s.startAttack(s.character.special);assert.equal(s.playerAttack,null);
    s.health=11;s.startAttack(s.character.special);s.combatTime+=hitAt;s.update(0,10);assert.equal(s.health,1);
  }
});
test('headset and stomp sounds fire once at the strike; cancelled specials stay silent',()=>{
  for(const [character,sound] of [['teleperforman','whip'],['gymbro','stomp']]) {
    const s=setup(0,character),calls=[];s.enemies=[];s.sfx={play:name=>calls.push(name)};
    s.add.ellipse=()=>({setStrokeStyle(){return this;},setDepth(){return this;}});
    s.startAttack(s.character.special);assert.deepEqual(calls,[]);
    const hitAt=s.playerAttack.hitAt;
    s.combatTime=hitAt-20;s.update(0,10);assert.deepEqual(calls,[]);
    s.update(0,10);s.update(0,10);assert.deepEqual(calls,[sound]);
    s.playerAttack=null;s.specialReadyAt=0;s.startAttack(s.character.special);
    s.playerAttack=null;s.update(0,50);assert.deepEqual(calls,[sound]);
  }
});
test('actual combat emits sounds on accepted attacks, releases and deaths, never per frame or repeated death',()=>{
  const s=setup(2),calls=[];s.sfx={play:name=>calls.push(name),stop(){},setPaused(){}};
  s.startAttack('punch');s.startAttack('punch');assert.deepEqual(calls,['punch']);
  s.playerAttack=null;s.startAttack('kick');assert.deepEqual(calls,['punch','kick']);
  for(const e of s.enemies.slice(0,2))e.key='brawler'; // no own death or hurt sound: alternates hurt/hurt2
  s.hitEnemy(s.enemies[0],strike);s.hitEnemy(s.enemies[0],strike);s.hitEnemy(s.enemies[1],strike);
  assert.deepEqual(calls.slice(-2),['hurt','hurt2']);
  for(const [key,sound] of [['guard','tambo'],['sweeper','bar'],['chain','bar']]) {
    const e=s.spawnEnemy(key,0,0,2,0);beginEnemyAttack(s,e,1);
    s.combatTime=e.pending.release;updateEnemyAttack(s,e);assert.equal(calls.at(-1),sound);
    const n=calls.length;updateEnemyAttack(s,e);assert.equal(calls.length,n);
  }
  const e=s.spawnEnemy('vendor',0,0,2,0);beginEnemyCharge(s,e,1);
  const n=calls.length;s.combatTime=e.pending.release-1;updateEnemyCharge(s,e,.05);assert.equal(calls.length,n);
  s.combatTime++;updateEnemyCharge(s,e,.05);assert.equal(calls.at(-1),'screeching');
  updateEnemyCharge(s,e,.05);assert.equal(calls.length,n+1);
  s.enemies=[];s.run.lives=1;s.health=0;s.finished=false;s.update(0,16);assert.equal(calls.at(-1),'lose');
  const end=calls.length;s.update(0,16);assert.equal(calls.length,end);
});
function cartScene(facing=1) {
  const s=setup(2);s.enemies=[];
  const e=s.spawnEnemy('vendor',0,0,2,0);e.x=facing>0?150:800;e.y=450;
  s.player.x=450;s.player.y=450;beginEnemyCharge(s,e,facing);return {s,e};
}
test('cart warns for exactly one second then rushes at full speed in both directions',()=>{
  for(const facing of [1,-1]) {
    const {s,e}=cartScene(facing),x=e.x;
    s.combatTime=999;updateEnemyCharge(s,e,.05);assert.equal(e.x,x);assert.equal(e.pending.phase,'prepare');
    s.combatTime=1000;updateEnemyCharge(s,e,.05);assert.equal(e.x,x);assert.equal(e.pending.phase,'rush');
    s.player.y=480;s.combatTime=1050;updateEnemyCharge(s,e,.05);
    assert.equal(e.x,x+facing*34);assert.equal(e.y,450);assert.equal(e.tell.visible,false);
  }
});
test('cart swept impact cannot tunnel, damages once and brakes inside the arena',()=>{
  const {s,e}=cartScene();s.combatTime=1000;updateEnemyCharge(s,e,0);
  s.combatTime=1500;updateEnemyCharge(s,e,.5);assert.equal(s.health,88);
  s.invulnerableUntil=0;updateEnemyCharge(s,e,0);assert.equal(s.health,88);
  updateEnemyCharge(s,e,2);assert.equal(e.pending,null);assert.ok(e.x<=s.floor.right);
  assert.equal(e.actionUntil,2150);assert.ok(e.nextHit>e.actionUntil);assert.equal(s.defeated,0);
});
test('cart is evadable by jumping, lanes and dash and can be interrupted during preparation or rush',()=>{
  for(const evade of ['jump','lane','dash']) {
    const {s,e}=cartScene();s.combatTime=1000;updateEnemyCharge(s,e,0);
    if(evade==='jump')s.jumpHeight=72;
    if(evade==='lane')s.player.y=480;
    if(evade==='dash')s.invulnerableUntil=2000;
    updateEnemyCharge(s,e,.5);assert.equal(s.health,100);
  }
  for(const rush of [false,true]) {
    const {s,e}=cartScene();if(rush){s.combatTime=1000;updateEnemyCharge(s,e,0);}
    s.hitEnemy(e,{damage:1,knockback:0,facing:1});const x=e.x;
    updateEnemyCharge(s,e,.5);assert.equal(e.pending,null);assert.equal(e.x,x);assert.equal(e.tell.visible,false);
  }
});
test('cart appears only in levels two and three, stays alive after a charge and pauses with combat clock',()=>{
  assert.deepEqual(CAMPAIGN.flatMap((l,i)=>l.enemies.includes('vendor')?[i+1]:[]),[2,3]);
  const {s,e}=cartScene();s.paused=true;s.update(0,50);assert.equal(s.combatTime,0);assert.equal(e.pending.phase,'prepare');
  assert.equal(e.crossing,false);assert.equal(enemies.vendor.frameRects.length,20);
});
function clearWave(s){for(const enemy of s.enemies)if(enemy.hp>0)s.hitEnemy(enemy,strike);}
function finishWaves(s,avoid=false) {
  const sizes=[];
  while(!s.waves.cleared) {
    const active=s.enemies.filter(e=>e.hp>0);sizes.push(active.length);
    assert.ok(active.length===2 || active.length===3);
    if(avoid) {
      s.jumpHeight=72;
      for(const e of active)if(!e.crossing)s.hitEnemy(e,strike);
      for(let frame=0;frame<200 && s.enemies.some(e=>e.hp>0);frame++)for(const e of s.enemies)if(e.hp>0 && e.crossing)s.updateCrossing(e,.05);
    } else clearWave(s);
    s.waves.update();s.combatTime+=s.level.gap;s.waves.update();
  }
  return sizes;
}

test('campaign has exact pools and totals and steadily increases health, speed, damage and pressure',()=>{
  assert.deepEqual(CAMPAIGN.map(l=>l.enemies),[['fan','brawler'],['walker','rider','vendor','belly'],['thrower','brawler','fan','sweeper','vendor','belly','yulitza'],['chain','brawler','fan','sweeper','belly','leash','yulitza'],['guard','chain','walker','sweeper','belly','leash','yulitza'],['guard','rider','walker','sweeper','belly','leash','yulitza']]);
  assert.deepEqual(CAMPAIGN.map(l=>l.total),[15,20,20,20,20,30]);
  for(let i=1;i<6;i++)for(const key of ['hp','speed','damage','pressure'])assert.ok(CAMPAIGN[i][key]>CAMPAIGN[i-1][key]);
  assert.equal(CAMPAIGN[1].mode,'crossing');assert.equal(CAMPAIGN[5].boss,'dormilon');
  assert.ok(enemies.fan.url.endsWith('enemy_7.png?url'));assert.equal(enemies.fan.rows.reduce((a,b)=>a+b),24);
  const base={hp:100,speed:80,damage:10};assert.equal(scaledEnemy(base,CAMPAIGN[5]).hp,125);assert.equal(base.hp,100);
});

test('all six real scene spawners emit only the specified types, exact totals and groups of two/three',()=>{
  for(let level=0;level<6;level++) {
    const s=setup(level),sizes=finishWaves(s);
    assert.equal(s.enemies.length,s.level.total);assert.equal(s.defeated,s.level.total);
    assert.ok(s.enemies.every(e=>s.level.enemies.includes(e.key)));
    assert.deepEqual(sizes,Array.from({length:s.level.total/5*2},(_,i)=>i%2?3:2));
    s.waves.update();assert.equal(s.enemies.length,s.level.total);
  }
});

test('no early completion between waves; gaps, pause, defeat and finished state stop new spawns',()=>{
  const s=setup(0);clearWave(s);assert.equal(s.waves.cleared,false);s.waves.update();
  s.combatTime+=s.level.gap-1;s.waves.update();assert.equal(s.enemies.length,2);
  s.combatTime++;s.paused=true;s.waves.update();assert.equal(s.enemies.length,2);
  s.paused=false;s.health=0;s.waves.update();assert.equal(s.enemies.length,2);
  s.health=100;s.finished=true;s.waves.update();assert.equal(s.enemies.length,2);
  s.finished=false;s.waves.update();assert.equal(s.enemies.length,5);
  s.update(0,16);assert.equal(s.finished,false);
});

test('only enemy_2 crosses level 2; enemy_1 pursues and must be defeated while bikes can be evaded',()=>{
  const s=setup(1),enemy=s.enemies.find(e=>e.key==='rider'),walker=s.enemies.find(e=>e.key==='walker');
  const x=enemy.x,y=enemy.y,facing=enemy.facing,walkerX=walker.x,walkerY=walker.y;
  assert.equal(enemy.crossing,true);assert.equal(walker.crossing,false);
  assert.deepEqual(enemy.sprite.animation,{key:`${enemy.key}-attack`,repeat:-1});
  s.updateEnemies(.1);
  assert.equal(enemy.x,x+facing*enemy.crossingSpeed*.1);assert.equal(enemy.y,y);assert.equal(enemy.facing,facing);
  assert.ok(walker.x<walkerX);assert.ok(walker.y>walkerY,'walker changes lane toward the player');
  finishWaves(s,true);assert.equal(s.health,100);assert.equal(s.defeated,20);
  assert.ok(s.enemies.every(e=>e.crossing===(e.key==='rider')));
  s.update(0,16);assert.equal(s.finished,false);assert.equal(s.miniBoss?.enemy.key,'palomera','level 2 now ends with its boss');
});

test('evading enemy_2 cannot advance the wave while enemy_1 remains alive; later-level bikes retain normal AI',()=>{
  const s=setup(1),bike=s.enemies.find(e=>e.key==='rider'),walker=s.enemies.find(e=>e.key==='walker');
  bike.x=1101;s.updateCrossing(bike,0);assert.equal(s.defeated,1);
  s.combatTime+=5000;s.waves.update();assert.equal(s.waves.spawned,2);assert.ok(walker.hp>0);
  assert.equal(s.waves.cleared,false);
  s.hitEnemy(walker,strike);s.waves.update();s.combatTime+=s.level.gap;s.waves.update();
  assert.equal(s.waves.spawned,5);
  const last=setup(5);assert.equal(last.enemies.find(e=>e.key==='rider').crossing,false);
});

test('fast crossing attack uses swept contact, can be jumped or lane-evaded and only damages once per pass',()=>{
  const player={x:400,y:450},enemy={y:450,crossingHit:false};
  assert.equal(crossingHits(200,600,enemy,player,0),true);
  assert.equal(crossingHits(600,200,enemy,player,0),true);
  assert.equal(crossingHits(200,600,enemy,player,72),false);
  assert.equal(crossingHits(200,600,enemy,{x:400,y:410},0),false);
  enemy.crossingHit=true;assert.equal(crossingHits(200,600,enemy,player,0),false);
  const s=setup(1),e=s.enemies.find(e=>e.crossing);e.x=430;e.y=450;e.facing=-1;s.player.x=400;s.invulnerableUntil=0;
  s.updateCrossing(e,.1);const hp=s.health;assert.ok(hp<100);assert.equal(e.crossingHit,true);
  s.combatTime+=2000;e.x=430;s.updateCrossing(e,.1);assert.equal(s.health,hp);
});

test('boss intro triggers once after all 30 enemies, freezes active powers/music and cannot start early',()=>{
  const s=setup(5);let intros=0;s.game.events.on('boss-intro',()=>intros++);
  let cleanups=0;s.books={clear(){cleanups++;}};s.iphone={clear(){cleanups++;}};
  assert.equal(s.beginBossIntro(),false);finishWaves(s);
  assert.equal(s.beginBossIntro(),true);assert.equal(intros,1);assert.equal(cleanups,2);
  assert.equal(s.music.paused,true);assert.equal(s.cinematic,true);assert.equal(s.boss,null);
  assert.ok(s.enemies.every(e=>e.sprite.visible===false && e.shadow.visible===false));
  assert.equal(s.beginBossIntro(),false);s.update(0,50);assert.equal(s.finished,false);
  let bosses=0;s.spawnBoss=()=>{bosses++;};s.resumeBoss();s.resumeBoss();
  assert.equal(bosses,1);assert.equal(s.cinematic,false);assert.equal(s.music.paused,false);
});

test('next level is strictly the successor after victory and transition fires once',()=>{
  for(let level=0;level<6;level++) {
    const s=setup(level),events=[];s.game.events.on('level-transition',data=>events.push(data));
    s.nextLevel();assert.equal(events.length,0);s.finished=true;s.health=0;s.nextLevel();assert.equal(events.length,0);
    s.health=100;s.nextLevel();s.nextLevel();
    assert.deepEqual(events,level===5?[]:[{character:'office',level:level+1}]);
  }
});

test('intro variants show their correct asset, gate input, finish once asynchronously and clean listeners',async()=>{
  for(const kind of ['game','story','level','boss']) {
    const intro=new IntroScene();intro.init({kind,level:2,character:'student'});
    const images=[],loaded=[],delays=[];intro.textures={exists:()=>false};intro.load={image:(key,url)=>loaded.push({key,url})};intro.preload();
    assert.ok(loaded.some(l=>l.url.endsWith('intro_juego.png?url')));assert.ok(loaded.some(l=>l.url.endsWith('intro_boss.png?url')));
    assert.ok(loaded.some(l=>l.url.endsWith('intro_1.png?url')));
    intro.add={image:(x,y,key)=>{images.push(key);return new Visual();},rectangle:()=>new Visual(),text:()=>new Visual()};
    intro.cameras={main:{setBackgroundColor(){},setZoom(){return this;},centerOn(){return this;}}};intro.tweens={add(){}};
    intro.input=new EventEmitter();intro.input.keyboard=new EventEmitter();intro.events=new EventEmitter();
    intro.time={delayedCall:(ms,callback)=>delays.push({ms,callback})};intro.game={events:new EventEmitter(),scene:{stop(){}}};
    const completions=[];intro.game.events.on('intro-complete',data=>completions.push(data));intro.create();
    assert.equal(images[0],kind==='level'?'level-3':kind==='boss'?'intro-boss':kind==='story'?'intro-story':'intro-game');
    assert.equal(intro.input.keyboard.listenerCount('keydown'),0);delays[0].callback();
    assert.equal(intro.input.keyboard.listenerCount('keydown'),1);
    let prevented=0,stopped=0;
    intro.skip({preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});intro.skip();
    assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(completions.length,0);await Promise.resolve();assert.equal(completions.length,1);
    assert.equal(completions[0].kind,kind);intro.events.emit('shutdown');
    assert.equal(intro.input.keyboard.listenerCount('keydown'),0);assert.equal(intro.input.listenerCount('pointerdown'),0);
  }
});

function comboScene(key) {
  const s=setup(5),enemy=s.spawnEnemy(key,2,0,2,1);s.enemies=[enemy];
  s.combatTime=2000;s.invulnerableUntil=0;s.player.x=400;s.player.y=450;enemy.x=450;enemy.y=450;
  s.damageEvents=[];
  const hit=s.hitPlayer.bind(s);
  s.hitPlayer=(damage,source)=>{const connected=hit(damage,source);if(connected)s.damageEvents.push({at:s.combatTime,damage});return connected;};
  const advance=ms=>{for(let left=ms;left>0;){const dt=Math.min(left,10);s.combatTime+=dt;updateEnemyAttack(s,enemy);left-=dt;}};
  beginEnemyAttack(s,enemy,-1);return {s,enemy,advance};
}

test('enemy_8 uses three separate sprite rows and appears in levels 3 through 6 without changing totals',()=>{
  assert.ok(enemies.sweeper.url.endsWith('enemy_8.png?url'));
  assert.deepEqual(enemies.sweeper.rows,[4,4,4,4,4,4]);
  assert.equal(enemies.sweeper.frameRects.length,24);
  for(const rect of enemies.sweeper.frameRects)assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=1448 && rect.y+rect.height<=1086);
  const hurt=enemies.sweeper.frameRects[18];assert.ok(hurt.x<=962 && hurt.y<=867 && hurt.x+hurt.width>=1085 && hurt.y+hurt.height>=976,'detached broom stays inside hurt frame');
  for(let stage=1;stage<=3;stage++)for(const frame of enemies.sweeper.animations[`attack${stage}`])assert.ok(frame>=stage*4 && frame<stage*4+4);
  assert.ok(CAMPAIGN.slice(0,2).every(level=>!level.enemies.includes('sweeper')));
  assert.ok(CAMPAIGN.slice(2).every(level=>level.enemies.includes('sweeper')));
});

test('both combo enemies deal three distinct impacts despite the first hit granting normal invulnerability',()=>{
  for(const key of ['guard','sweeper']) {
    const {s,enemy,advance}=comboScene(key),combo=enemy.config.combo;
    advance(combo.windup-1);assert.equal(s.health,100);
    advance(1);assert.equal(s.damageEvents.length,1);assert.equal(s.health,100-enemy.config.damage);
    assert.equal(s.hitPlayer(40),false,'other enemies cannot bypass the damage grace period');
    advance(combo.interval);assert.equal(s.damageEvents.length,2);
    advance(combo.interval);assert.equal(s.damageEvents.length,3);assert.equal(s.health,100-enemy.config.damage*3);
    assert.equal(enemy.pending,null);assert.equal(s.comboVictim,null);
    advance(2000);assert.equal(s.damageEvents.length,3,'the completed attack cannot tick extra damage');
  }
});

test('enemy_4 must connect the first strike; jump, range and invulnerability prevent confirmation',()=>{
  for(const evade of [s=>s.player.x=800,s=>s.player.y=410,s=>s.jumpHeight=72,s=>s.invulnerableUntil=10000]) {
    const {s,enemy,advance}=comboScene('guard');evade(s);
    advance(enemy.config.combo.windup);assert.equal(enemy.pending,null);assert.equal(s.damageEvents.length,0);
    s.player.x=400;s.player.y=450;s.jumpHeight=0;s.invulnerableUntil=0;
    advance(2000);assert.equal(s.damageEvents.length,0);
  }
  assert.ok(enemies.guard.speed>enemies.sweeper.speed);assert.equal(enemies.guard.aggressive,true);
});

test('enemy_8 commits to all three swings after a miss and rechecks distance on every impact',()=>{
  const {s,enemy,advance}=comboScene('sweeper'),combo=enemy.config.combo;
  s.player.x=800;advance(combo.windup);assert.ok(enemy.pending);assert.equal(s.health,100);
  s.player.x=400;advance(combo.interval);assert.equal(s.damageEvents.length,1);
  s.player.y=410;advance(combo.interval);assert.equal(s.damageEvents.length,1);assert.equal(enemy.pending,null);
});

test('counterattacking or dashing breaks combo damage permission; pausing freezes the remaining hits',()=>{
  const counter=comboScene('guard');counter.advance(counter.enemy.config.combo.windup);
  counter.s.hitEnemy(counter.enemy,{damage:1,knockback:0,facing:1});counter.advance(1000);
  assert.equal(counter.s.damageEvents.length,1);assert.equal(counter.enemy.pending,null);
  const escape=comboScene('guard');escape.advance(escape.enemy.config.combo.windup);escape.advance(160);
  escape.s.startDash(-1,0);escape.advance(1000);assert.equal(escape.s.damageEvents.length,1);
  const paused=comboScene('sweeper');paused.advance(paused.enemy.config.combo.windup);
  const deadline=paused.enemy.pending.release;paused.s.paused=true;paused.s.update(0,50);
  assert.equal(paused.enemy.pending.release,deadline);assert.equal(paused.s.damageEvents.length,1);
  paused.s.paused=false;paused.advance(paused.enemy.config.combo.interval);assert.equal(paused.s.damageEvents.length,2);
});

test('combo damage stops immediately on defeat and cannot reuse a stale combo token',()=>{
  const {s,enemy,advance}=comboScene('sweeper');s.health=enemy.config.damage;
  const token=enemy.pending;advance(enemy.config.combo.windup);
  assert.equal(s.health,0);assert.equal(enemy.pending,null);assert.equal(s.comboVictim,null);
  advance(1000);assert.equal(s.damageEvents.length,1);
  s.health=100;s.invulnerableUntil=s.combatTime+1000;assert.equal(s.hitPlayer(5,token),false);
});

test('H/J/K map to punch, kick and one special activation; Space and L keep jump and low kick',()=>{
  for(const character of ['office','student','teleperforman','gymbro'])for(const key of ['H','J','K']) {
    const s=setup(0,character),attack=key==='H'?'punch':key==='J'?'kick':s.character.special;
    s.enemies=[];s.started=[];s.startAttack=type=>s.started.push(type);
    s.keys[key].isDown=true;s.keys[key].justDown=true;s.update(0,16);
    assert.deepEqual(s.started,[attack]);
    if(key==='K'){s.update(0,16);assert.deepEqual(s.started,[attack],'holding special cannot retrigger it');}
  }
  const student=setup(0,'student');
  student.started=[];student.startAttack=type=>student.started.push(type);student.keys.L.isDown=true;
  student.update(0,16);assert.deepEqual(student.started,['lowKick']);
  const jump=setup(0);jump.keys.SPACE.justDown=true;jump.update(0,16);assert.equal(jump.jumpStart,jump.combatTime);
});

test('manual restart keeps level, lives and boss checkpoint without deleting earned wave points',()=>{
  const s=setup(5);s.boss={};s.run.lives=2;s.run.score=500;s.run.levelStartScore=200;
  s.keys.R.justDown=true;s.update(0,16);
  assert.equal(s.restartedWith.level,5);assert.equal(s.restartedWith.bossCheckpoint,true);
  assert.equal(s.restartedWith.run,s.run);assert.equal(s.run.lives,2);assert.equal(s.run.score,500);
  assert.equal(s.restartLevel(),false);s.init(s.restartedWith);assert.equal(s.health,100);assert.equal(s.run.lives,2);
  const regular=setup(2);regular.run.score=500;regular.run.levelStartScore=200;regular.restartLevel();assert.equal(regular.run.score,200);
});

test('arcade strikes sound by result: hit → punch/kick once, miss → wave once after the active frames',()=>{
  for(const [key,type,impact] of [['H','punch','punch'],['J','kick','kick']]) {
    const hit=arcadeSetup('office'),calls=[];hit.s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
    hit.press(key);hit.step(60);
    assert.deepEqual(calls.filter(n=>['punch','kick','wave'].includes(n)),[impact],`${type} that connects`);
    const miss=arcadeSetup('office'),missed=[];miss.s.sfx={play:n=>missed.push(n),stop(){},setPaused(){}};
    miss.target.x=miss.s.player.x+400;miss.press(key);
    assert.deepEqual(missed,[],'nothing plays at startup: the result is not known yet');
    miss.step(60);assert.deepEqual(missed,['wave'],`${type} that misses`);
  }
});

test('enemy deaths use their own grunt; enemies without one keep alternating hurt sounds',()=>{
  const s=setup(0),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
  for(const [key,sound] of [['walker','maleGrunt'],['belly','enemy10Die'],['thrower','enemy3Die'],['leash','femaleGrunt'],['guard','maleGrunt4'],['sweeper','maleGrunt3']]){
    const e=s.spawnEnemy(key,0,0,2,0);s.hitEnemy(e,strike);assert.equal(calls.at(-1),sound,key);
  }
  for(const key of ['fan','brawler']){const e=s.spawnEnemy(key,0,0,2,0);s.hitEnemy(e,strike);}
  assert.deepEqual(calls.slice(-2).sort(),['hurt','hurt2']);
});

test('breaking the can plays metal crack once and collecting the energy item plays item once',()=>{
  const {s,press,step}=pickupSetup(),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};s.health=40;
  const can=s.energyPickups.spawn(s.player.x+70,s.player.y);
  press('H');step(40);assert.ok(!calls.includes('metalCrack'));assert.ok(calls.includes('punch'),'hitting the can is an impact');
  press('H');step(40);assert.equal(calls.filter(n=>n==='metalCrack').length,1);
  s.player.x=can.x;step(5);assert.equal(calls.filter(n=>n==='item').length,1);
});

test('walker, brawler and fan strikes play punch2 once when the arcade attack becomes active',()=>{
  for(const key of ['walker','brawler','fan']) {
    const {s,step}=arcadeSetup(),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};s.debugPreview=false;
    const e=s.spawnEnemy(key,0,0,2,0);e.x=s.player.x+40;e.y=s.player.y;s.enemies=[e];
    const model=new Enemy(s.arcade,e);s.arcade.enemies.set(e,model);model.ready=0;
    assert.ok(model.begin(true),key);step(90);
    assert.ok(calls.includes('punch2'),key);
  }
  assert.equal(ENEMY_ATTACK_SOUNDS.guard,'tambo','existing enemy sounds are unchanged');assert.equal(ENEMY_ATTACK_SOUNDS.leash,'whip');
});

test('vendor charge screeches and belly charge runs, once each when the rush starts',()=>{
  for(const [key,sound] of [['vendor','screeching'],['belly','running']]) {
    const {s,step}=arcadeSetup(),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};s.debugPreview=false;
    const e=s.spawnEnemy(key,0,0,2,0);e.x=s.player.x+300;e.y=s.player.y;s.enemies=[e];
    const model=new Enemy(s.arcade,e);s.arcade.enemies.set(e,model);model.ready=0;
    assert.ok(model.begin(),key);assert.equal(model.action?.charge,true,`${key} chooses its charge from range`);
    step(120);assert.equal(calls.filter(n=>n===sound).length,1,key);
    assert.ok(!calls.includes(sound==='running'?'screeching':'running'),`${key} uses only its own charge sound`);
  }
});

import {enemyAttackData,enemyThrowData,enemySummonData} from '../src/data/attacks.js';
import {bossFor} from '../src/data/bosses.js';
test('level 1 boss data: each knife slash strikes on its own drawing and the football is released mid-throw',()=>{
  const b=enemies.barra;assert.equal(bossFor({boss:'barra'}).kind,'enemy');assert.equal(CAMPAIGN[0].boss,'barra');
  const active=stage=>enemyAttackData(b,stage).frames.find(f=>f.phase==='active').pose;
  assert.deepEqual([0,1,2].map(active),[6,9,14],'slash, backhand, lunge');
  assert.ok(enemyAttackData(b,2).range>enemyAttackData(b,0).range,'the lunge reaches further');
  const t=enemyThrowData(b,.8);assert.equal(t.frames.find(f=>f.phase==='active').pose,18);assert.equal(t.damage,Math.round(b.throw.damage*.8));
  assert.ok(b.speed>Math.max(...Object.entries(enemies).filter(([key,e])=>!e.boss && !e.minion && key!=='yulitza').map(([,e])=>e.speed)),'runs in faster than any normal enemy but Yulitza');
});

function bossArena(character='office'){
  const setupResult=arcadeSetup(character),s=setupResult.s,calls=[];
  s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};s.add.image=(x,y)=>Object.assign(new Visual(x,y),{rotation:0,setDisplaySize(){return this;}});
  s.debugPreview=false;s.enemies=[];s.waves.spawned=s.level.total;s.defeated=s.level.total;s.waves.update=()=>{};
  return {...setupResult,calls};
}
test('clearing level 1 spawns the boss (not counted as a wave enemy) and beating it wins the level',()=>{
  const {s,step}=bossArena();assert.equal(s.waves.cleared,true);
  step();assert.ok(s.miniBoss,'boss appears once the waves are cleared');const boss=s.miniBoss.enemy;
  assert.equal(boss.key,'barra');assert.equal(s.finished,false);assert.equal(s.counter.text.includes('JEFE'),true);
  const score=s.run.score;s.hitEnemy(boss,strike);assert.equal(s.defeated,s.level.total,'boss does not change the wave count');
  assert.equal(s.run.score,score+1500);step(10);assert.equal(s.finished,false,'death animation plays first');
  step(Math.ceil(1300/ARCADE.clock.stepMs)+2);assert.equal(s.finished,true);
  assert.equal(s.restartLevel(),false,'a won boss level cannot be restarted from the result');
});
test('level 1 boss throws a spinning football from range that hurts the player once',()=>{
  const {s,step}=bossArena();step();const boss=s.miniBoss.enemy,model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);
  s.arcade.enemies.set(boss,model);boss.x=s.player.x+420;boss.y=s.player.y;s.invulnerableUntil=0;s.respawnProtectedUntil=0;
  let thrown=null;for(let i=0;i<200 && !thrown;i++){step();thrown=s.projectiles.find(p=>p.spin);}
  assert.ok(thrown,'a football is thrown');assert.equal(thrown.facing,-1);assert.equal(thrown.speed,enemies.barra.throw.speed);
  const health=s.health;for(let i=0;i<120 && s.projectiles.includes(thrown);i++)step();
  assert.ok(s.health<health,'the ball connects');assert.ok(!s.projectiles.includes(thrown));
});

test('level 1 boss hops back after 3 quick hits, is untouchable mid-air, then rushes in with the knife combo',()=>{
  const {s,step}=bossArena();step();const boss=s.miniBoss.enemy;
  const model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);s.arcade.enemies.set(boss,model);
  boss.x=s.player.x+60;boss.y=s.player.y;model.ready=1e9;const light={damage:1,knockback:0,facing:1};
  s.hitEnemy(boss,light);step(20);s.hitEnemy(boss,light);step(20);assert.notEqual(model.state,'evade','two hits are not enough');
  const x=boss.x;s.hitEnemy(boss,light);assert.equal(model.state,'evade');
  const hp=boss.hp;s.hitEnemy(boss,{...light,damage:50});assert.equal(boss.hp,hp,'untouchable while hopping back');
  let peak=0;for(let i=0;i<60 && model.state==='evade';i++){step();peak=Math.max(peak,boss.z??0);}
  assert.ok(peak>20,'it is a jump');assert.equal(boss.z,0);assert.ok(boss.x-x>=150,'lands well out of reach');assert.equal(model.rush,true);
  let combo=false;for(let i=0;i<120 && !combo;i++){step();combo=Boolean(model.action && !model.action.throw && !model.action.charge);}
  assert.ok(combo,'runs straight back into the knife combo (no football in between)');assert.equal(model.rush,false);
});
test('spaced-out hits never trigger the evade; Gymbro full punch combo does',()=>{
  const {s,step}=bossArena();step();const boss=s.miniBoss.enemy;
  const model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);s.arcade.enemies.set(boss,model);model.ready=1e9;
  for(let i=0;i<4;i++){s.hitEnemy(boss,{damage:1,knockback:0,facing:1});step(Math.ceil(1600/ARCADE.clock.stepMs));}
  assert.notEqual(model.state,'evade');
  const g=bossArena('gymbro');g.step();const gb=g.s.miniBoss.enemy,gm=g.s.arcade.enemies.get(gb)??new Enemy(g.s.arcade,gb);
  g.s.arcade.enemies.set(gb,gm);gm.ready=1e9;gb.x=g.s.player.x+55;gb.y=g.s.player.y;let evaded=false;
  for(let stage=0;stage<3 && !evaded;stage++){g.press('H');for(let i=0;i<30 && !evaded;i++){g.step();evaded=gm.state==='evade';}}
  assert.ok(evaded,'three linked punches make him hop back');
  assert.equal(enemies.barra.height<120+5,true);
});

test('walker, brawler and fan survive at least 7 of the strongest normal strike on every level they appear in',async()=>{
  const {characters}=await import('../src/data/characters.js'); // already loaded (with its PNG hooks) by StreetScene
  const strongest=Math.max(...Object.values(characters).flatMap(c=>['punch','kick','lowKick'].map(k=>c.attacks[k]?.damage??0)));
  assert.equal(strongest,45);
  // enemy_1/6/7: 7 · enemy_10 (belly): 6 · enemy_11 (leash): 8 · enemy_3 (thrower): 9
  for(const [key,hits] of Object.entries({walker:7,brawler:7,fan:7,belly:6,leash:8,thrower:9,yulitza:8})) {
    const levels=CAMPAIGN.filter(level=>level.enemies.includes(key));assert.ok(levels.length,key);
    for(const level of levels){const hp=scaledEnemy(enemies[key],level).hp;assert.ok(Math.ceil(hp/strongest)>=hits,`${key} on ${level.name}: ${hp} hp`);}
  }
  assert.ok(enemies.brawler.hp>=Math.max(enemies.walker.hp,enemies.fan.hp),'the brawler stays the toughest of the three');
});

test('enemy_3 is fast and hops back after 3 hits; enemy_8 strikes faster',()=>{
  const t=enemies.thrower;assert.ok(t.speed>=150);assert.equal(t.evade.hits,3);assert.ok(t.evade.poses.every(pose=>pose<t.rows.reduce((a,b)=>a+b)));
  const c=enemies.sweeper.combo;assert.ok(c.windup<=260 && c.interval<=190 && c.cooldown<=1700);
});

test('La Palomera: level 2 boss data — pigeon combo poses, pigeon projectile and the pose-14 heal ritual',()=>{
  const p=enemies.palomera;assert.equal(CAMPAIGN[1].boss,'palomera');assert.equal(bossFor(CAMPAIGN[1]).name,'PALOMERA');
  assert.deepEqual([0,1,2].map(stage=>enemyAttackData(p,stage).frames.find(f=>f.phase==='active').pose),[6,10,18]);
  assert.equal(enemyThrowData(p).frames.find(f=>f.phase==='active').pose,18);assert.equal(p.throw.texture,'paloma');
  assert.equal(p.heal.pose,14);assert.equal(p.heal.duration,5000);assert.equal(p.frameRects.length,28);
});
function palomeraArena(){
  const r=bossArena();const {s}=r;s.level={...s.level,boss:'palomera'};r.step();
  const boss=s.miniBoss.enemy,model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);s.arcade.enemies.set(boss,model);
  boss.sprite.setFrame=function(frame){this.frame=frame;return this;};boss.sprite.setTint=function(){this.tinted=true;return this;};boss.sprite.clearTint=function(){this.tinted=false;return this;};
  return {...r,boss,model};
}
test('La Palomera heals in pose 14 for 5 s while untouched, only when hurt and far away',()=>{
  const {s,step,boss,model,calls}=palomeraArena();assert.equal(boss.key,'palomera');
  boss.x=s.player.x+400;boss.y=s.player.y;model.throwReady=1e9;model.ready=0;step(5);assert.notEqual(model.state,'heal','healthy bosses do not heal');
  const max=boss.config.hp;boss.hp=Math.round(max*.4);model.action=null;boss.pending=null;if(model.state!=='circle'&&model.state!=='approach')model.state='approach';model.ready=0;step(3);
  assert.equal(model.state,'heal');assert.ok(calls.includes('spell'),'the ritual is announced');
  const start=boss.hp;let pose14=false;
  for(let i=0;i<Math.ceil(5600/ARCADE.clock.stepMs) && model.state==='heal';i++){step();pose14 ||= boss.sprite.frame===14;}
  assert.ok(pose14,'holds the white-dove pose');assert.notEqual(model.state,'heal','the ritual lasts at most ~5 s');
  assert.ok(Math.abs(boss.hp-start-max*.25)<=max*.02,`regained ~25% (${boss.hp-start})`);
  model.ready=0;step(5);assert.notEqual(model.state,'heal','cooldown before healing again');
});
test('any hit interrupts La Palomera healing and she cannot restart it immediately',()=>{
  const {s,step,boss,model}=palomeraArena();boss.x=s.player.x+400;boss.y=s.player.y;boss.hp=Math.round(boss.config.hp*.4);
  model.throwReady=1e9;model.ready=0;step(3);assert.equal(model.state,'heal');step(60);
  const before=boss.hp;s.hitEnemy(boss,{damage:1,knockback:0,facing:1});assert.equal(model.state,'hurt');
  step(5);assert.ok(boss.hp<=before,'no more healing after the hit');assert.equal(boss.sprite.tinted,false);
  model.ready=0;step(30);assert.notEqual(model.state,'heal');
});
test('La Palomera throws a pigeon that faces its flight and hurts the player',()=>{
  const {s,step,boss,model}=palomeraArena();boss.x=s.player.x+420;boss.y=s.player.y;s.invulnerableUntil=0;s.respawnProtectedUntil=0;
  let thrown=null;for(let i=0;i<220 && !thrown;i++){step();thrown=s.projectiles.find(p=>p.texture==='paloma');}
  assert.ok(thrown,'a pigeon is thrown');assert.equal(thrown.facing,-1);assert.equal(thrown.spin,0,'pigeons fly, they do not spin');
  const health=s.health;for(let i=0;i<120 && s.projectiles.includes(thrown);i++)step();assert.ok(s.health<health);
});

test('enemy_6 (brawler) shouts "¡SOLO MILLOS LOK!" over its head when it appears, follows it, then hides',()=>{
  const {s,step}=arcadeSetup();s.debugPreview=false;s.enemies=[];
  const texts=[];const text=s.add.text;s.add.text=(x,y,value,...rest)=>{texts.push(value);return text(x,y,value,...rest);};
  const e=s.spawnEnemy('brawler',0,0,2,0);assert.ok(e.taunt);assert.ok(texts.includes('¡SOLO MILLOS LOK!'));
  step();assert.equal(e.taunt.visible,true);assert.equal(e.taunt.x,e.x);assert.ok(e.taunt.y<e.y-e.config.height);
  step(Math.ceil(2600/ARCADE.clock.stepMs));assert.equal(e.taunt.visible,false,'disappears after ~2.5 s');
  const f=s.spawnEnemy('brawler',1,1,2,0);step();assert.equal(f.taunt.visible,true);s.hitEnemy(f,strike);step();
  assert.equal(f.taunt.visible,false,'a knocked-out brawler stops talking');
  assert.equal(s.spawnEnemy('chain',2,0,2,0).taunt,undefined,'only enemies with a taunt get a bubble');
});

test('each street enemy has its own catchphrase; Millos in blue and Santa Fe in red',()=>{
  const phrases={walker:'¡DESPÉGUELO PAPU!',guard:'¡PAPELES!',brawler:'¡SOLO MILLOS LOK!',fan:'¡EL CIELO ES ROJO!',
    sweeper:'¡BÓTESE LA LIGA MONO!',belly:'¡POR ALLÁ NO VOY!',leash:'¡HOLA MOR!'};
  for(const [key,text] of Object.entries(phrases))assert.equal(enemies[key].taunt?.text,text,key);
  assert.equal(enemies.brawler.taunt.color,'#0b3b8c');assert.equal(enemies.fan.taunt.color,'#b3121b');
});

function grafiteroArena(){
  const r=bossArena();const {s}=r;s.level={...s.level,boss:'grafitero'};
  s.add.ellipse=(x,y,w,h,color)=>Object.assign(new Visual(x,y),{width:w,height:h,color});r.step();
  const boss=s.miniBoss.enemy,model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);s.arcade.enemies.set(boss,model);
  boss.sprite.setFrame=function(frame){this.frame=frame;return this;};
  return {...r,boss,model};
}
test('El Grafitero (level 3): spray-can throw, pink floor spray and the 3rd-row jump',()=>{
  const g=enemies.grafitero;assert.equal(CAMPAIGN[2].boss,'grafitero');assert.equal(bossFor(CAMPAIGN[2]).name,'PINTURITA');
  assert.equal(enemyAttackData(g).frames.find(f=>f.phase==='active').pose,14,'pink spray at full cloud');
  assert.equal(enemyThrowData(g).frames.find(f=>f.phase==='active').pose,6);assert.equal(g.throw.texture,'spraycan');
  assert.deepEqual([...new Set(g.evade.poses)],[8,9,10,11],'jump uses the third row, mostly airborne (9)');
  assert.equal(enemyAttackData(g).frames.filter(f=>f.phase==='recovery').every(f=>f.pose===15),true,'the cloud lingers on pose 15');assert.equal(g.paint.ms,3000);
});
test('the pink spray paints 3 stains ahead that hurt a grounded player and vanish after 3 s',()=>{
  const {s,step,boss,model}=grafiteroArena();boss.x=s.player.x+150;boss.y=s.player.y;s.invulnerableUntil=0;s.respawnProtectedUntil=0;
  model.throwReady=1e9;model.ready=0;let painted=false;
  for(let i=0;i<120 && !painted;i++){step();painted=(s.stains?.stains.length??0)>=3;}
  assert.ok(painted,'three stains');const stains=s.stains.stains.slice(0,3);
  assert.ok(stains.every(st=>Math.sign(st.x-boss.x)===-1),'painted in front of him (towards the player)');
  // move the player onto a stain, away from the boss, while jumping: no damage
  model.ready=1e9;model.throwReady=1e9;s.invulnerableUntil=0;const st=stains[2];s.player.x=st.x;s.player.y=st.y;s.player.z=40;
  let health=s.health;s.stains.update();assert.equal(s.health,health,'jumping over paint is safe');
  s.player.z=0;s.invulnerableUntil=0;s.stains.update();assert.ok(s.health<health,'walking on paint hurts');
  health=s.health;s.invulnerableUntil=0;s.stains.update();assert.equal(s.health,health,'one hit per stain per 0.7 s');
  s.combatTime=st.until+1;s.stains.update();assert.ok(!s.stains.stains.includes(st),'gone after 3 s');assert.equal(st.sprite.destroyed,true);
});
test('the jump sends him backwards leaving cyan stains at takeoff and landing, also right after painting',()=>{
  const {s,step,boss,model}=grafiteroArena();boss.x=s.player.x+60;boss.y=s.player.y;model.ready=1e9;
  const light={damage:1,knockback:0,facing:1};for(let i=0;i<3;i++){s.hitEnemy(boss,light);step(10);}
  assert.equal(model.state,'evade');const x=boss.x,cyan=()=>s.stains.stains.filter(st=>st.sprite.color===0x2fd6ff).length;
  assert.equal(cyan(),1,'takeoff stain');let frames=new Set();
  for(let i=0;i<80 && model.state==='evade';i++){step();frames.add(boss.sprite.frame);}
  assert.equal(cyan(),2,'landing stain');assert.ok(boss.x>x+150,'pushed backwards');assert.ok([8,9,10,11].some(f=>frames.has(f)));
  // after a pink spray with the player still on top of him, he jumps away
  const g=grafiteroArena();g.boss.x=g.s.player.x+60;g.boss.y=g.s.player.y;g.model.throwReady=1e9;g.model.ready=0;
  let jumped=false;for(let i=0;i<200 && !jumped;i++){g.s.player.x=g.boss.x-60;g.step();jumped=g.model.state==='evade';}
  assert.ok(jumped,'hops back after painting when crowded');
});

test('players 2, 4 and 5 grunt when hit (player_2_grunt, player_4_grunt, female_grunt); the others stay silent',()=>{
  for(const [character,expected] of [['student',['player2Grunt']],['gymbro',['player4Grunt']],['magolita',['femaleGrunt']],['office',[]],['teleperforman',[]]]) {
    const {s}=arcadeSetup(character),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
    s.invulnerableUntil=0;s.respawnProtectedUntil=0;assert.equal(s.hitPlayer(10),true);
    assert.deepEqual(calls,expected,character);
    assert.equal(s.hitPlayer(10),false,'invulnerable right after a hit');assert.deepEqual(calls,expected,'no repeat while invulnerable');
  }
});

function cabecillaArena(){
  const r=bossArena();const {s}=r;s.level={...s.level,boss:'cabecilla'};
  s.tweens={add(){},killTweensOf(){},pauseAll(){},resumeAll(){}};r.step();
  const boss=s.miniBoss.enemy,model=s.arcade.enemies.get(boss)??new Enemy(s.arcade,boss);s.arcade.enemies.set(boss,model);
  return {...r,boss,model,minions:()=>s.enemies.filter(e=>e.summoner===boss && e.hp>0)};
}
test('El Cabecilla (level 4) data: summon row, fast fragile students in 4 variants',async()=>{
  const {characters}=await import('../src/data/characters.js');
  const c=enemies.cabecilla,m=enemies.estudiante;assert.equal(CAMPAIGN[3].boss,'cabecilla');assert.equal(bossFor(CAMPAIGN[3]).name,'COLADIN');
  assert.deepEqual(c.summon.poses,[4,5,6,7]);assert.equal(enemySummonData(c).frames.find(f=>f.phase==='active').pose,6,'minions appear when he points');
  assert.equal(m.minion,true);assert.ok(m.speed>Math.max(...Object.values(characters).map(ch=>ch.speed)),'faster than every player');
  assert.equal(enemyAttackData(m).frames.find(f=>f.phase==='active').pose,4,'running punch');
});
test('El Cabecilla calls waves of 2–3 students from both edges, capped, and they run in and punch',()=>{
  const {s,step,boss,model,minions}=cabecillaArena();s.invulnerableUntil=0;s.respawnProtectedUntil=0;
  boss.x=s.player.x+400;boss.y=s.player.y;
  for(let i=0;i<200 && !minions().length;i++)step();
  const wave=minions();assert.ok(wave.length>=2 && wave.length<=3,`wave of ${wave.length}`);
  assert.ok(new Set(wave.map(e=>e.config.frameOffset)).size===wave.length,'different students');
  assert.equal(s.defeated,s.level.total,'students do not count as wave enemies');
  const lives=s.run.lives,health=s.health;
  for(let i=0;i<1200;i++){step();assert.ok(minions().length<=enemies.cabecilla.summon.maxAlive,'never more than 4 students');}
  assert.ok(s.health<health || s.run.lives<lives,'the students hit the player');
});
test('beating El Cabecilla makes him hop back and call a wave; his defeat sends the students away and wins',()=>{
  const {s,step,boss,model,minions}=cabecillaArena();boss.x=s.player.x+60;boss.y=s.player.y;model.ready=1e9;model.summonReady=1e9;
  for(let i=0;i<3;i++){s.hitEnemy(boss,{damage:1,knockback:0,facing:1});step(10);}
  assert.equal(model.state,'evade');for(let i=0;i<60 && model.state==='evade';i++)step();
  assert.equal(model.summonReady,0,'calls reinforcements right after escaping');model.ready=0;
  for(let i=0;i<120 && !minions().length;i++)step();assert.ok(minions().length>=2);
  s.hitEnemy(boss,{damage:1e6,knockback:0,facing:1});step();assert.equal(minions().length,0,'students run off');
  step(Math.ceil(1600/ARCADE.clock.stepMs));assert.equal(s.finished,true);
});

test('El Cabecilla keeps his distance even when the player hugs a screen edge',()=>{
  const {s,step,boss,model}=cabecillaArena();model.summonReady=1e9;
  for(const edge of ['left','right']){
    s.player.x=edge==='left'?s.floor.left+10:s.floor.right-10;boss.x=s.player.x+(edge==='left'?-1:1)*0;model.ready=1e9;
    for(let i=0;i<240;i++){s.player.x=edge==='left'?s.floor.left+10:s.floor.right-10;step();}
    assert.ok(Math.abs(boss.x-s.player.x)>=300,`${edge} edge: ${Math.round(Math.abs(boss.x-s.player.x))} px away`);
  }
});

test('level 5 boss: shield blocks frontal hits (chip damage, no stagger), full damage from behind; tear gas lobs and lingers',async()=>{
  const {GasClouds}=await import('../src/game/GasClouds.js');
  assert.equal(CAMPAIGN[4].boss,'antidisturbios');assert.equal(bossFor(CAMPAIGN[4]).name,'ESMADIEGO');
  const r=enemies.antidisturbios;assert.ok(r.hp>=2000);assert.ok(r.shield.frontDamage<=.15);assert.ok(r.throw.gas);
  const s=setup(4,'gymbro');s.player.x=300;s.player.y=450;
  const boss=s.spawnMiniBoss(bossFor(CAMPAIGN[4])).enemy;boss.x=360;boss.y=450;boss.facing=-1;
  const hp=boss.hp;s.hitEnemy(boss,{damage:40,knockback:20,facing:1,stun:300});
  assert.equal(boss.hp,hp-4,'front hit: 10%');assert.equal(boss.x,360,'no knockback through the shield');
  s.player.x=420;s.hitEnemy(boss,{damage:40,knockback:20,facing:-1,stun:300});assert.equal(boss.hp,hp-44,'hit in the back: full damage');
  s.add.image=(x,y)=>new Visual(x,y);const gas=new GasClouds(s);s.health=100;s.invulnerableUntil=0;s.respawnProtectedUntil=0;
  const cloud=gas.spawn(s.player.x,s.player.y,r.throw.gas);assert.equal(s.health,100-r.throw.gas.blast);
  s.invulnerableUntil=0;s.combatTime+=r.throw.gas.every;gas.update();assert.equal(s.health,100-r.throw.gas.blast-r.throw.gas.damage);
  s.combatTime+=r.throw.gas.ms;gas.update();assert.equal(gas.clouds.length,0);assert.equal(cloud.sprite.destroyed,true);
});

function grabSetup(){
  const setup=arcadeSetup();const {s,target}=setup;s.debugPreview=false;
  const model=new Enemy(s.arcade,target);s.arcade.enemies.set(target,model);model.ready=1e6;
  target.x=s.player.x+50;target.y=s.player.y;
  const walkIn=()=>{s.keys.D.isDown=true;setup.step(6);s.keys.D.isDown=false;};
  return {...setup,model,walkIn};
}
test('walking into a regular enemy grabs it; H knees it and the third knee knocks it down',()=>{
  const {s,target,step,press,model,walkIn}=grabSetup();walkIn();
  assert.equal(s.arcade.player.state,'grab');assert.equal(model.state,'grabbed');
  assert.equal(target.x,s.player.x+ARCADE.grab.hold,'held in front of the player');
  const hp=target.hp;press('H');step(20);assert.ok(target.hp<hp);assert.equal(model.state,'grabbed');
  press('H');step(20);press('H');step(30); // hitstop delays the end of the last knee
  assert.equal(model.state,'down');assert.equal(s.arcade.player.state,'walk');
  assert.ok(target.invulnerableUntil>s.combatTime,'invulnerable while on the floor');
  let guard=0;while(model.state==='down' && guard++<200)step();assert.equal(model.state,'approach','gets back up');
});
test('J throws the held enemy forward, back + H throws it backward; the body bowls over others and lands knocked down',()=>{
  const {s,target,step,press,model,walkIn}=grabSetup();
  const other={...s.enemies[0],x:0};const bystander=Object.assign(Object.create(Object.getPrototypeOf(target)),target,{x:s.player.x+200,hp:500,config:{...target.config,hp:500},invulnerableUntil:0});
  s.enemies.push(bystander);const bystanderModel=new Enemy(s.arcade,bystander);s.arcade.enemies.set(bystander,bystanderModel);bystanderModel.ready=1e6;
  walkIn();const start=target.x,hp=target.hp;press('J');
  let guard=0;while(model.state!=='down' && guard++<120)step();
  assert.equal(model.state,'down');assert.ok(target.x>start+150,'flew forward');assert.ok(target.hp<hp,'landing hurts');
  assert.ok(bystander.hp<500,'hit by the flying body');assert.equal(bystanderModel.state,'down');
  const back=grabSetup();back.walkIn();const x=back.target.x;back.s.keys.A.isDown=true;back.press('H');back.s.keys.A.isDown=false;
  guard=0;while(back.model.state!=='down' && guard++<120)back.step();
  assert.ok(back.target.x<x-150,'thrown behind the player');
});
test('bosses cannot be grabbed and a grab ends if the player is hit; held too long, the enemy breaks free',()=>{
  const {s,target,step,model,walkIn}=grabSetup();
  target.config={...target.config,boss:true};walkIn();assert.equal(s.arcade.player.state,'walk');
  target.config={...target.config,boss:false};walkIn();assert.equal(s.arcade.player.state,'grab');
  s.invulnerableUntil=0;s.hitPlayer(5);assert.notEqual(model.state,'grabbed');
  const held=grabSetup();held.walkIn();held.step(ARCADE.grab.holdFrames+2);
  assert.equal(held.model.state,'hurt');assert.equal(held.s.arcade.player.state,'walk');
});
test('the third strike of a combo knocks a regular enemy down',()=>{
  const {s,target,step,press,model}=grabSetup();target.x=s.player.x+55;
  press('H');
  for(let stage=0;stage<2;stage++){
    let guard=0;while(!s.arcade.player.action?.data.frames[s.arcade.player.action.index]?.cancel && guard++<60)step();press('H');
  }
  let guard=0;while(model.state!=='down' && guard++<60)step();
  assert.equal(model.state,'down');
});

test('Yulitza: fastest fighter, 2-slash machete combo, and she hops to the other side when the player swings close by',()=>{
  const y=enemies.yulitza;assert.equal(y.name,'YULITZA');
  const speeds=[...Object.entries(enemies).filter(([key])=>key!=='yulitza').map(([,e])=>e.speed),...Object.values(ARCADE.player.speeds)];
  assert.ok(y.speed>Math.max(...speeds),'faster than every enemy, boss and player');
  assert.equal(y.combo.stages,2);assert.equal(enemyAttackData(y,0).finisher,false);assert.equal(enemyAttackData(y,1).finisher,true);
  assert.deepEqual([0,1].map(stage=>enemyAttackData(y,stage).frames.find(f=>f.phase==='active').pose),[10,14]);
  const {s,target,step}=arcadeSetup();s.debugPreview=false;
  target.key='yulitza';target.config={...y,hp:400,dodge:{...y.dodge,chance:1}};target.hp=400;target.x=s.player.x+60;target.y=s.player.y;
  const model=new Enemy(s.arcade,target);s.arcade.enemies.set(target,model);model.ready=1e6;
  s.arcade.player.request('punch');step(2);
  assert.equal(model.state,'evade');assert.ok(target.invulnerableUntil>s.combatTime,'untouchable mid-hop');
  let guard=0;while(model.state==='evade' && guard++<60)step();
  assert.ok(target.x<s.player.x,'landed on the player\'s other side');assert.equal(target.hp,400);
});

test('a knocked-down enemy slides back along an arc, lands with a thud and lies still before getting up',()=>{
  const {s,target,step,model}=grabSetup();const calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
  const x=target.x;s.hitEnemy(target,{damage:1,knockback:30,facing:1,stun:100,knockdown:true,finisher:true});
  assert.equal(model.state,'down');assert.ok(Math.abs(target.x-x)<1,'the push is replayed as a slide, not a jump');
  // fall frames + hitstop
  let maxZ=0;for(let i=0;i<ARCADE.knockdown.fall+10;i++){step();maxZ=Math.max(maxZ,target.z??0);}
  assert.ok(maxZ>10,'arcs through the air');assert.equal(target.z,0);assert.ok(target.x>x+25,'ends pushed back');
  assert.ok(calls.includes('stomp'),'thud on landing');
});
test('player hits throw punch/kick/finisher sparks, finishers make the player rebound, and defeats pop their points',()=>{
  const {s,target}=arcadeSetup();const combat=s.arcade.combat;
  const drawn=[];s.add.graphics=()=>{const g={clear(){return g;},setDepth(){return g;},lineStyle(){return g;},lineBetween(){return g;},fillStyle(){return g;},fillCircle(){return g;},strokeCircle(){return g;},destroy(){}};drawn.push(g);return g;};
  combat.impact(s.player,target,{type:'punch',facing:1});combat.impact(s.player,target,{type:'kick',facing:1});
  const x=s.player.x;combat.impact(s.player,target,{type:'punch',facing:1,finisher:true});
  assert.deepEqual(combat.impacts.slice(-3).map(p=>p.kind),['punch','kick','finisher']);
  assert.equal(s.player.x,x-ARCADE.feedback.recoil,'rebound away from the target');
  combat.step(combat.frame+1);
  const texts=[];s.add.text=(px,py,value)=>{const t={value,setOrigin(){return t;},setDepth(){return t;}};texts.push(t);return t;};
  target.hp=1;s.hitEnemy(target,{damage:5,knockback:0,facing:1});assert.equal(texts.at(-1).value,'+100');
});

test('the crossing moto courier shouts enemy_2_voice once per pass, only when it passes close to the player',()=>{
  const s=setup(1),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
  const bike=s.enemies.find(e=>e.key==='rider');assert.ok(bike.crossing);
  bike.x=s.player.x-600;bike.y=s.player.y;s.updateCrossing(bike,0);assert.ok(!calls.includes('enemy2Voice'),'still far away');
  bike.x=s.player.x-150;s.updateCrossing(bike,0);s.updateCrossing(bike,.01);
  assert.equal(calls.filter(n=>n==='enemy2Voice').length,1,'once per pass');
  const far=setup(1),farCalls=[];far.sfx={play:n=>farCalls.push(n),stop(){},setPaused(){}};
  const other=far.enemies.find(e=>e.key==='rider');other.x=far.player.x;other.y=far.player.y+200;far.updateCrossing(other,0);
  assert.ok(!farCalls.includes('enemy2Voice'),'another lane, far in depth: silent');
});

test('level bosses: attack voices (Palomera only on the pigeon throw) and hurt grunts with a short cooldown',async()=>{
  const {BOSS_SOUNDS,EFFECT_FILES}=await import('../src/audio/SoundEffects.js');
  const files=k=>EFFECT_FILES[k];
  assert.deepEqual(['barra','palomera','grafitero','cabecilla','antidisturbios','dormilon'].map(k=>[files(BOSS_SOUNDS[k].attack??BOSS_SOUNDS[k].throw),files(BOSS_SOUNDS[k].hurt)]),
    [['enemy_boss_1_attack.mp3','male_grunt2.mp3'],['enemy_boss_2_attack.mp3','enemy_boss_2_hurt.mp3'],['enemy_boss_3_attack.mp3','male_grunt2.mp3'],
     ['enemy_boss_4_attack.mp3','male_grunt4.mp3'],['enemy_boss_5_attack.mp3','male_grunt4.mp3'],['enemy_boss_6_attack.mp3','male_grunt4.mp3']]);
  const s=setup(0),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
  const boss=s.spawnMiniBoss(bossFor(CAMPAIGN[0])).enemy;
  s.hitEnemy(boss,{damage:5,knockback:0,facing:1});s.hitEnemy(boss,{damage:5,knockback:0,facing:1});
  assert.equal(calls.filter(n=>n==='maleGrunt2').length,1,'one grunt per cooldown');
  s.combatTime+=500;s.hitEnemy(boss,{damage:5,knockback:0,facing:1});assert.equal(calls.filter(n=>n==='maleGrunt2').length,2);
});

test('stomp, books and the phone knock enemies down; enemy_11/12 shout on entry and grunt when hit',async()=>{
  const {characters}=await import('../src/data/characters.js');const {IPHONE}=await import('../src/data/iphone.js');
  assert.equal(characters.gymbro.attacks.stomp.knockdown,true);assert.ok(characters.gymbro.attacks.stomp.damage>45);
  assert.equal(IPHONE.attack.knockdown,true);assert.ok(IPHONE.attack.damage>90);
  assert.ok(characters.teleperforman.attacks.headset.damage>40 && characters.teleperforman.attacks.headset.cooldown>=2000);
  const s=setup(3),calls=[];s.sfx={play:n=>calls.push(n),stop(){},setPaused(){}};
  const y=s.spawnEnemy('yulitza',90,0,1,0),l=s.spawnEnemy('leash',91,0,1,0);
  assert.deepEqual(calls.slice(-2),['enemy12Attack','enemy11Attack']);
  s.hitEnemy(y,{damage:1,knockback:0,facing:1});s.hitEnemy(l,{damage:1,knockback:0,facing:1});
  assert.deepEqual(calls.filter(n=>n==='femaleHurt').length,2);
});
