import {characters} from '../data/characters.js';
import {routesFor,comboSpeed,routeAnimations} from '../data/comboRoutes.js';
import {paletteFor} from '../data/palettes.js';
import {drawPlayerPreview} from './playerPreviewSheet.js';

// COMBOS screen (main menu): shared routes in big type, the selected one with its buttons lighting up in
// rhythm while the chosen fighter performs it on the right, faster with every strike and a flash on the finisher.
// ← → change fighter · ESC / B back.
const KEYS={punch:{key:'H',pad:'X'},kick:{key:'J',pad:'Y'}};
const ABOUT={
  ppp:key=>key==='teleperforman'?'Tres puños: recto, cruzado y gancho ascendente. El tercero derriba; los latigazos se hacen agarrando y pulsando puño.':'Tres puños con torsión: recto, cruzado bajo y remate en zancada amplia. El tercero derriba.',
  kkk:key=>key==='teleperforman'?'Carnet con teléfono en el extremo: barrido ascendente, giro en tirabuzón y golpe descendente contra el suelo. El último derriba.':'Tres patadas: frontal, lateral y circular alta con giro de cadera. La circular final derriba.',
  ppkkk:key=>key==='student'?'Dos puños y tres librazos: giro horizontal, golpe ascendente y remate descendente a dos manos. Pulsa PPKKK.':key==='gymbro'?'Dos puños y tres patadas en giro: baja, ascendente y lateral. La última derriba.':'Dos puños y tres patadas: frontal, circular y alta. La última derriba.',
};
const ROSTER=['office','student','teleperforman','gymbro','magolita'];
/** What the screen lists for a fighter: notation, keyboard keys, gamepad buttons and the description. */
export const comboRows=key=>routesFor(characters[key]).map(route=>({id:route.id,notation:route.notation,keys:route.inputs.map(i=>KEYS[i].key),pad:route.inputs.map(i=>KEYS[i].pad),about:ABOUT[route.id]?.(key)??''}));

