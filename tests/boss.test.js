import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { BOSS } from '../src/boss/balance.js';
import { phaseFor, picoPlan, workSites, slowMultiplier, availableAttacks, sweptFootprint, inRect } from '../src/boss/rules.js';
import { BossController } from '../src/boss/BossController.js';
import {ARCADE,toFrames} from '../src/data/arcade.js';

// Vite resolves PNG URL imports in the browser; Node only needs their identities.
const assetHooks=registerHooks({load(url,context,nextLoad){
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  return nextLoad(url,context);
}});
const {characters}=await import('../src/data/characters.js');
const {bossSprite,bossEffects}=await import('../src/boss/config.js');
assetHooks.deregister();

// Actual controllers run against a minimal renderer; time and damage are deterministic.
class Visual {
  constructor(x=0,y=0){this.x=x;this.y=y;this.visible=true;this.destroyed=false;this.anims={pause(){},resume(){}};}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setVisible(value){this.visible=value;return this;}
  setText(value){this.text=value;return this;}
  setDisplaySize(w,h){this.width=w;this.height=h;return this;}
  destroy(){this.destroyed=true;}
}
for(const method of ['setOrigin','setDepth','setAlpha','setFlipX','setFrame','setTexture','setTint','clearTint','stop','clear','lineStyle','fillStyle','strokeRect','fillRect','lineBetween','setRotation']) Visual.prototype[method]=function(){return this;};
function setup(speed=180) {
  const scene={game:{},combatTime:0,health:100,invulnerableUntil:0,hurtUntil:0,jumpHeight:0,
    floor:{left:65,right:895,top:410,bottom:500},player:{x:200,y:450},character:{speed},hits:[],sound:{},
    add:{image:(x,y)=>new Visual(x,y),text:(x,y)=>new Visual(x,y),rectangle:(x,y)=>new Visual(x,y),graphics:()=>new Visual()},
    makeFighter:(x,y,key,config)=>({x,y,key,config,sprite:new Visual(x,y),shadow:new Visual(x,y)}),
    play(actor,state){actor.animation=state;},idle(actor){actor.animation='idle';},placeFighter(){},
    hitPlayer(damage){
      if(this.combatTime<this.invulnerableUntil || this.health<=0)return false;
      this.health=Math.max(0,this.health-damage);this.invulnerableUntil=this.combatTime+1000;this.hurtUntil=this.combatTime+150;this.hits.push({damage,at:this.combatTime});return true;
    },
  };
  const boss=new BossController(scene,{height:134});
  const advance=milliseconds=>{for(let left=milliseconds;left>0;){const step=Math.min(50,left);scene.combatTime+=step;boss.update(step/1000);left-=step;}};
  const strike=(damage=10,behind=false)=>{
    scene.player={x:boss.x+(behind?50:-50),y:boss.y};boss.hit({damage,range:100,facing:behind?-1:1,knockback:10});
  };
  return {scene,boss,advance,strike};
}

test('all six attacks telegraph, activate once, reject overlapping starts and recover',()=>{
  for(const key of Object.keys(BOSS.attacks)) {
    const {scene,boss,advance}=setup();
    assert.equal(boss.debugAttack(key),true,key);
    assert.equal(boss.state,'windup');assert.equal(boss.begin('paper'),false);
    const windup=boss.attack.windup;
    advance(windup-1);assert.equal(boss.state,'windup',key);
    advance(1);assert.equal(boss.state,'attack',key);
    if(key==='pico')assert.equal(boss.hazards.pico.active,true);
    if(key==='works')assert.ok(boss.hazards.works.length>0);
    if(key==='traffic')assert.equal(boss.hazards.vehicles.length,1);
    if(key==='rain')assert.equal(boss.weather.active,true);
    if(key==='paper'){advance(50);assert.equal(boss.hazards.forms.length,1);}
    assert.ok(boss.readyAt[key]>=BOSS.attacks[key].cooldown);
    advance(Math.max(0,boss.until-scene.combatTime));assert.equal(boss.state,'recovery',key);
    advance(BOSS.attacks[key].recovery);assert.equal(boss.state,'idle',key);
    boss.destroy();
  }
});
test('production boss melee waits for its displayed active frame even if the legacy clock jumps',()=>{
  const {scene,boss}=setup();boss.actor.config=bossSprite;
  scene.arcade={combat:{touches:()=>true,push(){},impact(){}}};
  boss.debugAttack('melee');scene.combatTime+=10000;
  for(let i=0;i<toFrames(BOSS.melee.windup);i++)boss.update(1/ARCADE.clock.fps);
  assert.equal(scene.hits.length,0);assert.equal(boss.state,'windup');
  boss.update(1/ARCADE.clock.fps);assert.equal(scene.hits.length,1);assert.equal(boss.state,'attack');
  for(let i=0;i<toFrames(BOSS.melee.duration);i++)boss.update(1/ARCADE.clock.fps);
  assert.equal(scene.hits.length,1);assert.equal(boss.state,'recovery');
});

