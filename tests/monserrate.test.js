import test from 'node:test';
import assert from 'node:assert/strict';
import {MONSERRATE,MONSERRATE_DASH,MONSERRATE_JUMP,MonserrateRun,LANES,projectHiker,npcTravelSpeed} from '../src/monserrate/MonserrateRun.js';
import {CAMPAIGN,campaignIndexForCombat} from '../src/data/campaign.js';
import {MONSERRATE_HUD,forestObjects,projectForest,mountainTransform} from '../src/monserrate/MonserrateScenery.js';
import {trailOffset,trailRow,trailSection,TRAIL_VENDORS,TRAIL_JUMPS,logSpan} from '../src/monserrate/MonserrateTrail.js';

function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

test('HUD leaves the complete sanctuary corridor clear throughout the background approach',()=>{
  for(const progress of [0,.25,.5,.75,1]){
    const m=mountainTransform(progress);
    // Bounds of the sanctuary, including its cross, in the production backdrop.
    const left=m.x+(423-480)*m.scale,right=m.x+(548-480)*m.scale;
    const top=m.y+(8-24)*m.scale,bottom=m.y+(108-24)*m.scale;
    assert.ok(top>0 && bottom<150);
    for(const panel of [MONSERRATE_HUD.left,MONSERRATE_HUD.right])assert.ok(panel.x+panel.width<left || panel.x>right);
  }
  assert.ok(mountainTransform(1).scale>mountainTransform(0).scale);
});

test('roadside forest flows toward the camera and outward as world distance advances',()=>{
  const objects=forestObjects();assert.equal(objects.length,40);
  for(const object of objects){
    const far=projectForest({...object,offset:25},0),near=projectForest({...object,offset:25},5);
    assert.ok(near.z<far.z && near.y>far.y && near.height>far.height);
    assert.ok(Math.abs(near.x-480-trailOffset(5,near.z))>Math.abs(far.x-480-trailOffset(0,far.z)));
    assert.equal(Math.sign(near.x-480-trailOffset(5,near.z)),object.side);
    assert.deepEqual(projectForest(object,20),projectForest(object,20),'no wall-clock animation during pause');
    const repeat=projectForest(object,84),before=projectForest(object,20);
    assert.ok(Math.abs(repeat.y-before.y)<1e-8);
    assert.ok(Math.abs(repeat.x-before.x-trailOffset(84,repeat.z)+trailOffset(20,before.z))<1e-8);
  }
});

test('curves alternate smoothly and every actor shares the exact road centre at its depth',()=>{
  let min=0,max=0;
  for(let distance=0;distance<=MONSERRATE.length;distance+=2){
    assert.equal(trailOffset(distance,0),0,'turns cannot move the player at contact');
    for(const z of [4,12,24,40,80]){
      const p=projectHiker(0,z,distance),row=trailRow(p.y,distance);
      assert.ok(Math.abs(p.x-row.centre)<1e-8);
      assert.ok(Math.abs(trailOffset(distance,z))<=112);
      assert.ok(Math.abs(trailOffset(distance+.1,z)-trailOffset(distance,z))<1,'no sudden bend changes');
      min=Math.min(min,p.x-480);max=Math.max(max,p.x-480);
      for(const lane of [-1,1]){
        const actor=projectHiker(lane,z,distance);
        assert.ok(Math.abs(actor.x-row.centre)<row.width/2,'both walking lanes stay on the trail');
      }
    }
  }
  assert.ok(min<-50 && max>50,'both left and right turns must read clearly');
});

