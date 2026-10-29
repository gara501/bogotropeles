import {TAXI_RUSH_ATLAS} from '../data/taxis.js';
import Phaser from 'phaser';
import { characters } from '../data/characters.js';
import { levels, levelTextures } from '../data/levels.js';
import { enemies, knife, projectileTextures, STRUGGLE_SHEET } from '../data/enemies.js';
import { bossFor, bossMusicFor } from '../data/bosses.js';
import { MiniBoss } from '../boss/MiniBoss.js';
import { PigeonFlock, PIGEON_FLIGHT } from '../boss/PigeonFlock.js';
import {GROUND_PIGEON} from '../stage/GroundPigeons.js';
import {MOTORATA_ENTRY} from '../data/motorata.js';
import {MotorcycleArrivals} from '../actors/MotorcycleArrivals.js';
import groundPigeonUrl from '../data/NPC/pigeon_ground.png?url';
import { SprayBarrage } from '../boss/SprayBarrage.js';
import { GroundStains } from '../game/GroundStains.js';
import { GasClouds } from '../game/GasClouds.js';
import {TAXIMETER} from '../data/jugo.js';
import {updateTaximeter} from '../projectiles/Taximeter.js';
import { registerAnimations, prepareEffects, prepareCutout, prepareSheet, releaseSources, needsSource } from '../data/spriteSheets.js';
import { IPHONE } from '../data/iphone.js';
import { actorsFor } from '../data/actorSet.js';
import { IPhoneSpecial } from '../projectiles/IPhoneSpecial.js';
import {createFruitFlight,fruitPosition,fruitHitsPlayer} from '../projectiles/fruitLob.js';
import { OrbitingBooks, prepareBookTextures } from '../specials/OrbitingBooks.js';
import { bossSprite, bossEffects } from '../boss/config.js';
import { BossController } from '../boss/BossController.js';
import { LevelMusic } from '../audio/LevelMusic.js';
import { MUSIC_TRACKS, LEVEL1_MUSIC, chooseMusic } from '../audio/musicTracks.js';
import { RunState } from '../game/RunState.js';
import { SoundEffects, preloadEffects, enemyDeathSound, PLAYER_HURT_SOUNDS, PLAYER_DEATH_SOUNDS, CROSSING_VOICE, BOSS_SOUNDS, BOSS_HURT_COOLDOWN, ENEMY_HURT_SOUNDS, ENEMY_SPAWN_SOUNDS } from '../audio/SoundEffects.js';
import { WaveDirector } from '../combat/WaveDirector.js';
import { beginEnemyAttack, updateEnemyAttack } from '../combat/enemyAttacks.js';
import { beginEnemyCharge, updateEnemyCharge, shouldCharge } from '../combat/enemyCharge.js';
import { canSpendSpecialEnergy, spendSpecialEnergy } from '../combat/specialEnergy.js';
import { scaledEnemy, crossingHits } from '../data/campaign.js';
import { playerAttackHits, knifeHits, DASH, enemyCanAdvance, dashDirection } from '../combat.js';
import {ARCADE,fitArcadeCamera,fitArcadeText,applyPixelFilter} from '../data/arcade.js';
import {ArcadeRuntime} from '../game/ArcadeRuntime.js';
import {EnergyPickups} from '../game/EnergyPickups.js';
import {Vuvuzela,VUVUZELA_TEXTURE,prepareVuvuzela} from '../game/Vuvuzela.js';
import vuvuzelaUrl from '../data/items/item_vuvuzela.png?url';
import {preloadVuvuzelaPlayer,prepareVuvuzelaPlayer} from '../data/vuvuzelaPlayers.js';
import {preloadPickups,preparePickups,preloadItem} from '../data/pickups.js';
import {preloadProps,prepareProps} from '../data/props.js';
import {preloadPacho,preparePacho} from '../data/pacho.js';
import {StageCamera} from '../stage/StageCamera.js';
import {viewLeft} from '../stage/scroll.js';
import {Hud} from '../ui/Hud.js';
import {RingBonus} from '../bonus/RingBonus.js';
import {RING_BACKGROUND} from '../data/ring.js';
import {RING_ORDER} from '../bonus/ringRules.js';
import {ChivaBonus} from '../bonus/ChivaBonus.js';
import {preloadChivaBonus,prepareChivaBonus} from '../data/chivaBonus.js';
import {JUGGLING_CLUB_RECT} from '../data/juggler.js';
import {CyclingStage} from '../cycling/CyclingStage.js';
import {HEN_SHEET} from '../data/donPico.js';
import {preloadCycling,CYCLING_ASSETS} from '../data/cycling.js';

const FONT = "'IBM Plex Mono', monospace";
const FLOOR = { bottom: 500, left: 65, right: 895 };
// Every runtime sheet built from a raw PNG (see prepareSheet/prepareEffects): key → config with its url.
const ACTOR_SHEETS = { ...characters, ...enemies, dormilon: bossSprite, 'boss-effects': bossEffects, 'motorata-entry': MOTORATA_ENTRY, 'pico-hen':HEN_SHEET };

