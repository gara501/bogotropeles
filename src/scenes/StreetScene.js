import Phaser from 'phaser';
import { characters } from '../data/characters.js';
import { levels, levelTextures } from '../data/levels.js';
import { enemies, knife, projectileTextures } from '../data/enemies.js';
import { bossFor, BOSS_MUSIC } from '../data/bosses.js';
import { MiniBoss } from '../boss/MiniBoss.js';
import { GroundStains } from '../game/GroundStains.js';
import { GasClouds } from '../game/GasClouds.js';
import { registerAnimations, prepareEffects, prepareCutout } from '../data/spriteSheets.js';
import { IPHONE } from '../data/iphone.js';
import { IPhoneSpecial } from '../projectiles/IPhoneSpecial.js';
import { OrbitingBooks, prepareBookTextures } from '../specials/OrbitingBooks.js';
import { bossSprite, bossEffects } from '../boss/config.js';
import { BossController } from '../boss/BossController.js';
import { LevelMusic } from '../audio/LevelMusic.js';
import { MUSIC_TRACKS, chooseMusic } from '../audio/musicTracks.js';
import { RunState } from '../game/RunState.js';
import { SoundEffects, preloadEffects, enemyDeathSound, PLAYER_HURT_SOUNDS, PLAYER_DEATH_SOUNDS } from '../audio/SoundEffects.js';
import { WaveDirector } from '../combat/WaveDirector.js';
import { beginEnemyAttack, updateEnemyAttack } from '../combat/enemyAttacks.js';
import { beginEnemyCharge, updateEnemyCharge, shouldCharge } from '../combat/enemyCharge.js';
import { canSpendSpecialEnergy, spendSpecialEnergy } from '../combat/specialEnergy.js';
import { scaledEnemy, crossingHits } from '../data/campaign.js';
import { playerAttackHits, knifeHits, DASH, enemyCanAdvance, dashDirection } from '../combat.js';
import {ARCADE,fitArcadeCamera,fitArcadeText,applyPixelFilter} from '../data/arcade.js';
import {ArcadeRuntime} from '../game/ArcadeRuntime.js';
import {EnergyPickups} from '../game/EnergyPickups.js';
import {preloadPickups,preparePickups} from '../data/pickups.js';
import {StageCamera} from '../stage/StageCamera.js';
import {viewLeft} from '../stage/scroll.js';
import {Hud} from '../ui/Hud.js';

const FONT = "'IBM Plex Mono', monospace";
const FLOOR = { bottom: 500, left: 65, right: 895 };

export class StreetScene extends Phaser.Scene {
  constructor() { super('Street'); }

  init(data) {
    this.levelIndex = Phaser.Math.Clamp(data.level ?? 0, 0, levels.length - 1);
    this.run=data.run??this.game?.run??new RunState();this.run.level=this.levelIndex;
    this.level = {...levels[this.levelIndex],music:chooseMusic(this.game?.lastMusicKey)};
    if(this.game)this.game.lastMusicKey=this.level.music.key;
    this.floor = { ...FLOOR, top: this.level.top };
    this.characterKey = data.character || 'office';
    this.character = characters[this.characterKey];
    this.combatTime = 0;
    this.health = 100;
    this.deathHandled=false;this.waitingContinue=false;this.gameOver=false;this.respawnDelay=0;
    this.respawnProtectedUntil=0;this.victoryRemaining=0;this.pendingResult=null;
    this.defeated = 0;
    this.facing = 1;
    this.playerAttack = null;
    this.hurtUntil = 0;
    this.invulnerableUntil = 1000;
    this.dashUntil = 0;
    this.dashReadyAt = 0;
    this.specialReadyAt = 0;
    this.dashVector = { x: 1, y: 0 };
    this.nextGroupAttack = 1400;
    this.jumpStart = -1000;
    this.jumpHeight = 0;
    this.paused = false;
    this.finished = false;
    this.projectiles = [];
    this.boss = null;
    this.miniBoss = null;
    this.music = null;
    this.iphone = null;
    this.books = null;
    this.waves = null;
    this.stage = null;
    this.bossIntroShown = false;
    this.cinematic = false;
    this.transitioning = false;
    this.restarting = false;
    this.comboVictim = null;
    this.bossCheckpoint = Boolean(data.bossCheckpoint && this.level.boss);
    this.bossTest = import.meta.env.DEV ? data.bossTest : null;
    this.enemyTest = import.meta.env.DEV ? data.enemyTest : null;
    this.debugPreview = import.meta.env.DEV && Boolean(data.playerPreview);
  }

  preload() {
    preloadPickups(this);
    if(this.cameras?.main?.setZoom)fitArcadeCamera(this);
    preloadEffects(this);
    const label = this.add.text(480, 270, 'CARGANDO LA CIUDAD…', { fontFamily: FONT, fontSize: '18px', color: '#d6ed64' }).setOrigin(.5);
    this.load.once('complete', () => label.destroy());
    for (const level of levels) for (const asset of levelTextures(level)) if (!this.textures.exists(asset.key)) this.load.image(asset.key, asset.url);
    for (const [key, actor] of Object.entries({ ...characters, ...enemies, dormilon: bossSprite, 'boss-effects': bossEffects })) {
      if (!this.textures.exists(`${key}-source`)) this.load.image(`${key}-source`, actor.url);
      if (actor.appendUrl && !this.textures.exists(`${key}-append-source`)) this.load.image(`${key}-append-source`, actor.appendUrl);
    }
    if (!this.textures.exists('knife')) this.load.image('knife', knife.url);
    for (const [key, url] of Object.entries(projectileTextures)) if (!this.textures.exists(key)) this.load.image(key, url);
    if (bossFor(this.level)?.music && !this.cache.audio.exists(BOSS_MUSIC.key)) this.load.audio(BOSS_MUSIC.key, BOSS_MUSIC.url);
    // Menu shares this preload but has no selected level. Decode only one track
    // at a time, retaining it for fast restarts of the same level.
    if (this.level) {
      for (const track of MUSIC_TRACKS) if (track.key !== this.level.music.key) this.cache.audio.remove(track.key);
      if (!this.cache.audio.exists(this.level.music.key)) this.load.audio(this.level.music.key, this.level.music.url);
    }
  }

