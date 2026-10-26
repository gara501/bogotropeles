import test from 'node:test';
import assert from 'node:assert/strict';
import {Potatoes,PaperoController,POTATO} from '../src/game/Potatoes.js';
class Visual {
  setDisplaySize(){return this;}setDepth(){return this;}setAlpha(){return this;}setPosition(){return this;}
  setText(){return this;}setVisible(){return this;}setTint(){return this;}destroy(){this.destroyed=true;}
}
function setup(){
  const p={x:250,y:450,z:0},actor={x:650,y:450,hp:520,facing:-1,z:0,config:{speed:85,animations:{lift:[8,9,10,11],slam:[12,13],throw:[14,15],reload:[24,25,26,27]}},tell:new Visual()};
  const hits=[],damage=[],pm={state:'walk',hurt(){this.state='knockdown';}},runtime={enemies:new Map(),player:pm,clearInput(){},combat:{frozen:()=>false,tokens:{acquire:()=>true},touches:()=>true}};
  const scene={player:p,enemies:[actor],floor:{left:65,right:895,top:390,bottom:500},facing:1,level:{damage:1},combatTime:1000,
    energyPickups:{cans:[]},add:{image:()=>new Visual()},sfx:{play(){}},hitPlayer:n=>{hits.push(n);return true;},hitEnemy:(a,hit)=>damage.push({a,hit})};
  runtime.scene=scene;runtime.potatoes=new Potatoes(runtime);
  const m={actor,scene,runtime,state:'approach',clock:100,ready:0,face(dx){actor.facing=Math.sign(dx)||1;},
    pose(){},transition(state){this.state=state;},finish(n){this.state='circle';this.ready=this.clock+n;},move(dx,dy){actor.x+=dx;actor.y+=dy;},
    canKnockdown:()=>true,knockdown(){this.state='down';this.down={};}};
  runtime.enemies.set(actor,m);m.papero=new PaperoController(m);
  return {p,actor,hits,damage,runtime,scene,m,c:m.papero,world:runtime.potatoes};
}
test('long sack lift is interruptible: one hit bursts it once and removes the carried sack',()=>{
  const e=setup();assert.equal(e.c.start('slam'),true);e.m.clock+=40;e.c.step();assert.equal(e.hits.length,0);
  e.c.interrupt();e.c.interrupt();assert.equal(e.c.hasSack,false);assert.equal(e.world.patches.length,1);
});
test('melee slam waits 90 frames and knocks the player down; throwing consumes the sack',()=>{
  const e=setup();e.p.x=600;e.c.start('slam');e.m.clock+=89;e.c.step();assert.equal(e.hits.length,0);
  e.m.clock++;e.c.step();assert.deepEqual(e.hits,[26]);assert.equal(e.runtime.player.state,'knockdown');assert.equal(e.c.hasSack,true);
  const t=setup();t.c.start('throw');t.m.clock+=72;t.c.step();assert.equal(t.world.sacks.length,1);assert.equal(t.c.hasSack,false);
});
test('potato spill trips both the player and the Papero, with a cooldown and actual sliding',()=>{
  const e=setup();e.p.x=e.actor.x+20;e.world.spill(e.actor);e.world.update();
  assert.equal(e.runtime.player.state,'knockdown');assert.equal(e.m.state,'down');assert.ok(e.m.down.to!==e.actor.x);
  const from=e.p.x;for(let i=0;i<20;i++)e.world.update();assert.notEqual(e.p.x,from);assert.equal(e.p.z,0);
  assert.ok(e.world.slipAt.get(e.actor)>e.world.frame);
});
test('jumping avoids rolling sacks; grounded enemies can also be tripped by a rolling sack',()=>{
  const e=setup();e.p.x=e.actor.x-55;e.p.z=60;e.world.roll(e.actor);e.world.update();assert.equal(e.hits.length,0);
  e.p.z=0;e.world.update();assert.equal(e.hits.length,1);assert.equal(e.runtime.player.state,'knockdown');
  const f=setup();f.p.y=500;const other={x:f.actor.x-65,y:450,hp:100,z:0};f.scene.enemies.push(other);
  f.world.roll(f.actor);f.world.update();assert.equal(f.damage.length,1);assert.equal(f.damage[0].a,other);assert.equal(f.damage[0].hit.knockdown,true);
});
test('reload only succeeds beside a live stocked box; destroying it during reload prevents refilling',()=>{
  const e=setup();e.c.hasSack=false;assert.equal(e.c.step(),false);
  const box={x:650,y:450,kind:'boxes',hp:2,potatoSacks:2,sprite:new Visual()};e.scene.energyPickups.cans=[box];
  assert.equal(e.c.step(),true);assert.equal(e.c.phase,'reload');e.m.clock+=60;e.c.step();assert.equal(e.c.hasSack,true);assert.equal(box.potatoSacks,1);
  e.c.hasSack=false;e.m.state='approach';e.c.step();box.hp=0;e.m.clock+=60;e.c.step();assert.equal(e.c.hasSack,false);
  assert.equal(e.c.nearbyBox(),undefined);
});
test('no offscreen or empty box grants a sack, and ground hazards expire and clean up',()=>{
  const e=setup();e.scene.energyPickups.cans=[{x:1000,y:450,kind:'boxes',hp:2},{x:650,y:450,kind:'boxes',hp:2,potatoSacks:0}];
  assert.equal(e.c.nearbyBox(),undefined);const patch=e.world.spill(e.actor);e.p.z=60;e.actor.z=60;
  for(let i=0;i<POTATO.life;i++)e.world.update();assert.equal(e.world.patches.length,0);assert.equal(patch.sprite.destroyed,true);
  e.world.roll(e.actor);e.world.clear();assert.equal(e.world.sacks.length,0);assert.equal(e.world.slides.length,0);
});
