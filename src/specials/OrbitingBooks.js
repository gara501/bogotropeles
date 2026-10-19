import { BOOKS, positionBook, blastRadius, blastReaches } from '../data/books.js';
import { canSpendSpecialEnergy, spendSpecialEnergy } from '../combat/specialEnergy.js';

/** Student's special: a one-second book explosion. The books burst outward from where she casts,
 * with a ground shock ring; every enemy (or can) the blast front reaches is hit once. */
export class OrbitingBooks {
  constructor(scene,balance=BOOKS) {
    this.scene=scene;this.balance=balance;this.activeUntil=0;this.angle=0;this.startedAt=0;this.center={x:0,y:0};
    this.struck=new Set();this.hitAttack={...balance.attack};this.shock=[];
    this.books=Array.from({length:balance.count},(_,index)=>({x:0,y:0,
      sprite:scene.add.image(0,0,`orbit-book-${index%balance.colors.length}`).setVisible(false)}));
    this.label=scene.add.text(260,65,'',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'10px',color:'#d6ed64'}).setDepth(1000);this.label.setScrollFactor?.(0);
    this.onFrame=(animation,frame)=>{
      if(animation.key==='student-books' && Number(frame.textureFrame)===balance.summonFrame)this.summon(scene.playerAttack);
    };
    scene.player.sprite.on('animationupdate',this.onFrame);
    this.updateHud();
  }
  get active(){return this.activeUntil>this.scene.combatTime;}
  get radius(){return blastRadius(this.scene.combatTime-this.startedAt,this.balance);}
  start() {
    const s=this.scene,now=s.combatTime;
    if(!canSpendSpecialEnergy(s) || s.finished || s.paused || this.active || now<s.specialReadyAt ||
      s.playerAttack || now<s.hurtUntil || now<s.dashUntil || now-s.jumpStart<650)return false;
    s.playerAttack={...s.character.attacks.books,type:'books',start:now,facing:s.facing,hit:false,summoned:false};
    s.play(s.player,'books',s.playerAttack.duration);return true;
  }
  summon(attack) {
    const s=this.scene;
    if(!attack || attack!==s.playerAttack || attack.type!=='books' || attack.summoned ||
      this.active || s.health<=0 || s.finished || s.paused || s.combatTime<s.hurtUntil || s.combatTime<s.dashUntil)return false;
    if(!spendSpecialEnergy(s))return false;
    attack.summoned=true;attack.hit=true;
    s.sfx?.play('spell');
    this.startedAt=s.combatTime;this.activeUntil=s.combatTime+this.balance.activeMs;
    s.specialReadyAt=s.combatTime+this.balance.cooldownMs;
    this.center={x:s.player.x,y:s.player.y};this.angle=0;this.struck.clear();
    this.createShock();this.placeBooks();this.blast();s.cameras?.main?.shake?.(140,.004);this.updateHud();return true;
  }
  createShock() {
    const s=this.scene,b=this.balance,{x,y}=this.center;this.destroyShock();
    if(s.add.ellipse){
      const ring=s.add.ellipse(x,y,200,200*b.perspective,b.shock.color,.22);ring.setStrokeStyle?.(5,b.shock.color,1);ring.setDepth?.(2);
      this.shock.push(ring);
    }
    if(s.add.circle)this.shock.push(s.add.circle(x,y-b.flightHeight,30,b.shock.flash,.9).setDepth(y+5));
  }
  destroyShock(){for(const part of this.shock)part.destroy();this.shock=[];}
  placeBooks() {
    const s=this.scene,b=this.balance,r=this.radius,t=(s.combatTime-this.startedAt)/b.activeMs;
    for(let i=0;i<this.books.length;i++) {
      const book=this.books[i],angle=this.angle+i*Math.PI*2/b.count;
      positionBook(book,this.center,angle,r,b);
      book.sprite.setVisible(true).setPosition(book.x,book.y-b.flightHeight)
        .setDepth(book.y+1).setRotation(angle*2).setAlpha(t<.7?1:Math.max(0,(1-t)/.3));
    }
    const [ring,flash]=this.shock;
    ring?.setScale(r/100);ring?.setAlpha(Math.max(0,1-t));
    flash?.setScale(1+t*6);flash?.setAlpha(Math.max(0,1-t*4));
  }
  /** Hits, once each, every target the blast front has reached. */
  blast() {
    const s=this.scene,b=this.balance,r=this.radius;
    const reach=target=>!this.struck.has(target) && blastReaches(this.center,target,r,b);
    for(const can of s.energyPickups?.cans??[])if(can.hp>0 && reach(can)){this.struck.add(can);s.energyPickups.hit(can);}
    for(const enemy of s.enemies)if(this.canHit(enemy) && reach(enemy)){this.struck.add(enemy);this.strike(enemy);}
    if(s.boss && this.canHit(s.boss) && reach(s.boss)){this.struck.add(s.boss);this.strike(s.boss,true);}
  }
  canHit(target) {
    const s=this.scene;
    return !(target.hp<=0 || target.dead || target.ended || target.team==='player' ||
      (target.team!==undefined && target.team===s.player.team) ||
      s.combatTime<(target.invulnerableUntil??0) || target.invulnerable || target.shielded);
  }
  strike(target,boss=false) {
    const s=this.scene;
    const b=this.balance,isBoss=boss || target.config?.boss;
    const damage=isBoss?Math.max(b.attack.damage,b.bossDamage??0):Math.max(b.attack.damage,Math.ceil((target.config?.hp??0)*(b.enemyShare??0)));
    const attack={...this.hitAttack,damage,range:b.blastRadius,facing:Math.sign(target.x-this.center.x)||s.facing};
    // BossController owns its entry/transition/umbrella/Vuelva mañana protections.
    if(boss)target.hit(attack,this.center);else s.hitEnemy(target,attack);
  }
  update(dt) {
    const s=this.scene;
    if(s.health<=0){this.clear();this.updateHud();return;}
    if(s.paused || s.finished)return;
    if(this.active) {
      this.angle=(this.angle+dt*Math.PI*2*1000/this.balance.periodMs)%(Math.PI*2);
      this.placeBooks();this.blast();
    } else if(this.activeUntil)this.clear();
    this.updateHud();
  }
  updateHud() {
    const s=this.scene,remaining=Math.max(0,s.specialReadyAt-s.combatTime);
    const text=this.active?`K / EXPLOSIÓN ${((this.activeUntil-s.combatTime)/1000).toFixed(1)} s`
      :!canSpendSpecialEnergy(s)?'K / LIBROS SIN ENERGÍA':remaining?`K / LIBROS RECARGA ${(remaining/1000).toFixed(1)} s`:'K / LIBROS LISTOS · -10 ENERGÍA';
    if(text!==this.label.text)this.label.setText(text).setColor(this.active||!remaining?'#d6ed64':'#aebeb1');
  }
  clear() {this.activeUntil=0;this.struck.clear();this.destroyShock();for(const book of this.books)book.sprite.setVisible(false);}
  destroy() {
    this.scene.player.sprite.off('animationupdate',this.onFrame);
    this.struck.clear();this.activeUntil=0;this.destroyShock();
    for(const book of this.books)book.sprite.destroy();this.books.length=0;this.label.destroy();
  }
}

// Provisional clean covers, generated once and shared across scene restarts.
export function prepareBookTextures(scene) {
  BOOKS.colors.forEach((color,index)=>{
    const key=`orbit-book-${index}`;if(scene.textures.exists(key))return;
    const texture=scene.textures.createCanvas(key,22,28),c=texture.context;
    c.fillStyle='#172d36';c.fillRect(1,1,19,26);
    c.fillStyle='#eee8cc';c.fillRect(5,4,15,21);
    c.fillStyle='#a49d83';c.fillRect(6,9,13,1);c.fillRect(6,19,13,1);
    c.fillStyle=color;c.fillRect(2,2,15,23);
    c.fillStyle='#ffffff55';c.fillRect(4,3,1,21);c.fillRect(7,7,7,1);c.fillRect(8,10,5,1);
    texture.refresh();
  });
}