  create() {
    preparePickups(this);
    fitArcadeCamera(this);
    applyPixelFilter(this);
    for (const [key, config] of Object.entries({ ...characters, ...enemies })) registerAnimations(this, key, config);
    registerAnimations(this, 'dormilon', bossSprite);
    prepareEffects(this, 'boss-effects', bossEffects);
    prepareCutout(this,IPHONE.texture,'office-source',IPHONE.sourceRect);
    // Tear-gas canister and cloud stages from the level 5 boss sheet.
    enemies.antidisturbios.gasRects.forEach(([x,y,width,height],i)=>prepareCutout(this,`gas-${i}`,'antidisturbios-source',{x,y,width,height}));
    this.drawStreet();
    this.player = this.makeFighter(200, 450, this.characterKey, this.character);
    if(this.characterKey==='office')this.iphone=new IPhoneSpecial(this);
    if(this.characterKey==='student'){prepareBookTextures(this);this.books=new OrbitingBooks(this);}
    this.enemies = [];
    this.arcade=new ArcadeRuntime(this);
    Object.assign(this.floor,ARCADE.lanes[this.levelIndex]);
    this.waves = new WaveDirector(this);
    this.energyPickups=new EnergyPickups(this);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,H,J,K,L,SHIFT,SPACE,P,R,ENTER,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.playerName=this.add.text(26, 22, `${String(Object.keys(characters).indexOf(this.characterKey) + 1).padStart(2, '0')} / ${this.character.name}`, { fontFamily: FONT, fontSize: '15px', color: '#e8edce', fontStyle: 'bold' }).setDepth(1000);
    this.healthBack=this.add.rectangle(26, 51, 204, 12, 0x14282c).setOrigin(0).setDepth(1000);
    this.healthBar = this.add.rectangle(28, 53, 200, 8, this.character.color).setOrigin(0).setDepth(1000);
    this.dashStatus = this.add.text(26, 65, 'SHIFT / DASH LISTO', { fontFamily: FONT, fontSize: '10px', color: '#d6ed64' }).setDepth(1000);
    this.counter = this.add.text(934, 25, '', { fontFamily: FONT, fontSize: '13px', color: '#e8edce' }).setOrigin(1, 0).setDepth(1000);
    this.runStatus=this.add.text(934,52,'',{fontFamily:FONT,fontSize:'12px',color:'#d6ed64'}).setOrigin(1,0).setDepth(1000);
    this.updateRunStatus();
    this.updateCounter();
    this.timeLeft=ARCADE.hud.timeLimit*1000;
    if(ARCADE.hud.enabled){
      this.hud=new Hud(this);
      for(const item of [this.playerName,this.healthBack,this.healthBar,this.counter,this.runStatus])item.setVisible(false);
      this.dashStatus.setPosition(372,33);
      for(const special of [this.iphone,this.books])special?.label?.setPosition(372,50);
    }
    const extraControl = this.character.attacks.lowKick ? ' · L PATADA BAJA' : '';
    const controlsHint=this.game.touchControls?.mobile()
      ? 'JOYSTICK MOVER · PUÑO · PATADA · ESPECIAL −10 ENERGÍA · SALTO · Ⅱ PAUSA'
      : `H PUÑO · J PATADA · K ${this.character.specialLabel}${extraControl} · SHIFT ${this.character.dash === false ? this.character.specialLabel : 'DASH'} · ESPACIO SALTO · P PAUSA · R REINICIAR`;
    this.controlsLabel=this.add.text(480, 521, controlsHint, { fontFamily: FONT, fontSize: '10px', color: '#d9e2c8' }).setOrigin(.5).setDepth(1000);
    this.overlay = this.add.container(480, 260, [
      this.add.rectangle(0, 0, 560, 140, 0x142127, .95),
      this.add.text(0, -16, '', { fontFamily: FONT, fontSize: '26px', color: '#d6ed64', align: 'center' }).setOrigin(.5),
      this.add.text(0, 30, '', { fontFamily: FONT, fontSize: '12px', color: '#e0e7d2', align: 'center' }).setOrigin(.5),
    ]).setDepth(2000).setVisible(false);
    this.music = new LevelMusic(this, this.level.music.key);
    this.sfx = new SoundEffects(this.sound,this.cache.audio);
    if(this.bossCheckpoint) {
      this.waves.skipToEnd();this.stage.jumpToArena(this.waves.arena);this.defeated=this.level.total;this.bossIntroShown=true;this.spawnBoss();
    } else this.waves.update();
    if(this.debugPreview) {
      this.invulnerableUntil=Infinity;
      this.enemies.forEach((enemy,index)=>{enemy.x=560+index*120;enemy.y=index?this.floor.top:450;});
    }
    if(import.meta.env.DEV && this.enemyTest && (enemies[this.enemyTest]?.combo || enemies[this.enemyTest]?.charge)) {
      for(const enemy of this.enemies)for(const object of [enemy.sprite,enemy.shadow,enemy.healthBar,enemy.tell])object.destroy();
      this.enemies=[];this.waves.spawned=this.level.total;this.defeated=this.level.total-1;
      const enemy=this.spawnEnemy(this.enemyTest,0,0,2,0);
      enemy.x=450;enemy.y=450;enemy.config.speed=0;enemy.nextHit=Infinity;
      this.player.x=400;this.player.y=450;this.nextGroupAttack=Infinity;this.updateCounter();
    }
    this.game.events.emit('level-start', this.levelIndex);
    // HUD stays on screen while the camera scrolls (depth >= 999 is the HUD band).
    for(const object of this.children.list)if(object.depth>=999)object.setScrollFactor(0);
    for(const object of this.children.list)if(object.type==='Text' && object.depth>=999)fitArcadeText(object);
    for(const object of this.overlay.list)if(object.type==='Text')fitArcadeText(object);
    this.events.once('shutdown', () => {
      this.energyPickups?.destroy();this.energyPickups=null;
      this.arcade?.destroy();this.arcade=null;
      this.music?.destroy(); this.music = null;
      this.sfx?.destroy();this.sfx=null;
      this.iphone?.destroy(); this.iphone = null;
      this.books?.destroy(); this.books = null;
      this.waves = null;
      this.stage?.destroy(); this.stage = null;
      this.boss?.destroy(); this.boss = null;
      this.miniBoss?.destroy(); this.miniBoss = null;
      this.stains?.clear(); this.stains = null;
      this.gas?.clear(); this.gas = null;
    });
    if (this.bossTest && this.level.boss) {
      this.enemies.forEach(enemy => { enemy.hp=0; enemy.sprite.setVisible(false); enemy.shadow.setVisible(false); enemy.healthBar.setVisible(false); enemy.tell.setVisible(false); });
      this.defeated=this.level.total;this.waves.skipToEnd();this.stage.jumpToArena(this.waves.arena);this.bossIntroShown=true;this.spawnBoss();
      if (this.bossTest !== 'entry') this.boss?.debugAttack(this.bossTest);
    }
  }

