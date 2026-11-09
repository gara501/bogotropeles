import {matchingRoutes,sequenceOptions,comboSpeed,COMBO_FINISH,routeAnimations} from './comboRoutes.js';
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
  kick1:{startup:7,active:3,recovery:10},kick2:{startup:8,active:3,recovery:11},
  kick3:{startup:9,active:3,recovery:12},kick4:{startup:12,active:4,recovery:20},
  airDashKick:{startup:4,active:8,recovery:9},
  lowKick:{startup:9,active:4,recovery:13},slide:{startup:6,active:10,recovery:14},shoulder:{startup:6,active:10,recovery:14},headset:{startup:25,active:5,recovery:20},
  stomp:{startup:18,active:4,recovery:20},iphone:{startup:17,active:1,recovery:24},books:{startup:14,active:1,recovery:14},
  mop:{startup:18,active:4,recovery:20},
};
export const PLAYER_CONTACT_POSES={
  magolita:{slide:53,punch:10,combo1:10,combo2:14,combo3:25,kick:67,kick1:67,kick2:71,kick3:75,kick4:79,mop:18},
  office:{punch:6,kick:10,iphone:18,combo1:34,combo2:37,combo3:41,slide:86},student:{slide:54,punch:6,kick:68,kick1:68,kick2:72,kick3:76,airDashKick:80,lowKick:14,books:19,combo1:33,combo2:35,combo3:37},
  teleperforman:{slide:89,punch:9,kick:20,headset:14,combo1:43,combo2:47,combo3:51},gymbro:{shoulder:46,punch:8,punch2:6,punch3:10,kick:22,stomp:20},
};
/** A character's ground combo: {inputs, animations, ranges?, damages?, knockback?}. */
export function comboFor(character,chain){
  if(chain==='dash')return character.dashCombo??null; // dash + K opener (GOMELO's slide → punch → punch)
  if(character.comboRoutes)return null; // retired ground chains must not reappear as a fallback
  if(chain==='kick')return character.kickCombo??null;
  if(character.combo)return character.combo;
  const p=character.punchCombo;return p?{inputs:p.animations.map(()=>'punch'),animations:p.animations}:null;
}
/** The input that continues the combo after `data`, or null. */
export function comboNext(character,data){
  if(data?.path)return sequenceOptions(data,character)[0]??null;
  const combo=data?.combo?comboFor(character,data.chain):null;
  return combo && data.stage<combo.inputs.length-1?combo.inputs[data.stage+1]:null;
}
export function comboOptions(character,data){return data?.path?sequenceOptions(data,character):[comboNext(character,data)].filter(Boolean);}
function sequenceAttack(character,type,stage,route){
  const path=Array.isArray(route)?route:[type],matches=matchingRoutes(path,character);
  if(!matches.length)return null;
  const name=routeAnimations(character,matches[0])[path.length-1],art=character.animations[name];
  if(!art)return null;
  const base=character.attacks[type]??character.attacks[type==='upperPunch'?'punch':'kick'];
  const kickIndex=path.filter(input=>input==='kick'||input==='lowKick').length-1;
  const damage=type==='kick'||type==='lowKick'?character.kickCombo?.damages?.[kickIndex]??base.damage:base.damage;
  const finisher=matches.some(r=>r.inputs.length===path.length),more=sequenceOptions({path},character).length>0;
  const timing=PLAYER_ATTACK_FRAMES[type==='upperPunch'?'punch3':type==='lowKick'?'kick4':type==='punch'?`punch${path.length===1?'':Math.min(3,path.length)}`:'kick'];
  const speed=comboSpeed(path.length-1,finisher);
  const timingScale=character.comboTimingScales?.[name]??1;
  // Keep every active tick; speed up anticipation/recovery without skipping contact.
  // The finisher snaps out (short anticipation) and keeps its full follow-through, so it reads as a heavier blow.
  const accelerated={...timing,startup:Math.max(3,Math.ceil(timing.startup/speed*timingScale)),recovery:Math.ceil(timing.recovery*timingScale)};
  return {...base,type,impactType:character.comboImpactTypes?.[name]??type,impactSound:character.comboImpactSounds?.[name],stage:path.length-1,chain:'sequence',path,combo:true,comboSpeed:speed,finisher,knockdown:finisher,
    damage:Math.round(damage*(type==='upperPunch'?1.4:1)*(finisher && path.length>1?COMBO_FINISH.damage:1)),
    range:character.comboRanges?.[name]??(type==='upperPunch'?125:type==='lowKick'?120:type==='kick'?character.kickCombo?.ranges?.[kickIndex]??base.range:base.range),
    knockback:finisher?30:0,stun:ARCADE.attack.stun*ARCADE.clock.stepMs,lane:character.comboLanes?.[name]??ARCADE.body.lane,
    comboEffect:type==='upperPunch'?'explosion':type==='lowKick' && finisher?'sweep':null,
    frames:timeline({...accelerated,startupPose:art.slice(0,2),activePose:art[2],recoveryPose:art.slice(3),cancelFrames:more?ARCADE.input.comboCancelFrames:0})};
}
export function playerAttackData(character,type,stage=0,airborne=false,route){
  if(airborne && type==='kick' && character.animations.airKick){
    const art=character.animations.airKick,base=character.attacks.kick;
    const style=character.airKickStyle; // e.g. Teleperforman's mid-air headset lash
    return {...base,type,stage:0,finisher:true,combo:false,lane:ARCADE.body.lane,
      ...(style?{impactType:style.impactType,impactSound:style.sound,range:style.range??base.range}:{}),
      knockback:base.finisherKnockback??ARCADE.attack.finisherKnockback,stun:ARCADE.attack.stun*ARCADE.clock.stepMs,
      frames:timeline({...PLAYER_ATTACK_FRAMES.jumpKick,startupPose:art[0],activePose:art.slice(1,3),recoveryPose:art[3]})};
  }
  if(character.comboRoutes && !airborne && route!=='dash' && ['punch','kick','lowKick','upperPunch'].includes(type)){
    const sequence=sequenceAttack(character,type,stage,route);if(sequence)return sequence;
    if(Array.isArray(route))return null;
    if(type==='upperPunch')type='punch';
  }
  if(!character.comboRoutes && !airborne && !route && type==='kick' && character.kickCombo)route='kick';
  const chain=airborne?null:comboFor(character,route);
  const combo=chain && chain.inputs[stage]===type?chain:null;
  if(combo && !route && character.kickCombo)route='ground';
  if(!combo)stage=0;
  const name=combo?combo.animations[stage]:type;
  const art=character.animations[name],base=character.attacks[type];
  if(!art || !base)return null;
  const timing=PLAYER_ATTACK_FRAMES[type==='airDashKick'?'airDashKick':airborne?'jumpKick':name]??PLAYER_ATTACK_FRAMES[type];
  const pose=PLAYER_CONTACT_POSES[character.texture]?.[name]??art[Math.min(art.length-1,Math.floor(base.hitAt/base.duration*art.length))];
  const contactIndex=art.indexOf(pose);
  const startupPose=type==='stomp'?art.slice(0,2):art.length===1?character.idle:art.slice(0,Math.max(1,contactIndex));
  const recoveryPose=art.length===1?character.idle:type==='stomp'?art.at(-1):art.slice(Math.min(contactIndex+1,art.length-1));
  // Inside a combo only the last strike is a finisher, so the first hits keep the target close for the chain.
  const finisher=combo?stage===combo.animations.length-1:type==='kick' || type==='airDashKick' || type===character.special;
  const data={...base,type,stage,finisher,combo:Boolean(combo),...(combo && route?{chain:route}:{}),lane:ARCADE.body.lane,
    ...(combo?.damages?{damage:combo.damages[stage]}:{}),
    ...(combo?.ranges?{range:combo.ranges[stage]}:{}),
    knockback:finisher?(combo && stage===combo.animations.length-1?combo.knockback??ARCADE.attack.finisherKnockback:base.finisherKnockback??ARCADE.attack.finisherKnockback):ARCADE.attack.knockback,
    stun:ARCADE.attack.stun*ARCADE.clock.stepMs,
    frames:timeline({...timing,startupPose,activePose:base.activePoses??pose,recoveryPose:base.recoveryPoses??recoveryPose,
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
