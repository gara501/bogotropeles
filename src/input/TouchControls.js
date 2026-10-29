import {TouchInput,joystickVector} from './TouchInput.js';

export class TouchControls {
  constructor(game) {
    this.game=game;this.input=new TouchInput();this.enabled=false;this.paused=false;
    this.abort=new AbortController();this.joystickPointer=null;
    this.media=matchMedia('(hover: none) and (pointer: coarse)');
    this.mobile=()=>this.media.matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (import.meta.env.DEV && new URLSearchParams(location.search).has('mobilePreview'));
    this.panels=[...document.querySelectorAll('.touch-controls')];
    this.buttons=[...document.querySelectorAll('[data-touch-action]')];
    this.stick=document.querySelector('#touch-stick');this.knob=document.querySelector('.stick-knob');
    const on=(target,event,fn)=>target.addEventListener(event,fn,{signal:this.abort.signal});
    on(this.stick,'pointerdown',event=>{
      if(!this.enabled || this.paused || this.joystickPointer!==null)return;
      event.preventDefault();this.joystickPointer=event.pointerId;this.stick.setPointerCapture(event.pointerId);this.moveStick(event);
    });
    on(this.stick,'pointermove',event=>{if(event.pointerId===this.joystickPointer){event.preventDefault();this.moveStick(event);}});
    const releaseStick=event=>{if(event.pointerId===this.joystickPointer){this.joystickPointer=null;this.input.x=0;this.input.y=0;this.knob.style.transform='translate(0,0)';this.stick.classList.remove('active');}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])on(this.stick,event,releaseStick);
    for(const button of this.buttons) {
      on(button,'pointerdown',event=>{
        if(!this.enabled || button.disabled)return;
        event.preventDefault();button.setPointerCapture(event.pointerId);
        this.input.down(button.dataset.touchAction,event.pointerId);button.classList.add('active');
      });
      const release=event=>{this.input.up(event.pointerId,event.type!=='pointerup');if(!this.input.isDown(button.dataset.touchAction))button.classList.remove('active');};
      for(const event of ['pointerup','pointercancel','lostpointercapture'])on(button,event,release);
      on(button,'contextmenu',event=>event.preventDefault());
      on(button,'click',event=>{
        if(event.detail===0 && this.enabled && !button.disabled){
          const pointer=`keyboard-${button.dataset.touchAction}`;
          this.input.down(button.dataset.touchAction,pointer);this.input.up(pointer);
        }
      });
    }
    on(window,'blur',()=>this.reset());
    on(window,'orientationchange',()=>this.reset());
    on(document,'visibilitychange',()=>{if(document.hidden)this.reset();});
    on(this.media,'change',()=>this.sync());
    this.sync();
  }
  moveStick(event) {
    const box=this.stick.getBoundingClientRect(),radius=box.width*.35;
    const dx=event.clientX-box.left-box.width/2,dy=event.clientY-box.top-box.height/2;
    Object.assign(this.input,joystickVector(dx,dy,radius));
    const length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;
    this.knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;this.stick.classList.add('active');
  }
  reset() {
    this.input.reset();this.joystickPointer=null;
    this.knob.style.transform='translate(0,0)';this.stick.classList.remove('active');
    for(const button of this.buttons)button.classList.remove('active');
  }
  setEnabled(enabled){this.enabled=enabled;this.paused=false;this.sync();}
  setCycling(value){this.cycling=value;this.stick.setAttribute('aria-label',value?'Joystick: arriba o abajo para esquivar':'Joystick: arrastra para moverte en cualquier dirección');this.sync();}
  setPaused(paused){this.paused=paused;this.reset();this.syncButtons();}
  setCharacter(character) {
    document.querySelector('[data-touch-action="L"]').hidden=character!=='student';
    document.querySelector('[data-touch-action="SHIFT"]').hidden=false;
    this.sync();
  }
  setSuperReady(value){if(this.superReady===value)return;this.superReady=value;this.syncButtons();}
  syncButtons() {
    for(const button of this.buttons){
      const action=button.dataset.touchAction;
      const cyclingAction=action==='P' || action==='SHIFT';
      button.hidden=this.cycling?!cyclingAction:action==='L' && this.game.scene.getScene('Street')?.characterKey!=='student';
      button.disabled=!this.enabled || (this.paused && action!=='P') || (this.cycling && !cyclingAction) || (action==='Q' && !this.superReady);
      if(action==='SHIFT')button.setAttribute('aria-label',this.cycling?'Dash en bicicleta: 3 segundos, recarga de 5 segundos':'Dash');
    }
    const pause=document.querySelector('[data-touch-action="P"]');
    pause.setAttribute('aria-label',this.paused?'Continuar partida':'Pausar partida');
    pause.querySelector('span').textContent=this.paused?'▶':'Ⅱ';
  }
  sync() {
    const mobile=this.mobile();document.documentElement.classList.toggle('is-mobile',mobile);
    document.querySelector('.selection-hint').textContent=mobile?'TOCA TU PERSONAJE PARA JUGAR':'CLIC EN TU PERSONAJE PARA JUGAR · ← → ELEGIR · ENTER JUGAR';
    for(const id of ['restart','retry'])document.getElementById(id).textContent=mobile?'REINICIAR ↗':'REINICIAR · R ↗';
    this.reset();for(const panel of this.panels)panel.hidden=!mobile || !this.enabled;
    this.syncButtons();
    // The canvas now lives between the side controls; measure its new parent size.
    requestAnimationFrame(()=>this.game.scale.refresh());
  }
  destroy(){this.abort.abort();this.reset();}
}
