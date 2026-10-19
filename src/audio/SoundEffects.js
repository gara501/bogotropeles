export const EFFECT_FILES={knife:'knife.mp3',hurt:'hurt.wav',hurt2:'hurt2.wav',lose:'lose.mp3',bar:'bar.mp3',punch:'punch.mp3',kick:'kick.mp3',moto:'moto.mp3',running:'running.mp3',tambo:'tambo.mp3',start:'start.mp3',button:'button.mp3',whip:'whip.mp3',celuco:'celuco.mp3',stomp:'stomp.mp3',spell:'spell.mp3',
  wave:'wave.wav',maleGrunt:'male_grunt.mp3',maleGrunt2:'male_grunt2.mp3',maleGrunt3:'male_grunt3.mp3',maleGrunt4:'male_grunt4.mp3',
  femaleGrunt:'female_grunt.mp3',metalCrack:'metal_crack.mp3',item:'item.mp3',punch2:'punch2.mp3',screeching:'screeching.mp3',femaleGrunt2:'female_grunt2.mp3',
  player1Die:'player_1_die.mp3',player2Die:'player_2_die.mp3',player3Die:'player_3_die.mp3',player4Die:'player_4_die.mp3',player5Die:'player_die_5.mp3'};

// Sound when an enemy's strike becomes active (enemy_N.png → key in src/data/enemies.js).
// Sound when a charge starts its rush (enemy_9 vendor, enemy_10 belly). Any other charger uses running.
export const CHARGE_SOUNDS={vendor:'screeching',belly:'running'};
export const chargeSound=key=>CHARGE_SOUNDS[key]??'running';
export const ENEMY_ATTACK_SOUNDS={guard:'tambo',chain:'bar',sweeper:'bar',belly:'bar',leash:'whip',barra:'wave',palomera:'wave',grafitero:'wave',cabecilla:'wave',estudiante:'punch2',walker:'punch2',brawler:'punch2',fan:'punch2'};

// Sound when a player character takes a hit (character key in src/data/characters.js; player_2 = student).
export const PLAYER_HURT_SOUNDS={student:'femaleGrunt2'};
// Sound when a player character loses a life (player_N.png → character key).
export const PLAYER_DEATH_SOUNDS={office:'player1Die',student:'player2Die',teleperforman:'player3Die',gymbro:'player4Die',magolita:'player5Die'};

// Death sound per enemy (enemy_N.png → key in src/data/enemies.js). Others alternate hurt/hurt2.
export const DEATH_SOUNDS={palomera:'femaleGrunt',walker:'maleGrunt',belly:'maleGrunt2',leash:'femaleGrunt',guard:'maleGrunt4',sweeper:'maleGrunt3'};
/** Punches and kicks: impact sound when they connect, a whoosh when they miss. */
export const strikeSound=(type,connected)=>!connected?'wave':type==='punch'?'punch':'kick';

export function preloadEffects(scene) {
  for(const [name,file] of Object.entries(EFFECT_FILES))if(!scene.cache.audio.exists(`sfx-${name}`))scene.load.audio(`sfx-${name}`,`${import.meta.env?.BASE_URL??'/'}assets/sounds/${file}`);
}

// Each owner cleans up its own effects without interrupting the level music.
export class SoundEffects {
  constructor(manager,cache) {
    this.manager=manager;this.cache=cache;this.active=new Set();this.paused=false;this.destroyed=false;
    this.onUnlock=()=>{const name=this.pending;this.pending=null;if(name)this.play(name);};
    manager.on('unlocked',this.onUnlock);
  }
  play(name,{waitForUnlock=false}={}) {
    const key=`sfx-${name}`;
    if(this.destroyed || this.paused || !EFFECT_FILES[name] || !this.cache.exists(key))return false;
    if(this.manager.locked){if(waitForUnlock)this.pending=name;return false;}
    const limit=['moto','running','screeching','lose'].includes(name)?1:3;
    if([...this.active].filter(sound=>sound.key===key).length>=limit)return false;
    const sound=this.manager.add(key,{volume:name==='button'?.45:.65,loop:false});
    this.active.add(sound);
    sound.once('complete',()=>{this.active.delete(sound);sound.destroy();});
    if(!sound.play()){this.active.delete(sound);sound.destroy();return false;}
    return true;
  }
  setPaused(paused) {
    this.paused=paused;
    for(const sound of this.active)if(paused){if(sound.isPlaying)sound.pause();}else if(sound.isPaused)sound.resume();
  }
  stop() {
    this.pending=null;
    for(const sound of this.active){sound.stop();sound.destroy();}
    this.active.clear();
  }
  destroy(){this.destroyed=true;this.stop();this.manager.off('unlocked',this.onUnlock);}
}

export function enemyDeathSound(scene,enemy=null) {
  const own=DEATH_SOUNDS[enemy?.key];
  if(own){scene.sfx?.play(own);return;}
  const index=scene.game.enemyDeathSoundIndex??0;
  scene.game.enemyDeathSoundIndex=index+1;
  scene.sfx?.play(index%2?'hurt2':'hurt');
}
