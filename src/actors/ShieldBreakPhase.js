import {toFrames} from '../data/arcade.js';
import {enemyThrowData} from '../data/attacks.js';

/** One-way shield loss, followed by moving, interruptible four-canister volleys. */
export class ShieldBreakPhase {
  constructor(model){
    this.model=model;const a=model.actor,c=a.config,p=c.shieldBreak;this.config=p;
    a.config={...c,shield:null,speed:c.speed*p.speedMultiplier,idle:p.idle,animations:{...c.animations,...p.animations},animationKeys:p.animationKeys,throw:{...c.throw,hitFrame:p.hitFrame}};
    model.action=null;a.pending=null;a.tell.setText('¡SIN ESCUDO!').setVisible(true);
    model.runtime.combat.tokens.release(a);model.transition('phaseChange');
    model.pose('breakShield',p.breakPoses[0]);
    a.invulnerableUntil=model.scene.combatTime+p.transitionMs;model.scene.sfx?.play('metalCrack');
    this.nextReady=model.clock;
  }
  interrupt(){this.nextReady=this.model.clock+toFrames(this.config.cooldown);}
  beginShot(){
    const m=this.model,a=m.actor,p=this.config;
    this.frames=enemyThrowData({...a.config,throw:{...a.config.throw,windup:this.shots?p.interval:p.windup,recovery:p.recovery}},m.scene.level.damage??1).frames;
    this.index=0;this.fired=false;
  }
  step(){
    const m=this.model,s=m.scene,a=m.actor,p=this.config;
    if(m.state==='phaseChange'){
      const t=Math.min(1,m.age/toFrames(p.transitionMs));m.pose('breakShield',p.breakPoses[Math.min(p.breakPoses.length-1,Math.floor(t*p.breakPoses.length))]);
      if(t>=1){a.invulnerableUntil=0;a.tell.setVisible(false);m.transition('circle');m.ready=m.clock;}
      return true;
    }
    if(m.state!=='bombRun'){
      if(m.action || !['approach','circle'].includes(m.state) || m.clock<this.nextReady || m.clock<m.ready || !m.runtime.combat.tokens.acquire(a))return false;
      m.transition('bombRun');this.shots=0;this.direction=a.x<(s.floor.left+s.floor.right)/2?1:-1;
      this.depth=Math.sign(s.player.y-a.y)||1;a.tell.setText('¡4 BOMBAS!').setVisible(true);this.beginShot();
    }
    if(a.x<=s.floor.left+p.margin)this.direction=1;else if(a.x>=s.floor.right-p.margin)this.direction=-1;
    if(a.y<=s.floor.top+p.margin)this.depth=1;else if(a.y>=s.floor.bottom-p.margin)this.depth=-1;
    m.move(this.direction,this.depth*p.depthMovement);m.face(s.player.x-a.x);
    const frame=this.frames[this.index];m.pose('throw',frame.pose);
    if(frame.phase==='active' && !this.fired){
      this.fired=true;a.tell.setVisible(false);s.throwProjectile(a,a.facing,a.config.throw,0);s.sfx?.play('boss5Attack');
    }
    if(++this.index>=this.frames.length){
      if(++this.shots<p.count)this.beginShot();
      else {this.nextReady=m.clock+toFrames(p.cooldown);m.finish(toFrames(p.rest));}
    }
    return true;
  }
}
