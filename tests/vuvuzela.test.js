import test from 'node:test';
import assert from 'node:assert/strict';
import {Vuvuzela,VUVUZELA} from '../src/game/Vuvuzela.js';
import {Player} from '../src/actors/Player.js';

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
