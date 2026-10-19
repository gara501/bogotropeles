import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { registerHooks } from 'node:module';
import { IPHONE } from '../src/data/iphone.js';
import { IPhoneSpecial } from '../src/projectiles/IPhoneSpecial.js';
import { firstPhoneTarget } from '../src/projectiles/iphoneCollision.js';

const hooks=registerHooks({load(url,context,nextLoad){
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  return nextLoad(url,context);
}});
const {characters}=await import('../src/data/characters.js');hooks.deregister();

class Visual extends EventEmitter {
  constructor(x=0,y=0){super();this.x=x;this.y=y;this.rotation=0;this.destroyed=false;}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setText(text){this.text=text;return this;}
  setColor(color){this.color=color;return this;}
  destroy(){this.destroyed=true;this.removeAllListeners();}
}
for(const method of ['setDepth','setFlipX','setDisplaySize'])Visual.prototype[method]=function(){return this;};
function setup(facing=1) {
  const scene={combatTime:1000,specialReadyAt:0,health:100,finished:false,paused:false,
    hurtUntil:0,dashUntil:0,jumpStart:-1000,facing,character:characters.office,
    player:{x:400,y:450,sprite:new Visual()},playerAttack:null,enemies:[],boss:null,hits:[],
    add:{text:()=>new Visual(),image:(x,y)=>new Visual(x,y)},
    play(actor,state,duration){this.animation={actor,state,duration};},
    hitEnemy(enemy,attack){enemy.hp-=attack.damage;enemy.x+=attack.facing*attack.knockback;this.hits.push(enemy);},
  };
  const special=new IPhoneSpecial(scene);
  const frame=index=>scene.player.sprite.emit('animationupdate',{key:'office-iphone'},{textureFrame:index});
  const release=()=>{assert.equal(special.start(),true);scene.combatTime+=IPHONE.attack.hitAt;frame(IPHONE.releaseFrame);return special.phones[0];};
  const advance=ms=>{for(let left=ms;left>0;){const step=Math.min(50,left);scene.combatTime+=step;special.update(step/1000);left-=step;}};
  return {scene,special,frame,release,advance};
}

test('iPhone balance matches actual punch, arena and release frame timing; other abilities stay available',()=>{
  const office=characters.office;
  assert.equal(IPHONE.attack.damage,office.attacks.punch.damage*3);
  assert.equal(IPHONE.attack.range,IPHONE.arenaWidth*.7);assert.equal(IPHONE.attack.cooldown,2000);
  const releaseIndex=office.animations.iphone.indexOf(IPHONE.releaseFrame);
  assert.equal(office.attacks.iphone.duration/office.animations.iphone.length*releaseIndex,IPHONE.attack.hitAt);
  assert.ok(IPHONE.attack.duration-IPHONE.attack.hitAt>=350&&IPHONE.attack.duration-IPHONE.attack.hitAt<=500);
  assert.ok(office.animations.punch.length&&office.animations.kick.length&&office.animations.dash.length);
  const pose=office.frameRects[IPHONE.releaseFrame];
  assert.ok(pose.x+pose.width<=IPHONE.sourceRect.x,'phone is excluded from the released character pose');
  assert.equal(characters.student.special,'books');assert.equal(characters.teleperforman.special,'headset');assert.equal(characters.gymbro.special,'stomp');
});

test('only the release animation frame creates one phone; repeated events and held attack cannot duplicate it',()=>{
  const {scene,special,frame}=setup();assert.equal(special.start(),true);
  assert.equal(scene.specialReadyAt,0);frame(16);frame(17);assert.equal(special.phones.length,0);
  scene.combatTime+=280;frame(18);frame(18);frame(19);assert.equal(special.phones.length,1);
  assert.equal(scene.specialReadyAt,scene.combatTime+2000);
  assert.equal(special.start(),false);assert.equal(special.phones.length,1);
});

test('dead, immobilized, busy, dashing, airborne, paused and finished actors cannot throw',()=>{
  const blockers=[s=>s.health=0,s=>s.hurtUntil=2000,s=>s.playerAttack={type:'punch'},s=>s.dashUntil=2000,s=>s.jumpStart=900,s=>s.paused=true,s=>s.finished=true];
  for(const block of blockers) {
    const {scene,special}=setup();block(scene);assert.equal(special.start(),false);assert.equal(special.phones.length,0);assert.equal(scene.specialReadyAt,0);
  }
});

test('interruption before release preserves cooldown; interruption afterwards leaves an independent projectile',()=>{
  const {scene,special,frame,release,advance}=setup();special.start();const cancelled=scene.playerAttack;scene.playerAttack=null;
  frame(18);assert.equal(special.release(cancelled),false);assert.equal(special.phones.length,0);assert.equal(scene.specialReadyAt,0);
  const phone=release(),startX=phone.x,lane=phone.y;
  scene.playerAttack=null;scene.player.x=100;scene.player.y=500;scene.facing=-1;advance(100);
  assert.equal(phone.x,startX+60);assert.equal(phone.y,lane);assert.ok(phone.sprite.rotation>0);
});

