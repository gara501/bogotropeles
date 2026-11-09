import test from 'node:test';
import assert from 'node:assert/strict';
import {Vuvuzela,VUVUZELA} from '../src/game/Vuvuzela.js';
import {Player} from '../src/actors/Player.js';
import {readFileSync} from 'node:fs';
import {ARMED_RUN} from '../src/data/armedRun.js';

function fixture(){
  // Fluent Phaser stand-in: only rendering is stubbed, combat runs the real Player model.
  const graphic=()=>{const proxy=new Proxy({destroyed:false,destroy(){this.destroyed=true;},
    setVisible(value){this.visible=value;return this;},setTexture(key,frame){this.key=key;this.frame=frame;return this;},
    setScale(value){this.scale=value;return this;},setFlipX(value){this.flipX=value;return this;}},
    {get(target,key){return key in target?target[key]:()=>proxy;}});return proxy;};
  const sprite={visible:true,alpha:1,x:200,stop(){return this;},setFrame(){return this;},setVisible(value){this.visible=value;return this;}};
  const scene={add:{graphics:graphic,text:graphic,image:graphic},character:{height:116,idle:0,texture:'test',special:'special',
    animations:{punch:[0,1,2]},attacks:{punch:{damage:20,range:80,duration:210,hitAt:90}}},
    player:{x:200,y:450,z:0,sprite},floor:{top:400,bottom:500},facing:1,health:100,combatTime:0,enemies:[],
    sfx:{play(){}},hitEnemy(target,attack){target.hp-=attack.damage;}};
  const runtime={scene,frame:0,combat:{touches:()=>true}};
  scene.arcade=runtime;runtime.player=new Player(runtime);
  scene.vuvuzela=new Vuvuzela(scene,()=>1);scene.vuvuzela.rolled.add(0);
  return {scene,model:runtime.player,vuvuzela:scene.vuvuzela};
}

test('equipped punch gains reach and damage, kicks stay unchanged',()=>{
  const {vuvuzela,model,scene}=fixture();vuvuzela.equip();model.begin('punch');
  assert.equal(scene.playerAttack.damage,25);assert.equal(scene.playerAttack.range,145);
  assert.equal(model.action.data.combo,false);
  const kick={type:'kick',damage:30,range:100};assert.equal(vuvuzela.attack(kick),kick);
});

test('armed impact art and damage share the same four active frames',()=>{
  const {vuvuzela,model}=fixture();vuvuzela.equip();model.begin('punch');
  const frames=model.action.data.frames;
  assert.equal(frames.length,24);
  assert.deepEqual(frames.filter(frame=>frame.phase==='active').map(frame=>frame.weaponPose),[7,7,7,7]);
  assert.ok(frames.filter(frame=>frame.phase==='startup').every(frame=>[5,6].includes(frame.weaponPose)));
  assert.ok(frames.filter(frame=>frame.phase==='recovery').every(frame=>[8,0].includes(frame.weaponPose)));
});

test('full armed body replaces unarmed art, stays at body scale and restores on hurt or break',()=>{
  const {vuvuzela,model,scene}=fixture();scene.characterKey='office';
  scene.textures={exists:key=>key==='office-vuvuzela',get:()=>({referenceHeight:320})};
  scene.arcade.input={dx:0,dy:0};vuvuzela.equip();vuvuzela.render();
  assert.equal(scene.player.sprite.visible,false);assert.equal(vuvuzela.held.key,'office-vuvuzela');
  assert.equal(vuvuzela.held.frame,0);const scale=vuvuzela.held.scale;
  scene.facing=-1;scene.arcade.input.dx=-1;model.age=6;vuvuzela.render();
  assert.equal(vuvuzela.held.flipX,true);assert.equal(vuvuzela.held.frame,2);
  model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');vuvuzela.render();
  assert.equal(vuvuzela.held.frame,7);assert.equal(vuvuzela.held.scale,scale);
  model.transition('hurt');vuvuzela.render();assert.equal(scene.player.sprite.visible,true);assert.equal(vuvuzela.held.visible,false);
  vuvuzela.clearHeld();assert.equal(scene.player.sprite.visible,true);assert.equal(vuvuzela.held.visible,false);
});

