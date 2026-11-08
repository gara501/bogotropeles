import test from 'node:test';
import assert from 'node:assert/strict';
import {HAZARDS,insideHole,placeHoles,pushOut,taxiSweeps} from '../src/stage/hazardRules.js';
import {StageHazards} from '../src/stage/StageHazards.js';
import {LEVEL_HAZARDS} from '../src/data/campaign.js';
import {POTHOLE_SPLASH_MS,MANHOLE_SPLASH_MS} from '../src/stage/hazardSprites.js';

const layout={arenas:3,advance:720};
const floor={top:400,bottom:500,left:65,right:895};
const fakeScene=()=>{
  const s={floor:{...floor},player:{x:200,y:450,z:0},enemies:[],health:100,score:0,hits:[],playerHits:[],level:{damage:1},
    addScore(p){this.score+=p;},
    hitEnemy(e,attack){this.hits.push({e,attack});if(!e.shielded)e.hp=Math.max(0,e.hp-attack.damage);},
    hitPlayer(d){this.playerHits.push(d);this.health-=d;return true;}};
  return s;
};

test('holes are placed by arena and floor fraction and only inside the level',()=>{
  const holes=placeHoles([{kind:'manhole',arena:1,x:.5,y:.5},{kind:'pothole',arena:9,x:.5,y:.5},{kind:'nope',arena:0,x:0,y:0}],layout,floor);
  assert.equal(holes.length,1);assert.deepEqual([holes[0].x,holes[0].y],[720+480,450]);
});
test('pushOut moves a point onto the padded rim and leaves outside points alone',()=>{
  const h={x:100,y:100,rx:30,ry:10,pad:8};
  const p=pushOut(h,110,102);assert.ok(!insideHole(h,p.x,p.y,h.pad-.01),'now outside');
  assert.deepEqual(pushOut(h,300,100),{x:300,y:100});
});
test('taxi sweeps bodies in its lane only, on the ground',()=>{
  assert.equal(taxiSweeps(100,140,450,{x:120,y:455},0),true);
  assert.equal(taxiSweeps(100,140,450,{x:120,y:450+HAZARDS.taxi.hitDepth},0),false);
  assert.equal(taxiSweeps(100,140,450,{x:120,y:450,z:60},0),false);
});
test('walkers slide around an open manhole; potholes only slow them',()=>{
  const s=fakeScene(),h=new StageHazards(s,{holes:[{kind:'manhole',arena:0,x:.5,y:.5},{kind:'pothole',arena:0,x:.2,y:.5}]},layout);
  const walker={x:480,y:450};h.resolve(walker);assert.ok(!insideHole(h.holes[0],walker.x,walker.y));
  assert.equal(h.speedFactor({x:h.holes[1].x,y:h.holes[1].y}),HAZARDS.hole.pothole.slow);assert.equal(h.speedFactor({x:700,y:450}),1);
});
test('a body landing in a manhole is defeated and pays the bonus; bosses are immune',()=>{
  const s=fakeScene(),h=new StageHazards(s,{holes:[{kind:'manhole',arena:0,x:.5,y:.5}]},layout);
  const enemy={x:482,y:451,hp:80,config:{}};
  assert.equal(h.landing(enemy),true);assert.equal(enemy.hp,0);assert.equal(s.score,HAZARDS.hole.manhole.points);
  assert.equal(enemy.sinking,true);assert.equal(s.hits[0].attack.super,true);
  const boss={x:480,y:450,hp:500,config:{boss:true}};assert.equal(h.landing(boss),false);assert.equal(boss.hp,500);
  const shielded={x:480,y:450,hp:50,config:{},shielded:true};assert.equal(h.landing(shielded),false);assert.equal(shielded.sinking,false);
});
test('a body landing in a pothole takes extra damage and keeps fighting',()=>{
  const s=fakeScene(),h=new StageHazards(s,{holes:[{kind:'pothole',arena:0,x:.5,y:.5}]},layout);
  const enemy={x:480,y:450,hp:100,config:{}};
  assert.equal(h.landing(enemy),false);assert.equal(enemy.hp,100-HAZARDS.hole.pothole.damage);
});
test('a knocked-down player in a hole takes the extra damage once and ends up on the rim',()=>{
  const s=fakeScene(),h=new StageHazards(s,{holes:[{kind:'manhole',arena:0,x:.5,y:.5}]},layout);
  s.player.x=480;s.player.y=450;
  assert.equal(h.playerDown(s.player),true);assert.deepEqual(s.playerHits,[HAZARDS.hole.manhole.playerDamage]);
  assert.equal(h.playerDown(s.player),false,'already out');
});
test('the taxi waits for a fight, then warns, crosses and hits an enemy in its lane',()=>{
  const s=fakeScene(),h=new StageHazards(s,{taxi:{first:100,warn:50,aimChance:1}},layout,()=>0);
  s.add={rectangle:()=>({setScrollFactor(){return this;},setDepth(){return this;},setOrigin(){return this;},setAlpha(){},destroy(){}}),
    text:()=>({setOrigin(){return this;},setScrollFactor(){return this;},setDepth(){return this;},destroy(){}})};
  for(let i=0;i<20;i++)h.update();assert.equal(h.warning,null,'no enemies: no taxi');
  const enemy={x:300,y:450,hp:100,config:{}};s.enemies=[enemy];
  let guard=0;while(!h.car && guard++<60)h.update();
  assert.ok(h.car,'launched');assert.equal(h.car.y,450,'aimed at the player lane');
  guard=0;while(h.car && guard++<200)h.update();
  assert.ok(s.hits.some(hit=>hit.e===enemy && hit.attack.knockdown),'the enemy was run over');
  assert.ok(s.playerHits.length,'the player in the same lane too');
});
test('hazard levels reference real hole kinds',()=>{
  for(const config of Object.values(LEVEL_HAZARDS))for(const hole of config.holes??[])assert.ok(HAZARDS.hole[hole.kind]);
});

