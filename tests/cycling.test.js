import test from 'node:test';
import assert from 'node:assert/strict';
import {CyclingRun,CYCLING,OBSTACLES,GUARDIAN,CYCLING_DASH,obstacleHits} from '../src/cycling/CyclingRun.js';

// Existing traffic/dash fixtures begin already cruising; startup and impact acceleration are tested separately.
function cruisingRun(random){const run=new CyclingRun(random);run.pace=CYCLING.speed;return run;}
const normalDuration=CYCLING.duration*(.5+.25/1.35+.25/1.5)
  +CYCLING.speed/(2*CYCLING.acceleration)*1000*(.35**2/1.35+.15**2/1.5);

test('the route retains its length and accelerates after halfway to finish sooner',()=>{
  const r=cruisingRun();r.nextWave=Infinity;
  const o={id:0,kind:'hole',x:1040,y:CYCLING.top,hit:false};r.obstacles=[o];
  r.step(1000);assert.equal(o.x,390);assert.equal(r.progress,1/90);
  r.step(89000);assert.equal(r.done,true);assert.ok(Math.abs(r.elapsed-normalDuration)<1e-6);
  assert.ok(Math.abs(r.distance-1125)<1e-6);
});

test('oncoming cyclists and dogs move faster than the road without changing pothole movement',()=>{
  const r=cruisingRun();r.nextWave=Infinity;
  r.obstacles=['hole','cyclist','dog'].map((kind,id)=>({id,kind,x:1000,y:315,hit:false}));
  for(let i=0;i<10;i++)r.step(50);
  const [hole,cyclist,dog]=r.obstacles;
  assert.equal(hole.x,675);assert.equal(cyclist.x,555);assert.equal(dog.x,585);
  assert.ok(cyclist.x<dog.x && dog.x<hole.x);
});

test('cycling advances by elapsed time and clamps vertical steering to the road',()=>{
  for(const ms of [1000/60,50]){
    const r=cruisingRun(()=>.5);r.nextWave=Infinity;r.step(1000,-1);assert.equal(r.y,CYCLING.top);
    r.step(1000,1);assert.equal(r.y,CYCLING.bottom);r.y=390;
    for(let i=0;i<Math.ceil(CYCLING.duration/ms);i++)r.step(ms,0);
    assert.equal(r.done,true);assert.equal(r.progress,1);assert.ok(Math.abs(r.elapsed-normalDuration)<1e-6);
    const before=r.y;r.step(5000,1);assert.equal(r.y,before);
  }
});

test('all three obstacle types collide on a swept path in their lane, once, with recovery between hits',()=>{
  for(const kind of Object.keys(OBSTACLES)){
    const r=cruisingRun();r.nextWave=Infinity;
    const o={id:0,kind,x:CYCLING.playerX+200,y:r.y,hit:false};
    assert.equal(obstacleHits(CYCLING.playerX-200,o,r.y),true);
    assert.equal(obstacleHits(CYCLING.playerX-200,o,r.y+70),false);
    r.obstacles=[o];assert.equal(r.step(1000).hits.length,1);assert.equal(r.step(10).hits.length,0);
    r.obstacles=[{...o,id:1,x:CYCLING.playerX,hit:false}];assert.equal(r.step(10).hits.length,0);
    r.step(1500);r.obstacles=[{...o,id:2,x:CYCLING.playerX,hit:false}];assert.equal(r.step(10).hits.length,1);
  }
});

test('each obstacle wave leaves a complete lane open, uses varied hazards and avoids distant safe-lane jumps',()=>{
  let seed=1;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const r=cruisingRun(random),kinds=new Set();r.elapsed=20000;r.nextGuardianMeters=Infinity;
  for(let i=0;i<200;i++){
    r.obstacles=[];const previous=r.safeLane;r.spawnWave();assert.ok(Math.abs(r.safeLane-previous)<=1);
    assert.equal(r.obstacles.length,2);assert.equal(new Set(r.obstacles.map(o=>o.lane)).size,2);
    assert.ok(r.obstacles.every(o=>o.lane!==r.safeLane));for(const o of r.obstacles)kinds.add(o.kind);
  }
  assert.deepEqual([...kinds].sort(),['cyclist','dog','hole']);
});