test('Pico hits at most once, immobilizes only on real damage, and removes every mark',()=>{
  const {scene,boss,advance}=setup();boss.debugAttack('pico');
  const zone=boss.hazards.pico.zones[boss.hazards.pico.restricted];scene.player={x:zone.x,y:zone.y};
  advance(boss.attack.windup+50);
  assert.equal(scene.hits.length,1);assert.equal(scene.hurtUntil,scene.combatTime+600);
  advance(900);assert.equal(scene.hits.length,1);
  advance(100);assert.equal(boss.hazards.pico,null);assert.equal(boss.hazards.labels.length,0);
  const invulnerable=setup();invulnerable.boss.debugAttack('pico');
  invulnerable.scene.invulnerableUntil=10000;
  const target=invulnerable.boss.hazards.pico.zones[invulnerable.boss.hazards.pico.restricted];invulnerable.scene.player={x:target.x,y:target.y};
  invulnerable.advance(2100);assert.equal(invulnerable.scene.hits.length,0);assert.equal(invulnerable.scene.hurtUntil,0);
});

test('every movement profile can leave a restriction even at maximum paper slow',()=>{
  const floor={left:65,right:895,top:410,bottom:500};
  for(const {speed:baseSpeed} of Object.values(characters)) for(let x=65;x<=895;x+=15) for(const y of [410,450,500]) {
    const speed=baseSpeed*slowMultiplier(3),plan=picoPlan(floor,{x,y},speed);
    const zone=plan.zones[plan.restricted];
    const horizontal=Math.min(...[zone.x-zone.w/2-20,zone.x+zone.w/2+20].filter(exit=>exit>=floor.left&&exit<=floor.right).map(exit=>Math.abs(exit-x)/speed));
    const vertical=Math.max(0,y-(floor.top+18))/(speed*.65);
    assert.ok(Math.min(horizontal,vertical)*1000+1100<plan.windup);
    assert.ok(plan.zones.filter((_,i)=>i!==plan.restricted).length===5);
  }
});

test('works preserve the upper corridor, never appear under an unmarked player, and stomp destroys several',()=>{
  const {scene,boss,advance}=setup();boss.debugAttack('works');advance(1200);
  assert.ok(boss.hazards.works.every(work=>work.y-work.h/2>scene.floor.top+32));
  for(let x=65;x<=895;x+=5)assert.ok(boss.hazards.blockers.every(rect=>!inRect({x,y:scene.floor.top+18},rect,16)));
  const [cone,fence]=boss.hazards.works.filter(work=>work.kind!=='hole');
  scene.player={x:(cone.x+fence.x)/2,y:cone.y};
  // A real Gymbro stomp catches a cone and a fence on opposite sides.
  const stomp={...characters.gymbro.attacks.stomp,facing:1};
  boss.hazards.hitObstacles(stomp);assert.equal(cone.active,false);assert.equal(fence.active,false,'the stronger stomp breaks the fence at once');
  const under=workSites(scene.floor,{x:0,y:410})[0];
  const sites=workSites(scene.floor,{x:under.x,y:488});assert.ok(sites.every(site=>Math.abs(site.x-under.x)>60));
});

test('repeated roadworks retire old hazards and bound decorative remains',()=>{
  const {scene,boss}=setup();const hazards=boss.hazards;
  const retired=[];
  for(let i=0;i<12;i++) {
    hazards.prepare('works',180);hazards.activate('works',boss);
    if(i===0)retired.push(...hazards.works);
    assert.ok(hazards.works.length<=BOSS.works.limit);assert.ok(hazards.remains.length<=6);
    assert.ok(hazards.blockers.every(rect=>!inRect({x:rect.x,y:scene.floor.top+18},rect,16)));
  }
  assert.ok(retired.every(work=>!work.active&&work.sprite.destroyed));
  const plan=picoPlan(scene.floor,{x:400,y:480},110,hazards.blockers);
  const restricted=plan.zones[plan.restricted];
  assert.ok(hazards.blockers.every(rect=>Math.abs(rect.x-restricted.x)>=(rect.w+restricted.w)/2 || Math.abs(rect.y-restricted.y)>=(rect.h+restricted.h)/2));
});

