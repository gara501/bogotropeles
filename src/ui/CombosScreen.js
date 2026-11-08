import {characters} from '../data/characters.js';
import {COMBO_ROUTES,comboSpeed} from '../data/comboRoutes.js';
import {paletteFor} from '../data/palettes.js';

// COMBOS screen (main menu): the five shared routes in big type, the selected one with its buttons lighting up in
// rhythm while the chosen fighter performs it on the right, faster with every strike and a flash on the finisher.
// ↑ ↓ choose a combo · ← → change fighter · ESC / B back.
const KEYS={punch:{key:'H',pad:'X'},kick:{key:'J',pad:'Y'},lowKick:{key:'↓ J',pad:'↓ Y'},upperPunch:{key:'↑ H',pad:'↑ X'}};
const WEAPON={office:'el celular',student:'el libro',teleperforman:'la pantalla del PC',gymbro:'la mancuerna',magolita:'el cepillo'};
const ABOUT={
  ppp:()=>'Tres puños seguidos. El tercero derriba.',
  pppkk:()=>'Después de los tres puños, dos patadas: el remate lanza lejos al rival.',
  kkk:()=>'Tres patadas de largo alcance. La última derriba.',
  kkkDownK:()=>'Tres patadas y abajo + patada: barrida rastrera con onda en el suelo.',
  ppkkUpP:key=>`Dos puños, dos patadas y arriba + puño: gancho explosivo con ${WEAPON[key]??'tu arma'}.`,
};
const ROSTER=['office','student','teleperforman','gymbro','magolita'];
/** What the screen lists for a fighter: notation, keyboard keys, gamepad buttons and the description. */
export const comboRows=key=>COMBO_ROUTES.map(route=>({id:route.id,notation:route.notation,keys:route.inputs.map(i=>KEYS[i].key),pad:route.inputs.map(i=>KEYS[i].pad),about:ABOUT[route.id]?.(key)??''}));
const rectOf=r=>Array.isArray(r)?{x:r[0],y:r[1],w:r[2],h:r[3]}:{x:r.x,y:r.y,w:r.width??r.w,h:r.height??r.h};

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
    this.list.replaceChildren(...COMBO_ROUTES.map((route,i)=>{
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
  open(key,{onClose}={}){this.key=ROSTER.includes(key)?key:'office';this.onClose=onClose;this.root.hidden=false;this.render();}
  close(){clearTimeout(this.timer);this.timer=null;this.root.hidden=true;const done=this.onClose;this.onClose=null;done?.();}
  setFighter(key){this.key=key;this.render();}
  render(){
    const route=COMBO_ROUTES[this.index];
    this.list.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('active',i===this.index));
    this.list.querySelectorAll('.chip.lit').forEach(chip=>chip.classList.remove('lit'));
    this.roster.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.key===this.key);const img=b.querySelector('img');const src=this.portraits(b.dataset.key);if(src && img.src!==src)img.src=src;});
    this.about.textContent=ABOUT[route.id]?.(this.key)??'';
    this.play();
  }
  /** Loops the selected route on the fighter: each strike faster than the last, the finisher held with a flash. */
  async play(){
    clearTimeout(this.timer);this.timer=null;
    const token=this.token=Symbol(),route=COMBO_ROUTES[this.index],c=characters[this.key],key=this.key;
    const chips=[...this.list.querySelectorAll('li')[this.index].querySelectorAll('.chip')];
    const sheet=await this.sheets(key);if(token!==this.token || !this.isOpen)return;
    const ctx=this.canvas.getContext('2d'),tint=paletteFor(key,this.paletteState).tint;
    const draw=frame=>{
      const r=c?.frameRects?.[frame];ctx.clearRect(0,0,360,360);if(!r || !sheet)return;
      const {x,y,w,h}=rectOf(r),scale=Math.min(360/w,360/h);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(sheet,x,y,w,h,(360-w*scale)/2,360-h*scale,w*scale,h*scale);
      if(tint!=null){ctx.globalCompositeOperation='multiply';ctx.fillStyle=`#${tint.toString(16).padStart(6,'0')}`;ctx.fillRect(0,0,360,360);
        ctx.globalCompositeOperation='destination-in';ctx.drawImage(sheet,x,y,w,h,(360-w*scale)/2,360-h*scale,w*scale,h*scale);ctx.globalCompositeOperation='source-over';}
    };
    const steps=[];
    route.animations.forEach((name,stage)=>{const last=stage===route.animations.length-1;for(const frame of c?.animations?.[name]??[])steps.push({frame,stage,last,ms:Math.round(130/comboSpeed(stage,last))});});
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
    if(k==='ArrowDown'||k==='ArrowUp'){event.preventDefault();const n=COMBO_ROUTES.length;this.index=(this.index+(k==='ArrowDown'?1:-1)+n)%n;this.render();return true;}
    if(k==='ArrowLeft'||k==='ArrowRight'){event.preventDefault();const i=ROSTER.indexOf(this.key),n=ROSTER.length;this.setFighter(ROSTER[(i+(k==='ArrowRight'?1:-1)+n)%n]);return true;}
    if(k==='Escape'||k==='Backspace'||k==='Enter'){event.preventDefault();this.close();return true;}
    return true;
  }
}
