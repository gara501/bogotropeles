import {ARCADE} from '../data/arcade.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const POTATO={life:540,radius:66,depth:23,slipCooldown:170,slide:88,rollSpeed:365,rollLife:150,rollDamage:18};

/** Shared ground hazards: potato spills trip either side; sacks roll along a fixed lane. */
export class Potatoes {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.patches=[];this.sacks=[];this.slipAt=new WeakMap();this.slides=[];this.frame=0;}
  spill(owner,{kind='potato'}={}){
    const s=this.scene,x=owner.x,y=owner.y;
    const sprite=kind==='potato'?s.add.image(x,y,'papero-potatoes').setDisplaySize(132,46).setDepth(y-.5):s.add.ellipse(x,y,132,46,kind==='coffee'?0x613419:0xe4dca1,.8).setDepth(y-.5);
    this.patches.push({x,y,sprite,age:0});s.sfx?.play('metalCrack');return this.patches.at(-1);
  }
  roll(owner){
    const s=this.scene,dir=owner.facing||1;
    const x=owner.x+dir*48,y=owner.y;
    const sprite=s.add.image(x,y,'papero-sack').setDisplaySize(45,35).setDepth(y+1);
    const sack={x,y,dir,owner,sprite,age:0};this.sacks.push(sack);s.sfx?.play('wave');return sack;
  }
  trip(actor,dir){
    const s=this.scene,m=actor===s.player?this.runtime.player:this.runtime.enemies.get(actor);
    if(!m || actor===s.player && this.runtime.diablitos?.holdsPlayer || (actor.z??0)>25 || this.runtime.combat.frozen(actor))return false;
    if(actor===s.player){
      if(['hurt','knockdown','celebration'].includes(m.state))return false;
      m.hurt(true);this.runtime.clearInput();
      this.slides.push({actor,from:actor.x,to:clamp(actor.x+dir*POTATO.slide,s.floor.left,s.floor.right),age:0});
    }else if(m.reversa){
      if(!m.reversa.slip(dir))return false;
      this.slides.push({actor,from:actor.x,to:clamp(actor.x+dir*POTATO.slide,s.floor.left,s.floor.right),age:0});
    }else {
      if(actor.hp<=0 || actor.config.boss || !m.canKnockdown() || ['down','thrown','evade','grabbed'].includes(m.state))return false;
      m.papero?.cancel();m.action=null;actor.pending=null;actor.tell?.setVisible(false);
      m.knockdown();m.down.to=clamp(actor.x+dir*POTATO.slide,s.floor.left,s.floor.right);m.down.arc=8;
    }
    this.slipAt.set(actor,this.frame+POTATO.slipCooldown);s.sfx?.play('stomp');return true;
  }
  update(){
    this.frame++;const s=this.scene,actors=[s.player,...s.enemies.filter(e=>e.hp>0)];
    this.patches=this.patches.filter(p=>{
      p.age++;if(p.age>=POTATO.life){p.sprite.destroy();return false;}
      p.sprite.setAlpha(Math.min(1,(POTATO.life-p.age)/60));
      for(const actor of actors)if(this.frame>=(this.slipAt.get(actor)??0) && Math.abs(actor.x-p.x)<POTATO.radius && Math.abs(actor.y-p.y)<POTATO.depth){
        const dir=Math.sign(actor.x-p.x)||actor.facing||s.facing||1;this.trip(actor,dir);
      }
      return true;
    });
    this.slides=this.slides.filter(slide=>{
      const t=Math.min(1,++slide.age/20),a=slide.actor;
      a.x=slide.from+(slide.to-slide.from)*(1-(1-t)**2);a.z=t===1?0:Math.sin(t*Math.PI)*8;
      return t<1;
    });
    this.sacks=this.sacks.filter(b=>{
      b.age++;const previous=b.x;b.x+=b.dir*POTATO.rollSpeed/60;
      b.sprite.setPosition(b.x,b.y-(b.age<18?Math.sin(b.age/18*Math.PI)*20:0));b.sprite.rotation+=b.dir*.19;
      for(const actor of actors){
        if(actor===b.owner && b.age<15 || (actor.z??0)>32 || Math.abs(actor.y-b.y)>23 || actor.x<Math.min(previous,b.x)-28 || actor.x>Math.max(previous,b.x)+28)continue;
        if(actor===s.player){
          if(!s.hitPlayer(Math.round(POTATO.rollDamage*(s.level.damage??1)),null,b.owner))continue;
          this.runtime.player.hurt(true);
        }else {
          if(s.combatTime<(actor.invulnerableUntil??0))continue;
          s.hitEnemy(actor,{damage:POTATO.rollDamage,knockback:28,facing:b.dir,knockdown:true,finisher:true});
        }
        b.sprite.destroy();s.sfx?.play('stomp');return false;
      }
      if(b.age>=POTATO.rollLife){b.sprite.destroy();return false;}return true;
    });
  }
  clear(){for(const item of [...this.patches,...this.sacks])item.sprite.destroy();for(const slide of this.slides)slide.actor.z=0;this.patches=[];this.sacks=[];this.slides=[];this.slipAt=new WeakMap();}
}

