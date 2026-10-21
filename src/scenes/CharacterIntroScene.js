import Phaser from 'phaser';
import { characterIntros } from '../data/characterIntros.js';
import { fitArcadeCamera, fitArcadeText } from '../data/arcade.js';
import storyUrl from './intro_1.png?url';

// src/data/players/player_N_intro.png / player_N_final.png are picked up automatically (a missing one falls back to the portrait).
const byPlayer = (files, suffix) => Object.fromEntries(Object.entries(files)
  .map(([path, url]) => [Number(path.match(new RegExp(`player_(\\d+)_${suffix}`))[1]), url]));
const IMAGES = {
  intro: byPlayer(import.meta.glob('../data/players/player_*_intro.png', { eager: true, query: '?url', import: 'default' }), 'intro'),
  ending: byPlayer(import.meta.glob('../data/players/player_*_final.png', { eager: true, query: '?url', import: 'default' }), 'final'),
};
const PROFILE_IMAGES = byPlayer(import.meta.glob('../data/players/player_*_profile.png', { eager: true, query: '?url', import: 'default' }), 'profile');

const W = 960, H = 540, PANEL_TOP = 352;
const ACCENT = '#d6ed64', INK = '#e8edce', DARK = '#05080a';
const CHAR_MS = 26;                                     // typewriter speed
const PAUSES = { '.': 9, '!': 9, '?': 9, '…': 12, ':': 6, ',': 4, ';': 5 }; // extra ticks after punctuation

/**
 * Classic arcade "story" screen: the character's illustration with a slow zoom, the name sliding in,
 * the story typed letter by letter and a blinking confirmation. Any key/tap while typing shows the whole text.
 * - kind 'character' (intro, before level 1): ENTER / tap starts the game, ESC goes back to the character selection.
 *   Emits 'intro-complete' with {kind:'character', character, level, back}.
 * - kind 'ending' (after beating the last level): ENTER / tap continues. Emits 'intro-complete' with {kind:'ending', ...data}.
 */
export class CharacterIntroScene extends Phaser.Scene {
  constructor() { super('CharacterIntro'); }

  init(data = {}) {
    this.mode = data.kind === 'ending' ? 'ending' : 'intro';
    this.nextData = { ...data, kind: this.mode === 'ending' ? 'ending' : 'character' };
    const character = characterIntros[data.character] ?? characterIntros.office;
    this.story = this.mode === 'ending' ? { ...character, ...character.ending } : character;
    this.done = false; this.typing = true; this.ready = false;
  }

  preload() {
    const n = this.story.player;
    const url = IMAGES[this.mode][n];
    this.imageKey = url ? `character-${this.mode}-${n}` : null;
    if (this.imageKey && !this.textures.exists(this.imageKey)) this.load.image(this.imageKey, url);
    if (!this.imageKey) {
      if (!this.textures.exists('intro-story')) this.load.image('intro-story', storyUrl);
      if (PROFILE_IMAGES[n] && !this.textures.exists(`character-profile-${n}`)) this.load.image(`character-profile-${n}`, PROFILE_IMAGES[n]);
    }
  }

