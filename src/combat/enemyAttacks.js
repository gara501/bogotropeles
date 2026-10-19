import {ENEMY_TIMING,meleeHits} from '../combat.js';
import {ENEMY_ATTACK_SOUNDS} from '../audio/SoundEffects.js';

function playStage(scene,enemy,index,windup) {
  const state=`attack${index+1}`,frames=enemy.config.animations[state];
  scene.play(enemy,state,windup*frames.length/enemy.config.combo.hitFrame);
}

export function beginEnemyAttack(scene,enemy,facing) {
  const now=scene.combatTime,combo=enemy.config.combo,windup=combo?.windup??ENEMY_TIMING.windup;
  const duration=windup+(combo?combo.interval*2+combo.recovery:ENEMY_TIMING.recovery);
  enemy.pending={enemy,release:now+windup,facing,index:0,connected:false,animateAt:0,stageToPlay:0};
  enemy.actionUntil=now+duration;
  enemy.nextHit=now+(combo?.cooldown??(enemy.config.ranged?ENEMY_TIMING.rangedCooldown:ENEMY_TIMING.cooldown))/scene.level.pressure;
  scene.nextGroupAttack=now+Math.max(ENEMY_TIMING.groupSpacing/scene.level.pressure,combo?duration:0);
  if(combo)playStage(scene,enemy,0,windup);else scene.play(enemy,'attack',windup*2);
  enemy.tell.setText(combo?'! ×3':'!').setVisible(true);
  if(enemy.key==='rider')scene.sfx?.play('moto');
}

export function updateEnemyAttack(scene,enemy) {
  const pending=enemy.pending,now=scene.combatTime,combo=enemy.config.combo;
  if(!pending)return;
  if(combo && pending.stageToPlay && now>=pending.animateAt) {
    playStage(scene,enemy,pending.stageToPlay,Math.max(1,pending.release-now));pending.stageToPlay=0;
  }
  if(now<pending.release)return;
  enemy.tell.setVisible(false);
  const sound=ENEMY_ATTACK_SOUNDS[enemy.key];if(sound)scene.sfx?.play(sound);
  if(!combo) {
    enemy.pending=null;
    if(enemy.config.ranged)scene.throwKnife(enemy,pending.facing);
    else if(scene.jumpHeight<25 && meleeHits(enemy,scene.player,pending.facing,enemy.config.range,26))scene.hitPlayer(enemy.config.damage);
    return;
  }
  const range=combo.ranges?.[pending.index]??enemy.config.range;
  const contact=scene.jumpHeight<25 && meleeHits(enemy,scene.player,pending.facing,range,26);
  const connected=contact && scene.hitPlayer(enemy.config.damage,pending);
  if(connected)pending.connected=true;
  const frames=enemy.config.animations[`attack${pending.index+1}`];
  enemy.sprite.stop().setFrame(frames[combo.hitFrame]);
  pending.index++;
  if(pending.index===3 || (pending.index===1 && combo.confirmFirst && !connected) || scene.health<=0) {
    enemy.pending=null;enemy.actionUntil=now+combo.recovery;enemy.recoveryPoseUntil=now+90;
    if(scene.comboVictim===pending)scene.comboVictim=null;
  } else {
    // Hold the actual contact pose briefly before winding up the next strike.
    pending.release=now+combo.interval;pending.animateAt=now+70;pending.stageToPlay=pending.index;
  }
}
