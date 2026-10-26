/** Unlock inside the frame's own user gesture; recover iOS interrupted contexts without restarting tracks. */
export class AudioActivation {
  constructor(game,{document=globalThis.document,window=globalThis.window,navigator=globalThis.navigator,button}={}) {
    this.game=game;this.document=document;this.window=window;this.navigator=navigator;this.button=button;
    this.activated=false;this.destroyed=false;this.wasRunning=false;this.listeners=[];
    this.onState=()=>this.sync();this.onReady=()=>{this.bindContext();this.sync();};
    this.onMute=(_,muted)=>{this.muted=muted;this.sync();};
    this.onGesture=event=>{
      if(event.target===this.button || this.button?.contains?.(event.target)){
        if(event.type==='pointerdown' || event.type==='keydown')this.toggleWasEnabled=!this.muted && this.running;
        return;
      }
      this.activate();
    };
    this.onVisible=()=>{if(this.activated && !this.document.hidden)this.activate();};
    this.onToggle=()=>{
      const manager=this.game.sound;if(!manager)return;
      const disable=this.toggleWasEnabled??(!this.muted && this.running);this.toggleWasEnabled=null;
      this.muted=disable;manager.setMute(disable);
      if(!disable)this.activate();this.sync();
    };
    const listen=(target,type,handler,options)=>{target?.addEventListener(type,handler,options);this.listeners.push([target,type,handler,options]);};
    // Capture survives controls that preventDefault/stopPropagation. Touch-end and click carry iOS activation.
    for(const type of ['pointerdown','pointerup','touchend','click','keydown'])listen(document,type,this.onGesture,{capture:true,passive:true});
    listen(document,'visibilitychange',this.onVisible);
    for(const type of ['focus','pageshow'])listen(window,type,this.onVisible);
    listen(button,'click',this.onToggle);
    game.events.once('ready',this.onReady);this.bindContext();this.sync();
  }
  get running(){const manager=this.game.sound;return Boolean(manager && !manager.locked && (!manager.context || manager.context.state==='running'));}
  bindContext(){
    const manager=this.game.sound;
    if(manager!==this.manager){
      this.manager?.off('unlocked',this.onState);this.manager?.off('mute',this.onMute);this.manager=manager;
      this.muted=Boolean(manager?.mute);manager?.on('unlocked',this.onState);manager?.on('mute',this.onMute);
    }
    const context=this.game.sound?.context;if(context===this.context)return;
    this.context?.removeEventListener('statechange',this.onState);this.context=context;this.wasRunning=false;
    context?.addEventListener('statechange',this.onState);
  }
  activate(){
    if(this.destroyed || this.document.hidden)return;
    this.bindContext();if(this.muted)return;
    this.activated=true;const manager=this.game.sound,context=this.context;
    // Safari's media playback session is appropriate for game music and effects, including silent-mode devices.
    try{if(this.navigator?.audioSession)this.navigator.audioSession.type='playback';}catch{}
    if(!manager)return;
    if(!context){this.sync();return;} // Phaser's HTMLAudio fallback retains its built-in touch unlock.
    if(context.state==='running'){this.finishResume();return;}
    if(context.state==='closed'){this.sync();return;}
    try{
      // Do not await before resume/start: both operations must execute in the original user input dispatch.
      const resumed=context.resume();
      const source=context.createBufferSource();source.buffer=context.createBuffer(1,1,context.sampleRate);
      source.connect(context.destination);source.onended=()=>source.disconnect();source.start(0);
      Promise.resolve(resumed).then(()=>this.finishResume(),()=>this.sync());
    }catch{this.sync();} // A denied activation can be retried on the next tap; gameplay stays available.
  }
  finishResume(){
    if(this.destroyed || this.context?.state!=='running')return;
    const manager=this.game.sound;
    // Phaser consumes this flag on its next update and emits its normal unlocked event.
    if(manager.locked)manager.unlocked=true;
    this.sync();
  }
  sync(){
    if(this.destroyed)return;
    const manager=this.game.sound,running=this.running;
    if(running && !this.wasRunning){this.wasRunning=true;manager.emit('audio-ready');}
    else if(!running)this.wasRunning=false;
    if(!this.button)return;
    const muted=this.muted,unavailable=this.context?.state==='closed';
    this.button.disabled=unavailable;
    this.button.textContent=unavailable?'AUDIO NO DISPONIBLE':muted?'SONIDO: OFF':running?'SONIDO: ON':'ACTIVAR SONIDO';
    this.button.setAttribute('aria-pressed',String(!muted && running));
    this.button.setAttribute('aria-label',unavailable?'Audio no disponible':muted || !running?'Activar sonido':'Silenciar sonido');
  }
  destroy(){
    this.destroyed=true;for(const [target,type,handler,options] of this.listeners)target?.removeEventListener(type,handler,options);
    this.context?.removeEventListener('statechange',this.onState);this.game.events.off('ready',this.onReady);
    this.manager?.off('unlocked',this.onState);
    this.manager?.off('mute',this.onMute);
    this.listeners=[];
  }
}
