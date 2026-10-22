import {ARCADE} from '../data/arcade.js';
export class AttackTokens {
  constructor(limit=ARCADE.ai.tokens){this.limit=limit;this.owners=new Set();}
  acquire(actor){if(this.owners.has(actor))return true;if(this.owners.size>=this.limit)return false;this.owners.add(actor);return true;}
  release(actor){this.owners.delete(actor);}
  clear(){this.owners.clear();}
}
export class CombatSystem {
  constructor(scene){this.scene=scene;this.frame=0;this.stops=new Map();this.flashes=new Map();this.impacts=[];this.tokens=new AttackTokens();this.pool=[];}
  /** Impact effects reuse a few Graphics objects instead of creating and destroying one per hit. */
  acquire(){const pooled=this.pool.pop();if(pooled){pooled.setVisible?.(true);return pooled;}return this.scene.add?.graphics?.();}
  release(graphic){if(this.pool.length<12){graphic.clear?.();graphic.setVisible?.(false);this.pool.push(graphic);}else graphic.destroy();}
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
    const f=ARCADE.feedback,s=this.scene,byPlayer=attacker && attacker===s.player;
    if(byPlayer && attack.finisher)s.cameras?.main.shake(f.finisherShake.ms,f.finisherShake.strength);else s.cameras?.main.shake(f.shakeMs,f.shakeStrength);
    const graphic=this.acquire();
    if(!graphic)return;
    if(!byPlayer){this.impacts.push({graphic,x:((attacker?.x??victim.x)+victim.x)/2,y:victim.y-(victim.config?.height??0)/2,until:this.frame+f.impact});return;}
    // The player's hits: sparks by strike type at the contact point (kicks land lower), plus a rebound on finishers.
    const kick=/kick|stomp/i.test(attack.type??''),kind=attack.finisher?'finisher':kick?'kick':'punch',life=f.sparks[kind];
    const facing=attack.facing||Math.sign(victim.x-attacker.x)||1,height=victim.config?.height??100;
    this.impacts.push({graphic,kind,facing,x:victim.x-facing*24,y:victim.y-height*(kick?.42:.62),born:this.frame,until:this.frame+life,life,
      seed:(victim.x*7+this.frame*13)%360});
    if(attack.finisher)attacker.x=Math.max(s.floor.left,Math.min(s.floor.right,attacker.x-facing*f.recoil));
  }
  /** Spark burst: rays radiating from the contact point that shoot out and fade. */
  drawSparks(p,frame){
    const t=Math.min(1,(frame-p.born)/p.life),g=p.graphic.clear().setDepth(p.y+100);
    const spec={punch:{rays:6,len:16,width:3,color:0xfff2a0,core:0xffffff},kick:{rays:8,len:26,width:4,color:0xffffff,core:0xffb347},
      finisher:{rays:10,len:36,width:5,color:0xffe14d,core:0xff5a36}}[p.kind];
    const alpha=1-t*t,reach=spec.len*(.45+t*.9);
    for(let i=0;i<spec.rays;i++){
      // Rays fan out mostly away from the attacker.
      const angle=(p.seed+i*360/spec.rays)*Math.PI/180,bias=Math.cos(angle)*p.facing<0?.55:1,r0=reach*.35*bias,r1=reach*bias;
      const x0=p.x+Math.cos(angle)*r0,y0=p.y+Math.sin(angle)*r0*.8,x1=p.x+Math.cos(angle)*r1,y1=p.y+Math.sin(angle)*r1*.8,w=spec.width*(1-t*.6);
      // Dark outline first so the spark reads over light sprites (and over the white hit flash).
      g.lineStyle(w+3,0x2a1200,alpha*.7).lineBetween(x0,y0,x1,y1);
      g.lineStyle(w,spec.color,alpha).lineBetween(x0,y0,x1,y1);
    }
    g.fillStyle(0x2a1200,alpha*.6).fillCircle(p.x,p.y,(p.kind==='punch'?7:10)*(1-t*.7));
    g.fillStyle(spec.core,alpha).fillCircle(p.x,p.y,(p.kind==='punch'?5:8)*(1-t*.7));
    if(p.kind!=='punch')g.lineStyle(3,spec.core,alpha*.8).strokeCircle(p.x,p.y,reach*.7);
  }
  step(frame){
    this.frame=frame;
    for(const [actor,until] of this.flashes)if(frame>until){actor?.sprite?.clearTint?.();this.flashes.delete(actor);}
    for(const [actor,until] of this.stops)if(frame>until){actor.sprite?.anims?.resume();this.stops.delete(actor);}
    this.impacts=this.impacts.filter(p=>{
      if(frame>p.until){this.release(p.graphic);return false;}
      if(p.splash){this.drawSplash(p,frame);return true;}
      if(p.wave){this.drawWave(p,frame);return true;}
      if(p.quake){this.drawQuake(p,frame);return true;}
      if(p.kind){this.drawSparks(p,frame);return true;}
      const r=ARCADE.feedback.impactRadius*(1+(ARCADE.feedback.impact-(p.until-frame))/ARCADE.feedback.impact);
      p.graphic.clear().lineStyle(3,0xffffff,1).strokeCircle(p.x,p.y,r).setDepth(p.y+100);return true;
    });
  }
  push(actor,attack){actor.x=Math.max(this.scene.floor.left,Math.min(this.scene.floor.right,actor.x+attack.facing*(attack.finisher?ARCADE.attack.finisherKnockback:ARCADE.attack.knockback)));}
  /** Mop special: a soapy wave that rolls along the floor ahead, with droplets and foam bubbles. */
  splash(actor,facing,range){
    const graphic=this.acquire();if(!graphic)return;
    this.impacts.push({graphic,splash:true,x:actor.x,y:actor.y,facing,range,born:this.frame,until:this.frame+36,life:36,seed:Math.round(actor.x)%97});
  }
  drawSplash(p,frame){
    const t=Math.min(1,(frame-p.born)/p.life),g=p.graphic.clear().setDepth(p.y+90),alpha=1-t*t;
    const front=p.x+p.facing*p.range*(.25+.85*t),back=p.x+p.facing*p.range*.15;
    // Wet sheen on the floor behind the wave.
    g.fillStyle(0x8fd8ff,.4*alpha).fillEllipse((front+back)/2,p.y+2,Math.abs(front-back)+40,26);
    // The wave crest: a curling band of water.
    for(let i=0;i<3;i++){
      const r=38-i*9,cx=front-p.facing*i*14,cy=p.y-20-i*7;
      g.fillStyle(i===2?0xffffff:i===1?0xbfeaff:0x4fb6f0,alpha*(1-i*.2)).fillEllipse(cx,cy,r*1.6,r*(1.2-t*.4));
    }
    // Droplets flying up and forward.
    for(let i=0;i<16;i++){
      const a=((p.seed+i*41)%100)/100,dx=p.facing*(10+a*90)*t,dy=-(30+a*80)*Math.sin(t*Math.PI)+t*t*30;
      g.fillStyle(i%3?0x6cc7ff:0xffffff,alpha).fillCircle(front-p.facing*10+dx,p.y-26+dy,3.5+a*3.5);
    }
    // Foam bubbles left on the floor.
    for(let i=0;i<6;i++){
      const a=((p.seed*3+i*29)%100)/100;g.lineStyle(2,0xffffff,alpha*.9).strokeCircle(back+(front-back)*a,p.y-2-a*6,3+a*4);
    }
  }
  /** Headset special: concentric purple energy arcs that roll forward from the player. */
  energyWave(actor,facing,range){
    const graphic=this.acquire();if(!graphic)return;
    this.impacts.push({graphic,wave:true,x:actor.x+facing*20,y:actor.y-(actor.config?.height??110)*.55,floor:actor.y,facing,range,born:this.frame,until:this.frame+30,life:30});
    this.scene.cameras?.main?.shake?.(80,.003);
  }
  drawWave(p,frame){
    const t=Math.min(1,(frame-p.born)/p.life),g=p.graphic.clear().setDepth(p.floor+90),alpha=1-t;
    for(let i=0;i<4;i++){
      const lag=i*.12,k=Math.max(0,t-lag)/(1-lag);if(k<=0)continue;
      const cx=p.x+p.facing*p.range*k,r=40+k*48-i*6,a=Math.min(1,alpha*1.3)*(1-i*.16);
      const start=p.facing>0?-Math.PI/2.4:Math.PI-Math.PI/2.4,end=p.facing>0?Math.PI/2.4:Math.PI+Math.PI/2.4;
      g.lineStyle(18-i*3,0x8a4dff,a*.45).beginPath().arc(cx,p.y,r,start,end).strokePath();
      g.lineStyle(9-i*1.5,0xb48cff,a*.8).beginPath().arc(cx,p.y,r,start,end).strokePath();
      g.lineStyle(4-i*.7,0xffffff,a).beginPath().arc(cx,p.y,r,start,end).strokePath();
    }
    g.fillStyle(0xbfa8ff,.25*alpha).fillEllipse(p.x+p.facing*p.range*t*.5,p.floor+2,p.range*t+30,14);
  }
  /** Gymbro stomp: floor shockwave rings, cracks radiating from the foot, dust clouds and flying debris. */
  quake(actor,range){
    const graphic=this.acquire();if(!graphic)return;
    this.impacts.push({graphic,quake:true,x:actor.x,y:actor.y,range,born:this.frame,until:this.frame+42,life:42,seed:Math.round(actor.x)%89});
    this.scene.cameras?.main?.shake?.(160,.008);
  }
  drawQuake(p,frame){
    const t=Math.min(1,(frame-p.born)/p.life),g=p.graphic.clear().setDepth(p.y+1),alpha=1-t,stay=1-t*t*t;
    // Bright flash under the foot at the moment of impact.
    if(t<.25)g.fillStyle(0xfff4c8,(1-t*4)*.9).fillEllipse(p.x,p.y,p.range*.9,p.range*.28);
    // Cracks in the floor (they stay while everything else fades).
    for(let i=0;i<7;i++){
      const a=(p.seed+i*53)%360*Math.PI/180,len=p.range*.55*(.6+((p.seed+i*17)%40)/100)*Math.min(1,t*4);
      const mx=p.x+Math.cos(a)*len*.5+((i*13)%9-4),my=p.y+Math.sin(a)*len*.5*.35;
      g.lineStyle(5,0x1e1814,.95*stay).beginPath().moveTo(p.x,p.y).lineTo(mx,my).lineTo(p.x+Math.cos(a)*len,p.y+Math.sin(a)*len*.35).strokePath();
    }
    // Shockwave rings flattened onto the floor.
    for(let i=0;i<3;i++){
      const k=Math.max(0,t-i*.12);if(k<=0)continue;const r=p.range*(.25+k*.95);
      g.lineStyle(14-i*3,0xffb347,alpha*.45*(1-i*.2)).strokeEllipse(p.x,p.y,r*2,r*.62);
      g.lineStyle(7-i*1.5,i?0xffe0a8:0xffffff,alpha*(1-i*.2)).strokeEllipse(p.x,p.y,r*2,r*.62);
    }
    // Dust clouds rolling out on both sides.
    for(let i=0;i<10;i++){
      const side=i%2?1:-1,a=((p.seed+i*29)%100)/100,d=p.range*(.2+t*(.6+a*.4));
      g.fillStyle(0xd8c6a6,.75*alpha).fillCircle(p.x+side*d,p.y-8-a*18-t*14,(12+a*14)*(.6+t));
    }
    // Debris thrown up.
    for(let i=0;i<8;i++){
      const a=((p.seed*7+i*31)%100)/100,side=i%2?1:-1,dx=side*(20+a*70)*t,dy=-(40+a*60)*Math.sin(Math.min(1,t*1.4)*Math.PI);
      g.fillStyle(i%3?0x5a4c40:0x9a8a78,alpha).fillRect(p.x+dx,p.y-10+dy,6+a*5,5+a*4);
    }
  }
  groundImpact(actor){const graphic=this.acquire();if(graphic)this.impacts.push({graphic,x:actor.x,y:actor.y,until:this.frame+ARCADE.feedback.impact});}
  clear(){for(const actor of this.flashes.keys())actor?.sprite?.clearTint?.();this.stops.clear();this.flashes.clear();this.tokens.clear();for(const p of this.impacts)this.release(p.graphic);this.impacts=[];}
}
