import {characters} from '../data/characters.js';
import {characterIntros} from '../data/characterIntros.js';
import {paletteFor} from '../data/palettes.js';

// Character selection (Streets of Rage 4 style): a tall art panel with the fighter's in-game sprite in front, the
// "P1 ── NAME" bar under it and the strip of portraits along the bottom band. Reuses the existing #selection DOM
// (fighter-card buttons, palette picker) so main.js keeps its handlers; this module only lays it out and draws.
const hex=tint=>`#${tint.toString(16).padStart(6,'0')}`;
const rectOf=r=>Array.isArray(r)?{x:r[0],y:r[1],w:r[2],h:r[3]}:{x:r.x,y:r.y,w:r.width??r.w,h:r.height??r.h};
const loadImage=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});

export class SelectScreen {
  constructor({root,paletteState,modeLabel=()=>''}){
    this.root=root;this.paletteState=paletteState;this.modeLabel=modeLabel;this.sheets=new Map();this.key=null;this.anim=null;
    root.classList.add('sor-select');
    const stage=document.createElement('div');stage.className='select-stage';
    stage.innerHTML=`<div class="select-art"><img class="select-art-img" alt=""><canvas class="select-sprite" width="320" height="320" aria-hidden="true"></canvas></div>
      <div class="select-namebar"><b>P1</b><span class="select-name"></span></div><p class="select-desc"></p>`;
    const top=document.createElement('div');top.className='select-top';
    top.innerHTML=`<div class="select-keys"><span><i class="pad-a">A</i> ENTER · OK</span><button type="button" class="select-cancel"><i class="pad-b">B</i> ESC · CANCELAR</button></div><div class="select-mode"></div>`;
    const band=document.createElement('div');band.className='select-band';band.innerHTML='<span class="select-band-title">SELECCIONA</span>';
    const options=root.querySelector('.fighter-options');
    root.prepend(top);top.after(stage);
    band.append(options);root.append(band);
    this.stage=stage;this.art=stage.querySelector('.select-art-img');this.canvas=stage.querySelector('.select-sprite');
    this.name=stage.querySelector('.select-name');this.desc=stage.querySelector('.select-desc');this.mode=top.querySelector('.select-mode');
    this.cancel=top.querySelector('.select-cancel');
    const palette=root.querySelector('.palette-picker');if(palette)stage.append(palette);
    for(const card of root.querySelectorAll('.fighter-card'))card.insertAdjacentHTML('beforeend','<em class="p1-tag">P1</em>');
  }
  show(key){
    this.mode.textContent=this.modeLabel();
    if(key===this.key){this.drawIdle();return;}
    this.key=key;const c=characters[key],intro=characterIntros[key];
    this.name.textContent=c?.name??key.toUpperCase();this.desc.textContent=intro?.description??'';
    const portrait=this.root.querySelector(`[data-portrait="${key}"]`);
    this.art.src=portrait?.dataset.baseSrc||portrait?.getAttribute('src')||'';
    this.stage.classList.remove('enter');void this.stage.offsetWidth;this.stage.classList.add('enter');
    this.drawIdle();
  }
  /** Stacks the main sheet and its appended sheets exactly as the game does, once per fighter. */
  sheet(key){
    if(!this.sheets.has(key)){
      const c=characters[key];
      this.sheets.set(key,Promise.all([c.url,...(c.appendUrls??[])].map(loadImage)).then(images=>{
        const canvas=document.createElement('canvas');canvas.width=Math.max(...images.map(i=>i.width));canvas.height=images.reduce((h,i)=>h+i.height,0);
        const ctx=canvas.getContext('2d');let y=0;for(const img of images){ctx.drawImage(img,0,y);y+=img.height;}return canvas;
      }).catch(()=>null));
    }
    return this.sheets.get(key);
  }
  async draw(key,frames,{loop=false,ms=110}={}){
    clearInterval(this.anim);this.anim=null;
    const c=characters[key],sheet=await this.sheet(key);if(!sheet || key!==this.key || !c?.frameRects)return;
    const rects=frames.map(f=>c.frameRects[f]).filter(Boolean).map(rectOf);if(!rects.length)return;
    const base=rectOf(c.frameRects[c.idle]??c.frameRects[0]),scale=Math.min(300/base.h,1.8),ctx=this.canvas.getContext('2d');
    const tint=paletteFor(key,this.paletteState).tint;
    let i=0;const paint=()=>{
      const r=rects[i%rects.length],w=r.w*scale,h=r.h*scale;
      ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.imageSmoothingEnabled=false;
      ctx.globalCompositeOperation='source-over';ctx.drawImage(sheet,r.x,r.y,r.w,r.h,(this.canvas.width-w)/2,this.canvas.height-h,w,h);
      if(tint!=null){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=1;ctx.fillStyle=hex(tint);
        ctx.globalCompositeOperation='multiply';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        ctx.globalCompositeOperation='destination-in';ctx.drawImage(sheet,r.x,r.y,r.w,r.h,(this.canvas.width-w)/2,this.canvas.height-h,w,h);}
      ctx.globalCompositeOperation='source-over';i++;
      if(!loop && i>=rects.length){clearInterval(this.anim);this.anim=null;}
    };
    paint();if(rects.length>1)this.anim=setInterval(paint,ms);
  }
  drawIdle(){const c=characters[this.key];if(c)this.draw(this.key,[c.idle]);}
  /** Confirming: the victory pose, then the callback. */
  confirm(done){
    const c=characters[this.key],frames=c?.animations?.victory;
    this.stage.classList.add('chosen');
    if(frames?.length){this.draw(this.key,frames,{ms:120});setTimeout(()=>{this.stage.classList.remove('chosen');done();},Math.min(900,frames.length*120+250));}
    else{this.stage.classList.remove('chosen');done();}
  }
}
