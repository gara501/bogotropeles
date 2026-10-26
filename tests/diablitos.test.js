import test from 'node:test';
import assert from 'node:assert/strict';
import {Diablitos,DIABLITO} from '../src/game/Diablitos.js';

class Visual {
  setOrigin(){return this;}setDisplaySize(){return this;}setPosition(x,y){this.x=x;this.y=y;return this;}
  setFlipX(){return this;}setDepth(){return this;}setRotation(){return this;}setVisible(){return this;}
  setText(){return this;}stop(){return this;}setFrame(){return this;}destroy(){this.destroyed=true;}
}
function setup(){
  const actor=(x,diablito=false)=>({x,y:450,z:0,hp:260,facing:-1,config:{diablito,speed:155,animations:{walk:[0],push:[1],recoverCart:[2]}},sprite:new Visual(),tell:new Visual()});
  const p=actor(250),owner=actor(650,true),hits=[],damage=[];
  const model=()=>({state:'approach',buffer:{clear(){}},pose(){},hurt(){this.state='hurt';}});
  const pm=model();pm.state='walk';
  const scene={player:p,enemies:[owner],health:100,level:{damage:1},combatTime:10000,invulnerableUntil:0,respawnProtectedUntil:0,facing:1,
    floor:{left:65,right:895,top:390,bottom:500},add:{image:()=>new Visual(),text:()=>new Visual(),rectangle:()=>new Visual()},
    tweens:{add(){}},sfx:{play(){}},hitEnemy:(e,a)=>hits.push([e,a]),hitPlayer:(n)=>{damage.push(n);return true;}};
  const runtime={scene,player:pm,enemies:new Map([[owner,model()]]),combat:{frozen:()=>false,tokens:{release(){}}},clearInput(){}};
  const carts=new Diablitos(runtime);return {scene,runtime,carts,owner,p,hits,damage,actor,model};
}
function tick(env,n){for(let i=0;i<n;i++){env.scene.combatTime+=1000/60;env.carts.update();}}
test('miss leaves a shared stuck cart and a long punishable recovery without an immediate regrab',()=>{
  const e=setup();e.p.y=500;const c=e.carts.add(e.owner);c.phase='rush';c.remaining=5;
  tick(e,1);assert.equal(c.phase,'stuck');assert.equal(c.owner,null);assert.equal(e.carts.recovering.get(e.owner),DIABLITO.recovery);
  c.age=40;assert.equal(e.carts.claim(c,e.owner),false);assert.equal(e.carts.controls(e.owner),true);
  e.runtime.enemies.get(e.owner).state='hurt';assert.equal(e.carts.controls(e.owner),false);
});
test('player takes a stuck cart, hits each enemy once, and cannot steer or collect it in the air',()=>{
  const e=setup(),c=e.carts.add(e.owner);e.carts.park(c);c.age=40;e.p.x=c.x-60;
  e.p.z=40;assert.equal(e.carts.tryPlayerUse(),false);e.p.z=0;assert.equal(e.carts.tryPlayerUse(),true);
  assert.equal(c.owner,e.p);assert.equal(e.carts.holdsPlayer,true);
  e.owner.x=c.x+50;c.phase='rush';tick(e,12);
  assert.equal(e.hits.length,1);assert.equal(e.hits[0][1].damage,42);assert.equal(e.hits[0][1].knockdown,true);
});
test('another ordinary enemy can reuse the abandoned cart but bosses and airborne enemies cannot',()=>{
  const e=setup(),c=e.carts.add(e.owner);e.carts.park(c);c.age=40;
  const other=e.actor(c.x-30);e.scene.enemies.push(other);e.runtime.enemies.set(other,e.model());
  other.config.boss=true;assert.equal(e.carts.claim(c,other),false);other.config.boss=false;
  other.z=10;assert.equal(e.carts.claim(c,other),false);other.z=0;
  tick(e,1);assert.equal(c.owner,other);
});
test('successful ram carries the player a distance then throws into the stall lane for one impact',()=>{
  const e=setup(),c=e.carts.add(e.owner);c.phase='rush';c.remaining=390;e.p.x=c.x-20;
  tick(e,1);assert.equal(c.phase,'carry');assert.equal(e.carts.holdsPlayer,true);
  const caught=e.p.x;tick(e,55);
  assert.equal(e.damage.length,1);assert.equal(e.damage[0],22);assert.notEqual(e.p.x,caught);
  assert.equal(e.p.y,395);assert.equal(e.p.z,0);assert.equal(e.carts.holdsPlayer,false);assert.equal(c.phase,'stuck');
});
test('jump, invulnerability, owner death and teardown never leave the player trapped',()=>{
  const e=setup(),c=e.carts.add(e.owner);e.p.z=50;assert.equal(e.carts.catchPlayer(c),false);e.p.z=0;
  e.scene.invulnerableUntil=Infinity;assert.equal(e.carts.catchPlayer(c),false);e.scene.invulnerableUntil=0;
  assert.equal(e.carts.catchPlayer(c),true);e.owner.hp=0;tick(e,1);assert.equal(e.carts.holdsPlayer,false);assert.equal(e.p.z,0);
  e.carts.clear();assert.equal(e.carts.carts.length,0);assert.equal(c.sprite.destroyed,true);assert.equal(c.label.destroyed,true);
});

test('stuck carts stay in world space when the campaign camera advances',()=>{
  const e=setup(),c=e.carts.add(e.owner);e.carts.park(c);const x=c.x;
  e.scene.floor.left+=720;e.scene.floor.right+=720;tick(e,1);assert.equal(c.x,x);
});
