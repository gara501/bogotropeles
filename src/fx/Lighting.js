import {FX_ATLAS,FRAMES,VIGNETTE_TEXTURE} from './FxTextures.js';

const FRAME_MS=1000/60,ADD=1,MULTIPLY=2;
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>(Math.round(lerp(a>>16&255,b>>16&255,t))<<16)|(Math.round(lerp(a>>8&255,b>>8&255,t))<<8)|Math.round(lerp(a&255,b&255,t));

export const AMBIENT={day:0xf4f1ea,rain:0xaebfd6};

/**
 * Cheap 2D lighting without per-pixel shaders:
 *  - an ambient colour grade + baked vignette in ONE full-screen MULTIPLY quad,
 *  - pooled additive glow sprites for lights (transient flashes and per-frame "lamps").
 * Everything sits in the same atlas/blend batch, so the whole system costs a handful of draw calls.
 * `level.lights` entries ({x,y,color,radius,intensity,factor,flicker}) place static lamps.
 */
export class Lighting{
  constructor(scene,{ambient=AMBIENT.day,max=14,lights=[]}={}){
    this.scene=scene;this.max=max;this.limit=max;this.tick=0;this.time=0;this.weather=0;this.base=ambient;this.enabled=true;
    const {width:w,height:h}=scene.scale??{width:960,height:540};
    this.ambient=scene.add.image(0,0,VIGNETTE_TEXTURE).setOrigin(0).setDisplaySize(w,h).setScrollFactor(0).setDepth(830).setBlendMode(MULTIPLY).setTint(ambient);
    this.free=[];this.flashes=[];this.lamps=new Map();
    this.statics=lights.map(l=>({...l,sprite:this.sprite(l.color??0xffd9a0).setScrollFactor(l.factor??1,1).setDepth(835)}));
  }
  sprite(color){
    const s=this.free.pop()??this.scene.add.image(0,0,FX_ATLAS,'glow').setBlendMode(ADD).setDepth(835);
    return s.setTint(color).setVisible(true);
  }
  release(s){s.setVisible(false);this.free.push(s);}
  get count(){return this.flashes.length+this.lamps.size;}
  setLimit(n){this.limit=Math.max(0,Math.min(this.max,n));}
  setEnabled(on){
    this.enabled=on;this.ambient.setVisible(on);
    if(!on){for(const f of this.flashes)this.release(f.sprite);this.flashes=[];for(const l of this.lamps.values())this.release(l.sprite);this.lamps.clear();}
    for(const l of this.statics)l.sprite.setVisible(on);
  }
  /** Rain (0..1) cools and darkens the ambient colour. */
  setWeather(strength){this.weather=strength;this.ambient.setTint(mix(this.base,AMBIENT.rain,strength));}
  /** A short-lived light: hits, explosions. `vx` (px/frame) lets it travel with a projectile or wave. */
  flash(x,y,{color=0xffffff,radius=80,intensity=.8,ms=140,vx=0,grow=1.3,owner=null}={}){
    if(!this.enabled||this.count>=this.limit)return;
    this.flashes.push({sprite:this.sprite(color),x,y,radius,intensity,life:ms,age:0,vx,grow,owner});
  }
  /** A light that exists while it keeps being refreshed (a phone in flight, a gas cloud). */
  lamp(key,x,y,{color=0xffffff,radius=70,intensity=.5}={}){
    if(!this.enabled)return;
    let l=this.lamps.get(key);
    if(!l){if(this.count>=this.limit)return;l={sprite:this.sprite(color)};this.lamps.set(key,l);}
    Object.assign(l,{x,y,radius,intensity,seen:this.tick});l.sprite.setTint(color);
  }
  place(s,x,y,radius,alpha){s.setPosition(Math.round(x),Math.round(y)).setScale(radius*2/FRAMES.glow.w).setAlpha(Math.min(1,Math.max(0,alpha)));}
  clearOwner(owner){
    const lamp=this.lamps.get(owner);if(lamp){this.release(lamp.sprite);this.lamps.delete(owner);}
    for(let i=this.flashes.length-1;i>=0;i--)if(this.flashes[i].owner===owner){this.release(this.flashes[i].sprite);this.flashes.splice(i,1);}
  }
  update(ms){
    this.tick++;this.time+=ms;
    if(!this.enabled)return;
    const f=ms/FRAME_MS;
    for(let i=this.flashes.length-1;i>=0;i--){
      const l=this.flashes[i];l.age+=ms;const t=l.age/l.life;
      if(t>=1){this.release(l.sprite);this.flashes[i]=this.flashes[this.flashes.length-1];this.flashes.pop();continue;}
      l.x+=l.vx*f;this.place(l.sprite,l.x,l.y,l.radius*(1+(l.grow-1)*t),l.intensity*(1-t)*(1-t));
    }
    for(const [key,l] of this.lamps){
      if(this.tick-l.seen>2){this.release(l.sprite);this.lamps.delete(key);continue;}
      this.place(l.sprite,l.x,l.y,l.radius,l.intensity);
    }
    for(const l of this.statics){
      const flicker=l.flicker?1-l.flicker*(.5+.5*Math.sin(this.time/(90+l.x%40)+l.x)):1;
      this.place(l.sprite,l.x,l.y,l.radius,(l.intensity??.5)*flicker);
    }
  }
  destroy(){
    this.ambient.destroy();
    for(const f of this.flashes)f.sprite.destroy();for(const l of this.lamps.values())l.sprite.destroy();
    for(const l of this.statics)l.sprite.destroy();for(const s of this.free)s.destroy();
    this.flashes=[];this.lamps.clear();this.statics=[];this.free=[];
  }
}
