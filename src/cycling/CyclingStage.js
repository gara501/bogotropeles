import Phaser from 'phaser';
import {CYCLING,CyclingRun,OBSTACLES,GUARDIAN,CYCLING_DASH} from './CyclingRun.js';
import {prepareCycling} from '../data/cycling.js';
import {fitArcadeCamera,fitArcadeText,applyPixelFilter} from '../data/arcade.js';
import {characters} from '../data/characters.js';
import {LevelMusic} from '../audio/LevelMusic.js';
import {SoundEffects,PLAYER_HURT_SOUNDS} from '../audio/SoundEffects.js';
import {ITEMS,prepareItem} from '../data/pickups.js';

/** Lives and campaign navigation belong to StreetScene; this mode owns cycling input and simulation. */
export class CyclingStage{
  constructor(scene){this.scene=scene;this.run=new CyclingRun();this.visuals=new Map();this.pickupVisuals=new Map();this.flashUntil=0;}
  create(){
    const s=this.scene;prepareCycling(s);fitArcadeCamera(s);applyPixelFilter(s);
    for(const kind of ['money','full']){
      prepareItem(s,kind);
      if(s.textures.exists(ITEMS[kind].source))s.textures.remove(ITEMS[kind].source);
    }
    s.arcade=null;s.enemies=[];s.boss=null;s.miniBoss=null;s.vuvuzela=null;s.hud=null;
    this.background=s.add.tileSprite(0,0,960,540,'cycling-background').setOrigin(0).setDepth(0);
    const im=s.textures.get('cycling-background').getSourceImage();this.background.setTileScale(960/im.width,540/im.height);
    s.player={x:CYCLING.playerX,y:this.run.y,key:s.characterKey,config:s.character,
      sprite:s.add.sprite(CYCLING.playerX,this.run.y,`cycling-${s.characterKey}`,0).setOrigin(.5,1),
      shadow:s.add.ellipse(CYCLING.playerX,this.run.y,120,15,0x000000,.26)};
    const text=(x,y,value,size=14,color='#e8edce')=>fitArcadeText(s.add.text(x,y,value,{fontFamily:"'IBM Plex Mono', monospace",fontSize:`${size}px`,color,stroke:'#122329',strokeThickness:3}).setDepth(1002));
    s.add.rectangle(0,0,960,85,0x102027,.92).setOrigin(0).setDepth(1000);
    s.playerName=text(22,12,s.character.name,18,'#ffe14d');
    // StreetScene is reused: replace its destroyed HUD before setCharacter updates the name.
    this.setCharacter(s.characterKey);
    s.add.rectangle(22,43,204,16,0xffffff).setOrigin(0).setDepth(1001);
    s.healthBar=s.add.rectangle(24,45,200,12,0xffdf22).setOrigin(0).setDepth(1002);
    s.runStatus=text(22,66,'',10);s.updateRunStatus();
    s.counter=text(935,15,'NIVEL 02 · CICLOVÍA',15,'#d6ed64').setOrigin(1,0);
    s.dashStatus=text(290,62,'PEDALEO AUTOMÁTICO',10,'#d6ed64');
    this.distance=text(290,17,'',16,'#ffffff');
    s.add.rectangle(290,43,420,8,0x5c6c64).setOrigin(0).setDepth(1001);
    this.progress=s.add.rectangle(290,43,1,8,0xd6ed64).setOrigin(0).setDepth(1002);
    this.time=text(935,45,'',22,'#ff8ec8').setOrigin(1,0);
    this.cardsLabel=text(735,66,'TARJETAS 0 · +1000',10,'#ffe14d');
    this.dashBar=s.add.rectangle(290,77,420,3,0x6ef9ff).setOrigin(0).setDepth(1002);
    s.controlsLabel=text(480,520,s.game.touchControls?.mobile?.()?'JOYSTICK ↑ ↓ · ESQUIVAR   |   » DASH 3 s   |   Ⅱ PAUSA':'↑ ↓ / W S · ESQUIVAR   |   SHIFT · DASH 3 s   |   P PAUSA   |   R REINICIAR',11).setOrigin(.5);
    s.overlay=s.add.container(480,265,[s.add.rectangle(0,0,660,145,0x102027,.96),
      text(0,-22,'',24,'#d6ed64').setOrigin(.5),text(0,27,'',12).setOrigin(.5)]).setDepth(2000).setVisible(false);
    this.banner=text(480,145,'¡DOMINGO DE CICLOVÍA!',24,'#ffe14d').setOrigin(.5);
    this.tip=text(480,178,'↑ ↓ ESQUIVA · RECOGE TARJETAS +1000',12).setOrigin(.5);
    this.guardianWarning=text(480,213,'¡PITO! GUARDIANA · CAMBIA DE CARRIL',16,'#ffe14d').setOrigin(.5).setVisible(false);
    // Painted on the road: above potholes, below every rider and their shadow.
    this.finishLine=s.add.container(1050,390).setDepth(2).setVisible(false);
    for(let row=0;row<18;row++)for(let col=0;col<2;col++)this.finishLine.add(s.add.rectangle(col*14,row*14-120,14,14,(row+col)%2?0xffffff:0x132027).setOrigin(0));
    this.finishLine.add(text(-10,-160,'META',16,'#ffe14d'));
    this.dashFX=s.add.graphics().setDepth(3);
    this.dashGhosts=Array.from({length:4},()=>s.add.sprite(CYCLING.playerX,this.run.y,`cycling-${s.characterKey}`,0).setOrigin(.5,1).setVisible(false));
    s.music=new LevelMusic(s,s.level.music.key);s.sfx=new SoundEffects(s.sound,s.cache.audio);
    s.keys=s.input.keyboard.addKeys('W,A,S,D,H,J,K,L,SHIFT,SPACE,P,R,ENTER,UP,DOWN,LEFT,RIGHT');
    s.game.touchControls?.setCycling(true);
    s.game.events.emit('level-start',s.levelIndex);
    s.events.once('shutdown',()=>{
      s.music?.destroy();s.sfx?.destroy();s.music=null;s.sfx=null;s.game.touchControls?.setCycling(false);
      this.visuals.clear();this.pickupVisuals.clear();s.cycling=null;
    });
    this.render();
  }
  setCharacter(key){
    const s=this.scene;s.characterKey=key;s.character=characters[key];
    if(!s.player)return;
    Object.assign(s.player,{key,config:s.character});s.player.sprite.setTexture(`cycling-${key}`,0);
    s.player.sprite.setScale(138/s.textures.get(`cycling-${key}`).referenceHeight);
    s.playerName?.setText(s.character.name);s.input?.keyboard?.resetKeys();
  }
  respawn(){
    const s=this.scene;this.run.respawn();s.health=100;s.healthBar.width=200;s.deathHandled=false;s.respawnDelay=0;
    s.hurtUntil=0;s.player.sprite.clearTint().setAlpha(1);s.player.y=this.run.y;
    s.music?.setPaused(false);s.sfx?.setPaused(false);s.updateRunStatus();s.game.events.emit('player-respawn');
  }
  setPaused(value,showOverlay=true){
    const s=this.scene;s.paused=value;s.music?.setPaused(value);s.sfx?.setPaused(value);
    if(value){s.tweens.pauseAll();if(showOverlay)s.showOverlay('PAUSA','P / ▶ PARA CONTINUAR');else s.overlay.setVisible(false);}
    else{s.tweens.resumeAll();s.overlay.setVisible(false);}
    s.game.events.emit('combat-paused',value);
  }
  crash(obstacle){
    const s=this.scene;if(s.health<=0)return;
    s.health=Math.max(0,s.health-OBSTACLES[obstacle.kind].damage);s.healthBar.width=s.health*2;
    this.flashUntil=this.run.elapsed+330;s.cameras.main.shake(110,.004);s.sfx?.play(PLAYER_HURT_SOUNDS[s.characterKey]);
    const ring=s.add.ellipse(CYCLING.playerX,this.run.y-45,35,22,0xffe14d,.7).setDepth(999);
    s.tweens.add({targets:ring,alpha:0,scaleX:2,scaleY:2,duration:240,onComplete:()=>ring.destroy()});
  }
  finish(){
    const s=this.scene;if(s.finished || s.health<=0)return;
    s.finished=true;s.addScore(CYCLING.finishPoints);s.music?.stop();s.sfx?.play('wave');
    s.player.sprite.setFrame(7).setAlpha(1);
    this.renderDash(7);
    s.victoryRemaining=1200;s.pendingResult={won:true,last:false,cycling:true,score:s.run.score,character:s.character.name};
    s.game.events.emit('level-clear',s.levelIndex);s.game.events.emit('level-victory');
    s.showOverlay('¡CICLOVÍA COMPLETADA!','+1500 PUNTOS · SIGUE LA PLAZA DE BOLÍVAR');
  }
  update(delta){
    const s=this.scene,k=s.keys,touch=s.game.touchControls?.input;
    const pressed=key=>Phaser.Input.Keyboard.JustDown(k[key])||Boolean(touch?.justDown(key));
    const dashPressed=pressed('SHIFT');
    if(pressed('P') && !s.finished && s.health>0){
      this.setPaused(!s.paused);
    }
    if(pressed('R')){s.restartLevel();return;}
    if(s.paused || s.waitingContinue || s.gameOver){touch?.discardPresses();return;}
    const ms=Math.min(Math.max(0,delta),50);
    if(s.pendingResult){s.victoryRemaining=Math.max(0,s.victoryRemaining-ms);if(!s.victoryRemaining){const result=s.pendingResult;s.pendingResult=null;s.game.events.emit('level-result',result);}return;}
    if(s.finished){if(pressed('ENTER'))s.nextLevel();return;}
    if(s.health<=0){
      s.handleDeath();s.player.sprite.setFrame(6).setAlpha(.6);
      this.renderDash(6);
      if(!s.waitingContinue && !s.gameOver){s.respawnDelay-=ms;if(s.respawnDelay<=0)this.respawn();}
      return;
    }
    if(dashPressed && this.run.startDash())s.sfx?.play('running');
    const steer=Number(k.DOWN.isDown||k.S.isDown)-Number(k.UP.isDown||k.W.isDown)||touch?.y||0;
    touch?.discardPresses();const events=this.run.step(ms,steer);s.combatTime=this.run.elapsed;
    for(const obstacle of events.hits)this.crash(obstacle);
    for(const _ of events.passed)s.addScore(25);
    for(const item of events.collected){
      s.sfx?.play('item');
      if(item.kind==='full'){
        s.health=Math.min(100,s.health+ITEMS.full.heal);s.healthBar.width=s.health*2;
        s.scorePopup?.(CYCLING.playerX,item.y-30,'ENERGÍA');
      }else{
        s.addScore(CYCLING.cardPoints);s.scorePopup?.(CYCLING.playerX,item.y-30,CYCLING.cardPoints);
      }
    }
    this.render();
    if(this.run.done && s.health>0)this.finish();
  }
  render(){
    const s=this.scene,t=this.run.elapsed,phase=Math.floor(t/(this.run.dashing?60:115))%4;
    // Tile positions use source-texture pixels; obstacles use world pixels.
    this.background.tilePositionX=this.run.roadOffset/this.background.tileScaleX;
    const pose=s.finished?7:t<this.flashUntil?6:phase;
    s.player.y=this.run.y;s.player.sprite.setFrame(pose).setPosition(CYCLING.playerX,this.run.y).setDepth(this.run.y)
      .setAlpha(t<this.run.invulnerableUntil && Math.floor(t/90)%2?.45:1);
    s.player.shadow.setPosition(CYCLING.playerX,this.run.y-2).setDepth(this.run.y-1);
    this.banner.setVisible(t<2500);this.tip.setVisible(t<3500);this.progress.width=420*this.run.progress;
    this.distance.setText(`RECORRIDO ${Math.floor(this.run.progress*100)}% · ${Math.floor(this.run.distance)} m`);this.time.setText(`${Math.ceil(this.run.remainingMs/1000)} s`);
    this.guardianWarning?.setVisible(this.run.obstacles.some(o=>o.kind==='guardian' && !o.passed && t-o.born<2000));
    const dash=this.run.dashing?`DASH ${(this.run.dashRemaining/1000).toFixed(1)} s`:this.run.dashCooldown>0?`RECARGA ${(this.run.dashCooldown/1000).toFixed(1)} s`:'SHIFT · DASH LISTO';
    s.dashStatus.setText(`${this.run.difficulty.label} · ${dash}`);
    if(this.dashBar)this.dashBar.width=420*(this.run.dashing?this.run.dashRemaining/CYCLING_DASH.duration:1-this.run.dashCooldown/CYCLING_DASH.cooldown);
    this.cardsLabel?.setText(`TARJETAS ${this.run.cardsCollected} · +1000`);
    if(this.run.remainingMs<4000)this.finishLine.setVisible(true).setX(CYCLING.playerX+this.run.remainingDistance);
    this.renderDash(pose);
    const alive=new Set();
    for(const o of this.run.obstacles){
      alive.add(o.id);let v=this.visuals.get(o.id);
      if(!v){
        const key=o.kind==='cyclist'?'cycling-npcs':o.kind==='dog'?'cycling-dog':o.kind==='guardian'?'cycling-guardian':'cycling-hole';
        const sprite=s.add.image(o.x,o.y,key,0).setOrigin(.5,1),shadow=o.kind==='hole'?null:s.add.ellipse(o.x,o.y,80,12,0x000000,.22);
        const height=o.kind==='hole'?30:o.kind==='dog'?51:o.kind==='guardian'?118:o.variant===2?100:131;
        sprite.setScale(o.kind==='hole'?1:height/s.textures.get(key).referenceHeight);
        if(o.kind==='cyclist' || o.kind==='dog')sprite.setFlipX(true);
        if(o.kind==='guardian')s.sfx?.play('whistle');
        v={sprite,shadow};this.visuals.set(o.id,v);
      }
      v.sprite.setPosition(o.x,o.y).setDepth(o.kind==='hole'?1:o.y).setAlpha(o.hit?.65:1);
      if(o.kind!=='hole'){
        const age=t-(o.born??0),blocking=o.kind==='guardian' && (age<GUARDIAN.windup || age>=GUARDIAN.windup+GUARDIAN.crossing);
        const motionPhase=(blocking?4:0)+Math.floor((o.kind==='guardian'?age:t)/OBSTACLES[o.kind].frameMs)%4;
        v.sprite.setFrame((o.kind==='cyclist'?o.variant*4:0)+motionPhase);
      }
      v.shadow?.setPosition(o.x,o.y-2).setDepth(o.y-1);
    }
    for(const [id,v] of this.visuals)if(!alive.has(id)){v.sprite.destroy();v.shadow?.destroy();this.visuals.delete(id);}
    const cards=new Set();
    for(const item of this.run.pickups){
      const config=ITEMS[item.kind],food=item.kind==='full';
      cards.add(item.id);let v=this.pickupVisuals.get(item.id);
      if(!v){
        v={sprite:s.add.image(item.x,item.y-45,config.texture).setOrigin(.5).setDisplaySize(food?62:46,food?58:30),
          glow:s.add.ellipse(item.x,item.y-45,food?76:60,food?60:36,food?0x94ff9b:0xffe14d,.2)};
        this.pickupVisuals.set(item.id,v);
      }
      const y=item.y-45+Math.sin(t/180+item.id)*3;
      v.sprite.setTexture(`${config.prefix}-${Math.floor(t/(config.frameTicks*1000/60))%config.frames}`).setPosition(item.x,y).setDepth(item.y);
      v.glow.setPosition(item.x,y).setDepth(item.y-1).setAlpha(.2+Math.sin(t/160+item.id)*.08);
    }
    for(const [id,v] of this.pickupVisuals)if(!cards.has(id)){v.sprite.destroy();v.glow.destroy();this.pickupVisuals.delete(id);}
  }
  renderDash(pose){
    if(!this.dashFX)return;
    const s=this.scene,active=this.run.dashing && s.health>0 && !s.finished;
    this.dashFX.clear();
    for(const [i,ghost] of this.dashGhosts.entries()){
      ghost.setVisible(active);if(!active)continue;
      ghost.setTexture(`cycling-${s.characterKey}`,pose).setScale(138/s.textures.get(`cycling-${s.characterKey}`).referenceHeight)
        .setPosition(CYCLING.playerX-24*(i+1),this.run.y).setDepth(this.run.y-2).setAlpha(.26-i*.05);
      ghost.setTint?.(0x65eaff);
    }
    if(!active)return;
    for(let i=0;i<18;i++){
      const x=((i*137-this.run.roadOffset*1.6)%1100+1100)%1100-140,y=CYCLING.top-75+(i*43)%240;
      this.dashFX.lineStyle(i%3?2:3,0x9ffaff,.28+i%3*.08).lineBetween(x,y,x+80+i%4*28,y);
    }
  }
}
