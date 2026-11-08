import {PALETTES,UNLOCKS,paletteAvailable,paletteFor,cyclePalette,savePaletteState} from '../data/palettes.js';

const hex=tint=>`#${tint.toString(16).padStart(6,'0')}`;
/** Row of colour swatches on the character selection, plus a tinted preview of every portrait. ↑ ↓ cycle it. */
export class PalettePicker {
  constructor({state,storage,getCharacter,anchor}){
    this.state=state;this.storage=storage;this.getCharacter=getCharacter;this.cache=new Map();
    this.root=document.createElement('div');this.root.className='palette-picker';this.root.setAttribute('role','group');this.root.setAttribute('aria-label','Color del personaje');
    const label=document.createElement('span');label.className='palette-label';label.textContent='COLOR · ↑ ↓';this.root.append(label);
    this.buttons=PALETTES.map(palette=>{
      const button=document.createElement('button');button.type='button';button.dataset.palette=palette.id;
      const swatch=document.createElement('i');swatch.style.background=palette.tint==null?'linear-gradient(135deg,#e8edce 50%,#5b6b62 50%)':hex(palette.tint);
      button.append(swatch,document.createTextNode(palette.name));
      button.addEventListener('click',()=>this.select(palette.id));this.root.append(button);return button;
    });
    anchor?.after(this.root);
    for(const img of document.querySelectorAll('[data-portrait]'))img.addEventListener('load',()=>this.preview(img));
    this.refresh();
  }
  select(id){
    const palette=PALETTES.find(p=>p.id===id);if(!palette || !paletteAvailable(palette,this.state))return;
    this.state.selected[this.getCharacter()]=id;savePaletteState(this.state,this.storage);this.refresh();
  }
  cycle(direction=1){cyclePalette(this.getCharacter(),this.state,direction);savePaletteState(this.state,this.storage);this.refresh();}
  refresh(){
    const current=paletteFor(this.getCharacter(),this.state);
    for(const button of this.buttons){
      const palette=PALETTES.find(p=>p.id===button.dataset.palette),open=paletteAvailable(palette,this.state);
      button.disabled=!open;button.setAttribute('aria-pressed',String(palette===current));
      button.title=open?palette.name:`🔒 ${UNLOCKS[palette.unlock]}`;button.classList.toggle('locked',!open);
    }
    for(const img of document.querySelectorAll('[data-portrait]'))this.preview(img);
  }
  /** Multiply tint on a copy of the portrait, the same blend Phaser's setTint uses on the sprite. */
  preview(img){
    const src=img.getAttribute('src');if(!src)return;
    if(!src.startsWith('data:'))img.dataset.baseSrc=src;
    const base=img.dataset.baseSrc,palette=paletteFor(img.dataset.portrait,this.state);if(!base)return;
    if(palette.tint==null){if(src!==base)img.src=base;return;}
    const key=`${base}|${palette.tint}`,cached=this.cache.get(key);if(cached){if(src!==cached)img.src=cached;return;}
    const source=new Image();source.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
      const ctx=canvas.getContext('2d');if(!ctx)return;
      ctx.drawImage(source,0,0);ctx.globalCompositeOperation='multiply';ctx.fillStyle=hex(palette.tint);ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.globalCompositeOperation='destination-in';ctx.drawImage(source,0,0);
      const url=canvas.toDataURL();this.cache.set(key,url);if(paletteFor(img.dataset.portrait,this.state)===palette)img.src=url;
    };source.src=base;
  }
}
/** Small notice (palette unlocked…) that fades by itself. */
export function toast(message){
  const el=document.createElement('div');el.className='palette-toast';el.setAttribute('role','status');el.textContent=message;document.body.append(el);
  setTimeout(()=>el.classList.add('out'),2600);setTimeout(()=>el.remove(),3200);
}
