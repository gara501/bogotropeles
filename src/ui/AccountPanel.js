// "MI CUENTA": the online save. Pick a username to store the progress in Supabase, copy the recovery code,
// or bring the progress from another device (username + code).
import {cleanUsername} from '../online/Leaderboard.js';

export class AccountPanel{
  constructor({cloud,onOpen=()=>{},onClose=()=>{}}){
    this.cloud=cloud;this.onOpen=onOpen;this.onCloseCallback=onClose;
    const d=this.dialog=document.createElement('dialog');d.className='account-modal';d.setAttribute('aria-labelledby','account-heading');
    d.innerHTML=`<div class="account-content">
      <p class="eyebrow">BOGOTROPELES · TU AVANCE</p>
      <h2 id="account-heading">MI CUENTA</h2>
      <p class="account-status" aria-live="polite"></p>
      <section class="account-block account-save">
        <h3>GUARDAR EN LA NUBE</h3>
        <p class="account-note">Niveles pasados, tarjetas, colores y récord de supervivencia. Es el mismo usuario del ranking.</p>
        <form class="account-row" data-form="register">
          <input name="username" maxlength="16" autocomplete="nickname" spellcheck="false" placeholder="TU USUARIO" aria-label="Usuario" />
          <button type="submit">GUARDAR</button>
        </form>
        <div class="account-code" hidden>
          <span>CÓDIGO DE RECUPERACIÓN</span><code></code>
          <button type="button" data-copy>COPIAR</button>
          <small>Anótalo: con tu usuario y este código recuperas el avance en otro equipo o navegador. No lo compartas.</small>
        </div>
      </section>
      <section class="account-block account-recover">
        <h3>¿YA JUGASTE EN OTRO EQUIPO?</h3>
        <form class="account-recover-form" data-form="recover">
          <input name="username" maxlength="16" spellcheck="false" placeholder="USUARIO" aria-label="Usuario a recuperar" />
          <input name="code" spellcheck="false" autocomplete="off" placeholder="CÓDIGO DE RECUPERACIÓN" aria-label="Código de recuperación" />
          <button type="submit">RECUPERAR AVANCE</button>
        </form>
      </section>
      <p class="account-message" aria-live="assertive"></p>
      <button type="button" class="account-close">VOLVER</button>
    </div>`;
    this.status=d.querySelector('.account-status');this.message=d.querySelector('.account-message');
    const register=d.querySelector('[data-form="register"]'),recover=d.querySelector('[data-form="recover"]');
    for(const input of d.querySelectorAll('input[name="username"]'))input.addEventListener('input',()=>{const v=cleanUsername(input.value);if(v!==input.value)input.value=v;});
    register.addEventListener('submit',event=>{event.preventDefault();this.run(()=>this.cloud.register(register.username.value),name=>`LISTO: TU AVANCE QUEDÓ GUARDADO COMO ${name}.`);});
    recover.addEventListener('submit',event=>{event.preventDefault();this.run(()=>this.cloud.recover(recover.username.value,recover.code.value),name=>`AVANCE DE ${name} RECUPERADO EN ESTE EQUIPO.`,true);});
    d.querySelector('[data-copy]').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(this.cloud.recoveryCode);this.say('CÓDIGO COPIADO.');}catch{this.say('SELECCIONA EL CÓDIGO Y CÓPIALO A MANO.','warn');}
    });
    d.querySelector('.account-close').addEventListener('click',()=>d.close());
    d.addEventListener('keydown',event=>event.stopPropagation());d.addEventListener('keyup',event=>event.stopPropagation());
    d.addEventListener('close',()=>{const done=this.afterClose;this.afterClose=null;(done??this.onCloseCallback)();});
    document.body.append(d);
  }
  get isOpen(){return this.dialog.open;}
  say(text,tone='ok'){this.message.textContent=text;this.message.dataset.tone=tone;}
  async run(action,success,recovering=false){
    const buttons=[...this.dialog.querySelectorAll('button[type="submit"]')];buttons.forEach(b=>b.disabled=true);this.say('CONECTANDO…');
    try{const name=await action();this.say(success(name));}
    catch(error){
      const text=recovering && error?.code==='username_taken'?'USUARIO O CÓDIGO INCORRECTO.'
        :['offline','server','disabled'].includes(error?.code)?'NO SE PUDO CONECTAR CON LA NUBE: TU AVANCE SIGUE GUARDADO EN ESTE EQUIPO.'
        :error?.text??'NO SE PUDO CONECTAR.';
      this.say(text,'warn');
    }finally{buttons.forEach(b=>b.disabled=false);this.render();}
  }
  render(){
    const cloud=this.cloud,name=cloud.username;
    this.status.textContent=name?`${name} · ${cloud.statusText}`:cloud.statusText;
    this.status.dataset.state=cloud.status;
    const input=this.dialog.querySelector('[data-form="register"] input');if(!input.value)input.value=name;
    this.dialog.querySelector('[data-form="register"] button').textContent=name?'SINCRONIZAR':'GUARDAR';
    const code=this.dialog.querySelector('.account-code');code.hidden=!name;code.querySelector('code').textContent=cloud.recoveryCode;
    const disabled=!cloud.leaderboard.enabled;
    for(const el of this.dialog.querySelectorAll('input,button[type="submit"]'))el.disabled=disabled;
  }
  open({onClose}={}){
    if(this.isOpen)return;this.afterClose=onClose;this.say('');this.render();this.onOpen();this.dialog.showModal();
    (this.dialog.querySelector('input:not([disabled])')??this.dialog.querySelector('.account-close')).focus();
    if(this.cloud.ready)this.cloud.sync().then(()=>this.isOpen && this.render());
  }
}
