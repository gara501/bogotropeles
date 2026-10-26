import {ARCADE} from '../data/arcade.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class RingFighter {
  constructor(model){this.model=model;this.actor=model.actor;this.scene=model.scene;this.runtime=model.runtime;this.clock=0;this.kind=this.actor.config.ringFighter;this.set('idle');model.transition('ringFight');}
  set(mode){this.mode=mode;this.age=0;this.connected=false;this.actor.tell.setVisible(false);}
  pose(frame){this.model.pose('idle',frame);}
  face(){const a=this.actor;a.facing=Math.sign(this.scene.player.x-a.x)||a.facing;a.sprite.setFlipX(a.facing<0);}
  tell(text){this.actor.tell.setText(text).setVisible(true);}
  hurt(){
    const a=this.actor;if(a.hp<=0){this.set('dead');a.z=0;this.pose(23);return;}
    this.actor.z=0;this.cryUntil=this.clock+42;
    if(this.kind==='cristiano'){
      this.tell('¡BUAA!');this.scene.sfx?.play('ringCry');
      // Stopping his flurry also gives the full two-second punishment window.
      if(this.mode==='flail'){this.set('tired');return;}
      if(this.mode==='tired')return;
    }
    if(this.mode==='dance')this.healReady=this.clock+720;
    this.set('hurt');this.model.transition('ringFight');
    if(this.kind==='cristiano')this.tell('¡BUAA!');
  }
  start(mode){
    const a=this.actor,p=this.scene.player;this.face();this.set(mode);
    if(['cartwheel','hop','healLeap'].includes(mode)){
      this.from={x:a.x,y:a.y};this.to={x:clamp(p.x+(a.x<p.x?205:-205),this.scene.floor.left+30,this.scene.floor.right-30),y:clamp(p.y,this.scene.floor.top+10,this.scene.floor.bottom-10)};
      if(mode==='healLeap')this.to.x=a.x<480?this.scene.floor.right-55:this.scene.floor.left+55;
      if(mode==='hop'){this.tell('¡JA JA JA!');this.scene.sfx?.play('ringLaugh');}
    }
    if(mode==='flail'){this.dir=a.facing;this.lane=p.y;this.tell('¡OJOS CERRADOS!');}
    if(mode==='kick')this.tell('¡PIERNA VA!');
    if(mode==='cap')this.tell('¡GORRA VA!');
  }
  hit(damage,range,knockdown=false){
    const a=this.actor,s=this.scene;
    if(this.runtime.combat.touches(a,s.player,{facing:a.facing,range,lane:29}) && (s.player.z??0)<40 && s.hitPlayer(damage,null,a)){
      this.scene.sfx?.play('kick');if(knockdown)this.runtime.player.hurt(true);return true;
    }return false;
  }
  leap(mode){
    const a=this.actor,t=Math.min(1,this.age/(mode==='hop'?65:mode==='healLeap'?54:42));
    a.x=this.from.x+(this.to.x-this.from.x)*t;a.y=this.from.y+(this.to.y-this.from.y)*t;a.z=t===1?0:Math.sin(Math.PI*t)*(mode==='cartwheel'?48:90);
    this.pose(mode==='cartwheel'?12+Math.min(3,Math.floor(t*4)):mode==='healLeap'?(t<.2?20:21):12+Math.min(3,Math.floor(t*4)));
    if(t===1){a.invulnerableUntil=0;if(mode==='healLeap'){this.set('dance');this.tell('+10% · ¡INTERRUMPE EL BAILE!');}else if(mode==='hop'){this.start('slap');}else this.set('idle');}
  }
  step(){
    const a=this.actor,s=this.scene,p=s.player;if(this.runtime.combat.frozen(a))return;
    this.clock++;this.age++;
    if(this.mode==='dead'){this.pose(23);return;}
    if(this.mode==='hurt'){this.pose(this.kind==='cristiano'?16+Math.floor(this.age/9)%4:16+Math.floor(this.age/8)%4);if(this.age>=28)this.set('idle');return;}
    if(['cartwheel','hop','healLeap'].includes(this.mode)){this.leap(this.mode);return;}
    if(this.mode==='tired'){
      this.pose(this.clock<(this.cryUntil??0)?16+Math.floor(this.age/9)%4:8+Math.floor(this.age/30)%4);
      if(this.age>=120)this.set('idle');return;
    }
    if(this.mode==='dance'){
      this.pose(12+Math.floor(this.age/9)%4);
      const radius=35+Math.sin(this.age*.2)*5;a.tell.setText('+10%').setVisible(true);
      s.ringBonus?.fx.lineStyle(3,0x65ffb0,.8).strokeEllipse(a.x,a.y,Math.max(20,radius*2),18);
      if(this.age===120){a.hp=Math.min(a.config.hp,a.hp+a.config.hp*.1);a.healthBar.width=42*a.hp/a.config.hp;s.sfx?.play('item');}
      if(this.age>=144){this.healReady=this.clock+720;this.set('idle');}return;
    }
    if(this.mode==='flail'){
      if(this.age<=28){this.pose(4);return;}
      a.facing=this.dir;a.sprite.setFlipX(a.facing<0);a.x=clamp(a.x+this.dir*5.5,s.floor.left,s.floor.right);a.y+=clamp(this.lane-a.y,-1,1);this.pose(4+Math.floor(this.age/3)%4);
      if(this.age%12===0)this.hit(8,85);
      if(this.age>=82){this.set('tired');this.tell('¡CANSADO! · 2 SEGUNDOS');}return;
    }
    if(['punch','slap','kick'].includes(this.mode)){
      this.pose(4+Math.min(3,Math.floor(this.age/8)));
      const active=this.mode==='kick'?28:this.mode==='slap'?18:20;
      if(this.age===active)this.hit(this.mode==='kick'?16:this.mode==='slap'?11:12,this.mode==='kick'?175:95,this.mode==='kick');
      if(this.age>=active+27)this.set('idle');return;
    }
    if(this.mode==='cap' || this.mode==='money'){
      this.pose(8+Math.min(3,Math.floor(this.age/10)));
      if(this.age===26)s.ringBonus.projectile(a,this.mode==='cap'?'cap':'bill');
      if(this.mode==='money' && this.age===43)s.ringBonus.projectile(a,'coin');
      if(this.age>=72)this.set('idle');return;
    }
    this.face();const dx=p.x-a.x,dy=p.y-a.y,dist=Math.abs(dx);
    if(this.kind==='cristiano' && s.playerAttack && s.playerAttack!==this.dodgedAttack && dist<180 && this.clock>=(this.dodgeReady??0)){
      this.dodgedAttack=s.playerAttack;
      if(Math.random()<.4){this.dodgeReady=this.clock+240;this.start('cartwheel');a.invulnerableUntil=s.combatTime+36*ARCADE.clock.stepMs;return;}
    }
    if(this.kind==='minilaja' && a.hp<a.config.hp*.2 && this.clock>=(this.healReady??0)){this.healReady=this.clock+720;this.start('healLeap');return;}
    if(this.age>=50 && Math.abs(dy)<32){
      if(this.kind==='cristiano'){
        this.turn=(this.turn??0)+1;if(this.turn%3===0){this.start('cartwheel');a.invulnerableUntil=s.combatTime+36*ARCADE.clock.stepMs;}else this.start('flail');
      }else if(this.kind==='brincolas')this.start(dist<95?'slap':'hop');
      else if(this.kind==='piernas')this.start(dist<205?'kick':'money');
      else this.start(dist<105?'punch':'cap');return;
    }
    const drunk=this.kind==='piernas',mx=dist>(drunk?160:110)?Math.sign(dx):0;
    this.model.move(mx,Math.abs(dy)>12?Math.sign(dy):drunk?Math.sin(this.clock*.16)*.7:0,a.config.speed);
    this.pose(mx || Math.abs(dy)>12?1+Math.floor(this.age/(drunk?11:8))%3:0);
  }
}
