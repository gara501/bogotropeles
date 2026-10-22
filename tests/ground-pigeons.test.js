import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GroundPigeons,GROUND_PIGEON} from '../src/stage/GroundPigeons.js';
import {COMBAT_CAMPAIGN as CAMPAIGN} from '../src/data/campaign.js';
import {stageLayout} from '../src/stage/scroll.js';

class Visual {
  constructor(x,y,key){Object.assign(this,{x,y,key});}
  setOrigin(x,y){this.origin={x,y};return this;}
  setScale(v){this.scale=v;return this;}
  setDepth(v){this.depth=v;return this;}
  setFrame(v){this.frame=v;return this;}
  setFlipX(v){this.flip=v;return this;}
  setTexture(v,frame){this.key=v;this.frame=frame;return this;}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setAlpha(v){this.alpha=v;return this;}
  destroy(){this.destroyed=true;}
}
function setup(){
  const level=CAMPAIGN[1],width=stageLayout(level).width,hits=[];
  const s={level,combatTime:0,health:100,player:{x:width/2,y:455},jumpHeight:0,floor:{top:410,bottom:500},
    cameras:{main:{scrollX:1190}},waves:{cleared:false},
    add:{sprite:(x,y,key)=>new Visual(x,y,key),ellipse:(x,y)=>new Visual(x,y)},
    hitPlayer:(damage)=>{hits.push(damage);return true;}};
  const system=new GroundPigeons(s,level.groundPigeons,width);
  const step=(n=1)=>{for(let i=0;i<n;i++){s.combatTime+=1000/60;system.update();}};
  return {s,system,hits,step};
}
test('only Plaza de Bolivar has ground flocks, beginning halfway through the world with multiple safe groups',()=>{
  assert.ok(CAMPAIGN.every((level,i)=>i===1?level.groundPigeons:!level.groundPigeons));
  const {s,system}=setup();s.player.x=system.triggerX-.01;system.update();assert.equal(system.groups.length,0);
  s.player.x=system.triggerX;system.update();assert.equal(system.groups.length,3);
  for(const group of system.groups){
    assert.equal(group.state,'ground');assert.equal(group.birds.length,4);
    assert.ok(Math.abs(group.x-s.player.x)>=s.level.groundPigeons.radius+40);
    for(const b of group.birds){assert.equal(b.sprite.key,GROUND_PIGEON.key);assert.ok(b.y>=s.floor.top&&b.y<=s.floor.bottom);}
  }
  const png=readFileSync(new URL('../src/data/NPC/pigeon_ground.png',import.meta.url));
  assert.equal(png.readUInt32BE(16),GROUND_PIGEON.frameWidth*GROUND_PIGEON.frames);
  assert.equal(png.readUInt32BE(20),GROUND_PIGEON.frameHeight);
});
test('proximity in both floor axes startles a flock, telegraphs its attack and permits at most one damage event',()=>{
  const {s,system,hits,step}=setup();system.update();const g=system.groups[0];
  s.player.x=g.x;s.player.y=g.y+40;step();assert.equal(g.state,'ground');assert.equal(hits.length,0);
  s.player.y=g.y;step();assert.equal(g.state,'alert');assert.equal(hits.length,0);
  assert.ok(g.birds.every(b=>b.sprite.key==='pigeon-flight'));
  step(20);assert.equal(g.state,'alert');assert.equal(hits.length,0);
  step(80);assert.equal(g.state,'flight');assert.equal(hits.length,1);assert.ok(hits[0]<=5);
  step(60);assert.ok(!system.groups.includes(g));assert.equal(hits.length,1);
});
test('moving away in depth or jumping avoids a flock whose target is fixed when startled',()=>{
  for(const dodge of ['lane','jump']){
    const {s,system,hits,step}=setup();system.update();const g=system.groups[0];
    s.player.x=g.x;s.player.y=g.y;step();assert.equal(g.state,'alert');
    if(dodge==='lane')s.player.y=g.y+65;else s.jumpHeight=60;
    step(140);assert.equal(hits.length,0,dodge);
  }
});
test('flocks keep replacing departed groups, respect a population cap and stop for boss entry/checkpoints',()=>{
  const {s,system,step}=setup();system.update();const g=system.groups[0],oldBirds=g.birds;
  g.state='flight';g.target={x:g.x,y:g.y};g.since=-2000;step();assert.ok(oldBirds.every(b=>b.sprite.destroyed&&b.shadow.destroyed));
  assert.equal(system.groups.length,2);s.combatTime=system.nextSpawn;system.update();assert.equal(system.groups.length,3);
  for(let i=0;i<5;i++){s.combatTime+=5000;system.update();assert.ok(system.groups.length<=3);}
  for(const flag of ['bossIntroShown','boss','miniBoss']){
    const fixture=setup();fixture.system.update();const sprites=fixture.system.groups.flatMap(g=>g.birds);
    fixture.s[flag]=true;fixture.step();assert.equal(fixture.system.groups.length,0);assert.equal(fixture.system.stopped,true);
    assert.ok(sprites.every(b=>b.sprite.destroyed&&b.shadow.destroyed));fixture.s[flag]=false;fixture.step(300);assert.equal(fixture.system.groups.length,0);
  }
});
test('pause freezes flocks; scrolling discards old groups; victory and shutdown remove every sprite',()=>{
  const {s,system,step,hits}=setup();system.update();const g=system.groups[0];
  s.player.x=g.x;s.player.y=g.y;step();s.paused=true;step(100);assert.equal(g.state,'alert');assert.equal(hits.length,0);
  s.paused=false;s.cameras.main.scrollX=2400;step();assert.ok(!system.groups.includes(g));
  system.destroy();assert.equal(system.groups.length,0);assert.equal(system.stopped,true);
  const win=setup();win.system.update();win.s.finished=true;win.step();assert.equal(win.system.groups.length,0);
  const clear=setup();clear.s.waves.cleared=true;clear.system.update();assert.equal(clear.system.groups.length,0);assert.equal(clear.system.stopped,true);
});
