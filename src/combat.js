import {ARCADE} from './data/arcade.js';
export const DASH = { speed: ARCADE.dash.speed, duration: ARCADE.dash.frames*ARCADE.clock.stepMs, cooldown: ARCADE.dash.cooldown*ARCADE.clock.stepMs };
export const ENEMY_TIMING = { advance: 650, rest: 450, windup: 480, recovery: 480, cooldown: 2100, rangedCooldown: 2800, groupSpacing: 750 };

export function enemyCanAdvance(time, index) {
  return (time + index * 270) % (ENEMY_TIMING.advance + ENEMY_TIMING.rest) < ENEMY_TIMING.advance;
}

export function dashDirection(dx, dy, facing) {
  const length = Math.hypot(dx, dy);
  return length ? { x: dx / length, y: dy / length } : { x: facing, y: 0 };
}

export function meleeHits(attacker, target, facing, range, lane = ARCADE.body.lane) {
  const distance = (target.x - attacker.x) * facing;
  return distance >= -10 && distance <= range && Math.abs(target.y - attacker.y) <= lane;
}

export function playerAttackHits(attacker, target, attack) {
  return attack.area
    ? Math.hypot(target.x - attacker.x, target.y - attacker.y) <= attack.range
    : meleeHits(attacker, target, attack.facing, attack.range,attack.lane??ARCADE.body.lane);
}

// Swept collision prevents fast projectiles skipping a target between frames.
export function knifeHits(previousX, currentX, knifeY, target, jumpHeight) {
  return jumpHeight < ARCADE.body.projectileAvoidHeight && Math.abs(knifeY - target.y) < ARCADE.body.lane
    && target.x + ARCADE.body.halfWidth >= Math.min(previousX, currentX)
    && target.x - ARCADE.body.halfWidth <= Math.max(previousX, currentX);
}