test('armed GOMELO runs with the dedicated run cycle at body scale; idle and swings keep the sheet poses',()=>{
  const {vuvuzela,model,scene}=fixture();scene.characterKey='office';scene.character={...scene.character,height:106,walkFramesPerPose:3};
  const refs={'office':153,'office-vuvuzela':320,'office-vuvuzela-run':107};
  scene.textures={exists:key=>key in refs,get:key=>({referenceHeight:refs[key]})};
  scene.arcade.input={dx:1,dy:0};vuvuzela.equip();
  const frames=[];for(const age of [0,3,6,9,12,15,18,21,24,27,30]){model.age=age;vuvuzela.render();frames.push(vuvuzela.held.frame);}
  assert.deepEqual(frames,[0,1,2,3,4,5,6,7,8,9,0]);
  assert.equal(vuvuzela.held.key,'office-vuvuzela-run');assert.equal(vuvuzela.held.scale,106/153);
  scene.arcade.input={dx:0,dy:0};vuvuzela.render();
  assert.equal(vuvuzela.held.key,'office-vuvuzela');assert.equal(vuvuzela.held.frame,0);
  scene.arcade.input={dx:1,dy:0};model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');vuvuzela.render();
  assert.equal(vuvuzela.held.key,'office-vuvuzela');assert.equal(vuvuzela.held.frame,7);
});

test('Gymbro keeps the weapon body near his unarmed guard size when moving, stopping and swinging',()=>{
  const {vuvuzela,model,scene}=fixture();scene.characterKey='gymbro';scene.character={...scene.character,height:117};
  const refs={gymbro:218,'gymbro-vuvuzela':327};
  scene.textures={exists:key=>key in refs,get:key=>({referenceHeight:refs[key]})};
  scene.arcade.input={dx:1,dy:0};vuvuzela.equip();
  // Measured alpha heights of the actual weapon poses, versus the 198 px guard.
  const guardHeight=198*117/218,heights=[327,328,328,332,330];
  for(let pose=1;pose<=4;pose++){
    model.age=(pose-1)*6;vuvuzela.render();assert.equal(vuvuzela.held.frame,pose);
    assert.ok(Math.abs(heights[pose]*vuvuzela.held.scale-guardHeight)<3,`walking pose ${pose} must not enlarge the body`);
  }
  const walkingScale=vuvuzela.held.scale;
  scene.arcade.input.dx=0;vuvuzela.render();assert.equal(vuvuzela.held.frame,0);assert.equal(vuvuzela.held.scale,walkingScale);
  scene.facing=-1;scene.arcade.input.dx=-1;vuvuzela.render();assert.equal(vuvuzela.held.flipX,true);assert.equal(vuvuzela.held.scale,walkingScale);
  model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');vuvuzela.render();
  assert.equal(vuvuzela.held.frame,7);assert.equal(vuvuzela.held.scale,walkingScale);
  vuvuzela.clearHeld();assert.equal(scene.player.sprite.visible,true);assert.equal(vuvuzela.held.visible,false);
});

test('Magolita uses eight armed walking poses at the unarmed body scale, with matching idle and swing size',()=>{
  const {vuvuzela,model,scene}=fixture();scene.characterKey='magolita';scene.character={...scene.character,height:98,walkFramesPerPose:4};
  const refs={magolita:153,'magolita-vuvuzela':318,'magolita-vuvuzela-run':156};
  scene.textures={exists:key=>key in refs,get:key=>({referenceHeight:refs[key]})};
  vuvuzela.equip();scene.arcade.input={dx:1,dy:0};
  const frames=[];
  for(let i=0;i<=8;i++){model.age=i*4;vuvuzela.render();frames.push(vuvuzela.held.frame);assert.equal(vuvuzela.held.key,'magolita-vuvuzela-run');assert.equal(vuvuzela.held.scale,98/153);}
  assert.deepEqual(frames,[0,1,2,3,4,5,6,7,0]);
  const walkingFace=34*vuvuzela.held.scale;
  scene.facing=-1;scene.arcade.input.dx=-1;vuvuzela.render();assert.equal(vuvuzela.held.flipX,true);
  scene.arcade.input.dx=0;vuvuzela.render();assert.equal(vuvuzela.held.key,'magolita-vuvuzela');
  assert.ok(Math.abs(69*vuvuzela.held.scale-walkingFace)<2,'ready and walking faces retain the same apparent size');
  model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');vuvuzela.render();
  assert.equal(vuvuzela.held.key,'magolita-vuvuzela');assert.equal(vuvuzela.held.frame,7);
  assert.ok(Math.abs(68*vuvuzela.held.scale-walkingFace)<2,'swing keeps the same body scale');
});