test('left and right launches come from the hand and retain their direction after the actor turns',()=>{
  for(const facing of [-1,1]) {
    const {scene,release,advance}=setup(facing);const phone=release();
    assert.equal(phone.x,400+facing*IPHONE.handOffset);assert.equal(phone.sprite.y,450-IPHONE.flightHeight);
    scene.facing=-facing;advance(50);assert.equal(phone.x,400+facing*(IPHONE.handOffset+30));assert.equal(phone.y,450);
  }
});

test('swept collision selects the closest valid lane target and prevents piercing, in both directions',()=>{
  for(const facing of [-1,1]) {
    const {scene,release,special}=setup(facing),phone=release();
    const near={x:phone.x+facing*90,y:450,hp:100},far={x:phone.x+facing*150,y:450,hp:100},wrongLane={x:phone.x+facing*30,y:490,hp:100};
    scene.enemies=[far,wrongLane,near];scene.combatTime+=300;special.update(.3);
    assert.equal(near.hp,10);assert.equal(far.hp,100);assert.equal(wrongLane.hp,100);assert.equal(scene.hits.length,1);assert.equal(special.phones.length,0);assert.equal(phone.sprite.destroyed,true);
  }
  assert.equal(firstPhoneTarget(100,150,450,1,[{x:80,y:450,radius:10}],26),null);
});

test('a blocked enemy still consumes the phone without transferring damage to the next enemy',()=>{
  const {scene,special,release,advance}=setup();const phone=release();
  const blocked={x:phone.x+40,y:450,hp:100,invulnerableUntil:10000},far={x:phone.x+70,y:450,hp:100};
  scene.enemies=[far,blocked];advance(150);
  assert.equal(blocked.hp,100);assert.equal(far.hp,100);assert.equal(special.phones.length,0);
});

test('phone impacts boss from its own incoming position and hits only one destructible object',()=>{
  const first=setup();const phone=first.release();let origin;
  first.scene.player.x=900;
  first.scene.boss={x:phone.x+60,y:450,dead:false,ended:false,hazards:{works:[]},hit(attack,incoming){origin=incoming;assert.equal(attack.damage,90);}};
  first.advance(100);assert.ok(origin.x<first.scene.boss.x);assert.equal(first.special.phones.length,0);
  const second=setup();const next=second.release();
  const cone={x:next.x+45,y:450,w:40,active:true,kind:'cone',hp:40};
  const fence={x:next.x+80,y:450,w:65,active:true,kind:'fence',hp:70};
  second.scene.boss={x:850,y:450,dead:true,hazards:{works:[fence,cone],hitObstacle(work,attack){work.hp-=attack.damage;}}};
  second.advance(200);assert.equal(cone.hp,-50);assert.equal(fence.hp,70);assert.equal(second.special.phones.length,0);
});

test('range, lifetime and offscreen bounds remove misses; pause freezes flight and cooldown',()=>{
  const limited=setup(-1);limited.scene.player.x=850;const a=limited.release();limited.advance(1200);
  assert.equal(a.distance,IPHONE.attack.range);assert.equal(limited.special.phones.length,0);
  const expired=setup();const b=expired.release();expired.scene.combatTime=b.born+IPHONE.lifetime;expired.special.update(.05);assert.equal(b.sprite.destroyed,true);
  const edge=setup();edge.scene.player.x=950;const c=edge.release();edge.advance(100);assert.equal(c.sprite.destroyed,true);
  const paused=setup();const d=paused.release();const ready=paused.scene.specialReadyAt,x=d.x;
  paused.scene.paused=true;paused.special.update(10);assert.equal(d.x,x);assert.equal(paused.scene.specialReadyAt,ready);
});

test('cooldown press gives feedback without an animation, becomes ready at expiry, and teardown removes listeners',()=>{
  const {scene,special,release}=setup();release();scene.playerAttack=null;scene.animation=null;
  assert.equal(special.start(),false);assert.equal(scene.animation,null);assert.match(special.label.text,/ESPERA/);
  scene.combatTime=scene.specialReadyAt;special.updateHud();assert.match(special.label.text,/LISTO/);assert.equal(special.start(),true);
  assert.equal(scene.player.sprite.listenerCount('animationupdate'),1);
  special.destroy();assert.equal(special.phones.length,0);assert.equal(scene.player.sprite.listenerCount('animationupdate'),0);
  const restarted=new IPhoneSpecial(scene);assert.equal(scene.player.sprite.listenerCount('animationupdate'),1);restarted.destroy();
});

test('celuco plays once at actual special activation, with no sound for interrupted preparation',()=>{
  const {scene,special,frame}=setup(),sounds=[];scene.sfx={play:name=>sounds.push(name)};
  special.start();const cancelled=scene.playerAttack;scene.playerAttack=null;
  assert.equal(special.release(cancelled),false);assert.deepEqual(sounds,[]);
  special.start();
  assert.deepEqual(sounds,[]);
  frame(18);frame(18);
  assert.deepEqual(sounds,['celuco']);
});

test('iphone spends 10 energy only on activation and blocks insufficient energy',()=>{
  const {scene,special,frame}=setup();scene.health=11;
  special.start();assert.equal(scene.health,11);frame(18);frame(18);assert.equal(scene.health,1);
  scene.playerAttack=null;scene.specialReadyAt=0;special.clear();
  assert.equal(special.start(),false);assert.equal(scene.health,1);
  scene.health=20;special.start();scene.health=10;frame(18);assert.equal(scene.health,10);assert.equal(scene.specialReadyAt,0);
});
