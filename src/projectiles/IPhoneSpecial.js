import { playPowerSound } from '../audio/SoundEffects.js';
import { IPHONE } from '../data/iphone.js';
import { canSpendSpecialEnergy, spendSpecialEnergy } from '../combat/specialEnergy.js';
import { firstPhoneTarget } from './iphoneCollision.js';
import { viewLeft } from '../stage/scroll.js';

export class IPhoneSpecial {
  constructor(scene) {
    this.scene=scene;this.phones=[];this.bursts=[];this.feedbackUntil=0;
    this.label=scene.add.text(260,65,'',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'10px',color:'#d6ed64'}).setDepth(1000);this.label.setScrollFactor?.(0);
    this.onFrame=(animation,frame)=>{
      if(animation.key==='office-iphone' && Number(frame.textureFrame)===IPHONE.releaseFrame)this.release(scene.playerAttack);
    };
    scene.player.sprite.on('animationupdate',this.onFrame);
    this.updateHud();
  }
  start() {
    const s=this.scene,now=s.combatTime;
    if(!canSpendSpecialEnergy(s) || s.finished || s.paused)return false;
    if(now<s.specialReadyAt){this.feedbackUntil=now+350;this.updateHud();return false;}
    if(s.playerAttack || now<s.hurtUntil || now<s.dashUntil || now-s.jumpStart<650)return false;
    s.playerAttack={...s.character.attacks.iphone,type:'iphone',start:now,facing:s.facing,hit:false,released:false};
    s.play(s.player,'iphone',s.playerAttack.duration);
    return true;
  }
  release(attack) {
    const s=this.scene;
    if(!attack || attack!==s.playerAttack || attack.type!=='iphone' || attack.released || s.health<=0 || s.finished || s.paused || s.combatTime<s.hurtUntil || s.combatTime<s.dashUntil)return false;
    if(!spendSpecialEnergy(s))return false;
    attack.released=true;attack.hit=true;
    s.sfx?.play('celuco');playPowerSound(s);
    s.specialReadyAt=s.combatTime+attack.cooldown;
    const x=s.player.x+attack.facing*IPHONE.handOffset,y=s.player.y;
    const sprite=s.add.image(x,y-IPHONE.flightHeight,IPHONE.texture).setDisplaySize(IPHONE.width,IPHONE.height)
      .setFlipX(attack.facing<0).setDepth(y+1);
    const trail=s.add.graphics?.();trail?.setDepth?.(y);
    this.phones.push({x,y,facing:attack.facing,distance:0,born:s.combatTime,attack:{...attack},sprite,trail});
    s.cameras?.main?.flash?.(80,180,240,255);
    this.updateHud();
    return true;
  }
  targets() {
    const s=this.scene;
    const targets=s.enemies.filter(enemy=>enemy.hp>0).map(entity=>({kind:'enemy',entity,x:entity.x,y:entity.y,radius:18}));
    if(s.boss && !s.boss.dead && !s.boss.ended)targets.push({kind:'boss',entity:s.boss,x:s.boss.x,y:s.boss.y,radius:22});
    for(const entity of s.energyPickups?.cans??[])if(entity.hp>0)targets.push({kind:'can',entity,x:entity.x,y:entity.y,radius:entity.config.hurtbox.halfWidth});
    for(const entity of s.boss?.hazards.works??[])if(entity.active && entity.kind!=='hole')targets.push({kind:'work',entity,x:entity.x,y:entity.y,radius:entity.w/2});
    return targets;
  }
  update(dt) {
    const s=this.scene;
    if(s.paused || s.finished)return;
    this.phones=this.phones.filter(phone=>{
      if(s.combatTime-phone.born>=IPHONE.lifetime){phone.sprite.destroy();phone.trail?.destroy();return false;}
      const previousX=phone.x,step=Math.min(IPHONE.speed*dt,phone.attack.range-phone.distance);
      phone.x+=phone.facing*step;phone.distance+=step;
      const target=firstPhoneTarget(previousX,phone.x,phone.y,phone.facing,this.targets(),IPHONE.lane);
      if(target) {
        // Damage is shared with melee. The impact origin is the incoming phone,
        // so turning or moving Gomelo afterwards cannot bypass the boss's guard.
        if(target.kind==='enemy') {
          if(s.combatTime>=(target.entity.invulnerableUntil??0))s.hitEnemy(target.entity,phone.attack);
        } else if(target.kind==='can')s.energyPickups.hit(target.entity);
        else if(target.kind==='boss')target.entity.hit(phone.attack,{x:previousX,y:phone.y});
        else s.boss.hazards.hitObstacle(target.entity,phone.attack);
        this.impact(phone.x,phone.y);
        phone.sprite.destroy();phone.trail?.destroy();return false;
      }
      phone.sprite.setPosition(phone.x,phone.y-IPHONE.flightHeight).setDepth(phone.y+1);
      this.drawTrail(phone);
      phone.sprite.rotation+=phone.facing*IPHONE.spin*dt;
      if(phone.distance>=phone.attack.range || phone.x < viewLeft(s)-32 || phone.x > viewLeft(s)+IPHONE.arenaWidth+32){phone.sprite.destroy();phone.trail?.destroy();return false;}
      return true;
    });
    this.updateBursts();
    this.updateHud();
  }
  /** Visual hit effect: a white flash, a yellow spark star and a cyan shock ring that grow and fade. */
  impact(x,y) {
    const s=this.scene,fx=IPHONE.impact,cy=y-IPHONE.flightHeight,parts=[];
    if(s.add.circle)parts.push(s.add.circle(x,cy,14,0xffffff,.95));
    if(s.add.star)parts.push(s.add.star(x,cy,8,fx.star*.35,fx.star,fx.color,.95));
    if(s.add.circle){const ring=s.add.circle(x,cy,fx.ring/2);ring.setStrokeStyle?.(4,fx.ringColor,1);parts.push(ring);}
    for(const part of parts)part.setDepth?.(y+3);
    this.bursts.push({parts,born:s.combatTime});
    s.cameras?.main?.shake?.(70,.0025);
  }
  /** Beam of light behind the flying phone: wide cyan glow, white core and sparkles. */
  drawTrail(phone){
    const g=phone.trail;if(!g?.clear)return;
    const T=IPHONE.trail,y=phone.y-IPHONE.flightHeight,len=Math.min(T.length,phone.distance),x0=phone.x-phone.facing*len,t=this.scene.combatTime;
    g.clear().setDepth?.(phone.y);
    g.lineStyle(T.glow,T.color,.28).lineBetween(x0,y,phone.x,y);
    g.lineStyle(T.glow*.55,T.color,.5).lineBetween(x0+phone.facing*len*.3,y,phone.x,y);
    g.lineStyle(T.core,T.coreColor,.95).lineBetween(x0+phone.facing*len*.5,y,phone.x,y);
    g.fillStyle(T.coreColor,.9).fillCircle(phone.x,y,T.glow*.5);
    for(let i=0;i<6;i++){const a=((i*37+Math.floor(t/40)*13)%100)/100;g.fillStyle(i%2?T.color:T.coreColor,.8).fillCircle(phone.x-phone.facing*len*a,y+(a-.5)*14,1.5+a*2);}
  }
  updateBursts() {
    const s=this.scene,ms=IPHONE.impact.ms;
    this.bursts=this.bursts.filter(burst=>{
      const t=(s.combatTime-burst.born)/ms;
      if(t>=1){for(const part of burst.parts)part.destroy();return false;}
      burst.parts.forEach((part,i)=>{part.setScale?.(i===0?1+t*1.5:i===1?.6+t*.9:.3+t*1.4);part.setAlpha?.(1-t);if(i===1)part.rotation=(part.rotation??0)+.12;});
      return true;
    });
  }
  updateHud() {
    const remaining=Math.max(0,this.scene.specialReadyAt-this.scene.combatTime);
    const feedback=this.scene.combatTime<this.feedbackUntil;
    this.label.setText(!canSpendSpecialEnergy(this.scene)?'K / IPHONE SIN ENERGÍA':remaining?`K / IPHONE ${feedback?'ESPERA ':''}${(remaining/1000).toFixed(1)} s`:'K / IPHONE LISTO · -10 ENERGÍA')
      .setColor(feedback?'#ffcf69':remaining?'#aebeb1':'#d6ed64');
  }
  clear() {
    this.phones.forEach(phone=>{phone.sprite.destroy();phone.trail?.destroy();});this.phones=[];
    for(const burst of this.bursts)for(const part of burst.parts)part.destroy();this.bursts=[];
  }
  destroy() {
    this.scene.player.sprite.off('animationupdate',this.onFrame);
    this.clear();this.label.destroy();
  }
}
