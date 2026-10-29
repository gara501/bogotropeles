import {ARCADE} from '../data/arcade.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** A support enemy: catches, holds and leaves attack slots free for his allies. */
export class OrtencioController {
  constructor(model){this.model=model;this.scene=model.scene;this.actor=model.actor;this.config=this.actor.config.ortencio;this.phase='idle';}
  red(){if(['windup','run'].includes(this.phase) && !this.model.runtime.combat.flashes?.has(this.actor))this.actor.sprite.setTint?.(0xff7770);}
  begin(){
    const m=this.model,a=this.actor,s=this.scene;
    if(this.phase!=='idle' || !['approach','circle','recover'].includes(m.state) || !m.runtime.combat.tokens.acquire(a))return false;
    a.facing=Math.sign(s.player.x-a.x)||1;a.sprite.setFlipX(a.facing<0);this.targetY=s.player.y;this.distance=0;
    this.phase='windup';m.transition('windup');a.pending=null;a.tell.setText('¡TE SUJETO!').setVisible(true);this.red();return true;
  }
  canCapture(){
    const s=this.scene,p=this.model.runtime.player;
    return s.health>0 && !p.captor && !['dash','knockdown','celebration','grab'].includes(p.state)
      && (s.player.z??0)<ARCADE.body.airborneAvoidHeight && s.combatTime>=s.invulnerableUntil
      && s.combatTime>=s.respawnProtectedUntil && !s.finished && !s.cinematic;
  }
  capture(){
    if(!this.canCapture())return false;
    const m=this.model,p=m.runtime.player,s=this.scene,a=this.actor;
    p.dropGrab();p.transition('hurt');p.buffer.clear();p.captor=this;p.action=null;p.jumpAge=ARCADE.jump.frames;
    s.playerAttack=null;s.player.z=0;s.comboVictim=null;this.struggle=0;this.lastPress=-1;
    this.phase='hold';m.age=0;a.sprite.clearTint?.();a.tell.setText('¡SUELTA! · H / J / SALTO').setVisible(true);
    // He deals no damage himself and does not monopolise the group's attack slots.
    m.runtime.combat.tokens.release(a);this.holdPlayer();return true;
  }
  holdPlayer(){
    const s=this.scene,a=this.actor,p=this.model.runtime.player;if(p.captor!==this)return;
    s.player.x=clamp(a.x+a.facing*this.config.holdOffset,s.floor.left,s.floor.right);s.player.y=a.y;s.player.z=0;s.jumpHeight=0;
    s.facing=-a.facing;p.pose('hurt',0);s.player.sprite.setFlipX(s.facing<0);
  }
  strugglePress(){
    const p=this.model.runtime.player,frame=this.model.runtime.frame;
    if(p.captor!==this || frame===this.lastPress)return;
    this.lastPress=frame;if(++this.struggle>=this.config.escapePresses)this.finish();
  }
  heldInput(input){if(input.jump || input.dash)this.strugglePress();}
  onPlayerHit(finisher){if(finisher)this.finish();}
  releasePlayer(){
    const p=this.model.runtime.player,s=this.scene;if(p?.captor!==this)return;
    p.captor=null;p.buffer.clear();p.age=0;s.comboVictim=null;s.hurtUntil=s.combatTime+100;
    if(s.health>0)s.invulnerableUntil=Math.max(s.invulnerableUntil,s.combatTime+this.config.releaseGuard);
  }
  interrupt(){
    this.releasePlayer();this.phase='idle';this.actor.z=0;this.actor.pending=null;this.actor.tell.setVisible(false);
    this.actor.sprite.clearTint?.();this.model.runtime.combat.tokens.release(this.actor);
  }
  cancel(){this.interrupt();}
  finish(){
    const m=this.model;this.interrupt();this.phase='recover';m.transition('recover');
    m.ready=m.clock+Math.round(this.config.cooldown/(this.scene.level.pressure??1));
  }
  step(){
    const m=this.model,a=this.actor,s=this.scene,c=this.config;
    if(s.health<=0){this.interrupt();return true;}
    if(this.phase==='hold'){
      if(m.runtime.player.captor!==this || m.age>=c.holdFrames){this.finish();return true;}
      this.holdPlayer();m.pose('hold');return true;
    }
    if(this.phase==='recover'){
      m.pose('idle',a.config.idle);if(m.clock>=m.ready){this.phase='idle';m.transition('circle');}return true;
    }
    if(this.phase==='windup'){
      this.red();m.pose('prepare');if(m.age>=c.windup){this.phase='run';m.transition('attack');a.tell.setVisible(false);}return true;
    }
    if(this.phase==='run'){
      this.red();const previous=a.x;m.move(a.facing,Math.sign(this.targetY-a.y),c.runSpeed);this.distance+=Math.abs(a.x-previous);m.pose('run');
      const p=s.player,touch=p.x+ARCADE.body.halfWidth>=Math.min(previous,a.x)-c.reach && p.x-ARCADE.body.halfWidth<=Math.max(previous,a.x)+c.reach;
      if(touch && Math.abs(p.y-a.y)<c.depth && this.capture())return true;
      if(this.distance>=c.distance || m.age>=c.runFrames || Math.abs(a.x-previous)<.01)this.finish();return true;
    }
    if(m.tryDodge())return true;
    const dx=s.player.x-a.x,dy=s.player.y-a.y;
    if(a.x<s.floor.left || a.x>s.floor.right){m.move(a.x<s.floor.left?1:-1,0);m.pose('walk');return true;}
    if(m.clock>=m.ready && !m.runtime.player.captor && Math.abs(dx)<=c.startRange && this.begin())return true;
    if(m.state==='recover')m.transition('circle');if(m.state!=='approach')m.transition('approach');
    m.face(dx);m.move(Math.abs(dx)>100?Math.sign(dx):0,Math.abs(dy)>8?Math.sign(dy):0);m.pose('walk');return true;
  }
  destroy(){this.interrupt();}
}
