import test from 'node:test';
import assert from 'node:assert/strict';
import {DORADO_LEVEL,CAMPAIGN} from '../src/data/campaign.js';
import {taxiRushPlan,taxiTouches} from '../src/stage/taxiRushRules.js';
import {TaxiRush} from '../src/stage/TaxiRush.js';
import {WaveDirector} from '../src/combat/WaveDirector.js';
import {stageLayout,arenaScroll} from '../src/stage/scroll.js';

const config=DORADO_LEVEL.taxiRush;
class Visual {
  constructor(){this.destroyed=false;}
  setOrigin(){return this;} setScrollFactor(){return this;} setDepth(){return this;}
  setDisplaySize(){return this;} setAlpha(){return this;} destroy(){this.destroyed=true;}
}
function fixture(random=()=>0){
  const visuals=[],layout=stageLayout(DORADO_LEVEL);
  const visual=()=>{const v=new Visual();visuals.push(v);return v;};
  const s={level:DORADO_LEVEL,combatTime:0,health:100,enemies:[],defeated:15,
    floor:{top:405,bottom:500},player:{x:480,y:450,z:60},cameras:{main:{scrollX:0}},
    add:{text:visual,rectangle:visual,image:visual},hitPlayer(){this.health-=config.damage;},updateCounter(){},
    spawnEnemy(key){this.enemies.push({key,hp:10});},
    stage:{layout,wavesPerArena:layout.perArena,arenaScroll:i=>arenaScroll(layout,i),reached(i){return s.cameras.main.scrollX>=this.arenaScroll(i);}},
  };
  s.taxiRush=new TaxiRush(s,config,random);return {s,rush:s.taxiRush,visuals};
}
test('Dorado traffic selects 8–15 taxis, covers every lane and telegraphs each entry',()=>{
  assert.ok(CAMPAIGN.filter(l=>l!==DORADO_LEVEL).every(l=>!l.taxiRush));
  for(const [random,count] of [[()=>0,8],[()=>1,15],[()=>.5,12]]){
    const plan=taxiRushPlan(config,random);assert.equal(plan.length,count);
    assert.deepEqual([...new Set(plan.map(p=>p.lane))].sort(),[0,1,2]);
    for(let i=0;i<count;i++){
      assert.equal(plan[i].launchAt-plan[i].warnAt,900);
      if(i)assert.notEqual(plan[i].lane,plan[i-1].lane);
    }
    assert.ok(config.spacing*2>(960+config.width+100)/config.speed*1000,'at least one lane stays clear of moving taxis');
  }
});
test('taxi collisions sweep across frames and permit changing lane or jumping',()=>{
  const p={x:2000,y:450,z:0};
  assert.equal(taxiTouches(100,800,450,p,1520,config),true);
  assert.equal(taxiTouches(800,100,450,p,1520,config),true);
  assert.equal(taxiTouches(100,800,420,p,1520,config),false);
  p.z=40;assert.equal(taxiTouches(100,800,450,p,1520,config),false);
});
test('each taxi warns before spawning; traffic pauses and finishes with all visuals released',()=>{
  for(const random of [()=>0,()=>1]){
    const {s,rush,visuals}=fixture(random);rush.start(3);rush.update(.5);
    assert.equal(rush.plan[0].state,'warning');assert.equal(rush.cars.length,0);
    const elapsed=rush.elapsed;s.paused=true;rush.update(4);assert.equal(rush.elapsed,elapsed);s.paused=false;
    let frames=0;while(rush.active && frames++<1800)rush.update(1/60);
    assert.equal(rush.done,true);assert.equal(rush.progress,1);assert.equal(s.health,100);
    assert.ok(visuals.every(v=>v.destroyed));assert.equal(rush.start(4),false);
  }
});
test('one moving taxi deals damage once and shutdown removes warnings and cars',()=>{
  const {s,rush,visuals}=fixture();rush.start(3);s.player.z=0;s.player.y=rush.lanes[rush.plan[0].lane];
  while(!rush.cars.length)rush.update(1/60);
  for(let i=0;i<70;i++)rush.update(1/60);
  assert.equal(s.health,78);rush.destroy();assert.equal(rush.active,false);assert.ok(visuals.every(v=>v.destroyed));
});
test('traffic interrupts after 15 enemies, consumes one transition, then allows the final waves',()=>{
  const {s,rush}=fixture();s.waves=new WaveDirector(s);
  Object.assign(s.waves,{spawned:15,wave:6,arena:2,arenaWave:2});
  s.cameras.main.scrollX=s.stage.arenaScroll(2);s.waves.update();
  assert.equal(rush.active,true);assert.equal(s.waves.arena,3);assert.equal(s.waves.awaitingAdvance,false);
  assert.equal(rush.to-rush.from,s.stage.layout.advance);
  let frames=0;while(rush.active && frames++<1800){rush.update(1/60);s.waves.update();assert.equal(s.waves.spawned,15);}
  s.cameras.main.scrollX=rush.to;s.waves.update();s.combatTime+=600;s.waves.update();
  assert.equal(s.waves.spawned,17);
  while(!s.waves.cleared){
    for(const e of s.enemies)if(e.hp>0){e.hp=0;s.defeated++;}
    s.cameras.main.scrollX=s.stage.arenaScroll(4);s.combatTime+=600;s.waves.update();
  }
  assert.equal(s.defeated,25);assert.equal(rush.done,true);
});
test('boss checkpoints skip the traffic and its remaining visuals',()=>{
  const {s,rush,visuals}=fixture();rush.start(3);rush.update(1.5);
  s.waves=new WaveDirector(s);s.waves.skipToEnd();
  assert.equal(s.waves.spawned,25);assert.equal(rush.done,true);assert.ok(visuals.every(v=>v.destroyed));
});
