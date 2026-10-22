export const CYCLING={duration:90000,speed:650,steerSpeed:300,playerX:230,top:305,bottom:475,
  lanes:[315,390,465],invulnerability:1400,finishPoints:1500,cardPoints:1000,pixelsPerMeter:52,changuaProgress:.58};
export const GUARDIAN={firstMeters:120,spacingMeters:140,approachSeconds:2.1,windup:500,crossing:900,encounterGap:3400};
export const CYCLING_DASH={duration:3000,cooldown:5000,multiplier:2.2};
export const CYCLING_PHASES=[
  {until:12000,label:'CALENTAMIENTO',interval:2300,count:1,sway:0,follow:0,speedMultiplier:1},
  {until:30000,label:'TRÁFICO',interval:1750,count:2,sway:0,follow:0,speedMultiplier:1},
  {until:45000,label:'SLALOM',interval:1450,count:2,sway:10,follow:.5,speedMultiplier:1},
  {until:67500,label:'HORA PICO',interval:1100,count:2,sway:12,follow:1,followers:2,cyclists:.75,speedMultiplier:1.35},
  {until:Infinity,label:'TRÁFICO INTENSO',interval:900,count:2,sway:14,follow:1,followers:2,cyclists:.8,speedMultiplier:1.5},
];
export const OBSTACLES={
  cyclist:{damage:18,halfWidth:52,depth:25,speed:240,frameMs:70},
  dog:{damage:12,halfWidth:30,depth:23,speed:180,frameMs:65},
  hole:{damage:22,halfWidth:34,depth:21,speed:0},
  guardian:{damage:22,halfWidth:26,depth:25,speed:0,frameMs:100},
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const obstacleHits=(previousX,obstacle,y)=>!obstacle.hit && Math.abs(obstacle.y-y)<OBSTACLES[obstacle.kind].depth
  && CYCLING.playerX+44>=Math.min(previousX,obstacle.x)-OBSTACLES[obstacle.kind].halfWidth
  && CYCLING.playerX-44<=Math.max(previousX,obstacle.x)+OBSTACLES[obstacle.kind].halfWidth;

/** Automatic forward travel with an optional boost; only vertical steering. */
export class CyclingRun{
  constructor(random=Math.random){this.random=random;this.elapsed=0;this.extraDistance=0;this.dashUntil=0;this.dashReadyAt=0;this.y=390;this.obstacles=[];this.pickups=[];this.cardsCollected=0;this.changuaSpawned=false;this.nextPickup=3500;this.nextWave=2000;this.nextGuardianMeters=GUARDIAN.firstMeters;this.guardianUntil=0;this.nextId=0;this.invulnerableUntil=0;this.done=false;this.safeLane=1;}
  // Extra distance includes both the second-half acceleration and the optional dash.
  get roadOffset(){return this.elapsed/1000*CYCLING.speed+this.extraDistance;}
  get remainingDistance(){const remaining=CYCLING.duration/1000*CYCLING.speed-this.roadOffset;return remaining<1e-6?0:remaining;}
  get remainingMs(){
    let from=this.roadOffset,remaining=0;
    for(const phase of CYCLING_PHASES){
      const end=Math.min(CYCLING.duration,phase.until)/1000*CYCLING.speed;
      if(end>from){remaining+=(end-from)/(CYCLING.speed*phase.speedMultiplier)*1000;from=end;}
    }
    return remaining;
  }
  get progress(){return this.remainingDistance<1e-6?1:this.roadOffset/(CYCLING.duration/1000*CYCLING.speed);}
  get distance(){return this.roadOffset/CYCLING.pixelsPerMeter;}
  get difficulty(){return CYCLING_PHASES.find(phase=>this.progress*CYCLING.duration+1e-6<phase.until);}
  get speed(){return CYCLING.speed*this.difficulty.speedMultiplier;}
  get dashing(){return !this.done && this.elapsed+1e-7<this.dashUntil;}
  get dashRemaining(){return this.dashing?this.dashUntil-this.elapsed:0;}
  get dashCooldown(){return Math.max(0,this.dashReadyAt-this.elapsed);}
  startDash(){
    if(this.done || this.dashing || this.dashCooldown>0)return false;
    this.dashUntil=this.elapsed+CYCLING_DASH.duration;this.dashReadyAt=this.dashUntil+CYCLING_DASH.cooldown;return true;
  }
  spawnWave(){
    if(this.distance>=this.nextGuardianMeters){
      this.spawnGuardian();this.nextGuardianMeters=this.distance+GUARDIAN.spacingMeters;
      this.guardianUntil=this.elapsed+GUARDIAN.encounterGap;return;
    }
    const phase=this.difficulty;
    const options=[0,1,2].filter(lane=>Math.abs(lane-this.safeLane)<=1);
    this.safeLane=options[Math.min(options.length-1,Math.floor(this.random()*options.length))];
    const blocked=[0,1,2].filter(lane=>lane!==this.safeLane);
    if(this.random()<.5)blocked.reverse();
    const spawn=(lane,delay=0)=>{
      const roll=this.random(),cyclists=phase.cyclists??.45,kind=roll<cyclists?'cyclist':roll<cyclists+(1-cyclists)*.5?'dog':'hole';
      // Different approach speeds, same arrival window: a full lane remains traversable between groups.
      const speed=this.speed+OBSTACLES[kind].speed;
      this.obstacles.push({id:this.nextId++,kind,variant:Math.floor(this.random()*3),x:CYCLING.playerX+speed*(1.65+delay),
        y:CYCLING.lanes[lane],lane,born:this.elapsed,sway:kind==='hole'?0:phase.sway,hit:false});
    };
    for(const lane of blocked.slice(0,phase.count))spawn(lane);
    if(phase.follow && this.random()<phase.follow){
      for(const lane of phase.followers===2?blocked:[blocked[Math.floor(this.random()*blocked.length)]])spawn(lane,.32);
    }
    if(!this.changuaSpawned && this.progress>=CYCLING.changuaProgress){
      this.pickups.push({id:this.nextId++,kind:'full',x:CYCLING.playerX+this.speed*1.75,y:CYCLING.lanes[this.safeLane]});
      this.changuaSpawned=true;
    }
    if(this.elapsed>=this.nextPickup){
      this.spawnCards(this.safeLane);this.nextPickup=this.elapsed+5000+this.random()*2500;
    }
  }
  spawnGuardian(){
    const lane=CYCLING.lanes.reduce((nearest,y,i)=>Math.abs(y-this.y)<Math.abs(CYCLING.lanes[nearest]-this.y)?i:nearest,0);
    const targetY=CYCLING.lanes[lane],startY=targetY>=390?CYCLING.top-18:CYCLING.bottom+18;
    const guardian={id:this.nextId++,kind:'guardian',x:CYCLING.playerX+this.speed*GUARDIAN.approachSeconds,
      y:startY,startY,targetY,lane,born:this.elapsed,hit:false};
    this.obstacles.push(guardian);
    // Keep another reachable lane available while this crossing replaces a normal traffic group.
    this.safeLane=lane===0?1:lane===2?1:this.random()<.5?0:2;
    return guardian;
  }
  spawnCards(lane){
    const count=1+Math.floor(this.random()*3),y=clamp(CYCLING.lanes[lane]+(this.random()-.5)*16,CYCLING.top+8,CYCLING.bottom-8);
    for(let i=0;i<count;i++)this.pickups.push({id:this.nextId++,kind:'money',x:CYCLING.playerX+this.speed*1.75+i*105,y});
  }
  advance(ms){
    const start=this.roadOffset;let remaining=ms;
    // Split at pace changes, dash end and finish so all road-bound objects stay synchronized at any frame rate.
    while(remaining>1e-7 && this.remainingDistance>0){
      const phase=this.difficulty,baseSpeed=this.speed,boost=this.dashing?CYCLING_DASH.multiplier:1;
      const boundary=Math.min(CYCLING.duration,phase.until)/1000*CYCLING.speed;
      const segment=Math.min(remaining,(boundary-this.roadOffset)/(baseSpeed*boost)*1000,
        this.dashing?this.dashRemaining:Infinity);
      if(segment<=1e-7)break;
      this.extraDistance+=(baseSpeed*boost-CYCLING.speed)*segment/1000;
      this.elapsed+=segment;remaining-=segment;
    }
    return {ms:ms-remaining,roadMovement:this.roadOffset-start};
  }
  step(ms,steer=0){
    if(this.done)return {hits:[],passed:[],collected:[]};
    ms=Math.max(0,ms);
    const movement=this.advance(ms),roadMovement=movement.roadMovement;ms=movement.ms;
    this.y=clamp(this.y+clamp(steer,-1,1)*CYCLING.steerSpeed*ms/1000,CYCLING.top,CYCLING.bottom);
    // Stop adding obstacles early enough to have a clear finish straight.
    if(this.elapsed>=this.nextWave && this.remainingMs>5000){this.spawnWave();this.nextWave=Math.max(this.elapsed+this.difficulty.interval,this.guardianUntil);}
    const hits=[],passed=[],collected=[];
    for(const obstacle of this.obstacles){
      // Oncoming riders and dogs move relative to the road; potholes belong to the ground.
      const previous=obstacle.x;obstacle.x-=roadMovement+OBSTACLES[obstacle.kind].speed*ms/1000;
      if(obstacle.kind==='guardian' && obstacle.targetY!==undefined){
        const crossing=clamp((this.elapsed-obstacle.born-GUARDIAN.windup)/GUARDIAN.crossing,0,1);
        obstacle.y=obstacle.startY+(obstacle.targetY-obstacle.startY)*crossing;
      }
      if(obstacle.sway)obstacle.y=CYCLING.lanes[obstacle.lane]+Math.sin((this.elapsed-obstacle.born)/230)*obstacle.sway;
      if(obstacleHits(previous,obstacle,this.y)){
        obstacle.hit=true;
        if(this.elapsed>=this.invulnerableUntil){hits.push(obstacle);this.invulnerableUntil=this.elapsed+CYCLING.invulnerability;}
      }
      if(!obstacle.passed && obstacle.x<CYCLING.playerX-110){obstacle.passed=true;if(!obstacle.hit)passed.push(obstacle);}
    }
    this.pickups=this.pickups.filter(item=>{
      const previous=item.x;item.x-=roadMovement;
      if(Math.abs(item.y-this.y)<22 && previous>=CYCLING.playerX-62 && item.x<=CYCLING.playerX+62){
        collected.push(item);if(item.kind==='money')this.cardsCollected++;return false;
      }
      return item.x>-80;
    });
    this.obstacles=this.obstacles.filter(o=>o.x>-130);this.done=this.progress===1;
    return {hits,passed,collected};
  }
  respawn(){if(this.dashing)this.dashReadyAt=this.elapsed+CYCLING_DASH.cooldown;this.dashUntil=0;this.y=390;this.obstacles=[];this.pickups=[];this.guardianUntil=0;this.nextWave=this.elapsed+2300;this.nextPickup=Math.max(this.nextPickup,this.elapsed+2500);this.invulnerableUntil=this.elapsed+3000;}
}