test('hole damage requires entry and individual cooldown; remaining inside never ticks every frame',()=>{
  const {scene,boss,advance}=setup();boss.debugAttack('works');advance(1200);
  const hole=boss.hazards.works.find(w=>w.kind==='hole');scene.player={x:hole.x,y:hole.y};
  advance(50);assert.equal(scene.hits.length,1);
  advance(2200);assert.equal(scene.hits.length,1);
  scene.player.x+=100;advance(50);scene.player.x=hole.x;advance(50);assert.equal(scene.hits.length,2);
});

test('vehicles and forms use swept footprints; vehicles recycle and cannot hit twice',()=>{
  assert.equal(sweptFootprint(-100,1000,485,{x:400,y:485},105,24),true);
  assert.equal(sweptFootprint(-100,1000,485,{x:400,y:430},105,24),false);
  const {scene,boss,advance}=setup();boss.debugAttack('traffic');boss.hazards.plan.barrier=false;
  const longestVehicle=Math.max(...Object.values(BOSS.traffic.vehicles).map(vehicle=>vehicle.width));
  const exitTime=(960+longestVehicle+100)/BOSS.traffic.speed*1000;
  scene.player={x:400,y:485};advance(boss.attack.windup+exitTime);
  assert.equal(scene.hits.length,1);assert.equal(boss.hazards.vehicles.length,0);assert.equal(boss.hazards.vehiclePool.length,1);
});

test('barrier parks with an alternative route and leaves; swept collision stops a dash crossing a fence',()=>{
  const {scene,boss,advance}=setup();boss.debugAttack('traffic');boss.hazards.plan.barrier=true;
  scene.player.y=428;advance(boss.attack.windup+1800);
  const vehicle=boss.hazards.vehicles[0];assert.equal(vehicle.parked,true);assert.ok(vehicle.y-vehicle.h/2>scene.floor.top+32);
  advance(BOSS.traffic.barrierDuration+2500);assert.equal(boss.hazards.vehicles.length,0);
  boss.debugAttack('works');advance(1200);
  const fence=boss.hazards.works.find(w=>w.kind==='fence');
  const previous={x:fence.x-100,y:fence.y};scene.player={x:fence.x+100,y:fence.y};
  boss.hazards.resolveMovement(previous);assert.ok(scene.player.x<fence.x-fence.w/2);
});

test('papers cap at three, slow no more than 40%, shake off with attack presses and expire',()=>{
  const {scene,boss}=setup();
  for(let i=0;i<5;i++)boss.status.add();assert.equal(boss.status.stacks.length,3);assert.ok(boss.status.speedMultiplier>=.6);
  for(let i=0;i<BOSS.paper.shakePresses;i++)boss.status.shake();assert.equal(boss.status.stacks.length,2);
  scene.combatTime=BOSS.paper.lifetime;boss.status.update();assert.equal(boss.status.stacks.length,0);assert.equal(boss.status.speedMultiplier,1);
});

test('rain keeps instant arcade movement, expires, and front guard permits attacks from behind',()=>{
  const {scene,boss,advance,strike}=setup();boss.debugAttack('rain');advance(1200);
  const first=boss.weather.movement(1,0,180,.05,true);assert.equal(first.x,180*.05);
  const coast=boss.weather.movement(0,0,180,.01,true);assert.equal(coast.x,0);
  strike();assert.equal(boss.hp,BOSS.hp);strike(10,true);assert.equal(boss.hp,BOSS.hp-10);
  advance(850);strike();assert.equal(boss.hp,BOSS.hp-20);
  scene.combatTime=boss.weather.until;boss.weather.update(0);
  assert.equal(boss.weather.active,false);assert.deepEqual(boss.weather.movement(1,0,180,.05,true),{x:9,y:0});
});

