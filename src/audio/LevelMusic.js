export const MUSIC_VOLUME = .35;

// One owned sound per combat scene. Unlock may arrive after pause or shutdown.
export class LevelMusic {
  constructor(scene, key) {
    this.manager = scene.sound;
    this.track = scene.cache.audio.exists(key) ? scene.sound.add(key, { loop: true, volume: MUSIC_VOLUME }) : null;
    this.paused = false;
    this.stopped = false;
    this.onUnlock = () => this.sync();
    this.manager.on('audio-ready',this.onUnlock);
    if (this.manager.locked) this.manager.once('unlocked', this.onUnlock);
    this.sync();
  }

  sync() {
    if (!this.track || this.stopped || this.manager.locked || (this.manager.context && this.manager.context.state!=='running')) return;
    if (this.paused) {
      if (this.track.isPlaying) this.track.pause();
    } else if (this.track.isPaused) this.track.resume();
    else if (!this.track.isPlaying) this.track.play();
  }

  setPaused(paused) { this.paused = paused; this.sync(); }

  stop() {
    this.stopped = true;
    this.manager.off('unlocked', this.onUnlock);
    this.manager.off('audio-ready', this.onUnlock);
    this.track?.stop();
  }

  destroy() {
    this.stop();
    this.track?.destroy();
    this.track = null;
  }
}