function loadActor(scene, key, actor) {
  if (!actor || scene.textures.exists(key)) return; // already built (and its raw PNG released) in an earlier run: nothing to download or upload
  if (needsSource(scene, `${key}-source`)) scene.load.image(`${key}-source`, actor.url);
  (actor.appendUrls ?? []).forEach((url, i) => { if (needsSource(scene, `${key}-append-${i}`)) scene.load.image(`${key}-append-${i}`, url); });
  if (actor.flock && !scene.textures.exists(PIGEON_FLIGHT.key)) scene.load.spritesheet(PIGEON_FLIGHT.key, actor.flock.url, { frameWidth: PIGEON_FLIGHT.frameWidth, frameHeight: PIGEON_FLIGHT.frameHeight });
  if (actor.struggle && !scene.textures.exists(`${key}-struggle`) && needsSource(scene, `${key}-struggle-source`)) scene.load.image(`${key}-struggle-source`, actor.struggle.url);
}

function prepareActor(scene, key, actor) {
  if (key === 'boss-effects') prepareEffects(scene, key, actor);
  else registerAnimations(scene, key, actor);
  if (actor.struggle) prepareSheet(scene, `${key}-struggle`, actor.struggle.sheet ?? STRUGGLE_SHEET);
}

/** Frees the sheets of actors this run does not use (a previous level or fighter) and lets them be downloaded again if needed later. */
function evictActors(scene, wanted) {
  const spent = scene.game?.spentSources;
  for (const [key, actor] of Object.entries(ACTOR_SHEETS)) {
    if (wanted.has(key)) continue;
    for (const name of [key, `${key}-struggle`, `${key}-vuvuzela`]) if (scene.textures.exists(name)) scene.textures.remove(name);
    // Animations keep references to the old frames: drop them so registerAnimations rebuilds them on the next load.
    for (const state of Object.keys(actor.animations ?? {})) scene.anims.remove(`${key}-${state}`);
    const raws = [`${key}-source`, `${key}-struggle-source`, `${key}-vuvuzela-source`, ...(actor.appendUrls ?? []).map((_, i) => `${key}-append-${i}`)];
    for (const name of raws) spent?.delete(name);
  }
}

export class StreetScene extends Phaser.Scene {
  constructor() { super('Street'); }

  init(data) {
    this.levelIndex = Phaser.Math.Clamp(data.level ?? 0, 0, levels.length - 1);
    this.run=data.run??this.game?.run??new RunState();this.run.level=this.levelIndex;
    this.level = {...levels[this.levelIndex],music:this.levelIndex===0?LEVEL1_MUSIC:chooseMusic(this.game?.lastMusicKey)};
    if(import.meta.env.DEV && ['frutatiana','don_diablo','don_pico','papero','reversa'].includes(data.enemyTest) && data.testArt){
      const art=data.testArt;
      this.level={...this.level,name:art.name,key:art.background.key,url:art.background.url,layers:art.layers,
        top:art.floor.top,bottom:art.floor.bottom,props:null,rain:null,traffic:null,groundPigeons:null,boss:data.enemyTest==='reversa'?'reversa':null,enemies:['frutatiana','don_diablo','don_pico','papero','reversa']};
    }
    this.isRingBonus=Boolean(data.ringBonus);this.ringBonus=null;
    this.isChivaBonus=Boolean(data.chivaBonus);this.chivaBonus=null;this.bonusReturnLevel=data.returnLevel??3;
    if(this.isChivaBonus)this.level={...this.level,name:'BONUS · LA CHIVA',total:0,boss:null,enemies:[],crossingEnemies:[],
      top:400,bottom:500,props:null,rain:null,traffic:null,groundPigeons:null};
    if(this.isRingBonus){this.bonusReturnLevel=data.returnLevel??6;this.level={...this.level,name:'BONUS · EL RING',key:RING_BACKGROUND.key,url:RING_BACKGROUND.url,layers:null,total:0,boss:null,enemies:RING_ORDER,crossingEnemies:[],mode:'ring',top:330,bottom:450,hp:1,speed:1,damage:1,pressure:1,props:null,rain:null,traffic:null,groundPigeons:null,potatoSupplies:false};}
    this.isCycling=this.level.mode==='cycling' && !this.isChivaBonus && !this.isRingBonus;this.cycling=null;
    if(this.game)this.game.lastMusicKey=this.level.music.key;
    this.floor = { ...FLOOR, top: this.level.top, bottom: this.level.bottom??FLOOR.bottom };
    this.characterKey = data.character || 'office';
    this.character = characters[this.characterKey];
    this.wanted = actorsFor(this.level, this.characterKey, [...(import.meta.env.DEV && data.bossTest ? ['dormilon'] : []), ...(import.meta.env.DEV && data.enemyTest ? [data.enemyTest] : [])]);
    this.combatTime = 0;
    this.lastHit = null;
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
    this.taxiRush = null;
    this.bossIntroShown = false;
    this.cinematic = false;
    this.transitioning = false;
    this.restarting = false;
    this.comboVictim = null;
    this.bossCheckpoint = Boolean(data.bossCheckpoint && this.level.boss);
    this.bossTest = import.meta.env.DEV ? data.bossTest : null;
    if(this.bossTest)this.level={...this.level,boss:'dormilon'}; // Keep the old controller's opt-in QA route.
    this.enemyTest = import.meta.env.DEV ? data.enemyTest : null;
    this.debugPreview = import.meta.env.DEV && Boolean(data.playerPreview);
  }