test('respawn retains distance, clears nearby hazards and gives time to regain control',()=>{
  const r=cruisingRun();r.step(25000);const elapsed=r.elapsed;r.respawn();
  assert.equal(r.elapsed,elapsed);assert.equal(r.done,false);assert.equal(r.obstacles.length,0);
  assert.equal(r.y,390);assert.equal(r.invulnerableUntil,elapsed+3000);assert.ok(r.nextWave>elapsed+2000);
});

test('the finish straight stays clear and the completed level cannot emit further collisions',()=>{
  const r=cruisingRun(()=>.8);r.elapsed=CYCLING.duration-4900;r.nextWave=0;
  for(let i=0;i<100;i++)r.step(50);assert.equal(r.obstacles.length,0);assert.equal(r.done,true);
  assert.deepEqual(r.step(1000),{hits:[],passed:[],collected:[]});
});

test('difficulty ramps up through five distance phases, with much denser NPC groups after halfway',()=>{
  const r=cruisingRun(()=>.2),phases=[];r.nextGuardianMeters=Infinity;
  for(const elapsed of [0,15000,35000,50000,70000]){
    r.elapsed=elapsed;r.pace=r.targetSpeed;r.obstacles=[];r.spawnWave();phases.push(r.difficulty);
    assert.ok(r.obstacles.every(o=>o.lane!==r.safeLane));
    for(const o of r.obstacles){
      const arrival=(o.x-CYCLING.playerX)/(r.speed+OBSTACLES[o.kind].speed);
      assert.ok(Math.abs(arrival-1.65)<1e-6 || Math.abs(arrival-1.97)<1e-6);
    }
  }
  assert.deepEqual(phases.map(p=>p.label),['CALENTAMIENTO','TRÁFICO','SLALOM','HORA PICO','TRÁFICO INTENSO']);
  assert.ok(phases.every((p,i)=>i===0 || p.interval<phases[i-1].interval));
  assert.equal(r.obstacles.length,4);assert.ok(r.obstacles.some(o=>o.sway>0));
  assert.ok(phases[3].count*(1+phases[3].follow)/phases[3].interval>2*phases[1].count/phases[1].interval);
  assert.ok(phases[3].cyclists>=.75 && phases[4].cyclists>phases[3].cyclists);
});

test('pace changes and dash keep road, potholes and pickups synchronized across the halfway marker',()=>{
  const offsets=[];
  for(const frame of [4000,50,1000/60]){
    const r=cruisingRun();r.elapsed=44500;r.nextWave=Infinity;r.startDash();
    const start=r.roadOffset,end=r.elapsed+4000;
    const hole={id:1,kind:'hole',x:20000,y:315,hit:false},npc={id:2,kind:'cyclist',x:20000,y:315,hit:false};
    const food={id:3,kind:'full',x:20000,y:315};r.obstacles=[hole,npc];r.pickups=[food];
    while(r.elapsed<end-1e-6)r.step(Math.min(frame,end-r.elapsed));
    const moved=r.roadOffset-start;offsets.push(moved);
    assert.ok(Math.abs(hole.x-(20000-moved))<1e-6);assert.ok(Math.abs(food.x-hole.x)<1e-6);
    assert.ok(Math.abs(npc.x-(hole.x-OBSTACLES.cyclist.speed*4))<1e-6);
    assert.equal(r.speed,CYCLING.speed*1.35);assert.equal(r.dashing,false);
    const distance=r.roadOffset;r.respawn();assert.equal(r.roadOffset,distance);assert.equal(r.speed,0);
  }
  assert.ok(Math.max(...offsets)-Math.min(...offsets)<1e-6);
  const r=cruisingRun();r.nextWave=Infinity;r.step(45000);assert.equal(r.progress,.5);assert.equal(r.speed,CYCLING.speed);
  r.step(22500/1.35+1000);assert.ok(r.speed>CYCLING.speed*1.35);assert.ok(r.speed<CYCLING.speed*1.5);
});

