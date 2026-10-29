export const MUSIC_VOLUME = .35;

// One owned sound per combat scene. Unlock may arrive after pause or shutdown.
export class LevelMusic {
  constructor(scene, key) {
    this.scene = scene;
    this.key = key;
    this.manager = scene.sound;
    this.track = scene.cache.audio.exists(key) ? scene.sound.add(key, { loop: true, volume: MUSIC_VOLUME }) : null;
    this.paused = false;
    this.stopped = false;
    this.nextCheck = 0;
    this.watchedSources = new WeakSet();
    this.endedSources = new WeakSet();
    this.onUnlock = () => this.sync();
    this.onUpdate = time => { if(time>=this.nextCheck){this.nextCheck=time+1000;this.sync();} };
    this.onCacheAdd = (_, addedKey) => { if(addedKey===this.key)this.sync(); };
    this.manager.on('audio-ready',this.onUnlock);
    this.manager.on('audio-gesture',this.onUnlock);
    this.manager.on('unlocked', this.onUnlock);
    scene.events?.on('update',this.onUpdate);
    scene.events?.on('resume',this.onUnlock);
    scene.game?.events?.on('focus',this.onUnlock);
    scene.cache.audio.events?.on('add',this.onCacheAdd);
    this.sync();
  }

  bindContext() {
    if(this.context===this.manager.context)return;
    this.context?.removeEventListener?.('statechange',this.onUnlock);
    this.context=this.manager.context;
    this.context?.addEventListener?.('statechange',this.onUnlock);
  }

  sync() {
    if(this.stopped)return;
    this.bindContext();
    // A delayed cache entry or a transient playback failure must not silence the whole level.
    if(!this.track && this.scene.cache.audio.exists(this.key))this.track=this.manager.add(this.key,{loop:true,volume:MUSIC_VOLUME});
    if (!this.track || this.manager.locked || (this.manager.context && this.manager.context.state!=='running')) return;
    if (this.paused) {
      if (this.track.isPlaying) this.track.pause();
    } else if (this.track.isPaused) this.track.resume();
    else if (!this.track.isPlaying) this.track.play();
    else if(this.track.audio?.paused && !this.track.startTime){
      // HTMLAudio can reject play() while Phaser still reports isPlaying=true.
      // Retry the existing tag, preserving its position, including inside a user gesture.
      this.track.audio.play()?.catch?.(()=>{});
    }
    else if(this.track.isPlaying && this.track.audioBuffer){
      // Phaser 3 schedules a second, finite buffer for each loop. Both can end
      // while rendering is suspended, leaving isPlaying=true with no live audio.
      const {source,loopSource,duration,seek}=this.track;
      const exhausted=source && this.endedSources.has(source) && (!loopSource || this.endedSources.has(loopSource));
      if(!source || exhausted || (duration>0 && seek>duration+.25))this.track.play();
    }
    for(const source of [this.track.source,this.track.loopSource]){
      if(!source?.addEventListener || this.watchedSources.has(source))continue;
      this.watchedSources.add(source);
      source.addEventListener('ended',()=>this.endedSources.add(source),{once:true});
    }
  }

  setPaused(paused) { this.paused = paused; this.sync(); }

  stop() {
    this.stopped = true;
    this.manager.off('unlocked', this.onUnlock);
    this.manager.off('audio-ready', this.onUnlock);
    this.manager.off('audio-gesture',this.onUnlock);
    this.context?.removeEventListener?.('statechange',this.onUnlock);
    this.scene.events?.off('update',this.onUpdate);
    this.scene.events?.off('resume',this.onUnlock);
    this.scene.game?.events?.off('focus',this.onUnlock);
    this.scene.cache.audio.events?.off('add',this.onCacheAdd);
    this.track?.stop();
  }

  destroy() {
    this.stop();
    this.track?.destroy();
    this.track = null;
  }
}
