import {ARCADE} from '../data/arcade.js';
import {timeline} from '../data/attacks.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const BRAYATAN_STATES=['knifeVolley','macheteDance','chargeWindup','macheteCharge','stompWindup','stompAir','stompLand','rage'];

/** Frame-driven level-six boss. The landing target is captured once, at takeoff. */
export class BrayatanController {
  constructor(model){this.model=model;this.scene=model.scene;this.actor=model.actor;this.config=this.actor.config.brayatan;this.phase=1;this.cursor=0;model.ready=model.clock+this.config.initialWait;}
  get state(){return this.model.state;}
  phaseCheck(){
    const m=this.model,a=this.actor,p=this.config;
    if(this.phase!==1 || a.hp<=0 || a.hp>a.config.hp*p.below || ['stompAir','stompLand'].includes(this.state))return false;
    this.phase=2;this.cancel();a.config={...a.config,speed:a.config.speed*p.speedMultiplier};
    m.transition('rage');a.tell.setText('¡AHORA SÍ!').setVisible(true);a.invulnerableUntil=this.scene.combatTime+p.rage*ARCADE.clock.stepMs;return true;
  }
  cancel(){
    const m=this.model,a=this.actor;this.marker?.destroy();this.marker=null;this.shock?.destroy();this.shock=null;
    a.sprite.setVisible(true);a.shadow.setVisible(a.hp>0);a.z=0;a.invulnerableUntil=0;a.pending=null;a.tell.setVisible(false);
    if(this.healthWasVisible!==undefined)a.healthBar.setVisible(a.hp>0 && this.healthWasVisible);
    m.action=null;m.runtime.combat.tokens.release(a);this.frames=null;this.hits=new Set();
    if(m.state!=='hurt')m.transition('hurt');m.transition('approach');
  }
  hurt(){
    if(this.actor.hp<=0){this.destroy();return;}
    if(this.phaseCheck())return;
    this.cancel();this.model.transition('hurt');this.model.ready=this.model.clock+this.config.hurt;
  }
  face(){const a=this.actor;a.facing=Math.sign(this.scene.player.x-a.x)||a.facing||1;a.sprite.setFlipX(a.facing<0);}
  start(kind){
    const m=this.model,a=this.actor,s=this.scene,p=this.config;if(!m.runtime.combat.tokens.acquire(a))return false;
    this.kind=kind;this.hits=new Set();this.face();a.pending={enemy:a,connected:false,finisher:false};
    if(kind==='knives'){
      m.transition('knifeVolley');this.shots=0;this.knifeFrames();a.tell.setText('¡CUCHILLOS!').setVisible(true);
    }else if(kind==='dance'){
      m.transition('macheteDance');const c=p.dance;
      this.frames=c.poses.flatMap((pose,i)=>timeline({startup:i?c.between:c.startup,active:c.active,recovery:i===c.poses.length-1?c.recovery:0,
        startupPose:i?c.poses[1]:p.poses.danceStartup,activePose:pose,recoveryPose:p.poses.danceRecovery}).map(f=>({...f,hit:i,finisher:i===c.poses.length-1})));this.index=0;
      a.tell.setText('¡BAILE DE MACHETE!').setVisible(true);
    }else if(kind==='charge'){
      m.transition('chargeWindup');this.distance=0;a.tell.setText('¡MACHETE!').setVisible(true);
    }else if(kind==='stomp'){
      m.transition('stompWindup');a.tell.setText('¡MIRA LA SOMBRA!').setVisible(true);
    }
    return true;
  }
  knifeFrames(){
    const c=this.config.knives,p=this.config.poses;this.frames=timeline({startup:this.shots?c.interval:c.startup,active:c.active,recovery:c.recovery,startupPose:p.knifeStartup,activePose:p.knifeActive,recoveryPose:p.knifeRecovery});this.index=0;this.fired=false;
  }
  hit(attack,id){
    const m=this.model,a=this.actor,s=this.scene;if(this.hits.has(id) || !m.runtime.combat.touches(a,s.player,{...attack,facing:a.facing}))return;
    this.hits.add(id);a.pending.finisher=Boolean(attack.finisher);
    if(s.hitPlayer(attack.damage,a.pending,a)){a.pending.connected=true;m.runtime.combat.push(s.player,{...attack,facing:a.facing});m.runtime.combat.impact(a,s.player,attack);}
  }
  finish(rest=this.config.rest){
    const m=this.model,a=this.actor;a.tell.setVisible(false);a.pending=null;m.transition('recover');m.ready=m.clock+Math.round(rest*(this.phase===2?this.config.cooldownMultiplier:1));
    this.frames=null;
  }
  takeoff(){
    const m=this.model,a=this.actor,s=this.scene,c=this.config.stomp;
    this.target={x:clamp(s.player.x,s.floor.left,s.floor.right),y:clamp(s.player.y,s.floor.top,s.floor.bottom)};
    this.origin={x:a.x,y:a.y};m.transition('stompAir');a.sprite.setVisible(false);a.tell.setVisible(false);a.shadow.setVisible(false);
    this.healthWasVisible=a.healthBar.visible;a.healthBar.setVisible(false);
    a.z=c.height;a.invulnerableUntil=Infinity;
    this.marker=s.add.ellipse(a.x,a.y,c.shadowWidth,c.shadowHeight,0x16121c,.8).setDepth(a.y-1);
    this.marker.setStrokeStyle?.(2,0xffce60,.9);s.sfx?.play('wave');
  }
  land(){
    const m=this.model,a=this.actor,s=this.scene,c=this.config.stomp;
    a.x=this.target.x;a.y=this.target.y;a.z=0;a.invulnerableUntil=0;a.sprite.setVisible(true);a.shadow.setVisible(true);this.marker?.destroy();this.marker=null;
    a.healthBar.setVisible(this.healthWasVisible??false);
    m.transition('stompLand');m.pose('stomp',this.config.poses.land);s.cameras.main.shake(c.shakeMs,c.shakeStrength);s.sfx?.play('stomp');s.sfx?.play('metalCrack');
    m.runtime.combat.groundImpact(a);this.shock=s.add.graphics?.();this.shockBorn=m.clock;
    // The footprint is shallow in world Y; stepping aside or jumping avoids the landing.
    if(Math.abs(a.x-s.player.x)<c.radius+ARCADE.body.halfWidth && Math.abs(a.y-s.player.y)<c.depth && (s.player.z??0)<ARCADE.body.airborneAvoidHeight)
      this.hit({damage:c.damage,range:c.radius,area:true,lane:c.depth*2,finisher:true},'stomp');
  }
  shockStep(){
    if(!this.shock)return;const c=this.config.stomp,t=(this.model.clock-this.shockBorn)/c.shockFrames;
    if(t>=1){this.shock.destroy();this.shock=null;return;}
    this.shock.clear().lineStyle(4,0xe8d6a0,1-t).strokeEllipse(this.actor.x,this.actor.y,c.shockRadius*2*t,c.shockRadius*t*.35).setDepth(this.actor.y+1);
  }
  step(){
    const m=this.model,a=this.actor,s=this.scene,p=this.config;this.shockStep();if(this.phaseCheck())return;
    if(this.state==='rage'){
      m.pose('dance',p.poses.rage);if(m.age>=p.rage){a.invulnerableUntil=0;a.tell.setVisible(false);m.transition('approach');m.ready=m.clock;}return;
    }
    if(this.state==='hurt'){m.pose('hurt');if(m.age>=p.hurt)m.transition('approach');return;}
    if(this.state==='recover'){m.pose('idle',a.config.idle);if(m.clock>=m.ready)m.transition('circle');return;}
    if(this.state==='knifeVolley'){
      const f=this.frames[this.index];this.face();m.pose('throw',f.pose);
      if(f.phase==='startup'){const dx=a.x-s.player.x;m.move(Math.abs(dx)<p.knives.retreat?Math.sign(dx)||1:0,Math.sign(s.player.y-a.y),a.config.speed*p.knives.move);}
      if(f.phase==='active' && !this.fired){this.fired=true;a.tell.setVisible(false);s.sfx?.play('knife');s.throwProjectile(a,a.facing,p.knives,p.knives.damage*(s.level.damage??1));}
      if(++this.index>=this.frames.length){if(++this.shots<(this.phase===2?p.knives.rageCount:p.knives.count))this.knifeFrames();else this.finish();}return;
    }
    if(this.state==='macheteDance'){
      const f=this.frames[this.index],c=p.dance;this.face();m.pose('dance',f.pose);
      if(f.phase==='startup')m.move(Math.sign(s.player.x-a.x),Math.sign(s.player.y-a.y),a.config.speed*c.advance);
      if(f.phase==='active'){a.tell.setVisible(false);if(!this.hits.has(`sound${f.hit}`)){s.sfx?.play('knife');this.hits.add(`sound${f.hit}`);}this.hit({damage:c.damage,range:c.range,lane:c.depth,finisher:f.finisher},f.hit);}
      if(++this.index>=this.frames.length)this.finish();return;
    }
    if(this.state==='chargeWindup'){
      m.pose('charge',p.poses.chargeWindup);if(m.age>=p.charge.startup){this.face();m.transition('macheteCharge');a.tell.setVisible(false);s.sfx?.play('running');}return;
    }
    if(this.state==='macheteCharge'){
      const c=p.charge,previous=a.x;m.move(a.facing,0,c.speed*(this.phase===2?p.speedMultiplier:1));this.distance+=Math.abs(a.x-previous);
      const art=a.config.animations.charge,pose=art[Math.floor(m.age%p.poses.chargeCycle/p.poses.chargeCycle*art.length)];m.pose('charge',pose);
      if(pose===p.poses.chargeContact)this.hit({damage:c.damage,range:c.range+Math.abs(a.x-previous),finisher:true},'charge');
      if(this.distance>=c.distance || m.age>=c.frames || Math.abs(a.x-previous)<.01)this.finish(c.recovery);return;
    }
    if(this.state==='stompWindup'){
      m.pose('stomp',m.age<p.stomp.startup*.75?p.poses.crouch:p.poses.takeoff);if(m.age>=p.stomp.startup)this.takeoff();return;
    }
    if(this.state==='stompAir'){
      const c=p.stomp,t=Math.min(1,m.age/(c.air*c.travel));a.x=this.origin.x+(this.target.x-this.origin.x)*t;a.y=this.origin.y+(this.target.y-this.origin.y)*t;
      this.marker.setPosition(a.x,a.y).setDepth(a.y-1);this.marker.setScale?.(.7+.3*m.age/c.air);this.marker.setAlpha?.(.65+.25*m.age/c.air);
      if(m.age>=c.air)this.land();return;
    }
    if(this.state==='stompLand'){m.pose('stomp',p.poses.land);if(m.age>=p.stomp.land)this.finish();return;}
    this.face();const dx=s.player.x-a.x,dy=s.player.y-a.y;
    if(a.x<s.floor.left || a.x>s.floor.right){m.move(a.x<s.floor.left?1:-1,0);m.pose('walk');return;}
    const cycle=this.phase===2?p.rageCycle:p.cycle,kind=cycle[this.cursor%cycle.length];
    if(m.clock>=m.ready && (kind!=='dance' || Math.abs(dx)<=p.dance.range)){
      if(this.start(kind)){this.cursor++;return;}
    }
    if(this.state!=='approach')m.transition('approach');m.move(Math.abs(dx)>a.config.range?Math.sign(dx):0,Math.abs(dy)>ARCADE.ai.alignY?Math.sign(dy):0);
    m.pose(this.phase===2?'run':'walk');
  }
  debugAttack(kind){this.cancel();this.model.ready=this.model.clock;return this.start(kind);}
  destroy(){this.marker?.destroy();this.shock?.destroy();this.marker=null;this.shock=null;this.actor.sprite.setVisible(true);this.actor.shadow.setVisible(this.actor.hp>0);this.actor.z=0;this.model.runtime.combat.tokens.release(this.actor);}
}
