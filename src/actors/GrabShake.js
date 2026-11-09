import {ARCADE} from '../data/arcade.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** A held-rival move: Gomelo shakes; Teleperforman plays three headset lashes, then releases. */
export class GrabShake {
  constructor(player,grab){
    this.player=player;this.grab=grab;this.scene=player.scene;this.config=this.scene.character.grabShake;
    this.age=0;this.released=false;this.cancelled=false;
    const t=grab.target;grab.model.endStruggle();
    this.rotation=t.sprite.rotation??0;t.grabMove='shake';
    t.sprite.stop().setFrame(t.config.animations.hurt?.[0]??t.config.idle??0);
    this.graphic=this.config.vibrate===false?null:this.scene.add?.graphics?.();this.graphic?.setDepth?.(t.y+120);
    player.buffer.clear();this.scene.sfx?.play('wave');
  }
  step(){
    if(this.cancelled)return;
    const p=this.player,g=this.grab,t=g.target,c=this.config;
    if(!this.released && (t.hp<=0 || g.model.state!=='grabbed')){this.finish();return;}
    this.age++;
    // vibrate:false (Teleperforman): the held rival is simply struck, without jitter or shake lines.
    const shaking=c.vibrate!==false && this.age>=c.start && this.age<c.release;
    const pose=c.poseTimeline?c.poseTimeline[Math.min(this.age-1,c.poseTimeline.length-1)]:this.age<c.start?c.poses[0]:this.age<c.release?c.poses[1+Math.floor((this.age-c.start)/2)%4]:c.poses[5];
    p.actor.sprite.stop().setFrame(pose);
    if(this.age===c.start && !this.released && c.sound!==false)this.scene.sfx?.play(c.sound??'shake');
    if(c.contacts?.includes(this.age) && !this.released){this.scene.sfx?.play(c.contactSound??'punch');if(c.contactHit)this.strike(c.contacts.indexOf(this.age));}
    if(!this.released){
      p.holdTarget();
      if(c.holdDistance)t.x=clamp(p.actor.x+this.scene.facing*c.holdDistance,this.scene.floor.left,this.scene.floor.right);
      if(shaking){
        const sign=this.age%2?1:-1;
        t.grabJitterX=sign*c.amplitude;t.grabJitterY=sign*2;
        t.sprite.rotation=this.rotation+sign*.045;
      }
    }
    if(c.vibrate!==false)this.drawFX(shaking?1:Math.max(0,(c.total-this.age)/(c.total-c.release)));
    if(this.age===c.release)this.release();
    if(!this.cancelled && this.age>=c.total)this.finish();
  }
  /** A held lash lands: the rival flinches into a pain frame, flashes white and a spark bursts at the contact point.
   * Damage is still dealt once, on release. */
  strike(index){
    const p=this.player,t=this.grab.target,hurt=t.config.animations?.hurt;
    if(hurt?.length)t.sprite.stop().setFrame(hurt[index%hurt.length]);
    p.runtime?.combat?.impact?.(p.actor,t,{type:'headsetWhip',impactType:'headsetWhip',damage:0,facing:this.scene.facing,finisher:false});
  }
  drawFX(alpha){
    const g=this.graphic;if(!g)return;
    const t=this.grab.target,h=t.config.height??100,x=t.x+(t.grabJitterX??0),y=t.y-h*.55;
    g.clear?.();g.setDepth?.(t.y+120);
    if(this.age<this.config.start || alpha<=0)return;
    for(let i=0;i<6;i++){
      const side=i%2?1:-1,yy=y-h*.25+i*h*.1,shift=(this.age+i)%3*3;
      g.lineStyle?.(i%2?2:3,i%2?0xffffff:0x79e7ff,alpha*.8);
      g.lineBetween?.(x+side*(16+shift),yy,x+side*(36+shift),yy-2);
    }
    g.lineStyle?.(2,0x9cf3ff,alpha*.7);g.strokeEllipse?.(x,y,48+(this.age%3)*6,h*.65);
  }
  restore(){
    const t=this.grab.target;t.grabJitterX=0;t.grabJitterY=0;t.grabMove=null;t.z=0;t.sprite.rotation=this.rotation;
  }
  release(){
    const s=this.scene,g=this.grab,t=g.target,c=this.config;
    this.restore();this.released=true;g.model.breakFree();
    t.x=clamp(t.x+s.facing*c.push,s.floor.left,s.floor.right);
    s.hitEnemy(t,{type:'grabShake',damage:Math.round(s.character.attacks.punch.damage*c.damage),knockback:0,facing:s.facing,
      stun:c.stun,grab:false,finisher:false,knockdown:false,lane:ARCADE.body.lane});
    if(t.hp>0 && g.model.state==='hurt')g.model.stunFrames=Math.round(c.stun/ARCADE.clock.stepMs);
    s.sfx?.play('punch');s.cameras?.main?.shake?.(75,.002);
    s.fx?.burst?.(t.x,t.y-(t.config.height??100)*.55,t.y+120,{colors:[0xffffff,0x91edff],n:10,speed:[2,5],life:[120,220],size:2});
  }
  finish(){
    const p=this.player;this.cancel();
    if(p.grab===this.grab && p.state==='grab')p.transition('walk');
  }
  cancel(){
    if(this.cancelled)return;this.cancelled=true;
    if(!this.released)this.restore();
    this.graphic?.destroy();this.graphic=null;
    this.player.buffer.clear();if(this.grab.shake===this)this.grab.shake=null;
  }
}