test('holes use floor sprites, separate lid/cone, and splash returns to the same wet frame without moving',()=>{
  const s=fakeScene(),sprites=[];s.level.rain={};s.textures={exists:()=>true};
  s.add={graphics(){throw new Error('Floor hazards must use sprites');},image(x,y,key,frame){
    const v={x,y,key,frame,setOrigin(x,y){this.origin=[x,y];return this;},setScale(n){this.scale=n;return this;},setDepth(n){this.depth=n;return this;},setFrame(n){this.frame=n;return this;},destroy(){this.destroyed=true;}};
    sprites.push(v);return v;
  }};
  const h=new StageHazards(s,{holes:[{kind:'pothole',arena:0,x:.5,y:.5},{kind:'manhole',arena:1,x:.5,y:.5}]},layout);
  assert.equal(sprites.length,4);assert.deepEqual(sprites.map(v=>v.key),['street-pothole','street-manhole','street-manhole','street-manhole']);
  const sprite=sprites[0];assert.equal(sprite.frame,1);assert.equal(sprite.scale,.5);assert.equal(sprite.depth,1.5);
  assert.deepEqual([sprites[1].x,sprites[1].y],[1200,450],'hole stays in world space in the next arena');
  assert.deepEqual(sprites.slice(2).map(v=>v.frame),[2,3],'detached lid and warning cone');
  const enemy={x:480,y:450,hp:100,config:{}};h.landing(enemy);assert.equal(sprite.frame,2);
  s.paused=true;for(let i=0;i<30;i++)h.update();assert.equal(sprite.frame,2,'pause freezes the splash');
  s.paused=false;s.cinematic=true;h.update();assert.equal(h.visualClock,0);
  s.cinematic=false;for(let i=0;i<Math.ceil(POTHOLE_SPLASH_MS/(1000/60));i++)h.update();
  assert.equal(sprite.frame,1);assert.equal(sprite.depth,1.5);assert.deepEqual([sprite.x,sprite.y],[480,450]);
  assert.equal(s.hits.length,1,'changing art does not repeat the hit');
  const shaft=sprites[1],falling={x:1200,y:450,hp:100,config:{}};
  assert.equal(h.landing(falling),true);assert.equal(shaft.frame,1,'falling into the shaft shows the dark splash');
  const points=s.score;for(let i=0;i<Math.ceil(MANHOLE_SPLASH_MS/(1000/60));i++)h.update();
  assert.equal(shaft.frame,0);assert.equal(s.score,points,'effect does not repeat the fall bonus');
  const shielded={x:1200,y:450,hp:100,config:{},shielded:true};
  assert.equal(h.landing(shielded),false);assert.equal(shaft.frame,0,'refused fall does not show impact');
  s.level.rain=null;h.draw();assert.ok(sprites.slice(0,4).every(v=>v.destroyed));assert.equal(sprites[4].frame,0,'dry level uses dry hole');
  h.destroy();assert.ok(sprites.every(v=>v.destroyed));
});
