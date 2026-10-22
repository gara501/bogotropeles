import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {EventEmitter} from 'node:events';
import {ChivaBonusRound,CHIVA_BONUS,shouldStartChivaBonus} from '../src/bonus/chivaRules.js';
import {RunState} from '../src/game/RunState.js';
import {ARCADE} from '../src/data/arcade.js';
import {Player} from '../src/actors/Player.js';
import {CombatSystem} from '../src/combat/CombatSystem.js';

const hooks=registerHooks({load(url,context,nextLoad){
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  return nextLoad(url,context);
}});
const {ChivaBonus}=await import('../src/bonus/ChivaBonus.js');hooks.deregister();

function fixture(){
  const visual=()=>{const v=new Proxy({visible:true,frame:0,destroyed:false,
    setFrame(value){this.frame=value;return this;},setVisible(value){this.visible=value;return this;},
    setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(value){this.depth=value;return this;},
    setText(value){this.text=value;return this;},destroy(){this.destroyed=true;}},
    {get:(target,key)=>key in target?target[key]:(()=>v)});return v;};
  const s={add:{graphics:visual,image:visual,text:visual,ellipse:visual,rectangle:visual},
    textures:{get:()=>({referenceHeight:337,get:()=>({width:210})})},
    health:100,paused:false,finished:false,floor:{left:65,right:895,top:400,bottom:500},player:{x:300,y:450,facing:1},facing:1,run:new RunState(),character:{name:'GOMELO'},
    sfx:{play(){}},music:{stop(){}},game:{events:new EventEmitter()},
    arcade:{clearInput(){},player:{transition(){}},combat:{touches:()=>true,impact(){}}},
    addScore(points){this.run.award(points);}};
  const bonus=new ChivaBonus(s);s.chivaBonus=bonus;
  const tick=(count=1)=>{for(let i=0;i<count;i++){bonus.tick();bonus.update(i);}};
  return {s,bonus,tick};
}

test('countdown does not consume the 30-second attempt or accept early hits',()=>{
  const round=new ChivaBonusRound();round.step(2999);assert.equal(round.hit(),false);
  assert.equal(round.remainingMs,30000);round.step(1);assert.equal(round.state,'playing');
  assert.equal(round.hit(),true);assert.equal(round.hits,1);
});

test('destroying the chiva pays exactly 5000, not hit points plus 5000',()=>{
  const round=new ChivaBonusRound();round.step(3000);
  for(let i=0;i<50;i++)assert.equal(round.hit(),true);
  assert.equal(round.state,'won');assert.equal(round.points,5000);assert.equal(round.damageFrame,9);
  assert.equal(round.hit(),false);round.step(60000);assert.equal(round.hits,50);assert.equal(round.points,5000);
});

test('expiry pays 100 per connected hit and rejects the exact-deadline final hit',()=>{
  const round=new ChivaBonusRound();round.step(3000);
  for(let i=0;i<49;i++)round.hit();round.step(29999);assert.equal(round.state,'playing');
  round.step(1);assert.equal(round.state,'timeout');assert.equal(round.hit(),false);
  assert.equal(round.points,4900);assert.equal(round.hits,49);
  const empty=new ChivaBonusRound();empty.step(3000);empty.step(30000);assert.equal(empty.points,0);
});

test('the fixed clock reaches the 30-second deadline without an extra frame',()=>{
  const round=new ChivaBonusRound();for(let i=0;i<180;i++)round.step(ARCADE.clock.stepMs);
  assert.equal(round.state,'playing');for(let i=0;i<1800;i++)round.step(ARCADE.clock.stepMs);
  assert.equal(round.state,'timeout');assert.equal(round.remainingMs,0);
});

test('one melee action can hit once; pause blocks hits and freezes timer and visual time',()=>{
  const {s,bonus,tick}=fixture();tick(180);const targets=new Set();
  bonus.contact(s.player,{},targets);bonus.contact(s.player,{},targets);
  assert.equal(bonus.round.hits,1);assert.equal(bonus.target.hp,49);
  s.paused=true;const time=bonus.round.remainingMs,age=bonus.age;
  tick(120);assert.equal(bonus.hit(bonus.target),false);assert.equal(bonus.round.remainingMs,time);assert.equal(bonus.age,age);
});

test('all eight spectators dance through four frames before the first valid hit',()=>{
  const {bonus,tick}=fixture();assert.equal(bonus.crowd.length,8);
  assert.equal(bonus.hit(bonus.target),false);assert.equal(bonus.scaredAt,null);
  const poses=bonus.crowd.map(()=>new Set());
  for(let i=0;i<120;i++){tick();bonus.crowd.forEach((p,index)=>poses[index].add(p.image.frame));}
  for(const frames of poses)assert.deepEqual([...frames].sort(),[0,1,2,3]);
  assert.ok(new Set(bonus.crowd.map(p=>p.image.frame)).size>1,'the crowd does not dance in lockstep');
});