  preload() {
    if(this.isCycling){
      evictActors(this,new Set()); // the street fighters' sheets (tens of MB) are not used while cycling; they reload on demand
      preloadCycling(this);preloadEffects(this);preloadItem(this,'money');preloadItem(this,'full');
      if(!this.cache.audio.exists(this.level.music.key))this.load.audio(this.level.music.key,this.level.music.url);
      return;
    }
    // Leaving the bicycle stage: its five rider sheets, obstacles and background are no longer needed (they reload on demand).
    for(const key of Object.keys(CYCLING_ASSETS))if(this.textures.exists(key))this.textures.remove(key);
    if(!this.isRingBonus && this.textures.exists(RING_BACKGROUND.key))this.textures.remove(RING_BACKGROUND.key);
    if(this.isChivaBonus)preloadChivaBonus(this);
    preloadVuvuzelaPlayer(this);
    if(!this.textures.exists(VUVUZELA_TEXTURE))this.load.image(VUVUZELA_TEXTURE,vuvuzelaUrl);
    if(this.level?.groundPigeons && !this.textures.exists(GROUND_PIGEON.key))this.load.spritesheet(GROUND_PIGEON.key,groundPigeonUrl,{frameWidth:GROUND_PIGEON.frameWidth,frameHeight:GROUND_PIGEON.frameHeight});
    preloadPickups(this);preloadProps(this);preloadPacho(this);
    if(this.cameras?.main?.setZoom)fitArcadeCamera(this);
    preloadEffects(this);
    const label = this.add.text(480, 270, 'CARGANDO LA CIUDAD…', { fontFamily: FONT, fontSize: '18px', color: '#d6ed64' }).setOrigin(.5);
    this.load.once('complete', () => label.destroy());
    // Only the current level's backgrounds (the menu has none): the other levels' parallax layers are freed so they never sit in GPU memory.
    const currentArt = this.level ? levelTextures(this.level) : [], keepArt = new Set(currentArt.map(asset => asset.key));
    for (const level of levels) for (const asset of levelTextures(level)) if (!keepArt.has(asset.key) && this.textures.exists(asset.key)) this.textures.remove(asset.key);
    for (const asset of currentArt) if (!this.textures.exists(asset.key)) this.load.image(asset.key, asset.url);
    // Only the fighter, enemies and boss this level needs; the menu (no level yet) loads none.
    const wanted = this.wanted ?? new Set();
    if(wanted.has('jugo') && !this.textures.exists('taximeter'))this.load.image('taximeter-source',TAXIMETER.url);
    if(this.level?.taxiRush && !this.textures.exists('taxi-rush'))this.load.image('taxi-rush-source',TAXI_RUSH_ATLAS.url);
    evictActors(this, wanted);
    for (const key of wanted) loadActor(this, key, ACTOR_SHEETS[key]);
    if (!this.textures.exists('knife')) this.load.image('knife', knife.url);
    for (const [key, url] of Object.entries(projectileTextures)) if (!this.textures.exists(key)) this.load.image(key, url);
    const bossTrack=bossMusicFor(this.level);
    if (bossTrack && !this.cache.audio.exists(bossTrack.key)) this.load.audio(bossTrack.key,bossTrack.url);
    // Menu shares this preload but has no selected level. Decode only one track
    // at a time, retaining it for fast restarts of the same level.
    if (this.level) {
      for (const track of [...MUSIC_TRACKS,LEVEL1_MUSIC]) if (track.key !== this.level.music.key) this.cache.audio.remove(track.key);
      if (!this.cache.audio.exists(this.level.music.key)) this.load.audio(this.level.music.key, this.level.music.url);
    }
  }

