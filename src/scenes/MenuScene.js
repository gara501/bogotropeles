import Phaser from 'phaser';
import { StreetScene } from './StreetScene.js';
import { characters } from '../data/characters.js';
import { registerAnimations } from '../data/spriteSheets.js';

// Load once, before combat starts. The same textures are shared with Street.
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  preload() { StreetScene.prototype.preload.call(this); }
  create() {
    for (const [key, config] of Object.entries(characters)) {
      registerAnimations(this, key, config);
      const texture = this.textures.get(key), frame = texture.get(config.idle);
      const portrait = document.createElement('canvas');
      portrait.width = frame.cutWidth; portrait.height = frame.cutHeight;
      portrait.getContext('2d').drawImage(texture.getSourceImage(), frame.cutX, frame.cutY,
        frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
      // Wide weapon frames add padding to every pose; trim it from menu portraits.
      const pixels = portrait.getContext('2d').getImageData(0, 0, portrait.width, portrait.height).data;
      let left = portrait.width, top = portrait.height, right = 0, bottom = 0;
      for (let y = 0; y < portrait.height; y++) for (let x = 0; x < portrait.width; x++) {
        if (pixels[(y * portrait.width + x) * 4 + 3] <= 32) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      const cropped = document.createElement('canvas');
      cropped.width = right - left + 1; cropped.height = bottom - top + 1;
      cropped.getContext('2d').drawImage(portrait, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
      document.querySelector(`[data-portrait="${key}"]`).src = cropped.toDataURL();
    }
    this.game.events.emit('menu-ready');
  }
}