test('shield blocks without reflection, then offers its full counterattack window',()=>{
  const {scene,boss,advance,strike}=setup();boss.debugAttack('shield');advance(850);
  strike(100);assert.equal(boss.hp,BOSS.hp);assert.equal(scene.health,100);
  advance(2500);assert.equal(boss.state,'recovery');strike(20);assert.equal(boss.hp,BOSS.hp-20);
  advance(1450);assert.equal(boss.state,'recovery');advance(50);assert.equal(boss.state,'windup');assert.equal(boss.attack.key,'melee');
});

test('phase boundaries pause hazards without damage; no repeat or unsafe selection is eligible',()=>{
  assert.equal(phaseFor(900),1);assert.equal(phaseFor(630),2);assert.equal(phaseFor(315),2);assert.equal(phaseFor(314),3);
  const {scene,boss,advance,strike}=setup();boss.debugAttack('works');advance(1200);strike(280);
  assert.equal(boss.phase,2);assert.equal(boss.state,'transition');assert.equal(boss.hazards.works.length,0);assert.equal(scene.health,100);
  advance(1500);strike(310);assert.equal(boss.phase,3);assert.equal(boss.state,'transition');
  const options={phase:3,now:20000,readyAt:{},lastAttack:'shield',activeSystems:[],frozen:false,distance:300};
  for(let i=0;i<100;i++)assert.notEqual(availableAttacks({...options,random:()=>i/100}),'shield');
  assert.equal(availableAttacks({...options,activeSystems:['rain','works']}),null);
  assert.equal(availableAttacks({...options,activeSystems:['traffic']}),null);
  for(let i=0;i<100;i++)assert.notEqual(availableAttacks({...options,frozen:true,random:()=>i/100}),'traffic');
  const future=Object.fromEntries(Object.keys(BOSS.attacks).map(key=>[key,30000]));assert.equal(availableAttacks({...options,readyAt:future}),null);
});

test('repeated hits do not restart the boss rest forever',()=>{
  const {boss,advance,strike}=setup();advance(1800);const original=boss.until;
  for(let i=0;i<8;i++){strike(1);advance(200);}
  assert.ok(boss.until<=original+200);assert.ok(boss.hp<BOSS.hp);
});

test('pause freezes combat timers; death and teardown clear every effect and dangerous collision',()=>{
  const {scene,boss,advance,strike}=setup();boss.debugAttack('rain');advance(1200);boss.status.add();
  boss.hazards.plan={sites:[{x:500,y:488,kind:'fence'}]};boss.hazards.activate('works',boss);
  const before=boss.weather.until;boss.setPaused(true);
  assert.equal(scene.combatTime,1200);assert.equal(boss.weather.until,before);
  boss.setPaused(false);advance(850);strike(1000);
  assert.equal(boss.state,'defeat');assert.equal(boss.hazards.blockers.length,0);assert.equal(boss.weather.active,false);assert.equal(boss.status.stacks.length,0);
  const health=scene.health;advance(1300);assert.equal(boss.done,true);assert.equal(scene.health,health);
  boss.destroy();assert.equal(boss.guard.destroyed,true);assert.equal(boss.hazards.warning.destroyed,true);
});

test('player death cancels persistent effects and all spawns immediately',()=>{
  const {boss,advance}=setup();boss.debugAttack('paper');advance(1150);boss.weather.start();boss.status.add();
  assert.ok(boss.hazards.forms.length);boss.finish();
  assert.equal(boss.hazards.forms.length,0);assert.equal(boss.hazards.paperVolley,null);assert.equal(boss.weather.active,false);assert.equal(boss.status.stacks.length,0);
  advance(10000);assert.equal(boss.hazards.forms.length,0);
});

test('each actual character can reach, damage, phase and defeat Dormilón with existing attacks',()=>{
  for(const [name,character] of Object.entries(characters)) {
    const {scene,boss,advance}=setup(character.speed);advance(BOSS.entry);
    // Walk to the boss through the guaranteed clear lane, using that character's speed.
    scene.player.y=scene.floor.top+18;
    while(scene.player.x<boss.x-65) {scene.player.x+=character.speed*.05;advance(50);}
    let nextHit=0;
    for(let elapsed=0;elapsed<60000&&!boss.dead;elapsed+=50) {
      scene.player={x:boss.x-65,y:boss.y};
      if(scene.combatTime>=nextHit && scene.combatTime>=scene.hurtUntil) {
        const attack=name==='gymbro'?character.attacks.stomp:character.attacks.kick;
        boss.hit({...attack,facing:1});boss.hazards.hitObstacles({...attack,facing:1});
        nextHit=scene.combatTime+(attack.cooldown??attack.duration);
      }
      advance(50);
    }
    assert.equal(boss.hp,0,name);assert.equal(boss.phase,3,name);assert.ok(scene.health>0,name);
    advance(1300);assert.equal(boss.done,true,name);assert.equal(boss.hazards.activeSystems.length,0,name);
    boss.destroy();
  }
});

