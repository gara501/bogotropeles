import test from 'node:test';
import assert from 'node:assert/strict';
import {ReversaController,REVERSA} from '../src/actors/ReversaController.js';
import {Potatoes} from '../src/game/Potatoes.js';
class Visual {constructor(x=0,y=0){this.x=x;this.y=y;}destroy(){this.destroyed=true;}}
for(const name of ['setOrigin','setDisplaySize','setDepth','setScrollFactor','setScale','setVisible','setText','setFlipX','setFrame','setTexture','setAlpha','clear','lineStyle','strokeRect','fillStyle','fillRect','fillTriangle','strokeEllipse'])Visual.prototype[name]=function(...args){if(name==='setText')this.text=args[0];return this;};
Visual.prototype.setPosition=function(x,y){this.x=x;this.y=y;return this;};
function setup(){
 const sounds=[],hits=[],summons=[],a={x:650,y:460,z:0,hp:3000,config:{hp:3000,speed:90},sprite:new Visual(),shadow:new Visual(),healthBar:new Visual(),tell:new Visual()};
 const s={floor:{left:65,right:895,top:390,bottom:500},player:{x:400,y:470,z:0},enemies:[a],combatTime:1000,health:100,level:{damage:1},textures:{get:()=>({referenceHeight:160})},
 add:{image:(x,y)=>new Visual(x,y),sprite:(x,y)=>new Visual(x,y),ellipse:(x,y)=>new Visual(x,y),text:(x,y)=>new Visual(x,y),graphics:()=>new Visual()},sfx:{play:n=>sounds.push(n)},summonMinions:(owner,config)=>summons.push(config),hitPlayer:n=>{hits.push(n);return true;}};
 const r={scene:s,enemies:new Map(),diablitos:{},combat:{frozen:()=>false},player:{state:'walk',hurt(){this.state='hurt';}},clearInput(){}};r.potatoes=new Potatoes(r);
 const m={scene:s,runtime:r,actor:a,transition(n){this.state=n;},pose(n,p){this.poseIndex=p;},move(dx,dy){a.x+=dx;a.y+=dy;}};
 const c=new ReversaController(m);m.reversa=c;r.enemies.set(a,m);
 const step=(n=1)=>{for(let i=0;i<n;i++){s.combatTime+=1000/60;c.step();}};
 const ready=()=>{c.truckX=c.park.x;c.set('idle');a.invulnerableUntil=0;a.x=500;a.y=470;};
 const cab=()=>{ready();a.hp=1500;c.phaseCheck();step(91);};
 return {s,r,m,a,c,step,ready,cab,sounds,hits,summons};
}
test('truck reverses slowly into the exit, then driver descends with the DIAN line',()=>{
 const e=setup();e.step(179);assert.equal(e.c.mode,'entry');assert.equal(e.a.invulnerableUntil,Infinity);
 e.step();assert.equal(e.c.mode,'exit');assert.match(e.c.dialog.text,/DIAN/);e.step(66);assert.equal(e.c.mode,'idle');assert.equal(e.a.invulnerableUntil,0);
});
test('sack and shoulder warnings give 90 and 60 frames; a missed charge exposes the driver',()=>{
 const e=setup();e.ready();e.s.player.x=440;e.c.start('slam');e.step(89);assert.deepEqual(e.hits,[]);e.step();assert.deepEqual(e.hits,[28]);
 e.c.start('charge');const x=e.a.x;e.step(60);assert.equal(e.a.x,x);e.s.player.y=390;e.step(45);assert.equal(e.c.mode,'crash');assert.equal(e.hits.length,1);
});
test('interrupting coffee prevents healing and creates a puddle that trips the boss too; whistle summons only after its windup',()=>{
 const e=setup();e.ready();e.a.hp=2500;e.c.start('coffee');e.step(80);e.c.hurt();assert.equal(e.a.hp,2500);assert.equal(e.r.potatoes.patches.length,1);
 e.r.potatoes.update();assert.equal(e.c.mode,'fall');e.c.start('whistle');e.step(49);assert.equal(e.summons.length,0);e.c.hurt();e.step(2);assert.equal(e.summons.length,0);
 e.c.start('whistle');e.step(50);assert.equal(e.summons[0].variants,1);assert.deepEqual(e.summons[0].counts,[2]);
});
test('half health boards the cab permanently; engine blocks and eggs expose torso',()=>{
 const e=setup();e.cab();assert.equal(e.c.phase,2);assert.equal(e.c.mode,'cabIdle');assert.equal(e.a.config.hurtbox.halfWidth,250);
 assert.equal(e.c.damageFactor({x:e.c.front}),.08);assert.equal(e.c.damageFactor({x:e.c.truckX}),.12);
 e.c.start('eggs');e.step(30);assert.equal(e.c.damageFactor({x:e.c.truckX}),1);
 e.a.hp=2500;e.step();assert.equal(e.c.phase,2);
});
test('reverse has exactly three beeps before moving; horn stuns without dealing damage or pushing',()=>{
 const e=setup();e.cab();e.sounds.length=0;e.c.start('reverse');const x=e.c.truckX;e.step(90);assert.equal(e.sounds.filter(n=>n==='reverseBeep').length,3);assert.equal(e.c.truckX,x);e.step();assert.ok(e.c.truckX>x);
 e.c.start('horn');e.s.player.x=e.c.front-50;e.s.player.y=e.c.truckY;const px=e.s.player.x;e.step(48);assert.equal(e.hits.length,0);assert.equal(e.r.player.state,'hurt');assert.equal(e.s.player.x,px);
});
test('eggs and exhaust target previous position; lowered platform releases players and death clears hazards without an explosion',()=>{
 const e=setup();e.cab();e.c.start('exhaust');const target={...e.c.exhaustTarget};e.s.player.x+=140;e.step(60);assert.equal(e.c.clouds[0].x,target.x);
 e.c.start('eggs');const eggTarget={...e.c.eggTarget};e.s.player.x-=200;e.step(60);assert.equal(e.c.eggs[0].x,eggTarget.x);e.step(55);assert.ok(e.r.potatoes.patches.length);
 e.c.start('platform');e.s.player.x=e.c.rear;e.s.player.y=e.c.truckY+20;e.step(30);assert.equal(e.s.player.z,24);e.s.player.x-=120;e.step();assert.equal(e.s.player.z,0);
 e.a.hp=0;e.c.hurt();assert.equal(e.c.mode,'dead');assert.match(e.c.dialog.text,/cancelado/);assert.equal(e.c.clouds.length,0);assert.ok(e.sounds.includes('reversaHornDie'));
 e.c.destroy();assert.ok(e.c.truck.destroyed);
});
test('solid truck footprint prevents walking, dashing or landing inside the truck',()=>{
 const e=setup();e.ready();e.s.player.x=e.c.truckX;e.s.player.y=e.c.truckY;e.c.resolveMovement({x:e.s.player.x,y:500});assert.equal(e.s.player.y,e.c.truckY+19);
});