  create() {
    fitArcadeCamera(this);
    this.cameras.main.setBackgroundColor(DARK).fadeIn(400, 5, 8, 10);
    const mono = "'IBM Plex Mono', monospace", title = "'Barlow Condensed', sans-serif";
    const n = this.story.player;

    // Illustration (slow "Ken Burns" push-in), or the profile portrait over the story art as a fallback.
    if (this.imageKey) {
      const bg = this.add.image(W / 2, H / 2 - 30, this.imageKey);
      const scale = Math.max(W / bg.width, H / bg.height);
      bg.setScale(scale * 1.1);
      this.tweens.add({ targets: bg, scale, y: H / 2, duration: 12000, ease: 'Sine.easeOut' });
    } else {
      const bg = this.add.image(W / 2, H / 2, 'intro-story');
      bg.setScale(Math.max(W / bg.width, H / bg.height)).setTint(0x556066);
      if (this.textures.exists(`character-profile-${n}`)) {
        const portrait = this.add.image(W - 200, 196, `character-profile-${n}`).setScale(.78).setAlpha(0);
        this.tweens.add({ targets: portrait, alpha: 1, x: W - 220, duration: 700, ease: 'Cubic.easeOut' });
      }
    }

    // Cinematic bars + text panel.
    const topBar = this.add.rectangle(W / 2, -14, W, 28, 0x000000).setOrigin(.5, .5);
    this.tweens.add({ targets: topBar, y: 14, duration: 500, ease: 'Cubic.easeOut' });
    const panel = this.add.container(0, H);
    panel.add(this.add.rectangle(0, 0, W, H - PANEL_TOP, 0x05080a, .86).setOrigin(0));
    panel.add(this.add.rectangle(0, 0, W, 3, 0xd6ed64).setOrigin(0));
    this.tweens.add({ targets: panel, y: PANEL_TOP, duration: 550, delay: 250, ease: 'Cubic.easeOut' });

    // Name plate.
    const right = this.story.nameSide === 'right', from = right ? W + 300 : -300, to = right ? W - 36 : 36;
    const ending = this.mode === 'ending';
    const tag = this.add.text(from, 40, ending ? `FINAL · PLAYER ${n}` : `PLAYER ${n}`, { fontFamily: mono, fontSize: '13px', color: ACCENT, stroke: DARK, strokeThickness: 4, fontStyle: '600' });
    const name = this.add.text(from, 56, this.story.name, { fontFamily: title, fontSize: '52px', fontStyle: '900', color: '#ffffff', stroke: DARK, strokeThickness: 8 });
    name.setShadow(4, 4, '#000000', 0, true, true);
    if (right) { tag.setOrigin(1, 0); name.setOrigin(1, 0); }
    this.tweens.add({ targets: [tag, name], x: to, duration: 520, delay: 450, ease: 'Back.easeOut' });

    // Story text: wrap once with the final width so words never jump lines while typing.
    this.body = this.add.text(36, PANEL_TOP + 20, '', {
      fontFamily: mono, fontSize: '16px', color: INK, lineSpacing: 7,
      wordWrap: { width: W - 72, useAdvancedWrap: true },
    });
    this.fullText = this.body.getWrappedText(this.story.text).join('\n');
    this.shown = 0; this.wait = 0;

    this.cursor = this.add.text(0, 0, '▌', { fontFamily: mono, fontSize: '16px', color: ACCENT });
    this.tweens.add({ targets: this.cursor, alpha: 0, duration: 260, yoyo: true, repeat: -1 });

    const touch = this.game.touchControls?.mobile?.();
    const promptText = ending ? (touch ? '▶ TOCA PARA CONTINUAR' : '▶ PRESIONA ENTER PARA CONTINUAR')
      : (touch ? '▶ TOCA PARA EMPEZAR' : '▶ ¿LISTO? PRESIONA ENTER PARA EMPEZAR');
    this.prompt = this.add.text(36, H - 22, promptText,
      { fontFamily: mono, fontSize: '14px', fontStyle: '600', color: ACCENT, stroke: DARK, strokeThickness: 4 }).setOrigin(0, .5).setVisible(false);
    this.backLabel = this.add.text(W - 36, H - 22, touch ? '◀ CAMBIAR PERSONAJE' : 'ESC · CAMBIAR PERSONAJE',
      { fontFamily: mono, fontSize: '12px', color: '#9aa69a', stroke: DARK, strokeThickness: 4 }).setOrigin(1, .5).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.backLabel.on('pointerover', () => this.backLabel.setColor(INK)).on('pointerout', () => this.backLabel.setColor('#9aa69a'));
    this.skipHint = this.add.text(W - 36, H - 22, touch ? 'TOCA PARA SALTAR' : 'ENTER · SALTAR',
      { fontFamily: mono, fontSize: '11px', color: '#6f7a72' }).setOrigin(1, .5).setAlpha(0);

    for (const object of this.children.list) if (object.type === 'Text') fitArcadeText(object);
    this.placeCursor();

    // Typing starts once the panel is up.
    this.time.delayedCall(850, () => {
      this.typer = this.time.addEvent({ delay: CHAR_MS, loop: true, callback: () => this.typeStep() });
      this.tweens.add({ targets: this.skipHint, alpha: 1, duration: 300 });
    });

    // Listen a little later so the Enter/click that picked the character is not reused here.
    this.onKey = event => {
      if (event.key === 'Escape' && !ending) return this.finish(true, event);
      if (this.typing) { event.preventDefault?.(); return this.completeText(); }
      if (!['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(event.key)) this.finish(false, event);
    };
    this.onPointer = (pointer, targets) => {
      if (!ending && targets?.includes(this.backLabel) && !this.typing) return this.finish(true);
      if (this.typing) this.completeText(); else this.finish(false);
    };
    this.time.delayedCall(350, () => {
      this.input.keyboard.on('keydown', this.onKey);
      this.input.on('pointerdown', this.onPointer);
    });
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', this.onKey);
      this.input.off('pointerdown', this.onPointer);
    });
  }

