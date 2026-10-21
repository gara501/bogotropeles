import { ARCADE } from '../data/arcade.js';
import { viewLeft } from '../stage/scroll.js';

// Palomera's "nube de palomas" (config.flock in data/enemies.js): she raises her arms and a flock takes off,
// flies over the player and drops poop. Each dropping marks its landing spot with a shadow first, so it can be
// dodged; landing on the player takes health. Everything advances on the fixed arcade step (pauses with the game).
// Art: bosses/pigeon_flight.png, 6 wing frames of 128×128 (texture 'pigeon-flight', native facing right).
export const PIGEON_FLIGHT = { key: 'pigeon-flight', frameWidth: 128, frameHeight: 128, frames: 6 };
const FPS = () => ARCADE.clock.fps;
const rand = (a, b) => a + Math.random() * (b - a);

export class PigeonFlock {
  constructor(scene) { this.scene = scene; this.birds = []; this.drops = []; this.splats = []; }
  get active() { return this.birds.length > 0 || this.drops.length > 0; }

  launch(owner, config) {
    const s = this.scene, player = s.player, dir = Math.sign(player.x - owner.x) || owner.facing || 1;
    const damage = Math.max(1, Math.round(config.damage * (s.level?.damage ?? 1)));
    for (let i = 0; i < config.birds; i++) {
      // Drop targets: one aimed at where the player is now, the rest `spread` px before/after it along the flight line.
      const targets = Array.from({ length: config.drops }, (_, k) => k === 0 ? player.x + rand(-28, 28)
        : player.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * config.spread + rand(-config.spread / 3, config.spread / 3));
      targets.sort((a, b) => dir * (a - b));
      const sprite = s.add.sprite(owner.x, owner.y - (owner.config?.height ?? 118) + 10, PIGEON_FLIGHT.key, 0)
        .setScale(config.scale ?? .42).setFlipX(dir < 0).setDepth(905).setVisible(false);
      this.birds.push({ sprite, dir, damage, owner, config, targets, x: sprite.x, y: sprite.y,
        delay: Math.round(i * (config.stagger / 1000) * FPS()), age: 0, phase: Math.random() * Math.PI * 2,
        cruise: rand(config.altitude[0], config.altitude[1]), speed: config.speed * rand(.85, 1.15) });
    }
  }

  update() {
    const s = this.scene, fps = FPS(), vx = viewLeft(s);
    this.birds = this.birds.filter(bird => {
      if (bird.delay > 0) { bird.delay--; return true; }
      const c = bird.config; bird.age++;
      bird.sprite.setVisible(true).setFrame(Math.floor(bird.age / 3) % PIGEON_FLIGHT.frames);
      bird.x += bird.dir * bird.speed / fps;
      // Climb from the boss's hands to cruising height, with a little flutter.
      bird.y += (bird.cruise - bird.y) * .08;
      bird.sprite.setPosition(bird.x, bird.y + Math.sin(bird.age / 6 + bird.phase) * 4);
      if (bird.targets.length && bird.dir * (bird.x - bird.targets[0]) >= 0) { bird.targets.shift(); this.drop(bird); }
      const gone = bird.x < vx - 120 || bird.x > vx + 1080;
      if (gone) bird.sprite.destroy();
      return !gone;
    });
    this.drops = this.drops.filter(drop => {
      drop.age++;
      const t = Math.min(1, drop.age / drop.frames);
      drop.blob.setPosition(drop.x, drop.top + (drop.y - drop.top) * t * t);
      drop.shadow.setScale(.35 + .65 * t).setAlpha(.25 + .45 * t);
      if (t < 1) return true;
      this.land(drop); return false;
    });
    this.splats = this.splats.filter(splat => {
      splat.age++;
      if (splat.age > splat.life) { splat.sprite.destroy(); return false; }
      if (splat.age > splat.life - 30) splat.sprite.setAlpha((splat.life - splat.age) / 30 * .9);
      return true;
    });
  }

  drop(bird) {
    const s = this.scene, c = bird.config;
    const y = Math.max(s.floor.top, Math.min(s.floor.bottom, s.player.y + rand(-10, 10)));
    const shadow = s.add.ellipse(bird.x, y, c.hitRadius * 2, 10, 0x2b1d14, .25).setDepth(y - 2).setScale(.35);
    const blob = s.add.ellipse(bird.x, bird.y + 8, 9, 12, 0xf2f0e4).setStrokeStyle(2, 0x6d6a5c).setDepth(904);
    this.drops.push({ x: bird.x, y, top: bird.y + 8, age: 0, frames: Math.max(1, Math.round(c.fall / 1000 * FPS())), shadow, blob, damage: bird.damage, owner: bird.owner, config: c });
  }

  land(drop) {
    const s = this.scene, c = drop.config, p = s.player;
    drop.blob.destroy(); drop.shadow.destroy();
    const splat = s.add.ellipse(drop.x, drop.y, c.hitRadius * 1.3, 8, 0xeeeadb, .9).setStrokeStyle(1, 0x8b8774).setDepth(drop.y - 1);
    this.splats.push({ sprite: splat, age: 0, life: Math.round(1.6 * FPS()) });
    const hit = Math.abs(p.x - drop.x) <= c.hitRadius && Math.abs(p.y - drop.y) <= c.depth && (s.jumpHeight ?? 0) < 24;
    if (hit) s.hitPlayer(drop.damage, null, drop.owner);
  }

  /** Pigeon shield (config.pigeonShield): a ring of pigeons circling the owner; touching it hurts and pushes back. */
  shieldStep(owner, c) {
    const s = this.scene, p = s.player;
    if (this.ring?.owner !== owner) {
      this.stopShield();
      this.ring = { owner, age: 0, sprites: Array.from({ length: c.birds }, () =>
        s.add.sprite(owner.x, owner.y, PIGEON_FLIGHT.key, 0).setScale(c.scale ?? .36)) };
    }
    const ring = this.ring; ring.age++;
    ring.sprites.forEach((sprite, i) => {
      const angle = ring.age * c.spin + i * Math.PI * 2 / ring.sprites.length, front = Math.sin(angle);
      const x = owner.x + Math.cos(angle) * c.radius, y = owner.y - c.height + front * 22 + Math.sin(ring.age / 5 + i) * 4;
      // Flying around: faces the way it moves; in front of her on the near half of the circle, behind on the far half.
      sprite.setPosition(x, y).setFlipX(front > 0).setDepth(owner.y + (front > 0 ? 3 : -3))
        .setFrame(Math.floor((ring.age + i * 2) / 3) % PIGEON_FLIGHT.frames);
    });
    if (Math.abs(p.x - owner.x) <= c.radius && Math.abs(p.y - owner.y) <= c.depth && (s.jumpHeight ?? 0) < 40)
      s.hitPlayer(Math.max(1, Math.round(c.damage * (s.level?.damage ?? 1))), null, owner);
  }

  stopShield() { for (const sprite of this.ring?.sprites ?? []) sprite.destroy(); this.ring = null; }

  clear() {
    this.stopShield();
    for (const b of this.birds) b.sprite.destroy();
    for (const d of this.drops) { d.blob.destroy(); d.shadow.destroy(); }
    for (const sp of this.splats) sp.sprite.destroy();
    this.birds = []; this.drops = []; this.splats = [];
  }
}
