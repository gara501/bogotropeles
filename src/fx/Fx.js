import {ensureFxTextures,FX_ATLAS,FRAMES} from './FxTextures.js';
import {ParticleSystem} from './ParticleSystem.js';
import {Lighting} from './Lighting.js';

const ADD=1;
export const QUALITY={off:0,low:1,high:2};
const NAMES=Object.keys(QUALITY);
const LIMITS={0:{particles:0,lights:0},1:{particles:70,lights:5},2:{particles:220,lights:14}};

// Hit recipes: how many sparks, how fast, colour ramps (hot → cool) and the light each hit throws.
const HIT={
  punch:{n:7,speed:[2.5,5],life:[170,260],size:2,colors:[0xffffff,0xfff2a0,0xffb347],core:26,ring:0,
    light:{color:0xffd27a,radius:70,intensity:.7,ms:130}},
  kick:{n:11,speed:[3,7],life:[200,320],size:2,colors:[0xffffff,0xffe3a0,0xff9a3d,0x7a3b1d],core:36,ring:44,
    light:{color:0xffb347,radius:95,intensity:.85,ms:160}},
  finisher:{n:20,speed:[3.5,9],life:[240,420],size:3,colors:[0xffffff,0xffe14d,0xff7a36,0xb32d1a],core:52,ring:70,chips:6,
    light:{color:0xff8a3d,radius:140,intensity:1,ms:230}},
};
const rand=(rng,[a,b])=>a+(b-a)*rng();

/** Resolves the initial quality: `?fx=off|low|high` wins, touch devices start on low. */
export function initialQuality(scene){
  try{
    const q=new URLSearchParams(globalThis.location?.search??'').get('fx');
    if(q in QUALITY)return QUALITY[q];
  }catch{}
  return scene?.game?.touchControls?.mobile?.()?QUALITY.low:QUALITY.high;
}

/**
 * Facade for visual effects. Owns the particle pool and the lighting layer and watches the frame rate:
 * if the game cannot hold ~60 fps it sheds load step by step (high → low → off) instead of stuttering.
 */
export class Fx{
  constructor(scene,{lights=[],ambient,rng=Math.random}={}){
    this.scene=scene;this.rng=rng;this.ready=ensureFxTextures(scene);this.ticks=0;this.slow=0;this.fast=0;
    this.quality=this.ready?initialQuality(scene):QUALITY.off;this.pinned=new URLSearchParams(globalThis.location?.search??'').has('fx');
    if(!this.ready)return;
    this.particles=new ParticleSystem({max:LIMITS[2].particles,create:()=>scene.add.image(0,0,FX_ATLAS,'px')});
    this.lighting=new Lighting(scene,{lights,ambient,max:LIMITS[2].lights});
    this.apply();
  }
  get active(){return this.ready&&this.quality>0;}
  apply(){
    const l=LIMITS[this.quality];
    this.particles.setLimit(l.particles);this.lighting.setLimit(l.lights);this.lighting.setEnabled(this.quality>0);
    if(!this.quality)this.particles.clear();
  }
  setQuality(q){if(this.ready&&q!==this.quality){this.quality=q;this.apply();}}
  count(n){return this.quality===QUALITY.high?n:Math.ceil(n*.5);}
  update(ms){
    if(!this.ready)return;
    this.lighting.update(ms);this.particles.update(ms);
    if(!this.pinned&&++this.ticks%30===0)this.govern();
  }
  /** Sample the real frame rate twice a second; degrade quickly, recover slowly. */
  govern(){
    const fps=this.scene.game?.loop?.actualFps;
    if(!fps)return;
    if(fps<48){this.fast=0;if(++this.slow>=3&&this.quality>0){this.slow=0;this.setQuality(this.quality-1);}}
    else if(fps>=58){this.slow=0;if(++this.fast>=20&&this.quality<QUALITY.high){this.fast=0;this.setQuality(this.quality+1);}}
    else this.slow=this.fast=0;
  }
  stats(){return this.ready?{quality:NAMES[this.quality],particles:this.particles.count,lights:this.lighting.count}:{quality:'off'};}

