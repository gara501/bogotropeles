import {ARCADE,toFrames} from './arcade.js';

// Each entry is a displayed animation frame, a phase and a cancel permission.
export function timeline({startup,active,recovery,startupPose,activePose,recoveryPose,cancelFrames=0}) {
  const frames=[];
  for(const [phase,count,pose] of [['startup',startup,startupPose],['active',active,activePose],['recovery',recovery,recoveryPose]])
    for(let i=0;i<count;i++)frames.push({pose:Array.isArray(pose)?pose[Math.min(pose.length-1,Math.floor(i/count*pose.length))]:pose,phase,cancel:phase==='recovery' && i>=count-cancelFrames});
  return frames;
}
export const PLAYER_ATTACK_FRAMES={
  punch:{startup:6,active:3,recovery:11},punch2:{startup:6,active:3,recovery:11},punch3:{startup:8,active:3,recovery:15},
  kick:{startup:10,active:4,recovery:14},jumpKick:{startup:5,active:5,recovery:12},
  lowKick:{startup:9,active:4,recovery:13},headset:{startup:25,active:5,recovery:20},
  stomp:{startup:18,active:4,recovery:20},iphone:{startup:17,active:1,recovery:24},books:{startup:14,active:1,recovery:14},
  mop:{startup:18,active:4,recovery:20},
};
export const PLAYER_CONTACT_POSES={
  magolita:{punch:10,combo1:10,combo2:14,combo3:25,kick:21,mop:18},
  office:{punch:6,kick:10,iphone:18,combo1:34,combo2:37,combo3:41},student:{punch:6,kick:10,lowKick:14,books:19,combo1:33,combo2:35,combo3:37},
  teleperforman:{punch:9,kick:20,headset:14,combo1:43,combo2:47,combo3:51},gymbro:{punch:8,punch2:6,punch3:10,kick:22,stomp:20},
};
/** A character's 3-hit ground combo: {inputs, animations, ranges?, knockback?}. Gymbro's punchCombo is three punches. */
export function comboFor(character){
  if(character.combo)return character.combo;
  const p=character.punchCombo;return p?{inputs:p.animations.map(()=>'punch'),animations:p.animations}:null;
}
/** The input that continues the combo after `data`, or null. */
export function comboNext(character,data){
  const combo=data?.combo?comboFor(character):null;
  return combo && data.stage<combo.inputs.length-1?combo.inputs[data.stage+1]:null;
}
export function playerAttackData(character,type,stage=0,airborne=false){
  const chain=airborne?null:comboFor(character);
  const combo=chain && chain.inputs[stage]===type?chain:null;
  if(!combo)stage=0;
  const name=combo?combo.animations[stage]:type;
  const art=character.animations[name],base=character.attacks[type];
  if(!art || !base)return null;
  const timing=PLAYER_ATTACK_FRAMES[airborne?'jumpKick':name]??PLAYER_ATTACK_FRAMES[type];
  const pose=PLAYER_CONTACT_POSES[character.texture]?.[name]??art[Math.min(art.length-1,Math.floor(base.hitAt/base.duration*art.length))];
  const contactIndex=art.indexOf(pose);
  const startupPose=type==='stomp'?art.slice(0,2):art.length===1?character.idle:art.slice(0,Math.max(1,contactIndex));
  const recoveryPose=art.length===1?character.idle:type==='stomp'?art.at(-1):art.slice(Math.min(contactIndex+1,art.length-1));
  // Inside a combo only the last strike is a finisher, so the first hits keep the target close for the chain.
  const finisher=combo?stage===combo.animations.length-1:type==='kick' || type===character.special;
  const data={...base,type,stage,finisher,combo:Boolean(combo),lane:ARCADE.body.lane,
    ...(combo?.ranges?{range:combo.ranges[stage]}:{}),
    knockback:finisher?(combo && stage===combo.animations.length-1?combo.knockback??ARCADE.attack.finisherKnockback:base.finisherKnockback??ARCADE.attack.finisherKnockback):ARCADE.attack.knockback,
    stun:ARCADE.attack.stun*ARCADE.clock.stepMs,
    frames:timeline({...timing,startupPose,activePose:pose,recoveryPose,
      cancelFrames:combo && stage<combo.animations.length-1?ARCADE.input.comboCancelFrames:0})};
  // Link punches keep a confirmed target in range for the next strike.
  if(combo && stage<combo.animations.length-1)data.knockback=0;
  return data;
}
/** Summon gesture: wind-up poses, the call (minions appear), recovery poses. */
export function enemySummonData(config){
  const m=config.summon,art=m.poses,hit=m.hitFrame??Math.floor(art.length/2);
  return {damage:0,range:0,lane:ARCADE.body.lane,finisher:false,summon:true,
    frames:timeline({startup:toFrames(m.windup),active:2,recovery:toFrames(m.recovery),startupPose:art.slice(0,Math.max(1,hit)),activePose:art[hit],recoveryPose:art.slice(hit+1).length?art.slice(hit+1):config.idle})};
}
/** Palomera's pigeon cloud: arms up (wind-up poses), release, arms down. */
export function enemyFlockData(config){
  const f=config.flock,art=f.poses,hit=f.hitFrame??Math.floor(art.length/2);
  return {damage:0,range:0,lane:ARCADE.body.lane,finisher:false,flock:true,
    frames:timeline({startup:toFrames(f.windup),active:2,recovery:toFrames(f.recovery),startupPose:art.slice(0,Math.max(1,hit)),activePose:art[hit],recoveryPose:art.slice(hit+1).length?art.slice(hit+1):config.idle})};
}
/** Ranged throw (e.g. the level 1 boss's football): wind-up poses, release pose, follow-through. */
export function enemyThrowData(config,damageScale=1){
  const t=config.throw,art=config.animations.throw,hit=t.hitFrame??Math.floor(art.length/2);
  return {damage:Math.max(1,Math.round(t.damage*damageScale)),range:t.maxRange,lane:ARCADE.body.lane,finisher:false,throw:true,
    frames:timeline({startup:toFrames(t.windup),active:t.active??2,recovery:toFrames(t.recovery),
      startupPose:art.slice(0,Math.max(1,hit)),activePose:art[hit],recoveryPose:art.slice(hit+1).length?art.slice(hit+1):config.idle})};
}
export function enemyAttackData(config,stage=0){
  const combo=config.combo,art=config.animations[combo?`attack${stage+1}`:'attack'];
  const tuning=config.attackFrames??ARCADE.ai;
  const startup=combo?toFrames(stage?combo.interval:combo.windup):tuning.startup??tuning.windup;
  const active=tuning.active,recovery=combo?toFrames(combo.recovery):tuning.recovery;
  // hitFrames: per-stage contact pose (each slash of a boss combo strikes on a different drawing).
  const hit=combo?.hitFrames?.[stage]??combo?.hitFrame??Math.floor(art.length/2);
  return {damage:config.damage,range:combo?.ranges?.[stage]??tuning.range??config.range,lane:tuning.lane??ARCADE.body.lane,
    startup,active,recovery,finisher:Boolean(combo && stage===(combo.stages??ARCADE.ai.comboStages)-1),
    frames:timeline({startup,active,recovery,startupPose:art.slice(0,Math.max(1,hit)),activePose:art[hit],
      recoveryPose:(combo?.followThrough??config.followThrough) && hit<art.length-1?art.slice(hit+1):config.idle??art.at(-1)})};
}
