import { BOSS } from './balance.js';
import { slowMultiplier } from './rules.js';

export class StatusEffects {
  constructor(scene) {
    this.scene = scene; this.stacks = []; this.presses = 0;
    this.icons = Array.from({length:BOSS.paper.maxStacks}, () => scene.add.image(0,0,'boss-effects','paper1').setDisplaySize(15,18).setVisible(false));
    this.label = scene.add.text(26,83,'',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'10px',color:'#ffcf69',backgroundColor:'#142127',padding:{x:5,y:3}}).setDepth(1000);
    this.label.setScrollFactor?.(0);
  }
  get speedMultiplier() { return slowMultiplier(this.stacks.length); }
  add() {
    const expiry = this.scene.combatTime + BOSS.paper.lifetime;
    if (this.stacks.length < BOSS.paper.maxStacks) this.stacks.push(expiry);
    else this.stacks[0] = expiry;
  }
  shake() {
    if (this.stacks.length && ++this.presses >= BOSS.paper.shakePresses) { this.stacks.shift(); this.presses = 0; }
  }
  update() {
    this.stacks = this.stacks.filter(expiry => expiry > this.scene.combatTime);
    if (!this.stacks.length) this.presses = 0;
    const {player,jumpHeight} = this.scene;
    this.icons.forEach((icon,i) => icon.setVisible(i < this.stacks.length).setPosition(player.x - 15 + i * 14, player.y - jumpHeight - 55).setDepth(player.y + 2));
    this.label.setVisible(this.stacks.length>0).setText(this.stacks.length ? `FORMULARIOS ${this.stacks.length}/3 · PULSA H REPETIDAMENTE (${this.presses}/${BOSS.paper.shakePresses})` : '');
  }
  clear() { this.stacks = []; this.presses = 0; this.icons.forEach(icon => icon.setVisible(false)); this.label.setText('').setVisible(false); }
  destroy() {
    // Phaser may already have destroyed display objects when shutdown fires.
    // Teardown must not redraw text on a released canvas texture.
    this.stacks = []; this.presses = 0;
    this.icons.forEach(icon => icon.destroy()); this.label.destroy();
  }
}