test('one changua appears after halfway in the open lane, collects once and does not count as a card',()=>{
  const r=cruisingRun(()=>.2);r.nextGuardianMeters=Infinity;r.nextPickup=Infinity;
  r.elapsed=CYCLING.duration*.57;r.spawnWave();assert.ok(!r.pickups.length);
  r.elapsed=CYCLING.duration*CYCLING.changuaProgress;r.spawnWave();
  assert.equal(r.pickups.length,1);const food=r.pickups[0];assert.equal(food.kind,'full');
  assert.equal(food.y,CYCLING.lanes[r.safeLane]);assert.ok(!r.obstacles.some(o=>o.lane===r.safeLane));
  r.spawnWave();assert.equal(r.pickups.length,1);
  r.nextWave=Infinity;r.obstacles=[];r.y=food.y;food.x=CYCLING.playerX+100;
  assert.deepEqual(r.step(200).collected,[food]);assert.equal(r.cardsCollected,0);assert.equal(r.step(50).collected.length,0);
  r.respawn();r.spawnWave();assert.ok(!r.pickups.some(item=>item.kind==='full'));
});

test('cards spawn as reachable random trails in the current open lane and collect once by swept contact',()=>{
  let seed=19;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const r=cruisingRun(random),lanes=new Set(),counts=new Set();r.elapsed=35000;r.nextGuardianMeters=Infinity;
  for(let i=0;i<60;i++){
    r.obstacles=[];r.pickups=[];r.nextPickup=0;r.spawnWave();lanes.add(r.safeLane);counts.add(r.pickups.length);
    assert.ok(r.pickups.every(item=>Math.abs(item.y-CYCLING.lanes[r.safeLane])<=8));
    assert.ok(r.pickups.every(item=>item.x>960 && item.y>=CYCLING.top && item.y<=CYCLING.bottom));
    assert.ok(!r.obstacles.some(o=>o.lane===r.safeLane));
  }
  assert.equal(lanes.size,3);assert.equal(counts.size,3);
  r.nextWave=Infinity;r.obstacles=[];r.pickups=[{id:999,kind:'money',x:400,y:r.y}];
  assert.equal(r.step(500).collected.length,1);assert.equal(r.cardsCollected,1);assert.equal(r.pickups.length,0);
  assert.equal(r.step(500).collected.length,0);assert.equal(r.cardsCollected,1);
  r.pickups=[{id:1000,kind:'money',x:400,y:CYCLING.top}];
  assert.equal(r.step(500).collected.length,0);r.respawn();assert.equal(r.pickups.length,0);assert.equal(r.cardsCollected,1);
});

test('every difficulty leaves enough time to steer between safe lanes without collisions',()=>{
  for(let seed=1;seed<=20;seed++){
    let state=seed;const random=()=>((state=state*16807%2147483647)-1)/2147483646;
    const r=new CyclingRun(random),schedule=[];let target=390,hits=0;
    const spawn=r.spawnWave.bind(r);r.spawnWave=()=>{spawn();schedule.push({time:r.elapsed+1250,y:CYCLING.lanes[r.safeLane]});};
    while(!r.done){
      while(schedule.length && schedule[0].time<=r.elapsed)target=schedule.shift().y;
      const steer=Math.abs(target-r.y)<2?0:Math.sign(target-r.y);
      hits+=r.step(1000/60,steer).hits.length;
    }
    assert.equal(hits,0,`seed ${seed} must have a collision-free route`);
  }
});