test('rocky stairs form a distinct gradual section and stationary vendors occupy the inside edges',()=>{
  assert.equal(trailSection(40).rock,0);assert.equal(trailSection(1000).rock,1);assert.equal(trailSection(1800).rock,0);
  assert.deepEqual([40,1000,1800,2200].map(d=>trailSection(d).label),['BOSQUE','ESCALINATA','LAS VELAS','SANTUARIO']);
  for(let d=0;d<MONSERRATE.length;d++)assert.ok(Math.abs(trailSection(d+1).rock-trailSection(d).rock)<.05);
  assert.ok(TRAIL_VENDORS.length>=8);
  for(const vendor of TRAIL_VENDORS){
    assert.ok(vendor.at>30 && vendor.at<MONSERRATE.length-60);assert.ok(Math.abs(vendor.lane)>1 && Math.abs(vendor.lane)<1.4);
    assert.ok(Math.abs(vendor.lane-vendor.side)<vendor.hitWidth,'the vendor blocks the outer lane');
    assert.ok(Math.abs(vendor.lane)>vendor.hitWidth,'the centre lane stays clear');
    // Even the full padded frame, wider than the actual silhouette, fits within the road.
    for(const z of [0,8,24,50])for(const distance of [0,90,200,350,700,950,1200,1450,1800,2100,2300]){
      const p=projectHiker(vendor.lane,z,distance),road=trailRow(p.y,distance);
      assert.ok(Math.abs(p.x-road.centre)+192/2*152/208*p.scale<road.width/2,'full vendor and stand remain inside railing');
    }
  }
});

test('Monserrate is the third stop, between Transmilleno · Estación and La Candelaria, with stable combat IDs',()=>{
  assert.equal(CAMPAIGN[1].name,'Transmilleno · Estación');assert.equal(CAMPAIGN[2].mode,'monserrate');
  assert.equal(CAMPAIGN[3].name,'La Candelaria');assert.equal(CAMPAIGN.length,12);
  assert.equal(campaignIndexForCombat(3),1);assert.equal(campaignIndexForCombat(2),3);
  assert.equal(CAMPAIGN.at(-1).name,'Zona Rosa');
});

test('all seeded wave patterns leave a reachable full lane and an attainable reaction interval',()=>{
  for(let seed=1;seed<=100;seed++){
    const run=new MonserrateRun({random:random(seed)});let last=0;
    for(let i=0;i<150;i++){
      run.distance=i/150*MONSERRATE.length;
      const wave=run.spawnWave();if(!wave)continue;assert.ok(!wave.blocked.includes(wave.safeLane));
      assert.ok(wave.blocked.length>=1 && wave.blocked.length<=2);
      assert.ok(Math.abs(wave.safeLane-last)<=1);last=wave.safeLane;
      assert.ok(run.interval/1000>1/MONSERRATE.steerSpeed+.55);
      assert.ok(MONSERRATE.spawnDistance/(MONSERRATE.endSpeed-MONSERRATE.walkerSpeed)>3,'top speed still leaves 3 s to read a wave');
    }
  }
});

test('a visible-gap steering policy completes 80 courses without damage at varied frame rates',()=>{
  for(let seed=1;seed<=80;seed++){
    const run=new MonserrateRun({random:random(seed)});let hits=0;
    const ms=[1000/144,1000/60,1000/30,50][seed%4];
    while(!run.done && run.elapsed<150000){
      const threats=[...run.npcs.filter(n=>!n.passed).map(n=>({lane:n.lane,width:MONSERRATE.hitWidth,eta:n.z/(run.speed-npcTravelSpeed(n))})),
        ...run.vendors.filter(v=>!v.passed && v.at>=run.distance).map(v=>({lane:v.lane,width:v.hitWidth,eta:(v.at-run.distance)/run.speed}))].sort((a,b)=>a.eta-b.eta);
      let target=run.x;
      if(threats.length){
        const imminent=threats.filter(n=>n.eta-threats[0].eta<.48);
        const safe=LANES.filter(l=>imminent.every(n=>Math.abs(l-n.lane)>=n.width));
        assert.ok(safe.length,'each encounter leaves a reachable gap');
        target=safe.sort((a,b)=>Math.abs(a-run.x)-Math.abs(b-run.x))[0];
      }
      const next=run.nextJump();
      if(next && next.at>run.distance && next.at-run.distance<=(run.speed*MONSERRATE_JUMP.ms/1000-next.length)/2)run.jump();
      const steer=Math.max(-1,Math.min(1,(target-run.x)/(MONSERRATE.steerSpeed*ms/1000)));
      hits+=run.step(ms,steer).hits.length;
    }
    assert.equal(hits,0,`seed ${seed}`);assert.equal(run.crashes,0,`seed ${seed}`);assert.ok(run.done);
    assert.ok(run.elapsed>55000 && run.elapsed<72000,`seed ${seed}: ${run.elapsed}`); // ~62 s climb
    assert.equal(run.cleared,TRAIL_JUMPS.length);assert.ok(run.dodged>30);
  }
});

