import test from 'node:test';
import assert from 'node:assert/strict';
import {StageRain} from '../src/stage/StageRain.js';
import {CAMPAIGN} from '../src/data/campaign.js';

class Visual {
  setDepth(value){this.depth=value;return this;}
  setScrollFactor(value){this.factor=value;return this;}
  setVisible(value){this.visible=value;return this;}
  setAlpha(value){this.alpha=value;return this;}
  clear(){this.lines=0;this.ellipses=0;return this;}
  lineStyle(){return this;}
  lineBetween(){this.lines++;return this;}
  strokeEllipse(){this.ellipses++;return this;}
  destroy(){this.destroyed=true;}
}
function setup(index=0,random=()=>.5){
  const scene={combatTime:1000,health:100,finished:false,player:{x:200,y:450},floor:{left:65,right:895,top:400,bottom:500},
    add:{rectangle:()=>new Visual(),graphics:()=>new Visual()}};
  const rain=new StageRain(scene,CAMPAIGN[index].rain,random);
  return {scene,rain};
}
function start(scene,rain){scene.combatTime=rain.triggerAt;rain.update(1/60);scene.combatTime+=1000;rain.update(1/60);}
function move(rain,actor,dx=0,dy=0,free=true){const previous={x:actor.x,y:actor.y};actor.x+=dx;actor.y+=dy;rain.slip(actor,previous,free);}

test('all levels except the indoor fourth stage schedule a new random shower independently of player position',()=>{
  assert.equal(CAMPAIGN[3].rain,undefined);
  for(const index of [0,1,2,4,5,6]){
    assert.deepEqual(CAMPAIGN[index].rain,{delay:[3000,60000],duration:20000});
    const starts=[0,.25,.5,.999].map(value=>{
      const {scene,rain}=setup(index,()=>value);
      assert.equal(rain.triggerAt,scene.combatTime+3000+value*57000);
      scene.player.x=5000;scene.combatTime=rain.triggerAt-1;rain.update(1/60);assert.equal(rain.active,false);
      scene.player.x=200;scene.combatTime=rain.triggerAt;rain.update(1/60);assert.equal(rain.active,true,'rain can begin in the first arena');
      return rain.triggerAt;
    });
    assert.equal(new Set(starts).size,4,'each attempt rolls its own start time');
  }
});

test('a random shower lasts exactly 20 seconds of gameplay time and cannot repeat within the level',()=>{
  const {scene,rain}=setup();scene.combatTime=rain.triggerAt;rain.update(1/60);
  const until=rain.triggerAt+20000;assert.equal(rain.active,true);assert.equal(rain.until,until);
  for(let i=0;i<120;i++)rain.update(1/60);assert.equal(rain.until,until,'wall time without advancing combat time cannot consume rain');
  scene.combatTime=until-1;rain.update(1/60);assert.equal(rain.active,true);
  scene.combatTime=until;rain.update(1/60);assert.equal(rain.active,false);assert.equal(rain.dim.visible,false);
  assert.equal(rain.rain.lines,0);assert.equal(rain.ripples.ellipses,0);
  scene.combatTime=300000;scene.player.x+=500;rain.update(1/60);assert.equal(rain.active,false,'never retriggers later in the same level');
});

test('rain darkens the world below the HUD, draws screen-fixed drops and floor ripples, then cleans up',()=>{
  const {scene,rain}=setup();start(scene,rain);
  assert.equal(rain.dim.visible,true);assert.ok(rain.dim.alpha>=.35);
  assert.equal(rain.rain.lines,100);assert.equal(rain.ripples.ellipses,14);
  for(const object of [rain.dim,rain.rain,rain.ripples]){assert.equal(object.factor,0);assert.ok(object.depth<999);}
  assert.ok(rain.dim.depth>800,'foreground and characters both darken');
  rain.destroy();for(const object of [rain.dim,rain.rain,rain.ripples])assert.equal(object.destroyed,true);
  assert.equal(rain.active,false);
});

test('player and enemies each keep a small independent slide when braking or turning, returning to dry movement afterwards',()=>{
  const {scene,rain}=setup();start(scene,rain);
  for(const actor of [{x:200,y:440},{x:600,y:460}]){
    for(let i=0;i<40;i++)move(rain,actor,4);
    const stop=actor.x;for(let i=0;i<30;i++)move(rain,actor);
    assert.ok(actor.x-stop>9 && actor.x-stop<11,'only about ten pixels of braking slide');
    for(let i=0;i<40;i++)move(rain,actor,-4);
    const before=actor.x;move(rain,actor,4);assert.ok(actor.x<before,'reversing direction briefly retains inertia');
  }
  const still={x:450,y:450};move(rain,still);assert.equal(still.x,450,'momentum is never shared between characters');
  scene.combatTime=rain.until;rain.update(1/60);move(rain,still,4);assert.equal(still.x,454);
  move(rain,still);assert.equal(still.x,454,'dry ground stops immediately');
});

test('sliding respects floor bounds and cannot carry momentum through a jump, grab, hit reaction or respawn',()=>{
  const {scene,rain}=setup();start(scene,rain);const actor={x:880,y:490};
  for(let i=0;i<30;i++)move(rain,actor,4,4);
  assert.equal(actor.x,scene.floor.right);assert.equal(actor.y,scene.floor.bottom);
  actor.x=400;actor.y=450;for(let i=0;i<20;i++)move(rain,actor,4);
  move(rain,actor,0,0,false);const stop=actor.x;move(rain,actor);assert.equal(actor.x,stop);
  for(let i=0;i<20;i++)move(rain,actor,4);actor.z=30;move(rain,actor,4);const airborne=actor.x;
  actor.z=0;move(rain,actor);assert.equal(actor.x,airborne);
  for(let i=0;i<20;i++)move(rain,actor,-4);rain.forget(actor);const respawn=actor.x;move(rain,actor);assert.equal(actor.x,respawn);
  const entering={x:-100,y:450};move(rain,entering,2);assert.equal(entering.x,-98,'offscreen entrants are not teleported to a boundary');
  rain.clear();assert.equal(rain.active,false);assert.equal(rain.dim.visible,false);
});
