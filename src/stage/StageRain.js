import {ARCADE} from '../data/arcade.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

/** A single rain shower, timed by the fixed gameplay clock rather than wall time. */
export class StageRain {
  constructor(scene,config,random=Math.random) {
    this.scene=scene;this.config=config;
    const [min,max]=config.delay;
    this.triggerAt=scene.combatTime+min+random()*(max-min);
    this.startedAt=null;this.until=0;this.cancelled=false;this.velocity=new WeakMap();
    const {width:w,height:h}=ARCADE.screen;
    this.dim=scene.add.rectangle(w/2,h/2,w,h,0x071829,0).setDepth(840).setScrollFactor(0).setVisible(false);
    this.rain=scene.add.graphics().setDepth(841).setScrollFactor(0);
    this.ripples=scene.add.graphics().setDepth(scene.floor.top-1).setScrollFactor(0);
    this.drops=Array.from({length:100},()=>({x:Math.random()*w,y:Math.random()*h}));
    this.puddles=Array.from({length:14},()=>({x:Math.random()*w,y:scene.floor.top+8+Math.random()*(scene.floor.bottom-scene.floor.top-16),phase:Math.random()}));
  }
  get active(){return !this.cancelled && this.startedAt!==null && this.scene.combatTime<this.until;}
  update(dt) {
    const s=this.scene;
    if(!this.cancelled && this.startedAt===null && s.combatTime>=this.triggerAt && s.health>0 && !s.finished){
      this.startedAt=s.combatTime;this.until=this.startedAt+this.config.duration;
    }
    this.rain.clear();this.ripples.clear();this.dim.setVisible(this.active);
    if(!this.active){this.velocity=new WeakMap();return;}
    const strength=clamp(Math.min((s.combatTime-this.startedAt)/650,(this.until-s.combatTime)/700),0,1);
    this.dim.setAlpha(strength*.36);
    this.rain.lineStyle(1,0xb5d6ef,.55*strength);
    for(const drop of this.drops){
      drop.x=(drop.x-dt*130+ARCADE.screen.width)%ARCADE.screen.width;
      drop.y=(drop.y+dt*620)%ARCADE.screen.height;
      this.rain.lineBetween(drop.x,drop.y,drop.x-6,drop.y+20);
    }
    this.ripples.lineStyle(1,0x99b7ce,.35*strength);
    for(const p of this.puddles){const phase=(s.combatTime/650+p.phase)%1;
      this.ripples.strokeEllipse(p.x,p.y,4+phase*19,2+phase*5);
    }
  }
  /** Smooth only grounded locomotion; attacks, jumps, hit reactions and grabs remain exact. */
  slip(actor,previous,free=true) {
    const f=this.scene.floor;
    if(!this.active || !free || (actor.z??0)>0 || previous.x<f.left || previous.x>f.right){this.velocity.delete(actor);return;}
    const target={x:actor.x-previous.x,y:actor.y-previous.y},old=this.velocity.get(actor)??{x:0,y:0};
    const retention=.72,v={x:old.x*retention+target.x*(1-retention),y:old.y*retention+target.y*(1-retention)};
    if(Math.abs(v.x)<.01)v.x=0;if(Math.abs(v.y)<.01)v.y=0;
    actor.x=clamp(previous.x+v.x,f.left,f.right);actor.y=clamp(previous.y+v.y,f.top,f.bottom);
    if(actor.x===f.left || actor.x===f.right)v.x=0;
    if(actor.y===f.top || actor.y===f.bottom)v.y=0;
    this.velocity.set(actor,v);
  }
  forget(actor){this.velocity.delete(actor);}
  clear(){this.cancelled=true;this.velocity=new WeakMap();this.dim.setVisible(false);this.rain.clear();this.ripples.clear();}
  destroy(){this.clear();this.dim.destroy();this.rain.destroy();this.ripples.destroy();}
}
