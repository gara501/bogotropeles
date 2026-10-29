import {ARCADE} from '../data/arcade.js';
import {timeline} from '../data/attacks.js';

export const PANELA={speed:670,damageMultiplier:2,spawnChance:.55,lifetime:90,lane:24,width:30,breakFrames:25};
export function handItemFor(level){
  if(!level || level.total<=0 || ['cycling','ring'].includes(level.mode))return null;
  return level.combatIndex===0?'vuvuzela':'panela';
}
export function panelaAttack(data,character){
  return {...data,weapon:'panela',projectile:true,combo:false,stage:0,finisher:false,
    damage:character.attacks.punch.damage*PANELA.damageMultiplier,
    frames:timeline({startup:15,active:1,recovery:15,startupPose:data.frames[0].pose,
      activePose:data.frames.find(f=>f.phase==='active').pose,recoveryPose:data.frames.at(-1).pose})
      .map((f,i)=>({...f,weaponPose:i<9?5:i<15?6:i<22?7:8}))};
}
/** Swept collision prevents fast bricks passing through a target between ticks. */
export function panelaTouches(previous,current,shot,target){
  const half=target.config?.hurtbox?.halfWidth??ARCADE.body.halfWidth;
  return target.hp>0 && (target.z??0)<ARCADE.body.airborneAvoidHeight
    && Math.abs(shot.y-target.y)<PANELA.lane
    && target.x+half>=Math.min(previous,current)-PANELA.width/2
    && target.x-half<=Math.max(previous,current)+PANELA.width/2;
}