  create() {
    if(this.isCycling){this.cycling=new CyclingStage(this);this.cycling.create();return;}
    if(this.isChivaBonus)prepareChivaBonus(this);
    prepareVuvuzelaPlayer(this);
    prepareVuvuzela(this);
    preparePickups(this);prepareProps(this);preparePacho(this);
    prepareCutout(this,'juggling-club','juggling-club-source',JUGGLING_CLUB_RECT);
    prepareCutout(this,'frutatiana-orange','frutatiana-fruit-source',{x:102,y:89,width:664,height:722});
    prepareCutout(this,'frutatiana-watermelon','frutatiana-fruit-source',{x:935,y:69,width:727,height:764});
    prepareCutout(this,'diablito-cart','diablito-source',{x:25,y:117,width:1487,height:799,scale:.25});
    for(let i=0;i<6;i++)prepareCutout(this,`reversa-truck-${i}`,'reversa-truck-source',{x:(i%2)*768,y:Math.floor(i/2)*341,width:768,height:341,scale:.5});
    prepareCutout(this,'reversa-eggs','reversa-eggs-source',{x:280,y:65,width:975,height:900,scale:.125});
    prepareCutout(this,'ring-cap','ring-projectile-source',{x:85,y:206,width:580,height:317,scale:.125});
    prepareCutout(this,'ring-bill','ring-projectile-source',{x:844,y:174,width:547,height:367,scale:.125});
    prepareCutout(this,'ring-coin','ring-projectile-source',{x:1661,y:213,width:334,height:334,scale:.125});
    prepareCutout(this,'papero-sack','papero-potato-source',{x:42,y:137,width:880,height:530,scale:.25});
    prepareCutout(this,'papero-potatoes','papero-potato-source',{x:1016,y:327,width:918,height:379,scale:.25});
    fitArcadeCamera(this);
    applyPixelFilter(this);
    for (const key of this.wanted) if (ACTOR_SHEETS[key]) prepareActor(this, key, ACTOR_SHEETS[key]);
    if (this.wanted.has('office')) prepareCutout(this,IPHONE.texture,'office-source',IPHONE.sourceRect);
    // Tear-gas canister and cloud stages from the level 5 boss sheet.
    if (this.wanted.has('antidisturbios')) enemies.antidisturbios.gasRects.forEach(([x,y,width,height],i)=>prepareCutout(this,`gas-${i}`,'antidisturbios-source',{x,y,width,height}));
    if(this.level.taxiRush)prepareEffects(this,'taxi-rush',TAXI_RUSH_ATLAS);
    if(this.wanted.has('jugo'))prepareEffects(this,'taximeter',TAXIMETER);
    releaseSources(this);
    this.drawStreet();
    this.player = this.makeFighter(200, 450, this.characterKey, this.character);
    if(this.characterKey==='office')this.iphone=new IPhoneSpecial(this);
    if(this.characterKey==='student'){prepareBookTextures(this);this.books=new OrbitingBooks(this);}
    this.enemies = [];
    this.arcade=new ArcadeRuntime(this);
    this.waves = new WaveDirector(this);
    this.energyPickups=new EnergyPickups(this);
    this.vuvuzela=new Vuvuzela(this);
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
    if(this.isRingBonus){this.energyPickups.destroy();this.energyPickups=null;this.vuvuzela.destroy();this.vuvuzela=null;this.ringBonus=new RingBonus(this);}
    if(this.isChivaBonus){
      this.energyPickups.destroy();this.chivaBonus=new ChivaBonus(this);this.energyPickups=this.chivaBonus;
      this.player.x=245;this.player.y=450;this.invulnerableUntil=0;
    }
    if(this.bossCheckpoint) {
      this.waves.skipToEnd();this.stage.jumpToArena(this.waves.arena);this.defeated=this.level.total;this.bossIntroShown=true;this.spawnBoss();
    } else this.waves.update();
    if(this.debugPreview) {
      this.invulnerableUntil=Infinity;
      this.enemies.forEach((enemy,index)=>{enemy.x=560+index*120;enemy.y=index?this.floor.top:450;});
    }
    if(import.meta.env.DEV && this.enemyTest && (enemies[this.enemyTest]?.combo || enemies[this.enemyTest]?.charge || enemies[this.enemyTest]?.shieldBreak || enemies[this.enemyTest]?.brayatan || enemies[this.enemyTest]?.pacho || enemies[this.enemyTest]?.leap || enemies[this.enemyTest]?.juggler || enemies[this.enemyTest]?.paint || enemies[this.enemyTest]?.throw?.fruit || enemies[this.enemyTest]?.diablito || enemies[this.enemyTest]?.pollero || enemies[this.enemyTest]?.papero || enemies[this.enemyTest]?.reversa || enemies[this.enemyTest]?.ortencio)) {
      for(const enemy of this.enemies)for(const object of [enemy.sprite,enemy.shadow,enemy.healthBar,enemy.tell,enemy.taunt])object?.destroy();
      this.enemies=[];this.waves.spawned=this.level.total;this.defeated=this.level.total-1;
      const isBossPreview=Boolean(enemies[this.enemyTest].pacho || enemies[this.enemyTest].reversa || this.enemyTest==='jugo');
      if(isBossPreview){this.defeated=this.level.total;this.bossIntroShown=true;}
      const enemy=isBossPreview?this.spawnMiniBoss(bossFor(this.level)).enemy:this.spawnEnemy(this.enemyTest,0,0,2,0);
      enemy.x=450;enemy.y=450;if(!isBossPreview && !enemy.config.shieldBreak && !enemy.config.brayatan && !enemy.config.pacho && !enemy.config.leap && !enemy.config.juggler && !enemy.config.paint && !enemy.config.throw?.fruit && !enemy.config.diablito && !enemy.config.pollero && !enemy.config.papero && !enemy.config.reversa && !enemy.config.ortencio)enemy.config.speed=0;else {enemy.x=650;this.invulnerableUntil=Infinity;}enemy.nextHit=Infinity;
      this.player.x=400;this.player.y=450;this.nextGroupAttack=Infinity;this.updateCounter();
      if(this.enemyTest==='ortencio'){
        this.level={...this.level,boss:null,total:2};this.waves.spawned=2;this.defeated=0;this.invulnerableUntil=0;
        const ally=this.spawnEnemy('belly',1,1,2,0);ally.x=800;ally.y=450;this.updateCounter();
      }
    }
    this.game.events.emit('level-start', this.levelIndex);
    // HUD stays on screen while the camera scrolls (depth >= 999 is the HUD band).
    for(const object of this.children.list)if(object.depth>=999)object.setScrollFactor(0);
    for(const object of this.children.list)if(object.type==='Text' && object.depth>=999)fitArcadeText(object);
    for(const object of this.overlay.list)if(object.type==='Text')fitArcadeText(object);
    this.events.once('shutdown', () => {
      this.motorcycles?.destroy();this.motorcycles=null;
      this.energyPickups?.destroy();this.energyPickups=null;
      this.chivaBonus=null;this.ringBonus?.destroy();this.ringBonus=null;
      this.vuvuzela?.destroy();this.vuvuzela=null;
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
      this.flock?.clear(); this.flock = null;
      this.sprayBarrage?.clear(); this.sprayBarrage = null;
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
    if(config.pacho){enemy.invulnerableUntil=Infinity;enemy.sprite.setVisible(false);enemy.shadow.setVisible(false);}
    enemy.healthBar=this.add.rectangle(x,y-config.height-10,42,4,0xd6ed64).setOrigin(0,.5);
    const entrance=ENEMY_SPAWN_SOUNDS[key];if(entrance)this.sfx?.play(entrance);
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
    if(config.motorcycle)(this.motorcycles??=new MotorcycleArrivals(this)).start(enemy);
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
    actor.sprite.play(`${actor.key}-${actor.config.animationKeys?.[state]??state}`, true);
  }

  idle(actor) {
    actor.sprite.stop();
    actor.sprite.setFrame(actor.config.idle ?? 6);
  }

  nextLevel() {
    if(this.isChivaBonus || this.isRingBonus){
      if((this.chivaBonus?.ready || this.ringBonus?.ready) && !this.transitioning){
        this.transitioning=true;this.run.advance(this.bonusReturnLevel);
        this.game.events.emit('level-transition',{character:this.characterKey,level:this.bonusReturnLevel});
      }
      return;
    }
    if (this.finished && this.health > 0 && !this.transitioning && !this.victoryRemaining && this.levelIndex < levels.length - 1) {
      this.transitioning=true;
      this.run.advance(this.levelIndex+1);
      this.game.events.emit('level-transition',{character:this.characterKey,level:this.levelIndex+1});
    }
  }

  restartLevel() {
    if(this.isChivaBonus || this.isRingBonus)return false; // one bonus attempt; restarting cannot duplicate its reward
    if(this.restarting || this.cinematic || this.waitingContinue || this.gameOver || (this.finished && this.level.boss))return false;
    this.restarting=true;
    if(!this.boss && !this.miniBoss)this.run.score=this.run.levelStartScore;
    const data={character:this.characterKey,level:this.levelIndex,bossCheckpoint:Boolean(this.level.boss && (this.boss || this.miniBoss)),run:this.run};
    this.game.events.emit('level-restart');this.scene.restart(data);return true;
  }

  updateCounter() {
    if(this.isRingBonus){this.counter.setText('BONUS · EL RING');return;}
    if(this.isChivaBonus){this.counter.setText('BONUS · LA CHIVA');return;}
    this.counter.setText(`NIVEL ${this.levelIndex + 1} · ${this.boss || this.miniBoss ? 'JEFE' : `${this.defeated}/${this.level.total} ${this.level.mode==='crossing'?'RESUELTOS':'DERROTADOS'}`}`);
  }

  updateRunStatus(){this.runStatus?.setText(`VIDAS ${this.run.lives} · PUNTOS ${this.run.score}`);}
  addScore(points){this.run.award(points);this.updateRunStatus();}

  /** Changing fighter from the pause menu: its sheet may not be loaded yet (only the chosen one is), so load it first. */
  ensureCharacter(key, done) {
    if(this.isCycling)return done(); // All five bicycle sheets are prepared together.
    if (!characters[key]) return done();
    if(this.textures.exists(key) && this.textures.exists(`${key}-vuvuzela`))return done();
    this.wanted.add(key);
    loadActor(this, key, characters[key]);
    preloadVuvuzelaPlayer(this,key);
    this.load.once('complete', () => {
      prepareActor(this, key, characters[key]);
      prepareVuvuzelaPlayer(this,key);
      if (key === 'office') prepareCutout(this, IPHONE.texture, 'office-source', IPHONE.sourceRect);
      releaseSources(this);
      done();
    });
    this.load.start();
  }

  switchCharacter(key) {
    if(!characters[key] || this.gameOver)return false;
    if(this.cycling){this.cycling.setCharacter(key);return true;}
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
    this.arcade?.player?.captor?.cancel();
    this.deathHandled=true;this.run.loseLife();this.updateRunStatus();
    this.vuvuzela?.clearHeld();
    this.iphone?.clear();this.books?.clear();this.playerAttack=null;this.comboVictim=null;
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];this.flock?.clear();this.sprayBarrage?.clear();
    this.enemies.forEach(e=>{e.pending=null;e.tell.setVisible(false);e.sprite.anims.pause();});
    this.boss?.setPaused(true);this.music?.setPaused(true);this.sfx?.stop();
    const deathSound=PLAYER_DEATH_SOUNDS[this.characterKey];if(deathSound)this.sfx?.play(deathSound);
    this.game.events.emit('player-death');
    if(this.run.lives>0)this.respawnDelay=900;
    else if(this.run.canContinue){this.waitingContinue=true;this.sfx?.play('lose');this.game.events.emit('continue-needed');}
    else {this.sfx?.play('lose');this.endRun();} // no continues left: straight to game over
  }

  respawn() {
    if(this.cycling)return this.cycling.respawn();
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
    this.motorcycles?.clear();
    this.stage?.pigeons?.clear();
    this.stage?.rain?.clear();
    this.music?.stop();this.boss?.finish();this.game.events.emit('game-over');
  }

  beginBossIntro() {
    if(this.bossIntroShown || this.boss || this.miniBoss || !this.level.boss || !this.waves.cleared || this.health<=0)return false;
    this.stage?.pigeons?.clear();
    this.bossIntroShown=true;this.cinematic=true;this.playerAttack=null;
    if(this.arcade){this.arcade.player.transition('walk');this.arcade.clearInput();this.arcade.combat.tokens.clear();}
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];this.flock?.clear();this.sprayBarrage?.clear();
    this.iphone?.clear();this.books?.clear();this.music?.setPaused(true);
    this.sfx?.stop();
    for(const enemy of this.enemies) {
      this.tweens.killTweensOf(enemy.sprite);
      enemy.sprite.setVisible(false);enemy.shadow.setVisible(false);
      enemy.healthBar.setVisible(false);enemy.tell.setVisible(false);enemy.taunt?.setVisible(false);
    }
    this.game.events.emit('boss-intro',{level:this.levelIndex,boss:this.level.boss,character:this.characterKey});return true;
  }

