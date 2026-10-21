import {ARCADE,toFrames} from '../data/arcade.js';

/** Five full sack rotations, then a fixed two-second vulnerable recovery. */
export class SackSpin {
  constructor(model){this.model=model;this.scene=model.scene;this.actor=model.actor;this.phase=null;this.age=0;}
  begin(){
    const m=this.model,a=this.actor,s=this.scene,c=a.config.sackSpin;
    if(this.phase || a.hp<=0 || a.x<s.floor.left || a.x>s.floor.right || !m.runtime.combat.tokens.acquire(a))return false;
    a.facing=Math.sign(s.player.x-a.x)||1;a.sprite.setFlipX(a.facing<0);
    a.pending={enemy:a,connected:false,finisher:false};a.tell.setText('¡CUIDADO!').setVisible(true);
    m.action=null;m.transition('windup');this.phase='windup';this.age=0;this.completedTurns=0;this.hitTurn=-1;
    return true;
  }
  step(){
    if(!this.phase)return false;
    const m=this.model,a=this.actor,s=this.scene,c=a.config.sackSpin,art=a.config.animations;
    if(this.phase==='windup'){
      m.pose('windup',art.windup[Math.min(art.windup.length-1,Math.floor(this.age/toFrames(c.windup)*art.windup.length))]);
      if(++this.age>=toFrames(c.windup)){
        this.phase='spin';this.age=0;m.transition('attack');a.sackSpinning=true;a.invulnerableUntil=Infinity;a.tell.setVisible(false);
      }
      return true;
    }
    if(this.phase==='spin'){
      if(this.age>=c.turnFrames*c.turns){
        a.sackSpinning=false;a.invulnerableUntil=0;a.pending=null;m.runtime.combat.tokens.release(a);
        this.phase='dizzy';this.dizzyUntil=s.combatTime+c.dizzy;m.transition('recover');
      }else{
        const turn=Math.floor(this.age/c.turnFrames),pose=Math.floor(this.age%c.turnFrames/c.turnFrames*art.spin.length);
        m.pose('spin',art.spin[pose]);
        if(this.age%c.turnFrames===0)s.sfx?.play('wave');
        const p=s.player;
        const dx=p.x-a.x,dy=p.y-a.y,distance=Math.hypot(dx,dy);
        if(distance>0)m.move(dx/distance,dy/distance,Math.min(a.config.speed*c.moveMultiplier,distance*ARCADE.clock.fps));
        if(this.hitTurn!==turn && Math.abs(p.x-a.x)<=c.radius && Math.abs(p.y-a.y)<=c.depth && (s.jumpHeight??p.z??0)<42){
          if(s.hitPlayer(a.config.damage,null,a))this.hitTurn=turn;
        }
        this.completedTurns=Math.floor(++this.age/c.turnFrames);return true;
      }
    }
    if(s.combatTime>=this.dizzyUntil){
      this.phase=null;a.tell.setVisible(false);m.ready=Math.max(m.ready,m.clock+toFrames(c.cooldown));
      if(m.state==='recover')m.transition('circle');return false;
    }
    // Being hit, held or thrown never restarts the dizzy deadline or cancels the punish window.
    if(['hurt','down','grabbed','thrown','evade'].includes(m.state))return false;
    m.pose('dizzy',art.dizzy[Math.floor(s.combatTime/130)%art.dizzy.length]);
    a.tell.setText('MAREADO').setVisible(true);return true;
  }
  interrupt(){if(this.phase==='windup'){this.phase=null;this.actor.tell.setVisible(false);this.model.runtime.combat.tokens.release(this.actor);}}
  clear(){if(this.actor.sackSpinning){this.actor.sackSpinning=false;this.actor.invulnerableUntil=0;}this.phase=null;this.actor.tell.setVisible(false);this.model.runtime.combat.tokens.release(this.actor);}
}