test('Teleperforman keeps the same standing body size when walking armed, stopping and swinging',()=>{
  const {vuvuzela,model,scene}=fixture();scene.characterKey='teleperforman';scene.character={...scene.character,height:116,walkFramesPerPose:4};
  const refs={teleperforman:195,'teleperforman-vuvuzela':317,'teleperforman-vuvuzela-run':195};
  scene.textures={exists:key=>key in refs,get:key=>({referenceHeight:refs[key]})};
  vuvuzela.equip();scene.arcade.input={dx:1,dy:0};const frames=[],guard=178*116/195;
  for(let i=0;i<=8;i++){
    model.age=i*4;vuvuzela.render();frames.push(vuvuzela.held.frame);
    assert.equal(vuvuzela.held.key,'teleperforman-vuvuzela-run');
    assert.ok(Math.abs(176*ARMED_RUN.teleperforman.scale*vuvuzela.held.scale-guard)<3,'walking must match the guard body');
  }
  assert.deepEqual(frames,[0,1,2,3,4,5,6,7,0]);
  scene.facing=-1;scene.arcade.input.dx=-1;vuvuzela.render();assert.equal(vuvuzela.held.flipX,true);
  scene.arcade.input.dx=0;vuvuzela.render();assert.equal(vuvuzela.held.key,'teleperforman-vuvuzela');
  const idleScale=vuvuzela.held.scale;assert.ok(Math.abs(317*idleScale-guard)<1);
  model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');vuvuzela.render();
  assert.equal(vuvuzela.held.frame,7);assert.equal(vuvuzela.held.scale,idleScale);
});

test('armed locomotion strips have exactly one configured cell per pose',()=>{
  // A mismatch makes prepareSheet read outside the image and build a texture too wide for WebGL.
  const files=Object.fromEntries(Object.keys(ARMED_RUN).map(key=>[key,`${key}_vuvuzela_motion_v${key==='gymbro'?3:2}.png`]));
  for(const [character,run] of Object.entries(ARMED_RUN)){
    const png=readFileSync(new URL(`../src/data/players/${files[character]}`,import.meta.url));
    assert.equal(png.readUInt32BE(16),run.poses*(run.cellWidth??128),character);assert.equal(png.readUInt32BE(20),run.cellHeight??128,character);
    assert.ok(run.order.every(pose=>pose>=0 && pose<run.poses),character);
  }
});

test('the thrown horn flies forward, shatters on landing and cannot be picked up again',()=>{
  const {vuvuzela,scene}=fixture();scene.floor={...scene.floor,left:0,right:1000};scene.arcade.frame=100;
  vuvuzela.equip();vuvuzela.remaining=6;
  assert.equal(vuvuzela.throwForward(),true);assert.equal(vuvuzela.remaining,0);assert.equal(scene.player.sprite.visible,true);
  const shot=vuvuzela.shots[0];assert.equal(vuvuzela.items.length,0);
  vuvuzela.update(101);assert.ok(shot.x>224);assert.ok(shot.lift>0);assert.equal(vuvuzela.throwForward(),false);
  for(let frame=102;frame<=100+VUVUZELA.flightFrames;frame++)vuvuzela.update(frame);
  assert.equal(vuvuzela.shots.length,0);assert.equal(shot.sprite.destroyed,true);
  assert.equal(vuvuzela.items.length,0);assert.equal(vuvuzela.bursts.length,1);assert.ok(vuvuzela.bursts[0].x>500);
  scene.player.x=shot.x;scene.player.y=shot.y;
  for(let frame=137;frame<=180;frame++)vuvuzela.update(frame);
  assert.equal(vuvuzela.remaining,0);assert.equal(vuvuzela.items.length,0);assert.equal(vuvuzela.bursts.length,0);
  vuvuzela.pendingBreak=true;assert.equal(vuvuzela.throwForward(),false,'a breaking horn cannot be thrown');
});

for(const facing of [-1,1])test(`thrown horn hits the first valid target once, facing ${facing}`,()=>{
  const {vuvuzela,scene}=fixture();scene.facing=facing;scene.player.x=500;
  const near={x:500+facing*100,y:450,hp:100},far={x:500+facing*180,y:450,hp:100};
  const otherLane={x:500+facing*50,y:500,hp:100},airborne={x:500+facing*50,y:450,z:100,hp:100};
  scene.enemies=[far,otherLane,airborne,near];vuvuzela.equip();vuvuzela.throwForward();
  let frame=1;while(vuvuzela.shots.length && frame<=40)vuvuzela.update(frame++);
  assert.equal(near.hp,75);assert.equal(far.hp,100);assert.equal(otherLane.hp,100);assert.equal(airborne.hp,100);
  assert.equal(vuvuzela.shots.length,0);assert.equal(vuvuzela.items.length,0);assert.equal(vuvuzela.bursts.length,1);
  for(;frame<=80;frame++)vuvuzela.update(frame);
  assert.equal(near.hp,75);assert.equal(vuvuzela.bursts.length,0);
});