  resumeBoss() {
    if(!this.cinematic || !this.bossIntroShown || this.health<=0)return;
    this.cinematic=false;this.input.keyboard.resetKeys();this.music?.setPaused(false);this.spawnBoss();
  }

  spawnBoss() {
    if(this.boss || this.miniBoss || !this.level.boss) return;
    this.stage?.pigeons?.clear();
    this.dropBossRefill();
    const def=bossFor(this.level);
    if(def?.kind==='enemy')return this.spawnMiniBoss(def);
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];this.flock?.clear();this.sprayBarrage?.clear();
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
    this.stage?.pigeons?.clear();
    this.projectiles.forEach(p=>p.sprite.destroy());this.projectiles=[];this.flock?.clear();this.sprayBarrage?.clear();
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
    if(this.ringBonus?.locked && enemy.config.ringFighter)return;
    if(enemy.sackSpinning || enemy.hp<=0 || this.combatTime<(enemy.invulnerableUntil??0)){ // e.g. a boss mid-evade
      if((enemy.pigeonShielded || enemy.sackSpinning) && this.add?.text && this.combatTime>=(enemy.immuneLabelAt??0)){ // show why the attack is blocked
        enemy.immuneLabelAt=this.combatTime+600;
        const label=this.add.text(enemy.x,enemy.y-enemy.config.height-26,'¡INVENCIBLE!',{fontFamily:FONT,fontSize:'12px',color:'#ffe37a',stroke:'#142127',strokeThickness:3}).setOrigin(.5).setDepth(951);
        this.tweens?.add?.({targets:label,y:label.y-18,alpha:0,duration:520,onComplete:()=>label.destroy()});
      }
      return;
    }
    const reversa=this.arcade?.enemies.get(enemy)?.reversa;
    if(reversa){const factor=reversa.damageFactor(this.player);if(!factor)return;attack={...attack,damage:Math.max(1,Math.round(attack.damage*factor)),knockback:0,reversaChip:factor<=.12};reversa.hitFeedback(this.player,Math.min(enemy.hp,attack.damage),factor);}
    this.lastHit={enemy,at:this.combatTime};
    enemy.jitterUntil=this.combatTime+(attack.finisher?200:120); // the hit body shudders for a moment
    if(enemy.config.shield && this.shieldBlocks(enemy,attack)) {
      const damage=Math.max(1,Math.round(attack.damage*enemy.config.shield.frontDamage));
      if(enemy.hp>damage){this.blockHit(enemy,damage);return;}
      attack={...attack,damage}; // the chip damage finishes him off: fall through to the normal defeat
    }
    enemy.hp = Math.max(0, enemy.hp - attack.damage);
    const bossHurt=BOSS_SOUNDS[enemy.key]?.hurt??ENEMY_HURT_SOUNDS[enemy.key];
    if(bossHurt && enemy.hp>0 && this.combatTime>=(enemy.gruntReady??0)){enemy.gruntReady=this.combatTime+BOSS_HURT_COOLDOWN;this.sfx?.play(bossHurt);}
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
    const model=this.arcade?.enemies.get(enemy),heldKnee=model?.state==='grabbed' && attack.grab && enemy.hp>0;
    // An animation can switch atlases before Enemy.hurt runs. Restore the main
    // atlas scale first when releasing a hold; knees keep the held art and scale.
    if(model?.state==='grabbed' && !heldKnee)model.endStruggle();
    if(!heldKnee){
      // Minion variants share one texture: show their own row's pose.
      if (enemy.config.frameOffset != null) enemy.sprite.stop().setFrame(enemy.config.animations[enemy.hp === 0 ? 'defeat' : 'hurt'][0] + enemy.config.frameOffset);
      else this.play(enemy, enemy.hp === 0 ? 'defeat' : 'hurt');
    }
    if (enemy.hp === 0) {
      if(this.lastHit?.enemy===enemy)this.lastHit=null;
      // A boss is not part of the wave count; it pays its own bonus.
      const points=enemy.config.ringFighter?0:enemy.config.boss ? (bossFor(this.level)?.score ?? 1000) : enemy.config.minion ? 50 : 100;
      this.addScore(points);if(points)this.scorePopup(enemy.x,enemy.y-enemy.config.height-10,points,enemy.config.boss);
      enemyDeathSound(this,enemy);
      if(!enemy.config.boss && !enemy.config.minion && !enemy.config.ringFighter)this.defeated++;
      if(enemy.config.ringFighter)this.ringBonus?.onDefeated(enemy);
      enemy.shadow.setVisible(false); enemy.healthBar.setVisible(false); enemy.taunt?.setVisible(false);
      this.tweens.add({ targets: enemy.sprite, alpha: 0, delay: 650, duration: 250 });
      this.updateCounter();
    }
    this.arcade?.enemyHit(enemy,attack);
  }

  /** Points that jump out of a defeated enemy (or a picked-up card) and float away. */
  scorePopup(x,y,points,big=false) {
    if(!this.add?.text)return null;
    const label=this.add.text(x,y,`+${points}`,{fontFamily:"'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",fontSize:big?'30px':'22px',fontStyle:'bold',
      color:big?'#ffe14d':'#d6ed64',stroke:'#14282c',strokeThickness:3}).setOrigin(.5).setDepth(952);
    // A quick hop up, then a slow drift and fade.
    this.tweens?.add?.({targets:label,y:y-26,scale:{from:.6,to:1.15},duration:180,ease:'Back.Out',onComplete:()=>
      this.tweens?.add?.({targets:label,y:y-56,alpha:0,scale:1,duration:700,delay:250,onComplete:()=>label.destroy()})});
    return label;
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
    this.arcade?.enemyPhase(enemy);
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
    if(this.health===0 && this.ringBonus)this.ringBonus.knockout();
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

  /** Palomera's pigeon shield: ring of pigeons around her (boss/PigeonFlock.js). */
  pigeonShieldStep(enemy, config) { (this.flock ??= new PigeonFlock(this)).shieldStep(enemy, config); }
  stopPigeonShield() { this.flock?.stopShield(); }

  /** Palomera's pigeon cloud (boss/PigeonFlock.js). */
  launchFlock(enemy, config) {
    this.flock ??= new PigeonFlock(this);
    this.flock.launch(enemy, config);
  }

  throwKnife(enemy, facing) {
    this.sfx?.play('knife');
    const x = enemy.x + facing * 55;
    const sprite = this.add.image(x, enemy.y - 78, 'knife').setDisplaySize(knife.width, knife.width)
      .setRotation(Math.PI / 4 + (facing < 0 ? Math.PI : 0)).setDepth(enemy.y + 1);
    this.projectiles.push({ x, y: enemy.y, facing, damage: enemy.config.damage, sprite,owner:enemy });
  }

  /** A wave of minions running in from both screen edges (level 1 and 4 bosses). */
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
    const sprite = this.add.image(x, enemy.y - (config.lift ?? 70), config.texture,config.taximeter?'0':undefined).setDisplaySize(config.width, config.height).setDepth(enemy.y + 1);
    sprite.setFlipX?.(facing < 0);
    if(config.fruit){
      const flight=createFruitFlight({x,y:enemy.y},this.player,config,this.floor);
      const marker=this.add.graphics().setDepth(flight.targetY-.5);
      marker.lineStyle(2,config.fruit==='watermelon'?0xff6655:0xffd166,.75)
        .strokeEllipse(flight.targetX,flight.targetY,config.radius*2,config.depth*2);
      sprite.once('destroy',()=>marker.destroy());
      this.projectiles.push({x,y:enemy.y,sprite,owner:enemy,damage,facing,fruit:config,flight});
      return;
    }
    // Gas canisters are lobbed at where the player stands (within the throw range) and burst on landing.
    const target = config.gas ? Phaser.Math.Clamp(Math.abs(this.player.x - x), config.minRange * .6, config.maxRange) : null;
    this.projectiles.push({ x, y: enemy.y, facing, damage, sprite, owner:enemy, speed:config.speed, spin:config.spin ?? 0, texture:config.texture,
      gas:config.gas,taximeter:config.taximeter, startX:x, landX:config.gas ? x + facing * target : null, lift:config.lift ?? 70 });
  }

  launchSprayBarrage(owner,config,damage){
    this.sprayBarrage??=new SprayBarrage(this);
    return this.sprayBarrage.launch(owner,config,damage);
  }

  updateProjectiles(dt) {
    this.sprayBarrage?.update();
    this.projectiles = this.projectiles.filter(projectile => {
      if(projectile.taximeter)return updateTaximeter(this,projectile,dt);
      if(projectile.fruit){
        const p=fruitPosition(projectile.flight,dt);
        projectile.x=p.x;projectile.y=p.groundY;
        projectile.sprite.setPosition(p.x,p.y).setDepth(p.groundY+1);
        projectile.sprite.rotation+=projectile.facing*projectile.fruit.spin*dt;
        if(!p.landed)return true;
        if(this.health>0 && fruitHitsPlayer(projectile.flight,this.player,projectile.fruit,this.jumpHeight))
          this.hitPlayer(projectile.damage,null,projectile.owner);
        this.burstFruit(projectile);
        projectile.sprite.destroy();return false;
      }
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

  burstFruit(projectile){
    const c=projectile.fruit,{targetX:x,targetY:y}=projectile.flight,melon=c.fruit==='watermelon';
    this.sfx?.play(melon?'stomp':'punch');
    const splash=this.add.graphics().setPosition(x,y).setDepth(y+2);
    splash.fillStyle(melon?0xf34b54:0xffb12e,.8).fillEllipse(0,0,c.radius*2,c.depth*2);
    this.tweens.add({targets:splash,alpha:0,duration:350,onComplete:()=>splash.destroy()});
    for(let i=0;i<(melon?10:5);i++){
      const angle=i*Math.PI*2/(melon?10:5),radius=c.radius*(.5+Math.random()*.5);
      const chip=this.add.rectangle(x,y,melon?8:4,melon?5:3,i%2?0x497b24:melon?0xf85b65:0xffc648).setDepth(y+4);
      this.tweens.add({targets:chip,x:x+Math.cos(angle)*radius,y:y+Math.sin(angle)*c.depth-8,
        angle:180,alpha:0,duration:450,onComplete:()=>chip.destroy()});
    }
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
    if(!enemy.voiced && Math.abs(enemy.x-this.player.x)<=CROSSING_VOICE.range && Math.abs(enemy.y-this.player.y)<=CROSSING_VOICE.depth){
      enemy.voiced=true;this.sfx?.play(CROSSING_VOICE.sound);
    }
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
    if(this.isChivaBonus || this.isRingBonus)return; // the bonus timer pays partial points instead of taking a life
    const limit=ARCADE.hud.timeLimit*1000;if(!this.hud || !limit)return;
    const section=`${this.waves?.arena}|${Boolean(this.boss || this.miniBoss)}`;
    if(section!==this.clockSection){this.clockSection=section;this.timeLeft=limit;}
    if(this.health<=0 || this.cinematic || this.pendingResult)return;
    this.timeLeft=Math.max(0,this.timeLeft-ARCADE.clock.stepMs);
    if(this.timeLeft===0){this.invulnerableUntil=0;this.respawnProtectedUntil=0;this.hitPlayer(this.health);}
  }

  // Safety net: an exception inside Phaser's update stops the whole game loop (the picture freezes while the music
  // keeps playing). Log it and keep the game running instead; each distinct error is reported once.
  update(time, delta) {
    try { this.updateFrame(time, delta); }
    catch (error) {
      if (!import.meta.env) throw error; // node --test: let the tests see it
      this.reportedErrors ??= new Set();
      const key = String(error?.message ?? error);
      if (!this.reportedErrors.has(key)) { this.reportedErrors.add(key); console.error('[StreetScene] error en el ciclo del juego:', error); }
      this.arcade?.clearInput?.();
    }
  }
  updateFrame(_time, delta) {
    if(this.cycling){this.cycling.update(delta);return;}
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
    this.updateProjectiles(dt);this.flock?.update();
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
      this.projectiles.forEach(p => p.sprite.destroy()); this.projectiles = [];this.flock?.clear();this.sprayBarrage?.clear();
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
    const jitter=(fighter.jitterUntil??0)>this.combatTime?(Math.floor(this.combatTime/34)%2?2:-2):0;
    fighter.sprite.setPosition(fighter.x + jitter, fighter.y - height + 4 * fighter.sprite.scaleY).setDepth(fighter.y);
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
