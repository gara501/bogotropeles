import test from 'node:test';
import assert from 'node:assert/strict';
import {Panela} from '../src/game/Panela.js';
import {PANELA,handItemFor,panelaTouches} from '../src/game/panelaRules.js';
import {CAMPAIGN} from '../src/data/campaign.js';
import {Player} from '../src/actors/Player.js';

function fixture(){
  const visuals=[],sounds=[];
  const make=()=>{
    const proxy=new Proxy({visible:true,alpha:1,x:200,destroyed:false,
      destroy(){this.destroyed=true;},setVisible(v){this.visible=v;return this;},
      setTexture(k,f){this.key=k;this.frame=f;return this;},setFrame(f){this.frame=f;return this;},
      setScale(v){this.scale=v;return this;},setFlipX(v){this.flipX=v;return this;}},
      {get:(target,key)=>key in target?target[key]:()=>proxy});visuals.push(proxy);return proxy;
  };
  const s={characterKey:'office',character:{height:106,idle:0,texture:'office',special:'special',animations:{punch:[0,1,2]},
    attacks:{punch:{damage:30,range:80,duration:210,hitAt:90}}},
    player:{x:200,y:450,z:0,sprite:make()},floor:{left:65,right:895,top:400,bottom:500},facing:1,health:100,combatTime:0,enemies:[],
    add:{image:make,text:make,graphics:make},textures:{exists:()=>true,get:()=>({referenceHeight:300})},
    sfx:{play:n=>sounds.push(n)},hitEnemy(e,a){e.hp-=a.damage;},specialReadyAt:0,
  };
  s.arcade={scene:s,frame:0,input:{dx:0,dy:0},combat:{impact(){},touches:()=>true}};
  s.arcade.player=new Player(s.arcade);s.panela=new Panela(s,()=>1);s.panela.rolled.add(0);
  const step=(count=1)=>{for(let i=0;i<count;i++){s.arcade.frame++;s.panela.update(s.arcade.frame);}};
  const launch=()=>{s.panela.equip();s.arcade.player.begin('punch');s.arcade.player.contact(s.arcade.player.action);};
  return {s,item:s.panela,model:s.arcade.player,step,launch,sounds,visuals};
}

test('vuvuzela stays exclusively in level 1; every later combat stage gets panela',()=>{
  for(const level of CAMPAIGN)assert.equal(handItemFor(level),level.total===0?null:level.combatIndex===0?'vuvuzela':'panela',level.name);
  assert.equal(handItemFor(null),null);assert.equal(handItemFor({mode:'ring',total:3}),null);
});
test('ground pickup equips a single panela, refuses refill and rejects hurt or airborne pickup',()=>{
  const {s,item,model,step}=fixture();item.spawn(200,450);s.player.z=30;step();assert.equal(item.remaining,0);
  s.player.z=0;model.state='hurt';step();assert.equal(item.remaining,0);
  model.state='walk';step();assert.equal(item.remaining,1);assert.equal(item.items.length,0);
  item.spawn(200,450);step();assert.equal(item.remaining,1);assert.equal(item.items.length,1);
});
test('armed H replaces the punch with a double-damage projectile and release pose matches contact',()=>{
  const {item,model,s}=fixture();item.equip();model.begin('punch');
  const d=model.action.data;
  assert.equal(d.damage,60);assert.equal(d.combo,false);assert.equal(d.projectile,true);
  assert.deepEqual(d.frames.filter(f=>f.phase==='active').map(f=>f.weaponPose),[7]);
  assert.ok(d.frames.filter(f=>f.phase==='startup').every(f=>[5,6].includes(f.weaponPose)));
  assert.equal(s.enemies.length,0);assert.equal(item.remaining,1);
  model.transition('hurt');assert.equal(item.remaining,1,'interrupted windup keeps the panela');
});
test('one release consumes one panela, performs no melee hit, and the first impact breaks it once',()=>{
  const {s,item,model,step,launch,sounds}=fixture();
  s.enemies=[{x:320,y:450,hp:200},{x:380,y:450,hp:200}];launch();
  model.contact(model.action);assert.equal(item.remaining,0);assert.equal(item.shots.length,1);
  assert.deepEqual(s.enemies.map(e=>e.hp),[200,200]);
  step(30);assert.deepEqual(s.enemies.map(e=>e.hp),[140,200]);assert.equal(item.shots.length,0);
  assert.equal(sounds.filter(n=>n==='metalCrack').length,1);
  model.transition('walk');model.begin('punch');assert.equal(s.playerAttack.damage,30);
});
test('both directions hit the nearest target despite enemy list ordering',()=>{
  for(const dir of [1,-1]){
    const {s,launch,step}=fixture();s.player.x=480;s.facing=dir;
    const near={x:480+dir*60,y:450,hp:100},far={x:480+dir*110,y:450,hp:100};
    s.enemies=[far,near];launch();step(20);assert.equal(near.hp,40);assert.equal(far.hp,100);
  }
});
test('changing lane and jumping avoid the projectile; missed throws expire and shatter',()=>{
  const {s,item,launch,step}=fixture();
  s.enemies=[{x:400,y:490,hp:100},{x:500,y:450,z:40,hp:100}];launch();step(100);
  assert.deepEqual(s.enemies.map(e=>e.hp),[100,100]);assert.equal(item.shots.length,0);assert.equal(item.bursts.length,0);
  assert.equal(panelaTouches(100,800,{y:450},{x:400,y:450,hp:100}),true,'swept hit works across a skipped position');
});
test('break effect advances through crack, chunks and crumbs, then disposes itself',()=>{
  const {s,item,launch,step}=fixture();s.enemies=[{x:260,y:450,hp:100}];launch();step(2);
  assert.equal(item.bursts.length,1);const burst=item.bursts[0],seen=new Set();
  for(let i=0;i<PANELA.breakFrames;i++){if(!burst.sprite.destroyed)seen.add(burst.sprite.frame);step();}
  assert.deepEqual([...seen],['crack','break1','break2','crumbs']);assert.equal(burst.sprite.destroyed,true);
});
test('pause freezes flights and death clears held, shots and fragments',()=>{
  const {s,item,launch,step}=fixture();launch();const x=item.shots[0].x;
  s.paused=true;step(20);assert.equal(item.shots[0].x,x);s.paused=false;
  s.health=0;step();assert.equal(item.shots.length,0);assert.equal(item.remaining,0);
  assert.equal(s.player.sprite.visible,true);
});
test('all five fighters show held walking and throwing art; hurt restores normal body',()=>{
  for(const key of ['office','student','teleperforman','gymbro','magolita']){
    const {s,item,model}=fixture();s.characterKey=key;item.equip();item.render();
    assert.equal(item.held.key,`${key}-panela`);assert.equal(item.held.frame,0);assert.equal(s.player.sprite.visible,false);
    s.arcade.input.dx=1;model.age=6;item.render();assert.equal(item.held.frame,2);
    model.begin('punch');model.action.displayedFrame=model.action.data.frames.find(f=>f.phase==='active');item.render();
    assert.equal(item.held.frame,7);s.facing=-1;item.render();assert.equal(item.held.flipX,true);
    model.transition('hurt');item.render();assert.equal(item.held.visible,false);assert.equal(s.player.sprite.visible,true);
  }
});
test('shutdown disposes pickups, armed body, label, shots and fragments',()=>{
  const {item,launch,visuals}=fixture();item.spawn(600,450);launch();item.destroy();
  assert.equal(item.items.length,0);assert.equal(item.shots.length,0);
  assert.ok(visuals.slice(1).every(v=>v.destroyed));
});
