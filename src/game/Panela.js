import {ARCADE} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';
import {PANELA,panelaAttack,panelaTouches} from './panelaRules.js';

export const PANELA_TEXTURE='item-panela';
/** One throwable per pickup. Armed body art releases the projectile on its empty-hand pose. */
export class Panela {
  constructor(scene,random=Math.random){
    this.scene=scene;this.random=random;this.remaining=0;this.items=[];this.rolled=new Set();this.shots=[];this.bursts=[];
    this.held=scene.add.image(0,0,scene.characterKey,scene.character.idle).setOrigin(.5,1).setVisible(false);
    this.label=scene.add.text(372,69,'H LANZAR PANELA · DAÑO ×2',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'11px',color:'#ffe14d',stroke:'#14282c',strokeThickness:2})
      .setDepth(1003).setScrollFactor(0).setVisible(false);
  }
  spawn(x,y){
    const item={x,y,graphic:this.scene.add.graphics(),sprite:this.scene.add.image(x,y-12,PANELA_TEXTURE,'whole').setDisplaySize(20,14).setDepth(y+1)};
    this.items.push(item);return item;
  }
  equip(){this.remaining=1;this.scene.sfx?.play('item');}
  attack(data){return this.remaining && data.type==='punch'?panelaAttack(data,this.scene.character):data;}
  commit(action){
    if(action.data.weapon!=='panela' || action.weaponUsed)return;
    action.weaponUsed=true;action.sounded=true;this.remaining=0;
    const s=this.scene,p=s.player,facing=s.playerAttack?.facing??s.facing,x=p.x+facing*30;
    this.shots.push({x,y:p.y,lift:s.character.height*.55,facing,age:0,damage:action.data.damage,
      sprite:s.add.image(x,p.y-s.character.height*.55,PANELA_TEXTURE,'whole').setDisplaySize(30,20).setDepth(p.y+1)});
    s.sfx?.play('wave');
  }
  shatter(shot,frame){
    shot.sprite.destroy();
    this.bursts.push({born:frame,sprite:this.scene.add.image(shot.x,shot.y-shot.lift,PANELA_TEXTURE,'crack').setDisplaySize(64,64).setDepth(shot.y+3)});
    this.scene.sfx?.play('metalCrack');
  }
  clearHeld(){this.remaining=0;this.held.setVisible(false);this.label.setVisible(false);this.scene.player.sprite.setVisible(true);}
  clearFlights(){for(const p of [...this.shots,...this.bursts])p.sprite.destroy();this.shots=[];this.bursts=[];}
  update(frame){
    const s=this.scene,p=s.player,model=s.arcade.player;
    if(s.paused || s.cinematic)return;
    if(s.health<=0 || s.finished){this.clearHeld();this.clearFlights();return;}
    const arena=s.waves?.arena??0;
    if(!this.rolled.has(arena) && (!s.stage || s.stage.reached(arena))){
      this.rolled.add(arena);
      if(arena===0 || this.random()<PANELA.spawnChance)this.spawn((s.stage?.arenaScroll(arena)??0)+ARCADE.screen.width*.62,(s.floor.top+s.floor.bottom)/2);
    }
    this.items=this.items.filter(item=>{
      item.graphic.clear().setDepth(item.y).fillStyle(0x080d14,.35).fillEllipse(item.x,item.y,26,7)
        .lineStyle(1,0xffdf65,.65).strokeEllipse(item.x,item.y-4,32,12);
      item.sprite.setPosition(item.x,item.y-16+Math.sin(frame/12)*2);
      if(this.remaining || model.action || model.state!=='walk' || (p.z??0)>8 || Math.abs(p.x-item.x)>28 || Math.abs(p.y-item.y)>20)return true;
      this.equip();item.graphic.destroy();item.sprite.destroy();return false;
    });
    this.shots=this.shots.filter(shot=>{
      const previous=shot.x;shot.x+=shot.facing*PANELA.speed/ARCADE.clock.fps;shot.age++;
      const target=s.enemies.filter(e=>panelaTouches(previous,shot.x,shot,e)).sort((a,b)=>(a.x-b.x)*shot.facing)[0];
      if(target){
        shot.x=Math.max(Math.min(previous,shot.x),Math.min(Math.max(previous,shot.x),target.x));
        const attack={type:'panela',damage:shot.damage,facing:shot.facing,knockback:18,stun:300,finisher:false};
        const hp=target.hp;s.hitEnemy(target,attack);
        if(target.hp<hp)s.arcade.combat.impact(s.player,target,attack);
        this.shatter(shot,frame);return false;
      }
      shot.sprite.setPosition(shot.x,shot.y-shot.lift).setRotation(shot.age*shot.facing*.2);
      const left=viewLeft(s);
      if(shot.age>=PANELA.lifetime || shot.x<left-60 || shot.x>left+ARCADE.screen.width+60){this.shatter(shot,frame);return false;}
      return true;
    });
    this.bursts=this.bursts.filter(b=>{
      const age=frame-b.born;if(age>=PANELA.breakFrames){b.sprite.destroy();return false;}
      b.sprite.setTexture(PANELA_TEXTURE,['crack','break1','break2','crumbs'][Math.min(3,Math.floor(age/6))]).setAlpha(age<18?1:(25-age)/7);return true;
    });
    this.label.setVisible(Boolean(this.remaining));
  }
  render(){
    const s=this.scene,p=s.player,model=s.arcade.player,action=model.action,throwing=action?.data.weapon==='panela';
    const key=`${s.characterKey}-panela`,armed=s.health>0 && !s.finished && !s.arcade.diablitos?.holdsPlayer
      && (this.remaining || throwing) && (model.state==='walk' || throwing) && s.textures.exists(key);
    p.sprite.setVisible(!armed);this.held.setVisible(Boolean(armed));if(!armed)return;
    const walking=s.arcade.input?.dx || s.arcade.input?.dy;
    const pose=throwing?action.displayedFrame.weaponPose:walking?1+Math.floor(model.age/ARCADE.animation.walkFramesPerPose)%4:0;
    const scale=s.character.height/s.textures.get(key).referenceHeight;
    this.held.setTexture(key,pose).setScale(scale).setFlipX(s.facing<0).setAlpha(p.sprite.alpha)
      .setPosition(p.sprite.x,p.y-(p.z??0)+4*scale).setDepth(p.y);
  }
  destroy(){this.clearHeld();this.clearFlights();for(const item of this.items){item.graphic.destroy();item.sprite.destroy();}this.items=[];this.held.destroy();this.label.destroy();}
}