test('a fixed candle vendor damages an edge runner once while the centre route passes safely',()=>{
  for(const [x,expectedHits] of [[-1,1],[0,0]]){
    const run=new MonserrateRun();run.nextWave=Infinity;run.distance=TRAIL_VENDORS[0].at-.01;run.x=x;
    const vendor=run.vendors[0],at=vendor.at;
    const event=run.step(50);assert.equal(event.hits.length,expectedHits);
    assert.equal(vendor.at,at);assert.equal(vendor.passed,true);
    assert.equal(run.step(100).hits.length,0);
    if(expectedHits)assert.equal(event.hits[0].kind,'vendor');
  }
});

test('crossing a hiker damages once, checks lateral position at contact, and grace blocks adjacent impacts',()=>{
  const run=new MonserrateRun();run.nextWave=Infinity;
  run.npcs=[{id:1,lane:0,z:.1,passed:false},{id:2,lane:0,z:.11,passed:false}];
  assert.equal(run.step(50,0).hits.length,1);assert.equal(run.step(50,0).hits.length,0);
  run.npcs=[{id:3,lane:0,z:.01,passed:false}];run.x=.5;run.invulnerableUntil=0;
  assert.equal(run.step(50,0).hits.length,0);assert.equal(run.dodged,1);
});

test('respawn keeps course progress, clears imminent collisions and grants steering time',()=>{
  const run=new MonserrateRun();run.distance=200;run.elapsed=25000;run.x=-1;
  run.npcs=[{z:-1},{z:2},{z:17},{z:25}];run.respawn();
  assert.equal(run.distance,200);assert.equal(run.x,0);assert.deepEqual(run.npcs,[{z:25}]);
  assert.ok(run.invulnerableUntil-run.elapsed>=2000);assert.ok(run.nextWave-run.elapsed>=1400);
});

test('perspective keeps collision plane aligned with player and recedes monotonically',()=>{
  const near=projectHiker(1,0),far=projectHiker(1,34);
  assert.equal(near.x,660);assert.equal(near.y,470);assert.equal(near.scale,1);
  assert.ok(far.x<near.x && far.y<near.y && far.scale<near.scale);
  assert.ok(Number.isFinite(projectHiker(-1,-100).scale));
});

test('finish is final, clamps distance, and stops spawning in the clear summit stretch',()=>{
  const run=new MonserrateRun();run.distance=MONSERRATE.length-35;run.nextWave=0;
  run.step(250);assert.equal(run.npcs.length,0);
  while(!run.done)run.step(250);
  const t=run.elapsed;assert.equal(run.distance,MONSERRATE.length);
  assert.deepEqual(run.step(250),{hits:[],passed:[],waves:[],falls:[],jumped:[],close:[]});assert.equal(run.elapsed,t);
});

test('dash: a short burst of speed and steering with a recharge, and it doubles dodge points',()=>{
  const run=new MonserrateRun();run.nextWave=Infinity;run.distance=100;
  const base=run.speed;assert.equal(run.dashReady,true);assert.equal(run.dash(),true);
  assert.ok(Math.abs(run.speed-base*MONSERRATE_DASH.speed)<1e-9);assert.equal(run.dash(),false,'no chaining while recharging');
  run.step(100,1);const dashedX=run.x;
  const calm=new MonserrateRun();calm.nextWave=Infinity;calm.distance=100;calm.step(100,1);
  assert.ok(dashedX>calm.x,'sharper steering while dashing');
  run.npcs=[{id:'a',lane:-1,z:.05,passed:false}];run.x=1;const passed=run.step(20).passed;
  assert.equal(passed[0].dashed,true);
  for(let t=0;t<MONSERRATE_DASH.cooldown;t+=250)run.step(250);
  assert.equal(run.dashing,false);assert.equal(run.dashReady,true);assert.equal(run.dashCharge,1);
  assert.ok(MONSERRATE_DASH.dodgePoints>=50);
});

