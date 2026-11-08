import {ARCADE} from '../data/arcade.js';
import {viewLeft} from './scroll.js';
import {HAZARDS,insideHole,placeHoles,pushOut,taxiSweeps,nextTaxiDelay} from './hazardRules.js';
import {HAZARD_SPRITES,POTHOLE_SPLASH_MS,MANHOLE_SPLASH_MS} from './hazardSprites.js';

const FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
/**
 * Street hazards of a level (`level.hazards`): {holes:[{kind:'pothole'|'manhole',arena,x,y}], taxi:true|{...}}.
 * Holes are drawn on the floor; the taxi only runs while an arena fight is on (never during a boss).
 */
export class StageHazards {
  constructor(scene,config,layout,random=Math.random){
    this.scene=scene;this.random=random;this.layout=layout;
    this.holes=placeHoles(config.holes,layout,{top:scene.floor.top,bottom:scene.floor.bottom});
    this.taxi=config.taxi?{...HAZARDS.taxi,...(config.taxi===true?{}:config.taxi)}:null;
    this.car=null;this.warning=null;this.clock=0;this.nextAt=this.taxi?.first??Infinity;
    this.visuals=new Map();this.decorations=[];this.visualClock=0;this.draw();
  }
  draw(){
    for(const v of this.visuals.values())v.sprite.destroy();
    for(const sprite of this.decorations)sprite.destroy();
    this.visuals.clear();this.decorations=[];
    const s=this.scene;if(!s.add?.image)return;
    for(const h of this.holes){
      const art=HAZARD_SPRITES[h.kind];if(!s.textures?.exists?.(art.key))continue;
      const make=(x,y,frame)=>s.add.image(x,y,art.key,frame).setOrigin(art.originX,art.originY).setScale(art.scale).setDepth(1.5);
      const baseFrame=h.kind==='pothole' && s.level?.rain?1:0;
      this.visuals.set(h,{sprite:make(h.x,h.y,baseFrame),baseFrame,until:0});
      if(h.kind==='manhole')this.decorations.push(make(h.x+h.rx+26,h.y+6,2),make(h.x-h.rx-18,h.y+4,3));
    }
  }
  splash(h){
    const v=this.visuals.get(h);if(!v)return;
    const manhole=h.kind==='manhole';
    v.sprite.setFrame(manhole?1:2).setDepth(h.y+3);v.until=this.visualClock+(manhole?MANHOLE_SPLASH_MS:POTHOLE_SPLASH_MS);
  }
  holeAt(x,y,kind=null,pad=0){return this.holes.find(h=>(!kind || h.kind===kind) && insideHole(h,x,y,pad))??null;}
  /** Movement multiplier for a walker standing in a pothole. */
  speedFactor(actor){return this.holeAt(actor.x,actor.y,'pothole')?HAZARDS.hole.pothole.slow:1;}
  /** Walkers slide around open manholes instead of stepping in. */
  resolve(actor){
    const h=this.holeAt(actor.x,actor.y,'manhole',HAZARDS.hole.manhole.pad);if(!h)return;
    const p=pushOut(h,actor.x,actor.y,HAZARDS.hole.manhole.pad),f=this.scene.floor;
    actor.x=Math.max(f.left,Math.min(f.right,p.x));actor.y=Math.max(f.top,Math.min(f.bottom,p.y));
  }
  /** A thrown or knocked-down enemy touches the floor here. Returns true when it fell into a manhole. */
  landing(actor){
    const s=this.scene;if(actor.hp<=0 || actor.config?.boss || actor.crossing)return false;
    const h=this.holeAt(actor.x,actor.y);if(!h)return false;
    const d=HAZARDS.hole[h.kind],facing=Math.sign(actor.x-s.player.x)||1;
    if(h.kind==='manhole'){
      actor.x=h.x;actor.y=h.y;actor.sinking=true;
      s.hitEnemy(actor,{super:true,type:'hole',damage:actor.hp,knockback:0,facing,stun:0});
      if(actor.hp>0){actor.sinking=false;return false;} // something refused the hit (shield phase…)
      const points=s.combo?s.combo.points(d.points,actor.config):d.points;s.addScore?.(points);
      this.label(actor.x,actor.y-70,`${d.label} +${points}`,'#7fe0ff');
      s.sfx?.play('stomp');s.cameras?.main?.shake?.(90,.003);
      this.splash(h);
      return true;
    }
    s.hitEnemy(actor,{super:true,type:'hole',damage:d.damage,knockback:0,facing,stun:0});this.splash(h);
    this.label(actor.x,actor.y-60,d.label,'#ffd36b');s.sfx?.play('kick');
    return false;
  }
  /** The player was knocked down: landing in a hole costs extra and pops them back onto the rim. */
  playerDown(actor){
    const s=this.scene,h=this.holeAt(actor.x,actor.y);if(!h || s.health<=0)return false;
    const d=HAZARDS.hole[h.kind],p=pushOut(h,actor.x,actor.y,(h.pad??0)+6);
    this.splash(h);
    actor.x=Math.max(s.floor.left,Math.min(s.floor.right,p.x));actor.y=Math.max(s.floor.top,Math.min(s.floor.bottom,p.y));
    s.invulnerableUntil=0;s.hitPlayer(d.playerDamage);this.label(actor.x,actor.y-130,h.kind==='manhole'?'¡CASI AL CAÑO!':'¡AY, EL HUECO!','#ff8a80');
    return true;
  }
  label(x,y,message,color){
    const s=this.scene;if(!s.add?.text)return;
    const label=s.add.text(x,y,message,{fontFamily:FONT,fontSize:'20px',fontStyle:'bold',color,stroke:'#14282c',strokeThickness:4}).setOrigin(.5).setDepth(952);
    s.tweens?.add?.({targets:label,y:y-30,alpha:0,duration:900,delay:200,onComplete:()=>label.destroy()});
  }
  /** Fights only: an arena with live enemies, no boss, no cinematic, no taxi rush. */
  fighting(){
    const s=this.scene;
    return Boolean(this.taxi) && !s.boss && !s.miniBoss && !s.cinematic && !s.finished && !s.taxiRush?.active && s.health>0
      && !s.waves?.awaitingAdvance && s.enemies.some(e=>e.hp>0 && !e.arriving);
  }
  update(){
    if(!this.scene.paused && !this.scene.cinematic){
      this.visualClock+=ARCADE.clock.stepMs;
      for(const v of this.visuals.values())if(v.until && this.visualClock>=v.until){v.sprite.setFrame(v.baseFrame).setDepth(1.5);v.until=0;}
    }
    if(!this.taxi)return;
    const s=this.scene,c=this.taxi,dt=ARCADE.clock.stepMs;
    if(this.warning){
      this.warning.age+=dt;this.warning.mark.setAlpha?.(Math.floor(this.warning.age/120)%2?.38:.16);
      if(this.warning.age>=c.warn)this.launch();
    }else if(this.car)this.drive(dt/1000);
    else if(this.fighting()){this.clock+=dt;if(this.clock>=this.nextAt)this.warn();}
  }
  warn(){
    const s=this.scene,c=this.taxi,f=s.floor;
    const aim=this.random()<c.aimChance,y=Math.round(Math.max(f.top+12,Math.min(f.bottom-8,aim?s.player.y:f.top+this.random()*(f.bottom-f.top))));
    const direction=this.random()<.5?1:-1,left=direction>0;
    const mark=s.add.rectangle(480,y,960,c.hitDepth*2,0xffbb22,.28).setScrollFactor(0).setDepth(y-.1);
    const arrow=s.add.text(left?85:875,y-25,left?'→ ¡TAXI!':'¡TAXI! ←',{fontFamily:"'IBM Plex Mono',monospace",fontSize:'19px',color:'#fff47a',stroke:'#7b2409',strokeThickness:5})
      .setOrigin(.5).setScrollFactor(0).setDepth(998);
    this.warning={y,direction,mark,arrow,age:0};s.sfx?.play('whistle');
  }
  launch(){
    const s=this.scene,c=this.taxi,w=this.warning;w.mark.destroy();w.arrow.destroy();this.warning=null;
    const x=w.direction>0?-c.width/2-40:960+c.width/2+40;
    const sprite=s.textures?.exists?.('taxi-rush')?s.add.image(x,w.y,'taxi-rush',w.direction>0?'right':'left').setOrigin(.5,1).setDisplaySize(c.width,c.height).setScrollFactor(0).setDepth(w.y+2)
      :s.add.rectangle(x,w.y,c.width,c.height*.6,0xffd21f).setOrigin(.5,1).setScrollFactor(0).setDepth(w.y+2);
    this.car={x,y:w.y,direction:w.direction,sprite,hit:new Set()};s.sfx?.play('carPass');
  }
  drive(dt){
    const s=this.scene,c=this.taxi,car=this.car,previous=car.x,left=viewLeft(s);
    car.x+=car.direction*c.speed*dt;car.sprite.x=car.x;
    if(!car.hit.has(s.player) && taxiSweeps(previous,car.x,car.y,s.player,left,c)){car.hit.add(s.player);if(s.hitPlayer(c.damage))s.arcade?.player.hurt(true);}
    for(const e of s.enemies){
      if(e.hp<=0 || car.hit.has(e) || e.config?.boss || e.crossing || e.arriving || !taxiSweeps(previous,car.x,car.y,e,left,c))continue;
      const state=s.arcade?.enemies.get(e)?.state;if(['down','thrown','grabbed','superDown'].includes(state))continue;
      car.hit.add(e);s.hitEnemy(e,{type:'taxi',damage:Math.round(c.enemyDamage*(s.level?.damage??1)),knockback:30,facing:car.direction,stun:400,knockdown:true,lane:ARCADE.body.lane});
      s.sfx?.play('kick');
    }
    if(car.x<-c.width || car.x>960+c.width){car.sprite.destroy();this.car=null;this.clock=0;this.nextAt=nextTaxiDelay(this.random,c);}
  }
  clear(){this.warning?.mark.destroy();this.warning?.arrow.destroy();this.warning=null;this.car?.sprite.destroy();this.car=null;this.clock=0;}
  destroy(){this.clear();for(const v of this.visuals.values())v.sprite.destroy();this.visuals.clear();for(const sprite of this.decorations)sprite.destroy();this.decorations=[];}
}