  // ---- helpers -------------------------------------------------------------------------------------------
  flash(x,y,opts){if(this.active)this.lighting.flash(x,y,opts);}
  lamp(key,x,y,opts){if(this.active)this.lighting.lamp(key,x,y,opts);}
  setWeather(strength){if(this.ready)this.lighting.setWeather(strength);}
  glow(x,y,depth,{size,color,life=110,alpha=.9,grow=1.5}){
    this.particles.emit({frame:'glow',native:FRAMES.glow.w,x,y,depth,blend:ADD,life,s0:size*.5,s1:size*grow,a0:alpha,a1:0,colors:[color]});
  }
  ring(x,y,depth,{size,color,life=190}){
    this.particles.emit({frame:'ring',native:FRAMES.ring.w,x,y,depth,blend:ADD,life,s0:size*.25,s1:size,a0:.9,a1:0,colors:[color]});
  }
  /** Spray of sparks. angle/spread in radians; speeds in px/frame. */
  sparks(x,y,depth,{angle,spread=Math.PI,n,speed,life,size=2,colors,ay=.12,drag=.07,stretch=.5}){
    for(let i=0;i<this.count(n);i++){
      const a=angle+(this.rng()-.5)*spread,v=rand(this.rng,speed);
      this.particles.emit({x,y,depth,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay,drag,life:rand(this.rng,life),s0:size,s1:Math.max(1,size-1),a0:1,a1:.1,colors,stretch});
    }
  }
  /** Player hit: core flash, ring on heavy hits, a cone of sparks away from the attacker, a light. Returns false when FX are off. */
  hit(x,y,facing,kind){
    if(!this.active)return false;
    const r=HIT[kind]??HIT.punch,depth=y+100,base=facing>0?0:Math.PI;
    this.lighting.flash(x,y,r.light);
    this.glow(x,y,depth,{size:r.core*2,color:r.colors[1],life:120});
    if(r.ring)this.ring(x,y,depth,{size:r.ring*2,color:r.colors[1]});
    this.sparks(x,y,depth,{angle:base,spread:Math.PI*.9,n:r.n,speed:r.speed,life:r.life,size:r.size,colors:r.colors});
    this.sparks(x,y,depth,{angle:base+Math.PI,spread:Math.PI*.8,n:Math.ceil(r.n*.25),speed:[r.speed[0]*.5,r.speed[1]*.5],life:r.life,size:r.size,colors:r.colors});
    if(r.chips)this.sparks(x,y,depth,{angle:base-Math.PI/2,spread:Math.PI*1.2,n:r.chips,speed:[2,5],life:[320,520],size:3,colors:[0x9a8a78,0x5a4c40],ay:.35,drag:.02,stretch:0});
    return true;
  }
  /** Stomp: floor flash, dust billowing both ways, debris, a squashed shockwave ring and a warm light. */
  quake(x,y,range){
    if(!this.active)return false;
    const depth=y+90;
    this.lighting.flash(x,y-8,{color:0xffc46b,radius:range*.9,intensity:.9,ms:260});
    this.glow(x,y,depth,{size:range*.9,color:0xfff4c8,life:130,alpha:.8});
    for(let i=0;i<this.count(12);i++){
      const side=i%2?1:-1,v=1+this.rng()*2.4;
      this.particles.emit({frame:'glow',native:FRAMES.glow.w,x:x+side*(6+this.rng()*14),y:y-4-this.rng()*8,depth:y+95,vx:side*v,vy:-.25-this.rng()*.5,drag:.04,
        life:520+this.rng()*380,s0:16,s1:44+this.rng()*28,a0:.5,a1:0,colors:[0xe6d6b4,0xcbb893,0xa8997a]});
    }
    this.sparks(x,y-6,depth+5,{angle:-Math.PI/2,spread:Math.PI*1.1,n:12,speed:[2.5,7],life:[380,650],size:3,colors:[0x9a8a78,0x5a4c40],ay:.4,drag:.015,stretch:0});
    this.sparks(x,y-6,depth+5,{angle:-Math.PI/2,spread:Math.PI*1.4,n:10,speed:[3,8],life:[200,380],size:2,colors:[0xffffff,0xffb347,0x7a3b1d]});
    return true;
  }
  /** Generic coloured burst (phone impact, book blast…). */
  burst(x,y,depth,{colors,n=14,speed=[2,6],life=[220,380],size=2,glowColor,glowSize=60,light}={}){
    if(!this.active)return false;
    if(light)this.lighting.flash(x,y,light);
    if(glowColor!==undefined)this.glow(x,y,depth,{size:glowSize,color:glowColor});
    this.sparks(x,y,depth,{angle:0,spread:Math.PI*2,n,speed,life,size,colors});
    return true;
  }
  /** Charge motes converge on the body; a keyed light grows without allocating a new light per tick. */
  superCharge(owner,x,y,depth,age,release,color){
    if(!this.active)return false;
    const t=age/release;
    this.lighting.lamp(owner,x,y,{color,radius:65+t*65,intensity:.25+t*.5});
    if(age%3===0)for(let i=0;i<this.count(3);i++){
      const angle=this.rng()*Math.PI*2,r=45+this.rng()*35,life=220+this.rng()*100,frames=life/(1000/60);
      this.particles.emit({owner,x:x+Math.cos(angle)*r,y:y+Math.sin(angle)*r,depth,vx:-Math.cos(angle)*r/frames,vy:-Math.sin(angle)*r/frames,
        blend:ADD,life,s0:2,s1:4,a0:.45,a1:1,colors:[color,0xffffff],stretch:.25});
    }
    return true;
  }
  /** A single radial blast, with bounded particle counts and a light that fades with its shockwave. */
  superBlast(owner,x,y,depth,color){
    if(!this.active)return false;
    this.clearSuper(owner);
    this.lighting.flash(x,y,{owner,color,radius:210,intensity:1,ms:560,grow:2.4});
    this.particles.emit({owner,frame:'glow',native:FRAMES.glow.w,x,y,depth,blend:ADD,life:420,s0:70,s1:250,a0:.95,a1:0,colors:[0xffffff,color]});
    this.particles.emit({owner,frame:'ring',native:FRAMES.ring.w,x,y,depth,blend:ADD,life:580,s0:40,s1:1500,a0:.9,a1:0,colors:[0xffffff,color]});
    const n=this.count(44);
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2+(this.rng()-.5)*.14,v=5+this.rng()*8;
      this.particles.emit({owner,x,y,depth,blend:ADD,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:.025,life:350+this.rng()*230,
        s0:3,s1:1,a0:1,a1:0,colors:[0xffffff,color,(color&0xfefefe)>>1],stretch:.6});
    }
    return true;
  }
  clearSuper(owner){this.particles?.clearOwner(owner);this.lighting?.clearOwner(owner);}
  clear(){this.particles?.clear();}
  destroy(){if(!this.ready)return;this.particles.destroy();this.lighting.destroy();this.ready=false;}
}