export class PaperoController {
  constructor(model){this.model=model;this.runtime=model.runtime;this.scene=model.scene;this.actor=model.actor;this.hasSack=true;this.nextAt=60;}
  cancel(){this.phase=null;}
  interrupt(){
    if(this.phase==='lift' && this.hasSack){this.hasSack=false;this.runtime.potatoes.spill(this.actor);}
    this.cancel();this.nextAt=this.model.clock+90;
  }
  nearbyBox(){
    const a=this.actor,s=this.scene;
    return s.energyPickups?.cans.filter(c=>c.kind==='boxes' && c.hp>0 && (c.potatoSacks??2)>0 &&
      c.x>=s.floor.left && c.x<=s.floor.right && Math.hypot(c.x-a.x,c.y-a.y)<420)
      .sort((c,d)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(d.x-a.x,d.y-a.y))[0];
  }
  start(mode){
    const m=this.model,a=this.actor;
    if(!this.hasSack || !['approach','circle'].includes(m.state) || !this.runtime.combat.tokens.acquire(a))return false;
    this.phase='lift';this.mode=mode;this.startAt=m.clock;m.face(this.scene.player.x-a.x);
    m.transition('windup');a.tell.setText(mode==='slam'?'¡BULTO!':'¡VA RODANDO!').setVisible(true);return true;
  }
  slam(){
    const s=this.scene,a=this.actor;
    s.sfx?.play('stomp');this.runtime.combat.groundImpact?.({x:a.x+a.facing*65,y:a.y});
    if(this.runtime.combat.touches(a,s.player,{facing:a.facing,range:135,lane:30}) && (s.player.z??0)<35 &&
      s.hitPlayer(Math.round(26*(s.level.damage??1)),null,a))this.runtime.player.hurt(true);
  }
  step(){
    const m=this.model,a=this.actor,s=this.scene;
    if(this.phase){
      if(!['windup','attack'].includes(m.state)){this.cancel();return false;}
      const age=m.clock-this.startAt;
      if(this.phase==='reload'){
        if(this.box.hp<=0 || (this.box.potatoSacks??2)<=0){this.cancel();a.tell.setVisible(false);m.transition('recover');m.finish(30);return true;}
        m.pose('reload',a.config.animations.reload[Math.min(3,Math.floor(age/15))]);
        if(age>=60){this.hasSack=true;this.box.potatoSacks=(this.box.potatoSacks??2)-1;
          if(!this.box.potatoSacks)this.box.sprite.setTint?.(0xa59b8b);
          this.cancel();a.tell.setVisible(false);m.transition('recover');m.finish(35);this.nextAt=m.clock+35;}
        return true;
      }
      const warning=this.mode==='slam'?90:72;
      if(this.phase==='lift'){
        m.pose('lift',a.config.animations.lift[Math.min(3,Math.floor(age/warning*4))]);
        if(age>=warning){
          this.phase='recover';this.releaseAt=m.clock;m.transition('attack');a.tell.setVisible(false);
          if(this.mode==='slam')this.slam();else {this.runtime.potatoes.roll(a);this.hasSack=false;}
        }
      }else {
        const elapsed=m.clock-this.releaseAt;
        m.pose(this.mode==='slam'?'slam':'throw',a.config.animations[this.mode==='slam'?'slam':'throw'][Math.min(1,Math.floor(elapsed/15))]);
        if(elapsed>=42){this.cancel();m.transition('recover');m.finish(60);this.nextAt=m.clock+60;}
      }
      return true;
    }
    if(!['approach','circle'].includes(m.state))return false;
    if(!this.hasSack){
      const box=this.nearbyBox();if(!box)return false;
      const dx=box.x-a.x,dy=box.y-a.y;
      if(Math.abs(dx)<30 && Math.abs(dy)<22){
        this.box=box;this.phase='reload';this.startAt=m.clock;m.transition('windup');a.tell.setText('¡OTRO BULTO!').setVisible(true);
      }else {m.face(dx);m.move(Math.abs(dx)>20?Math.sign(dx):0,Math.abs(dy)>12?Math.sign(dy):0,a.config.speed);m.pose('emptyWalk');}
      return true;
    }
    const dx=s.player.x-a.x,dy=s.player.y-a.y;
    if(m.clock>=this.nextAt && m.clock>=m.ready && Math.abs(dy)<30){
      if(Math.abs(dx)<=155)return this.start('slam');
      if(Math.abs(dx)>=180 && Math.abs(dx)<660)return this.start('throw');
    }
    return false;
  }
}
