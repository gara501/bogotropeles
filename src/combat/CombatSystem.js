import {ARCADE} from '../data/arcade.js';
export class AttackTokens {
  constructor(limit=ARCADE.ai.tokens){this.limit=limit;this.owners=new Set();}
  acquire(actor){if(this.owners.has(actor))return true;if(this.owners.size>=this.limit)return false;this.owners.add(actor);return true;}
  release(actor){this.owners.delete(actor);}
  clear(){this.owners.clear();}
}
export class CombatSystem {
  constructor(scene){this.scene=scene;this.frame=0;this.stops=new Map();this.flashes=new Map();this.impacts=[];this.tokens=new AttackTokens();}
  hurtbox(actor){return {x:actor.x,y:actor.y,halfWidth:actor.config?.hurtbox?.halfWidth??ARCADE.body.halfWidth,halfDepth:actor.config?.hurtbox?.halfDepth??ARCADE.body.halfDepth};}
  hitbox(actor,attack){return {x:actor.x+attack.facing*attack.range/2,y:actor.y,halfWidth:attack.range/2,halfDepth:(attack.lane??ARCADE.body.lane)/2};}
  touches(attacker,target,attack){
    const a=this.hitbox(attacker,attack),b=this.hurtbox(target),lane=attack.lane??ARCADE.body.lane;
    if(Math.abs(attacker.y-target.y)>=lane || (target.z??0)>=ARCADE.body.airborneAvoidHeight)return false;
    if(attack.area)return Math.abs(attacker.x-target.x)<=attack.range+b.halfWidth;
    const forward=(target.x-attacker.x)*attack.facing;
    return forward>=-ARCADE.body.backReach && Math.abs(a.x-b.x)<=a.halfWidth+b.halfWidth && Math.abs(a.y-b.y)<=a.halfDepth+b.halfDepth;
  }
  frozen(actor){return this.frame<=(this.stops.get(actor)??-1);}
  impact(attacker,victim,attack){
    const n=attack.finisher?ARCADE.feedback.finisherHitstop:ARCADE.feedback.hitstop;
    for(const actor of [attacker,victim])if(actor){this.stops.set(actor,Math.max(this.stops.get(actor)??0,this.frame+n));actor.sprite?.anims?.pause();}
    victim?.sprite?.setTintFill?.(0xffffff);this.flashes.set(victim,this.frame+ARCADE.feedback.flash);
    this.scene.cameras?.main.shake(ARCADE.feedback.shakeMs,ARCADE.feedback.shakeStrength);
    const graphic=this.scene.add?.graphics?.();
    if(graphic)this.impacts.push({graphic,x:((attacker?.x??victim.x)+victim.x)/2,y:victim.y-(victim.config?.height??0)/2,until:this.frame+ARCADE.feedback.impact});
  }
  step(frame){
    this.frame=frame;
    for(const [actor,until] of this.flashes)if(frame>until){actor?.sprite?.clearTint?.();this.flashes.delete(actor);}
    for(const [actor,until] of this.stops)if(frame>until){actor.sprite?.anims?.resume();this.stops.delete(actor);}
    this.impacts=this.impacts.filter(p=>{
      if(frame>p.until){p.graphic.destroy();return false;}
      const r=ARCADE.feedback.impactRadius*(1+(ARCADE.feedback.impact-(p.until-frame))/ARCADE.feedback.impact);
      p.graphic.clear().lineStyle(3,0xffffff,1).strokeCircle(p.x,p.y,r).setDepth(p.y+100);return true;
    });
  }
  push(actor,attack){actor.x=Math.max(this.scene.floor.left,Math.min(this.scene.floor.right,actor.x+attack.facing*(attack.finisher?ARCADE.attack.finisherKnockback:ARCADE.attack.knockback)));}
  groundImpact(actor){const graphic=this.scene.add?.graphics?.();if(graphic)this.impacts.push({graphic,x:actor.x,y:actor.y,until:this.frame+ARCADE.feedback.impact});}
  clear(){for(const actor of this.flashes.keys())actor?.sprite?.clearTint?.();this.stops.clear();this.flashes.clear();this.tokens.clear();for(const p of this.impacts)p.graphic.destroy();this.impacts=[];}
}
