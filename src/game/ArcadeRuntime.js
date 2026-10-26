import {ARCADE} from '../data/arcade.js';
import {CAMPAIGN} from '../data/campaign.js';
import {FixedClock} from './FixedClock.js';
import {Player} from '../actors/Player.js';
import {Enemy} from '../actors/Enemy.js';
import {CombatSystem} from '../combat/CombatSystem.js';
import {Diablitos} from './Diablitos.js';
import {Poultry} from './Poultry.js';
import {Potatoes} from './Potatoes.js';

export class ArcadeRuntime {
  constructor(scene){this.scene=scene;this.clock=new FixedClock();this.frame=0;this.combat=new CombatSystem(scene);this.player=new Player(this);this.enemies=new Map();this.diablitos=new Diablitos(this);this.poultry=new Poultry(this);this.potatoes=new Potatoes(this);this.input={dx:0,dy:0};this.edges={jump:false,dash:false};}
  capture(input){
    if(this.destroyed)return;
    const s=this.scene;
    if(input.restart){s.restartLevel();return;}
    if(input.enter && s.finished){s.health<=0?s.restartLevel():s.nextLevel();return;}
    if(input.pause && !s.finished){
      s.paused=!s.paused;s.overlay.setVisible(s.paused);
      if(s.paused)s.showOverlay('PAUSA','P / ▶ PARA CONTINUAR');
      s.music?.setPaused(s.paused);s.sfx?.setPaused(s.paused);s.boss?.setPaused(s.paused);
      s.game.events.emit('combat-paused',s.paused);this.clearInput();this.clock.clear();
    }
    if(s.paused || s.finished || s.cinematic || s.health<=0)return;
    this.input={dx:input.dx,dy:input.dy};this.edges.jump ||= input.jump;this.edges.dash ||= input.dash;
    for(const action of input.actions){this.player.request(action);if(['punch','kick','lowKick',s.character.special].includes(action))s.boss?.status.shake();}
  }
  update(delta){if(this.destroyed || this.scene.paused || this.scene.cinematic){this.clock.clear();return;}this.clock.advance(delta,frame=>this.step(frame));}
  step(frame){
    if(this.destroyed)return;
    const s=this.scene;this.frame=frame;
    if(s.health<=0 && !s.gameOver){
      s.handleDeath();this.player.transition('knockdown');this.combat.clear();this.clearInput();
      if(s.waitingContinue || s.gameOver)return;
      s.respawnDelay-=ARCADE.clock.stepMs;if(s.respawnDelay<=0)s.respawn();return;
    }
    if(s.pendingResult){
      s.victoryRemaining=Math.max(0,s.victoryRemaining-ARCADE.clock.stepMs);
      if(s.victoryRemaining<=1e-6){const result=s.pendingResult;s.pendingResult=null;s.victoryRemaining=0;s.game.events.emit('level-result',result);}return;
    }
    if(s.finished)return;
    s.combatTime+=ARCADE.clock.stepMs;this.combat.step(frame);
    if(s.ringBonus){
      s.ringBonus.tick();
      if(s.ringBonus.locked){this.clearInput();s.stage?.update(frame);s.ringBonus.update();s.placeFighter(s.player,s.player.z??0);return;}
    }
    if(s.chivaBonus){
      s.chivaBonus.tick();
      if(s.chivaBonus.locked){
        this.clearInput();s.stage?.update(frame);s.chivaBonus.update(frame);
        s.placeFighter(s.player,s.player.z??0);s.vuvuzela?.render();return;
      }
    }
    const previous={x:s.player.x,y:s.player.y},walking=this.player.state==='walk' && !this.combat.frozen(s.player);
    this.diablitos.update();
    this.player.step({...this.input,...this.edges});this.edges={jump:false,dash:false};
    s.stage?.rain?.slip(s.player,previous,walking && this.player.state==='walk');
    s.stage?.update(frame); // moves the camera and the floor span before enemies use it
    s.energyPickups?.update(frame);
    if(!s.chivaBonus)s.vuvuzela?.update(frame);
    s.motorcycles?.update();
    for(const actor of s.enemies){
      if(actor.hp<=0){this.combat.tokens.release(actor);continue;}
      const previous={x:actor.x,y:actor.y};
      if(actor.crossing)s.updateCrossing(actor,1/ARCADE.clock.fps);
      else {
        if(!this.enemies.has(actor))this.enemies.set(actor,new Enemy(this,actor));
        if(!s.debugPreview && !this.diablitos.controls(actor))this.enemies.get(actor).step();
      }
      const model=this.enemies.get(actor);
      s.stage?.rain?.slip(actor,previous,!actor.crossing && !s.debugPreview && !this.combat.frozen(actor) && ['approach','circle'].includes(model?.state));
      s.placeFighter(actor,actor.z??0);
      actor.tell.setPosition(actor.x,actor.y-actor.config.height-30).setDepth(actor.y+2);
      actor.taunt?.setPosition(actor.x,actor.y-actor.config.height-40).setVisible(actor.hp>0 && s.combatTime<actor.tauntUntil);
      actor.healthBar.setPosition(actor.x-21,actor.y-actor.config.height-10).setDepth(actor.y+1);
    }
    s.updateProjectiles(1/ARCADE.clock.fps);s.flock?.update();s.iphone?.update(1/ARCADE.clock.fps);s.books?.update(1/ARCADE.clock.fps);s.waves.update();
    s.ringBonus?.update();
    this.poultry.update();
    this.potatoes.update();
    for(const model of this.enemies.values())model.reversa?.resolveMovement(previous);
    if(s.health>0 && s.level.boss && s.waves.cleared && !s.boss && !s.miniBoss)s.beginBossIntro();
    s.miniBoss?.update();s.stains?.update();s.gas?.update();s.tickClock?.();
    if(s.boss){
      if(this.combat.frozen(s.boss.actor)){
        s.boss.until+=ARCADE.clock.stepMs;
        s.boss.hazards.update(1/ARCADE.clock.fps);s.boss.weather.update(1/ARCADE.clock.fps);s.boss.status.update();
      }else s.boss.update(1/ARCADE.clock.fps);
    }
    const blinking=s.combatTime<s.respawnProtectedUntil || s.combatTime<s.invulnerableUntil;
    s.player.sprite.setFlipX(s.facing<0).setAlpha(blinking && frame%ARCADE.flow.blinkPeriod<ARCADE.flow.blinkVisible?ARCADE.flow.blinkAlpha:1);
    s.placeFighter(s.player,s.player.z??0);
    s.vuvuzela?.render();
    if(this.debugBoxes){
      this.boxGraphics??=s.add.graphics().setDepth(1100);this.boxGraphics.clear();
      for(const actor of [s.player,...s.enemies.filter(e=>e.hp>0)]){const b=this.combat.hurtbox(actor);this.boxGraphics.lineStyle(1/ARCADE.screen.zoom,0x66ff88,1).strokeRect(b.x-b.halfWidth,b.y-b.halfDepth,b.halfWidth*2,b.halfDepth*2);}
      if(s.playerAttack){const b=this.combat.hitbox(s.player,s.playerAttack),active=this.player.action?.displayedFrame.phase==='active';this.boxGraphics.lineStyle(1/ARCADE.screen.zoom,active?0xff4444:0xffcc44,1).strokeRect(b.x-b.halfWidth,b.y-b.halfDepth,b.halfWidth*2,b.halfDepth*2);}
    }else this.boxGraphics?.clear();
    s.dashStatus.setText(frame>=this.player.dashReady?'SHIFT / DASH LISTO':'SHIFT / RECARGANDO…');
    if(s.health<=0){s.handleDeath();return;}
    if(!s.chivaBonus && !s.ringBonus && s.waves.cleared && (!s.level.boss || s.boss?.done || s.miniBoss?.done))this.win();
  }
  enemyHit(actor,attack){
    if(!this.enemies.has(actor))this.enemies.set(actor,new Enemy(this,actor));
    this.enemies.get(actor).hurt(attack);this.combat.impact(this.scene.player,actor,attack);
  }
  enemyPhase(actor){
    if(!this.enemies.has(actor))this.enemies.set(actor,new Enemy(this,actor));
    this.enemies.get(actor).checkShieldPhase();
  }
  playerHit(combo,source){this.player.hurt(Boolean(combo?.finisher));if(!combo)this.combat.impact(source??null,this.scene.player,{finisher:false});}
  resetPlayer(revive=false){this.diablitos.cancelPlayer();this.poultry.clear();this.potatoes.clear();this.scene.vuvuzela?.clearHeld();this.scene.stage?.rain?.forget(this.scene.player);this.player.reset();this.clearInput();if(revive){this.combat.clear();for(const enemy of this.enemies.values())enemy.hurt();}}
  clearInput(){this.player.buffer.clear();this.edges={jump:false,dash:false};this.input={dx:0,dy:0};}
  win(){
    const s=this.scene;this.diablitos.clear();this.poultry.clear();this.potatoes.clear();s.finished=true;this.player.transition('celebration');this.clearInput();this.combat.tokens.clear();
    s.vuvuzela?.clearHeld();
    s.stage?.rain?.clear();
    s.stage?.pigeons?.clear();
    s.motorcycles?.clear();
    s.music?.stop();s.iphone?.clear();s.books?.clear();s.player.sprite.setAlpha(1);
    s.projectiles.forEach(p=>p.sprite.destroy());s.projectiles=[];s.stains?.clear();s.gas?.clear();s.flock?.clear();s.sprayBarrage?.clear();
    for(const enemy of s.enemies){enemy.pending=null;enemy.tell.setVisible(false);if(enemy.hp>0)s.idle(enemy);}
    const last=s.levelIndex===CAMPAIGN.length-1;s.showOverlay(last?'BOGOTÁ DESPEJADA':'CUADRA DESPEJADA','ENTER PARA CONTINUAR');
    s.play(s.player,'victory',ARCADE.flow.victoryFrames*ARCADE.clock.stepMs);s.game.events.emit('level-clear',s.levelIndex);s.game.events.emit('level-victory');
    s.pendingResult={won:true,last,bossCheckpoint:Boolean(s.boss||s.miniBoss),score:s.run.score,character:s.character.name};s.victoryRemaining=ARCADE.flow.resultDelayFrames*ARCADE.clock.stepMs;
  }
  destroy(){if(this.destroyed)return;this.destroyed=true;this.diablitos.clear();this.poultry.clear();this.potatoes.clear();this.clock.clear();for(const enemy of this.enemies.values()){enemy.healAura?.destroy();enemy.sackSpin?.clear();enemy.brayatan?.destroy();enemy.pacho?.destroy();enemy.reversa?.destroy();}this.combat.clear();this.enemies.clear();this.clearInput();this.boxGraphics?.destroy();}
}
