import {trailOffset,TRAIL_VENDORS,TRAIL_JUMPS,logSpan} from './MonserrateTrail.js';

// 2400 m at 30→48 m/s (~62 s): much longer and faster than the first 1100 m / 22→36 version. Walkers spawn further
// out (165 m) so even the top speed leaves over 3 s to read a wave; waves also come closer together.
export const MONSERRATE={length:3400,startSpeed:60,endSpeed:90,walkerSpeed:1.8,kneelerSpeed:.78,steerSpeed:7.5,
  spawnDistance:165,changerChance:.35,changeSpeed:2.4,hitWidth:.32,damage:18,invulnerability:1200,finishPoints:2500,gapDamage:25,logDamage:18};
// Dash (SHIFT / touch »): a short burst of speed and sharper steering, then a recharge.
export const MONSERRATE_DASH={ms:1000,cooldown:3600,speed:1.2,steer:1.4,dodgePoints:60};
// Near miss: passing a walker, pilgrim, vendor or log within `margin` lane units of contact pays points and
// refunds part of the dash cooldown, so risky lines are rewarded (racing-game boost-for-close-calls).
export const MONSERRATE_CLOSE={margin:.2,points:40,dashRefund:.3};
// Jump (SPACE / ↑ / touch SALTO / pad A): clears broken stairs, fallen logs and kneeling pilgrims, never standing walkers.
export const MONSERRATE_JUMP={ms:600,height:110,airSteer:.6,points:50,warn:2.2};
export const LANES=[-1,0,1];
export const npcTravelSpeed=npc=>npc.kind==='kneeler'?MONSERRATE.kneelerSpeed:MONSERRATE.walkerSpeed;
export function projectHiker(lane,z,distance){
  const scale=1/(1+Math.max(-4,z)/12);
  return {x:480+(distance===undefined?0:trailOffset(distance,z))+lane*180*scale,y:156+314*scale,scale};
}

