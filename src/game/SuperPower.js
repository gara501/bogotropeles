import {ARCADE} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';

export const SUPER={hits:20,release:30,duration:66,fall:22,lie:46,getup:18};
export const SUPER_COLORS={office:0xffd166,student:0xb899ff,teleperforman:0x68efff,gymbro:0xff914d,magolita:0x6affcb};
export class SuperPower {
  constructor(scene){
    this.scene=scene;this.charge=0;this.active=false;
    this.held=scene.add.image(0,0,scene.characterKey,scene.character.idle).setOrigin(.5,1).setVisible(false);
    this.fx=scene.add.graphics().setScrollFactor(0).setDepth(990);
    this.label=scene.add.text(18,84,'',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'11px',color:'#85faff',stroke:'#142127',strokeThickness:3}).setScrollFactor(0).setDepth(1003);
    this.bar=scene.add.rectangle(18,102,180,4,0x78e9ff).setOrigin(0).setScrollFactor(0).setDepth(1003);
    this.showCharge();
  }
  get ready(){return this.charge>=SUPER.hits;}
  onHit(attack){if(!attack?.super && !this.active){this.charge=Math.min(SUPER.hits,this.charge+1);this.showCharge();}}
  showCharge(){
    this.label.setText(this.ready?'Q · ¡SUPER LISTO!':`SUPER ${this.charge}/${SUPER.hits}`);
    this.bar.width=180*this.charge/SUPER.hits;this.scene.game?.touchControls?.setSuperReady?.(this.ready);
  }
  activate(){
    const s=this.scene,p=s.arcade.player;
    if(!this.ready || this.active || s.paused || s.cinematic || s.finished || s.health<=0 || p.state!=='walk' || p.captor || (s.player.z??0)>0 || s.arcade.diablitos?.holdsPlayer)return false;
    this.charge=0;this.active=true;this.age=0;this.released=false;this.showCharge();
    p.transition('special');p.action=null;s.playerAttack=null;s.arcade.clearInput();
    s.invulnerableUntil=Math.max(s.invulnerableUntil,s.combatTime+(SUPER.duration+8)*ARCADE.clock.stepMs);
    return true;
  }
  release(){
    if(this.released)return;
    const s=this.scene,left=viewLeft(s),color=SUPER_COLORS[s.characterKey]??0x81f8ff;this.released=true;
    s.fx?.superBlast?.(this,s.player.x,s.player.y-s.character.height*.5,s.player.y+110,color);
    for(const enemy of [...s.enemies]){
      if(enemy.hp<=0 || enemy.arriving || enemy.x<left || enemy.x>left+ARCADE.screen.width)continue;
      const damage=Math.ceil(enemy.hp/2);
      s.hitEnemy(enemy,{super:true,type:'super',damage,knockback:0,facing:Math.sign(enemy.x-s.player.x)||s.facing,knockdown:true,finisher:true,stun:1200});
    }
    if(s.boss && !s.boss.dead && s.boss.actor.x>=left && s.boss.actor.x<=left+ARCADE.screen.width)s.boss.superHit();
    s.cameras?.main?.flash?.(140,color>>16&255,color>>8&255,color&255);s.cameras?.main?.shake?.(240,.009);s.sfx?.play('special');
  }
  update(){
    const s=this.scene;if(!this.active || s.paused || s.cinematic)return;
    if(s.health<=0 || s.finished){this.reset();return;}
    this.age++;
    if(this.age<SUPER.release)s.fx?.superCharge?.(this,s.player.x,s.player.y-s.character.height*.5,s.player.y+110,this.age,SUPER.release,SUPER_COLORS[s.characterKey]??0x81f8ff);
    if(this.age===SUPER.release)this.release();
    if(this.age>=SUPER.duration){this.active=false;this.held.setVisible(false);this.fx.clear();s.fx?.clearSuper?.(this);s.player.sprite.setVisible(true);if(s.arcade.player.state==='special')s.arcade.player.transition('walk');}
  }
  render(){
    if(!this.active)return;
    const s=this.scene,p=s.player,key=`${s.characterKey}-super`;
    if(s.textures.exists(key)){
      const pose=this.age<10?0:this.age<20?1:this.age<SUPER.release?2:this.age<42?3:this.age<55?4:5;
      p.sprite.setVisible(false);const scale=s.character.height/s.textures.get(key).referenceHeight;
      this.held.setVisible(true).setTexture(key,pose).setScale(scale).setFlipX(s.facing<0)
        .setPosition(p.x,p.y+4*scale).setDepth(p.y+1);
    }
    const fx=this.fx.clear(),x=p.x-viewLeft(s),y=p.y-s.character.height*.5,color=SUPER_COLORS[s.characterKey]??0x81f8ff;
    if(this.age<SUPER.release){
      const t=this.age/SUPER.release;fx.lineStyle(3,color,.8).strokeCircle(x,y,70*(1-t)+12);
    }else{
      const t=(this.age-SUPER.release)/(SUPER.duration-SUPER.release);
      fx.fillStyle(color,(1-t)*.12).fillRect(0,0,960,540);
      fx.lineStyle(8,color,1-t).strokeCircle(x,y,40+t*1100);
    }
  }
  reset(){this.charge=0;this.active=false;this.held.setVisible(false);this.fx.clear();this.scene.fx?.clearSuper?.(this);this.scene.player.sprite.setVisible(true);this.showCharge();}
  destroy(){this.reset();this.held.destroy();this.label.destroy();this.bar.destroy();this.fx.destroy();}
}
