import {ARCADE} from '../data/arcade.js';
import {enemyThrowData} from '../data/attacks.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Explicit choreography; windups commit a lane so the player can dodge. */
export class JugoController {
  constructor(model){this.model=model;this.scene=model.scene;this.actor=model.actor;this.config=this.actor.config.jugo;this.phase=1;this.mode='idle';this.cursor=0;}
  get locked(){return ['rage','headbutts','rollTell','rolling'].includes(this.mode);}
  tint(){if(this.phase===2 && !this.model.runtime.combat.flashes?.has(this.actor))this.actor.sprite.setTint?.(0xff8b80);}
  change(mode){this.mode=mode;this.model.transition('jugoFight');this.model.age=0;}
  face(){const a=this.actor;a.facing=Math.sign(this.scene.player.x-a.x)||a.facing||1;a.sprite.setFlipX(a.facing<0);}
  releasePlayer(){
    const p=this.model.runtime.player;if(p?.captor!==this)return;
    p.captor=null;p.age=0;p.buffer.clear();this.scene.comboVictim=null;
    this.scene.hurtUntil=this.scene.combatTime+120;
  }
  cancel(){
    const m=this.model,a=this.actor;this.releasePlayer();a.pending=null;a.tell.setVisible(false);a.invulnerableUntil=0;
    m.action=null;m.runtime.combat.tokens.release(a);this.mode='idle';
  }
  phaseCheck(){
    const a=this.actor,m=this.model,c=this.config;
    if(this.phase!==1 || a.hp<=0 || a.hp>a.config.hp*.5)return false;
    this.cancel();this.phase=2;this.cursor=0;this.change('rage');
    a.invulnerableUntil=this.scene.combatTime+c.rage*ARCADE.clock.stepMs;
    a.tell.setText('¡SE PRENDIÓ JUGO!').setVisible(true);this.tint();return true;
  }
  hurt(){
    if(this.actor.hp<=0){this.destroy();return;}
    if(this.phaseCheck())return;
    this.cancel();if(this.model.bossCornerHit())return;
    this.model.transition('hurt');this.model.ready=this.model.clock+this.config.hurt;
  }
  start(kind){
    const m=this.model,a=this.actor,s=this.scene,c=this.config;
    if(!['idle','recover'].includes(this.mode))return false;
    if(kind==='roll' && this.phase!==2)return false;
    if(!m.runtime.combat.tokens.acquire(a))return false;
    this.face();a.pending={enemy:a,connected:false,finisher:false};this.hit=false;
    if(kind==='grab'){
      this.targetY=s.player.y;this.distance=0;this.change('grabTell');a.tell.setText('¡TE AGARRO!').setVisible(true);
    }else if(kind==='roll'){
      this.targetY=s.player.y;this.passes=0;this.rollHit=false;this.change('rollTell');a.tell.setText('¡BOLA! · CAMBIA DE CARRIL').setVisible(true);
    }else if(kind==='meter'){
      this.frames=enemyThrowData(a.config,s.level.damage??1).frames;this.index=0;this.change('meter');a.tell.setText('¡TAXÍMETRO!').setVisible(true);
    }else {this.change('belly');a.tell.setText('¡BARRIGAZO!').setVisible(true);}
    return true;
  }
  finish(rest=this.config.rest){
    this.cancel();this.mode='recover';this.model.transition('recover');this.model.ready=this.model.clock+rest;
  }
  canCapture(){
    const s=this.scene,p=this.model.runtime.player;
    return s.health>0 && !p.captor && !['dash','knockdown','celebration','grab'].includes(p.state)
      && (s.player.z??0)<ARCADE.body.airborneAvoidHeight && s.combatTime>=s.invulnerableUntil
      && s.combatTime>=s.respawnProtectedUntil && !s.finished && !s.cinematic;
  }
  capture(){
    if(!this.canCapture())return false;
    const p=this.model.runtime.player;p.dropGrab();p.transition('hurt');p.buffer.clear();p.captor=this;
    p.action=null;this.scene.playerAttack=null;this.scene.player.z=0;p.jumpAge=ARCADE.jump.frames;
    this.change('headbutts');this.headHits=0;this.actor.tell.setText('¡DOS CABEZAZOS!').setVisible(true);this.holdPlayer();return true;
  }
  holdPlayer(){
    const s=this.scene,a=this.actor,p=this.model.runtime.player;
    if(p.captor!==this)return;
    s.player.x=clamp(a.x+a.facing*this.config.hold,s.floor.left,s.floor.right);s.player.y=a.y;s.player.z=0;s.jumpHeight=0;
    s.facing=-a.facing;p.pose('hurt',0);s.player.sprite.setFlipX(s.facing<0);
  }
  headbutts(){
    const m=this.model,a=this.actor,s=this.scene,c=this.config;
    if(m.runtime.player.captor!==this || s.health<=0){this.finish();return;}
    this.holdPlayer();const beat=m.age%c.headInterval;
    m.pose('hold',beat<c.headWindup-10?a.config.animations.hold[0]:beat<c.headWindup?a.config.animations.headbutt[0]:a.config.animations.headbutt[1]);
    if(beat===c.headWindup && this.headHits<2){
      this.headHits++;m.pose('headbutt',a.config.animations.headbutt[1]);a.pending.finisher=this.headHits===2;
      if(s.hitPlayer(a.config.damage,a.pending,a)){a.pending.connected=true;m.runtime.combat.impact(a,s.player,{finisher:a.pending.finisher});}
      if(this.headHits===2 || s.health<=0){this.releasePlayer();this.finish(c.grabRecovery);}
    }
  }
  step(){
    const m=this.model,a=this.actor,s=this.scene,c=this.config;
    this.tint();if(s.health<=0){this.cancel();return;}if(this.phaseCheck())return;
    if(this.mode==='rage'){
      m.pose('rage');if(m.age>=c.rage){a.invulnerableUntil=0;a.tell.setVisible(false);this.mode='idle';m.transition('approach');m.ready=m.clock;}return;
    }
    if(m.state==='hurt'){m.pose('hurt');if(m.age>=c.hurt){this.mode='idle';m.transition('approach');}return;}
    if(this.mode==='recover'){m.pose('recover');if(m.clock>=m.ready){this.mode='idle';m.transition('circle');}return;}
    if(this.mode==='grabTell'){
      m.pose('grabReach');if(m.age>=c.grabWindup){this.change('grabRun');a.tell.setVisible(false);}return;
    }
    if(this.mode==='grabRun'){
      const previous=a.x;m.move(a.facing,Math.sign(this.targetY-a.y),c.runSpeed);this.distance+=Math.abs(a.x-previous);m.pose('run');
      const touch=s.player.x+ARCADE.body.halfWidth>=Math.min(previous,a.x)-c.reach && s.player.x-ARCADE.body.halfWidth<=Math.max(previous,a.x)+c.reach;
      if(touch && Math.abs(s.player.y-a.y)<c.grabDepth && this.capture())return;
      if(this.distance>=c.runDistance || m.age>=c.runFrames || Math.abs(a.x-previous)<.01)this.finish(c.grabRecovery);return;
    }
    if(this.mode==='headbutts'){this.headbutts();return;}
    if(this.mode==='rollTell'){
      m.pose('curl');if(m.age>=c.rollWindup){a.y=clamp(this.targetY,s.floor.top,s.floor.bottom);this.change('rolling');a.tell.setVisible(false);a.invulnerableUntil=Infinity;}return;
    }
    if(this.mode==='rolling'){
      const previous=a.x;a.x=clamp(a.x+a.facing*c.rollSpeed/ARCADE.clock.fps,s.floor.left+20,s.floor.right-20);
      m.pose('roll',a.config.animations.roll[Math.floor(m.age/2)%a.config.animations.roll.length]);
      const touch=s.player.x+ARCADE.body.halfWidth>=Math.min(previous,a.x)-c.rollRadius && s.player.x-ARCADE.body.halfWidth<=Math.max(previous,a.x)+c.rollRadius;
      if(!this.rollHit && touch && Math.abs(s.player.y-a.y)<c.rollDepth && (s.player.z??0)<ARCADE.body.projectileAvoidHeight){
        this.rollHit=true;s.hitPlayer(Math.round(c.rollDamage*(s.level.damage??1)),null,a);
      }
      if(a.x===s.floor.left+20 || a.x===s.floor.right-20){this.passes++;a.facing*=-1;a.sprite.setFlipX(a.facing<0);this.rollHit=false;}
      if(this.passes>=c.rollPasses || m.age>=c.rollFrames)this.finish(c.rollRecovery);return;
    }
    if(this.mode==='meter'){
      const f=this.frames[this.index];m.pose('throw',f.pose);
      if(f.phase==='active' && !this.hit){this.hit=true;a.tell.setVisible(false);s.throwProjectile(a,a.facing,a.config.throw,Math.round(a.config.throw.damage*(s.level.damage??1)));}
      if(++this.index>=this.frames.length)this.finish();return;
    }
    if(this.mode==='belly'){
      m.pose('attack3',m.age<c.bellyWindup?12:13);
      if(m.age===c.bellyWindup){a.tell.setVisible(false);const attack={damage:a.config.damage,range:155,lane:ARCADE.body.lane,facing:a.facing,finisher:true};
        if(m.runtime.combat.touches(a,s.player,attack)){s.hitPlayer(attack.damage,null,a);m.runtime.combat.push(s.player,attack);}}
      if(m.age>=c.bellyWindup+12)this.finish();return;
    }
    this.face();const dx=s.player.x-a.x,dy=s.player.y-a.y;
    if(m.clock>=m.ready){
      const cycle=this.phase===2?['roll','grab','meter','roll','belly']:['grab','meter','belly'];let kind=cycle[this.cursor%cycle.length];
      if(kind==='meter' && Math.abs(dx)<a.config.throw.minRange)kind='grab';
      if(kind!=='belly' || Math.abs(dx)<155 && Math.abs(dy)<ARCADE.body.lane){if(this.start(kind)){this.cursor++;return;}}
    }
    if(m.state!=='approach')m.transition('approach');m.move(Math.abs(dx)>a.config.range?Math.sign(dx):0,Math.abs(dy)>8?Math.sign(dy):0);m.pose('run');
  }
  debugAttack(kind){this.cancel();this.model.transition('jugoFight');return this.start(kind);}
  destroy(){this.cancel();this.actor.sprite.clearTint?.();}
}