/** World metres and lane units; no renderer or wall-clock dependency. */
export class MonserrateRun{
  constructor({random=Math.random}={}){
    this.random=random;this.elapsed=0;this.distance=0;this.x=0;this.npcs=[];this.waveId=0;
    this.nextWave=1500;this.safeLane=0;this.invulnerableUntil=0;this.slowUntil=0;this.dodged=0;
    this.vendors=TRAIL_VENDORS.map(vendor=>({...vendor,passed:false,hit:false}));
    this.dashUntil=0;this.dashReadyAt=0;
    this.crashes=0;this.jumpStart=-Infinity;this.jumps=TRAIL_JUMPS.map(jump=>({...jump,passed:false,hit:false}));this.cleared=0;
  }
  get dashing(){return this.elapsed<this.dashUntil;}
  get dashReady(){return !this.done && this.elapsed>=this.dashReadyAt;}
  /** 0 → just used, 1 → ready. */
  get dashCharge(){return this.dashReady?1:Math.max(0,Math.min(1,1-(this.dashReadyAt-this.elapsed)/MONSERRATE_DASH.cooldown));}
  dash(){
    if(!this.dashReady)return false;
    this.dashUntil=this.elapsed+MONSERRATE_DASH.ms;this.dashReadyAt=this.elapsed+MONSERRATE_DASH.cooldown;return true;
  }
  get airborne(){return this.elapsed<this.jumpStart+MONSERRATE_JUMP.ms;}
  /** 0..1 height of the jump arc. */
  get jumpHeight(){if(!this.airborne)return 0;const t=(this.elapsed-this.jumpStart)/MONSERRATE_JUMP.ms;return Math.sin(Math.PI*t);}
  jump(){if(this.done || this.airborne)return false;this.jumpStart=this.elapsed;return true;}
  /** Next jump feature still ahead, with its time to arrival. */
  nextJump(){const f=this.jumps.find(j=>!j.passed && j.at+j.length>=this.distance);return f?{...f,eta:(f.at-this.distance)/this.speed}:null;}
  get progress(){return Math.min(1,this.distance/MONSERRATE.length);}
  get done(){return this.progress===1;}
  get flawless(){return this.done && this.crashes===0;}
  get speed(){return (MONSERRATE.startSpeed+(MONSERRATE.endSpeed-MONSERRATE.startSpeed)*this.progress)*(this.elapsed<this.slowUntil?.65:1)*(this.dashing?MONSERRATE_DASH.speed:1);}
  get interval(){return this.progress<.12?900:this.progress<.35?780:this.progress<.65?720:690;}
  spawnWave(){
    // Keep walkers away from broken stairs and logs: one problem at a time.
    const contact=this.distance+this.speed*MONSERRATE.spawnDistance/(this.speed-MONSERRATE.walkerSpeed);
    if(this.jumps.some(j=>!j.passed && contact>j.at-this.speed*.9 && contact<j.at+j.length+this.speed*.6))return null;
    const choices=LANES.filter(l=>Math.abs(l-this.safeLane)<=1);
    this.safeLane=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];
    const arrival=this.distance+this.speed*MONSERRATE.spawnDistance/(this.speed-MONSERRATE.walkerSpeed);
    const vendorNear=this.vendors.some(v=>!v.passed && Math.abs(v.at-arrival)<this.speed*1.15);
    if(vendorNear)this.safeLane=0;
    let blocked=LANES.filter(l=>l!==this.safeLane);
    // Introduce one walker at a time. Later pairs still leave an entire lane open.
    if(this.progress<.12 || this.waveId%9===8)blocked=[blocked[Math.floor(this.random()*blocked.length)]];
    const wave=++this.waveId;
    const kneeling=wave%3===2;
    const kind=kneeling?'kneeler':'walker';
    // Match time-to-contact across slow and normal groups, keeping wave order
    // and reachable gaps while the two populations have different world speeds.
    const spawnZ=MONSERRATE.spawnDistance*(this.speed-(kneeling?MONSERRATE.kneelerSpeed:MONSERRATE.walkerSpeed))/(this.speed-MONSERRATE.walkerSpeed);
    // Lane changer: one walker that drifts from one blocked lane into the other while still far away,
    // so its final lane is readable and the safe lane stays free at contact.
    if(!kneeling && this.progress>.15 && blocked.length===2 && !vendorNear && this.random()<MONSERRATE.changerChance){
      const [from,to]=this.random()<.5?blocked:[blocked[1],blocked[0]];
      this.npcs.push({id:`${wave}:x`,wave,kind,lane:from,from,to,changeAt:MONSERRATE.spawnDistance*(.62+this.random()*.08),
        z:MONSERRATE.spawnDistance,variant:Math.floor(this.random()*8),born:this.elapsed,passed:false,hit:false});
      return {wave,safeLane:this.safeLane,blocked,changer:true};
    }
    for(const lane of blocked)this.npcs.push({id:`${wave}:${lane}`,wave,kind,lane,z:spawnZ,
      variant:Math.floor(this.random()*(kneeling?4:8)),born:this.elapsed,passed:false,hit:false});
    return {wave,safeLane:this.safeLane,blocked,kneeling};
  }
  /** Passed without contact: was it a close call? Refunds part of the dash cooldown. */
  closeCall(item,crossingX,width,events){
    if(Math.abs(crossingX-item.lane)-width>=MONSERRATE_CLOSE.margin)return;
    item.close=true;this.closeCalls=(this.closeCalls??0)+1;events.close.push(item);
    if(!this.dashReady)this.dashReadyAt=Math.max(this.elapsed,this.dashReadyAt-MONSERRATE_DASH.cooldown*MONSERRATE_CLOSE.dashRefund);
  }
  respawn(){
    this.npcs=this.npcs.filter(n=>n.z>18);this.x=0;this.invulnerableUntil=this.elapsed+2200;this.slowUntil=0;
    this.nextWave=Math.max(this.nextWave,this.elapsed+1400);this.jumpStart=-Infinity;
    for(const jump of this.jumps)if(!jump.passed && this.distance>=jump.at-4){jump.passed=true;this.distance=Math.max(this.distance,jump.at+jump.length+.5);}
  }
  step(milliseconds,steer=0){
    const events={hits:[],passed:[],waves:[],falls:[],jumped:[],close:[]};
    let remaining=Math.max(0,Math.min(milliseconds,250));
    // Substeps make collision and wave timing stable at both 30 and 144 Hz.
    while(remaining>0 && !this.done){
      const ms=Math.min(remaining,20),dt=ms/1000,oldX=this.x;remaining-=ms;
      this.elapsed+=ms;this.x=Math.max(-1,Math.min(1,this.x+Math.max(-1,Math.min(1,steer))*MONSERRATE.steerSpeed*(this.dashing?MONSERRATE_DASH.steer:1)*(this.airborne?MONSERRATE_JUMP.airSteer:1)*dt));
      const speed=this.speed,previousDistance=this.distance;this.distance=Math.min(MONSERRATE.length,this.distance+speed*dt);
      if(this.elapsed>=this.nextWave && this.distance<MONSERRATE.length-42){const wave=this.spawnWave();if(wave){events.waves.push(wave);this.nextWave=this.elapsed+this.interval;}else this.nextWave=this.elapsed+200;}
      for(const npc of this.npcs){
        const previous=npc.z;npc.z-=(speed-npcTravelSpeed(npc))*dt;
        if(npc.to!==undefined && npc.lane!==npc.to && npc.z<=npc.changeAt){
          const step=MONSERRATE.changeSpeed*dt*Math.sign(npc.to-npc.lane);
          npc.lane=Math.abs(npc.to-npc.lane)<=Math.abs(step)?npc.to:npc.lane+step;
        }
        if(!npc.passed && previous>=0 && npc.z<=0){
          const crossingX=oldX+(this.x-oldX)*(previous/(previous-npc.z));npc.passed=true;
          if(npc.kind==='kneeler' && this.airborne){this.dodged++;npc.jumped=true;npc.dashed=this.dashing;events.passed.push(npc);}
          else if(Math.abs(crossingX-npc.lane)<MONSERRATE.hitWidth){
            this.crashes++;
            if(this.elapsed>=this.invulnerableUntil){npc.hit=true;this.invulnerableUntil=this.elapsed+MONSERRATE.invulnerability;this.slowUntil=this.elapsed+300;events.hits.push(npc);}
          }else{this.dodged++;npc.dashed=this.dashing;events.passed.push(npc);this.closeCall(npc,crossingX,MONSERRATE.hitWidth,events);}
        }
      }
      for(const vendor of this.vendors){
        if(vendor.passed || vendor.at<previousDistance || vendor.at>this.distance)continue;
        vendor.passed=true;
        const fraction=(vendor.at-previousDistance)/(this.distance-previousDistance);
        const crossingX=oldX+(this.x-oldX)*fraction;
        if(Math.abs(crossingX-vendor.lane)<vendor.hitWidth){
          this.crashes++;
          if(this.elapsed>=this.invulnerableUntil){vendor.hit=true;this.invulnerableUntil=this.elapsed+MONSERRATE.invulnerability;this.slowUntil=this.elapsed+300;events.hits.push(vendor);}
        }else{this.dodged++;vendor.dashed=this.dashing;events.passed.push(vendor);this.closeCall(vendor,crossingX,vendor.hitWidth,events);}
      }
      for(const jump of this.jumps){
        if(jump.passed)continue;
        if(jump.kind==='gap'){
          if(this.distance<jump.at)continue;
          if(previousDistance>jump.at+jump.length){jump.passed=true;continue;} // moved past it without crossing (tests, respawn)
          if(!this.airborne && this.distance<jump.at+jump.length){
            // fell in: climb out on the far side, slowed and hurt
            jump.passed=jump.hit=true;this.distance=Math.min(MONSERRATE.length,jump.at+jump.length+.5);this.slowUntil=this.elapsed+700;
            this.crashes++;if(this.elapsed>=this.invulnerableUntil){this.invulnerableUntil=this.elapsed+MONSERRATE.invulnerability;events.falls.push(jump);}
          }else if(this.distance>=jump.at+jump.length){jump.passed=true;this.cleared++;events.jumped.push(jump);}
          continue;
        }
        if(jump.at<previousDistance){jump.passed=true;continue;}
        if(jump.at>this.distance)continue;
        jump.passed=true;
        const crossingX=oldX+(this.x-oldX)*((jump.at-previousDistance)/(this.distance-previousDistance));
        const [left,right]=logSpan(jump);
        if(this.airborne){this.cleared++;events.jumped.push(jump);}
        else if(crossingX>left-.18 && crossingX<right+.18){
          this.crashes++;
          if(this.elapsed>=this.invulnerableUntil){jump.hit=true;this.invulnerableUntil=this.elapsed+MONSERRATE.invulnerability;this.slowUntil=this.elapsed+450;events.hits.push(jump);}
        }else{this.dodged++;jump.dashed=this.dashing;events.passed.push(jump);}
      }
      this.npcs=this.npcs.filter(n=>n.z>-5);
    }
    return events;
  }
}
