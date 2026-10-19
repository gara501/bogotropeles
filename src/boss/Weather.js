import { BOSS } from './balance.js';
import {ARCADE} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';

export class Weather {
  constructor(scene) {
    this.scene = scene; this.until = 0; this.velocity = {x:0,y:0};
    this.dim = scene.add.rectangle(480,270,960,540,0x183449,.07).setDepth(850).setVisible(false);
    this.rain = scene.add.graphics().setDepth(851);
    this.cloud = scene.add.image(480,115,'boss-effects','cloud').setDisplaySize(220,80).setDepth(849).setVisible(false);
    this.drops = Array.from({length:55}, () => ({x:Math.random()*960,y:Math.random()*540}));
    // Dim, cloud and rain are screen effects; puddles belong to the (locked) boss arena.
    for (const item of [this.dim,this.rain,this.cloud]) item.setScrollFactor?.(0);
    const vx = viewLeft(scene);
    this.splashes = Array.from({length:6},(_,i) => scene.add.image(vx+100+i*150, scene.floor.top+30+(i%2)*20,'boss-effects','puddle').setDisplaySize(52,16).setAlpha(.5).setDepth(scene.floor.top-2).setVisible(false));
  }
  get active() { return this.scene.combatTime < this.until; }
  start() { this.until = this.scene.combatTime + BOSS.attacks.rain.duration; }
  movement(dx,dy,speed,dt,free) {
    const length = Math.hypot(dx,dy) || 1;
    const target = {x:free ? dx/length*speed : 0, y:free ? dy/length*speed*ARCADE.movement.depthRatio : 0};
    this.velocity = target;
    return {x:this.velocity.x*dt,y:this.velocity.y*dt};
  }
  update(dt) {
    const active = this.active;
    this.dim.setVisible(active); this.cloud.setVisible(active); this.splashes.forEach((s,i) => s.setVisible(active).setAlpha(.3 + .2 * Math.sin(this.scene.combatTime / 180 + i)));
    this.rain.clear();
    if (!active) return;
    this.rain.lineStyle(1,0x91caff,.45);
    for (const drop of this.drops) {
      drop.x = (drop.x - dt*100 + 960)%960; drop.y = (drop.y + dt*440)%540;
      this.rain.lineBetween(drop.x,drop.y,drop.x-5,drop.y+17);
    }
  }
  clear() { this.until = 0; this.velocity = {x:0,y:0}; this.update(0); }
  destroy() { this.clear(); this.dim.destroy(); this.cloud.destroy(); this.rain.destroy(); this.splashes.forEach(s=>s.destroy()); }
}