test('the first connected hit changes dancing into frightened animation, stays frightened and pauses cleanly',()=>{
  const {s,bonus,tick}=fixture();tick(180);bonus.hit(bonus.target);const scaredAt=bonus.scaredAt;
  bonus.update(0);assert.equal(bonus.crowd[0].image.frame,4);
  tick(20);assert.ok(bonus.crowd.every(p=>p.image.frame>=4));
  const frames=bonus.crowd.map(()=>new Set());
  for(let i=0;i<50;i++){tick();bonus.crowd.forEach((p,index)=>frames[index].add(p.image.frame));}
  for(const poses of frames)assert.deepEqual([...poses].sort(),[4,5,6,7]);
  bonus.hit(bonus.target);assert.equal(bonus.scaredAt,scaredAt,'later hits do not restart the reaction');
  s.paused=true;const age=bonus.age,pausedFrames=bonus.crowd.map(p=>p.image.frame);tick(120);
  assert.equal(bonus.age,age);assert.deepEqual(bonus.crowd.map(p=>p.image.frame),pausedFrames);
  s.paused=false;tick();assert.ok(bonus.age>age);
  for(let i=bonus.round.hits;i<50;i++)bonus.hit(bonus.target);tick(250);
  assert.ok(bonus.crowd.every(p=>p.image.frame>=4),'spectators remain frightened around the wreck');
  assert.equal(fixture().bonus.scaredAt,null,'a fresh attempt starts with dancing again');
});

test('success awards once, keeps lives and health, brings Coste in and plays his cry before results',()=>{
  const {s,bonus,tick}=fixture();let result=null;s.game.events.on('bonus-complete',value=>result=value);
  s.run.award(2500);s.run.lives=2;tick(180);
  for(let i=0;i<50;i++)bonus.hit(bonus.target);tick();assert.equal(s.run.score,7500);
  assert.equal(bonus.coste.visible,false);tick(210);
  assert.equal(bonus.coste.visible,true);assert.equal(bonus.coste.x,800);assert.ok(bonus.coste.frame>=7);
  assert.equal(result,null);tick(220);
  assert.equal(s.finished,true);assert.equal(result.won,true);assert.equal(result.points,5000);
  assert.equal(s.run.lives,2);assert.equal(s.health,100);bonus.finish();assert.equal(s.run.score,7500);
});

test('timeout pays only connected hits, leaves Coste offscreen and does not lose a life',()=>{
  const {s,bonus,tick}=fixture();tick(180);for(let i=0;i<7;i++)bonus.hit(bonus.target);
  bonus.round.step(30000);tick(190);
  assert.equal(s.run.score,700);assert.equal(s.run.lives,3);assert.equal(s.health,100);
  assert.equal(bonus.coste.visible,false);assert.equal(bonus.ready,true);
  const target=bonus.target.sprite,coste=bonus.coste;bonus.destroy();
  assert.equal(target.destroyed,true);assert.equal(coste.destroyed,true);assert.equal(bonus.cans.length,0);
});

test('a new run resets bonus eligibility while continuing a run preserves it',()=>{
  const run=new RunState();run.chivaBonusPlayed=true;run.advance(CHIVA_BONUS.afterLevel+1);run.continue();
  assert.equal(run.chivaBonusPlayed,true);run.reset();assert.equal(run.chivaBonusPlayed,false);
});

test('bonus is inserted only after level 3 and before level 4, once per run',()=>{
  const run=new RunState();
  assert.equal(CHIVA_BONUS.afterLevel,2);
  assert.deepEqual([0,1,2,3,4,5,6].filter(next=>shouldStartChivaBonus(next,run)),[3]);
  run.chivaBonusPlayed=true;assert.equal(shouldStartChivaBonus(3,run),false);
});

test('Coste stays in front of every spectator and has clear space to kneel',()=>{
  const {bonus,tick}=fixture();tick(180);for(let i=0;i<50;i++)bonus.hit(bonus.target);tick(250);
  assert.equal(bonus.coste.visible,true);assert.equal(bonus.coste.x,800);
  for(const p of bonus.crowd){
    assert.ok(bonus.coste.depth>p.image.depth,'a spectator cannot draw over Coste');
    assert.ok(Math.abs(p.x-800)>=80 || p.y<390,'the kneeling area is not occupied by a spectator');
  }
});

