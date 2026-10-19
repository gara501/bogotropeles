import {chargeSound} from '../audio/SoundEffects.js';
export function beginEnemyCharge(scene,enemy,facing) {
  const now=scene.combatTime,c=enemy.config.charge;
  enemy.pending={kind:'charge',phase:'prepare',release:now+c.windup,facing,hit:false};
  enemy.actionUntil=Infinity;
  enemy.sprite.setFlipX(facing<0);
  scene.play(enemy,'prepare',c.windup);
  enemy.tell.setText('¡CARGA!').setVisible(true);
  scene.nextGroupAttack=now+c.windup+c.distance/c.speed*1000+c.recovery;
}

export function updateEnemyCharge(scene,enemy,dt) {
  const p=enemy.pending,c=enemy.config.charge,now=scene.combatTime;
  if(!p || p.kind!=='charge')return;
  if(p.phase==='prepare') {
    if(now<p.release)return;
    p.phase='rush';p.remaining=c.distance;
    scene.sfx?.play(chargeSound(enemy.key));
    enemy.tell.setVisible(false);
    enemy.sprite.play({key:`${enemy.key}-rush`,repeat:-1});
    // Start movement on the next frame so the full second is a stationary warning.
    return;
  }
  const previous=enemy.x,step=Math.min(p.remaining,c.speed*dt);
  enemy.x=Math.max(scene.floor.left,Math.min(scene.floor.right,previous+p.facing*step));
  p.remaining-=Math.abs(enemy.x-previous);
  const contact=scene.jumpHeight<35 && Math.abs(enemy.y-scene.player.y)<24 &&
    scene.player.x+18>=Math.min(previous,enemy.x)-40 && scene.player.x-18<=Math.max(previous,enemy.x)+40;
  if(!p.hit && contact && scene.hitPlayer(enemy.config.damage)) {
    p.hit=true;
    if(enemy.config.animations.chargeImpact)scene.play(enemy,'chargeImpact',180);
  }
  if(p.remaining<=0 || enemy.x===scene.floor.left || enemy.x===scene.floor.right) {
    enemy.pending=null;enemy.actionUntil=now+c.recovery;
    enemy.nextHit=enemy.actionUntil+c.cooldown/scene.level.pressure;
    scene.play(enemy,'brake',c.recovery);
  }
}

export function shouldCharge(enemy,distance) {
  return Boolean(enemy.config.charge && (!enemy.config.melee || distance>enemy.config.range));
}
