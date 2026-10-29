import {BOSS_SOUNDS,BOSS_HURT_COOLDOWN} from '../audio/SoundEffects.js';
import { enemyDeathSound } from '../audio/SoundEffects.js';
import { BOSS } from './balance.js';
import { phaseFor, clamp, availableAttacks } from './rules.js';
import { StatusEffects } from './StatusEffects.js';
import { Weather } from './Weather.js';
import { Hazards } from './Hazards.js';
import { playerAttackHits, meleeHits } from '../combat.js';
import {timeline} from '../data/attacks.js';
import {toFrames,fitArcadeText} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';

export class BossController {
  constructor(scene, spriteConfig) {
    this.scene=scene;this.actor=scene.makeFighter(viewLeft(scene)+790,scene.floor.top+18,'dormilon',spriteConfig);
    this.hp=BOSS.hp;this.maxHp=BOSS.hp;this.phase=1;this.state='entry';this.until=scene.combatTime+BOSS.entry;
    this.facing=-1;this.lastAttack=null;this.attack=null;this.readyAt={shield:scene.combatTime+16000};this.dead=false;this.ended=false;
    this.status=new StatusEffects(scene);this.weather=new Weather(scene);this.hazards=new Hazards(scene,this.status);
    this.audioSources=new Set();this.blockUntil=0;this.guardUntil=0;
    const style={fontFamily:"'IBM Plex Mono', monospace",fontSize:'12px',color:'#ffcf69',stroke:'#142127',strokeThickness:3};
    this.name=scene.add.text(480,22,'DORMILÓN · FASE 1',style).setOrigin(.5,0).setDepth(1000);
    this.barBack=scene.add.rectangle(310,44,340,10,0x14282c).setOrigin(0).setDepth(1000);
    this.bar=scene.add.rectangle(312,46,336,6,0xe45c50).setOrigin(0).setDepth(1000);
    this.notice=scene.add.text(480,103,'DORMILÓN LLEGA A LA CUADRA',style).setOrigin(.5).setDepth(1001);
    this.blockLabel=scene.add.text(0,0,'BLOQUEADO',{...style,color:'#9ee9ff'}).setOrigin(.5).setDepth(902).setVisible(false);
    this.guard=scene.add.image(0,0,'boss-effects','bubble').setDisplaySize(spriteConfig.height*.97,spriteConfig.height*1.12).setAlpha(.65).setVisible(false);
    for(const item of [this.name,this.barBack,this.bar,this.notice])item.setScrollFactor?.(0);
    this.actor.sprite.setFlipX(true);
    if(scene.arcade)for(const text of [this.name,this.notice,this.blockLabel,this.status.label])fitArcadeText(text);
    if(scene.hud)for(const item of [this.name,this.barBack,this.bar])item.setVisible(false);
    this.cue(180,.2);
  }
  get x(){return this.actor.x;} get y(){return this.actor.y;}
  get activeSystems(){return [...this.hazards.activeSystems,...(this.weather.active?['rain']:[])];}
  get done(){return this.dead && this.scene.combatTime>=this.until;}
  get speed(){return this.scene.character.speed*this.status.speedMultiplier;}
  cue(frequency=440,duration=.12) {
    const context=this.scene.sound.context;
    if(!context || context.state!=='running' || this.scene.sound.mute) return;
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type='triangle';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.045,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);
    oscillator.connect(gain);gain.connect(this.scene.sound.masterVolumeNode ?? context.destination);
    const audio={oscillator,gain};this.audioSources.add(audio);
    oscillator.onended=()=>{this.audioSources.delete(audio);oscillator.disconnect();gain.disconnect();};
    oscillator.start();oscillator.stop(context.currentTime+duration);
  }
  setPaused(paused) {
    if(paused) {this.actor.sprite.anims.pause();this.stopAudio();} else this.actor.sprite.anims.resume();
  }
  stopAudio(){for(const {oscillator,gain} of this.audioSources) {oscillator.onended=null;try{oscillator.stop();}catch{}oscillator.disconnect();gain.disconnect();}this.audioSources.clear();}
  begin(key) {
    const config=key==='melee'?BOSS.melee:BOSS.attacks[key];
    if(this.dead || this.ended || !config) return false;
    if(!['idle','reposition'].includes(this.state)) return false;
    const now=this.scene.combatTime;
    this.facing=this.scene.player.x<this.x?-1:1;
    const windup=key==='melee'?config.windup:this.hazards.prepare(key,this.speed);
    this.attack={key,config,start:now,windup,release:now+windup};
    this.scene.sfx?.play(BOSS_SOUNDS.dormilon.attack);
    if(this.scene.arcade){
      this.attack.frame=0;
      this.attack.frames=timeline({startup:toFrames(windup),active:toFrames(key==='rain'?BOSS.rain.guard:config.duration),recovery:toFrames(config.recovery),
        startupPose:this.actor.config.animations[key][0],activePose:BOSS.attackPoses[key],recoveryPose:this.actor.config.idle});
    }
    this.state='windup';this.until=now+windup;
    this.readyAt[key]=now+config.cooldown;
    if(key!=='melee')this.lastAttack=key;
    this.scene.play(this.actor,key,windup+config.duration);
    this.cue(key==='traffic'?240:key==='shield'?160:420,.18);
    return true;
  }
  activate() {
    const {key,config}=this.attack,now=this.scene.combatTime;
    this.state='attack';
    // Rain's animation resolves into a short frontal guard; its weather outlives recovery.
    this.until=now+(key==='rain'?BOSS.rain.guard:config.duration);
    this.actor.sprite.stop().setFrame(BOSS.attackPoses[key]);
    if(key==='melee') {
      if(this.scene.arcade){
        const attack={...config,facing:this.facing,finisher:false};
        if(this.scene.arcade.combat.touches(this.actor,this.scene.player,attack) && this.scene.hitPlayer(config.damage,null,this.actor)){
          this.scene.arcade.combat.push(this.scene.player,attack);
        }
      }else if(this.scene.jumpHeight<25 && meleeHits(this.actor,this.scene.player,this.facing,config.range,config.lane))this.scene.hitPlayer(config.damage);
    } else if(key==='rain') {this.weather.start();this.guardUntil=now+BOSS.rain.guard;}
    else this.hazards.activate(key,this);
    this.cue(key==='works'?90:620,.13);
  }
  recover() {
    this.state='recovery';this.until=this.scene.combatTime+this.attack.config.recovery;
    if(this.attack.key==='rain') this.actor.sprite.stop().setFrame(19);
    else this.scene.idle(this.actor);
    this.notice.setText('DORMILÓN EXPUESTO · ¡CONTRAATACA!');
  }
  hit(attack,origin=this.scene.player) {
    if(this.dead || this.ended || !playerAttackHits(origin,this.actor,attack)) return;
    const now=this.scene.combatTime;
    const frontal=(origin.x-this.x)*this.facing>=-10;
    if(this.state==='entry' || this.state==='transition' || (this.state==='attack' && this.attack?.key==='shield') || (now<this.guardUntil && frontal)) {
      this.blockUntil=now+350;this.cue(110,.07);return;
    }
    this.scene.superPower?.onHit(attack);
    this.hp=Math.max(0,this.hp-attack.damage);this.bar.width=336*this.hp/BOSS.hp;
    if(this.hp>0 && now>=(this.gruntReady??0)){this.gruntReady=now+BOSS_HURT_COOLDOWN;this.scene.sfx?.play(BOSS_SOUNDS.dormilon.hurt);}
    this.actor.sprite.setTint(0xffcdb6);this.hurtFlashUntil=now+120;
    this.scene.arcade?.combat.impact(this.scene.player,this.actor,attack);
    if(!this.hp){this.defeat();return;}
    const next=phaseFor(this.hp);
    if(next!==this.phase) {
      this.phase=next;this.state='transition';this.until=now+BOSS.transition;this.attack=null;this.guardUntil=0;
      this.hazards.clear();this.weather.clear();
      this.scene.idle(this.actor);this.notice.setText(`FASE ${this.phase} · ${this.phase===2?'LA CIUDAD SE COMPLICA':'ÚLTIMO TRÁMITE'}`);this.cue(300,.25);
    } else if(['idle','reposition'].includes(this.state)) {
      // Hurt never cancels a committed telegraph, nor shortens its counterattack window.
      this.resumeState=this.state;this.resumeUntil=this.until;
      this.state='hurt';this.until=now+160;
      this.scene.play(this.actor,'hurt',160);
    } else if(this.state==='recovery') {
      this.scene.play(this.actor,'hurt',220);
    }
  }
  defeat() {
    this.scene.addScore?.(2000);
    enemyDeathSound(this.scene);
    this.dead=true;this.state='defeat';this.until=this.scene.combatTime+1300;this.attack=null;
    this.stopEffects();this.actor.shadow.setVisible(false);this.actor.sprite.clearTint();
    this.scene.play(this.actor,'defeat',1100);this.notice.setText('DORMILÓN DERROTADO');this.cue(130,.25);
  }
  stopEffects() {this.hazards.clear();this.weather.clear();this.status.clear();this.guardUntil=0;this.guard.setVisible(false);this.stopAudio();}
  finish() {if(this.ended)return;this.ended=true;this.stopEffects();this.scene.idle(this.actor);}
  superHit(){
    if(this.dead || this.ended)return;
    this.hp=Math.floor(this.hp/2);this.bar.width=336*this.hp/BOSS.hp;
    if(!this.hp){this.defeat();return;}
    this.stopEffects();this.attack=null;this.phase=phaseFor(this.hp);this.state='superDown';
    this.superAt=this.scene.combatTime;this.until=this.superAt+1400;
  }
  update(dt) {
    if(this.ended)return;
    const now=this.scene.combatTime;
    if(this.state==='superDown'){
      const poses=this.actor.config.animations.defeat,age=now-this.superAt;
      this.actor.sprite.stop().setFrame(poses[Math.min(poses.length-1,Math.floor(age/100))]);
      if(now>=this.until){this.state='idle';this.until=now+500;this.scene.idle(this.actor);}
      return;
    }
    if(this.scene.arcade && this.attack?.frames && ['windup','attack'].includes(this.state)){
      const frame=this.attack.frames[this.attack.frame++];
      this.actor.sprite.stop().setFrame(frame.pose);
      if(frame.phase==='active' && this.state==='windup')this.activate();
      else if(frame.phase==='recovery' && this.state==='attack')this.recover();
    }
    if(!this.dead) {
      this.hazards.update(dt);this.weather.update(dt);this.status.update();
      if(now>=this.until && !(this.scene.arcade && ['windup','attack'].includes(this.state))) {
        if(this.state==='hurt') {this.state=this.resumeState;this.until=Math.max(now,this.resumeUntil);this.scene.idle(this.actor);}
        else if(['entry','transition','recovery'].includes(this.state)) {
          const afterMelee=this.state==='recovery' && this.attack?.key==='melee';
          this.state='idle';this.attack=null;this.until=afterMelee?now:now+BOSS.phaseRest[this.phase-1];this.scene.idle(this.actor);
        }
        else if(this.state==='windup') this.activate();
        else if(this.state==='attack') this.recover();
        else if(this.state==='idle') {this.state='reposition';this.until=now+500;}
        else if(this.state==='reposition') {
          const key=availableAttacks({phase:this.phase,now,readyAt:this.readyAt,lastAttack:this.lastAttack,activeSystems:this.activeSystems,frozen:now<this.scene.hurtUntil,distance:Math.abs(this.x-this.scene.player.x)});
          if(key)this.begin(key);else {this.state='idle';this.until=now+400;}
        }
      }
      if(this.state==='idle'||this.state==='reposition') {
        const dx=this.scene.player.x-this.x,dy=this.scene.player.y-this.y;
        if(dx)this.facing=Math.sign(dx);
        const close=meleeHits(this.actor,this.scene.player,this.facing,BOSS.melee.range,BOSS.melee.lane);
        const safe=this.activeSystems.length<2 && this.activeSystems.every(key=>key==='works'||key==='rain') && now>=this.scene.hurtUntil;
        if(close && safe && now>=(this.readyAt.melee??0) && this.state==='idle' && now<this.until) this.begin('melee');
        else {
          const previous={x:this.x,y:this.y};
          const moveX=Math.abs(dx)>BOSS.melee.range*.75?dx:0,moveY=Math.abs(dy)>12?dy:0;
          const length=Math.hypot(moveX,moveY)||1;
          this.actor.x=clamp(this.x+moveX/length*BOSS.speed*dt,this.scene.floor.left+20,this.scene.floor.right-20);
          this.actor.y=clamp(this.y+moveY/length*BOSS.speed*.65*dt,this.scene.floor.top,this.scene.floor.bottom);
          this.hazards.resolveMovement(previous,this.actor);
          if(moveX||moveY)this.scene.play(this.actor,'walk');else this.scene.idle(this.actor);
        }
      }
      if(this.state==='windup') {
        const remaining=Math.max(0,(this.until-now)/1000);
        const extra=this.attack.key==='pico'?` · ZONA ${this.hazards.pico.restricted+1} ✕ · ${remaining.toFixed(1)} s`:` · ${remaining.toFixed(1)} s`;
        this.notice.setText(this.attack.config.label+extra);
        const second=Math.ceil(remaining);
        if(this.countdownSecond!==second){this.countdownSecond=second;this.cue(440+second*100,.06);}
      } else if(this.state==='attack') this.notice.setText(this.attack.key==='shield'?'VUELVA MAÑANA · ESCUDO ACTIVO':this.attack.config.label+' · ¡CUIDADO!');
      else if(this.state==='idle'||this.state==='reposition') this.notice.setText(this.weather.active?'AGUACERO BOGOTANO':'DORMILÓN TE PERSIGUE');
    }
    if(now>=(this.hurtFlashUntil??0))this.actor.sprite.clearTint();
    this.name.setText(`DORMILÓN · FASE ${this.phase}`);
    const guarding=!this.dead && (now<this.guardUntil || (this.state==='attack' && this.attack?.key==='shield'));
    this.guard.setVisible(guarding).setPosition(this.x,this.y-this.actor.config.height/2).setDepth(this.y+1);
    this.blockLabel.setVisible(now<this.blockUntil).setPosition(this.x,this.y-this.actor.config.height-16);
    this.actor.sprite.setFlipX(this.facing<0);this.scene.placeFighter(this.actor);
    if(import.meta.env?.DEV) {
      // Nonvisual markers let browser development tools observe the canvas state.
      const element=this.scene.game.canvas.parentElement;
      element.dataset.bossState=this.state;element.dataset.bossAttack=this.attack?.key??'';
      element.dataset.bossPhase=String(this.phase);
    }
  }
  // Development console only. Force a single isolated attack for repeatable QA.
  debugAttack(key,options={}) {
    if((key!=='melee' && !BOSS.attacks[key]) || this.dead || this.ended)return false;
    this.stopEffects();this.state='idle';this.attack=null;this.scene.hurtUntil=0;
    const started=this.begin(key);
    if(started && key==='traffic' && typeof options.barrier==='boolean')this.hazards.plan.barrier=options.barrier;
    return started;
  }
  debugPhase(phase) {
    const hp=[BOSS.hp,BOSS.hp*.65,BOSS.hp*.3][phase-1];
    if(hp===undefined||this.dead)return false;
    this.hp=hp;this.phase=phase;this.bar.width=336*hp/BOSS.hp;this.stopEffects();this.state='transition';this.until=this.scene.combatTime+BOSS.transition;this.attack=null;return true;
  }
  snapshot() {return {hp:this.hp,phase:this.phase,state:this.state,attack:this.attack?.key,activeSystems:this.activeSystems,works:this.hazards.works.length,papers:this.status.stacks.length,speed:this.speed,rain:this.weather.active};}
  destroy() {
    this.stopAudio();this.hazards.destroy();this.weather.destroy();this.status.destroy();
    [this.name,this.barBack,this.bar,this.notice,this.blockLabel,this.guard,this.actor.sprite,this.actor.shadow].forEach(item=>item.destroy());
    if(import.meta.env?.DEV) {
      const element=this.scene.game.canvas.parentElement;
      delete element.dataset.bossState;delete element.dataset.bossAttack;delete element.dataset.bossPhase;
    }
  }
}
