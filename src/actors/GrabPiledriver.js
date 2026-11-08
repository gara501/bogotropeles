import {ARCADE} from '../data/arcade.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Gymbro's grab -> jump -> punch. The victim remains a separate, live character sprite. */
export class GrabPiledriver {
  constructor(player,grab){
    this.player=player;this.grab=grab;this.scene=player.scene;this.config=this.scene.character.piledriver;
    this.phase='jump';this.age=0;
    const t=grab.target;grab.model.endStruggle();
    this.saved={rotation:t.sprite.rotation??0,scaleX:t.sprite.scaleX??t.sprite.scaleY??1,
      flip:t.sprite.flipX??t.facing<0,shadow:t.shadow.visible!==false,bar:t.healthBar.visible!==false};
    // Pose zero is the atlas's reference height, so inversion brings the head to the intended contact point.
    t.grabMove='piledriver';t.sprite.stop().setFrame(t.config.frameOffset??0);
    t.healthBar.setVisible(false);t.shadow.setVisible(false);player.buffer.clear();
  }
  pose(frame){this.player.actor.sprite.stop().setFrame(frame);}
  step(){
    const p=this.player.actor,t=this.grab.target,c=this.config;
    if(this.phase!=='recover' && (t.hp<=0 || this.grab.model.state!=='grabbed')){this.finish();return;}
    this.age++;
    if(this.phase==='jump'){
      const time=Math.min(1,this.age/c.jumpFrames);
      p.z=time===1?0:Math.sin(time*Math.PI)*c.jumpHeight;
      this.player.holdTarget();t.z=p.z;
      this.pose(c.lift[Math.min(c.lift.length-1,Math.floor(time*c.lift.length))]);
      if(p.z>0 && this.player.buffer.consume('punch',this.player.runtime.frame)){
        this.from=p.z;this.phase='spin';this.age=0;this.scene.sfx?.play('wave');
      }else if(time===1){
        this.restore();this.grab.piledriver=null;
        if(this.grab.age>=ARCADE.grab.holdFrames){this.grab.model.breakFree();this.player.transition('walk');}
      }
      return;
    }
    if(this.phase==='spin'){
      const time=Math.min(1,this.age/c.flightFrames),angle=time*Math.PI*4;
      p.z=time===1?0:Math.min(c.maxHeight,this.from*(1-time)+Math.sin(time*Math.PI)*c.height);
      const frame=time<.78?c.spin[Math.min(c.spin.length-1,Math.floor(time/.78*c.spin.length))]:c.descend;
      this.pose(frame);
      t.x=clamp(p.x+this.scene.facing*8+Math.sin(angle)*18,this.scene.floor.left,this.scene.floor.right);
      t.y=clamp(p.y+Math.cos(angle)*2,this.scene.floor.top,this.scene.floor.bottom);
      t.z=p.z+t.config.height+8*(1-time);
      t.sprite.rotation=Math.PI;t.sprite.scaleX=this.saved.scaleX*(.45+.55*Math.abs(Math.cos(angle)));
      t.sprite.setFlipX(Math.cos(angle)<0?!this.saved.flip:this.saved.flip);
      if(time===1)this.land();
      return;
    }
    if(this.phase==='recover'){
      p.z=0;this.pose(this.age<5?c.impact:this.age<c.recovery-5?c.release:c.guard);
      if(this.age>=c.recovery)this.finish();
    }
  }
  land(){
    const s=this.scene,t=this.grab.target,p=this.player.actor,c=this.config;
    const origin={x:p.x,y:p.y}; // impact stays where they landed, before finisher recoil moves Gymbro
    this.restore();t.x=clamp(p.x+s.facing*28,s.floor.left,s.floor.right);t.y=p.y;
    this.pose(c.impact);this.phase='recover';this.age=0;
    s.hitEnemy(t,{type:'piledriver',damage:c.damage,knockback:0,facing:s.facing,stun:c.stunMs,
      downStunFrames:Math.round(c.stunMs/ARCADE.clock.stepMs),piledriver:true,landing:true,knockdown:true,finisher:true,lane:ARCADE.body.lane});
    const impact={type:'punch',damage:s.character.attacks.punch.damage,range:c.landingRange,
      area:true,lane:ARCADE.body.lane,facing:s.facing,knockback:ARCADE.attack.knockback,
      stun:ARCADE.attack.stun*ARCADE.clock.stepMs,piledriver:true,knockdown:true,landing:true,finisher:false};
    for(const other of s.enemies)if(other!==t && other.hp>0 && s.combatTime>=(other.invulnerableUntil??0)
      && this.player.runtime.combat.touches(origin,other,impact))s.hitEnemy(other,impact);
    s.sfx?.play('stomp');this.player.runtime.combat.groundImpact(t);s.cameras?.main?.shake?.(100,.005);
  }
  restore(){
    const t=this.grab.target,p=this.player.actor;
    t.grabMove=null;t.z=0;p.z=0;this.scene.jumpHeight=0;
    t.sprite.rotation=this.saved.rotation;t.sprite.scaleX=this.saved.scaleX;t.sprite.setFlipX(this.saved.flip);
    t.shadow.setVisible(this.saved.shadow && t.hp>0);t.healthBar.setVisible(this.saved.bar && t.hp>0);
  }
  finish(){this.restore();this.grab.piledriver=null;this.player.transition('walk');}
  cancel(){this.restore();this.grab.piledriver=null;}
}