export class CombosScreen {
  constructor({root,sheets,paletteState,portraits}){
    this.root=root;this.sheets=sheets;this.paletteState=paletteState;this.portraits=portraits;this.index=0;this.key='office';this.timer=null;this.onClose=null;
    root.className='combos-screen';root.hidden=true;root.setAttribute('aria-label','Combos');
    root.innerHTML=`<div class="combos-left"><h2>COMBOS</h2>
      <p class="combos-tip">Pulsa el siguiente botón mientras ves el golpe: no hace falta precisión. Los primeros golpes son normales; el último sale <b>más rápido y más fuerte</b>: es el <b>remate</b>.</p>
      <ol class="combos-list"></ol></div>
      <div class="combos-right"><div class="combos-roster"></div><div class="combos-demo"><canvas width="360" height="360"></canvas><span class="combos-burst">¡COMBO!</span><span class="combos-speed"></span></div>
      <p class="combos-about"></p></div>
      <footer class="combos-foot"><span><b>↑ ↓</b> COMBO</span><span><b>← →</b> PERSONAJE</span><span><b>ESC</b> · <i>B</i> VOLVER</span></footer>`;
    this.list=root.querySelector('.combos-list');this.canvas=root.querySelector('canvas');this.about=root.querySelector('.combos-about');
    this.burst=root.querySelector('.combos-burst');this.speed=root.querySelector('.combos-speed');this.demo=root.querySelector('.combos-demo');
    this.roster=root.querySelector('.combos-roster');
    this.roster.replaceChildren(...ROSTER.map(key=>{const b=document.createElement('button');b.type='button';b.dataset.key=key;
      const img=document.createElement('img');img.alt=characters[key]?.name??key;b.append(img);b.addEventListener('click',()=>this.setFighter(key));return b;}));
    this.renderList();
  }
  get routes(){return routesFor(characters[this.key]);}
  renderList(){
    this.list.replaceChildren(...this.routes.map((route,i)=>{
      const li=document.createElement('li');li.dataset.index=i;
      const name=document.createElement('strong');name.textContent=route.notation;
      const chips=document.createElement('span');chips.className='combo-chips';
      route.inputs.forEach((input,j)=>{
        if(j)chips.append(Object.assign(document.createElement('i'),{className:'arrow',textContent:'›'}));
        const chip=document.createElement('span');chip.className=`chip ${input.includes('ick')?'kick':'punch'}${j===route.inputs.length-1?' last':''}`;
        chip.innerHTML=`<b>${KEYS[input].key}</b><small>${KEYS[input].pad}</small>`;chips.append(chip);
      });
      li.append(name,chips);li.addEventListener('click',()=>{this.index=i;this.render();});return li;
    }));
  }
  get isOpen(){return !this.root.hidden;}
  open(key,{onClose}={}){this.key=ROSTER.includes(key)?key:'office';this.index=0;this.onClose=onClose;this.root.hidden=false;this.render();}
  close(){clearTimeout(this.timer);this.timer=null;this.root.hidden=true;const done=this.onClose;this.onClose=null;done?.();}
  setFighter(key){this.key=key;this.index=0;this.render();}
  render(){
    this.renderList();const route=this.routes[this.index];
    this.list.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('active',i===this.index));
    this.list.querySelectorAll('.chip.lit').forEach(chip=>chip.classList.remove('lit'));
    this.roster.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.key===this.key);const img=b.querySelector('img');const src=this.portraits(b.dataset.key);if(src && img.src!==src)img.src=src;});
    this.about.textContent=ABOUT[route.id]?.(this.key)??'';
    this.play();
  }
  /** Loops the selected route on the fighter: each strike faster than the last, the finisher held with a flash. */
  async play(){
    clearTimeout(this.timer);this.timer=null;
    const token=this.token=Symbol(),route=this.routes[this.index],c=characters[this.key],key=this.key;
    const chips=[...this.list.querySelectorAll('li')[this.index].querySelectorAll('.chip')];
    const sheet=await this.sheets(key);if(token!==this.token || !this.isOpen)return;
    const ctx=this.canvas.getContext('2d'),tint=paletteFor(key,this.paletteState).tint;
    const draw=frame=>{
      if(sheet)drawPlayerPreview(ctx,sheet,frame,tint,'combos');
    };
    const steps=[];
    const animations=routeAnimations(c,route);
    animations.forEach((name,stage)=>{const last=stage===animations.length-1;for(const frame of c?.animations?.[name]??[])steps.push({frame,stage,last,ms:Math.round(130*(c.comboTimingScales?.[name]??1)/comboSpeed(stage,last))});});
    let i=0;
    const tick=()=>{
      if(token!==this.token || !this.isOpen)return;
      if(i>=steps.length){ // the finisher: hold, flash, then start over
        this.demo.classList.add('finish');this.burst.classList.remove('pop');void this.burst.offsetWidth;this.burst.classList.add('pop');
        this.timer=setTimeout(()=>{this.demo.classList.remove('finish');chips.forEach(ch=>ch.classList.remove('lit'));i=0;tick();},900);return;
      }
      const step=steps[i];draw(step.frame);
      chips.forEach((ch,j)=>ch.classList.toggle('lit',j<=step.stage));
      this.speed.textContent=step.last?`REMATE ×${comboSpeed(step.stage,true).toFixed(1)}`:'';
      this.demo.style.setProperty('--rush',step.last?'4':'0');i++;this.timer=setTimeout(tick,step.ms);
    };
    chips.forEach(ch=>ch.classList.remove('lit'));tick();
  }
  handleKey(event){
    if(!this.isOpen)return false;const k=event.key;
    if(k==='ArrowDown'||k==='ArrowUp'){event.preventDefault();const n=this.routes.length;this.index=(this.index+(k==='ArrowDown'?1:-1)+n)%n;this.render();return true;}
    if(k==='ArrowLeft'||k==='ArrowRight'){event.preventDefault();const i=ROSTER.indexOf(this.key),n=ROSTER.length;this.setFighter(ROSTER[(i+(k==='ArrowRight'?1:-1)+n)%n]);return true;}
    if(k==='Escape'||k==='Backspace'||k==='Enter'){event.preventDefault();this.close();return true;}
    return true;
  }
}