test('the chiva and destruction smoke stay behind the player across the entire playable strip',()=>{
  const {s,bonus,tick}=fixture();tick(180);
  const checkLayers=()=>{
    for(const y of [s.floor.top,bonus.target.y,454,s.floor.bottom]){
      assert.ok(bonus.target.sprite.depth<y-1,'the vehicle is behind the player and shadow');
      assert.ok(bonus.smoke.depth<y,'destruction smoke cannot cover the player');
    }
    assert.ok(bonus.smoke.depth>bonus.target.sprite.depth);
    assert.ok(bonus.title.depth>s.floor.bottom);
  };
  checkLayers();for(let i=0;i<50;i++){bonus.hit(bonus.target);bonus.update(i);checkLayers();}
  tick(250);assert.equal(bonus.coste.visible,true);checkLayers();
});

test('the full-size vehicle blocks both sides, the front and swept attempts to cross the entire body',()=>{
  const {s,bonus}=fixture(),b=bonus.collisionBox;
  assert.ok(Math.abs(b.right-b.left-420)<1);assert.equal(b.bottom-b.top,205);
  const move=(from,to)=>{Object.assign(s.player,to);bonus.resolveMovement(from);};
  move({x:300,y:450},{x:850,y:450});assert.equal(s.player.x,b.left-ARCADE.body.halfWidth);
  move({x:850,y:450},{x:300,y:450});assert.equal(s.player.x,b.right+ARCADE.body.halfWidth);
  move({x:560,y:490},{x:560,y:400});assert.equal(s.player.y,b.bottom+ARCADE.body.halfDepth);
  // Diagonal input slides down the left edge, then allows walking around the front.
  const edge=b.left-ARCADE.body.halfWidth;
  move({x:edge,y:450},{x:edge+20,y:470});assert.equal(s.player.x,edge);assert.equal(s.player.y,470);
  move({x:edge,y:470},{x:edge+100,y:470});assert.equal(s.player.x,edge+100);
  move({x:560,y:490},{x:570,y:400});assert.equal(s.player.x,570);assert.equal(s.player.y,b.bottom+ARCADE.body.halfDepth);
});

test('walking, diagonal movement, dashing and jumping cannot move the player into the chiva',()=>{
  const {s,bonus}=fixture();s.character.speed=240;
  const player=new Player({scene:s,frame:0}),left=bonus.collisionBox.left-ARCADE.body.halfWidth;
  for(const z of [0,ARCADE.jump.height])for(const multiplier of [1,ARCADE.dash.speed/s.character.speed]){
    Object.assign(s.player,{x:300,y:450,z});
    for(let i=0;i<120;i++)player.move(1,0,multiplier);
    assert.equal(s.player.x,left);assert.equal(s.player.y,450);assert.equal(s.player.z,z);
  }
  Object.assign(s.player,{x:560,y:490,z:0});
  for(let i=0;i<120;i++)player.move(1,-1);
  assert.ok(s.player.y>=bonus.collisionBox.bottom+ARCADE.body.halfDepth || s.player.x>=bonus.collisionBox.right+ARCADE.body.halfWidth);
});

test('all accessible edges remain hittable from outside and recovery never places the player beyond the floor',()=>{
  const {s,bonus,tick}=fixture(),combat=new CombatSystem(s),b=bonus.collisionBox;
  tick(180);
  for(const [x,y,facing] of [[b.left-ARCADE.body.halfWidth,450,1],[b.right+ARCADE.body.halfWidth,450,-1],[560,b.bottom+ARCADE.body.halfDepth,1]]){
    Object.assign(s.player,{x,y});s.facing=facing;
    const attack={range:65,lane:ARCADE.body.lane,facing},targets=new Set();
    s.arcade.combat.touches=(...args)=>combat.touches(...args);
    assert.equal(combat.touches(s.player,bonus.target,attack),true);
    const before=bonus.round.hits;bonus.contact(s.player,attack,targets);bonus.contact(s.player,attack,targets);
    assert.equal(bonus.round.hits,before+1);
  }
  Object.assign(s.player,{x:560,y:410});bonus.resolveMovement();
  assert.equal(s.player.y,b.bottom+ARCADE.body.halfDepth);assert.ok(s.player.y<=s.floor.bottom);
  for(let i=bonus.round.hits;i<50;i++)bonus.hit(bonus.target);tick(250);
  Object.assign(s.player,{x:560,y:450});bonus.resolveMovement();
  assert.equal(s.player.y,b.bottom+ARCADE.body.halfDepth,'the wreck also remains solid');
});