  makeFighter(x, y, key, config) {
    const shadow = this.add.ellipse(x, y, ['rider','vendor'].includes(key) ? 90 : 48, 12, 0x122a2c, .35);
    const sprite = this.add.sprite(x, y, key, config.idle ?? 6).setOrigin(.5, 1);
    sprite.setScale(config.height / this.textures.get(key).referenceHeight);
    return { x, y, key, config, sprite, shadow };
  }

  spawnEnemy(key,index,slot,count,wave) {
    const config=scaledEnemy(enemies[key],this.level),crossing=this.level.crossingEnemies?.includes(key)??false;
    const facing=(wave+slot)%2?1:-1;
    const y=this.floor.top+18+slot*(this.floor.bottom-this.floor.top-32)/Math.max(1,count-1);
    const vx=viewLeft(this);
    const x=crossing?(facing>0?vx-100-slot*90:vx+1060+slot*90):(facing>0?this.floor.left+14:this.floor.right-14);
    const enemy=this.makeFighter(x,y,key,config);
    Object.assign(enemy,{hp:config.hp,index,slot,nextHit:this.combatTime+1400+slot*300,
      actionUntil:0,pending:null,crossing,facing,crossingHit:false});
    enemy.healthBar=this.add.rectangle(x,y-config.height-10,42,4,0xd6ed64).setOrigin(0,.5);
    enemy.tell=this.add.text(x,y-config.height-30,'!',{fontFamily:FONT,fontSize:'22px',color:'#ffcf69',fontStyle:'bold'}).setOrigin(.5).setVisible(false);
    if(config.taunt) {
      // Speech bubble that follows the enemy for a moment after it appears (taunt.color: team colours, default dark).
      enemy.taunt=this.add.text(x,y-config.height-50,config.taunt.text,{fontFamily:FONT,fontSize:'12px',color:config.taunt.color??'#14282c',fontStyle:'bold',
        backgroundColor:'#f4f1e6',padding:{x:6,y:3}}).setOrigin(.5,1).setDepth(950); // above front props, below the HUD
      enemy.tauntUntil=this.combatTime+config.taunt.ms;
    }
    if(crossing) {
      this.sfx?.play('moto');
      enemy.crossingSpeed=ARCADE.hazards.motoSpeed;
      enemy.sprite.play({key:`${key}-attack`,repeat:-1});
    }
    enemy.sprite.setFlipX(facing<0);this.enemies.push(enemy);this.placeFighter(enemy);
    return enemy;
  }

  drawStreet() {
    // The stage owns the parallax background, camera scroll and walkable floor span.
    this.stage = new StageCamera(this);
    this.add.rectangle(0, 0, 960, 78, 0x142127, .72).setOrigin(0).setDepth(999);
    this.add.rectangle(0, 507, 960, 33, 0x142127, .72).setOrigin(0).setDepth(999);
  }

  play(actor, state, duration) {
    actor.sprite.anims.timeScale = duration ? actor.config.animations[state].length / 12 * 1000 / duration : 1;
    actor.sprite.play(`${actor.key}-${state}`, true);
  }

  idle(actor) {
    actor.sprite.stop();
    actor.sprite.setFrame(actor.config.idle ?? 6);
  }

  nextLevel() {
    if (this.finished && this.health > 0 && !this.transitioning && !this.victoryRemaining && this.levelIndex < levels.length - 1) {
      this.transitioning=true;
      this.run.advance(this.levelIndex+1);
      this.game.events.emit('level-transition',{character:this.characterKey,level:this.levelIndex+1});
    }
  }

  restartLevel() {
    if(this.restarting || this.cinematic || this.waitingContinue || this.gameOver || (this.finished && this.level.boss))return false;
    this.restarting=true;
    if(!this.boss && !this.miniBoss)this.run.score=this.run.levelStartScore;
    const data={character:this.characterKey,level:this.levelIndex,bossCheckpoint:Boolean(this.level.boss && (this.boss || this.miniBoss)),run:this.run};
    this.game.events.emit('level-restart');this.scene.restart(data);return true;
  }

  updateCounter() {
    this.counter.setText(`NIVEL ${this.levelIndex + 1}/6 · ${this.boss ? 'JEFE FINAL' : this.miniBoss ? 'JEFE' : `${this.defeated}/${this.level.total} ${this.level.mode==='crossing'?'RESUELTOS':'DERROTADOS'}`}`);
  }

  updateRunStatus(){this.runStatus?.setText(`VIDAS ${this.run.lives} · PUNTOS ${this.run.score}`);}
  addScore(points){this.run.award(points);this.updateRunStatus();}

  switchCharacter(key) {
    if(!characters[key] || this.gameOver)return false;
    this.iphone?.destroy();this.books?.destroy();this.iphone=null;this.books=null;
    this.characterKey=key;this.character=characters[key];this.player.key=key;this.player.config=this.character;
    this.playerAttack=null;this.comboVictim=null;this.dashUntil=0;this.dashReadyAt=0;this.specialReadyAt=0;
    this.jumpStart=-1000;this.jumpHeight=0;
    this.arcade?.resetPlayer();
    this.player.sprite.stop().setTexture(key,this.character.idle).setScale(this.character.height/this.textures.get(key).referenceHeight);
    this.healthBar.setFillStyle(this.character.color);this.healthBar.width=this.health*2;
    this.playerName.setText(`${String(Object.keys(characters).indexOf(key)+1).padStart(2,'0')} / ${this.character.name}`);
    this.hud?.setPlayer();
    if(key==='office')this.iphone=new IPhoneSpecial(this);
    if(key==='student'){prepareBookTextures(this);this.books=new OrbitingBooks(this);}
    if(this.arcade)for(const special of [this.iphone,this.books])if(special)fitArcadeText(special.label);
    this.controlsLabel?.setText(this.game.touchControls?.mobile?.()?'JOYSTICK MOVER · PUÑO · PATADA · ESPECIAL −10 ENERGÍA · SALTO · Ⅱ PAUSA':`H PUÑO · J PATADA · K ${this.character.specialLabel}${key==='student'?' · L PATADA BAJA':''} · SHIFT DASH · ESPACIO SALTO · P PAUSA · R REINICIAR`);
    this.input.keyboard.resetKeys();this.placeFighter(this.player);
    if(this.finished && this.health>0)this.play(this.player,'victory',1000);else this.idle(this.player);
    return true;
  }

