// Pooled particle system. Pure logic (no Phaser import): sprites come from `create()`, so it is unit-testable.
// Velocities are in px per 60 Hz frame (like the rest of the game); `life`/dt are in milliseconds.
const FRAME_MS=1000/60;

export class ParticleSystem{
  /** @param {{create:()=>object, max?:number}} options */
  constructor({create,max=220}){this.create=create;this.max=max;this.live=[];this.free=[];this.limit=max;}
  /** Lowering the limit sheds load at once: extra live particles are dropped on the next update. */
  setLimit(n){this.limit=Math.max(0,Math.min(this.max,n));}
  get count(){return this.live.length;}
  /**
   * spec: {frame,x,y,vx,vy,ay,drag,life,s0,s1,a0,a1,colors,stretch,rot,spin,depth,blend}
   * Sizes are display pixels; `stretch` elongates along the velocity (sparks).
   */
  emit(spec){
    if(this.live.length>=this.limit)return null;
    const p=this.free.pop()??{sprite:this.create()};
    Object.assign(p,{frame:'px',vx:0,vy:0,ay:0,drag:0,s0:2,s1:2,a0:1,a1:0,colors:[0xffffff],stretch:0,rot:0,spin:0,depth:0,blend:0,age:0,native:2,tint:-1,owner:null},spec,{age:0,tint:-1});
    // Additive particles sit half a depth step above normal ones, so a burst draws as two batches instead of many.
    p.sprite.setFrame?.(p.frame);p.sprite.setBlendMode?.(p.blend).setDepth?.(p.depth+(p.blend?.5:0)).setVisible?.(true);
    this.live.push(p);this.apply(p,0);
    return p;
  }
  apply(p,t){
    const s=p.sprite,size=p.s0+(p.s1-p.s0)*t;
    const speed=Math.hypot(p.vx,p.vy),length=size*(1+p.stretch*speed);
    // Colour is stepped through the ramp (not interpolated) to keep the hard-banded pixel look.
    const color=p.colors[Math.min(p.colors.length-1,Math.floor(t*p.colors.length))];
    // Plain property writes: cheaper than chained setters on every particle every frame.
    s.x=Math.round(p.x);s.y=Math.round(p.y);
    s.scaleX=length/p.native;s.scaleY=size/p.native;
    s.rotation=p.stretch?Math.atan2(p.vy,p.vx):p.rot;
    s.alpha=Math.max(0,p.a0+(p.a1-p.a0)*t*t);
    if(color!==p.tint){p.tint=color;s.setTint?.(color);}
  }
  update(ms){
    const f=ms/FRAME_MS;
    for(let i=this.live.length-1;i>=0;i--){
      const p=this.live[i];p.age+=ms;
      const t=p.age/p.life;
      if(t>=1||this.live.length>this.limit){this.release(i);continue;}
      p.vy+=p.ay*f;
      if(p.drag){const k=Math.pow(1-p.drag,f);p.vx*=k;p.vy*=k;}
      p.x+=p.vx*f;p.y+=p.vy*f;p.rot+=p.spin*f;
      this.apply(p,t);
    }
  }
  release(i){
    const last=this.live.length-1,p=this.live[i];
    this.live[i]=this.live[last];this.live.pop();
    p.sprite.setVisible?.(false);this.free.push(p);
  }
  clear(){while(this.live.length)this.release(this.live.length-1);}
  clearOwner(owner){for(let i=this.live.length-1;i>=0;i--)if(this.live[i].owner===owner)this.release(i);}
  destroy(){this.clear();for(const p of this.free)p.sprite.destroy?.();this.free=[];}
}