  typeStep() {
    if (!this.typing) return;
    if (this.wait > 0) { this.wait--; return; }
    const char = this.fullText[this.shown];
    this.shown++;
    this.body.setText(this.fullText.slice(0, this.shown));
    this.placeCursor();
    if (char && char.trim() && this.shown % 2) this.blip();
    this.wait = PAUSES[char] ?? 0;
    if (this.shown >= this.fullText.length) this.completeText();
  }

  placeCursor() {
    const lines = this.body.text.split('\n'), last = lines[lines.length - 1] ?? '';
    if (!this.charWidth) {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${this.body.style.fontSize} ${this.body.style.fontFamily}`;
      this.charWidth = ctx.measureText('MMMMMMMMMM').width / 10 || 9.6;
    }
    const metrics = this.body.getTextMetrics?.() ?? {};
    const lineHeight = ((metrics.fontSize ?? 21) + this.body.lineSpacing) * this.body.scaleY;
    this.cursor.setPosition(this.body.x + last.length * this.charWidth * this.body.scaleX + 1, this.body.y + (lines.length - 1) * lineHeight);
  }

  completeText() {
    if (!this.typing) return;
    this.typing = false; this.typer?.remove();
    this.body.setText(this.fullText); this.placeCursor();
    this.skipHint.setVisible(false);
    this.prompt.setVisible(true); this.backLabel.setVisible(this.mode !== 'ending');
    this.tweens.add({ targets: this.prompt, alpha: .2, duration: 420, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
  }

  // Short square-wave tick for the typewriter (no extra audio file needed).
  blip() {
    const ctx = this.sound?.context;
    if (!ctx || this.sound.locked || this.sound.mute || ctx.state !== 'running') return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime;
    osc.type = 'square'; osc.frequency.value = 560 + Math.random() * 120;
    gain.gain.setValueAtTime(.025 * (this.sound.volume ?? 1), t);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .035);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + .04);
  }

  finish(back, event) {
    if (this.done) return;
    this.done = true;
    event?.preventDefault?.(); event?.stopImmediatePropagation?.();
    const data = { ...this.nextData, back };
    const leave = () => queueMicrotask(() => { this.game.scene.stop('CharacterIntro'); this.game.events.emit('intro-complete', data); });
    if (back) return leave();
    this.tweens.killTweensOf(this.prompt);
    this.prompt.setAlpha(1).setColor('#ffffff');
    this.tweens.add({ targets: this.prompt, alpha: 0, duration: 70, yoyo: true, repeat: 3 });
    this.cameras.main.flash(120, 214, 237, 100);
    this.time.delayedCall(260, () => this.cameras.main.fadeOut(300, 5, 8, 10));
    this.cameras.main.once('camerafadeoutcomplete', leave);
  }
}