test('the longer, faster climb: at least 1 km and over 50 km/h at the top',()=>{
  assert.ok(MONSERRATE.length>=1000);assert.ok(MONSERRATE.endSpeed*3.6>50);
  assert.ok(MONSERRATE.endSpeed*MONSERRATE_DASH.speed*3.6<215,'dash stays readable');
  assert.ok(MONSERRATE.length>=2400 && MONSERRATE.startSpeed>=30 && MONSERRATE.endSpeed>=48,'much longer and faster than the 1100 m, 22→36 m/s version');
  assert.ok(MONSERRATE.endSpeed*3.6>75,'top speed above 75 km/h');
});

test('kneeling groups use four rear-view variants, fixed lanes, and slower forward movement',()=>{
  const run=new MonserrateRun({random:random(741)});run.distance=300;run.jumps=[];
  let groups=0;
  for(let i=0;i<30;i++){
    const wave=run.spawnWave();
    const group=run.npcs.filter(n=>n.wave===wave.wave);
    if(wave.kneeling){
      groups++;assert.ok(group.length>0);
      for(const npc of group){
        assert.equal(npc.kind,'kneeler');assert.ok(npc.variant>=0 && npc.variant<4);assert.equal(npc.to,undefined);
        assert.ok(npcTravelSpeed(npc)<MONSERRATE.walkerSpeed/3);
        const reaction=npc.z/(run.speed-npcTravelSpeed(npc));
        assert.ok(Math.abs(reaction-MONSERRATE.spawnDistance/(run.speed-MONSERRATE.walkerSpeed))<1e-8);
      }
    }
    run.npcs=[];
  }
  assert.equal(groups,10);
  const solo=new MonserrateRun();solo.nextWave=Infinity;
  solo.npcs=[{id:'slow',kind:'kneeler',z:100,lane:-1,passed:false},{id:'normal',kind:'walker',z:100,lane:1,passed:false}];
  for(let i=0;i<4;i++)solo.step(250);
  const slow=solo.npcs[0].z-100+solo.distance,normal=solo.npcs[1].z-100+solo.distance;
  assert.ok(Math.abs(slow-MONSERRATE.kneelerSpeed)<1e-8);assert.ok(Math.abs(normal-MONSERRATE.walkerSpeed)<1e-8);
});

test('the faster run keeps a readable lead time even at maximum dash speed',()=>{
  assert.ok(MONSERRATE.startSpeed>=22 && MONSERRATE.endSpeed>=36);
  const run=new MonserrateRun();run.distance=MONSERRATE.length-1;run.dash();
  assert.ok(MONSERRATE.spawnDistance/(run.speed-MONSERRATE.kneelerSpeed)>2.2);
  assert.ok(run.interval>1000/MONSERRATE.steerSpeed+.5*1000);
});

test('colliding with a kneeling pilgrim counts as a crash for the perfect-ascent reward',()=>{
  const run=new MonserrateRun();run.nextWave=Infinity;
  run.npcs=[{id:'pilgrim',kind:'kneeler',lane:0,z:.01,passed:false}];
  assert.equal(run.step(20).hits[0].kind,'kneeler');assert.equal(run.crashes,1);
  run.distance=MONSERRATE.length;assert.equal(run.flawless,false);
});

test('lane changers drift between the two blocked lanes, finish far away and never end in the safe lane',()=>{
  let changers=0;
  for(let seed=1;seed<=60;seed++){
    const run=new MonserrateRun({random:random(seed)});run.distance=500;run.jumps=[];
    for(let i=0;i<40;i++){
      const before=run.npcs.length,wave=run.spawnWave();
      if(!wave.changer)continue;changers++;
      const npc=run.npcs.at(-1);assert.equal(run.npcs.length,before+1);
      assert.notEqual(npc.from,npc.to);assert.ok(wave.blocked.includes(npc.from) && wave.blocked.includes(npc.to));
      assert.ok(!wave.blocked.includes(wave.safeLane));
      // simulate just this walker: it settles in its final lane before it gets close
      const solo=new MonserrateRun();solo.nextWave=Infinity;solo.distance=500;solo.npcs=[{...npc}];
      let settledAt=null;
      while(solo.npcs.length && solo.npcs[0].z>0){solo.step(20,0);const n=solo.npcs[0];if(n && settledAt===null && n.lane===n.to)settledAt=n.z;}
      assert.ok(settledAt>8,`seed ${seed}: settles at z=${settledAt}`);
      run.npcs=[];
    }
  }
  assert.ok(changers>100,'lane changers are common in the second part of the climb');
});

