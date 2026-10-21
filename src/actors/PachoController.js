import {ARCADE} from '../data/arcade.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const PACHO_STATES=['pachoArrival','pachoExit','pachoLaugh','pachoHop','pachoShoot','pachoHeal','pachoRage'];

/** All choreography uses the enemy's fixed clock, including entrance and healing contact. */
export class PachoController {
  constructor(model){
    this.model=model;this.scene=model.scene;this.actor=model.actor;this.config=this.actor.config.pacho;
    this.phase=1;this.turn=0;this.healReady=Infinity;this.shots=0;this.entering=true;
    const s=this.scene,a=this.actor,c=this.config.entry;
    this.parking={x:s.floor.right-c.parkOffset,y:s.floor.top+c.floorOffset};
    this.carX=s.floor.right+c.offscreen;this.carStart=this.carX;
    this.car=s.add.image(this.carX,this.parking.y,'pacho-car-closed').setOrigin(.5,1).setDisplaySize(c.width,c.height).setDepth(this.parking.y-2);
    a.sprite.setVisible(false);a.shadow.setVisible(false);a.healthBar.setVisible(false);a.invulnerableUntil=Infinity;
    a.tell.setText('DON PACHO PLOMO').setVisible(true);model.transition('pachoArrival');
  }
  get state(){return this.model.state;}
  pose(index){this.model.pose('idle',index);}
  face(){const a=this.actor;a.facing=Math.sign(this.scene.player.x-a.x)||a.facing||-1;a.sprite.setFlipX(a.facing<0);}
  release(){const a=this.actor;this.model.runtime.combat.tokens.release(a);a.pending=null;a.tell.setVisible(false);a.z=0;}
  reset(){
    this.release();this.actor.sprite.setVisible(true);this.actor.shadow.setVisible(this.actor.hp>0);this.actor.invulnerableUntil=0;
    this.actor.sprite.clearTint?.();this.model.action=null;
    if(this.state!=='hurt')this.model.transition('hurt');this.model.transition('approach');
  }
  phaseCheck(){
    const a=this.actor,p=this.config,m=this.model;
    if(this.entering || this.phase===2 || a.hp<=0 || a.hp>=a.config.hp*p.below)return false;
    this.reset();this.phase=2;a.config={...a.config,speed:a.config.speed*p.speedMultiplier};
    m.transition('pachoRage');a.tell.setText('¡AHORA CON PLOMO!').setVisible(true);
    this.healReady=m.clock+p.heal.firstDelay;return true;
  }
  hurt(){
    if(this.actor.hp<=0){this.destroy();return;}
    if(this.entering)return;
    if(this.state==='pachoHeal')this.healReady=this.model.clock+this.config.heal.interruptCooldown;
    if(this.phaseCheck())return;
    this.reset();this.model.transition('hurt');this.model.ready=this.model.clock+this.config.hurt;
  }
  start(kind){
    const m=this.model,a=this.actor,p=this.config;
    if(!m.runtime.combat.tokens.acquire(a))return false;
    this.face();
    if(kind==='heal'){
      if(this.phase!==2){m.runtime.combat.tokens.release(a);return false;}
      m.transition('pachoHeal');this.healed=false;a.tell.setText('¡INTERRUMPE LA CURACIÓN!').setVisible(true);
    }else{
      m.transition('pachoHop');a.tell.setText('¡SALTO!').setVisible(true);
      const side=this.turn++%2?1:-1;
      this.origin={x:a.x,y:a.y};
      this.target={x:clamp(this.scene.player.x+side*p.hop.distance,this.scene.floor.left+p.hop.margin,this.scene.floor.right-p.hop.margin),
        y:clamp(this.scene.player.y,this.scene.floor.top,this.scene.floor.bottom)};
    }
    return true;
  }
  finish(){this.release();this.model.transition('recover');this.model.ready=this.model.clock+Math.round(this.config.rest*(this.phase===2?this.config.cooldownMultiplier:1));}
  step(){
    const m=this.model,a=this.actor,s=this.scene,p=this.config,e=p.entry;
    if(this.state==='pachoArrival'){
      const t=Math.min(1,m.age/e.drive);this.carX=this.carStart+(this.parking.x-this.carStart)*t;
      this.car.setPosition(this.carX,this.parking.y);a.x=this.carX;a.y=this.parking.y;
      if(t===1){this.car.setTexture('pacho-car-open');m.transition('pachoExit');a.sprite.setVisible(true);a.shadow.setVisible(true);}
      return;
    }
    if(this.state==='pachoExit'){
      const t=Math.min(1,m.age/e.exit);a.x=this.parking.x-e.stepX*t;a.y=this.parking.y+e.stepY*t;this.face();m.pose('walk');
      if(t===1){this.car.setTexture('pacho-car-closed');m.transition('pachoLaugh');a.tell.setText('¡JA, JA, JA!').setVisible(true);}return;
    }
    if(this.state==='pachoLaugh'){
      this.pose(p.poses.laugh);if(m.age>=e.laugh){this.entering=false;a.invulnerableUntil=0;a.tell.setVisible(false);m.transition('approach');m.ready=m.clock;}return;
    }
    if(this.phaseCheck())return;
    if(this.state==='pachoRage'){this.pose(p.poses.machineDraw);if(m.age>=p.rage){a.tell.setVisible(false);m.transition('approach');m.ready=m.clock;}return;}
    if(this.state==='hurt'){m.pose('hurt');if(m.age>=p.hurt)m.transition('approach');return;}
    if(this.state==='recover'){this.pose(p.poses.idle);if(m.clock>=m.ready)m.transition('circle');return;}
    if(this.state==='pachoHeal'){
      const c=p.heal;this.pose(m.age<c.contact?p.poses.healPrepare:p.poses.heal);
      if(m.age>=c.contact && !this.healed){
        this.healed=true;a.hp=Math.min(a.config.hp,a.hp+a.config.hp*c.fraction);a.healthBar.width=42*a.hp/a.config.hp;
        a.tell.setText('+10% ENERGÍA');a.sprite.setTint?.(0x99ffb0);this.healReady=m.clock+c.cooldown;
      }
      if(m.age>=c.frames){a.sprite.clearTint?.();this.finish();}return;
    }
    if(this.state==='pachoHop'){
      const c=p.hop,frames=Math.round(c.air/(this.phase===2?p.speedMultiplier:1));
      if(m.age<=c.startup){this.pose(p.poses.crouch);return;}
      const t=Math.min(1,(m.age-c.startup)/frames);a.x=this.origin.x+(this.target.x-this.origin.x)*t;a.y=this.origin.y+(this.target.y-this.origin.y)*t;
      a.z=Math.sin(Math.PI*t)*c.height;this.pose(t<.25?p.poses.takeoff:t<.85?p.poses.air:p.poses.land);this.face();
      if(t===1){a.z=0;m.runtime.combat.groundImpact(a);m.transition('pachoShoot');this.shots=0;a.tell.setText(this.phase===2?'¡RÁFAGA!':'¡PISTOLA!').setVisible(true);}return;
    }
    if(this.state==='pachoShoot'){
      const c=this.phase===2?p.machine:p.pistol,elapsed=m.age-c.startup;
      // Face once before firing; a burst commits to its lane so it can be dodged.
      if(m.age<=c.startup){this.face();this.pose(this.phase===2?p.poses.machineAim:p.poses.pistolAim);return;}
      const firing=elapsed%c.interval===1 && this.shots<c.count;
      this.pose(this.phase===2?(elapsed%c.interval<c.flash?p.poses.machineFire:p.poses.machineAim):(elapsed%c.interval<c.flash?p.poses.pistolFire:p.poses.pistolAim));
      if(firing){a.tell.setVisible(false);this.shots++;s.throwProjectile(a,a.facing,c,c.damage*(s.level.damage??1));s.sfx?.play('metalCrack');}
      if(elapsed>=(c.count-1)*c.interval+c.recovery)this.finish();return;
    }
    this.face();
    if(m.clock>=m.ready){
      const heal=this.phase===2 && m.clock>=this.healReady && a.hp<a.config.hp;
      if(this.start(heal?'heal':'hop'))return;
    }
    m.pose('walk');
  }
  debugAttack(kind){if(this.entering){this.entering=false;this.car.setTexture('pacho-car-closed');}this.reset();return this.start(kind);}
  destroy(){
    this.release();this.car?.destroy();this.car=null;this.actor.sprite.setVisible(true);this.actor.shadow.setVisible(this.actor.hp>0);
    this.actor.invulnerableUntil=0;this.actor.sprite.clearTint?.();
  }
}
