import test from 'node:test';
import assert from 'node:assert/strict';
import {Poultry,PolleroController,HEN} from '../src/game/Poultry.js';

class Visual {
  constructor(){this.alpha=1;}setOrigin(){return this;}setScale(){return this;}setFrame(){return this;}
  setPosition(){return this;}setDepth(){return this;}setFlipX(){return this;}setText(){return this;}setVisible(){return this;}
  destroy(){this.destroyed=true;}
}
function setup(){
  const p={x:400,y:450,z:0},owner={x:740,y:450,hp:210,facing:-1,config:{speed:175,range:112,animations:{release:[8,9,10,11]}},tell:new Visual()};
  const hits=[],damage=[];
  const scene={player:p,enemies:[owner],floor:{left:65,right:895,top:390,bottom:500},facing:1,combatTime:1000,level:{damage:1},
    add:{sprite:()=>new Visual()},textures:{get:()=>({referenceHeight:229})},sfx:{play(){}},
    hitPlayer:n=>hits.push(n),hitEnemy:(e,a)=>{damage.push({e,a});e.hp-=a.damage;}};
  const runtime={scene,combat:{tokens:{acquire:()=>true}}};runtime.poultry=new Poultry(runtime);
  const model={runtime,scene,actor:owner,clock:70,ready:0,state:'approach',pose(){},face(dx){owner.facing=Math.sign(dx)||1;},
    transition(state){this.state=state;},finish(n){this.state='circle';this.ready=this.clock+n;},
    move(dx,dy,speed){owner.x+=dx*speed/60;owner.y+=dy*speed/60*.55;},begin(){this.club=true;this.state='attack';return true;}};
  const controller=new PolleroController(model);
  return {scene,runtime,p,owner,hits,damage,model,controller,hens:runtime.poultry};
}
test('fists pass over the hen and a low kick reflects it once',()=>{
  const e=setup(),h=e.hens.release(e.owner),targets=new Set();h.x=445;
  const attack={range:105,facing:1};
  for(const type of ['punch','headset'])e.hens.contact(e.p,{...attack,type},targets);
  assert.equal(h.phase,'wild');assert.equal(targets.size,0);
  e.p.z=0;e.hens.contact(e.p,{...attack,type:'lowKick'},targets);e.hens.contact(e.p,{...attack,type:'lowKick'},targets);
  assert.equal(h.phase,'flung');assert.equal(targets.size,1);
});
test('a reflected hen strikes another enemy once, with knockdown, and is removed without extra wave credit',()=>{
  const e=setup(),h=e.hens.release(e.owner),other={x:530,y:450,hp:100,z:0};h.x=445;e.scene.enemies.push(other);
  e.hens.contact(e.p,{type:'lowKick',range:105,facing:1},new Set());
  for(let i=0;i<50;i++)e.hens.update();
  assert.equal(e.damage.length,1);assert.equal(e.damage[0].e,other);assert.equal(e.damage[0].a.damage,HEN.reflectDamage);
  assert.equal(e.damage[0].a.knockdown,true);assert.equal(e.hens.hens.length,0);assert.equal(h.sprite.destroyed,true);
});
test('a low kick respects facing and depth instead of reflecting every hen on screen',()=>{
  const e=setup(),h=e.hens.release(e.owner);h.x=445;
  e.hens.contact(e.p,{type:'lowKick',range:105,facing:-1},new Set());assert.equal(h.phase,'wild');
  h.y=490;e.hens.contact(e.p,{type:'lowKick',range:105,facing:1},new Set());assert.equal(h.phase,'wild');
});
test('ankle pecks are spaced, jumping avoids contact, and the owner cannot release an unlimited flock',()=>{
  const e=setup(),h=e.hens.release(e.owner);h.x=415;
  assert.equal(e.hens.release(e.owner),null);e.p.z=40;e.hens.update();assert.equal(e.hits.length,0);
  e.p.z=0;for(let i=0;i<55;i++)e.hens.update();assert.equal(e.hits.length,1);assert.equal(e.hits[0],5);
  for(let i=0;i<20;i++)e.hens.update();assert.equal(e.hits.length,1);
});
test('Don Pico releases during the visible release pose, then takes the adjacent lane to the player back',()=>{
  const e=setup();assert.equal(e.controller.beginRelease(),true);
  for(let i=0;i<25;i++){e.model.clock++;e.controller.step();}assert.equal(e.hens.hens.length,0);
  e.model.clock++;e.controller.step();assert.equal(e.hens.hens.length,1);
  for(let i=0;i<25;i++){e.model.clock++;e.controller.step();}assert.equal(e.model.state,'circle');
  let usedSideLane=false;
  for(let i=0;i<220 && !e.model.club;i++){e.model.clock++;e.controller.step();usedSideLane ||= Math.abs(e.owner.y-e.p.y)>24;}
  assert.equal(usedSideLane,true);assert.ok(e.owner.x<e.p.x);assert.equal(e.model.club,true);
});
test('interrupting the release prevents the hen; defeat, lifetime and scene cleanup end the hazard',()=>{
  const e=setup();e.controller.beginRelease();e.controller.interrupt();e.model.state='hurt';e.model.clock+=60;e.controller.step();
  assert.equal(e.hens.hens.length,0);
  const h=e.hens.release(e.owner);e.owner.hp=0;for(let i=0;i<20;i++)e.hens.update();assert.equal(e.hens.hens.length,0);assert.equal(h.sprite.destroyed,true);
  e.owner.hp=100;const next=e.hens.release(e.owner);e.hens.clear();assert.equal(next.sprite.destroyed,true);assert.equal(e.hens.hens.length,0);
});
