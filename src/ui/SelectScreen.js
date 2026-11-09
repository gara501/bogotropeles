import {characters} from '../data/characters.js';
import {characterIntros} from '../data/characterIntros.js';
import {paletteFor} from '../data/palettes.js';
import {preparePlayerPreview,drawPlayerPreview} from './playerPreviewSheet.js';
import loadingShieldUrl from '../data/UI/selection_loading_shield.png?url';

// Character selection (Streets of Rage 4 style): a tall art panel with the fighter's in-game sprite in front, the
// "P1 ── NAME" bar under it and the strip of portraits along the bottom band. Reuses the existing #selection DOM
// (fighter-card buttons, palette picker) so main.js keeps its handlers; this module only lays it out and draws.
const loadImage=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});

export class SelectScreen {
  constructor({root,paletteState,modeLabel=()=>''}){
    this.root=root;this.paletteState=paletteState;this.modeLabel=modeLabel;this.sheets=new Map();this.key=null;this.anim=null;
    root.classList.add('sor-select');
    const stage=document.createElement('div');stage.className='select-stage';
    stage.innerHTML=`<div class="select-art"><img class="select-art-img" alt=""><canvas class="select-sprite" width="320" height="320" aria-hidden="true"></canvas>
      <div class="select-loading" hidden><img src="${loadingShieldUrl}" alt="" aria-hidden="true" loading="eager" decoding="async"><span role="status" aria-live="polite"></span></div></div>
      <div class="select-namebar"><b>P1</b><span class="select-name"></span></div><p class="select-desc"></p>`;
    const top=document.createElement('div');top.className='select-top';
    top.innerHTML=`<div class="select-keys"><span><i class="pad-a">A</i> ENTER · OK</span><button type="button" class="select-cancel"><i class="pad-b">B</i> ESC · CANCELAR</button></div><div class="select-mode"></div>`;
    const band=document.createElement('div');band.className='select-band';band.innerHTML='<span class="select-band-title">SELECCIONA</span>';
    const options=root.querySelector('.fighter-options');
    root.prepend(top);top.after(stage);
    band.append(options);root.append(band);
    this.stage=stage;this.art=stage.querySelector('.select-art-img');this.canvas=stage.querySelector('.select-sprite');
    this.loading=stage.querySelector('.select-loading');this.loadingLabel=this.loading.querySelector('[role="status"]');
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
    // A new img.src can keep displaying its previous bitmap until it loads.
    this.art.hidden=true;
    this.art.onload=()=>{if(this.key===key && this.art.currentSrc===this.art.src)this.art.hidden=!this.loading.hidden;};
    this.art.src=portrait?.dataset.baseSrc||portrait?.getAttribute('src')||'';
    this.stage.classList.remove('enter');void this.stage.offsetWidth;this.stage.classList.add('enter');
    this.drawIdle();
  }
  /** Stacks the main sheet and its appended sheets exactly as the game does, once per fighter. */
  sheet(key){
    if(!this.sheets.has(key)){
      const c=characters[key];
      this.sheets.set(key,Promise.all([c.url,...(c.appendUrls??[])].map(loadImage)).then(async images=>{
        // Let the loading silhouette paint before synchronous atlas preparation blocks the main thread.
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        return preparePlayerPreview(images,c);
      }).catch(()=>{this.sheets.delete(key);return null;}));
    }
    return this.sheets.get(key);
  }
  async draw(key,frames,{loop=false,ms=110}={}){
    const token=this.drawToken=Symbol();clearInterval(this.anim);this.anim=null;
    const ctx=this.canvas.getContext('2d');
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.canvas.hidden=true;
    if(this.art)this.art.hidden=true;
    this.stage.setAttribute('aria-busy','true');this.loading.hidden=false;
    const c=characters[key];this.loadingLabel.textContent=`CARGANDO ${c?.name??key.toUpperCase()}…`;
    const sheet=await this.sheet(key);
    if(token!==this.drawToken || key!==this.key)return;
    const poses=frames.filter(f=>sheet?.frames[f]);
    if(!sheet || !c?.frameRects || !poses.length){
      this.stage.setAttribute('aria-busy','false');this.loadingLabel.textContent='VISTA NO DISPONIBLE · VUELVE A SELECCIONAR';return;
    }
    const tint=paletteFor(key,this.paletteState).tint;
    let i=0;const paint=()=>{
      drawPlayerPreview(ctx,sheet,poses[i%poses.length],tint);i++;
      if(!loop && i>=poses.length){clearInterval(this.anim);this.anim=null;}
    };
    paint();this.canvas.hidden=false;this.loading.hidden=true;this.stage.setAttribute('aria-busy','false');
    if(this.art)this.art.hidden=!(this.art.complete && this.art.naturalWidth);
    if(poses.length>1)this.anim=setInterval(paint,ms);
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