test('cab tutorial, visible damage and two-second green openings explain the shield',()=>{
 const e=setup();e.cab();e.step(56);assert.equal(e.c.mode,'eggs','first cab attack demonstrates the opening');
 e.step(REVERSA.windowStart);assert.equal(e.c.windowOpen,true);assert.match(e.c.guide.text,/AHORA/);
 e.c.hitFeedback({x:e.c.front},3,.08);e.c.render();assert.match(e.c.hitLabel.text,/BLINDADO.*-3/);
 e.c.hitFeedback({x:e.c.truckX},38,1);e.c.hurt({});e.c.render();assert.equal(e.c.hitLabel.text,'-38');assert.equal(e.c.doorOpen,true);assert.equal(e.c.mode,'open');
 e.step(119);assert.equal(e.c.doorOpen,true);e.step();assert.equal(e.c.doorOpen,false);
 e.c.start('eggs');e.step(REVERSA.windowEnd);assert.equal(e.c.windowOpen,true);e.step();assert.equal(e.c.windowOpen,false);assert.match(e.c.guide.text,/BLINDADO/);
 e.c.defeat();e.c.render();e.c.destroy();assert.equal(e.c.guide.destroyed,true);assert.equal(e.c.hitLabel.destroyed,true);
});

test('truck can be reached by normal punches from engine, side and rear while aligned with the floor marker',async()=>{
 const {CombatSystem}=await import('../src/combat/CombatSystem.js');const e=setup();e.cab();e.step();const combat=new CombatSystem(e.s);
 for(const [x,facing] of [[e.c.front-15,1],[e.c.truckX-35,1],[e.c.rear+15,-1]]){
  const p={x,y:e.c.truckY+32,z:0};assert.equal(combat.touches(p,e.a,{range:95,facing}),true);
 }
 assert.equal(combat.touches({x:e.c.truckX,y:e.c.truckY+90,z:0},e.a,{range:95,facing:1}),false);
});
