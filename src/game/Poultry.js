import {ARCADE} from '../data/arcade.js';

export const HEN={speed:205,damage:5,peckEvery:54,lifetime:540,reflectSpeed:620,reflectDamage:34,height:33};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** Ankle-height hazards are separate from the ordinary enemy hurtboxes: fists pass over them. */
export class Poultry {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.hens=[];}
  activeFor(owner){return this.hens.find(h=>h.owner===owner && h.phase==='wild');}
  release(owner){
    if(owner.hp<=0 || this.activeFor(owner))return null;
    const s=this.scene,dir=owner.facing||Math.sign(s.player.x-owner.x)||1;
    const x=clamp(owner.x+dir*38,s.floor.left,s.floor.right),y=owner.y;
    const sprite=s.add.sprite(x,y,'pico-hen',0).setOrigin(.5,1).setScale(HEN.height/s.textures.get('pico-hen').referenceHeight);
    const hen={owner,x,y,z:0,sprite,phase:'wild',age:0,peckAt:0,voiceAt:120,pecking:false,dir};
    this.hens.push(hen);s.sfx?.play('chicken');return hen;
  }
  contact(actor,attack,targets){
    if(attack.type!=='kick' && attack.type!=='lowKick')return;
    for(const hen of this.hens){
      const dx=hen.x-actor.x;
      if(hen.phase!=='wild' || targets.has(hen) || dx*attack.facing<-10 || Math.abs(dx)>attack.range || Math.abs(hen.y-actor.y)>24)continue;
      targets.add(hen);hen.phase='flung';hen.age=0;hen.dir=attack.facing;hen.pecking=false;
      const target=this.scene.enemies.filter(e=>e.hp>0 && (e.x-hen.x)*hen.dir>0)
        .sort((a,b)=>Math.hypot(a.x-hen.x,a.y-hen.y)-Math.hypot(b.x-hen.x,b.y-hen.y))[0];
      hen.aimY=target?.y??hen.y;hen.startY=hen.y;
    }
  }
  update(){
    const s=this.scene,p=s.player;
    this.hens=this.hens.filter(h=>{
      h.age++;
      // Defeating the seller ends his distraction; reflected birds finish their already-earned counterattack.
      if(h.phase==='wild' && (h.owner.hp<=0 || h.age>HEN.lifetime))h.phase='flee';
      let pose;
      if(h.phase==='wild'){
        const dx=p.x-h.x,dy=p.y-h.y;h.dir=Math.sign(dx)||h.dir;
        h.pecking=Math.abs(dx)<30 && Math.abs(dy)<18;
        if(!h.pecking){
          h.x+=Math.sign(dx)*Math.min(Math.abs(dx),HEN.speed/60);
          h.y=clamp(h.y+Math.sign(dy)*Math.min(Math.abs(dy),HEN.speed/60*.55),s.floor.top,s.floor.bottom);
        }else if(h.age>=h.peckAt){
          h.peckAt=h.age+HEN.peckEvery;
          if(h.age>=h.voiceAt){s.sfx?.play('chicken');h.voiceAt=h.age+120;}
          if((p.z??s.jumpHeight??0)<30)s.hitPlayer(Math.round(HEN.damage*(s.level.damage??1)),null,h.owner);
        }
        pose=(h.pecking?4:0)+Math.floor(h.age/5)%4;
      }else if(h.phase==='flung'){
        const previous=h.x;h.x+=h.dir*HEN.reflectSpeed/60;
        h.y=h.startY+(h.aimY-h.startY)*Math.min(1,h.age/25);h.z=Math.sin(Math.min(1,h.age/38)*Math.PI)*40;
        const target=s.enemies.find(e=>e.hp>0 && s.combatTime>=(e.invulnerableUntil??0) && (e.z??0)<45 &&
          Math.abs(e.y-h.y)<26 && e.x>=Math.min(previous,h.x)-24 && e.x<=Math.max(previous,h.x)+24);
        if(target){
          s.hitEnemy(target,{damage:HEN.reflectDamage,knockback:30,facing:h.dir,finisher:true,knockdown:true,stun:350});
          s.sfx?.play('kick');h.sprite.destroy();return false;
        }
        if(h.age>=50){h.sprite.destroy();return false;}
        pose=8+Math.floor(h.age/3)%4;
      }else {
        h.x+=h.dir*HEN.speed/60;h.sprite.alpha=Math.max(0,h.sprite.alpha-.06);
        if(h.sprite.alpha<=0){h.sprite.destroy();return false;}pose=Math.floor(h.age/5)%4;
      }
      h.sprite.setFrame(pose).setPosition(h.x,h.y-h.z).setDepth(h.y+2).setFlipX(h.dir<0);return true;
    });
  }
  clear(){for(const h of this.hens)h.sprite.destroy();this.hens=[];}
}

/** Release a hen, then walk around the distracted player's back before committing the club swing. */
export class PolleroController {
  constructor(model){this.model=model;this.runtime=model.runtime;this.scene=model.scene;this.actor=model.actor;this.ready=60;}
  interrupt(){this.releasing=false;this.ready=this.model.clock+150;}
  beginRelease(){
    const m=this.model,a=this.actor;
    if(this.runtime.poultry.activeFor(a) || !['approach','circle'].includes(m.state) || !this.runtime.combat.tokens.acquire(a))return false;
    this.releasing=true;this.released=false;this.start=m.clock;
    m.face(this.scene.player.x-a.x);
    m.transition('windup');a.tell.setText('¡PÍQUELO!').setVisible(true);return true;
  }
  step(){
    const m=this.model,s=this.scene,a=this.actor,p=s.player;
    if(this.releasing){
      if(!['windup','attack'].includes(m.state)){this.interrupt();return false;}
      const age=m.clock-this.start;
      m.pose('release',a.config.animations.release[Math.min(3,Math.floor(age/12))]);
      if(age>=26 && !this.released){this.released=true;m.transition('attack');a.tell.setVisible(false);this.runtime.poultry.release(a);}
      if(age>=48){this.releasing=false;this.ready=m.clock+270;m.transition('recover');m.finish(24);}
      return true;
    }
    if(!['approach','circle'].includes(m.state))return false;
    const hen=this.runtime.poultry.activeFor(a),dx=p.x-a.x,dy=p.y-a.y;
    if(!hen && m.clock>=this.ready && m.clock>=m.ready && Math.abs(dx)>100 && Math.abs(dx)<650 && Math.abs(dy)<35)return this.beginRelease();
    if(!hen)return false;
    const side=s.facing||1,behind=clamp(p.x-side*82,s.floor.left+15,s.floor.right-15);
    const lane=p.y<(s.floor.top+s.floor.bottom)/2?clamp(p.y+38,s.floor.top,s.floor.bottom):clamp(p.y-38,s.floor.top,s.floor.bottom);
    const linedUp=Math.abs(behind-a.x)<22;
    const targetY=linedUp?p.y:lane;
    // Cross to the back on an adjacent lane; do not run through the player at ankle level.
    const my=Math.abs(targetY-a.y)>7?Math.sign(targetY-a.y):0;
    const mx=Math.abs(behind-a.x)>12 && (Math.abs(a.y-p.y)>24 || linedUp)?Math.sign(behind-a.x):0;
    m.face(dx);
    if(linedUp && Math.abs(dy)<ARCADE.body.lane && Math.abs(dx)<=a.config.range && m.clock>=m.ready)return m.begin(true);
    m.move(mx,my,a.config.speed*1.1);m.pose(mx||my?'walk':'idle');return true;
  }
}