test('guardians appear by distance, replace a traffic group and reserve a clear crossing window',()=>{
  const r=cruisingRun(()=>.5),firstTime=GUARDIAN.firstMeters*CYCLING.pixelsPerMeter/CYCLING.speed*1000;
  r.elapsed=firstTime-100;r.nextWave=r.elapsed;r.step(10);
  assert.ok(!r.obstacles.some(o=>o.kind==='guardian'));
  r.obstacles=[];r.pickups=[];r.nextWave=firstTime;r.step(90);
  assert.equal(r.obstacles.length,1);const guard=r.obstacles[0];assert.equal(guard.kind,'guardian');
  assert.ok(guard.startY<CYCLING.top || guard.startY>CYCLING.bottom);
  assert.equal(guard.targetY,390);assert.equal(r.nextGuardianMeters,r.distance+GUARDIAN.spacingMeters);
  assert.equal(r.nextWave,r.elapsed+GUARDIAN.encounterGap);
  r.step(1000);assert.equal(r.obstacles.length,1,'ordinary traffic does not immediately surround the crossing');
  const due=r.nextGuardianMeters;r.respawn();assert.equal(r.nextGuardianMeters,due,'a lost life does not repeat a completed distance marker');
  r.elapsed=CYCLING.duration-4900;r.nextWave=0;r.nextGuardianMeters=0;r.step(50);
  assert.equal(r.obstacles.length,0,'the finish straight remains clear');
});

test('the guardian telegraphs, crosses toward a locked lane and can be avoided without being followed',()=>{
  const r=cruisingRun(()=>.5);r.nextWave=Infinity;
  const guard=r.spawnGuardian(),target=guard.targetY;
  r.step(GUARDIAN.windup);assert.equal(guard.y,guard.startY);
  r.y=CYCLING.top;r.step(GUARDIAN.crossing/2);
  assert.equal(guard.y,(guard.startY+target)/2);assert.equal(guard.targetY,target);
  r.step(GUARDIAN.crossing/2);assert.equal(guard.y,target);
  assert.equal(r.step(900).hits.length,0,'changing lane escapes the interception');
  r.obstacles=[];r.y=390;const second=r.spawnGuardian();
  r.step(GUARDIAN.windup+GUARDIAN.crossing);assert.equal(second.y,390);
  assert.equal(r.step(800).hits.length,1);assert.equal(r.step(50).hits.length,0);
  assert.equal(OBSTACLES.guardian.damage,22);
});

test('cycling dash lasts three seconds and needs five more seconds before it can restart',()=>{
  const r=cruisingRun();r.nextWave=Infinity;
  assert.equal(r.startDash(),true);assert.equal(r.startDash(),false);
  r.step(2999);assert.equal(r.dashing,true);assert.equal(r.dashRemaining,1);
  r.step(1);assert.equal(r.dashing,false);assert.equal(r.dashCooldown,5000);
  assert.ok(Math.abs(r.roadOffset-CYCLING.speed*2.2*3)<1e-8);
  assert.equal(r.startDash(),false);r.step(4999);assert.equal(r.startDash(),false);
  r.step(1);assert.equal(r.dashCooldown,0);assert.equal(r.startDash(),true);
});

test('boost motion is frame-rate independent and speeds the ground, potholes, cards and incoming NPCs together',()=>{
  const offsets=[];
  for(const frameMs of [4000,1000/30,1000/60,1000/120]){
    const r=cruisingRun();r.nextWave=Infinity;r.startDash();
    const hole={id:1,kind:'hole',x:14000,y:315,hit:false},npc={id:2,kind:'cyclist',x:14000,y:315,hit:false},card={id:3,kind:'money',x:14000,y:315};
    r.obstacles=[hole,npc];r.pickups=[card];
    while(r.elapsed<4000-1e-7)r.step(Math.min(frameMs,4000-r.elapsed));
    const expected=CYCLING.speed*(3*CYCLING_DASH.multiplier+1);
    offsets.push(r.roadOffset);assert.ok(Math.abs(r.roadOffset-expected)<1e-6);
    assert.ok(Math.abs(14000-hole.x-r.roadOffset)<1e-6);assert.ok(Math.abs(card.x-hole.x)<1e-6);
    assert.ok(Math.abs((14000-npc.x)-(r.roadOffset+OBSTACLES.cyclist.speed*4))<1e-6);
    assert.equal(r.dashing,false);assert.ok(Math.abs(r.dashCooldown-4000)<1e-6);
  }
  assert.ok(Math.max(...offsets)-Math.min(...offsets)<1e-6);
});