test('throw flights pause, shatter at floor bounds and are destroyed on death and shutdown',()=>{
  const {vuvuzela,scene}=fixture();scene.floor={...scene.floor,left:0,right:260};
  vuvuzela.equip();vuvuzela.throwForward();const shot=vuvuzela.shots[0];
  scene.paused=true;vuvuzela.update(1);assert.equal(shot.age,0);
  scene.paused=false;scene.cinematic=true;vuvuzela.update(2);assert.equal(shot.age,0);
  scene.cinematic=false;for(let frame=3;frame<15;frame++)vuvuzela.update(frame);
  assert.equal(vuvuzela.shots.length,0);assert.equal(vuvuzela.items.length,0);assert.equal(vuvuzela.bursts[0].x,260);
  vuvuzela.equip();vuvuzela.throwForward();const deadFlight=vuvuzela.shots[0].sprite;
  scene.health=0;vuvuzela.update(15);assert.equal(deadFlight.destroyed,true);assert.equal(vuvuzela.shots.length,0);
  scene.health=100;vuvuzela.equip();vuvuzela.throwForward();const flight=vuvuzela.shots[0].sprite;
  vuvuzela.destroy();assert.equal(flight.destroyed,true);assert.equal(vuvuzela.shots.length,0);
});

test('one use per swing, including misses, regardless of targets or active frames',()=>{
  const {vuvuzela,model,scene}=fixture();vuvuzela.equip();
  model.begin('punch');model.contact(model.action);model.contact(model.action);
  assert.equal(vuvuzela.remaining,9);
  scene.enemies=[{hp:100},{hp:100}];model.begin('punch');
  model.contact(model.action);model.contact(model.action);
  assert.equal(vuvuzela.remaining,8);assert.deepEqual(scene.enemies.map(e=>e.hp),[75,75]);
});

test('tenth swing keeps full damage and breaks once after its active frames',()=>{
  const {vuvuzela,model,scene}=fixture();vuvuzela.equip();
  for(let i=0;i<VUVUZELA.uses;i++){
    model.begin('punch');model.action.displayedFrame={phase:'active'};model.contact(model.action);
  }
  assert.equal(vuvuzela.remaining,0);assert.equal(scene.playerAttack.damage,25);
  vuvuzela.update(1);assert.equal(vuvuzela.bursts.length,0);
  model.action.displayedFrame={phase:'recovery'};vuvuzela.update(2);vuvuzela.update(3);
  assert.equal(vuvuzela.bursts.length,1);
  model.begin('punch');assert.equal(scene.playerAttack.damage,20);assert.equal(scene.playerAttack.range,80);
});

test('pickup requires walking on the ground and cannot refill an equipped vuvuzela',()=>{
  const {vuvuzela,scene,model}=fixture();vuvuzela.spawn(200,450);scene.player.z=30;
  vuvuzela.update(1);assert.equal(vuvuzela.remaining,0);
  scene.player.z=0;model.state='hurt';vuvuzela.update(2);assert.equal(vuvuzela.remaining,0);
  model.state='walk';vuvuzela.update(3);assert.equal(vuvuzela.remaining,10);assert.equal(vuvuzela.items.length,0);
  vuvuzela.remaining=4;vuvuzela.spawn(200,450);vuvuzela.update(4);
  assert.equal(vuvuzela.remaining,4);assert.equal(vuvuzela.items.length,1);
});

test('interrupted startup spends nothing; interrupted final swing still breaks',()=>{
  const {vuvuzela,model}=fixture();vuvuzela.equip();model.begin('punch');model.transition('hurt');
  assert.equal(vuvuzela.remaining,10);
  model.transition('walk');vuvuzela.remaining=1;model.begin('punch');model.contact(model.action);
  model.transition('hurt');vuvuzela.update(1);
  assert.equal(vuvuzela.remaining,0);assert.equal(vuvuzela.bursts.length,1);assert.equal(vuvuzela.pendingBreak,false);
  vuvuzela.spawn(500,450);const dropped=vuvuzela.items[0].graphic;vuvuzela.destroy();
  assert.equal(dropped.destroyed,true);assert.equal(vuvuzela.held.destroyed,true);assert.equal(vuvuzela.label.destroyed,true);
});