test('explicit boss atlas rectangles remain within each original asset and animation frames exist',()=>{
  assert.equal(bossSprite.frameRects.length,36);
  for(const rect of bossSprite.frameRects) {
    assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=1024&&rect.y+rect.height<=1536);
    assert.ok(rect.anchor>=rect.x&&rect.anchor<=rect.x+rect.width);
  }
  for(const frames of Object.values(bossSprite.animations))for(const index of frames)assert.ok(bossSprite.frameRects[index]);
  for(const [x,y,w,h] of Object.values(bossEffects.frames))assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);
});

test('Dormilón chases horizontally and between lanes during rest and stays still during recovery',()=>{
  const {scene,boss,advance}=setup();scene.player={x:200,y:500};
  const start={x:boss.x,y:boss.y};advance(BOSS.entry+1000);
  assert.ok(boss.x<start.x-100);assert.ok(boss.y>start.y);assert.equal(boss.facing,-1);
  scene.player={x:890,y:410};const before=boss.x;advance(100);
  assert.ok(boss.x>before);assert.equal(boss.facing,1);
  boss.debugAttack('paper');advance(BOSS.attacks.paper.windup+BOSS.attacks.paper.duration);
  const resting={x:boss.x,y:boss.y};advance(500);assert.deepEqual({x:boss.x,y:boss.y},resting);
});

test('nearby player triggers a telegraphed punch, one impact and a counterattack recovery',()=>{
  const {scene,boss,advance}=setup();scene.player={x:boss.x-60,y:boss.y};
  advance(BOSS.entry);assert.equal(boss.attack.key,'melee');assert.equal(scene.hits.length,0);
  advance(BOSS.melee.windup-1);assert.equal(scene.hits.length,0);
  advance(1);assert.equal(scene.hits.length,1);assert.equal(scene.hits[0].damage,BOSS.melee.damage);
  advance(BOSS.melee.duration);assert.equal(boss.state,'recovery');
  advance(BOSS.melee.recovery-50);assert.equal(scene.hits.length,1);assert.equal(boss.state,'recovery');
  advance(550);assert.notEqual(boss.attack?.key,'melee');
});

test('punch can be evaded by leaving the lane, jumping or using existing invulnerability',()=>{
  for(const evade of [scene=>scene.player.y+=40,scene=>scene.jumpHeight=60,scene=>scene.invulnerableUntil=10000]) {
    const {scene,boss,advance}=setup();scene.player={x:boss.x-60,y:boss.y};advance(BOSS.entry);
    assert.equal(boss.attack.key,'melee');evade(scene);advance(BOSS.melee.windup+50);assert.equal(scene.hits.length,0);
  }
});

test('scene teardown never redraws status text after Phaser releases its texture',()=>{
  const {boss}=setup();
  boss.status.label.setText=()=>{throw new Error('released canvas');};
  assert.doesNotThrow(()=>boss.destroy());
});

test('incoming iPhone respects Vuelva mañana and umbrella facing even after Gomelo changes sides',()=>{
  const {scene,boss,advance}=setup();boss.debugAttack('shield');advance(BOSS.attacks.shield.windup);
  scene.player={x:100,y:500};
  const phone={type:'iphone',projectile:'iphone',damage:54,range:672,facing:1,knockback:24};
  boss.hit(phone,{x:boss.x-40,y:boss.y});assert.equal(boss.hp,BOSS.hp);
  assert.ok(boss.blockUntil>scene.combatTime);
  advance(BOSS.attacks.shield.duration);boss.hit(phone,{x:boss.x-40,y:boss.y});assert.equal(boss.hp,BOSS.hp-54);
  boss.debugAttack('rain');advance(BOSS.attacks.rain.windup);const hp=boss.hp;
  scene.player.x=boss.x+80;boss.hit(phone,{x:boss.x-40,y:boss.y});assert.equal(boss.hp,hp);
  scene.player.x=boss.x-80;boss.hit({...phone,facing:-1},{x:boss.x+40,y:boss.y});assert.equal(boss.hp,hp-54);
});
