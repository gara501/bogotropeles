import test from 'node:test';
import assert from 'node:assert/strict';
import { dashDirection, DASH, enemyCanAdvance, ENEMY_TIMING, meleeHits, playerAttackHits, knifeHits } from '../src/combat.js';

test('headset reaches distant enemies in front while stomp hits nearby enemies in every direction', () => {
  const player = { x: 300, y: 400 };
  const headset = { facing: 1, range: 185 };
  const stomp = { facing: 1, range: 145, area: true };
  assert.equal(playerAttackHits(player, { x: 470, y: 400 }, headset), true);
  assert.equal(playerAttackHits(player, { x: 490, y: 400 }, headset), false);
  assert.equal(playerAttackHits(player, { x: 200, y: 400 }, headset), false);
  for (const target of [{ x: 400, y: 400 }, { x: 200, y: 400 }, { x: 300, y: 300 }, { x: 300, y: 500 }]) {
    assert.equal(playerAttackHits(player, target, stomp), true);
  }
  assert.equal(playerAttackHits(player, { x: 420, y: 500 }, stomp), false);
  assert.equal(playerAttackHits(player, { x: 446, y: 400 }, stomp), false);
});

test('dash keeps the same distance diagonally and follows facing when stationary', () => {
  const diagonal = dashDirection(1, -1, 1);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-10);
  assert.deepEqual(dashDirection(0, 0, -1), { x: -1, y: 0 });
  assert.ok(DASH.duration < DASH.cooldown);
  assert.ok(DASH.speed * DASH.duration / 1000 > 100);
});

test('enemies pause between advances and their movement cycles are staggered', () => {
  assert.equal(enemyCanAdvance(0, 0), true);
  assert.equal(enemyCanAdvance(ENEMY_TIMING.advance, 0), false);
  assert.equal(enemyCanAdvance(ENEMY_TIMING.advance + ENEMY_TIMING.rest, 0), true);
  assert.notEqual(enemyCanAdvance(500, 0), enemyCanAdvance(500, 1));
  assert.ok(ENEMY_TIMING.groupSpacing > ENEMY_TIMING.windup);
  assert.ok(ENEMY_TIMING.cooldown > ENEMY_TIMING.windup + ENEMY_TIMING.recovery);
});

test('melee respects facing, range and the street lane', () => {
  const player = { x: 100, y: 400 };
  assert.equal(meleeHits(player, { x: 170, y: 410 }, 1, 88), true);
  assert.equal(meleeHits(player, { x: 30, y: 400 }, 1, 88), false);
  assert.equal(meleeHits(player, { x: 30, y: 400 }, -1, 88), true);
  assert.equal(meleeHits(player, { x: 170, y: 450 }, 1, 88), false);
});

test('fast knives collide across a frame, while jumping and changing lanes evade them', () => {
  const player = { x: 100, y: 400 };
  assert.equal(knifeHits(40, 160, 400, player, 0), true);
  assert.equal(knifeHits(160, 40, 400, player, 0), true);
  assert.equal(knifeHits(40, 160, 400, player, 60), false);
  assert.equal(knifeHits(40, 160, 450, player, 0), false);
});
