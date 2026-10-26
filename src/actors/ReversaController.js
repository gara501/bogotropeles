import {ARCADE} from '../data/arcade.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const REVERSA={hp:3000,width:540,height:240,entry:180,slamWindup:90,chargeWindup:60,reverseWindup:90,reverseFrames:48,hornWindup:48,platformWindup:66,windowStart:30,windowEnd:150,eggEnd:165,doorFrames:120};

/** One boss health pool: a porter on foot, then an armoured truck with timed side openings. */
export class ReversaController {
  constructor(model){
    this.model=model;this.runtime=model.runtime;this.scene=model.scene;this.actor=model.actor;this.phase=1;this.clock=0;this.turn=0;
    const s=this.scene;
    this.park={x:s.floor.right-250,y:s.floor.top+48};this.truckX=s.floor.left-360;this.truckY=this.park.y;
    this.truck=s.add.image(this.truckX,this.truckY,'reversa-truck-0').setOrigin(.5,1).setDisplaySize(REVERSA.width,REVERSA.height);
    this.fx=s.add.graphics();this.dialog=s.add.text(480,142,'',{fontFamily:'monospace',fontSize:'15px',color:'#ffe4a3',stroke:'#102025',strokeThickness:4,wordWrap:{width:760},align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(1002);
    this.guide=s.add.text(480,179,'',{fontFamily:'monospace',fontSize:'12px',color:'#ffffff',stroke:'#102025',strokeThickness:4,align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(1002).setVisible(false);
    this.hitLabel=s.add.text(0,0,'',{fontFamily:'monospace',fontSize:'16px',color:'#ffffff',stroke:'#102025',strokeThickness:4}).setOrigin(.5).setDepth(951).setVisible(false);
    this.crew=[0,1].map(i=>s.add.sprite(this.truckX+130+i*45,this.truckY-65,'estibador',16).setOrigin(.5,1).setScale(96/s.textures.get('estibador').referenceHeight));
    this.eggs=[];this.clouds=[];this.lastReverseBeep=-1;this.set('entry');
    this.actor.sprite.setVisible(false);this.actor.shadow.setVisible(false);this.actor.invulnerableUntil=Infinity;
    model.transition('reversa');s.sfx?.play('reversaHorn');
  }
  set(mode){this.mode=mode;this.age=0;this.connected=false;this.actor.tell.setText('').setVisible(false);}
  say(text,frames=150){this.dialog.setText(text).setVisible(true);this.dialogUntil=this.clock+frames;}
  pose(index){this.model.pose('idle',index);}
  face(){const a=this.actor;a.facing=Math.sign(this.scene.player.x-a.x)||-1;a.sprite.setFlipX(a.facing<0);}
  phaseCheck(){
    if(this.phase!==1 || this.mode==='entry' || this.mode==='exit' || this.actor.hp<=0 || this.actor.hp>this.actor.config.hp*.5)return false;
    this.phase=2;this.set('board');this.actor.invulnerableUntil=Infinity;this.say('FASE 2 · MOTOR BLINDADO · BUSCA EL COSTADO VERDE',240);this.model.transition('reversa');return true;
  }
  get windowOpen(){return this.phase===2 && this.mode==='eggs' && this.age>=REVERSA.windowStart && this.age<=REVERSA.windowEnd;}
  get doorOpen(){return this.phase===2 && this.clock<(this.doorUntil??0);}
  damageFactor(player){
    if(this.phase===1)return 1;
    if(['entry','board','dead'].includes(this.mode))return 0;
    if(player.x<this.truckX-170)return .08; // engine/front: nearly all blows are absorbed
    if(this.windowOpen)return 1;
    return this.doorOpen ? .7 : .12;
  }
  hitFeedback(player,damage,factor){
    if(this.phase!==2)return;
    this.flashUntil=this.clock+9;this.hitLabelUntil=this.clock+40;this.hitBlocked=factor<=.12;
    this.hitPoint={x:clamp(player.x+(this.scene.facing??1)*40,this.truckX-240,this.truckX+240),y:this.truckY-55};
    this.hitLabel.setText(`${this.hitBlocked?'BLINDADO · ':''}-${damage}`).setVisible(true);
    this.hitLabel.setColor?.(this.hitBlocked?'#ffcf69':'#86ffad');
    if(this.hitBlocked)this.scene.sfx?.play('metalCrack');
  }
  hurt(attack={}){
    const a=this.actor;
    if(a.hp<=0){this.defeat();return;}
    if(this.phaseCheck())return;
    if(this.mode==='entry' || this.mode==='board' || this.mode==='escape')return;
    if(this.phase===2){
      if(attack.reversaChip || this.clock<(this.hitReady??0))return;
      this.hitReady=this.clock+180;this.doorUntil=this.clock+REVERSA.doorFrames;this.set('open');this.say('¡PUERTA ABIERTA! · SIGUE GOLPEANDO EL COSTADO',REVERSA.doorFrames);return;
    }
    if(this.mode==='coffee'){
      this.runtime.potatoes.spill(a,{kind:'coffee'});this.healReady=this.clock+600;this.say('¡ME REGÓ EL TINTO!');
    }
    this.recent=(this.recent??[]).filter(t=>this.clock-t<120);this.recent.push(this.clock);
    if(this.recent.length>=3){this.recent=[];this.from={x:a.x,y:a.y};this.to={x:clamp(this.scene.player.x+(a.x<this.scene.player.x?180:-180),this.scene.floor.left+30,this.scene.floor.right-30),y:clamp(a.y+40,this.scene.floor.top,this.scene.floor.bottom)};
      this.set('escape');a.invulnerableUntil=this.scene.combatTime+700;this.say('¡DÉJEME MANIOBRAR!',45);
    }else this.set('stagger');
    a.tell.setVisible(false);this.model.transition('reversa');
  }
  slip(dir){
    if(this.phase!==1 || ['entry','exit','dead','board'].includes(this.mode))return false;
    this.set('fall');this.say('¡ESE PISO!',65);return true;
  }
  start(kind){
    if(this.phase===2){
      this.set(kind);
      if(kind==='reverse'){this.reverseStart=this.truckX;this.lastReverseBeep=-1;this.say('LUCES BLANCAS · TRES PITOS · ¡REVERSA!');}
      if(kind==='horn')this.say('¡TÁPESE LOS OÍDOS!');
      if(kind==='platform')this.say('¡PLATAFORMA ABAJO!');
      if(kind==='exhaust'){this.exhaustTarget={x:this.scene.player.x,y:this.scene.player.y};this.say('¡EXOSTO! · SAL DE LA MARCA');}
      if(kind==='eggs'){this.eggTarget={x:this.scene.player.x,y:this.scene.player.y};this.say('¡SALGA DEL PUESTO! · VENTANILLA ABIERTA');}
      return true;
    }
    this.face();this.set(kind);
    if(kind==='charge'){this.dir=this.actor.facing;this.chargeY=this.scene.player.y;this.say('¡POR LA 30!',90);}
    if(kind==='slam')this.say('¡CUIDADO CON EL COSTAL!',95);
    if(kind==='whistle')this.say('¡ESTIBADORES!',90);
    if(kind==='coffee')this.say('¡UN TINTICO! · INTERRUMPE LA CURACIÓN',150);
    return true;
  }
  hitPlayer(damage,knockdown=false){
    const s=this.scene;
    if(s.hitPlayer(Math.round(damage*(s.level.damage??1)),null,this.actor)){if(knockdown)this.runtime.player.hurt(true);return true;}return false;
  }
  stun(frames=45){
    const s=this.scene;if(s.combatTime<(s.invulnerableUntil??0) || s.health<=0 || this.runtime.diablitos?.holdsPlayer)return false;
    this.runtime.player.hurt();s.hurtUntil=s.combatTime+frames*ARCADE.clock.stepMs;this.runtime.clearInput();return true;
  }
  get rear(){return this.truckX+215;}
  get front(){return this.truckX-235;}
  foot(){
    const s=this.scene,a=this.actor,p=s.player;
    if(this.mode==='entry'){
      this.truckX=(s.floor.left-360)+(this.park.x-(s.floor.left-360))*Math.min(1,this.age/REVERSA.entry);
      if(this.age%60===0)s.sfx?.play('reverseBeep');
      if(this.age>=REVERSA.entry){this.set('exit');a.x=this.truckX-100;a.y=this.truckY+30;a.sprite.setVisible(true);a.shadow.setVisible(true);this.say('Mientras yo no termine, aquí no pasa ni el de la DIAN',240);}
      return;
    }
    if(this.mode==='exit'){this.pose(16);a.x-=1.2;if(this.age>65){a.invulnerableUntil=0;this.set('idle');}return;}
    if(this.mode==='stagger' || this.mode==='fall'){this.pose(this.mode==='fall'?22:20);if(this.age> (this.mode==='fall'?70:18))this.set('idle');return;}
    if(this.mode==='escape'){
      const t=Math.min(1,this.age/38);a.x=this.from.x+(this.to.x-this.from.x)*t;a.y=this.from.y+(this.to.y-this.from.y)*t;a.z=t===1?0:Math.sin(t*Math.PI)*50;this.pose(8);
      if(t===1){a.invulnerableUntil=0;this.set('idle');}return;
    }
    if(this.mode==='idle'){
      this.face();const dx=p.x-a.x,dy=p.y-a.y;
      if(this.age>55){
        if(a.hp<a.config.hp*.83 && this.clock>=(this.healReady??420)){this.healReady=this.clock+800;this.start('coffee');}
        else if(this.clock>=(this.whistleReady??250)){this.whistleReady=this.clock+400;this.start('whistle');}
        else this.start(Math.abs(dx)>170?'charge':'slam');
      }else {this.model.move(Math.abs(dx)>125?Math.sign(dx):0,Math.abs(dy)>12?Math.sign(dy):0,a.config.speed);this.pose(1+Math.floor(this.age/8)%3);}
      return;
    }
    if(this.mode==='slam'){
      this.pose(4+Math.min(3,Math.floor(this.age/30)));
      if(this.age===REVERSA.slamWindup){s.sfx?.play('stomp');this.runtime.combat.groundImpact?.(a);
        if(Math.abs(p.y-a.y)<32 && (p.x-a.x)*a.facing>=-15 && Math.abs(p.x-a.x)<150 && (p.z??0)<35)this.hitPlayer(28,true);}
      if(this.age>135)this.set('idle');return;
    }
    if(this.mode==='charge'){
      if(this.age<=REVERSA.chargeWindup){this.pose(8);this.fx.lineStyle(3,0xffb53b,.8).strokeRect(a.x+(this.dir>0?0:-320),this.chargeY-20,320,40);return;}
      this.pose(9+Math.floor(this.age/5)%2);const previous=a.x;
      a.x=clamp(a.x+this.dir*8.4,s.floor.left,s.floor.right);a.y+=clamp(this.chargeY-a.y,-2,2);
      if(!this.connected && p.x>=Math.min(previous,a.x)-42 && p.x<=Math.max(previous,a.x)+42 && Math.abs(p.y-a.y)<26 && (p.z??0)<35)this.connected=this.hitPlayer(24,true);
      if(a.x===previous || this.age>=105){
        this.set('crash');this.say('¡ME PEGUÉ CONTRA EL PUESTO! · ATACA',110);s.sfx?.play('metalCrack');this.runtime.combat.groundImpact?.(a);
      }return;
    }
    if(this.mode==='crash'){this.pose(11);if(this.age>=110)this.set('idle');return;}
    if(this.mode==='whistle'){
      this.pose(12+Math.floor(this.age/12)%2);
      if(this.age===50){s.sfx?.play('whistle');s.summonMinions(a,{enemy:'estibador',counts:[2],maxAlive:8,variants:1});}
      if(this.age>90)this.set('idle');return;
    }
    if(this.mode==='coffee'){
      this.pose(14+Math.floor(this.age/18)%2);a.x+=clamp((this.truckX-100)-a.x,-1.4,1.4);
      if(this.age===140){a.hp=Math.min(a.config.hp,a.hp+a.config.hp*.08);this.healReady=this.clock+800;s.sfx?.play('item');}
      if(this.age>165)this.set('idle');
    }
  }
  cab(){
    const s=this.scene,a=this.actor,p=s.player;
    if(this.mode==='board'){
      this.pose(16);a.x+=clamp(this.truckX-70-a.x,-4,4);a.y+=clamp(this.truckY+15-a.y,-2,2);
      if(this.age>90){a.sprite.setVisible(false);a.shadow.setVisible(false);a.healthBar.setVisible(false);a.invulnerableUntil=0;a.config={...a.config,hurtbox:{halfWidth:250,halfDepth:28}};this.set('cabIdle');}return;
    }
    a.x=this.truckX;a.y=this.truckY+32;a.z=0;a.sprite.setVisible(false);
    if(this.mode==='cabIdle' || this.mode==='open'){
      if(this.age> (this.mode==='open'?REVERSA.doorFrames:55)){
        const choices=['eggs','reverse','horn','platform','exhaust'];
        this.start(p.y<s.floor.top+25 || Math.abs(p.x-this.truckX)>310?'eggs':choices[this.turn++%choices.length]);
      }return;
    }
    if(this.mode==='reverse'){
      if(this.age<=REVERSA.reverseWindup){
        const beep=Math.min(2,Math.floor((this.age-1)/30));if(beep!==this.lastReverseBeep){this.lastReverseBeep=beep;s.sfx?.play('reverseBeep');}
        this.fx.fillStyle(0xfffbd7,Math.floor(this.age/8)%2?.8:.2).fillRect(this.rear-7,this.truckY-70,12,12);
        this.fx.lineStyle(3,0xffef91,.7).strokeRect(this.rear,this.truckY-5,130,64);
      }else if(this.age<=REVERSA.reverseWindup+REVERSA.reverseFrames){
        const previous=this.rear;this.truckX+=2.6;
        if(!this.connected && p.x>=previous-35 && p.x<=this.rear+38 && Math.abs(p.y-(this.truckY+25))<42 && (p.z??0)<55)this.connected=this.hitPlayer(34,true);
      }else {this.truckX+=clamp(this.park.x-this.truckX,-3,3);if(Math.abs(this.truckX-this.park.x)<2)this.set('cabIdle');}return;
    }
    if(this.mode==='horn'){
      this.fx.fillStyle(0xffd22b,.25).fillTriangle(this.front,this.truckY-20,this.front-135,this.truckY-65,this.front-135,this.truckY+60);
      if(this.age===REVERSA.hornWindup){s.sfx?.play('reversaHorn');if(p.x<this.front+25 && p.x>this.front-135 && Math.abs(p.y-this.truckY)<65)this.stun(55);}
      if(this.age>95)this.set('cabIdle');return;
    }
    if(this.mode==='platform'){
      const rear=this.rear;
      this.fx.lineStyle(3,0xff5369,.9).strokeRect(rear-35,this.truckY-5,120,65);
      if(this.age>=30 && this.age<REVERSA.platformWindup && (p.z??0)<30 && Math.abs(p.x-rear)<55 && Math.abs(p.y-(this.truckY+20))<32){p.z=24;this.onPlatform=true;}
      if(this.onPlatform && (Math.abs(p.x-rear)>=55 || Math.abs(p.y-(this.truckY+20))>=32)){p.z=0;this.onPlatform=false;}
      if(this.age===REVERSA.platformWindup){
        s.sfx?.play('stomp');if((p.z??0)<35 && Math.abs(p.x-rear)<65 && Math.abs(p.y-(this.truckY+20))<38){this.hitPlayer(this.onPlatform?38:24,true);p.z=0;}
        this.onPlatform=false;
      }
      if(this.age>110){if(this.onPlatform){p.z=0;this.onPlatform=false;}this.set('cabIdle');}return;
    }
    if(this.mode==='exhaust'){
      const t=this.exhaustTarget;this.fx.lineStyle(3,0x94be76,.8).strokeEllipse(t.x,t.y,130,50);
      if(this.age===60)this.clouds.push({...t,until:this.clock+240,next:this.clock,sprite:s.add.ellipse(t.x,t.y,130,50,0x668649,.65).setDepth(t.y-.5)});
      if(this.age>95)this.set('cabIdle');return;
    }
    if(this.mode==='eggs'){
      if(this.age===60){const t=this.eggTarget,from={x:this.truckX+15,y:this.truckY-165};this.eggs.push({from,...t,age:0,sprite:s.add.image(from.x,from.y,'reversa-eggs').setDisplaySize(42,28).setDepth(700)});s.sfx?.play('wave');}
      if(this.age>REVERSA.eggEnd)this.set('cabIdle');
    }
  }
  hazards(){
    const s=this.scene,p=s.player;
    this.eggs=this.eggs.filter(e=>{
      const t=Math.min(1,++e.age/55);e.sprite.setPosition(e.from.x+(e.x-e.from.x)*t,e.from.y+(e.y-e.from.y)*t-Math.sin(t*Math.PI)*85);
      if(t<1)return true;e.sprite.destroy();
      if(Math.abs(p.x-e.x)<80 && Math.abs(p.y-e.y)<32 && (p.z??0)<35)this.stun(42);
      this.runtime.potatoes.spill({x:e.x,y:e.y},{kind:'egg'});s.sfx?.play('stomp');return false;
    });
    this.clouds=this.clouds.filter(c=>{
      if(this.clock>=c.until){c.sprite.destroy();return false;}
      c.sprite.setAlpha?.(.65*Math.min(1,(c.until-this.clock)/50));
      if(this.clock>=c.next && Math.abs(p.x-c.x)<65 && Math.abs(p.y-c.y)<25 && (p.z??0)<30){c.next=this.clock+45;this.hitPlayer(4);}return true;
    });
  }
  resolveMovement(previous){
    if(this.mode==='entry' || this.mode==='dead')return;
    const p=this.scene.player,left=this.truckX-235,right=this.truckX+225,top=this.truckY-42,bottom=this.truckY+8;
    if(p.x<left-18 || p.x>right+18 || p.y<top-10 || p.y>bottom+10)return;
    if(previous.y>=bottom+10)p.y=bottom+11;
    else if(previous.x<left-18)p.x=left-19;
    else if(previous.x>right+18)p.x=right+19;
    else p.y=bottom+11;
  }
  render(){
    const phase2=this.phase===2 && this.mode!=='board';
    const frame=this.mode==='dead'?5:this.windowOpen?2:this.mode==='platform' && this.age>30?3:this.mode==='reverse'?4:this.mode==='board'||this.doorOpen?1:0;
    const flash=this.mode!=='dead' && this.clock<(this.flashUntil??0),shake=flash?(this.clock%2?2:-2):0;
    this.truck.setTexture(`reversa-truck-${frame}`).setPosition(this.truckX+shake,this.truckY).setDepth(this.truckY);
    if(flash)this.truck.setTint?.(this.hitBlocked?0xffd493:0xff9999);else this.truck.clearTint?.();
    const active=phase2 && this.mode!=='dead';
    this.guide.setVisible(active);
    if(active){
      const open=this.windowOpen || this.doorOpen;
      this.guide.setText(open?'¡AHORA! · ACÉRCATE AL COSTADO VERDE Y GOLPEA':'MOTOR BLINDADO · ESPERA LA VENTANILLA O LA PUERTA VERDE');
      this.guide.setColor?.(open?'#86ffad':'#ffcf69');
      if(open){
        const pulse=.65+Math.sin(this.clock*.2)*.2;
        this.fx.lineStyle(3,0x65ff99,pulse).strokeRect(this.truckX-22,this.truckY-195,76,82);
        this.fx.fillStyle(0x65ff99,.25).fillRect(this.truckX-70,this.truckY+20,140,20);
        this.fx.lineStyle(3,0x65ff99,pulse).strokeRect(this.truckX-70,this.truckY+20,140,20);
      }
    }
    const showHit=active && this.clock<(this.hitLabelUntil??0);
    this.hitLabel.setVisible(showHit);
    if(showHit)this.hitLabel.setPosition(this.hitPoint.x,this.hitPoint.y-20-(40-this.hitLabelUntil+this.clock)*.5);
    if(flash && this.hitPoint){const p=this.hitPoint;this.fx.fillStyle(this.hitBlocked?0xffcd78:0xffffff,.9).fillRect(p.x-12,p.y-2,24,4).fillRect(p.x-2,p.y-12,4,24);}
    this.crew.forEach((sprite,i)=>sprite.setPosition(this.truckX+150+i*42,this.truckY-85).setDepth(this.truckY-1).setVisible(this.mode!=='dead' && !phase2));
    if(this.clock>(this.dialogUntil??0))this.dialog.setVisible(false);
  }
  step(){
    this.clock++;this.age++;this.fx.clear().setDepth(800);
    if(this.mode==='dead'){this.render();return;}
    if(this.phaseCheck())this.model.age=0;
    if(this.phase===1)this.foot();else this.cab();this.hazards();this.render();
  }
  defeat(){
    if(this.mode==='dead')return;this.set('dead');this.actor.sprite.setVisible(false);this.actor.shadow.setVisible(false);
    this.say('El flete quedó cancelado.',300);this.scene.sfx?.play('reversaHornDie');this.clearHazards();this.render();
  }
  clearHazards(){for(const h of [...this.eggs,...this.clouds])h.sprite.destroy();this.eggs=[];this.clouds=[];if(this.onPlatform){this.scene.player.z=0;this.onPlatform=false;}this.fx.clear();}
  destroy(){this.clearHazards();this.truck.destroy();this.dialog.destroy();this.guide.destroy();this.hitLabel.destroy();this.fx.destroy();for(const sprite of this.crew)sprite.destroy();}
}
