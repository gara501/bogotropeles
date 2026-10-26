import {ARCADE} from '../data/arcade.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const STEP=1/ARCADE.clock.fps;
export const DIABLITO={speed:560,distance:390,windup:42,recovery:156,carry:170,throwFrames:22,
  damage:22,playerDamage:42,pickupDelay:30,reach:110,depth:22,offset:96};
const busy=new Set(['hurt','down','grabbed','thrown','evade','phaseChange','shield']);

/** A cart is a shared world object. Its current pusher can be any grounded regular fighter. */
export class Diablitos {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.carts=[];this.seen=new WeakSet();this.recovering=new Map();}
  get holdsPlayer(){return Boolean(this.captured || this.carts.some(c=>c.owner===this.scene.player));}
  add(owner){
    const s=this.scene,dir=owner.facing??-1;
    const sprite=s.add.image(owner.x+dir*DIABLITO.offset,owner.y,'diablito-cart').setOrigin(.5,1).setDisplaySize(154,83);
    const label=s.add.text(0,0,'',{fontFamily:'monospace',fontSize:'13px',color:'#ffe277',stroke:'#142127',strokeThickness:3}).setOrigin(.5);
    const cart={owner,x:owner.x+dir*DIABLITO.offset,y:owner.y,dir,sprite,label,phase:'align',age:0,remaining:DIABLITO.distance,hits:new Set()};
    this.carts.push(cart);this.seen.add(owner);return cart;
  }
  model(actor){return actor===this.scene.player?this.runtime.player:this.runtime.enemies.get(actor);}
  eligible(actor){
    if(actor!==this.scene.player && (actor.hp<=0 || actor.config.boss || actor.crossing || actor.arriving || actor.config.minion))return false;
    const model=this.model(actor);
    return Boolean(model) && ['walk','approach','circle'].includes(model.state) && (actor.z??0)===0 &&
      !this.runtime.combat.frozen(actor) && !this.recovering.has(actor) && !this.carts.some(c=>c.owner===actor);
  }
  claim(cart,actor){
    if(cart.owner || cart.phase!=='stuck' || cart.age<DIABLITO.pickupDelay || !this.eligible(actor))return false;
    cart.owner=actor;cart.phase=actor===this.scene.player?'windup':'align';cart.age=0;
    cart.dir=actor===this.scene.player?this.scene.facing:Math.sign(this.scene.player.x-actor.x)||1;
    actor.x=clamp(cart.x-cart.dir*DIABLITO.offset,this.scene.floor.left,this.scene.floor.right);actor.y=cart.y;
    cart.hits.clear();cart.remaining=DIABLITO.distance;
    const model=this.model(actor);model.action=null;actor.pending=null;
    this.runtime.combat.tokens.release(actor);
    if(actor===this.scene.player){model.buffer.clear();this.scene.playerAttack=null;}
    this.scene.sfx?.play('metalCrack');return true;
  }
  tryPlayerUse(){
    const p=this.scene.player;
    if(!this.eligible(p))return false;
    const cart=this.carts.find(c=>!c.owner && c.phase==='stuck' && Math.abs(c.x-p.x)<=DIABLITO.reach && Math.abs(c.y-p.y)<=DIABLITO.depth);
    return cart?this.claim(cart,p):false;
  }
  controls(actor){
    if(this.carts.some(c=>c.owner===actor))return true;
    return this.recovering.has(actor) && !busy.has(this.model(actor)?.state);
  }
  pose(actor,state,age){
    const model=this.model(actor);if(!model)return;
    if(actor===this.scene.player){
      const poses=this.scene.character?.grab?.hold;
      if(poses?.length)actor.sprite.stop().setFrame(poses[Math.floor(age/6)%poses.length]);else model.pose('walk',age);
      return;
    }
    const art=actor.config.animations;
    const frames=art[state]??art.walk??[actor.config.idle];
    actor.sprite.stop().setFrame(frames[Math.floor(age/6)%frames.length]);
  }
  park(cart,recovery=true){
    const owner=cart.owner;
    if(this.captured?.cart===cart)this.cancelPlayer();
    if(owner && owner!==this.scene.player){
      owner.tell?.setVisible(false);
      if(recovery && owner.hp>0)this.recovering.set(owner,DIABLITO.recovery);
    }
    cart.owner=null;cart.phase='stuck';cart.age=0;cart.hits.clear();
    cart.x=clamp(cart.x,this.scene.floor.left+18,this.scene.floor.right-18);
    this.scene.sfx?.play('metalCrack');
    if(owner===this.scene.player)this.runtime.player.buffer.clear();
  }
  cancelPlayer(){
    if(!this.captured)return;
    const s=this.scene;this.captured=null;s.player.z=0;s.jumpHeight=0;
    s.invulnerableUntil=s.combatTime+500;this.runtime.player.buffer.clear();
  }
  catchPlayer(cart){
    const s=this.scene,p=s.player;
    if(this.captured || s.health<=0 || s.combatTime<s.invulnerableUntil || s.combatTime<s.respawnProtectedUntil || (p.z??0)>30)return false;
    this.runtime.player.hurt();this.runtime.clearInput();
    s.invulnerableUntil=s.combatTime+3000;
    cart.phase='carry';cart.age=0;cart.remaining=DIABLITO.carry;
    this.captured={cart,phase:'carry',age:0};s.sfx?.play('bar');return true;
  }
  throwPlayer(cart){
    const s=this.scene,p=s.player;
    this.captured={cart,phase:'throw',age:0,from:{x:p.x,y:p.y},
      to:{x:clamp(p.x+cart.dir*65,s.floor.left,s.floor.right),y:s.floor.top+5}};
    cart.phase='throw';cart.age=0;
  }
  updateCaptured(){
    const held=this.captured;if(!held)return;
    const s=this.scene,p=s.player,cart=held.cart;
    if(!cart.owner || cart.owner.hp<=0 || s.health<=0){this.cancelPlayer();return;}
    this.runtime.player.buffer.clear();this.runtime.player.pose('hurt',0);
    if(held.phase==='carry'){p.x=clamp(cart.x+cart.dir*18,s.floor.left,s.floor.right);p.y=cart.y;p.z=24;return;}
    const t=Math.min(1,++held.age/DIABLITO.throwFrames);
    p.x=held.from.x+(held.to.x-held.from.x)*t;p.y=held.from.y+(held.to.y-held.from.y)*t;p.z=Math.sin(t*Math.PI)*48;
    if(t<1)return;
    this.captured=null;p.z=0;s.jumpHeight=0;s.invulnerableUntil=s.combatTime;
    s.hitPlayer(Math.round(DIABLITO.damage*(s.level.damage??1)),null,cart.owner);
    if(s.health>0)this.runtime.player.hurt(true);
    s.sfx?.play('stomp');s.cameras?.main?.shake(120,.004);
    this.impact(p.x,p.y);this.park(cart);
  }
  impact(x,y){
    const s=this.scene;
    for(let i=0;i<7;i++){
      const chip=s.add.rectangle(x,y-8,7,4,i%2?0xc39862:0xf4b246).setDepth(y+5);
      s.tweens.add({targets:chip,x:x+(i-3)*11,y:y-20-Math.random()*22,angle:i*65,alpha:0,duration:450,onComplete:()=>chip.destroy()});
    }
  }
  update(){
    const s=this.scene;
    for(const actor of s.enemies)if(actor.config.diablito && actor.hp>0 && !this.seen.has(actor))this.add(actor);
    for(const [actor,left] of this.recovering){
      if(left<=1 || actor.hp<=0){this.recovering.delete(actor);continue;}
      this.recovering.set(actor,left-1);
      if(!busy.has(this.model(actor)?.state))this.pose(actor,'recoverCart',DIABLITO.recovery-left);
    }
    for(const cart of this.carts){
      cart.age++;
      const a=cart.owner,model=a && this.model(a);
      if(a && (a!==s.player && a.hp<=0 || busy.has(model?.state) && this.captured?.cart!==cart))this.park(cart,false);
      if(cart.owner){
        const actor=cart.owner,player=actor===s.player;
        if(cart.phase==='align'){
          const dy=s.player.y-actor.y,dx=s.player.x-actor.x;
          cart.dir=Math.sign(dx)||cart.dir;
          if(Math.abs(dy)>8)actor.y=clamp(actor.y+Math.sign(dy)*actor.config.speed*STEP*.6,s.floor.top,s.floor.bottom);
          else {cart.phase='windup';cart.age=0;actor.tell?.setText('¡DIABLITO!').setVisible(true);}
        }else if(cart.phase==='windup' && cart.age>=DIABLITO.windup){
          cart.phase='rush';cart.age=0;actor.tell?.setVisible(false);s.sfx?.play('running');
        }else if(cart.phase==='rush' || cart.phase==='carry'){
          const previous=cart.x,from=actor.x;
          actor.x=clamp(actor.x+cart.dir*DIABLITO.speed*STEP,s.floor.left,s.floor.right);
          cart.remaining-=Math.abs(actor.x-from);cart.x=actor.x+cart.dir*DIABLITO.offset;cart.y=actor.y;
          if(cart.phase==='rush'){
            if(player){
              for(const enemy of s.enemies)if(enemy.hp>0 && !cart.hits.has(enemy) && this.touches(previous,cart,enemy)){
                cart.hits.add(enemy);s.hitEnemy(enemy,{damage:DIABLITO.playerDamage,knockback:35,facing:cart.dir,finisher:true,knockdown:true});
              }
            }else if(this.touches(previous,cart,s.player))this.catchPlayer(cart);
          }
          if(cart.remaining<=0 || Math.abs(actor.x-from)<.01){
            if(cart.phase==='carry')this.throwPlayer(cart);else this.park(cart);
          }
        }
        if(cart.owner){
          actor.facing=cart.dir;if(player)s.facing=cart.dir;
          actor.sprite.setFlipX(cart.dir<0);
          this.pose(actor,cart.phase==='rush'||cart.phase==='carry'?'push':'cartWalk',cart.age);
          cart.x=actor.x+cart.dir*DIABLITO.offset;cart.y=actor.y;
        }
      }
      if(!cart.owner){
        if(cart.age>=DIABLITO.pickupDelay){
          const candidates=s.enemies.filter(a=>this.eligible(a) && Math.abs(a.x-cart.x)<=DIABLITO.reach && Math.abs(a.y-cart.y)<=DIABLITO.depth);
          candidates.sort((a,b)=>Math.abs(a.x-cart.x)-Math.abs(b.x-cart.x));
          if(candidates[0])this.claim(cart,candidates[0]);
        }
      }
      cart.sprite.setPosition(cart.x,cart.y).setFlipX(cart.dir<0).setDepth(cart.y+1).setRotation(cart.owner?0:cart.dir*.1);
      cart.label.setPosition(cart.x,cart.y-108).setDepth(cart.y+3).setText(cart.owner?'':cart.age<DIABLITO.pickupDelay?'¡CLAVADO!':'H · EMPUJAR').setVisible(!cart.owner);
    }
    this.updateCaptured();
  }
  touches(previous,cart,actor){return (actor.z??0)<30 && Math.abs(actor.y-cart.y)<DIABLITO.depth &&
    actor.x>=Math.min(previous,cart.x)-38 && actor.x<=Math.max(previous,cart.x)+38;}
  clear(){this.cancelPlayer();for(const c of this.carts){c.owner?.tell?.setVisible(false);c.sprite.destroy();c.label.destroy();}this.carts=[];this.recovering.clear();}
}