test('jump: an arc from the ground, no double jump, slower steering in the air',()=>{
  const run=new MonserrateRun();run.nextWave=Infinity;run.distance=20;
  assert.equal(run.airborne,false);assert.equal(run.jump(),true);assert.equal(run.jump(),false,'no double jump');
  run.step(MONSERRATE_JUMP.ms/2,0);assert.ok(run.jumpHeight>.95);
  const air=run.x;run.step(100,1);const airMove=run.x-air;
  run.step(MONSERRATE_JUMP.ms,0);assert.equal(run.airborne,false);assert.equal(run.jumpHeight,0);
  const ground=run.x=0;run.step(100,1);assert.ok(airMove<run.x-ground,'steering is softer in the air');
});

test('broken stairs: falling in hurts and climbs out on the far side, a timed jump clears it',()=>{
  const gap=TRAIL_JUMPS.find(j=>j.kind==='gap');
  const fall=new MonserrateRun();fall.nextWave=Infinity;fall.distance=gap.at-1;
  let events={falls:[]};while(fall.distance<gap.at+gap.length+1)events=fall.step(20,0),events.falls.length&&(fall.fell=events.falls[0]);
  assert.equal(fall.fell.id,gap.id);assert.equal(fall.crashes,1);assert.ok(fall.slowUntil>fall.elapsed-700);
  const hop=new MonserrateRun();hop.nextWave=Infinity;hop.distance=gap.at-(hop.speed*MONSERRATE_JUMP.ms/1000-gap.length)/2;hop.jump();
  const jumped=[];while(hop.distance<gap.at+gap.length+1)jumped.push(...hop.step(20,0).jumped);
  assert.deepEqual(jumped.map(j=>j.id),[gap.id]);assert.equal(hop.crashes,0);
  for(const jump of TRAIL_JUMPS.filter(j=>j.kind==='gap'))assert.ok(MONSERRATE.startSpeed*.65*MONSERRATE_JUMP.ms/1000>jump.length+1,'even slowed, a jump spans every gap');
});

test('logs: full-width trunks must be jumped, partial ones can also be steered around',()=>{
  const full=TRAIL_JUMPS.find(j=>j.kind==='log' && j.lanes.length===3),part=TRAIL_JUMPS.find(j=>j.kind==='log' && j.lanes.length<3);
  for(const x of [-1,0,1]){const run=new MonserrateRun();run.nextWave=Infinity;run.distance=full.at-.3;run.x=x;assert.equal(run.step(50).hits[0]?.kind,'log');}
  const free=[-1,0,1].find(l=>!part.lanes.includes(l)),[left,right]=logSpan(part);
  assert.ok(free<left-.3 || free>right+.3);
  const around=new MonserrateRun();around.nextWave=Infinity;around.distance=part.at-.3;around.x=free;assert.equal(around.step(50).hits.length,0);
  const over=new MonserrateRun();over.nextWave=Infinity;over.distance=full.at-3;over.jump();
  const out={hits:[],jumped:[]};for(let i=0;i<20;i++){const e=over.step(20);out.hits.push(...e.hits);out.jumped.push(...e.jumped);}
  assert.equal(out.hits.length,0);assert.equal(out.jumped[0].id,full.id);
});