test('dash advances the actual route, can reach the finish early and ends on respawn without resetting earned distance',()=>{
  const r=cruisingRun();r.nextWave=Infinity;r.startDash();r.step(1000);
  assert.ok(r.progress>1000/CYCLING.duration);assert.ok(r.distance>CYCLING.speed/CYCLING.pixelsPerMeter);
  const offset=r.roadOffset,elapsed=r.elapsed;r.respawn();
  assert.equal(r.roadOffset,offset);assert.equal(r.elapsed,elapsed);assert.equal(r.dashing,false);assert.equal(r.dashCooldown,5000);
  const finish=cruisingRun();finish.nextWave=Infinity;finish.elapsed=CYCLING.duration-500;finish.startDash();finish.step(10000);
  assert.equal(finish.done,true);assert.equal(finish.progress,1);assert.equal(finish.remainingDistance,0);
  assert.ok(finish.elapsed<CYCLING.duration);assert.equal(finish.dashing,false);assert.equal(finish.startDash(),false);
});

test('dash reduces the reaction window and still takes collision damage',()=>{
  for(const boost of [false,true]){
    const r=cruisingRun();r.nextWave=Infinity;if(boost)r.startDash();
    r.obstacles=[{id:1,kind:'cyclist',x:CYCLING.playerX+600,y:r.y,hit:false}];
    assert.equal(r.step(400).hits.length,boost?1:0);
    if(boost)assert.equal(r.invulnerableUntil,r.elapsed+CYCLING.invulnerability);
  }
});


test('cycling starts at rest and gains speed gradually with frame-independent road motion',()=>{
  const offsets=[];
  for(const frame of [4000,50,1000/60]){
    const r=new CyclingRun();r.nextWave=Infinity;assert.equal(r.speed,0);
    while(r.elapsed<4000-1e-6)r.step(Math.min(frame,4000-r.elapsed));
    assert.ok(Math.abs(r.speed-CYCLING.acceleration*4)<1e-6);
    assert.ok(Math.abs(r.roadOffset-CYCLING.acceleration*4*4/2)<1e-6);offsets.push(r.roadOffset);
    r.step(10000);assert.equal(r.speed,r.targetSpeed);
  }
  assert.ok(Math.max(...offsets)-Math.min(...offsets)<1e-6);
});

test('accepted impacts stop forward speed and dash; protected contacts do not reset acceleration',()=>{
  const r=new CyclingRun();r.nextWave=Infinity;r.step(10000);r.startDash();
  const hazard=()=>({id:r.nextId++,kind:'hole',x:CYCLING.playerX,y:r.y,hit:false});
  r.obstacles=[hazard()];assert.equal(r.step(10).hits.length,1);
  assert.equal(r.speed,0);assert.equal(r.travelSpeed,0);assert.equal(r.dashing,false);
  const distance=r.roadOffset;r.obstacles=[hazard()];assert.equal(r.step(100).hits.length,0);
  assert.ok(r.speed>0);assert.ok(r.speed<CYCLING.speed);assert.ok(r.roadOffset>distance);
  r.obstacles=[];r.step(1500);r.obstacles=[hazard()];assert.equal(r.step(10).hits.length,1);assert.equal(r.speed,0);
  const before=r.roadOffset;r.respawn();assert.equal(r.speed,0);assert.equal(r.roadOffset,before);
});

test('a collision-free run from rest reaches the same finish distance and speed increases smoothly at phase boundaries',()=>{
  const r=new CyclingRun();r.nextWave=Infinity;let previous=0;
  while(!r.done){r.step(50);assert.ok(r.speed>=previous-1e-6);assert.ok(r.speed-previous<=CYCLING.acceleration*.05+1e-6);previous=r.speed;}
  assert.ok(Math.abs(r.distance-1125)<1e-6);assert.equal(r.progress,1);
  assert.ok(Math.abs(r.elapsed-(normalDuration+CYCLING.speed/(2*CYCLING.acceleration)*1000))<1e-6);
});