  handleDeath() {
    if(this.deathHandled)return;
    this.deathHandled=true;this.run.loseLife();this.updateRunStatus();
    this.iphone?.clear();this.books?.clear();this.playerAttack=null;this.comboVictim=null;
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];
    this.enemies.forEach(e=>{e.pending=null;e.tell.setVisible(false);e.sprite.anims.pause();});
    this.boss?.setPaused(true);this.music?.setPaused(true);this.sfx?.stop();
    const deathSound=PLAYER_DEATH_SOUNDS[this.characterKey];if(deathSound)this.sfx?.play(deathSound);
    this.game.events.emit('player-death');
    if(this.run.lives>0)this.respawnDelay=900;
    else if(this.run.canContinue){this.waitingContinue=true;this.sfx?.play('lose');this.game.events.emit('continue-needed');}
    else {this.sfx?.play('lose');this.endRun();} // no continues left: straight to game over
  }

  respawn() {
    this.health=100;this.healthBar.width=200;this.deathHandled=false;this.respawnDelay=0;this.timeLeft=ARCADE.hud.timeLimit*1000;
    this.player.x=this.floor.left+135;this.player.y=Math.max(this.floor.top,Math.min(450,this.floor.bottom));
    this.playerAttack=null;this.comboVictim=null;this.jumpStart=-1000;this.jumpHeight=0;this.dashUntil=0;this.hurtUntil=0;
    this.arcade?.resetPlayer(true);
    this.respawnProtectedUntil=this.combatTime+Math.round(ARCADE.player.respawnInvulnerable*ARCADE.clock.stepMs);this.invulnerableUntil=this.respawnProtectedUntil;
    this.enemies.forEach(e=>{e.sprite.anims.resume();e.actionUntil=this.combatTime+500;e.nextHit=Math.max(e.nextHit,this.combatTime+1000);});
    this.boss?.status?.clear();this.boss?.setPaused(false);this.music?.setPaused(false);
    this.input.keyboard.resetKeys();this.idle(this.player);this.placeFighter(this.player);this.updateRunStatus();
    this.game.events.emit('player-respawn');
  }

  continueRun() {
    if(!this.waitingContinue || this.gameOver)return false;
    if(!this.run.continue())return false;this.waitingContinue=false;this.finished=false;this.respawn();return true;
  }

  endRun() {
    this.waitingContinue=false;this.finished=true;this.gameOver=true;
    this.music?.stop();this.boss?.finish();this.game.events.emit('game-over');
  }

  beginBossIntro() {
    if(this.bossIntroShown || this.boss || this.miniBoss || !this.level.boss || !this.waves.cleared || this.health<=0)return false;
    // Enemy-type bosses skip the intro screen: they run in with an on-screen notice and their own music.
    if(bossFor(this.level)?.kind==='enemy'){this.bossIntroShown=true;this.spawnBoss();return true;}
    this.bossIntroShown=true;this.cinematic=true;this.playerAttack=null;
    if(this.arcade){this.arcade.player.transition('walk');this.arcade.clearInput();this.arcade.combat.tokens.clear();}
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];
    this.iphone?.clear();this.books?.clear();this.music?.setPaused(true);
    this.sfx?.stop();
    for(const enemy of this.enemies) {
      this.tweens.killTweensOf(enemy.sprite);
      enemy.sprite.setVisible(false);enemy.shadow.setVisible(false);
      enemy.healthBar.setVisible(false);enemy.tell.setVisible(false);enemy.taunt?.setVisible(false);
    }
    this.game.events.emit('boss-intro');return true;
  }

  resumeBoss() {
    if(!this.cinematic || !this.bossIntroShown || this.health<=0)return;
    this.cinematic=false;this.input.keyboard.resetKeys();this.music?.setPaused(false);this.spawnBoss();
  }

  spawnBoss() {
    if(this.boss || this.miniBoss || !this.level.boss) return;
    this.dropBossRefill();
    const def=bossFor(this.level);
    if(def?.kind==='enemy')return this.spawnMiniBoss(def);
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];
    this.playerAttack=null;this.invulnerableUntil=this.combatTime+2000;
    this.boss=new BossController(this,bossSprite);this.updateCounter();
  }

  /** Before every level boss: a changua (full energy) on the floor just ahead of the player. */
  dropBossRefill() {
    const pickups=this.energyPickups;if(!pickups)return null;
    const ahead=this.player.x+(this.facing??1)*110,x=Math.max(this.floor.left+30,Math.min(this.floor.right-30,ahead));
    return pickups.drop(x,Math.max(this.floor.top+20,Math.min(this.floor.bottom,this.player.y)),'full');
  }

  spawnMiniBoss(def) {
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];
    const enemy=this.spawnEnemy(def.enemy,this.level.total,0,1,0);
    enemy.healthBar.setVisible(false);enemy.y=Math.round((this.floor.top+this.floor.bottom)/2);this.placeFighter(enemy);
    this.miniBoss=new MiniBoss(this,enemy,def);
    if(def.music && this.sound){this.music?.destroy();this.music=new LevelMusic(this,def.music);}
    this.updateCounter();return this.miniBoss;
  }

  showOverlay(title, subtitle) {
    this.overlay.list[1].setText(title); this.overlay.list[2].setText(subtitle);
    this.overlay.setVisible(true);
  }

  startAttack(type) {
    if(this.health<=0 || this.finished || this.paused || this.cinematic)return;
    if(this.arcade){this.arcade.player.request(type);return;}
    if(type==='iphone')return this.iphone?.start();
    if(type==='books')return this.books?.start();
    const attack = this.character.attacks[type];
    const airborne = this.combatTime - this.jumpStart < 650;
    if(type==='punch' && this.character.punchCombo && this.playerAttack?.comboStage!==undefined) {
      const current=this.playerAttack;
      current.queued=Math.min(current.queued+1,this.character.punchCombo.animations.length-current.comboStage-1);
      return;
    }
    if (!attack || this.playerAttack || this.combatTime < this.hurtUntil || this.combatTime < this.dashUntil || (airborne && type !== 'kick')) return;
    if (type === this.character.special && this.combatTime < this.specialReadyAt) return;
    if(type===this.character.special && !canSpendSpecialEnergy(this))return;
    if (attack.cooldown && type!==this.character.special) this.specialReadyAt = this.combatTime + attack.cooldown;
    if(type==='punch' && this.character.punchCombo)return this.startPunchStage(0,0,this.facing);
    this.playerAttack = { ...attack, type, start: this.combatTime, facing: this.facing, hit: false };
    if(type==='punch')this.sfx?.play('punch');
    else if(type==='kick' || type==='lowKick')this.sfx?.play('kick');
    this.play(this.player, type, attack.duration);
  }

  startPunchStage(stage,queued,facing) {
    const combo=this.character.punchCombo,attack=this.character.attacks.punch;
    this.playerAttack={...attack,type:'punch',comboStage:stage,queued,start:this.combatTime,facing,hit:false,
      // Keep a connected target in reach until the finisher pushes it away.
      knockback:stage===combo.animations.length-1?attack.knockback:0,stun:combo.stun};
    this.sfx?.play('punch');
    this.play(this.player,combo.animations[stage],attack.duration);
  }

  startDash(dx, dy) {
    if(this.arcade)return this.arcade.player.dash(dx,dy);
    if (this.character.dash === false) { this.startAttack(this.character.special); return; }
    if (this.combatTime < this.dashReadyAt || this.combatTime < this.hurtUntil || this.jumpHeight > 5) return;
    // Dash can cancel an attack, providing a deliberate escape during recovery.
    this.playerAttack = null;
    this.comboVictim = null;
    this.dashVector = dashDirection(dx, dy, this.facing);
    if (this.dashVector.x) this.facing = Math.sign(this.dashVector.x);
    this.dashUntil = this.combatTime + DASH.duration;
    this.dashReadyAt = this.combatTime + DASH.cooldown;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.dashUntil + 100);
    this.play(this.player, this.character.animations.dash ? 'dash' : 'walk', DASH.duration);
  }

  hitEnemy(enemy, attack) {
    if(enemy.hp<=0 || this.combatTime<(enemy.invulnerableUntil??0))return; // e.g. a boss mid-evade
    this.lastHit={enemy,at:this.combatTime};
    if(enemy.config.shield && this.shieldBlocks(enemy,attack)) {
      const damage=Math.max(1,Math.round(attack.damage*enemy.config.shield.frontDamage));
      if(enemy.hp>damage){this.blockHit(enemy,damage);return;}
      attack={...attack,damage}; // the chip damage finishes him off: fall through to the normal defeat
    }
    enemy.hp = Math.max(0, enemy.hp - attack.damage);
    if(attack.radialKnockback) {
      const dx=enemy.x-this.player.x,dy=enemy.y-this.player.y,length=Math.hypot(dx,dy)||1;
      enemy.x=Phaser.Math.Clamp(enemy.x+dx/length*attack.knockback,this.floor.left,this.floor.right);
      enemy.y=Phaser.Math.Clamp(enemy.y+dy/length*attack.knockback,this.floor.top,this.floor.bottom);
    } else {
      const direction = attack.area ? (Math.sign(enemy.x - this.player.x) || attack.facing) : attack.facing;
      enemy.x = Phaser.Math.Clamp(enemy.x + direction * attack.knockback, this.floor.left, this.floor.right);
      if (attack.area) enemy.y = Phaser.Math.Clamp(enemy.y + Math.sign(enemy.y - this.player.y) * attack.knockback * .5, this.floor.top, this.floor.bottom);
    }
    if(this.comboVictim===enemy.pending)this.comboVictim=null;
    enemy.pending = null; // Counterattacks cancel knives and the remaining combo.
    enemy.recoveryPoseUntil=0;
    enemy.tell.setVisible(false);
    enemy.actionUntil = this.combatTime + (attack.stun ?? 300);
    enemy.nextHit = this.combatTime + 1100;
    enemy.healthBar.width = 42 * enemy.hp / enemy.config.hp;
    // Minion variants share one texture: show their own row's pose instead of the shared animation.
    if (enemy.config.frameOffset != null) enemy.sprite.stop().setFrame(enemy.config.animations[enemy.hp === 0 ? 'defeat' : 'hurt'][0] + enemy.config.frameOffset);
    else this.play(enemy, enemy.hp === 0 ? 'defeat' : 'hurt');
    if (enemy.hp === 0) {
      // A boss is not part of the wave count; it pays its own bonus.
      this.addScore(enemy.config.boss ? (bossFor(this.level)?.score ?? 1000) : enemy.config.minion ? 50 : 100);
      enemyDeathSound(this,enemy);
      if(!enemy.config.boss && !enemy.config.minion)this.defeated++;
      enemy.shadow.setVisible(false); enemy.healthBar.setVisible(false); enemy.taunt?.setVisible(false);
      this.tweens.add({ targets: enemy.sprite, alpha: 0, delay: 650, duration: 250 });
      this.updateCounter();
    }
    this.arcade?.enemyHit(enemy,attack);
  }

  /** A shield bearer blocks every hit that comes at his front (the side he faces). */
  shieldBlocks(enemy,attack) {
    if(!enemy.config.shield)return false;
    const facing=enemy.facing??(enemy.sprite.flipX?-1:1);
    const incoming=attack.area || attack.radialKnockback?(Math.sign(enemy.x-this.player.x)||attack.facing):attack.facing;
    return incoming===-facing;
  }

  /** Blocked: chip damage only, no stagger or knockback; the attacker bounces off the shield. */
  blockHit(enemy,damage) {
    enemy.hp-=damage;enemy.healthBar.width=42*enemy.hp/enemy.config.hp;
    this.sfx?.play('metalCrack');
    const facing=enemy.facing??(enemy.sprite.flipX?-1:1);
    this.player.x=Phaser.Math.Clamp(this.player.x+facing*14,this.floor.left,this.floor.right);
    this.arcade?.combat.impact(this.player,enemy,{finisher:false});enemy.sprite.setTintFill?.(0x9ad8ff);
    if(!this.add?.text)return;
    const label=this.add.text(enemy.x,enemy.y-enemy.config.height-26,'¡BLOQUEADO!',{fontFamily:FONT,fontSize:'12px',color:'#9ad8ff',stroke:'#142127',strokeThickness:3}).setOrigin(.5).setDepth(951);
    this.tweens?.add?.({targets:label,y:label.y-18,alpha:0,duration:520,onComplete:()=>label.destroy()});
  }

  hitPlayer(damage,combo=null,source=null) {
    if(this.combatTime<this.respawnProtectedUntil)return false;
    const followup=combo && combo===this.comboVictim && combo.connected && combo.enemy.pending===combo && combo.enemy.hp>0 && this.combatTime>=this.dashUntil;
    if ((this.combatTime < this.invulnerableUntil && !followup) || this.health <= 0 || this.paused || this.finished || this.cinematic) return false;
    this.comboVictim=combo;
    this.health = Math.max(0, this.health - damage);
    if(this.health===0){this.books?.clear();this.comboVictim=null;}
    this.healthBar.width = this.health * 2;
    this.invulnerableUntil = this.combatTime + 1000;
    this.hurtUntil = this.combatTime + 150;
    this.playerAttack = null;
    this.play(this.player, this.health === 0 ? 'defeat' : 'hurt');
    if(!this.arcade)this.cameras.main.shake(90,.003);
    this.arcade?.playerHit(combo,source);
    const hurtSound=PLAYER_HURT_SOUNDS[this.characterKey];if(hurtSound)this.sfx?.play(hurtSound);
    return true;
  }

  throwKnife(enemy, facing) {
    this.sfx?.play('knife');
    const x = enemy.x + facing * 55;
    const sprite = this.add.image(x, enemy.y - 78, 'knife').setDisplaySize(knife.width, knife.width)
      .setRotation(Math.PI / 4 + (facing < 0 ? Math.PI : 0)).setDepth(enemy.y + 1);
    this.projectiles.push({ x, y: enemy.y, facing, damage: enemy.config.damage, sprite,owner:enemy });
  }

  /** A wave of minions running in from both screen edges (level 4 boss). */
  summonMinions(owner, summon) {
    owner.summonWave = (owner.summonWave ?? 0) + 1;
    const alive = this.enemies.filter(e => e.hp > 0 && e.summoner === owner).length;
    const count = Math.min(summon.counts[(owner.summonWave - 1) % summon.counts.length], summon.maxAlive - alive); // never exceed the cap
    for (let slot = 0; slot < count; slot++) {
      const index = 100 + (this.minionCount = (this.minionCount ?? 0) + 1);
      const minion = this.spawnEnemy(summon.enemy, index, slot, count, owner.summonWave);
      const variant = (index - 101) % summon.variants;
      minion.config = { ...minion.config, frameOffset: variant * minion.config.rows[0] };
      minion.summoner = owner;minion.sprite.setFrame(minion.config.idle + minion.config.frameOffset);
    }
  }

  /** When a summoner falls, its remaining minions run off. */
  dismissMinions(owner) {
    for (const e of this.enemies) if (e.hp > 0 && e.summoner === owner) {
      e.hp = 0;e.pending = null;e.tell.setVisible(false);e.healthBar.setVisible(false);e.shadow.setVisible(false);
      this.tweens.add({ targets: e.sprite, alpha: 0, duration: 400 });
    }
  }

  /** A row of paint stains in front of a spraying enemy. */
  paintFloor(enemy, facing, paint) {
    for (let i = 0; i < paint.stains; i++) this.paintStain(enemy.x + facing * (paint.start + i * paint.spacing), enemy.y, paint, enemy);
  }

  paintStain(x, y, options, owner = null) {
    this.stains ??= new GroundStains(this);
    return this.stains.spawn(x, y, { ...options, owner });
  }

  throwProjectile(enemy, facing, config, damage) {
    // Released where the drawn object is in the throw pose (ball, pigeon…); faces its direction of travel.
    const x = enemy.x + facing * (config.offset ?? 70);
    const sprite = this.add.image(x, enemy.y - (config.lift ?? 70), config.texture).setDisplaySize(config.width, config.height).setDepth(enemy.y + 1);
    sprite.setFlipX?.(facing < 0);
    // Gas canisters are lobbed at where the player stands (within the throw range) and burst on landing.
    const target = config.gas ? Phaser.Math.Clamp(Math.abs(this.player.x - x), config.minRange * .6, config.maxRange) : null;
    this.projectiles.push({ x, y: enemy.y, facing, damage, sprite, owner:enemy, speed:config.speed, spin:config.spin ?? 0, texture:config.texture,
      gas:config.gas, startX:x, landX:config.gas ? x + facing * target : null, lift:config.lift ?? 70 });
  }

  updateProjectiles(dt) {
    this.projectiles = this.projectiles.filter(projectile => {
      const previous = projectile.x;
      projectile.x += projectile.facing * (projectile.speed ?? knife.speed) * dt;
      projectile.sprite.x = projectile.x;
      if (projectile.spin) projectile.sprite.rotation += projectile.facing * projectile.spin * dt;
      if (projectile.gas) {
        const total = Math.abs(projectile.landX - projectile.startX) || 1, t = Math.min(1, Math.abs(projectile.x - projectile.startX) / total);
        projectile.sprite.y = projectile.y - projectile.lift * (1 - t) - (projectile.gas.arc ?? 80) * 4 * t * (1 - t);
        projectile.sprite.rotation += projectile.facing * 9 * dt;
        if (t < 1) return true;
        projectile.sprite.destroy();
        (this.gas ??= new GasClouds(this)).spawn(projectile.landX, projectile.y, projectile.gas, projectile.owner);
        return false;
      }
      const ducking = this.playerAttack?.type === 'lowKick';
      const hit = !ducking && knifeHits(previous, projectile.x, projectile.y, this.player, this.jumpHeight);
      if (hit) this.hitPlayer(projectile.damage,null,projectile.owner);
      const vx = viewLeft(this);
      if (hit || projectile.x < vx-40 || projectile.x > vx+1000) { projectile.sprite.destroy(); return false; }
      return true;
    });
  }

  updateEnemies(dt) {
    if(this.debugPreview) {
      for(const enemy of this.enemies) {
        this.placeFighter(enemy);
        enemy.healthBar.setPosition(enemy.x-21,enemy.y-enemy.config.height-10).setDepth(enemy.y+1);
      }
      return;
    }
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if(enemy.crossing) {this.updateCrossing(enemy,dt);continue;}
      const ex = this.player.x - enemy.x, ey = this.player.y - enemy.y;
      if(enemy.pending?.kind==='charge')updateEnemyCharge(this,enemy,dt);else updateEnemyAttack(this,enemy);
      if(enemy.recoveryPoseUntil && this.combatTime>=enemy.recoveryPoseUntil) {enemy.recoveryPoseUntil=0;this.idle(enemy);}
      if (this.combatTime >= enemy.actionUntil) {
        enemy.sprite.setFlipX(ex < 0);
        const desired = enemy.config.keepDistance ?? (enemy.config.ranged ? 240 : enemy.config.range - 12);
        const advancing = enemy.config.aggressive || enemyCanAdvance(this.combatTime, enemy.index);
        let moveX = advancing && Math.abs(ex) > desired ? Math.sign(ex) : 0;
        if (advancing && (enemy.config.ranged || enemy.config.retreatDistance) && Math.abs(ex) < (enemy.config.retreatDistance??160)) moveX = -Math.sign(ex);
        const moveY = advancing && Math.abs(ey) > 8 ? Math.sign(ey) : 0;
        enemy.x = Phaser.Math.Clamp(enemy.x + moveX * enemy.config.speed * dt, this.floor.left, this.floor.right);
        enemy.y = Phaser.Math.Clamp(enemy.y + moveY * enemy.config.speed * .55 * dt, this.floor.top, this.floor.bottom);
        if (moveX || moveY) this.play(enemy, 'walk'); else this.idle(enemy);
        const attackRange=enemy.config.charge?.triggerRange??enemy.config.range;
        if (Math.abs(ex) <= attackRange && Math.abs(ey) < 26 && this.combatTime >= enemy.nextHit && this.combatTime >= this.nextGroupAttack) {
          if(shouldCharge(enemy,Math.abs(ex)))beginEnemyCharge(this,enemy,ex<0?-1:1);
          else beginEnemyAttack(this,enemy,ex<0?-1:1);
        }
      }
      this.placeFighter(enemy);
      enemy.tell.setPosition(enemy.x, enemy.y - enemy.config.height - 30).setDepth(enemy.y + 2);
      enemy.healthBar.setPosition(enemy.x - 21, enemy.y - enemy.config.height - 10).setDepth(enemy.y + 1);
    }
  }

  updateCrossing(enemy,dt) {
    if(enemy.hp<=0)return;
    const previous=enemy.x;
    // Direction and lane are fixed at entry; this behavior never tracks the player.
    enemy.x+=enemy.facing*enemy.crossingSpeed*dt;
    if(crossingHits(previous,enemy.x,enemy,this.player,this.jumpHeight) && this.hitPlayer(enemy.config.damage))enemy.crossingHit=true;
    if(this.combatTime>=enemy.actionUntil && !enemy.sprite.anims.isPlaying) {
      enemy.sprite.play({key:`${enemy.key}-attack`,repeat:-1});
    }
    if(enemy.facing>0?enemy.x>viewLeft(this)+1100:enemy.x<viewLeft(this)-140) {
      enemy.hp=0;enemy.pending=null;
      enemy.sprite.setVisible(false);enemy.shadow.setVisible(false);enemy.healthBar.setVisible(false);enemy.tell.setVisible(false);
      this.defeated++;this.updateCounter();return;
    }
    this.placeFighter(enemy);
    enemy.healthBar.setPosition(enemy.x-21,enemy.y-enemy.config.height-10).setDepth(enemy.y+1);
  }

  /** TIME countdown: restarts in each arena and when the boss appears; at 0 the player loses a life. */
  tickClock() {
    const limit=ARCADE.hud.timeLimit*1000;if(!this.hud || !limit)return;
    const section=`${this.waves?.arena}|${Boolean(this.boss || this.miniBoss)}`;
    if(section!==this.clockSection){this.clockSection=section;this.timeLeft=limit;}
    if(this.health<=0 || this.cinematic || this.pendingResult)return;
    this.timeLeft=Math.max(0,this.timeLeft-ARCADE.clock.stepMs);
    if(this.timeLeft===0){this.invulnerableUntil=0;this.respawnProtectedUntil=0;this.hitPlayer(this.health);}
  }

  update(_time, delta) {
    this.hud?.update();
    if(this.arcade){
      const runtime=this.arcade;
      runtime.capture(this.arcadeInput());
      // Input can synchronously stop or restart this scene.
      if(this.arcade===runtime)runtime.update(delta);
      return;
    }
    if(this.cinematic)return;
    if(this.health<=0 && !this.gameOver) {
      this.handleDeath();
      if(this.waitingContinue || this.gameOver)return;
      this.respawnDelay-=Math.min(delta,50);
      if(this.respawnDelay<=0)this.respawn();
      return;
    }
    if(this.pendingResult) {
      this.victoryRemaining=Math.max(0,this.victoryRemaining-Math.min(delta,50));
      if(!this.victoryRemaining){const result=this.pendingResult;this.pendingResult=null;this.game.events.emit('level-result',result);}
      return;
    }
    const k = this.keys;
    const touch=this.game.touchControls?.input;
    const tappedActions=new Set(touch?.pressed);
    const pressed=key=>{const tapped=touch?.justDown(key);return Phaser.Input.Keyboard.JustDown(k[key]) || tapped;};
    const held=key=>k[key].isDown || touch?.isDown(key) || tappedActions.has(key);
    if(pressed('R')){this.restartLevel();return;}
    if(this.finished && pressed('ENTER')) {
      if(this.health<=0)this.restartLevel();else this.nextLevel();
      return;
    }
    if (pressed('P') && !this.finished) {
      this.paused = !this.paused;
      [this.player, ...this.enemies].forEach(actor => this.paused ? actor.sprite.anims.pause() : actor.sprite.anims.resume());
      this.boss?.setPaused(this.paused);
      this.music?.setPaused(this.paused);
      this.sfx?.setPaused(this.paused);
      if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
      this.overlay.setVisible(this.paused);
      if (this.paused) this.showOverlay('PAUSA', this.game.touchControls?.mobile?.()?'TOCA ▶ PARA VOLVER A LA CALLE':'P PARA VOLVER A LA CALLE');
      this.game.events.emit('combat-paused',this.paused);
    }
    if (this.paused || this.finished) return;
    const dt = Math.min(delta, 50) / 1000;
    this.combatTime += dt * 1000;
    const specialPressed=pressed('K');
    const punchPressed=pressed('H');
    const previous = { x:this.player.x, y:this.player.y };
    if(this.boss) {
      if(punchPressed)this.boss.status.shake();
      for(const key of ['J','L']) if(pressed(key))this.boss.status.shake();
      if(specialPressed)this.boss.status.shake();
    }
    const keyboardX=Number(k.D.isDown || k.RIGHT.isDown)-Number(k.A.isDown || k.LEFT.isDown);
    const keyboardY=Number(k.S.isDown || k.DOWN.isDown)-Number(k.W.isDown || k.UP.isDown);
    const dx=keyboardX || touch?.x || 0,dy=keyboardY || touch?.y || 0;
    const length = Math.max(1,Math.hypot(dx, dy));
    if (pressed('SHIFT')) this.startDash(dx, dy);
    const dashing = this.combatTime < this.dashUntil;
    const free = !dashing && !this.playerAttack && this.combatTime >= this.hurtUntil;
    if (dashing) {
      this.player.x = Phaser.Math.Clamp(this.player.x + this.dashVector.x * DASH.speed * dt, this.floor.left, this.floor.right);
      this.player.y = Phaser.Math.Clamp(this.player.y + this.dashVector.y * DASH.speed * dt, this.floor.top, this.floor.bottom);
    }
    const canMove = free || (!dashing && this.playerAttack?.type === 'kick' && this.combatTime - this.jumpStart < 650);
    const movement = this.boss ? this.boss.weather.movement(dx,dy,this.boss.speed,dt,canMove && !dashing)
      : {x:dx/length*this.character.speed*dt,y:dy/length*this.character.speed*.65*dt};
    if (canMove) {
      this.player.x = Phaser.Math.Clamp(this.player.x + movement.x, this.floor.left, this.floor.right);
      this.player.y = Phaser.Math.Clamp(this.player.y + movement.y, this.floor.top, this.floor.bottom);
      if (dx && !this.playerAttack) this.facing = Math.sign(dx);
      if (free && pressed('SPACE') && this.combatTime - this.jumpStart > 650) this.jumpStart = this.combatTime;
    }
    this.boss?.hazards.resolveMovement(previous);
    const jumpProgress = (this.combatTime - this.jumpStart) / 650;
    this.jumpHeight = jumpProgress < 1 ? Math.sin(jumpProgress * Math.PI) * 72 : 0;
    // Gymbro queues one strike per new press; holding H never fills the combo.
    if (jumpProgress < 1) { if (held('J')) this.startAttack('kick'); }
    else if (held('L') && this.character.attacks.lowKick) this.startAttack('lowKick');
    else if (specialPressed) this.startAttack(this.character.special);
    else if (held('J')) this.startAttack('kick');
    else if (this.character.punchCombo?punchPressed:held('H')) this.startAttack('punch');
    touch?.discardPresses();
    if (this.playerAttack) {
      const attack = this.playerAttack, elapsed = this.combatTime - attack.start;
      if (!attack.projectile && !attack.summon && !attack.hit && elapsed >= attack.hitAt) {
        if(attack.type===this.character.special && !spendSpecialEnergy(this)) {
          this.playerAttack=null;
        } else {
          if(attack.type===this.character.special && attack.cooldown)this.specialReadyAt=this.combatTime+attack.cooldown;
          attack.hit = true;
          if(attack.type==='headset')this.sfx?.play('whip');
          else if(attack.type==='stomp')this.sfx?.play('stomp');
          if (attack.area) {
            const ring = this.add.ellipse(this.player.x, this.player.y, 20, 10).setStrokeStyle(3, this.character.color).setDepth(this.player.y - 1);
            this.tweens.add({ targets: ring, displayWidth: attack.range * 2, displayHeight: attack.range * 2, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
            this.cameras.main.shake(120, .004);
          }
          for (const enemy of this.enemies) if (enemy.hp > 0 && playerAttackHits(this.player, enemy, attack)) this.hitEnemy(enemy, attack);
          this.boss?.hit(attack);
          this.boss?.hazards.hitObstacles(attack);
        }
      }
      if (elapsed >= attack.duration && this.playerAttack===attack) {
        if(attack.comboStage!==undefined && attack.queued>0)this.startPunchStage(attack.comboStage+1,attack.queued-1,attack.facing);
        else this.playerAttack=null;
      }
    } else if (!dashing && this.combatTime >= this.hurtUntil) {
      if (this.jumpHeight > 5) { this.player.sprite.stop(); this.player.sprite.setFrame(this.character.jump); }
      else if (dx || dy) this.play(this.player, 'walk');
      else this.idle(this.player);
    }
    this.player.sprite.setFlipX(this.facing < 0);
    const blinking = dashing || this.combatTime<this.respawnProtectedUntil || (this.health < 100 && this.combatTime < this.invulnerableUntil);
    this.player.sprite.setAlpha(blinking && Math.floor(this.combatTime / 45) % 2 ? .25 : 1);
    this.dashStatus.setText(this.character.dash === false
      ? (this.combatTime >= this.specialReadyAt ? 'SHIFT / PISOTÓN LISTO' : 'SHIFT / RECARGANDO…')
      : (this.combatTime >= this.dashReadyAt ? 'SHIFT / DASH LISTO' : 'SHIFT / RECARGANDO…'));
    this.placeFighter(this.player, this.jumpHeight);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.iphone?.update(dt);
    this.books?.update(dt);
    this.waves.update();
    if(this.health>0 && this.level.boss && this.waves.cleared && !this.boss && !this.miniBoss)this.beginBossIntro();
    this.boss?.update(dt);this.miniBoss?.update();
    if(this.health<=0){this.handleDeath();return;}
    if (this.waves.cleared && (!this.level.boss || this.boss?.done || this.miniBoss?.done)) {
      this.finished = true;
      this.music?.stop();
      this.iphone?.clear();
      this.books?.clear();
      this.player.sprite.setAlpha(1);
      const won = this.health > 0, last = this.levelIndex === levels.length - 1;
      if(!won){this.sfx?.stop();this.sfx?.play('lose');}
      if(!won) this.boss?.finish();
      this.projectiles.forEach(p => p.sprite.destroy()); this.projectiles = [];
      this.enemies.forEach(e => { e.pending = null; e.tell.setVisible(false); if (e.hp > 0) this.idle(e); });
      this.showOverlay(won ? (last ? 'BOGOTÁ DESPEJADA' : 'CUADRA DESPEJADA') : 'TE FALTÓ TINTO',
        won && !last ? 'ENTER PARA CONTINUAR' : 'R O ENTER PARA REINICIAR');
      if (won) this.game.events.emit('level-clear', this.levelIndex);
      this.play(this.player,'victory',1000);
      this.game.events.emit('level-victory');
      this.pendingResult={won,last,bossCheckpoint:Boolean(this.boss),score:this.run.score,character:this.character.name};
      this.victoryRemaining=1100;
    }
  }

  placeFighter(fighter, height = 0) {
    fighter.sprite.setPosition(fighter.x, fighter.y - height + 4 * fighter.sprite.scaleY).setDepth(fighter.y);
    fighter.shadow.setPosition(fighter.x, fighter.y).setDepth(fighter.y - 1);
  }

  arcadeInput(){
    const k=this.keys,touch=this.game.touchControls?.input;
    const pressed=key=>{const t=touch?.justDown(key);return Phaser.Input.Keyboard.JustDown(k[key])||Boolean(t);};
    const actions=[];
    for(const [key,type] of [['H','punch'],['J','kick'],['K',this.character.special],['L','lowKick']])if(pressed(key))actions.push(type);
    const result={actions,restart:pressed('R'),enter:pressed('ENTER'),pause:pressed('P'),jump:pressed('SPACE'),dash:pressed('SHIFT'),
      dx:Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown)||touch?.x||0,
      dy:Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown)||touch?.y||0};
    touch?.discardPresses();return result;
  }
}