test('walkers never share the stretch around a jump, and jump features avoid the vendor stands',()=>{
  for(let seed=1;seed<=30;seed++){
    const run=new MonserrateRun({random:random(seed)});
    for(const jump of run.jumps){run.distance=jump.at-run.speed*MONSERRATE.spawnDistance/(run.speed-MONSERRATE.walkerSpeed);assert.equal(run.spawnWave(),null);}
  }
  for(const jump of TRAIL_JUMPS){
    assert.ok(TRAIL_VENDORS.every(v=>Math.abs(v.at-jump.at)>12),`${jump.id} clear of vendors`);
    assert.ok(jump.at>60 && jump.at<MONSERRATE.length-60);
  }
  for(let i=1;i<TRAIL_JUMPS.length;i++)assert.ok(TRAIL_JUMPS[i].at-TRAIL_JUMPS[i-1].at>=40,'at least a second between jumps');
});

test('a jump clears kneeling pilgrims but standing walkers still collide',()=>{
  for(const [kind,hits] of [['kneeler',0],['walker',1]]){
    const run=new MonserrateRun();run.nextWave=Infinity;run.distance=30;run.jump();run.step(100);
    run.npcs=[{id:kind,kind,lane:0,z:.05,passed:false}];assert.equal(run.step(20).hits.length,hits);
  }
});

test('near misses pay points and refund part of the dash cooldown; real contact or wide dodges do not',async()=>{
  const {MONSERRATE_CLOSE}=await import('../src/monserrate/MonserrateRun.js');
  const pass=x=>{const run=new MonserrateRun();run.nextWave=Infinity;run.x=x;run.dash();run.elapsed+=MONSERRATE_DASH.ms;const before=run.dashReadyAt;
    run.npcs=[{id:'w',kind:'walker',lane:0,z:.01,passed:false}];const e=run.step(20);return {e,refund:before-run.dashReadyAt};};
  const close=pass(MONSERRATE.hitWidth+.1);assert.equal(close.e.hits.length,0);assert.equal(close.e.close.length,1);
  assert.ok(Math.abs(close.refund-MONSERRATE_DASH.cooldown*MONSERRATE_CLOSE.dashRefund)<1,'dash recharges faster');
  const wide=pass(1);assert.equal(wide.e.close.length,0);assert.equal(wide.refund,0);
  const hit=pass(.1);assert.equal(hit.e.hits.length,1);assert.equal(hit.e.close.length,0);
});
test('the 2400 m climb ramps up: a sparse forest intro, dense stairs, and a final leap near the top',()=>{
  const inRange=(a,b)=>TRAIL_JUMPS.filter(j=>j.at>=a && j.at<b).length;
  assert.ok(inRange(0,697)/697<inRange(697,1507)/810,'the forest is the gentle opening');
  assert.equal(TRAIL_JUMPS.at(-1).kind,'gap');assert.ok(TRAIL_JUMPS.at(-1).at>2200);assert.ok(TRAIL_JUMPS.length>=28);
  for(let i=1;i<TRAIL_JUMPS.length;i++)assert.ok((TRAIL_JUMPS[i].at-TRAIL_JUMPS[i-1].at)/MONSERRATE.endSpeed>.9,'about a second between jumps even at top speed');
});

test('logs and sinkholes draw at every distance with a stub canvas, and the textures are built once from small canvases',async()=>{
  const {drawJumps,makeObstacleTextures}=await import('../src/monserrate/MonserrateObstacles.js');
  const calls=new Map();
  const ctx=new Proxy({},{get:(_,name)=>name==='createLinearGradient'?()=>({addColorStop(){}}):(...args)=>{calls.set(name,(calls.get(name)??0)+1);},set:()=>true});
  const sizes=[];
  const doc={createElement:()=>{const c={width:0,height:0,getContext:()=>ctx};sizes.push(c);return c;}};
  const tex=makeObstacleTextures(doc);assert.equal(sizes.length,2);assert.ok(sizes.every(c=>c.width*c.height<10000));assert.ok(tex.bark && tex.soil);
  const run=new MonserrateRun();
  for(let d=0;d<MONSERRATE.length;d+=7)drawJumps(ctx,run.jumps,d,tex);
  assert.ok(calls.get('drawImage')>100,'bark and soil are sampled');assert.ok(calls.get('ellipse')>10,'sawn log ends are drawn');
});
